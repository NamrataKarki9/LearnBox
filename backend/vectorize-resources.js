/**
 * Vectorize All Resources Script
 * 
 * This script:
 * 1. Fetches all resources from the database
 * 2. Downloads and extracts text from each PDF
 * 3. Generates embeddings for the content
 * 4. Stores embeddings in Vectra for semantic search
 * 
 * Run: node vectorize-resources.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import getVectraIndex from './src/config/chroma.config.js';
import { generateEmbedding } from './src/services/embedding.service.js';
import { extractTextFromPDF, splitTextIntoChunks } from './src/services/pdf.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

/**
 * Clear existing vector database
 */
async function clearVectorDatabase() {
  const indexPath = path.join(__dirname, 'vectra_index');
  
  if (fs.existsSync(indexPath)) {
    console.log('🗑️  Removing existing vector database...');
    try {
      fs.rmSync(indexPath, { recursive: true, force: true });
      console.log('✅ Existing vector database cleared\n');
    } catch (error) {
      console.error('⚠️  Warning: Could not remove existing database:', error.message);
    }
  } else {
    console.log('📝 No existing vector database found (fresh start)\n');
  }
}

/**
 * Process a single resource and store its embeddings
 */
async function processResource(resource, index) {
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📚 Processing: ${resource.title} (ID: ${resource.id})`);
    console.log(`   URL: ${resource.fileUrl}`);
    
    // Extract text from PDF
    const text = await extractTextFromPDF(resource.fileUrl);
    
    if (!text || text.length < 50) {
      console.log(`⚠️  Skipping - insufficient text content (${text.length} chars)`);
      return { success: false, reason: 'insufficient_content' };
    }
    
    // Split text into chunks
    const chunks = splitTextIntoChunks(text, 1000, 200);
    console.log(`📊 Split into ${chunks.length} chunks`);
    
    // Generate embeddings for each chunk
    console.log(`🔮 Generating embeddings...`);
    
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
      
      if ((i + 1) % 10 === 0) {
        console.log(`   Processed ${i + 1}/${chunks.length} chunks`);
      }
    }
    
    console.log(`✅ Successfully processed resource ${resource.id}`);
    return { success: true, chunks: chunks.length };
    
  } catch (error) {
    console.error(`❌ Error processing resource ${resource.id}:`, error.message);
    return { success: false, reason: error.message };
  }
}

/**
 * Main vectorization function
 */
async function vectorizeAllResources() {
  console.log('\n🚀 Starting Resource Vectorization Process\n');
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    // Clear existing vector database
    await clearVectorDatabase();
    
    // Get or create Vectra index
    const index = await getVectraIndex();
    console.log('📦 Vector index ready\n');
    
    // Fetch all resources from database
    console.log('📂 Fetching resources from database...');
    const resources = await prisma.resource.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log(`📊 Found ${resources.length} resources to process\n`);
    
    if (resources.length === 0) {
      console.log('⚠️  No resources found in database. Upload some resources first!');
      return;
    }
    
    // Process each resource
    const results = {
      total: resources.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
    
    for (let i = 0; i < resources.length; i++) {
      const resource = resources[i];
      console.log(`\n[${i + 1}/${resources.length}]`);
      
      const result = await processResource(resource, index);
      
      if (result.success) {
        results.successful++;
      } else if (result.reason === 'insufficient_content') {
        results.skipped++;
      } else {
        results.failed++;
        results.errors.push({
          resourceId: resource.id,
          title: resource.title,
          error: result.reason
        });
      }
      
      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Print summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('\n📊 VECTORIZATION SUMMARY\n');
    console.log(`Total Resources: ${results.total}`);
    console.log(`✅ Successful: ${results.successful}`);
    console.log(`⚠️  Skipped: ${results.skipped}`);
    console.log(`❌ Failed: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(err => {
        console.log(`   - Resource ${err.resourceId} (${err.title}): ${err.error}`);
      });
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log('\n✨ Vectorization process completed!\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error during vectorization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
vectorizeAllResources()
  .then(() => {
    console.log('👋 Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
