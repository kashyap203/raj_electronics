import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validateMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyOffer,
  applyBankDiscount,
} from '../controllers/cartController.js';

const router = express.Router();

router.use(protect);

router.get('/', getCart);
router.post(
  '/',
  [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  ],
  validate,
  addToCart
);
router.put('/offer', applyOffer);
router.put('/bank-discount', applyBankDiscount);
router.put(
  '/:productId',
  [body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')],
  validate,
  updateCartItem
);
router.delete('/:productId', removeFromCart);
router.delete('/', clearCart);

export default router;
