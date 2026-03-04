/**
 * LLM Configuration Routes
 * SUPER_ADMIN only routes for managing AI configurations
 */

import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import {
  getAllConfigs,
  getActiveConfig,
  getConfigById,
  createConfig,
  updateConfig,
  deleteConfig,
  activateConfig
} from '../controllers/llm-config.controller.js';

const router = express.Router();

// All routes require authentication and SUPER_ADMIN role
router.use(authMiddleware);
router.use(requireRole(['SUPER_ADMIN']));

// Get all configurations
router.get('/', getAllConfigs);

// Get active configuration
router.get('/active', getActiveConfig);

// Get single configuration
router.get('/:id', getConfigById);

// Create new configuration
router.post('/', createConfig);

// Update configuration
router.put('/:id', updateConfig);

// Delete configuration
router.delete('/:id', deleteConfig);

// Activate configuration
router.post('/:id/activate', activateConfig);

export default router;
