/**
 * Search Routes
 * Semantic search endpoints
 */

import express from 'express';
import { performSemanticSearch, getSearchStatus } from '../controllers/search.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * POST /api/search/semantic
 * Perform semantic search on resources
 * Accepts: { query, facultyId?, year?, moduleId?, limit? }
 */
router.post('/semantic', authMiddleware, performSemanticSearch);

/**
 * GET /api/search/status
 * Get vector database status
 */
router.get('/status', authMiddleware, getSearchStatus);

export default router;
