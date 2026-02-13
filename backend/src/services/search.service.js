/**
 * Semantic Search Service
 * Handles semantic search queries using Vectra and embeddings
 */

import getVectraIndex from '../config/chroma.config.js';
import { generateEmbedding } from './embedding.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Perform semantic search on resources
 * @param {string} query - Search query
 * @param {object} filters - Optional filters (facultyId, year, moduleId)
 * @param {number} limit - Maximum number of results (default: 10)
 * @returns {Promise<object[]>} - Array of matching resources with relevance scores
 */
export async function semanticSearch(query, filters = {}, limit = 10) {
  try {
    console.log('🔍 Performing semantic search for:', query);
    console.log('   Filters:', filters);
    
    // Get the Vectra index
    const index = await getVectraIndex();
    
    // Generate embedding for the search query
    console.log('🔮 Generating query embedding...');
    const queryEmbedding = await generateEmbedding(query);
    
    // Query Vectra for similar chunks
    console.log('🔎 Querying vector database...');
    const results = await index.queryItems(queryEmbedding, limit * 3);
    
    console.log(`   Found ${results.length} matching chunks`);
    
    // Group results by resource ID and aggregate scores
    const resourceScores = new Map();
    
    for (const result of results) {
      const metadata = result.item.metadata;
      
      // Apply filters
      if (filters.facultyId && filters.facultyId !== 'all' && metadata.facultyId !== filters.facultyId) continue;
      if (filters.year && filters.year !== 'all' && metadata.year !== filters.year) continue;
      if (filters.moduleId && filters.moduleId !== 'all' && metadata.moduleId !== filters.moduleId) continue;
      
      const resourceId = parseInt(metadata.resourceId);
      const score = result.score; // Vectra returns similarity score (higher = more similar)
      
      if (!resourceScores.has(resourceId)) {
        resourceScores.set(resourceId, {
          resourceId,
          title: metadata.title,
          description: metadata.description,
          fileUrl: metadata.fileUrl,
          fileType: metadata.fileType,
          year: parseInt(metadata.year) || null,
          facultyId: parseInt(metadata.facultyId) || null,
          moduleId: parseInt(metadata.moduleId) || null,
          maxScore: score,
          totalScore: score,
          chunkCount: 1,
          matchedChunks: [result.item.metadata.text?.substring(0, 200) + '...' || '']
        });
      } else {
        const existing = resourceScores.get(resourceId);
        existing.totalScore += score;
        existing.chunkCount += 1;
        existing.maxScore = Math.max(existing.maxScore, score);
        
        // Keep top 2 matching chunks
        if (existing.matchedChunks.length < 2 && result.item.metadata.text) {
          existing.matchedChunks.push(result.item.metadata.text.substring(0, 200) + '...');
        }
      }
    }
    
    // Convert to array and sort by relevance
    let rankedResources = Array.from(resourceScores.values())
      .map(resource => ({
        ...resource,
        // Average score weighted by max score
        relevanceScore: (resource.totalScore / resource.chunkCount) * 0.5 + resource.maxScore * 0.5
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
    
    // Fetch full resource details from database
    const resourceIds = rankedResources.map(r => r.resourceId);
    const fullResources = await prisma.resource.findMany({
      where: { id: { in: resourceIds } },
      include: {
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
        uploader: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });
    
    // Merge search results with full resource details
    const finalResults = rankedResources.map(searchResult => {
      const fullResource = fullResources.find(r => r.id === searchResult.resourceId);
      if (!fullResource) return null;
      
      return {
        ...fullResource,
        relevanceScore: searchResult.relevanceScore,
        matchedChunks: searchResult.matchedChunks,
        chunkCount: searchResult.chunkCount
      };
    }).filter(r => r !== null);
    
    console.log(`✅ Returning ${finalResults.length} unique resources`);
    
    return finalResults;
    
  } catch (error) {
    console.error('❌ Error performing semantic search:', error);
    throw error;
  }
}

/**
 * Check if the vector database is initialized and has data
 * @returns {Promise<object>} - Status information
 */
export async function getVectorDBStatus() {
  try {
    const index = await getVectraIndex();
    const items = await index.listItems();
    
    return {
      initialized: true,
      count: items.length,
      message: `Vector database ready with ${items.length} embedded chunks`
    };
  } catch (error) {
    console.error('Error checking vector DB status:', error);
    return {
      initialized: false,
      count: 0,
      error: error.message
    };
  }
}
