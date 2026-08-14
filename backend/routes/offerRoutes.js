import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getActiveOffers,
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer
} from '../controllers/offerController.js';

const router = express.Router();

router.get('/', getActiveOffers); // Public
router.get('/all', protect, admin, getAllOffers); // Admin

router.route('/')
  .post(protect, admin, createOffer);

router.route('/:id')
  .put(protect, admin, updateOffer)
  .delete(protect, admin, deleteOffer);


export default router;
