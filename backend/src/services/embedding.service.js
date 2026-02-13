import { pipeline } from '@xenova/transformers';

let embeddingPipeline = null;

/**
 * Initialize the embedding pipeline
 * Uses a lightweight model that runs locally without API keys
 */
async function initializeEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log('🔧 Loading embedding model (this may take a moment on first run)...');
    // Using all-MiniLM-L6-v2 - a fast and efficient embedding model
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Embedding model loaded successfully');
  }
  return embeddingPipeline;
}

/**
 * Generate embeddings for a given text
 * @param {string} text - Text to generate embeddings for
 * @returns {Promise<number[]>} - Array of embeddings
 */
export async function generateEmbedding(text) {
  try {
    const pipeline = await initializeEmbeddingPipeline();
    const output = await pipeline(text, { pooling: 'mean', normalize: true });
    
    // Convert to regular array
    return Array.from(output.data);
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {string[]} texts - Array of texts
 * @returns {Promise<number[][]>} - Array of embedding arrays
 */
export async function generateEmbeddingsBatch(texts) {
  try {
    const embeddings = await Promise.all(
      texts.map(text => generateEmbedding(text))
    );
    return embeddings;
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    throw error;
  }
}
