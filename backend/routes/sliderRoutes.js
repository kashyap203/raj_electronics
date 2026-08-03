import express from 'express';
import {
  getSliders,
  getAdminSliders,
  getSliderById,
  createSlider,
  updateSlider,
  deleteSlider,
} from '../controllers/sliderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getSliders)
  .post(protect, admin, uploadSingle, createSlider);

router.route('/admin')
  .get(protect, admin, getAdminSliders);

router.route('/:id')
  .get(protect, admin, getSliderById)
  .put(protect, admin, uploadSingle, updateSlider)
  .delete(protect, admin, deleteSlider);

export default router;
