import { extractTextFromPDF } from './pdf.service.js';

/**
 * Ollama API Configuration
 * Local LLM server running gemma3:1b
 */
const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL_NAME = process.env.OLLAMA_MODEL || 'gemma3:1b';

/**
 * Call Ollama API (no timeout - waits as long as needed)
 */
async function callOllama(prompt, maxTokens = 500) {
  try {
    console.log(`🤖 Calling Ollama (${MODEL_NAME}) with ${prompt.length} chars prompt (no timeout)`);
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt: prompt,
        stream: false,
        options: {
          num_predict: maxTokens,
          temperature: 0.3,
          top_p: 0.9,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Ollama error: ${response.status} - ${errorText}`);
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Ollama response received (${data.response?.length || 0} chars)`);
    return data.response;
  } catch (error) {
    console.error('❌ Ollama API error:', error.message);
    throw new Error(`Failed to connect to local LLM at ${OLLAMA_BASE_URL}. Make sure Ollama is running.`);
  }
}

/**
 * Generate quick summary (TL;DR)
 */
export async function generateQuickSummary(text) {
  const prompt = `You are a helpful academic assistant. Summarize the following document in 3-4 clear and concise sentences. Focus on the main topics and key takeaways.

Document:
${text.slice(0, 8000)}

Summary:`;
  
  return await callOllama(prompt, 250);
}

/**
 * Extract key concepts from document
 */
export async function extractKeyConcepts(text) {
  const prompt = `You are a helpful academic assistant. Extract 5-8 key concepts from this document. Return ONLY a valid JSON object in this exact format (no additional text):
{"concepts": [{"term": "concept name", "definition": "brief definition"}]}

Document:
${text.slice(0, 10000)}

JSON Response:`;
  
  const response = await callOllama(prompt, 600);
  
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
  const prompt = `You are a helpful academic assistant. Create a comprehensive summary of this document. Include:

1. Main Topics Covered
2. Key Concepts and Definitions
3. Important Details
4. Conclusions

Use clear headings and bullet points for better readability.

Document:
${text.slice(0, 12000)}

Detailed Summary:`;
  
  return await callOllama(prompt, 1000);
}

/**
 * Generate structured study notes
 */
export async function generateStudyNotes(text) {
  const prompt = `You are a helpful academic assistant. Convert this document into structured study notes. Use a hierarchical format with:
- Main topics (numbered)
- Subtopics (lettered)
- Key points (bulleted)

Make it easy to scan and study from.

Document:
${text.slice(0, 10000)}

Study Notes:`;
  
  return await callOllama(prompt, 800);
}

/**
 * Answer question about document
 */
export async function answerQuestion(text, question) {
  const prompt = `You are a helpful academic assistant. Based on the document below, answer the following question concisely and accurately. If the answer is not in the document, say so.

Document:
${text.slice(0, 10000)}

Question: ${question}

Answer:`;
  
  return await callOllama(prompt, 300);
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
