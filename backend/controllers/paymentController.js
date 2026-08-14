import Order from '../models/Order.js';
import ProductSerialNumber from '../models/ProductSerialNumber.js';
import { createRazorpayOrder, verifyPaymentSignature } from '../services/paymentService.js';
import { sendOrderStatusNotification } from '../utils/notificationService.js';

/**
 * @desc    Create a Razorpay order for an existing pending order
 * @route   POST /api/payment/create-order
 * @access  Private
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this order' });
    }

    // Call Payment Service to create Razorpay Order
    const razorpayOrder = await createRazorpayOrder(order.total, order._id, {
      orderId: order._id.toString(),
      userEmail: req.user.email,
    });

    // Save Razorpay order ID in MongoDB
    order.paymentMethod = 'Online Payment (Razorpay)';
    order.paymentDetails = {
      ...order.paymentDetails,
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: 'Pending',
    };
    await order.save();

    res.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount, // in paise
      currency: razorpayOrder.currency,
      orderId: order._id,
    });
  } catch (error) {
    console.error('Error in createPaymentOrder:', error);
    res.status(500).json({ message: error.message || 'Failed to create Razorpay payment order' });
  }
};

/**
 * @desc    Verify Razorpay payment signature & update order status
 * @route   POST /api/payment/verify-payment
 * @access  Private
 */
export const verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: 'Missing required payment verification details' });
    }

    const order = await Order.findById(orderId).populate('user', 'name email phone');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify HMAC SHA256 Signature using Payment Service
    const isValidSignature = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValidSignature) {
      order.paymentDetails = {
        ...order.paymentDetails,
        paymentStatus: 'Failed',
        failureReason: 'HMAC signature verification failed',
      };
      await order.save();

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Signature mismatch.',
      });
    }

    // Signature valid -> Mark order as paid & confirmed
    order.isPaid = true;
    order.paidAt = Date.now();
    order.status = 'Confirmed';
    order.paymentDetails = {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentStatus: 'Success',
      failureReason: null,
    };

    await order.save();

    // Mark serial numbers as Sold
    await ProductSerialNumber.updateMany(
      { order: order._id },
      { $set: { status: 'Sold', reservedUntil: null } }
    );

    // Trigger Order Confirmation Notification
    sendOrderStatusNotification(order, 'Confirmed');

    res.json({
      success: true,
      message: 'Payment verified and order confirmed successfully!',
      order,
    });
  } catch (error) {
    console.error('Error in verifyPayment:', error);
    res.status(500).json({ message: error.message || 'Error verifying payment signature' });
  }
};

/**
 * @desc    Handle Razorpay payment failure or user cancellation
 * @route   POST /api/payment/payment-failed
 * @access  Private
 */
export const handlePaymentFailure = async (req, res) => {
  try {
    const { orderId, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.paymentDetails = {
      ...order.paymentDetails,
      paymentStatus: 'Failed',
      failureReason: reason || 'Payment was cancelled or failed at checkout',
    };
    await order.save();

    // Release reserved serial numbers
    await ProductSerialNumber.updateMany(
      { order: order._id, status: 'Reserved' },
      { $set: { status: 'Available', reservedUntil: null, order: null } }
    );

    res.json({
      success: false,
      message: 'Payment failure recorded',
      order,
    });
  } catch (error) {
    console.error('Error in handlePaymentFailure:', error);
    res.status(500).json({ message: error.message || 'Error recording payment failure' });
  }
};
