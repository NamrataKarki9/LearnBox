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
    const { query, facultyId, year, moduleId, limit = 10 } = req.body;
    
    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Build filters
    const filters = {};
    if (facultyId) filters.facultyId = facultyId;
    if (year) filters.year = year;
    if (moduleId) filters.moduleId = moduleId;
    
    // Perform semantic search
    const results = await semanticSearch(query.trim(), filters, parseInt(limit));
    
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
      error: error.message
    });
  }
};
