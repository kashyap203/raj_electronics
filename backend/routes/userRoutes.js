import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  blockUser,
  deleteUser,
} from '../controllers/userController.js';

const router = express.Router();

router.use(protect, admin);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.put('/:id/block', blockUser);
router.delete('/:id', deleteUser);

export default router;
