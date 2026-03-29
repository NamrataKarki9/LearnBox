import { extractTextFromPDF } from './pdf.service.js';
import { callLLM, getLLMInfo } from './llm.service.js';

/**
 * Call LLM for summarization (uses active configuration)
 */
async function callLLMForSummary(prompt, maxTokens = 500) {
  try {
    const info = await getLLMInfo();
    console.log(`🤖 Calling ${info.provider} (${info.model}) for summarization`);
    
    return await callLLM(prompt, maxTokens);
  } catch (error) {
    console.error('❌ LLM API error:', error.message);
    
    // Provide user-friendly error for rate limits
    if (error.message.includes('rate limit')) {
      throw new Error('API rate limit reached. Please wait a moment before generating more summaries.');
    }
    if (error.message.includes('quota')) {
      throw new Error('API quota exhausted. Please check your LLM configuration or upgrade your plan.');
    }
    
    throw new Error(`Failed to connect to LLM: ${error.message}`);
  }
}

/**
 * Generate quick summary (TL;DR)
 */
export async function generateQuickSummary(text) {
  const prompt = `Summarize in 8-10 sentences. Main topics and key takeaways:

${text.slice(0, 5000)}

Summary:`;
  
  return await callLLMForSummary(prompt, 250);
}

/**
 * Extract key concepts from document
 */
export async function extractKeyConcepts(text) {
  const prompt = `Extract 5-8 key concepts. Return JSON only:
{"concepts": [{"term": "name", "definition": "definition"}]}

${text.slice(0, 6000)}

JSON:`;
  
  const response = await callLLMForSummary(prompt, 500);
  
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*"concepts"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }
    
    // If no JSON found, return empty concepts
    console.warn('⚠️ Failed to parse key concepts from LLM response:', response.slice(0, 200));
    return { concepts: [] };
  } catch (error) {
    console.error('❌ Error parsing key concepts:', error.message);
    return { concepts: [] };
  }
}

/**
 * Generate detailed summary
 */
export async function generateDetailedSummary(text) {
  const prompt = `Create comprehensive summary:
1. Main Topics
2. Key Concepts
3. Important Details
4. Conclusions

${text.slice(0, 7000)}

Summary:`;
  
  return await callLLMForSummary(prompt, 800);
}

/**
 * Generate structured study notes
 */
export async function generateStudyNotes(text) {
  const prompt = `Convert to structured study notes:
- Main topics (numbered)
- Subtopics (lettered)
- Key points (bulleted)

${text.slice(0, 6000)}

Notes:`;
  
  return await callLLMForSummary(prompt, 700);
}

/**
 * Answer question about document
 */
export async function answerQuestion(text, question) {
  const prompt = `Based on this document, answer the question. If not in document, say so.

${text.slice(0, 6000)}

Q: ${question}

A:`;
  
  return await callLLMForSummary(prompt, 300);
}

/**
 * Process document and generate all summaries
 * @deprecated Use processDocumentFromText instead
 */
export async function processDocument(fileUrl, userId, fileName) {
  const startTime = Date.now();
  
  console.log(`📄 Processing document: ${fileName}`);
  
  try {
    // Extract text from PDF
    console.log('🔍 Extracting text from PDF...');
    const text = await extractTextFromPDF(fileUrl);
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    console.log(`✅ Extracted ${text.length} characters`);
    
    // Generate summaries in parallel
    console.log('🤖 Generating summaries with local LLM...');
    const [quickSummary, keyConcepts] = await Promise.all([
      generateQuickSummary(text),
      extractKeyConcepts(text)
    ]);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Processing complete in ${(processingTime / 1000).toFixed(2)}s`);
    
    return {
      quickSummary: quickSummary.trim(),
      keyConcepts,
      processingTime,
      text // Store for future Q&A
    };
  } catch (error) {
    console.error('Document processing error:', error);
    throw error;
  }
}

/**
 * Process document from pre-extracted text
 * @param {string} text - Pre-extracted text from PDF
 * @param {string} fileName - Original filename for logging
 * @returns {Promise<object>} Processing result with summaries
 */
export async function processDocumentFromText(text, fileName) {
  const startTime = Date.now();
  
  console.log(`📄 Processing document: ${fileName}`);
  
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('No text content provided');
    }
    
    console.log(`📝 Processing ${text.length} characters of text`);
    
    // Generate summaries in parallel
    console.log('🤖 Generating summaries with local LLM...');
    const [quickSummary, keyConcepts] = await Promise.all([
      generateQuickSummary(text),
      extractKeyConcepts(text)
    ]);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Processing complete in ${(processingTime / 1000).toFixed(2)}s`);
    
    return {
      quickSummary: quickSummary.trim(),
      keyConcepts,
      processingTime,
      text // Store for future Q&A
    };
  } catch (error) {
    console.error('Document processing error:', error);
    throw error;
  }
}

/**
 * Health check for Ollama service
 */
export async function checkOllamaHealth() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      return { 
        healthy: false, 
        error: `Ollama returned status ${response.status}` 
      };
    }
    
    const data = await response.json();
    const modelExists = data.models?.some(m => m.name.includes(MODEL_NAME.split(':')[0]));
    
    if (!modelExists) {
      return {
        healthy: false,
        error: `Model '${MODEL_NAME}' not found. Available models: ${data.models?.map(m => m.name).join(', ')}`
      };
    }
    
    return { 
      healthy: true, 
      models: data.models?.map(m => m.name),
      activeModel: MODEL_NAME
    };
  } catch (error) {
    return { 
      healthy: false, 
      error: `Cannot connect to Ollama at ${OLLAMA_BASE_URL}. Make sure it's running.` 
    };
  }
}
