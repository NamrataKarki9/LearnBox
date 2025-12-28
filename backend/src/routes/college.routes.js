/**
 * College Management Routes
 * All routes require authentication
 * Most routes are SUPER_ADMIN only
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../constants/roles.js';
import {
    getAllColleges,
    getCollegeById,
    createCollege,
    updateCollege,
    deleteCollege,
    getCollegeStats
} from '../controllers/college.controller.js';

const router = express.Router();

/**
 * @route   GET /api/colleges/public
 * @desc    Get active colleges (public - for registration)
 * @access  Public
 */
router.get('/public', getAllColleges);

// All routes below require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/colleges
 * @desc    Get all colleges
 * @access  All authenticated users (filtered by role in controller)
 */
router.get('/', getAllColleges);

/**
 * @route   GET /api/colleges/:id
 * @desc    Get college by ID
 * @access  All authenticated users (filtered by role in controller)
 */
router.get('/:id', getCollegeById);

/**
 * @route   GET /api/colleges/:id/stats
 * @desc    Get college statistics
 * @access  SUPER_ADMIN, COLLEGE_ADMIN (own college)
 */
router.get('/:id/stats', requireRole([ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN]), getCollegeStats);

/**
 * @route   POST /api/colleges
 * @desc    Create new college
 * @access  SUPER_ADMIN only
 */
router.post('/', requireRole(ROLES.SUPER_ADMIN), createCollege);

/**
 * @route   PUT /api/colleges/:id
 * @desc    Update college
 * @access  SUPER_ADMIN only
 */
router.put('/:id', requireRole(ROLES.SUPER_ADMIN), updateCollege);

/**
 * @route   DELETE /api/colleges/:id
 * @desc    Delete/Deactivate college
 * @access  SUPER_ADMIN only
 */
router.delete('/:id', requireRole(ROLES.SUPER_ADMIN), deleteCollege);

export default router;
