/**
 * Audit Log Service
 * Tracks all admin actions (CRUD operations) for compliance and activity monitoring
 */

import prisma from '../prisma.js';

/**
 * Log an admin action
 * @param {Object} logData - Audit log data
 * @param {number} logData.userId - User performing the action
 * @param {number} logData.collegeId - College context
 * @param {string} logData.actionType - CREATE, UPDATE, DELETE, ACTIVATE, DEACTIVATE
 * @param {string} logData.entityType - RESOURCE, MODULE, MCQ, MCQ_SET, LEARNING_SITE, QUIZ_SESSION
 * @param {number} logData.entityId - ID of the entity
 * @param {string} logData.entityName - Name/title of the entity
 * @param {Object} logData.changes - Before/after values for updates
 * @param {string} logData.ipAddress - IP address of requester
 * @param {string} logData.userAgent - Browser user agent
 */
export const logAuditAction = async (logData) => {
  try {
    const {
      userId,
      collegeId,
      actionType,
      entityType,
      entityId,
      entityName,
      changes,
      ipAddress,
      userAgent
    } = logData;

    // Validate required fields
    if (!userId || !collegeId || !actionType || !entityType) {
      console.error('Missing required audit log fields', logData);
      return null;
    }

    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        collegeId,
        action: `${entityType}_${actionType}`,
        actionType,
        entityType,
        entityId,
        entityName,
        changes,
        ipAddress,
        userAgent
      }
    });

    return auditLog;
  } catch (error) {
    console.error('Error logging audit action:', error);
    // Don't throw - we don't want failed audit logging to break the main operation
    return null;
  }
};

/**
 * Get audit logs with filters
 * @param {Object} filters - Filter criteria
 * @param {number} filters.collegeId - Filter by college
 * @param {Date} filters.startDate - Start of date range
 * @param {Date} filters.endDate - End of date range
 * @param {string} filters.actionType - Filter by action type
 * @param {string} filters.entityType - Filter by entity type
 * @param {number} filters.userId - Filter by user
 * @param {number} filters.skip - Pagination offset
 * @param {number} filters.take - Pagination limit
 */
export const getAuditLogs = async (filters = {}) => {
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
    } = filters;

    // Build where clause dynamically
    const where = {};

    if (collegeId) where.collegeId = parseInt(collegeId);
    if (actionType) where.actionType = actionType;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = parseInt(userId);

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Get total count
    const total = await prisma.auditLog.count({ where });

    // Get logs with user details
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            first_name: true,
            last_name: true,
            avatar: true
          }
        },
        college: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(take)
    });

    return {
      logs,
      total,
      skip: parseInt(skip),
      take: parseInt(take)
    };
  } catch (error) {
    console.error('Error retrieving audit logs:', error);
    throw error;
  }
};

/**
 * Get audit log statistics for a date range
 * @param {Object} params - Query parameters
 * @param {number} params.collegeId - Filter by college
 * @param {Date} params.startDate - Start date
 * @param {Date} params.endDate - End date
 */
export const getAuditStats = async (params = {}) => {
  try {
    const { collegeId, startDate, endDate } = params;

    const where = {};
    if (collegeId) where.collegeId = parseInt(collegeId);

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Count by action type
    const byActionType = await prisma.auditLog.groupBy({
      by: ['actionType'],
      where,
      _count: { id: true }
    });

    // Count by entity type
    const byEntityType = await prisma.auditLog.groupBy({
      by: ['entityType'],
      where,
      _count: { id: true }
    });

    // Count by user
    const byUser = await prisma.auditLog.groupBy({
      by: ['userId'],
      where,
      _count: { id: true },
      take: 10
    });

    // Get user details for top users
    const userIds = byUser.map(item => item.userId);
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true
          }
        })
      : [];

    const userMap = users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    return {
      byActionType,
      byEntityType,
      topUsers: byUser.map(item => ({
        user: userMap[item.userId],
        count: item._count.id
      }))
    };
  } catch (error) {
    console.error('Error retrieving audit stats:', error);
    throw error;
  }
};

/**
 * Get total count of recent audit logs
 * @param {number} collegeId - Filter by college
 * @param {number} days - Last N days
 */
export const getRecentAuditCount = async (collegeId, days = 7) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const count = await prisma.auditLog.count({
      where: {
        collegeId,
        createdAt: { gte: startDate }
      }
    });

    return count;
  } catch (error) {
    console.error('Error getting recent audit count:', error);
    return 0;
  }
};
