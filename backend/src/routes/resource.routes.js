/**
 * Resource Routes - College-scoped with file upload support
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole, requireCollegeAccess } from '../middleware/role.middleware.js';
import { uploadSinglePDF, handleMulterError } from '../middleware/upload.middleware.js';
import { ROLES } from '../constants/roles.js';
import {
    getAllResources,
    createResource,
    updateResource,
    deleteResource,
    uploadResource,
    filterResources
} from '../controllers/resource.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/resources/upload
 * @desc    Upload resource with PDF file to Cloudinary
 * @access  SUPER_ADMIN, COLLEGE_ADMIN
 */
router.post(
    '/upload',
    requireRole([ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN]),
    uploadSinglePDF,
    handleMulterError,
    uploadResource
);

/**
 * @route   GET /api/resources/filter
 * @desc    Filter resources by college, faculty, year, module
 * @access  STUDENT (own college), COLLEGE_ADMIN, SUPER_ADMIN
 */
router.get(
    '/filter',
    requireRole([ROLES.STUDENT, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN]),
    filterResources
);

/**
 * @route   GET /api/resources
 * @desc    Get all resources (college-scoped)
 * @access  COLLEGE_ADMIN (own college), STUDENT (own college)
 */
router.get('/', requireCollegeAccess, getAllResources);

/**
 * @route   POST /api/resources
 * @desc    Create new resource (legacy endpoint without file upload)
 * @access  COLLEGE_ADMIN only
 */
router.post('/', requireRole(ROLES.COLLEGE_ADMIN), requireCollegeAccess, createResource);

/**
 * @route   PUT /api/resources/:id
 * @desc    Update resource
 * @access  COLLEGE_ADMIN (own college only)
 */
router.put('/:id', requireRole(ROLES.COLLEGE_ADMIN), requireCollegeAccess, updateResource);

/**
 * @route   DELETE /api/resources/:id
 * @desc    Delete resource
 * @access  COLLEGE_ADMIN (own college only)
 */
router.delete('/:id', requireRole(ROLES.COLLEGE_ADMIN), requireCollegeAccess, deleteResource);

export default router;
