/**
 * Faculty Management Controller
 * Handles college-scoped faculty operations
 */

import prisma from '../prisma.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/errors.js';
import { ROLES } from '../constants/roles.js';

/**
 * Get all faculties (college-scoped)
 * @route GET /api/faculties
 * @access COLLEGE_ADMIN (own college), STUDENT (own college)
 */
export const getAllFaculties = async (req, res) => {
    try {
        const whereClause = {
            collegeId: req.collegeId || req.user.collegeId
        };

        const faculties = await prisma.faculty.findMany({
            where: whereClause,
            include: {
                college: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                _count: {
                    select: {
                        resources: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            count: faculties.length,
            data: faculties
        });
    } catch (error) {
        console.error('Get faculties error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Create faculty (COLLEGE_ADMIN only, auto-scoped to their college)
 * @route POST /api/faculties
 * @access COLLEGE_ADMIN
 */
export const createFaculty = async (req, res) => {
    try {
        const { name, code, description } = req.body;

        if (!name || !code) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Name and code are required'
            });
        }

        // Check if faculty code already exists in this college
        const existingFaculty = await prisma.faculty.findFirst({
            where: {
                code,
                collegeId: req.user.collegeId
            }
        });

        if (existingFaculty) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                error: 'Faculty with this code already exists in your college'
            });
        }

        // Auto-scope to admin's college
        const faculty = await prisma.faculty.create({
            data: {
                name,
                code,
                description,
                collegeId: req.user.collegeId
            },
            include: {
                college: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Faculty created successfully',
            data: faculty
        });
    } catch (error) {
        console.error('Create faculty error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Update faculty (COLLEGE_ADMIN only, college-scoped)
 * @route PUT /api/faculties/:id
 * @access COLLEGE_ADMIN (own college only)
 */
export const updateFaculty = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, description } = req.body;

        // Verify faculty exists and belongs to admin's college
        const existingFaculty = await prisma.faculty.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingFaculty) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'Faculty not found'
            });
        }

        // College-scoped authorization check
        if (existingFaculty.collegeId !== req.user.collegeId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                error: ERROR_MESSAGES.COLLEGE_ACCESS_DENIED
            });
        }

        // Check if code is being changed and if it conflicts
        if (code && code !== existingFaculty.code) {
            const codeConflict = await prisma.faculty.findFirst({
                where: {
                    code,
                    collegeId: req.user.collegeId,
                    id: { not: parseInt(id) }
                }
            });

            if (codeConflict) {
                return res.status(HTTP_STATUS.CONFLICT).json({
                    error: 'Faculty with this code already exists in your college'
                });
            }
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (code) updateData.code = code;
        if (description !== undefined) updateData.description = description;

        const faculty = await prisma.faculty.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                college: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            }
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Faculty updated successfully',
            data: faculty
        });
    } catch (error) {
        console.error('Update faculty error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Delete faculty (COLLEGE_ADMIN only, college-scoped)
 * @route DELETE /api/faculties/:id
 * @access COLLEGE_ADMIN (own college only)
 */
export const deleteFaculty = async (req, res) => {
    try {
        const { id } = req.params;

        const existingFaculty = await prisma.faculty.findUnique({
            where: { id: parseInt(id) },
            include: {
                _count: {
                    select: {
                        resources: true
                    }
                }
            }
        });

        if (!existingFaculty) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'Faculty not found'
            });
        }

        // College-scoped authorization
        if (existingFaculty.collegeId !== req.user.collegeId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                error: ERROR_MESSAGES.COLLEGE_ACCESS_DENIED
            });
        }

        // Check if faculty has resources
        if (existingFaculty._count.resources > 0) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                error: 'Cannot delete faculty with associated resources'
            });
        }

        await prisma.faculty.delete({
            where: { id: parseInt(id) }
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Faculty deleted successfully'
        });
    } catch (error) {
        console.error('Delete faculty error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};
