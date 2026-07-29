import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validateMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlistController.js';

const router = express.Router();

router.use(protect);

router.get('/', getWishlist);
router.post(
  '/',
  [body('productId').notEmpty().withMessage('Product ID is required')],
  validate,
  addToWishlist
);
router.delete('/:productId', removeFromWishlist);

export default router;
