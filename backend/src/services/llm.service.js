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
