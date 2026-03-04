/**
 * LLM Service - Centralized LLM interaction
 * Supports both Ollama (local) and Groq (cloud) based on database configuration
 */

import prisma from '../prisma.js';

/**
 * Get active LLM configuration from database
 */
export async function getActiveLLMConfig() {
  try {
    const config = await prisma.lLMConfig.findFirst({
      where: { isActive: true }
    });

    // If no config found, return default Ollama config
    if (!config) {
      console.warn('⚠️  No active LLM config found, using default Ollama settings');
      return {
        provider: 'OLLAMA',
        ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
        ollamaModel: process.env.OLLAMA_MODEL || 'gemma3:1b',
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9
      };
    }

    return config;
  } catch (error) {
    console.error('❌ Error fetching active LLM config:', error);
    // Return default config on error
    return {
      provider: 'OLLAMA',
      ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
      ollamaModel: process.env.OLLAMA_MODEL || 'gemma3:1b',
      temperature: 0.7,
      maxTokens: 1000,
      topP: 0.9
    };
  }
}

/**
 * Call Ollama API
 */
async function callOllama(config, prompt, maxTokens) {
  try {
    console.log(`🤖 Using LLM: Ollama Local Server`);
    console.log(`📋 Model: ${config.ollamaModel}`);
    console.log(`🌐 URL: ${config.ollamaUrl}`);
    console.log(`🎛️  Temperature: ${config.temperature}, Max Tokens: ${maxTokens || config.maxTokens}, Top-P: ${config.topP}`);
    
    const response = await fetch(`${config.ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.ollamaModel,
        prompt: prompt,
        stream: false,
        options: {
          num_predict: maxTokens || config.maxTokens,
          temperature: config.temperature,
          top_p: config.topP,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Ollama error: ${response.status} - ${errorText}`);
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Ollama responded successfully with ${data.response?.length || 0} characters`);
    return data.response;
  } catch (error) {
    console.error('❌ Ollama API error:', error.message);
    throw new Error(`Failed to connect to Ollama at ${config.ollamaUrl}: ${error.message}`);
  }
}

/**
 * Call Groq API with streaming support
 */
async function callGroq(config, prompt, maxTokens) {
  try {
    console.log(`🤖 Using LLM: Groq Cloud API`);
    console.log(`📋 Model: ${config.groqModel}`);
    console.log(`🎛️  Temperature: ${config.temperature}, Max Tokens: ${maxTokens || config.maxTokens}, Top-P: ${config.topP}`);
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.groqApiKey}`
      },
      body: JSON.stringify({
        model: config.groqModel,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.temperature,
        max_tokens: maxTokens || config.maxTokens,
        top_p: config.topP,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      
      if (response.status === 429) {
        console.error(`🚫 Groq API Rate Limit Exceeded!`);
        console.error(`❌ Error Details:`, errorData);
        throw new Error('Groq API rate limit exceeded. Please try again later or upgrade your plan.');
      }
      
      if (response.status === 402 || (errorData.error && errorData.error.type === 'insufficient_quota')) {
        console.error(`💳 Groq API Quota Exhausted!`);
        console.error(`❌ Error Details:`, errorData);
        throw new Error('Groq API quota exhausted. Please check your billing and usage limits.');
      }
      
      console.error(`❌ Groq API error: ${response.status}`);
      console.error(`❌ Error Details:`, errorData);
      throw new Error(`Groq API error (${response.status}): ${errorData.error?.message || errorData.message || errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    console.log(`✅ Groq responded successfully with ${content.length} characters`);
    return content;
  } catch (error) {
    console.error('❌ Groq API error:', error.message);
    
    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      throw error;
    }
    
    throw new Error(`Failed to connect to Groq: ${error.message}`);
  }
}

/**
 * Universal LLM call - automatically uses the active configuration
 * @param {string} prompt - The prompt to send to the LLM
 * @param {number} maxTokens - Maximum tokens to generate (optional, uses config default)
 * @returns {Promise<string>} - The LLM response
 */
export async function callLLM(prompt, maxTokens = null) {
  const config = await getActiveLLMConfig();
  
  if (config.provider === 'GROQ') {
    return callGroq(config, prompt, maxTokens);
  } else {
    return callOllama(config, prompt, maxTokens);
  }
}

/**
 * Get current LLM configuration info (for logging/debugging)
 */
export async function getLLMInfo() {
  const config = await getActiveLLMConfig();
  
  if (config.provider === 'GROQ') {
    return {
      provider: 'Groq (Cloud)',
      model: config.groqModel,
      temperature: config.temperature,
      maxTokens: config.maxTokens
    };
  } else {
    return {
      provider: 'Ollama (Local)',
      model: config.ollamaModel,
      url: config.ollamaUrl,
      temperature: config.temperature,
      maxTokens: config.maxTokens
    };
  }
}

/**
 * Extract structured MCQs from document text using LLM
 * @param {string} documentText - The text extracted from PDF/Word document
 * @returns {Promise<Array>} - Array of parsed MCQ objects
 */
export async function extractMCQsFromText(documentText) {
  try {
    console.log(`🔍 Extracting MCQs from document (${documentText.length} characters)`);
    
    const prompt = `You are an expert at extracting multiple choice questions from documents.

Extract ALL multiple choice questions (MCQs) from the following text and return them as a JSON array.

For each question, identify:
- The question text
- All answer options (A, B, C, D or a, b, c, d)
- The correct answer
- Any explanation (if provided)
- Difficulty level (EASY, MEDIUM, or HARD - estimate based on complexity)
- Topic/subject (if mentioned)

IMPORTANT:
1. Return ONLY a valid JSON array, no other text
2. Each question must have exactly 4 options
3. correctAnswer should be just the answer text, not the letter
4. If no difficulty is specified, estimate it based on question complexity
5. If no topic is specified, try to infer it from context

Example format:
[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "correctAnswer": "Paris",
    "explanation": "Paris is the capital and largest city of France",
    "difficulty": "EASY",
    "topic": "Geography"
  }
]

Document text:
${documentText}

Extract all MCQs and return only the JSON array:`;

    const response = await callLLM(prompt, 4000);
    
    // Try to extract JSON from response
    let jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      // Try to find JSON between code blocks
      jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        jsonMatch = jsonMatch[1].match(/\[[\s\S]*\]/);
      }
    }
    
    if (!jsonMatch) {
      console.error('❌ No valid JSON array found in LLM response');
      console.log('Response:', response);
      return [];
    }

    const mcqs = JSON.parse(jsonMatch[0]);
    
    // Validate and clean MCQs
    const validMCQs = mcqs.filter(mcq => {
      return mcq.question && 
             Array.isArray(mcq.options) && 
             mcq.options.length === 4 &&
             mcq.correctAnswer;
    }).map(mcq => ({
      question: mcq.question.trim(),
      options: mcq.options.map(opt => opt.trim()),
      correctAnswer: mcq.correctAnswer.trim(),
      explanation: mcq.explanation?.trim() || undefined,
      difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(mcq.difficulty) ? mcq.difficulty : 'MEDIUM',
      topic: mcq.topic?.trim() || undefined
    }));

    console.log(`✅ Successfully extracted ${validMCQs.length} valid MCQs`);
    return validMCQs;
    
  } catch (error) {
    console.error('❌ Error extracting MCQs from text:', error);
    throw new Error(`Failed to extract MCQs: ${error.message}`);
  }
}
