import express from 'express';
import {
  getAllProjects,
  getMyProjects,
  getProjectById,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
} from '../controllers/projectController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('admin'), getAllProjects);
router.get('/my-projects', protect, authorize('employee', 'client'), getMyProjects);
router.get('/:id', protect, getProjectById);
router.post('/', protect, authorize('admin'), createProject);
router.put('/:id', protect, authorize('admin'), updateProject);
router.patch('/:id/status', protect, authorize('employee'), updateProjectStatus);
router.delete('/:id', protect, authorize('admin'), deleteProject);

export default router;
