import express from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validateMiddleware.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getSalesSummary,
} from '../controllers/orderController.js';

const router = express.Router();

router.post(
  '/',
  protect,
  [
    body('orderItems').isArray({ min: 1 }).withMessage('Order items are required'),
    body('address.street').notEmpty().withMessage('Street is required'),
    body('address.city').notEmpty().withMessage('City is required'),
    body('address.state').notEmpty().withMessage('State is required'),
    body('address.pincode').notEmpty().withMessage('Pincode is required'),
    body('address.phone').notEmpty().withMessage('Phone is required'),
  ],
  validate,
  createOrder
);

router.get('/my', protect, getMyOrders);
router.get('/sales-summary', protect, admin, getSalesSummary);
router.get('/', protect, admin, getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);
router.put(
  '/:id/status',
  protect,
  admin,
  [body('status').notEmpty().withMessage('Status is required')],
  validate,
  updateOrderStatus
);

export default router;
