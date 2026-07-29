import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validateMiddleware.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';
import {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/brandController.js';

const router = express.Router();

router.get('/', getBrands);
router.get('/:id', getBrandById);

router.post(
  '/',
  protect,
  admin,
  uploadSingle,
  [body('name').trim().notEmpty().withMessage('Brand name is required')],
  validate,
  createBrand
);

router.put('/:id', protect, admin, uploadSingle, updateBrand);
router.delete('/:id', protect, admin, deleteBrand);

export default router;
