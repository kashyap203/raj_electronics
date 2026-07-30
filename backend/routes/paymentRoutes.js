import express from 'express';
import { createPaymentOrder, verifyPayment, handlePaymentFailure } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-order', protect, createPaymentOrder);
router.post('/verify-payment', protect, verifyPayment);
router.post('/payment-failed', protect, handlePaymentFailure);

export default router;
