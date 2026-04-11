/**
 * Audit Log Controller
 * Handles retrieval and analysis of audit logs
 */

import {
  getAuditLogs,
  getAuditStats,
  getRecentAuditCount
} from '../services/audit-log.service.js';
import { HTTP_STATUS } from '../constants/errors.js';

/**
 * Get audit logs with filtering and pagination
 * @route GET /api/audit-logs
 * @access SUPER_ADMIN
 * @query {number} collegeId - Filter by college
 * @query {string} startDate - Start date (ISO 8601)
 * @query {string} endDate - End date (ISO 8601)
 * @query {string} actionType - Filter by action type
 * @query {string} entityType - Filter by entity type
 * @query {number} userId - Filter by user
 * @query {number} skip - Pagination skip (default: 0)
 * @query {number} take - Pagination take (default: 50)
 */
export const getAuditLogsHandler = async (req, res) => {
  try {
    const {
      collegeId,
      startDate,
      endDate,
      actionType,
      entityType,
      userId,
      skip = 0,
      take = 50
    } = req.query;

    const result = await getAuditLogs({
      collegeId,
      startDate,
      endDate,
      actionType,
      entityType,
      userId,
      skip,
      take
    });

    res.status(HTTP_STATUS.OK).json({
      data: result.logs,
      total: result.total,
      skip: result.skip,
      take: result.take,
      message: 'Audit logs retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      error: 'Failed to retrieve audit logs'
    });
  }
};

/**
 * Get audit log statistics
 * @route GET /api/audit-logs/stats
 * @access SUPER_ADMIN
 * @query {number} collegeId - Filter by college
 * @query {string} startDate - Start date (ISO 8601)
 * @query {string} endDate - End date (ISO 8601)
 */
export const getAuditStatsHandler = async (req, res) => {
  try {
    const { collegeId, startDate, endDate } = req.query;

    const stats = await getAuditStats({
      collegeId,
      startDate,
      endDate
    });

    res.status(HTTP_STATUS.OK).json({
      data: stats,
      message: 'Audit statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      error: 'Failed to retrieve audit statistics'
    });
  }
};

/**
 * Get recent audit activity count
 * @route GET /api/audit-logs/recent
 * @access SUPER_ADMIN
 * @query {number} collegeId - Filter by college
 * @query {number} days - Last N days (default: 7)
 */
export const getRecentActivityHandler = async (req, res) => {
  try {
    const { collegeId, days = 7 } = req.query;

    if (!collegeId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: 'College ID is required'
      });
    }

    const count = await getRecentAuditCount(parseInt(collegeId), parseInt(days));

    res.status(HTTP_STATUS.OK).json({
      data: { count, days: parseInt(days) },
      message: 'Recent activity count retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(HTTP_STATUS.SERVER_ERROR).json({
      error: 'Failed to retrieve recent activity'
    });
  }
};
