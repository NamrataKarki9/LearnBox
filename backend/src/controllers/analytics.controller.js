/**
 * Analytics Controller - Student performance tracking and recommendations
 */

import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/errors.js';
import {
    getWeakPoints,
    getStudyRecommendations,
    getOverallStats,
    getPracticeHistory,
    getModulePerformance
} from '../services/analytics.service.js';

/**
 * Get student's weak points
 * @route GET /api/analytics/weak-points
 * @access STUDENT
 */
export const getStudentWeakPoints = async (req, res) => {
    try {
        const { threshold = 60 } = req.query;
        
        const weakPoints = await getWeakPoints(
            req.user.id,
            parseFloat(threshold)
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            count: weakPoints.length,
            data: weakPoints
        });
    } catch (error) {
        console.error('Get weak points error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Get personalized study recommendations
 * @route GET /api/analytics/recommendations
 * @access STUDENT
 */
export const getRecommendations = async (req, res) => {
    try {
        const recommendations = await getStudyRecommendations(req.user.id);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Get overall performance statistics
 * @route GET /api/analytics/stats
 * @access STUDENT
 */
export const getStudentStats = async (req, res) => {
    try {
        const stats = await getOverallStats(req.user.id);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Get practice history
 * @route GET /api/analytics/history
 * @access STUDENT
 */
export const getStudentHistory = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        
        const history = await getPracticeHistory(
            req.user.id,
            parseInt(days)
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Get module-wise performance
 * @route GET /api/analytics/modules
 * @access STUDENT
 */
export const getStudentModulePerformance = async (req, res) => {
    try {
        const performance = await getModulePerformance(req.user.id);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            count: performance.length,
            data: performance
        });
    } catch (error) {
        console.error('Get module performance error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Get analytics dashboard data (all-in-one)
 * @route GET /api/analytics/dashboard
 * @access STUDENT
 */
export const getAnalyticsDashboard = async (req, res) => {
    try {
        const [stats, weakPoints, recommendations, history, modulePerformance] = await Promise.all([
            getOverallStats(req.user.id),
            getWeakPoints(req.user.id, 60),
            getStudyRecommendations(req.user.id),
            getPracticeHistory(req.user.id, 30),
            getModulePerformance(req.user.id)
        ]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                overview: stats,
                weakAreas: weakPoints.slice(0, 5), // Top 5 weak areas
                recommendations,
                recentActivity: history.recentSessions,
                dailyProgress: history.dailyHistory.slice(0, 14), // Last 14 days
                modulePerformance: modulePerformance.slice(0, 5) // Top 5 modules
            }
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};
