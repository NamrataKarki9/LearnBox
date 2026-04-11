/**
 * Module Management Controller
 * Handles college-scoped module operations
 */

import prisma from '../prisma.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/errors.js';
import { logAuditAction } from '../services/audit-log.service.js';

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
        // Validate user authentication
        if (!req.user || !req.user.id) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                error: ERROR_MESSAGES.UNAUTHORIZED
            });
        }

        const { id } = req.params;

        // Validate ID format
        const parsedId = parseInt(id);
        if (isNaN(parsedId)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Invalid module ID format',
                field: 'id'
            });
        }

        const module = await prisma.module.findUnique({
            where: { id: parsedId },
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

/**
 * Create a new module
 * @route POST /api/modules
 * @access COLLEGE_ADMIN
 */
export const createModule = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                error: ERROR_MESSAGES.UNAUTHORIZED
            });
        }

        const { name, code, description, year, facultyId } = req.body;
        
        console.log('Create module request:', {
            body: req.body,
            user: { id: req.user.id, collegeId: req.user.collegeId, role: req.user.role }
        });

        // Validate required fields
        if (!name || !code || !year || !facultyId) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: `Missing required fields. Received: name=${name}, code=${code}, year=${year}, facultyId=${facultyId}`
            });
        }

        // Verify faculty exists and belongs to user's college
        const faculty = await prisma.faculty.findUnique({
            where: { id: parseInt(facultyId) }
        });

        if (!faculty) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                error: 'Faculty not found'
            });
        }

        if (faculty.collegeId !== req.user.collegeId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                error: 'Faculty does not belong to your college'
            });
        }

        // Check for duplicate module code within same faculty
        const existingModule = await prisma.module.findFirst({
            where: {
                code: code.toUpperCase(),
                facultyId: parseInt(facultyId)
            }
        });

        if (existingModule) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Module with this code already exists in this faculty'
            });
        }

        const module = await prisma.module.create({
            data: {
                name: name.trim(),
                code: code.toUpperCase(),
                description: description?.trim() || null,
                year: parseInt(year),
                facultyId: parseInt(facultyId),
                collegeId: req.user.collegeId,
                createdBy: req.user.id
            },
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
            }
        });

        // Log audit action
        await logAuditAction({
            userId: req.user.id,
            collegeId: req.user.collegeId,
            actionType: 'CREATE',
            entityType: 'MODULE',
            entityId: module.id,
            entityName: module.name,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Module created successfully',
            data: module
        });
    } catch (error) {
        console.error('Create module error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};

/**
 * Update a module
 * @route PUT /api/modules/:id
 * @access COLLEGE_ADMIN
 */
export const updateModule = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                error: ERROR_MESSAGES.UNAUTHORIZED
            });
        }

        const { id } = req.params;
        const { name, code, description, year, facultyId } = req.body;

        const parsedId = parseInt(id);
        if (isNaN(parsedId)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Invalid module ID'
            });
        }

        // Get existing module
        const existingModule = await prisma.module.findUnique({
            where: { id: parsedId }
        });

        if (!existingModule) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                error: 'Module not found'
            });
        }

        // Verify ownership (module belongs to user's college)
        if (existingModule.collegeId !== req.user.collegeId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                error: 'You do not have permission to update this module'
            });
        }

        // If facultyId is being changed, verify new faculty
        if (facultyId && facultyId !== existingModule.facultyId) {
            const newFaculty = await prisma.faculty.findUnique({
                where: { id: parseInt(facultyId) }
            });

            if (!newFaculty) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    error: 'Faculty not found'
                });
            }

            if (newFaculty.collegeId !== req.user.collegeId) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    success: false,
                    error: 'Faculty does not belong to your college'
                });
            }
        }

        // If code is being changed, check for duplicates
        if (code && code.toUpperCase() !== existingModule.code) {
            const duplicate = await prisma.module.findFirst({
                where: {
                    code: code.toUpperCase(),
                    facultyId: facultyId ? parseInt(facultyId) : existingModule.facultyId,
                    NOT: { id: parsedId }
                }
            });

            if (duplicate) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'Module with this code already exists'
                });
            }
        }

        const updatedModule = await prisma.module.update({
            where: { id: parsedId },
            data: {
                ...(name && { name: name.trim() }),
                ...(code && { code: code.toUpperCase() }),
                ...(description !== undefined && { description: description?.trim() || null }),
                ...(year && { year: parseInt(year) }),
                ...(facultyId && { facultyId: parseInt(facultyId) })
            },
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
            }
        });

        // Log audit action
        await logAuditAction({
            userId: req.user.id,
            collegeId: req.user.collegeId,
            actionType: 'UPDATE',
            entityType: 'MODULE',
            entityId: updatedModule.id,
            entityName: updatedModule.name,
            changes: {
                before: existingModule,
                after: updatedModule
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Module updated successfully',
            data: updatedModule
        });
    } catch (error) {
        console.error('Update module error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};

/**
 * Delete a module
 * @route DELETE /api/modules/:id
 * @access COLLEGE_ADMIN
 */
export const deleteModule = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                error: ERROR_MESSAGES.UNAUTHORIZED
            });
        }

        const { id } = req.params;
        const parsedId = parseInt(id);

        if (isNaN(parsedId)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Invalid module ID'
            });
        }

        // Get existing module
        const existingModule = await prisma.module.findUnique({
            where: { id: parsedId }
        });

        if (!existingModule) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                error: 'Module not found'
            });
        }

        // Verify ownership
        if (existingModule.collegeId !== req.user.collegeId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                error: 'You do not have permission to delete this module'
            });
        }

        // Delete the module
        await prisma.module.delete({
            where: { id: parsedId }
        });

        // Log audit action
        await logAuditAction({
            userId: req.user.id,
            collegeId: existingModule.collegeId,
            actionType: 'DELETE',
            entityType: 'MODULE',
            entityId: existingModule.id,
            entityName: existingModule.name,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Module deleted successfully'
        });
    } catch (error) {
        console.error('Delete module error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: error.message
        });
    }
};
