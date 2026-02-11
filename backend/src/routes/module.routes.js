/**
 * Module Routes
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { getAllModules, getModuleById } from '../controllers/module.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/modules
 * @desc    Get all modules (college-scoped)
 * @access  Authenticated users
 */
router.get('/', getAllModules);

/**
 * @route   GET /api/modules/:id
 * @desc    Get single module by ID
 * @access  Authenticated users
 */
router.get('/:id', getModuleById);

export default router;
