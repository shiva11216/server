import express from 'express';
import {
  getAllUsers,
  getUsersByRole,
  getUserById,
  updateUser,
  updateProfile,
  deleteUser,
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Get messageable users (for clients and employees)
router.get('/messageable', protect, async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    
    let query = {};
    if (req.user.role === 'client') {
      // Clients can message admins and employees
      query = { role: { $in: ['admin', 'employee'] } };
    } else if (req.user.role === 'employee') {
      // Employees can message admins and clients
      query = { role: { $in: ['admin', 'client'] } };
    } else {
      // Admins can message everyone
      query = {};
    }
    
    const users = await User.find({ ...query, _id: { $ne: req.user._id } }).select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/role/:role', protect, authorize('admin'), getUsersByRole);
router.put('/profile', protect, updateProfile);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

export default router;
