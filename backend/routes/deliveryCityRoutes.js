import express from 'express';
import {
  getDeliveryCities,
  addDeliveryCity,
  deleteDeliveryCity,
} from '../controllers/deliveryCityController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getDeliveryCities)
  .post(protect, admin, addDeliveryCity);

router.route('/:id')
  .delete(protect, admin, deleteDeliveryCity);

export default router;
