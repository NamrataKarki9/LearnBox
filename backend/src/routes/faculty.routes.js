/**
 * Faculty Routes - College-scoped
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../constants/roles.js';
import {
    getAllFaculties,
    createFaculty,
    updateFaculty,
    deleteFaculty
} from '../controllers/faculty.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/faculties
 * @desc    Get all faculties (college-scoped)
 * @access  COLLEGE_ADMIN (own college), STUDENT (own college)
 */
router.get(
    '/',
    requireRole([ROLES.COLLEGE_ADMIN, ROLES.STUDENT, ROLES.SUPER_ADMIN]),
    getAllFaculties
);

/**
 * @route   POST /api/faculties
 * @desc    Create new faculty
 * @access  COLLEGE_ADMIN
 */
router.post(
    '/',
    requireRole([ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN]),
    createFaculty
);

/**
 * @route   PUT /api/faculties/:id
 * @desc    Update faculty
 * @access  COLLEGE_ADMIN (own college only)
 */
router.put(
    '/:id',
    requireRole([ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN]),
    updateFaculty
);

/**
 * @route   DELETE /api/faculties/:id
 * @desc    Delete faculty
 * @access  COLLEGE_ADMIN (own college only)
 */
router.delete(
    '/:id',
    requireRole([ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN]),
    deleteFaculty
);

export default router;
