import express from 'express';
import { getEmiBanks, createEmiBank, updateEmiBank, deleteEmiBank } from '../controllers/emiController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getEmiBanks);
router.post('/', protect, admin, createEmiBank);
router.put('/:id', protect, admin, updateEmiBank);
router.delete('/:id', protect, admin, deleteEmiBank);

export default router;
