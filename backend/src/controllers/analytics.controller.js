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
        
        // Validate threshold parameter
        const parsedThreshold = parseFloat(threshold);
        if (isNaN(parsedThreshold) || parsedThreshold < 0 || parsedThreshold > 100) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Threshold must be a number between 0 and 100',
                field: 'threshold'
            });
        }
        
        const weakPoints = await getWeakPoints(req.user.id, parsedThreshold);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            count: weakPoints.length,
            data: weakPoints
        });
    } catch (error) {
        console.error('Get weak points error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        if (!req.user || !req.user.id) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                error: 'User authentication required'
            });
        }

        const recommendations = await getStudyRecommendations(req.user.id);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: recommendations || []
        });
    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        if (!req.user || !req.user.id) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                error: 'User authentication required'
            });
        }

        const stats = await getOverallStats(req.user.id);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: stats || {}
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        
        // Validate days parameter
        const parsedDays = parseInt(days);
        if (isNaN(parsedDays) || parsedDays <= 0 || parsedDays > 365) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Days must be a number between 1 and 365',
                field: 'days'
            });
        }
        
        const history = await getPracticeHistory(req.user.id, parsedDays);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        if (!req.user || !req.user.id) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                error: 'User authentication required'
            });
        }

        const performance = await getModulePerformance(req.user.id);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            count: (performance || []).length,
            data: performance || []
        });
    } catch (error) {
        console.error('Get module performance error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        // Validate user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                error: 'User authentication required'
            });
        }

        const [stats, weakPoints, recommendations, history, modulePerformance] = await Promise.all([
            getOverallStats(req.user.id).catch(err => {
                console.error('Error fetching stats:', err);
                return null;
            }),
            getWeakPoints(req.user.id, 60).catch(err => {
                console.error('Error fetching weak points:', err);
                return [];
            }),
            getStudyRecommendations(req.user.id).catch(err => {
                console.error('Error fetching recommendations:', err);
                return [];
            }),
            getPracticeHistory(req.user.id, 30).catch(err => {
                console.error('Error fetching history:', err);
                return { recentSessions: [], dailyHistory: [] };
            }),
            getModulePerformance(req.user.id).catch(err => {
                console.error('Error fetching module performance:', err);
                return [];
            })
        ]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                overview: stats || {},
                weakAreas: (weakPoints || []).slice(0, 5),
                recommendations: recommendations || [],
                recentActivity: (history?.recentSessions) || [],
                dailyProgress: (history?.dailyHistory || []).slice(0, 14),
                modulePerformance: (modulePerformance || []).slice(0, 5)
            }
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
