import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getActiveOffers,
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer
} from '../controllers/offerController.js';

import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', getActiveOffers); // Public
router.get('/all', protect, admin, getAllOffers); // Admin

router.route('/')
  .post(protect, admin, upload.single('logo'), createOffer);

router.route('/:id')
  .put(protect, admin, upload.single('logo'), updateOffer)
  .delete(protect, admin, deleteOffer);


export default router;
