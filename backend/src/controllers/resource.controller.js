/**
 * Resource Management Controller
 * Handles college-scoped resource operations with Cloudinary integration
 */

import prisma from '../prisma.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/errors.js';
import { ROLES } from '../constants/roles.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.config.js';
import { vectorizeResource, revectorizeResource, devectorizeResource } from '../services/vectorization.service.js';
import fs from 'fs';
import { promisify } from 'util';
import https from 'https';
import path from 'path';

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

        // [FIX]: Rename file to .dat to bypass Cloudinary PDF restrictions
        const originalExt = path.extname(req.file.originalname).toLowerCase();
        // Keep original name but append .dat
        const tempPath = req.file.path + '.dat'; 
        await fs.promises.rename(req.file.path, tempPath);

        // Upload file to Cloudinary with increased timeout handling
        const uploadResult = await uploadToCloudinary(tempPath, {
            folder: `learnbox/colleges/${collegeId}/resources`,
            timeout: 120000, // 2 minutes timeout for large files
            resource_type: 'raw', // Enforce raw
            use_filename: true, // Use the .dat filename
            format: '' // Do not convert
        });

        // Delete local file after successful upload
        await unlinkFile(tempPath);

        // Save resource metadata to database
        const resource = await prisma.resource.create({
            data: {
                title,
                description: description || null,
                fileUrl: uploadResult.url, 
                // Store ORIGINAL extension (e.g. 'pdf') not 'dat'
                fileType: originalExt.replace('.', ''),
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

        // Auto-vectorize the resource for semantic search (non-blocking)
        // This runs in the background and won't block the response
        vectorizeResource(resource).catch(err => {
            console.error('⚠️  Background vectorization failed for resource', resource.id, ':', err.message);
            // Vectorization failure doesn't affect the upload success
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
                moduleId: true,
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
                },
                uploader: {
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
        
        // Ensure user is authenticated
        if (!req.user) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
                error: ERROR_MESSAGES.UNAUTHORIZED 
            });
        }

        const whereClause = {};
        
        // Handle Role-Based Access
        if (req.user.role !== ROLES.SUPER_ADMIN) {
             // For College Admin and Student, collegeId is required
             if (!req.user.collegeId) {
                 // Should not happen for valid users, but safe fallack
                 return res.status(HTTP_STATUS.OK).json({
                     success: true,
                     count: 0,
                     data: []
                 });
             }
             whereClause.collegeId = req.user.collegeId;
        }

        // Handle Module Filter
        if (moduleId) {
            const parsedModuleId = parseInt(moduleId);
            if (!isNaN(parsedModuleId)) {
                whereClause.moduleId = parsedModuleId;
            }
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
        // Pass error to global handler if headers not sent
        if (!res.headersSent) {
             res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: ERROR_MESSAGES.DATABASE_ERROR,
                details: error.message
            });
        }
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
            data: updateData,
            include: {
                module: true,
                faculty: true,
                college: true
            }
        });

        // Re-vectorize if file content changed (fileUrl or fileType updated)
        if (fileUrl || fileType) {
            revectorizeResource(resource).catch(err => {
                console.error('⚠️  Background re-vectorization failed for resource', resource.id, ':', err.message);
            });
        }

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

        // Remove vectors from search index before deleting
        devectorizeResource(parseInt(id)).catch(err => {
            console.error('⚠️  Failed to remove vectors for resource', id, ':', err.message);
        });

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


/**
 * Proxy download of resource file
 * @route GET /api/resources/:id/download
 * @access Public
 */
export const downloadResource = async (req, res) => {
    try {
        const resourceId = parseInt(req.params.id);
        
        const resource = await prisma.resource.findUnique({
            where: { id: resourceId }
        });

        if (!resource) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'Resource not found'
            });
        }

        // Fetch file from Cloudinary (even if .dat)
        https.get(resource.fileUrl, (response) => {
            if (response.statusCode !== 200) {
                return res.status(response.statusCode).json({
                    error: 'Failed to fetch file from storage'
                });
            }

            // Set content type based on original type
            const mimeType = resource.fileType === 'pdf' ? 'application/pdf' : 
                             resource.fileType === 'doc' ? 'application/msword' :
                             resource.fileType === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                             'application/octet-stream';
            
            res.setHeader('Content-Type', mimeType);
            
            // Clean title for filename
            const filename = (resource.title || 'download').replace(/[^a-z0-9]/gi, '_');
            const ext = resource.fileType || 'pdf';
            
            res.setHeader('Content-Disposition', `inline; filename="${filename}.${ext}"`);
            
            response.pipe(res);
        }).on('error', (err) => {
            console.error('Download proxy error:', err);
            res.status(500).json({ error: 'Download failed' });
        });

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
