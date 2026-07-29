import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validateMiddleware.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getCategories);
router.get('/:id', getCategoryById);

router.post(
  '/',
  protect,
  admin,
  uploadSingle,
  [body('name').trim().notEmpty().withMessage('Category name is required')],
  validate,
  createCategory
);

router.put('/:id', protect, admin, uploadSingle, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

export default router;
