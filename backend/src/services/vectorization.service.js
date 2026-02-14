/**
 * Vectorization Service
 * Handles automatic vectorization of resources for semantic search
 */

import getVectraIndex from '../config/chroma.config.js';
import { generateEmbedding } from './embedding.service.js';
import { extractTextFromPDF, splitTextIntoChunks } from './pdf.service.js';

/**
 * Vectorize a single resource and add to search index
 * @param {object} resource - Resource object from database
 * @returns {Promise<object>} - Result with success status and metadata
 */
export async function vectorizeResource(resource) {
  try {
    console.log(`🔮 Auto-vectorizing resource: ${resource.title} (ID: ${resource.id})`);
    
    // Get vector index
    const index = await getVectraIndex();
    
    // Extract text from PDF
    const text = await extractTextFromPDF(resource.fileUrl);
    
    if (!text || text.length < 50) {
      console.log(`⚠️  Skipping vectorization - insufficient text content (${text.length} chars)`);
      return { 
        success: false, 
        reason: 'insufficient_content',
        chunks: 0 
      };
    }
    
    // Split text into chunks
    const chunks = splitTextIntoChunks(text, 1000, 200);
    console.log(`📊 Split into ${chunks.length} chunks`);
    
    // Generate embeddings for each chunk and add to index
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);
      
      const itemId = `resource_${resource.id}_chunk_${i}`;
      const metadata = {
        resourceId: resource.id.toString(),
        title: resource.title,
        description: resource.description || '',
        fileUrl: resource.fileUrl,
        fileType: resource.fileType,
        year: resource.year?.toString() || '',
        facultyId: resource.facultyId?.toString() || '',
        moduleId: resource.moduleId?.toString() || '',
        chunkIndex: i.toString(),
        totalChunks: chunks.length.toString(),
        text: chunk
      };
      
      // Add item to Vectra index
      await index.insertItem({
        id: itemId,
        vector: embedding,
        metadata
      });
    }
    
    console.log(`✅ Successfully vectorized resource ${resource.id} (${chunks.length} chunks)`);
    return { 
      success: true, 
      chunks: chunks.length 
    };
    
  } catch (error) {
    console.error(`❌ Error vectorizing resource ${resource.id}:`, error.message);
    return { 
      success: false, 
      reason: error.message,
      chunks: 0 
    };
  }
}

/**
 * Remove vectorized chunks for a resource from search index
 * @param {number} resourceId - Resource ID
 * @returns {Promise<object>} - Result with success status
 */
export async function devectorizeResource(resourceId) {
  try {
    console.log(`🗑️  Removing vectors for resource: ${resourceId}`);
    
    const index = await getVectraIndex();
    
    // List all items in the index
    const items = await index.listItems();
    
    // Find and delete all chunks for this resource
    let deletedCount = 0;
    for (const item of items) {
      if (item.id.startsWith(`resource_${resourceId}_chunk_`)) {
        await index.deleteItem(item.id);
        deletedCount++;
      }
    }
    
    console.log(`✅ Removed ${deletedCount} vector chunks for resource ${resourceId}`);
    return { 
      success: true, 
      deletedCount 
    };
    
  } catch (error) {
    console.error(`❌ Error devectorizing resource ${resourceId}:`, error.message);
    return { 
      success: false, 
      reason: error.message 
    };
  }
}

/**
 * Re-vectorize a resource (update existing vectors)
 * @param {object} resource - Updated resource object from database
 * @returns {Promise<object>} - Result with success status
 */
export async function revectorizeResource(resource) {
  try {
    console.log(`🔄 Re-vectorizing resource: ${resource.title} (ID: ${resource.id})`);
    
    // Remove old vectors
    await devectorizeResource(resource.id);
    
    // Add new vectors
    const result = await vectorizeResource(resource);
    
    return result;
    
  } catch (error) {
    console.error(`❌ Error re-vectorizing resource ${resource.id}:`, error.message);
    return { 
      success: false, 
      reason: error.message 
    };
  }
}
