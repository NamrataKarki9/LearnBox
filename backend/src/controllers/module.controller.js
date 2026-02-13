/**
 * Module Management Controller
 * Handles college-scoped module operations
 */

import prisma from '../prisma.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/errors.js';

/**
 * Get all modules (college-scoped)
 * @route GET /api/modules
 * @access Authenticated users
 */
export const getAllModules = async (req, res) => {
    try {
        const { collegeId, facultyId, year } = req.query;
        
        // Ensure user is authenticated
        if (!req.user) {
             return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
                 error: ERROR_MESSAGES.UNAUTHORIZED 
             });
        }

        const whereClause = {};
        
        // If collegeId provided, filter by it
        if (collegeId) {
            whereClause.collegeId = parseInt(collegeId);
        } else if (req.user.collegeId) {
            // Otherwise use user's college
            whereClause.collegeId = req.user.collegeId;
        }

        // Filter by faculty if provided
        if (facultyId) {
            whereClause.facultyId = parseInt(facultyId);
        }

        // Filter by year if provided
        if (year) {
            whereClause.year = parseInt(year);
        }

        const modules = await prisma.module.findMany({
            where: whereClause,
            include: {
                college: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                faculty: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                creator: {
                    select: {
                        id: true,
                        username: true,
                        first_name: true,
                        last_name: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            count: modules.length,
            data: modules
        });
    } catch (error) {
        console.error('Get modules error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};

/**
 * Get single module by ID
 * @route GET /api/modules/:id
 * @access Authenticated users
 */
export const getModuleById = async (req, res) => {
    try {
        const { id } = req.params;

        const module = await prisma.module.findUnique({
            where: { id: parseInt(id) },
            include: {
                college: true,
                creator: {
                    select: {
                        id: true,
                        username: true,
                        first_name: true,
                        last_name: true
                    }
                },
                resources: true,
                mcqs: true
            }
        });

        if (!module) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'Module not found'
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: module
        });
    } catch (error) {
        console.error('Get module error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};
