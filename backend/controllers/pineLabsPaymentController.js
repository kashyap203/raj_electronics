import Order from '../models/Order.js';
import PaymentTransaction from '../models/PaymentTransaction.js';
import { getActivePaymentGateway } from '../services/payment/paymentGatewayFactory.js';
import { processPaymentVerification } from '../services/payment/paymentVerificationService.js';
import { calculateCheckoutTotals } from '../services/checkoutCalculationService.js';
import { getEligibleBankOffers, calculateBankDiscount } from '../services/bankOfferEngine.js';
import { getPineLabsConfig, resolvePineLabsCallbackUrl } from '../config/pineLabsConfig.js';
import { PaymentErrors, PaymentStatus } from '../constants/paymentErrors.js';
import Cart from '../models/Cart.js';

const isPineLabsPayment = (paymentMethod) =>
  String(paymentMethod || '').toLowerCase().includes('pine labs');

/**
 * @route POST /api/payment/pinelabs/initiate
 * @desc  Create Pine Labs hosted checkout for a pending order
 */
export const initiatePineLabsPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required', code: PaymentErrors.PAYMENT_INITIATION_FAILED });
    }

    const order = await Order.findById(orderId).populate('user', 'name email phone');
    if (!order) {
      return res.status(404).json({ message: 'Order not found', code: PaymentErrors.TRANSACTION_NOT_FOUND });
    }

    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (order.isPaid || order.paymentDetails?.paymentStatus === 'Success') {
      return res.status(400).json({ message: 'Order is already paid', code: PaymentErrors.DUPLICATE_PAYMENT });
    }

    const gateway = getActivePaymentGateway();
    const merchantTxnNo = `PL${order._id.toString().slice(-8).toUpperCase()}${Date.now().toString().slice(-6)}`;

    const nameParts = (order.user.name || 'Customer').split(' ');
    const customer = {
      id: order.user._id,
      email: order.user.email,
      phone: order.address?.phone || order.user.phone,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' ') || '',
    };

    const cartItems = order.products.map((p, idx) => ({
      id: `item_${idx + 1}`,
      name: p.name,
      unitPrice: Math.round(p.price - (p.price * p.discount) / 100),
      quantity: p.quantity,
    }));

    const paymentResult = await gateway.createPayment({
      merchantOrderReference: merchantTxnNo,
      amountRupees: order.total,
      customer,
      address: {
        fullName: order.user.name,
        street: order.address.street,
        city: order.address.city,
        state: order.address.state,
        pincode: order.address.pincode,
        phone: order.address.phone,
      },
      cartItems,
      notes: `Raj Electronics Order ${order._id}`,
    });

    await PaymentTransaction.create({
      orderId: order._id,
      merchantTxnNo,
      gateway: 'PINE_LABS',
      gatewayTransactionId: paymentResult.pineLabsOrderId,
      merchantId: getPineLabsConfig().mid,
      amount: order.total,
      currency: 'INR',
      paymentStatus: PaymentStatus.INITIATED,
      paymentMode: 'HOSTED_CHECKOUT',
    });

    order.paymentMethod = 'Pine Labs Online';
    order.paymentDetails = {
      ...order.paymentDetails,
      gateway: 'PINE_LABS',
      merchantTxnNo,
      pineLabsOrderId: paymentResult.pineLabsOrderId,
      paymentStatus: 'PENDING_PAYMENT',
    };
    await order.save();

    res.json({
      success: true,
      redirectUrl: paymentResult.redirectUrl,
      pineLabsOrderId: paymentResult.pineLabsOrderId,
      merchantTxnNo,
      orderId: order._id,
      localDevNote: !resolvePineLabsCallbackUrl()
        ? 'Local dev: callback URL omitted (Pine Labs blocks localhost). After payment, open My Orders and click Verify Payment Status.'
        : null,
    });
  } catch (error) {
    console.error('[PineLabs] Initiate error:', error.message);
    const isConfigError = error.message?.includes('configuration incomplete');
    res.status(isConfigError ? 503 : 500).json({
      message: isConfigError
        ? 'Pine Labs credentials not configured. Set PINE_LABS_CLIENT_SECRET in backend/.env'
        : (error.message || 'Failed to initiate Pine Labs payment'),
      code: PaymentErrors.PAYMENT_INITIATION_FAILED,
    });
  }
};

/**
 * @route GET|POST /api/payment/pinelabs/return
 * @desc  Handle Pine Labs return/callback URL
 */
export const handlePineLabsReturn = async (req, res) => {
  try {
    const params = { ...req.query, ...req.body };
    const { order_id: pineLabsOrderId, status, signature } = params;

    const config = getPineLabsConfig();
    const gateway = getActivePaymentGateway();

    const signatureValid = gateway.verifyCallbackSignature({
      order_id: pineLabsOrderId,
      status,
      payment_status: status,
      signature,
    });

    const transaction = await PaymentTransaction.findOne({
      $or: [
        { gatewayTransactionId: pineLabsOrderId },
        { merchantTxnNo: params.merchant_order_reference },
      ],
    });

    if (!transaction) {
      return redirectToFrontend(res, config, 'failed', { error: PaymentErrors.TRANSACTION_NOT_FOUND });
    }

    transaction.hashVerified = signatureValid;
    if (!signatureValid) {
      transaction.paymentStatus = PaymentStatus.FAILED;
      transaction.gatewayResponseDescription = PaymentErrors.INVALID_PAYMENT_SIGNATURE;
      await transaction.save();
      return redirectToFrontend(res, config, 'failed', {
        orderId: transaction.orderId,
        error: PaymentErrors.INVALID_PAYMENT_SIGNATURE,
      });
    }

    const result = await processPaymentVerification({
      orderId: transaction.orderId,
      pineLabsOrderId,
      callbackStatus: status,
      gatewayResponse: params,
      source: 'return',
    });

    if (result.success) {
      return redirectToFrontend(res, config, 'success', { orderId: transaction.orderId });
    }
    if (result.pending) {
      return redirectToFrontend(res, config, 'pending', { orderId: transaction.orderId });
    }
    return redirectToFrontend(res, config, 'failed', {
      orderId: transaction.orderId,
      error: result.error,
    });
  } catch (error) {
    console.error('[PineLabs] Return handler error:', error.message);
    const config = getPineLabsConfig();
    return redirectToFrontend(res, config, 'failed', { error: PaymentErrors.PAYMENT_VERIFICATION_FAILED });
  }
};

/**
 * @route POST /api/payment/pinelabs/webhook
 * @desc  Handle Pine Labs webhook events (idempotent)
 */
export const handlePineLabsWebhook = async (req, res) => {
  try {
    const payload = req.body;
    const eventType = payload.event || payload.event_type || payload.type;
    const pineLabsOrderId =
      payload.order_id ||
      payload.data?.order_id ||
      payload.order?.order_id;

    const status =
      payload.status ||
      payload.data?.status ||
      payload.payment_status;

    const gateway = getActivePaymentGateway();

    if (payload.signature || payload.data?.signature) {
      const sig = payload.signature || payload.data?.signature;
      const valid = gateway.verifyCallbackSignature({
        order_id: pineLabsOrderId,
        status,
        payment_status: status,
        signature: sig,
      });
      if (!valid) {
        return res.status(400).json({ success: false, code: PaymentErrors.INVALID_PAYMENT_SIGNATURE });
      }
    }

    const transaction = await PaymentTransaction.findOne({
      $or: [
        { gatewayTransactionId: pineLabsOrderId },
        { merchantTxnNo: payload.merchant_order_reference || payload.data?.merchant_order_reference },
      ],
    });

    if (!transaction) {
      return res.status(404).json({ success: false, code: PaymentErrors.TRANSACTION_NOT_FOUND });
    }

    const result = await processPaymentVerification({
      orderId: transaction.orderId,
      pineLabsOrderId,
      callbackStatus: status,
      gatewayResponse: payload,
      source: 'webhook',
    });

    return res.status(200).json({
      success: true,
      event: eventType,
      alreadyProcessed: result.alreadyProcessed || false,
      status: result.status || (result.success ? 'SUCCESS' : 'FAILED'),
    });
  } catch (error) {
    console.error('[PineLabs] Webhook error:', error.message);
    return res.status(500).json({
      success: false,
      code: PaymentErrors.WEBHOOK_PROCESSING_FAILED,
    });
  }
};

/**
 * @route POST /api/payment/pinelabs/status
 * @desc  Server-side payment status check
 */
export const checkPineLabsPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const transaction = await PaymentTransaction.findOne({ orderId: order._id }).sort({ createdAt: -1 });
    if (!transaction) {
      return res.status(404).json({ message: 'Payment transaction not found' });
    }

    const result = await processPaymentVerification({
      orderId: order._id,
      pineLabsOrderId: transaction.gatewayTransactionId,
      callbackStatus: null,
      source: 'status_check',
    });

    res.json({
      success: result.success,
      pending: result.pending,
      order: result.order,
      transaction: result.transaction,
      status: result.transaction?.paymentStatus,
    });
  } catch (error) {
    console.error('[PineLabs] Status check error:', error.message);
    res.status(500).json({ message: 'Failed to check payment status' });
  }
};

/**
 * @route POST /api/payment/pinelabs/refund
 * @desc  Admin refund via Pine Labs
 */
export const refundPineLabsPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const transaction = await PaymentTransaction.findOne({
      orderId: order._id,
      paymentStatus: PaymentStatus.SUCCESS,
    });

    if (!transaction?.gatewayTransactionId) {
      return res.status(400).json({ message: 'No successful payment found for refund' });
    }

    const gateway = getActivePaymentGateway();
    const refundAmount = amount || order.total;
    const refundResult = await gateway.refundPayment(
      transaction.gatewayTransactionId,
      refundAmount,
      `REF-${order._id}-${Date.now()}`
    );

    order.paymentDetails.paymentStatus = 'REFUNDED';
    await order.save();

    res.json({ success: true, refund: refundResult });
  } catch (error) {
    console.error('[PineLabs] Refund error:', error.message);
    res.status(500).json({ message: 'Refund failed' });
  }
};

/**
 * @route POST /api/payment/pinelabs/preview
 * @desc  Preview checkout totals (server-side authoritative calculation)
 */
export const previewCheckoutTotals = async (req, res) => {
  try {
    const { couponCode, address } = req.body;

    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product')
      .populate('items.appliedOffer')
      .populate({ path: 'items.appliedBankDiscount', populate: { path: 'bank' } });

    if (!cart?.items?.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const totals = await calculateCheckoutTotals({
      cartItems: cart.items,
      couponCode,
      userId: req.user._id,
      address,
      isOnlinePayment: true,
    });

    const eligibleOffers = await getEligibleBankOffers({
      cartItems: cart.items,
      orderAmount: totals.subtotal,
    });

    res.json({ ...totals, eligibleOffers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @route GET /api/payment/pinelabs/bank-offers
 * @desc  Get eligible bank offers for current cart
 */
export const getBankOffersForCart = async (req, res) => {
  try {
    const { bank } = req.query;
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product')
      .populate('items.appliedOffer')
      .populate({ path: 'items.appliedBankDiscount', populate: { path: 'bank' } });

    if (!cart?.items?.length) {
      return res.json({ offers: [], bankDiscount: 0 });
    }

    const { bankDiscount, breakdown } = await calculateBankDiscount({
      cartItems: cart.items,
      isOnlinePayment: true,
    });

    const offers = await getEligibleBankOffers({
      cartItems: cart.items,
      orderAmount: cart.items.reduce((acc, item) => {
        const p = item.product;
        if (!p) return acc;
        const price = Math.round(p.price - (p.price * p.discount) / 100);
        return acc + price * item.quantity;
      }, 0),
      bank,
    });

    res.json({ offers, bankDiscount, breakdown });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const redirectToFrontend = (res, config, status, { orderId, error } = {}) => {
  const base = config.frontendUrl.replace(/\/$/, '');
  const params = new URLSearchParams({ payment: status });
  if (orderId) params.set('orderId', orderId);
  if (error) params.set('error', error);
  return res.redirect(`${base}/payment/result?${params.toString()}`);
};

export { isPineLabsPayment };
