/**
 * Resource Management Controller
 * Handles college-scoped resource operations
 */

import prisma from '../prisma.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/errors.js';
import { ROLES } from '../constants/roles.js';

/**
 * Get all resources (college-scoped)
 * @route GET /api/resources
 * @access COLLEGE_ADMIN (own college), STUDENT (own college)
 */
export const getAllResources = async (req, res) => {
    try {
        const { moduleId } = req.query;
        
        const whereClause = {
            collegeId: req.collegeId || req.user.collegeId
        };

        if (moduleId) {
            whereClause.moduleId = parseInt(moduleId);
        }

        const resources = await prisma.resource.findMany({
            where: whereClause,
            include: {
                uploader: {
                    select: {
                        id: true,
                        username: true,
                        first_name: true,
                        last_name: true
                    }
                },
                module: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            count: resources.length,
            data: resources
        });
    } catch (error) {
        console.error('Get resources error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Create resource (COLLEGE_ADMIN only, auto-scoped to their college)
 * @route POST /api/resources
 * @access COLLEGE_ADMIN
 */
export const createResource = async (req, res) => {
    try {
        const { title, description, fileUrl, fileType, moduleId } = req.body;

        if (!title || !fileUrl || !fileType) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Title, fileUrl, and fileType are required'
            });
        }

        // Auto-scope to admin's college
        const resource = await prisma.resource.create({
            data: {
                title,
                description,
                fileUrl,
                fileType,
                moduleId: moduleId ? parseInt(moduleId) : null,
                collegeId: req.user.collegeId, // Always use admin's college
                uploadedBy: req.user.id
            },
            include: {
                module: true,
                college: true
            }
        });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Resource created successfully',
            data: resource
        });
    } catch (error) {
        console.error('Create resource error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Update resource (COLLEGE_ADMIN only, college-scoped)
 * @route PUT /api/resources/:id
 * @access COLLEGE_ADMIN (own college only)
 */
export const updateResource = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, fileUrl, fileType, moduleId } = req.body;

        // Verify resource exists and belongs to admin's college
        const existingResource = await prisma.resource.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingResource) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: ERROR_MESSAGES.RESOURCE_NOT_FOUND
            });
        }

        // College-scoped authorization check
        if (req.user.role === ROLES.COLLEGE_ADMIN && 
            existingResource.collegeId !== req.user.collegeId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                error: ERROR_MESSAGES.COLLEGE_ACCESS_DENIED
            });
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (fileUrl) updateData.fileUrl = fileUrl;
        if (fileType) updateData.fileType = fileType;
        if (moduleId !== undefined) updateData.moduleId = moduleId ? parseInt(moduleId) : null;

        const resource = await prisma.resource.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Resource updated successfully',
            data: resource
        });
    } catch (error) {
        console.error('Update resource error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Delete resource (COLLEGE_ADMIN only, college-scoped)
 * @route DELETE /api/resources/:id
 * @access COLLEGE_ADMIN (own college only)
 */
export const deleteResource = async (req, res) => {
    try {
        const { id } = req.params;

        const existingResource = await prisma.resource.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingResource) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: ERROR_MESSAGES.RESOURCE_NOT_FOUND
            });
        }

        // College-scoped authorization
        if (req.user.role === ROLES.COLLEGE_ADMIN && 
            existingResource.collegeId !== req.user.collegeId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                error: ERROR_MESSAGES.COLLEGE_ACCESS_DENIED
            });
        }

        await prisma.resource.delete({
            where: { id: parseInt(id) }
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Resource deleted successfully'
        });
    } catch (error) {
        console.error('Delete resource error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};
