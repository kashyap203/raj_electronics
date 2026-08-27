import express from 'express';
import { uploadSingle } from '../middleware/uploadMiddleware.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, admin, uploadSingle, (req, res) => {
  if (req.file) {
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  } else {
    res.status(400).json({ message: 'No file uploaded' });
  }
});

export default router;
