import express from 'express';
import { getAllUsers, updateUser, deleteUser } from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

// All routes require authentication and SUPER_ADMIN role
router.use(authMiddleware);
router.use(authorize(['SUPER_ADMIN']));

router.get('/', getAllUsers);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
