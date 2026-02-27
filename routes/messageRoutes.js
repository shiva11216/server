import express from 'express';
import {
  getProjectMessages,
  getMyMessages,
  getUserMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
} from '../controllers/messageController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/project/:projectId', protect, getProjectMessages);
router.get('/my-messages', protect, getMyMessages);
router.get('/user/:userId', protect, getUserMessages);
router.post('/', protect, sendMessage);
router.patch('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteMessage);

export default router;
