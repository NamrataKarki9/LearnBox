/**
 * MCQ Generation Service
 * Uses configured LLM (Ollama or Groq) to generate MCQs from PDF content
 */

import { extractTextFromPDF, extractTextFromLocalPDF } from './pdf.service.js';
import { callLLM, getLLMInfo } from './llm.service.js';
import fs from 'fs';

/**
 * Sleep utility for rate limit handling
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Intelligently chunk text into smaller segments
 * Tries to break at paragraph boundaries when possible
 */
function chunkText(text, maxChunkSize = 3500) {
  const chunks = [];
  
  // Split by paragraphs (double newline or single newline)
  const paragraphs = text.split(/\n\n+|\n/);
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;
    
    // If adding this paragraph would exceed the limit
    if (currentChunk.length + trimmedParagraph.length + 1 > maxChunkSize) {
      // Save current chunk if it has content
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // If a single paragraph is too large, split it by sentences
      if (trimmedParagraph.length > maxChunkSize) {
        const sentences = trimmedParagraph.match(/[^.!?]+[.!?]+/g) || [trimmedParagraph];
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > maxChunkSize) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = sentence;
          } else {
            currentChunk += ' ' + sentence;
          }
        }
      } else {
        currentChunk = trimmedParagraph;
      }
    } else {
      currentChunk += (currentChunk ? '\n' : '') + trimmedParagraph;
    }
  }
  
  // Add the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  // If no chunks were created, just split by character limit
  if (chunks.length === 0) {
    for (let i = 0; i < text.length; i += maxChunkSize) {
      chunks.push(text.slice(i, i + maxChunkSize));
    }
  }
  
  return chunks;
}

/**
 * Call LLM for MCQ generation (uses active configuration)
 */
async function callLLMForMCQ(prompt, maxTokens = 1000) {
  try {
    const info = await getLLMInfo();
    console.log(`🤖 Calling ${info.provider} (${info.model}) for MCQ generation`);
    
    return await callLLM(prompt, maxTokens);
  } catch (error) {
    console.error('❌ LLM API error:', error.message);
    throw error;
  }
}

/**
 * Parse MCQ JSON response from LLM
 */
function parseMCQResponse(response) {
  try {
    console.log('🔍 Attempting to parse LLM response...');
    
    // Clean the response - remove any markdown code blocks
    let cleanedResponse = response.trim();
    cleanedResponse = cleanedResponse.replace(/```json\s*/gi, '');
    cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
    
    // Method 1: Try to find JSON object with mcqs array
    const jsonObjectMatch = cleanedResponse.match(/\{[\s\S]*?"mcqs"[\s\S]*?\[[\s\S]*?\][\s\S]*?\}/);
    if (jsonObjectMatch) {
      try {
        const jsonStr = jsonObjectMatch[0];
        console.log('📝 Found JSON object, attempting to parse...');
        const parsed = JSON.parse(jsonStr);
        if (parsed.mcqs && Array.isArray(parsed.mcqs)) {
          console.log(`✅ Successfully parsed ${parsed.mcqs.length} MCQs from object format`);
          return parsed.mcqs;
        }
      } catch (err) {
        console.warn('⚠️ Failed to parse as object format:', err.message);
      }
    }

    // Method 2: Try to find a standalone array
    const arrayMatch = cleanedResponse.match(/\[\s*\{[\s\S]*?\}\s*\]/);
    if (arrayMatch) {
      try {
        console.log('📝 Found JSON array, attempting to parse...');
        const parsed = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsed)) {
          console.log(`✅ Successfully parsed ${parsed.length} MCQs from array format`);
          return parsed;
        }
      } catch (err) {
        console.warn('⚠️ Failed to parse as array format:', err.message);
      }
    }

    // Method 3: Try to parse the entire cleaned response
    try {
      console.log('📝 Attempting to parse entire response as JSON...');
      const parsed = JSON.parse(cleanedResponse);
      if (parsed.mcqs && Array.isArray(parsed.mcqs)) {
        console.log(`✅ Successfully parsed ${parsed.mcqs.length} MCQs from entire response`);
        return parsed.mcqs;
      }
      if (Array.isArray(parsed)) {
        console.log(`✅ Successfully parsed ${parsed.length} MCQs from array response`);
        return parsed;
      }
    } catch (err) {
      console.warn('⚠️ Failed to parse entire response:', err.message);
    }

    // Method 4: Try to extract JSON more aggressively
    // Find the first { or [ and the last } or ]
    const firstBrace = cleanedResponse.indexOf('{');
    const firstBracket = cleanedResponse.indexOf('[');
    const lastBrace = cleanedResponse.lastIndexOf('}');
    const lastBracket = cleanedResponse.lastIndexOf(']');
    
    let startIdx = -1;
    let endIdx = -1;
    
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = lastBrace + 1;
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = lastBracket + 1;
    }
    
    if (startIdx !== -1 && endIdx > startIdx) {
      try {
        const extractedJson = cleanedResponse.substring(startIdx, endIdx);
        console.log('📝 Attempting aggressive JSON extraction...');
        const parsed = JSON.parse(extractedJson);
        if (parsed.mcqs && Array.isArray(parsed.mcqs)) {
          console.log(`✅ Successfully parsed ${parsed.mcqs.length} MCQs from extracted JSON`);
          return parsed.mcqs;
        }
        if (Array.isArray(parsed)) {
          console.log(`✅ Successfully parsed ${parsed.length} MCQs from extracted array`);
          return parsed;
        }
      } catch (err) {
        console.warn('⚠️ Aggressive extraction failed:', err.message);
      }
    }

    console.error('❌ All parsing methods failed');
    console.log('📄 Response preview:', cleanedResponse.substring(0, 500));
    return [];
  } catch (error) {
    console.error('❌ Error parsing MCQs:', error.message);
    console.error('📄 Response causing error:', response.substring(0, 500));
    return [];
  }
}

/**
 * Generate MCQs from PDF content
 * @param {string} pdfUrl - URL of the PDF file
 * @param {Object} options - Generation options
 * @returns {Promise<Array>} Array of generated MCQs
 */
export async function generateMCQsFromPDF(pdfUrl, options = {}) {
  const {
    count = 10,
    difficulty = 'MEDIUM',
    topic = null,
    includeExplanations = true
  } = options;

  try {
    // Extract text from PDF
    console.log('📄 Extracting text from PDF...');
    console.log('📍 PDF path:', pdfUrl);
    
    // Check if pdfUrl is a local file path or a URL
    let pdfText;
    if (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://')) {
      // It's a URL, download and extract
      console.log('🌐 Detected URL, downloading PDF...');
      pdfText = await extractTextFromPDF(pdfUrl);
    } else {
      // It's a local file path (from file upload)
      console.log('📁 Detected local file, reading from disk...');
      pdfText = await extractTextFromLocalPDF(pdfUrl);
    }
    
    console.log(`✅ Extracted ${pdfText.length} characters from PDF`);
    
    if (!pdfText || pdfText.length < 100) {
      throw new Error('PDF content too short to generate meaningful MCQs');
    }

    // Intelligently chunk the text to avoid overwhelming the LLM
    const chunks = chunkText(pdfText, 3500); // Smaller chunks to stay within rate limits
    console.log(`📦 Split content into ${chunks.length} chunks`);

    // Generate MCQs in batches (2-3 at a time for rate-limit safety)
    const batchSize = 2;
    const batches = Math.ceil(count / batchSize);
    const allMCQs = [];

    for (let i = 0; i < batches; i++) {
      const questionsInBatch = Math.min(batchSize, count - allMCQs.length);
      console.log(`🎯 Generating batch ${i + 1}/${batches} (${questionsInBatch} questions)...`);

      // Use different chunks for variety, or cycle through available chunks
      const chunkIndex = i % chunks.length;
      const contentToUse = chunks[chunkIndex];
      console.log(`📄 Using chunk ${chunkIndex + 1}/${chunks.length} (${contentToUse.length} chars)`);

      const prompt = buildMCQPrompt(contentToUse, questionsInBatch, difficulty, topic, includeExplanations);
      
      try {
        const response = await callLLMForMCQ(prompt, 1200);
        
        const mcqs = parseMCQResponse(response);
        
        if (mcqs.length > 0) {
          allMCQs.push(...mcqs);
          console.log(`✅ Generated ${mcqs.length} MCQs in this batch`);
        } else {
          console.warn(`⚠️ No MCQs parsed from batch ${i + 1}`);
        }
      } catch (error) {
        console.error(`❌ Error in batch ${i + 1}:`, error.message);
        
        // If rate limited, add a longer delay and retry once
        if (error.message.includes('rate limit')) {
          console.log('⏳ Rate limit hit, waiting 6 seconds before retry...');
          await sleep(6000);
          
          try {
            const response = await callLLMForMCQ(prompt, 1200);
            const mcqs = parseMCQResponse(response);
            if (mcqs.length > 0) {
              allMCQs.push(...mcqs);
              console.log(`✅ Retry successful: Generated ${mcqs.length} MCQs`);
            }
          } catch (retryError) {
            console.error(`❌ Retry failed:`, retryError.message);
            // Continue to next batch instead of failing completely
          }
        }
      }

      // If we have enough, stop
      if (allMCQs.length >= count) {
        break;
      }

      // Add delay between batches to avoid rate limits
      if (i < batches - 1) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await sleep(2000);
      }
    }

    // Validate and clean MCQs
    const validatedMCQs = allMCQs.slice(0, count).map((mcq, index) => validateMCQ(mcq, index, difficulty, topic));
    
    console.log(`✅ Successfully generated ${validatedMCQs.length} valid MCQs`);
    return validatedMCQs.filter(mcq => mcq !== null);
    
  } catch (error) {
    console.error('❌ MCQ generation error:', error);
    throw error;
  }
}

/**
 * Build prompt for MCQ generation (optimized for token efficiency)
 */
function buildMCQPrompt(content, count, difficulty, topic, includeExplanations) {
  const topicClause = topic ? `Topic: "${topic}".` : '';
  const explanationClause = includeExplanations ? 'Add brief explanation.' : '';

  return `Generate ${count} MCQ from this content. ${topicClause}
Difficulty: ${difficulty}. 4 options each, 1 correct. ${explanationClause}

Return JSON only:
{"mcqs":[{"question":"?","options":["A","B","C","D"],"correctAnswer":"A","explanation":"","topic":""}]}

Content:
${content}

JSON:`;
}

/**
 * Validate and clean a single MCQ
 */
function validateMCQ(mcq, index, defaultDifficulty, defaultTopic) {
  try {
    if (!mcq.question || !mcq.options || !mcq.correctAnswer) {
      console.warn(`⚠️ Invalid MCQ at index ${index}: missing required fields`);
      return null;
    }

    // Ensure options is an array
    let options = mcq.options;
    if (typeof options === 'string') {
      options = [options];
    }
    if (!Array.isArray(options) || options.length < 2) {
      console.warn(`⚠️ Invalid MCQ at index ${index}: insufficient options`);
      return null;
    }

    // Trim and clean all options
    const cleanedOptions = options.map(opt => String(opt).trim());
    let cleanedCorrectAnswer = String(mcq.correctAnswer).trim();

    // Try to find the correct answer in options
    let foundAnswer = cleanedOptions.find(opt => 
      opt.toLowerCase() === cleanedCorrectAnswer.toLowerCase()
    );

    // If not found, try mapping letter-based answers (A, B, C, D, etc.)
    if (!foundAnswer) {
      const letterMatch = cleanedCorrectAnswer.match(/^[a-d]$/i);
      if (letterMatch) {
        const answerIndex = letterMatch[0].toUpperCase().charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        if (answerIndex >= 0 && answerIndex < cleanedOptions.length) {
          foundAnswer = cleanedOptions[answerIndex];
          console.log(`✅ MCQ at index ${index}: Mapped letter "${cleanedCorrectAnswer}" to option "${foundAnswer}"`);
        }
      }
    }

    // If still not found, reject this MCQ (don't use wrong answer)
    if (!foundAnswer) {
      console.warn(`⚠️ Invalid MCQ at index ${index}: correct answer "${cleanedCorrectAnswer}" not found in options: ${cleanedOptions.join(', ')}`);
      return null;
    }

    return {
      question: mcq.question.trim(),
      options: cleanedOptions,
      correctAnswer: foundAnswer,
      explanation: mcq.explanation?.trim() || null,
      difficulty: mcq.difficulty || defaultDifficulty,
      topic: mcq.topic?.trim() || defaultTopic || null
    };
  } catch (error) {
    console.warn(`⚠️ Error validating MCQ at index ${index}:`, error.message);
    return null;
  }
}

/**
 * Generate topic-specific practice questions
 * @param {string} topic - The topic to focus on
 * @param {string} context - Additional context or notes
 * @param {number} count - Number of questions
 */
export async function generateTopicPractice(topic, context = '', count = 5) {
  const contextText = context ? context.slice(0, 2000) : '';
  const prompt = `Generate ${count} MCQ about: "${topic}"
${contextText ? `Context: ${contextText}\n` : ''}Mix difficulty levels. 4 options each.

Return JSON only:
{"mcqs":[{"question":"?","options":["A","B","C","D"],"correctAnswer":"A","explanation":"","difficulty":"MEDIUM","topic":"${topic}"}]}

JSON:`;

  try {
    const response = await callLLMForMCQ(prompt, 1000);
    const mcqs = parseMCQResponse(response);
    return mcqs.map((mcq, i) => validateMCQ(mcq, i, 'MEDIUM', topic)).filter(m => m !== null);
  } catch (error) {
    console.error('❌ Topic practice generation error:', error);
    
    // If rate limited, throw a user-friendly error
    if (error.message.includes('rate limit')) {
      throw new Error('API rate limit reached. Please wait a moment and try again.');
    }
    throw error;
  }
}

/**
 * Generate adaptive questions based on weak areas
 * @param {Array} weakTopics - Topics student is weak in
 * @param {string} difficulty - Target difficulty level
 */
export async function generateAdaptiveQuestions(weakTopics, difficulty = 'MEDIUM', count = 5) {
  const topicsList = weakTopics.join(', ');
  
  const prompt = `Generate ${count} ${difficulty} MCQ for weak topics: ${topicsList}

Return JSON only:
{"mcqs":[{"question":"?","options":["A","B","C","D"],"correctAnswer":"A","explanation":"","difficulty":"${difficulty}","topic":""}]}

JSON:`;

  try {
    const response = await callLLMForMCQ(prompt, 1000);
    const mcqs = parseMCQResponse(response);
    return mcqs.map((mcq, i) => validateMCQ(mcq, i, difficulty, weakTopics[0])).filter(m => m !== null);
  } catch (error) {
    console.error('❌ Adaptive question generation error:', error);
    
    // If rate limited, throw a user-friendly error
    if (error.message.includes('rate limit')) {
      throw new Error('API rate limit reached. Please wait a moment and try again.');
    }
    throw error;
  }
}
