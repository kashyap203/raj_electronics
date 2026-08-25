import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validateMiddleware.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { uploadMultiple } from '../middleware/uploadMiddleware.js';
import {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  createReview,
  getRelatedProducts,
  getSerialNumbers,
  addSerialNumber,
  updateSerialNumber,
  deleteSerialNumber,
  getBankDiscounts,
  addBankDiscount,
  updateBankDiscount,
  deleteBankDiscount,
} from '../controllers/productController.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/search', getProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id/related', getRelatedProducts);
router.get('/:id', getProductById);

router.post(
  '/',
  protect,
  admin,
  uploadMultiple,
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('brand').notEmpty().withMessage('Brand is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('stock').isInt({ min: 0 }).withMessage('Valid stock is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ],
  validate,
  createProduct
);

router.put('/:id', protect, admin, uploadMultiple, updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

router.post(
  '/:id/reviews',
  protect,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').trim().notEmpty().withMessage('Comment is required'),
  ],
  validate,
  createReview
);

router.get('/:id/serial-numbers', protect, admin, getSerialNumbers);
router.post('/:id/serial-numbers', protect, admin, addSerialNumber);
router.put('/:id/serial-numbers/:snId', protect, admin, updateSerialNumber);
router.delete('/:id/serial-numbers/:snId', protect, admin, deleteSerialNumber);

import { getProductEmiOffers, createProductEmiOffer, getEligibleProductEmiOffers } from '../controllers/productEmiController.js';

router.get('/:id/bank-discounts', getBankDiscounts);
router.post('/:id/bank-discounts', protect, admin, addBankDiscount);
router.put('/:id/bank-discounts/:discountId', protect, admin, updateBankDiscount);
router.delete('/:id/bank-discounts/:discountId', protect, admin, deleteBankDiscount);

router.get('/:id/emi-offers', getProductEmiOffers);
router.post('/:id/emi-offers', protect, admin, createProductEmiOffer);
router.get('/:id/eligible-emis', getEligibleProductEmiOffers);

export default router;
