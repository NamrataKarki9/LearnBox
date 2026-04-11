/**
 * Audit Log Routes
 * API endpoints for audit log retrieval and analysis
 */

import express from 'express';
import {
  getAuditLogsHandler,
  getAuditStatsHandler,
  getRecentActivityHandler
} from '../controllers/audit-log.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// All audit log routes require authentication and SUPER_ADMIN role
router.use(authMiddleware);
router.use(requireRole(ROLES.SUPER_ADMIN));

// Get audit logs with filtering and pagination
router.get('/', getAuditLogsHandler);

// Get audit statistics
router.get('/stats', getAuditStatsHandler);

// Get recent activity count
router.get('/recent', getRecentActivityHandler);

export default router;
