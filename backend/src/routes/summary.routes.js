import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../constants/roles.js';
import { uploadSinglePDF, handleMulterError } from '../middleware/upload.middleware.js';
import {
  healthCheck,
  uploadAndSummarize,
  getDetailedSummary,
  getStudyNotes,
  askQuestion,
  getSummaryHistory,
  getSummaryById,
  deleteSummary
} from '../controllers/summary.controller.js';

const router = express.Router();

// Health check (no auth required)
router.get('/health', healthCheck);

// All other routes require authentication
router.use(authMiddleware);
router.use(requireRole([ROLES.STUDENT])); // Students only

// Upload and summarize
router.post('/upload', uploadSinglePDF, handleMulterError, uploadAndSummarize);

// Get history
router.get('/history', getSummaryHistory);

// Get single summary
router.get('/:id', getSummaryById);

// Get detailed summary
router.get('/:id/detailed', getDetailedSummary);

// Get study notes
router.get('/:id/notes', getStudyNotes);

// Ask question
router.post('/:id/question', askQuestion);

// Delete summary
router.delete('/:id', deleteSummary);

export default router;
