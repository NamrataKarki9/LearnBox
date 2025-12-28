/**
 * Resource Routes - College-scoped
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole, requireCollegeAccess } from '../middleware/role.middleware.js';
import { ROLES } from '../constants/roles.js';
import {
    getAllResources,
    createResource,
    updateResource,
    deleteResource
} from '../controllers/resource.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/resources
 * @desc    Get all resources (college-scoped)
 * @access  COLLEGE_ADMIN (own college), STUDENT (own college)
 */
router.get('/', requireCollegeAccess, getAllResources);

/**
 * @route   POST /api/resources
 * @desc    Create new resource
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
