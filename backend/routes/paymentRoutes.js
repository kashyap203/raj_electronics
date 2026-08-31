import express from 'express';
import { createPaymentOrder, verifyPayment, handlePaymentFailure } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  initiateICICIPayment,
  handleICICIResponse,
  handleICICIAdvice,
  checkICICIPaymentStatus,
  generateICICIQR,
  refundICICIPayment,
  getCardBin,
  generateOTP,
  verifyOTP,
  authorizePayment,
  validatePaymentAndOffer
} from '../controllers/iciciPaymentController.js';
import { admin } from '../middleware/authMiddleware.js';

import {
  initiatePineLabsPayment,
  handlePineLabsReturn,
  handlePineLabsWebhook,
  checkPineLabsPaymentStatus,
  refundPineLabsPayment,
  previewCheckoutTotals,
  getBankOffersForCart,
} from '../controllers/pineLabsPaymentController.js';

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

// New ICICI Direct Mode Routes
router.post('/icici/bin', protect, getCardBin);
router.post('/icici/validate-payment-offer', protect, validatePaymentAndOffer);
router.get('/icici/otp/generate', protect, generateOTP);
router.post('/icici/otp/verify', protect, verifyOTP);
router.post('/icici/authorize', protect, authorizePayment);

// Pine Labs Online Payment Gateway
router.post('/pinelabs/initiate', protect, initiatePineLabsPayment);
router.get('/pinelabs/return', handlePineLabsReturn);
router.post('/pinelabs/return', handlePineLabsReturn);
router.post('/pinelabs/webhook', handlePineLabsWebhook);
router.post('/pinelabs/status', protect, checkPineLabsPaymentStatus);
router.post('/pinelabs/refund', protect, admin, refundPineLabsPayment);
router.post('/pinelabs/preview', protect, previewCheckoutTotals);
router.get('/pinelabs/bank-offers', protect, getBankOffersForCart);

export default router;
