/**
 * MCQ Routes - College-scoped
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole, requireCollegeAccess } from '../middleware/role.middleware.js';
import { ROLES } from '../constants/roles.js';
import {
    getAllMCQs,
    createMCQ,
    attemptMCQ,
    getMyAttempts
} from '../controllers/mcq.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/mcqs
 * @desc    Get all MCQs (college-scoped)
 * @access  COLLEGE_ADMIN (own college), STUDENT (own college)
 */
router.get('/', requireCollegeAccess, getAllMCQs);

/**
 * @route   GET /api/mcqs/attempts/me
 * @desc    Get my MCQ attempts
 * @access  STUDENT
 */
router.get('/attempts/me', requireRole(ROLES.STUDENT), getMyAttempts);

/**
 * @route   POST /api/mcqs
 * @desc    Create new MCQ
 * @access  COLLEGE_ADMIN only
 */
router.post('/', requireRole(ROLES.COLLEGE_ADMIN), requireCollegeAccess, createMCQ);

/**
 * @route   POST /api/mcqs/:id/attempt
 * @desc    Attempt an MCQ
 * @access  STUDENT only
 */
router.post('/:id/attempt', requireRole(ROLES.STUDENT), requireCollegeAccess, attemptMCQ);

export default router;
