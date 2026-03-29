/**
 * Module Routes
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../constants/roles.js';
import { getAllModules, getModuleById, createModule, updateModule, deleteModule } from '../controllers/module.controller.js';

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

/**
 * @route   POST /api/modules
 * @desc    Create a new module
 * @access  COLLEGE_ADMIN
 */
router.post('/', requireRole(ROLES.COLLEGE_ADMIN), createModule);

/**
 * @route   PUT /api/modules/:id
 * @desc    Update a module
 * @access  COLLEGE_ADMIN
 */
router.put('/:id', requireRole(ROLES.COLLEGE_ADMIN), updateModule);

/**
 * @route   DELETE /api/modules/:id
 * @desc    Delete a module
 * @access  COLLEGE_ADMIN
 */
router.delete('/:id', requireRole(ROLES.COLLEGE_ADMIN), deleteModule);

export default router;
