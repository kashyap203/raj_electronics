import express from 'express';
import { getEmiBanks, createEmiBank, updateEmiBank, deleteEmiBank, getEligibleEmiPlans, generateEmiQuote, getCartEligibleEmiBanks, getCartEligibleEmiPlans } from '../controllers/emiController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getEmiBanks);
router.post('/plans', protect, getEligibleEmiPlans);
router.post('/quote', protect, generateEmiQuote);
router.get('/cart/:cartId/eligible-banks', protect, getCartEligibleEmiBanks);
router.post('/cart/:cartId/eligible-plans', protect, getCartEligibleEmiPlans);
router.post('/', protect, admin, createEmiBank);
router.put('/:id', protect, admin, updateEmiBank);
router.delete('/:id', protect, admin, deleteEmiBank);

export default router;
