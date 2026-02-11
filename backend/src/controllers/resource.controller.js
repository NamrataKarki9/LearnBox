/**
 * Resource Management Controller
 * Handles college-scoped resource operations with Cloudinary integration
 */

import prisma from '../prisma.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/errors.js';
import { ROLES } from '../constants/roles.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.config.js';
import fs from 'fs';
import { promisify } from 'util';

const unlinkFile = promisify(fs.unlink);

/**
 * Upload resource with PDF file to Cloudinary
 * @route POST /api/resources/upload
 * @access SUPER_ADMIN, COLLEGE_ADMIN
 */
export const uploadResource = async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'No file uploaded. Please upload a PDF file.'
            });
        }

        const { title, description, year, facultyId, moduleId } = req.body;

        // Validate required fields (all mandatory except description)
        if (!title) {
            // Clean up uploaded file
            await unlinkFile(req.file.path);
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Title is required'
            });
        }

        if (!year) {
            await unlinkFile(req.file.path);
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Academic year is required'
            });
        }

        if (!facultyId) {
            await unlinkFile(req.file.path);
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Faculty is required'
            });
        }

        if (!moduleId) {
            await unlinkFile(req.file.path);
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Module is required'
            });
        }

        // Validate collegeId
        const collegeId = req.user.role === ROLES.SUPER_ADMIN 
            ? (req.body.collegeId ? parseInt(req.body.collegeId) : req.user.collegeId)
            : req.user.collegeId;

        if (!collegeId) {
            await unlinkFile(req.file.path);
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'College ID is required'
            });
        }

        // Verify college exists
        const college = await prisma.college.findUnique({
            where: { id: collegeId }
        });

        if (!college) {
            await unlinkFile(req.file.path);
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'College not found'
            });
        }

        // Verify faculty exists and belongs to the college
        const faculty = await prisma.faculty.findUnique({
            where: { id: parseInt(facultyId) }
        });

        if (!faculty) {
            await unlinkFile(req.file.path);
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'Faculty not found'
            });
        }

        if (faculty.collegeId !== collegeId) {
            await unlinkFile(req.file.path);
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Faculty does not belong to the specified college'
            });
        }

        // Verify module exists and belongs to the college
        const module = await prisma.module.findUnique({
            where: { id: parseInt(moduleId) }
        });

        if (!module) {
            await unlinkFile(req.file.path);
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'Module not found'
            });
        }

        if (module.collegeId !== collegeId) {
            await unlinkFile(req.file.path);
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Module does not belong to the specified college'
            });
        }

        // Upload file to Cloudinary with increased timeout handling
        const uploadResult = await uploadToCloudinary(req.file.path, {
            folder: `learnbox/colleges/${collegeId}/resources`,
            resource_type: 'auto',
            timeout: 120000 // 2 minutes timeout for large files
        });

        // Delete local file after successful upload
        await unlinkFile(req.file.path);

        // Save resource metadata to database
        const resource = await prisma.resource.create({
            data: {
                title,
                description: description || null,
                fileUrl: uploadResult.url,
                fileType: uploadResult.format,
                year: parseInt(year),
                facultyId: parseInt(facultyId),
                moduleId: parseInt(moduleId),
                collegeId: collegeId,
                uploadedBy: req.user.id
            },
            include: {
                uploader: {
                    select: {
                        id: true,
                        username: true,
                        first_name: true,
                        last_name: true,
                        role: true
                    }
                },
                module: {
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
            message: 'Resource uploaded successfully',
            data: resource
        });

    } catch (error) {
        console.error('Upload resource error:', error);
        
        // Clean up uploaded file if exists
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                await unlinkFile(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting file:', unlinkError);
            }
        }

        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: error.message || ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Filter resources based on query parameters (Student access)
 * @route GET /api/resources/filter
 * @access STUDENT
 */
export const filterResources = async (req, res) => {
    try {
        const { collegeId, facultyId, year, moduleId } = req.query;

        // Build where clause for filtering
        const whereClause = {};

        // Students can only access resources from their college
        if (req.user.role === ROLES.STUDENT) {
            if (!req.user.collegeId) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    error: 'Student must be associated with a college'
                });
            }
            whereClause.collegeId = req.user.collegeId;
        } else {
            // Admins can filter by collegeId
            if (collegeId) {
                whereClause.collegeId = parseInt(collegeId);
            }
        }

        // Apply optional filters
        if (facultyId) {
            whereClause.facultyId = parseInt(facultyId);
        }

        if (year) {
            whereClause.year = parseInt(year);
        }

        if (moduleId) {
            whereClause.moduleId = parseInt(moduleId);
        }

        // Fetch matching resources
        const resources = await prisma.resource.findMany({
            where: whereClause,
            select: {
                id: true,
                title: true,
                description: true,
                fileUrl: true,
                fileType: true,
                year: true,
                facultyId: true,
                createdAt: true,
                module: {
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
                college: {
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
            filters: {
                collegeId: whereClause.collegeId,
                facultyId: facultyId || null,
                year: year || null,
                moduleId: moduleId || null
            },
            data: resources
        });

    } catch (error) {
        console.error('Filter resources error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

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
