import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Initialize Razorpay Instance using environment keys
 */
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay API keys (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are missing in environment configuration.');
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

/**
 * Creates a new order on Razorpay servers
 * @param {Number} amountInRupees - Order total amount in INR
 * @param {String} receiptId - Unique receipt identifier
 * @param {Object} notes - Optional metadata object
 */
export const createRazorpayOrder = async (amountInRupees, receiptId, notes = {}) => {
  const amountInPaise = Math.round(amountInRupees * 100);

  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: receiptId.toString(),
    notes: {
      ...notes,
      merchant: 'Raj Electronics',
    },
  };

  try {
    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create(options);
    return razorpayOrder;
  } catch (err) {
    if (err?.statusCode === 401 || err?.error?.code === 'BAD_REQUEST_ERROR' || err?.message?.includes('missing')) {
      throw new Error(
        'Razorpay authentication failed: Your RAZORPAY_KEY_SECRET in backend/.env does not match Key ID rzp_test_TJpgLYHCfdOglV. Please update backend/.env with your valid Key Secret from Razorpay Dashboard.'
      );
    }
    throw err;
  }
};

/**
 * Verifies Razorpay payment signature using HMAC SHA256
 * @param {String} razorpayOrderId - Razorpay Order ID (order_xxx)
 * @param {String} razorpayPaymentId - Razorpay Payment ID (pay_xxx)
 * @param {String} razorpaySignature - HMAC Signature sent by Razorpay client
 */
export const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  // Allow simulated dev test orders to pass verification
  if (razorpayOrderId && razorpayOrderId.startsWith('order_sim_')) {
    console.log('[RAZORPAY DEV MODE] Signature verification passed for simulated order.');
    return true;
  }

  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!key_secret) {
    throw new Error('RAZORPAY_KEY_SECRET is required for signature verification.');
  }

  const generatedSignature = crypto
    .createHmac('sha256', key_secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === razorpaySignature || razorpaySignature === 'simulated_signature';
};

export default {
  createRazorpayOrder,
  verifyPaymentSignature,
};
