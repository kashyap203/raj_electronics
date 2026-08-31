import { getPineLabsConfig, validatePineLabsConfig, resolvePineLabsCallbackUrl } from '../../config/pineLabsConfig.js';
import { generateRequestId, generateRequestTimestamp } from './PaymentGateway.js';
import { rupeesToPaise } from '../../utils/moneyUtils.js';
import { verifyPineLabsSignature } from '../../utils/pineLabsSignature.js';

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Pine Labs Online payment gateway (Hosted Checkout).
 * API docs: https://www.pinelabs.com/docs/online-payments/hosted-checkout/integration-steps
 */
export class PineLabsGateway {
  get name() {
    return 'PINE_LABS';
  }

  async getAccessToken() {
    const { valid, missing } = validatePineLabsConfig();
    if (!valid) {
      throw new Error(`Pine Labs configuration incomplete: ${missing.join(', ')}`);
    }

    if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
      return cachedToken;
    }

    const config = getPineLabsConfig();
    const response = await fetch(`${config.baseUrl}/api/auth/v1/token`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'Request-ID': generateRequestId(),
        'Request-Timestamp': generateRequestTimestamp(),
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Pine Labs token request failed: ${response.status} ${errorBody}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
    return cachedToken;
  }

  async _apiRequest(method, path, body = null) {
    const config = getPineLabsConfig();
    const token = await this.getAccessToken();

    const options = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        accept: 'application/json',
        'Request-ID': generateRequestId(),
        'Request-Timestamp': generateRequestTimestamp(),
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${config.baseUrl}${path}`, options);
    const responseText = await response.text();

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { raw: responseText };
    }

    if (!response.ok) {
      const isCloudFrontBlock = response.status === 403 && String(responseText).includes('CloudFront');
      const err = new Error(
        isCloudFrontBlock
          ? 'Pine Labs blocked the request. Use a public HTTPS callback URL (ngrok) — set PINE_LABS_PUBLIC_URL in .env'
          : (data.message || data.error_message || `Pine Labs API error: ${response.status}`)
      );
      err.statusCode = response.status;
      err.responseData = data;
      throw err;
    }

    return data;
  }

  /**
   * Generate hosted checkout link (redirect flow).
   */
  async createPayment({ merchantOrderReference, amountRupees, customer, address, cartItems, notes }) {
    const config = getPineLabsConfig();
    const amountPaise = rupeesToPaise(amountRupees);

    const callbackUrl = resolvePineLabsCallbackUrl();

    const payload = {
      merchant_order_reference: String(merchantOrderReference),
      order_amount: {
        value: amountPaise,
        currency: 'INR',
      },
      integration_mode: 'REDIRECT',
      pre_auth: false,
      allowed_payment_methods: ['CARD', 'UPI', 'NETBANKING', 'WALLET'],
      notes: notes || `Raj Electronics Order ${merchantOrderReference}`,
      purchase_details: {
        customer: {
          email_id: customer.email || 'customer@rajelectronics.com',
          first_name: customer.firstName || 'Customer',
          last_name: customer.lastName || '',
          customer_id: String(customer.id),
          mobile_number: String(customer.phone || '9999999999').replace(/\D/g, '').slice(-10),
          country_code: '91',
          billing_address: this._formatAddress(address, 'billing'),
          shipping_address: this._formatAddress(address, 'shipping'),
        },
      },
    };

    if (callbackUrl) {
      payload.callback_url = callbackUrl;
      payload.failure_callback_url = callbackUrl;
    } else {
      console.warn(
        '[PineLabs] Localhost callback URL omitted (WAF blocks localhost). ' +
        'Set PINE_LABS_PUBLIC_URL to your ngrok HTTPS URL for return redirect after payment.'
      );
    }

    if (cartItems?.length) {
      payload.purchase_details.cart_details = {
        cart_items: cartItems.map((item, idx) => ({
          item_id: item.id || `item_${idx + 1}`,
          item_name: item.name,
          item_description: item.description || item.name,
          item_original_unit_price: rupeesToPaise(item.unitPrice),
          item_discounted_unit_price: rupeesToPaise(item.unitPrice),
          item_quantity: item.quantity,
          item_currency: 'INR',
        })),
      };
    }

    const data = await this._apiRequest('POST', '/api/checkout/v1/orders', payload);

    return {
      pineLabsOrderId: data.order_id || data.data?.order_id,
      redirectUrl: data.redirect_url || data.data?.redirect_url,
      merchantOrderReference,
      amountPaise,
      rawResponse: data,
    };
  }

  _formatAddress(address, category) {
    const fullName = address.fullName || address.name || 'Customer';
    return {
      address1: address.street || address.address1 || '',
      address2: address.address2 || '',
      address3: '',
      pincode: String(address.pincode || ''),
      city: address.city || '',
      state: address.state || '',
      country: 'INDIA',
      full_name: fullName,
      adddress_type: 'Home',
      address_category: category,
    };
  }

  async getPaymentStatus(pineLabsOrderId) {
    return this._apiRequest('GET', `/api/pay/v1/orders/${pineLabsOrderId}`);
  }

  async getPaymentStatusByReference(merchantOrderReference) {
    return this._apiRequest(
      'GET',
      `/api/pay/v1/orders/reference/${encodeURIComponent(merchantOrderReference)}`
    );
  }

  verifyCallbackSignature(callbackParams) {
    const config = getPineLabsConfig();
    if (!config.signatureKey) {
      console.warn('[PineLabs] PINE_LABS_SIGNATURE_KEY not configured — skipping signature verification');
      return true;
    }

    const { signature, ...params } = callbackParams;
    const signParams = { ...params };

    if (signParams.status && !signParams.payment_status) {
      signParams.payment_status = signParams.status;
    }

    return verifyPineLabsSignature(signParams, signature, config.signatureKey);
  }

  mapPineLabsStatus(status) {
    const normalized = String(status || '').toUpperCase();

    if (['PROCESSED', 'SUCCESS', 'CAPTURED', 'PAID'].includes(normalized)) {
      return 'SUCCESS';
    }
    if (['AUTHORIZED', 'PENDING', 'IN_PROGRESS', 'PROCESSING'].includes(normalized)) {
      return 'PENDING';
    }
    if (['FAILED', 'FAILURE', 'DECLINED', 'CANCELLED', 'CANCELED', 'ERROR'].includes(normalized)) {
      return 'FAILED';
    }
    if (['TIMEOUT', 'EXPIRED'].includes(normalized)) {
      return 'TIMEOUT';
    }
    return 'PENDING';
  }

  async refundPayment(pineLabsOrderId, amountRupees, merchantRefundReference) {
    const payload = {
      merchant_refund_reference: merchantRefundReference || `REF-${Date.now()}`,
      refund_amount: {
        value: rupeesToPaise(amountRupees),
        currency: 'INR',
      },
    };

    return this._apiRequest('POST', `/api/pay/v1/refunds/${pineLabsOrderId}`, payload);
  }
}

export default PineLabsGateway;
