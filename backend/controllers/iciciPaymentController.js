import axios from 'axios';
import Order from '../models/Order.js';
import { generateICICIHash, verifyICICIHash } from '../utils/iciciHash.js';
import { sendOrderStatusNotification } from '../utils/notificationService.js';

// Phase 4: INITIATE SALE
export const initiateICICIPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('user', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (order.status === 'Cancelled' || order.isPaid) {
      return res.status(400).json({ message: 'Order cannot be paid' });
    }

    const merchantTxnNo = `RE${order._id.toString().slice(-8).toUpperCase()}${Date.now().toString().slice(-4)}`;
    
    const amountStr = Number(order.total).toFixed(2);

    const hashPayload = {
      merchantId: process.env.ICICI_MERCHANT_ID,
      aggregatorID: 'A100000000007164', // Mandatory
      merchantTxnNo,
      amount: amountStr,
      currencyCode: '356', // INR
      payType: '0', // Standard/Redirect method
      customerEmailID: order.user.email || 'guest@icicibank.com',
      transactionType: 'SALE',
      returnURL: `http://localhost:${process.env.PORT || 5001}/api/payment/icici/response`,
      txnDate: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14), // YYYYMMDDHHMISS
      customerMobileNo: order.user.phone || '9999999999',
      customerName: order.user.name || 'Customer'
    };

    const secureHash = generateICICIHash(hashPayload, process.env.ICICI_HASH_KEY);

    const requestPayload = {
      ...hashPayload,
      secureHash
    };

    // Save gateway info locally as Pending
    order.paymentMethod = 'Online Payment (ICICI)';
    order.paymentDetails = {
      ...order.paymentDetails,
      gateway: 'ICICI_ORANGE_PG',
      merchantTxnNo,
      paymentStatus: 'PENDING',
    };
    await order.save();

    // Call ICICI Initiate Sale API
    const response = await axios.post(process.env.ICICI_SALE_URL, requestPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });

    const iciciResponse = response.data;
    console.log("ICICI RESPONSE CODE:", iciciResponse.responseCode);
    console.log("ICICI RESPONSE DESCRIPTION:", iciciResponse.responseDescription || iciciResponse.respDescription);

    if (iciciResponse.responseCode === 'R1000' || iciciResponse.responseCode === '0000') {
      const redirectURL = iciciResponse.tranCtx 
        ? `${iciciResponse.redirectURI}?tranCtx=${iciciResponse.tranCtx}` 
        : iciciResponse.redirectURI;
        
      res.json({
        success: true,
        redirectURI: redirectURL,
        merchantTxnNo,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'ICICI payment initiation failed',
        code: 'ICICI_HASH_ERROR'
      });
    }
  } catch (error) {
    console.error('Error in initiateICICIPayment:', error.response?.data || error.message);
    res.status(502).json({ 
      success: false,
      message: 'ICICI payment initiation failed',
      code: 'ICICI_GATEWAY_ERROR'
    });
  }
};

// Helper for handling the ICICI Response logic
const processICICIResponse = async (data) => {
  const { merchantTxnNo, responseCode, txnID, txnAuthID, paymentDateTime, paymentMode, respDescription } = data;
  
  if (!merchantTxnNo) throw new Error('Missing merchantTxnNo in response');

  const order = await Order.findOne({ 'paymentDetails.merchantTxnNo': merchantTxnNo }).populate('user', 'name email phone');
  if (!order) throw new Error('Order not found for given merchantTxnNo');

  // Verify hash
  const isValid = verifyICICIHash(data, data.secureHash, process.env.ICICI_HASH_KEY);
  if (!isValid) {
    throw new Error('Hash verification failed');
  }

  // Check idempotency (prevent processing twice)
  if (order.isPaid || order.paymentDetails.paymentStatus === 'PAID') {
    return { order, alreadyPaid: true };
  }

  if (responseCode === '000' || responseCode === '0000') {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.status = 'Confirmed';
    order.paymentDetails.paymentStatus = 'PAID';
    order.paymentDetails.transactionId = txnID;
    order.paymentDetails.transactionAuthId = txnAuthID;
    order.paymentDetails.paymentDateTime = paymentDateTime ? new Date() : null;
    order.paymentDetails.paymentMode = paymentMode;
    order.paymentDetails.responseCode = responseCode;
    order.paymentDetails.responseDescription = respDescription;
    
    await order.save();
    
    // Notify
    try {
      sendOrderStatusNotification(order, 'Confirmed');
    } catch (e) {
      console.error('Notification error:', e);
    }
  } else {
    order.paymentDetails.paymentStatus = 'FAILED';
    order.paymentDetails.responseCode = responseCode;
    order.paymentDetails.failureReason = respDescription;
    await order.save();
  }

  return { order, alreadyPaid: false };
};

// Phase 5: PAYMENT RESPONSE CALLBACK
// Expected to be called via POST redirect from ICICI
export const handleICICIResponse = async (req, res) => {
  try {
    const data = req.body;
    const { order } = await processICICIResponse(data);
    
    // Redirect to frontend result page
    res.redirect(`${process.env.FRONTEND_URL}/profile/orders/${order._id}?icici_payment=${order.paymentDetails.paymentStatus}`);
  } catch (error) {
    console.error('Error in handleICICIResponse:', error);
    res.redirect(`${process.env.FRONTEND_URL}/checkout?error=Payment Verification Failed`);
  }
};

// Phase 7: PAYMENT ADVICE
// Server-to-server webhook
export const handleICICIAdvice = async (req, res) => {
  try {
    const data = req.body;
    await processICICIResponse(data);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error in handleICICIAdvice:', error);
    res.status(500).send('Error');
  }
};

// Phase 6: PAYMENT STATUS
export const checkICICIPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    if (order.paymentDetails.gateway !== 'ICICI_ORANGE_PG' || !order.paymentDetails.merchantTxnNo) {
      return res.status(400).json({ message: 'Not an ICICI payment or missing Txn No' });
    }

    const statusParams = {
      merchantId: process.env.ICICI_MERCHANT_ID,
      aggregatorID: 'A100000000007164',
      merchantTxnNo: order.paymentDetails.merchantTxnNo,
      originalTxnNo: order.paymentDetails.merchantTxnNo,
      transactionType: 'STATUS',
    };

    statusParams.secureHash = generateICICIHash(statusParams, process.env.ICICI_HASH_KEY);

    const response = await axios.post(
      process.env.ICICI_COMMAND_URL,
      new URLSearchParams(statusParams).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000
    });

    const data = response.data;
    
    // Determine status
    if (data.txnStatus === 'SUC' && (data.txnResponseCode === '000' || data.txnResponseCode === '0000')) {
      if (!order.isPaid) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.status = 'Confirmed';
        order.paymentDetails.paymentStatus = 'PAID';
        order.paymentDetails.transactionId = data.txnID;
        order.paymentDetails.transactionAuthId = data.txnAuthID;
        order.paymentDetails.responseCode = data.txnResponseCode;
        order.paymentDetails.responseDescription = data.respDescription;
        await order.save();
      }
    } else if (data.txnStatus === 'REJ' || data.txnStatus === 'ERR') {
      order.paymentDetails.paymentStatus = 'FAILED';
      order.paymentDetails.failureReason = data.respDescription || data.txnRespDescription;
      await order.save();
    }

    res.json({
      success: true,
      paymentStatus: order.paymentDetails.paymentStatus,
      orderStatus: order.status
    });
  } catch (error) {
    console.error('Error in checkICICIPaymentStatus:', error);
    res.status(500).json({ message: 'Failed to check status' });
  }
};

// Phase 12: UPI QR (Implement after redirect is working)
export const generateICICIQR = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('user', 'email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    const merchantRefNo = `QR${order._id.toString().slice(-8).toUpperCase()}${Date.now().toString().slice(-2)}`;
    const amountStr = Number(order.total).toFixed(2);
    
    const params = {
      merchantId: process.env.ICICI_MERCHANT_ID,
      merchantRefNo,
      amount: amountStr,
      currency: '356',
      emailID: order.user.email || 'guest@icicibank.com',
      requestType: 'UPIQR',
    };
    
    params.secureHash = generateICICIHash(params, process.env.ICICI_HASH_KEY);
    
    const response = await axios.post(process.env.ICICI_QR_URL, new URLSearchParams(params).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const data = response.data;
    if (data.respHeader?.returnCode === 200) {
      order.paymentMethod = 'UPI QR (ICICI)';
      order.paymentDetails = {
        ...order.paymentDetails,
        gateway: 'ICICI_ORANGE_PG',
        merchantTxnNo: merchantRefNo,
        paymentStatus: 'PENDING',
      };
      await order.save();
      
      res.json({
        success: true,
        upiQR: data.respBody.upiQR,
        merchantRefNo
      });
    } else {
      res.status(400).json({ message: 'Failed to generate QR' });
    }
  } catch (error) {
    console.error('Error generating QR:', error);
    res.status(500).json({ message: 'Failed to generate QR' });
  }
};

// Phase 13: Refund API (Admin Only)
export const refundICICIPayment = async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    if (order.paymentDetails.paymentStatus !== 'PAID') {
      return res.status(400).json({ message: 'Order is not paid' });
    }
    
    const refundAmount = amount ? Number(amount).toFixed(2) : Number(order.total).toFixed(2);
    const newTxnNo = `RF${order._id.toString().slice(-8).toUpperCase()}${Date.now().toString().slice(-2)}`;
    
    const params = {
      merchantId: process.env.ICICI_MERCHANT_ID,
      aggregatorID: 'A100000000007164',
      merchantTxnNo: newTxnNo,
      originalTxnNo: order.paymentDetails.merchantTxnNo,
      amount: refundAmount,
      transactionType: 'REFUND'
    };
    
    params.secureHash = generateICICIHash(params, process.env.ICICI_HASH_KEY);
    
    const response = await axios.post(process.env.ICICI_COMMAND_URL, new URLSearchParams(params).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const data = response.data;
    if (data.responseCode === '000' || data.responseCode === '0000') {
      order.paymentDetails.paymentStatus = 'REFUNDED';
      await order.save();
      res.json({ success: true, message: 'Refund successful' });
    } else {
      res.status(400).json({ success: false, message: 'Refund failed' });
    }
  } catch (error) {
    console.error('Refund Error:', error);
    res.status(500).json({ message: 'Refund failed' });
  }
};
