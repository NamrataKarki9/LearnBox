/**
 * Learning Site Routes
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../constants/roles.js';
import {
    getAllLearningSites,
    createLearningSite,
    deleteLearningSite
} from '../controllers/learning-site.controller.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * @route   GET /api/learning-sites
 * @desc    Get all learning sites with optional filters
 * @access  SUPER_ADMIN, COLLEGE_ADMIN, STUDENT
 */
router.get(
    '/',
    requireRole([ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.STUDENT]),
    getAllLearningSites
);

/**
 * @route   POST /api/learning-sites
 * @desc    Create a learning site
 * @access  SUPER_ADMIN, COLLEGE_ADMIN
 */
router.post(
    '/',
    requireRole([ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN]),
    createLearningSite
);

/**
 * @route   DELETE /api/learning-sites/:id
 * @desc    Delete a learning site
 * @access  SUPER_ADMIN, COLLEGE_ADMIN
 */
router.delete(
    '/:id',
    requireRole([ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN]),
    deleteLearningSite
);

export default router;
