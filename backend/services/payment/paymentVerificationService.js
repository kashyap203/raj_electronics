import Order from '../../models/Order.js';
import PaymentTransaction from '../../models/PaymentTransaction.js';
import ProductSerialNumber from '../../models/ProductSerialNumber.js';
import Coupon from '../../models/Coupon.js';
import { sendOrderStatusNotification } from '../../utils/notificationService.js';
import { PaymentStatus } from '../../constants/paymentErrors.js';
import { getActivePaymentGateway } from './paymentGatewayFactory.js';
import { roundMoney } from '../../utils/moneyUtils.js';

/**
 * Idempotent payment verification and order confirmation.
 * Backend is the source of truth — never confirm from frontend alone.
 */
export const processPaymentVerification = async ({
  orderId,
  pineLabsOrderId,
  callbackStatus,
  gatewayResponse = {},
  source = 'callback',
}) => {
  const order = await Order.findById(orderId).populate('user', 'name email phone');
  if (!order) {
    return { success: false, error: 'TRANSACTION_NOT_FOUND', message: 'Order not found' };
  }

  const transaction = await PaymentTransaction.findOne({
    $or: [
      { orderId: order._id },
      { merchantTxnNo: order.paymentDetails?.merchantTxnNo },
      { gatewayTransactionId: pineLabsOrderId },
    ],
  }).sort({ createdAt: -1 });

  if (!transaction) {
    return { success: false, error: 'TRANSACTION_NOT_FOUND', message: 'Payment transaction not found' };
  }

  if (transaction.paymentStatus === PaymentStatus.SUCCESS && order.isPaid) {
    return {
      success: true,
      alreadyProcessed: true,
      order,
      transaction,
      message: 'Payment already verified',
    };
  }

  const gateway = getActivePaymentGateway();
  let verifiedStatus = gateway.mapPineLabsStatus(callbackStatus);
  let serverOrderData = null;

  try {
    if (pineLabsOrderId) {
      serverOrderData = await gateway.getPaymentStatus(pineLabsOrderId);
      const serverStatus =
        serverOrderData?.status ||
        serverOrderData?.order_status ||
        serverOrderData?.data?.status;
      if (serverStatus) {
        verifiedStatus = gateway.mapPineLabsStatus(serverStatus);
      }
    } else if (transaction.gatewayTransactionId) {
      serverOrderData = await gateway.getPaymentStatus(transaction.gatewayTransactionId);
      const serverStatus =
        serverOrderData?.status ||
        serverOrderData?.order_status ||
        serverOrderData?.data?.status;
      if (serverStatus) {
        verifiedStatus = gateway.mapPineLabsStatus(serverStatus);
      }
    }
  } catch (err) {
    console.error('[PaymentVerification] Server status check failed:', err.message);
    if (!callbackStatus) {
      return {
        success: false,
        error: 'PAYMENT_VERIFICATION_FAILED',
        message: 'Could not verify payment status with Pine Labs',
      };
    }
  }

  const paidAmountPaise =
    serverOrderData?.order_amount?.value ||
    serverOrderData?.data?.order_amount?.value ||
    gatewayResponse?.amount;

  if (paidAmountPaise && transaction.amount) {
    const expectedPaise = Math.round(transaction.amount * 100);
    const receivedPaise = Math.round(Number(paidAmountPaise));
    if (Math.abs(expectedPaise - receivedPaise) > 1) {
      transaction.paymentStatus = PaymentStatus.FAILED;
      transaction.gatewayResponseDescription = 'PAYMENT_AMOUNT_MISMATCH';
      await transaction.save();

      order.paymentDetails = {
        ...order.paymentDetails,
        paymentStatus: 'PAYMENT_FAILED',
        failureReason: 'Payment amount mismatch',
      };
      await order.save();

      return {
        success: false,
        error: 'PAYMENT_AMOUNT_MISMATCH',
        message: 'Payment amount does not match order total',
        order,
        transaction,
      };
    }
  }

  transaction.gatewayTransactionId = pineLabsOrderId || transaction.gatewayTransactionId;
  transaction.gatewayRawResponseRedacted = sanitizeGatewayResponse(serverOrderData || gatewayResponse);
  transaction.updatedAt = new Date();

  if (verifiedStatus === PaymentStatus.SUCCESS) {
    return await confirmOrderPayment(order, transaction, serverOrderData || gatewayResponse);
  }

  if (verifiedStatus === PaymentStatus.FAILED) {
    transaction.paymentStatus = PaymentStatus.FAILED;
    transaction.verifiedAt = new Date();
    await transaction.save();

    order.paymentDetails = {
      ...order.paymentDetails,
      paymentStatus: 'PAYMENT_FAILED',
      failureReason: gatewayResponse?.error_message || 'Payment failed',
    };
    await order.save();

    await releaseReservedInventory(order._id);

    return {
      success: false,
      error: 'PAYMENT_FAILED',
      order,
      transaction,
      status: verifiedStatus,
    };
  }

  transaction.paymentStatus = PaymentStatus.PENDING;
  await transaction.save();

  order.paymentDetails = {
    ...order.paymentDetails,
    paymentStatus: 'PAYMENT_PROCESSING',
  };
  await order.save();

  return {
    success: false,
    pending: true,
    error: 'PAYMENT_PENDING',
    order,
    transaction,
    status: verifiedStatus,
  };
};

const confirmOrderPayment = async (order, transaction, gatewayData) => {
  if (order.isPaid && transaction.paymentStatus === PaymentStatus.SUCCESS) {
    return {
      success: true,
      alreadyProcessed: true,
      order,
      transaction,
    };
  }

  transaction.paymentStatus = PaymentStatus.SUCCESS;
  transaction.verifiedAt = new Date();
  transaction.gatewayPaymentDateTime = new Date();
  await transaction.save();

  order.isPaid = true;
  order.paidAt = new Date();
  order.status = 'Confirmed';
  order.paymentDetails = {
    ...order.paymentDetails,
    gateway: 'PINE_LABS',
    paymentStatus: 'Success',
    transactionId: transaction.gatewayTransactionId,
    paymentDateTime: new Date(),
    failureReason: null,
  };
  await order.save();

  await ProductSerialNumber.updateMany(
    { order: order._id },
    { $set: { status: 'Sold', reservedUntil: null } }
  );

  if (order.couponCode && order.couponCode !== 'DISCOUNT10') {
    await Coupon.findOneAndUpdate({ code: order.couponCode }, { $inc: { usageCount: 1 } });
  }

  sendOrderStatusNotification(order, 'Confirmed');

  return {
    success: true,
    order,
    transaction,
    gatewayData,
  };
};

const releaseReservedInventory = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) return;

  for (const item of order.products) {
    const Product = (await import('../../models/Product.js')).default;
    const product = await Product.findById(item.product);
    if (product) {
      product.stock += item.quantity;
      product.salesCount = Math.max(0, product.salesCount - item.quantity);
      await product.save();
    }
  }

  await ProductSerialNumber.updateMany(
    { order: orderId, status: 'Reserved' },
    { $set: { status: 'Available', reservedUntil: null }, $unset: { order: 1 } }
  );
};

const sanitizeGatewayResponse = (data) => {
  if (!data || typeof data !== 'object') return {};
  const safe = { ...data };
  delete safe.client_secret;
  delete safe.secret_key;
  if (safe.payments) {
    safe.payments = safe.payments.map((p) => {
      const copy = { ...p };
      delete copy.cvv;
      delete copy.card_number;
      return copy;
    });
  }
  return safe;
};

export { releaseReservedInventory, confirmOrderPayment };
