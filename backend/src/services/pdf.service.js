import { createRequire } from 'module';
import https from 'https';
import http from 'http';
import { URL } from 'url';

const require = createRequire(import.meta.url);
// pdf-parse-fork is a working fork with proper module support
const pdfParser = require('pdf-parse-fork');

/**
 * Download PDF from URL
 * @param {string} url - URL of the PDF
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function downloadPDF(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        return downloadPDF(response.headers.location).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download PDF: ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Extract text content from PDF URL
 * @param {string} pdfUrl - URL of the PDF file
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromPDF(pdfUrl) {
  try {
    console.log(`📄 Downloading PDF from: ${pdfUrl}`);
    const pdfBuffer = await downloadPDF(pdfUrl);
    
    console.log(`🔍 Extracting text from PDF...`);
    const data = await pdfParser(pdfBuffer);
    
    // Clean up the extracted text
    const text = data.text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim();
    
    console.log(`✅ Extracted ${text.length} characters from PDF`);
    return text;
  } catch (error) {
    console.error(`❌ Error extracting text from PDF ${pdfUrl}:`, error.message);
    throw error;
  }
}

/**
 * Split text into chunks for better embedding
 * @param {string} text - Text to split
 * @param {number} chunkSize - Maximum size of each chunk (in characters)
 * @param {number} overlap - Number of characters to overlap between chunks
 * @returns {string[]} - Array of text chunks
 */
export function splitTextIntoChunks(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    const chunk = text.slice(startIndex, endIndex);
    
    chunks.push(chunk);
    
    // Move forward by (chunkSize - overlap) to create overlapping chunks
    startIndex += (chunkSize - overlap);
    
    // Break if we've reached the end
    if (endIndex === text.length) break;
  }
  
  return chunks;
}
