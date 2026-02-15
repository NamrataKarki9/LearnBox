/**
 * Analytics Routes - Student performance analytics
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../constants/roles.js';
import {
    getStudentWeakPoints,
    getRecommendations,
    getStudentStats,
    getStudentHistory,
    getStudentModulePerformance,
    getAnalyticsDashboard
} from '../controllers/analytics.controller.js';

const router = express.Router();

// All routes require authentication and STUDENT role
router.use(authMiddleware);
router.use(requireRole(ROLES.STUDENT));

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get complete analytics dashboard (all-in-one)
 * @access  STUDENT
 */
router.get('/dashboard', getAnalyticsDashboard);

/**
 * @route   GET /api/analytics/weak-points
 * @desc    Get student's weak points
 * @access  STUDENT
 */
router.get('/weak-points', getStudentWeakPoints);

/**
 * @route   GET /api/analytics/recommendations
 * @desc    Get personalized study recommendations
 * @access  STUDENT
 */
router.get('/recommendations', getRecommendations);

/**
 * @route   GET /api/analytics/stats
 * @desc    Get overall performance statistics
 * @access  STUDENT
 */
router.get('/stats', getStudentStats);

/**
 * @route   GET /api/analytics/history
 * @desc    Get practice history
 * @access  STUDENT
 */
router.get('/history', getStudentHistory);

/**
 * @route   GET /api/analytics/modules
 * @desc    Get module-wise performance
 * @access  STUDENT
 */
router.get('/modules', getStudentModulePerformance);

export default router;
