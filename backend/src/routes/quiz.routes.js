/**
 * Quiz Routes - Quiz sessions (Google Forms style)
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../constants/roles.js';
import {
    startQuizSession,
    submitQuizSession,
    getQuizSession,
    getQuizHistory,
    abandonQuizSession
} from '../controllers/quiz.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/quiz/start
 * @desc    Start a new quiz session
 * @access  STUDENT
 */
router.post('/start', requireRole(ROLES.STUDENT), startQuizSession);

/**
 * @route   GET /api/quiz/history
 * @desc    Get student's quiz history
 * @access  STUDENT
 */
router.get('/history', requireRole(ROLES.STUDENT), getQuizHistory);

/**
 * @route   POST /api/quiz/:sessionId/submit
 * @desc    Submit quiz with all answers
 * @access  STUDENT
 */
router.post('/:sessionId/submit', requireRole(ROLES.STUDENT), submitQuizSession);

/**
 * @route   GET /api/quiz/:sessionId
 * @desc    Get quiz session details
 * @access  STUDENT
 */
router.get('/:sessionId', requireRole(ROLES.STUDENT), getQuizSession);

/**
 * @route   POST /api/quiz/:sessionId/abandon
 * @desc    Abandon a quiz session
 * @access  STUDENT
 */
router.post('/:sessionId/abandon', requireRole(ROLES.STUDENT), abandonQuizSession);

export default router;
