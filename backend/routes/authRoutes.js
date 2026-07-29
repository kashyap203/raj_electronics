import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validateMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  register,
  login,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  addAddress,
  updateAddress,
  deleteAddress,
} from '../controllers/authController.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required')],
  validate,
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  resetPassword
);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:addressId', protect, updateAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);

export default router;
