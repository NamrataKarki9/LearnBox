/**
 * MCQ Routes - College-scoped
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole, requireCollegeAccess } from '../middleware/role.middleware.js';
import { uploadPDFForMCQ, handleMulterError } from '../middleware/upload.middleware.js';
import { ROLES } from '../constants/roles.js';
import {
    getAllMCQs,
    createMCQ,
    attemptMCQ,
    getMyAttempts,
    bulkUploadMCQs,
    generateMCQsFromPDFController,
    getAdaptiveQuestions,
    getMCQSets,
    getMCQSetById
} from '../controllers/mcq.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/mcqs
 * @desc    Get all MCQs (college-scoped)
 * @access  COLLEGE_ADMIN (own college), STUDENT (own college)
 */
router.get('/', requireCollegeAccess, getAllMCQs);

/**
 * @route   GET /api/mcqs/sets
 * @desc    Get all MCQ sets
 * @access  STUDENT, COLLEGE_ADMIN
 */
router.get('/sets', requireCollegeAccess, getMCQSets);

/**
 * @route   GET /api/mcqs/sets/:id
 * @desc    Get MCQ set by ID with questions
 * @access  STUDENT, COLLEGE_ADMIN
 */
router.get('/sets/:id', requireCollegeAccess, getMCQSetById);

/**
 * @route   GET /api/mcqs/adaptive
 * @desc    Get adaptive questions based on weak areas
 * @access  STUDENT
 */
router.get('/adaptive', requireRole(ROLES.STUDENT), getAdaptiveQuestions);

/**
 * @route   GET /api/mcqs/attempts/me
 * @desc    Get my MCQ attempts
 * @access  STUDENT
 */
router.get('/attempts/me', requireRole(ROLES.STUDENT), getMyAttempts);

/**
 * @route   POST /api/mcqs
 * @desc    Create new MCQ
 * @access  COLLEGE_ADMIN only
 */
router.post('/', requireRole(ROLES.COLLEGE_ADMIN), requireCollegeAccess, createMCQ);

/**
 * @route   POST /api/mcqs/bulk
 * @desc    Bulk upload MCQs
 * @access  COLLEGE_ADMIN only
 */
router.post('/bulk', requireRole(ROLES.COLLEGE_ADMIN), requireCollegeAccess, bulkUploadMCQs);

/**
 * @route   POST /api/mcqs/upload-and-generate
 * @desc    Upload PDF and generate MCQs (for students)
 * @access  STUDENT, COLLEGE_ADMIN
 */
router.post('/upload-and-generate', requireCollegeAccess, uploadPDFForMCQ, handleMulterError, generateMCQsFromPDFController);

/**
 * @route   POST /api/mcqs/generate-from-pdf
 * @desc    Generate MCQs from existing PDF URL using AI
 * @access  STUDENT, COLLEGE_ADMIN
 */
router.post('/generate-from-pdf', requireCollegeAccess, generateMCQsFromPDFController);

/**
 * @route   POST /api/mcqs/:id/attempt
 * @desc    Attempt an MCQ
 * @access  STUDENT only
 */
router.post('/:id/attempt', requireRole(ROLES.STUDENT), requireCollegeAccess, attemptMCQ);

export default router;
