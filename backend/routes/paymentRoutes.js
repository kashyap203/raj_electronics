import express from 'express';
import { createPaymentOrder, verifyPayment, handlePaymentFailure } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { initiateICICIPayment, handleICICIResponse, handleICICIAdvice, checkICICIPaymentStatus, generateICICIQR, refundICICIPayment } from '../controllers/iciciPaymentController.js';
import { admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-order', protect, createPaymentOrder);
router.post('/verify-payment', protect, verifyPayment);
router.post('/payment-failed', protect, handlePaymentFailure);

// ICICI Routes
router.post('/icici/initiate', protect, initiateICICIPayment);
router.post('/icici/response', handleICICIResponse);
router.post('/icici/advice', handleICICIAdvice);
router.post('/icici/status', protect, checkICICIPaymentStatus);
router.post('/icici/qr', protect, generateICICIQR);
router.post('/icici/refund', protect, admin, refundICICIPayment);

export default router;
