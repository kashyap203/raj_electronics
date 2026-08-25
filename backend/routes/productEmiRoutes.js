import express from 'express';
import { updateProductEmiOffer, deleteProductEmiOffer } from '../controllers/productEmiController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/:id')
  .put(protect, admin, updateProductEmiOffer)
  .delete(protect, admin, deleteProductEmiOffer);

export default router;
