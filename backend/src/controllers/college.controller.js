/**
 * College Management Controller
 * Handles CRUD operations for colleges (SUPER_ADMIN only)
 */

import prisma from '../prisma.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/errors.js';

/**
 * Get all colleges
 * @route GET /api/colleges (authenticated) or /api/colleges/public (public)
 * @access Public for /public route, authenticated for other routes
 */
export const getAllColleges = async (req, res) => {
    try {
        const { includeInactive } = req.query;
        const isPublicRoute = req.path.includes('/public');
        
        const whereClause = {};
        
        // Filter by active status unless explicitly requesting inactive
        if (includeInactive !== 'true') {
            whereClause.isActive = true;
        }
        
        // For public route, return minimal data
        if (isPublicRoute) {
            const colleges = await prisma.college.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    code: true
                },
                orderBy: { name: 'asc' }
            });
            
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                count: colleges.length,
                data: colleges
            });
        }
        
        // For authenticated routes, return full data with counts
        const colleges = await prisma.college.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: {
                        users: true,
                        resources: true,
                        modules: true,
                        mcqs: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            count: colleges.length,
            data: colleges
        });
    } catch (error) {
        console.error('Get all colleges error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};

/**
 * Get single college by ID
 * @route GET /api/colleges/:id
 * @access SUPER_ADMIN, COLLEGE_ADMIN (own college), STUDENT (own college)
 */
export const getCollegeById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const college = await prisma.college.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: {
                    select: {
                        users: true,
                        resources: true,
                        modules: true,
                        mcqs: true
                    }
                }
            }
        });

        if (!college) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'College not found'
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: college
        });
    } catch (error) {
        console.error('Get college by ID error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};

/**
 * Create new college
 * @route POST /api/colleges
 * @access SUPER_ADMIN only
 */
export const createCollege = async (req, res) => {
    try {
        const { name, code, location, description, isActive = true } = req.body;

        // Validate required fields
        if (!name || !code) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Name and code are required'
            });
        }

        // Check if college with same code already exists
        const existingCollege = await prisma.college.findUnique({
            where: { code }
        });

        if (existingCollege) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                error: 'College with this code already exists'
            });
        }

        const college = await prisma.college.create({
            data: {
                name,
                code: code.toUpperCase(),
                location,
                description,
                isActive
            }
        });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'College created successfully',
            data: college
        });
    } catch (error) {
        console.error('Create college error:', error);
        
        if (error.code === 'P2002') {
            return res.status(HTTP_STATUS.CONFLICT).json({
                error: 'College with this name or code already exists'
            });
        }
        
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};

/**
 * Update college
 * @route PUT /api/colleges/:id
 * @access SUPER_ADMIN only
 */
export const updateCollege = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, location, description, isActive } = req.body;

        // Check if college exists
        const existingCollege = await prisma.college.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingCollege) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'College not found'
            });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (code !== undefined) updateData.code = code.toUpperCase();
        if (location !== undefined) updateData.location = location;
        if (description !== undefined) updateData.description = description;
        if (isActive !== undefined) updateData.isActive = isActive;

        const college = await prisma.college.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'College updated successfully',
            data: college
        });
    } catch (error) {
        console.error('Update college error:', error);
        
        if (error.code === 'P2002') {
            return res.status(HTTP_STATUS.CONFLICT).json({
                error: 'College with this name or code already exists'
            });
        }
        
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};

/**
 * Delete/Deactivate college
 * @route DELETE /api/colleges/:id
 * @access SUPER_ADMIN only
 */
export const deleteCollege = async (req, res) => {
    try {
        const { id } = req.params;
        const { hardDelete = false } = req.query;

        // Check if college exists
        const existingCollege = await prisma.college.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: {
                    select: { users: true, resources: true }
                }
            }
        });

        if (!existingCollege) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'College not found'
            });
        }

        // Soft delete by default (deactivate)
        if (hardDelete === 'true') {
            // Check if college has associated data
            if (existingCollege._count.users > 0 || existingCollege._count.resources > 0) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    error: 'Cannot delete college with associated users or resources'
                });
            }

            await prisma.college.delete({
                where: { id: parseInt(id) }
            });

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'College permanently deleted'
            });
        } else {
            // Soft delete
            await prisma.college.update({
                where: { id: parseInt(id) },
                data: { isActive: false }
            });

            res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'College deactivated successfully'
            });
        }
    } catch (error) {
        console.error('Delete college error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};

/**
 * Get college statistics
 * @route GET /api/colleges/:id/stats
 * @access SUPER_ADMIN, COLLEGE_ADMIN (own college)
 */
export const getCollegeStats = async (req, res) => {
    try {
        const { id } = req.params;

        const stats = await prisma.college.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                name: true,
                code: true,
                _count: {
                    select: {
                        users: true,
                        resources: true,
                        modules: true,
                        mcqs: true
                    }
                },
                users: {
                    select: {
                        role: true
                    }
                }
            }
        });

        if (!stats) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'College not found'
            });
        }

        // Count users by role
        const roleCount = stats.users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {});

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                college: {
                    id: stats.id,
                    name: stats.name,
                    code: stats.code
                },
                totalUsers: stats._count.users,
                totalResources: stats._count.resources,
                totalModules: stats._count.modules,
                totalMCQs: stats._count.mcqs,
                usersByRole: roleCount
            }
        });
    } catch (error) {
        console.error('Get college stats error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};
