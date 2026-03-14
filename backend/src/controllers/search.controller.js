/**
 * Search Controller
 * Handles semantic search requests
 */

import { semanticSearch, getVectorDBStatus } from '../services/search.service.js';

/**
 * Perform semantic search on resources
 * POST /api/search/semantic
 */
export const performSemanticSearch = async (req, res) => {
  try {
    // Validate user authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const { query, facultyId, year, moduleId, limit = 10 } = req.body;
    
    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required and must be a non-empty string',
        field: 'query'
      });
    }

    if (query.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be less than 1000 characters',
        field: 'query'
      });
    }
    
    // Validate limit parameter
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be a number between 1 and 100',
        field: 'limit'
      });
    }
    
    // Build and validate filters
    const filters = {};
    if (facultyId) {
      const parsedFacultyId = parseInt(facultyId);
      if (isNaN(parsedFacultyId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid faculty ID format',
          field: 'facultyId'
        });
      }
      filters.facultyId = parsedFacultyId;
    }
    if (year) {
      const parsedYear = parseInt(year);
      if (isNaN(parsedYear) || parsedYear < 1 || parsedYear > 4) {
        return res.status(400).json({
          success: false,
          message: 'Year must be a number between 1 and 4',
          field: 'year'
        });
      }
      filters.year = parsedYear;
    }
    if (moduleId) {
      const parsedModuleId = parseInt(moduleId);
      if (isNaN(parsedModuleId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid module ID format',
          field: 'moduleId'
        });
      }
      filters.moduleId = parsedModuleId;
    }
    
    // Perform semantic search
    const results = await semanticSearch(query.trim(), filters, parsedLimit);
    
    return res.status(200).json({
      success: true,
      data: results,
      count: results.length,
      query: query.trim(),
      filters
    });
    
  } catch (error) {
    console.error('Error in semantic search:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error performing semantic search',
      error: error.message
    });
  }
};

/**
 * Get vector database status
 * GET /api/search/status
 */
export const getSearchStatus = async (req, res) => {
  try {
    // Validate user authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const status = await getVectorDBStatus();
    
    return res.status(200).json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error('Error getting search status:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Error getting search status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
