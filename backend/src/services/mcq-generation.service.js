/**
 * MCQ Generation Service
 * Uses Ollama (gemma3:1b) to generate MCQs from PDF content
 */

import { extractTextFromPDF, extractTextFromLocalPDF } from './pdf.service.js';
import fs from 'fs';

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL_NAME = process.env.OLLAMA_MODEL || 'gemma3:1b';

/**
 * Call Ollama API
 */
async function callOllama(prompt, maxTokens = 1000) {
  try {
    console.log(`🤖 Calling Ollama for MCQ generation (${MODEL_NAME}) at ${OLLAMA_BASE_URL}`);
    
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
          temperature: 0.7, // Higher for more varied questions
          top_p: 0.9,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Ollama error: ${response.status} - ${errorText}`);
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Ollama responded with ${data.response?.length || 0} characters`);
    return data.response;
  } catch (error) {
    console.error('❌ Ollama API error:', error.message);
    console.error('❌ Full error:', error);
    throw new Error(`Failed to connect to local LLM at ${OLLAMA_BASE_URL}: ${error.message}`);
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

    // Truncate text to avoid token limits (use first ~15000 chars)
    const contentToUse = pdfText.slice(0, 15000);

    // Generate MCQs in batches (5 at a time for better quality)
    const batchSize = 5;
    const batches = Math.ceil(count / batchSize);
    const allMCQs = [];

    for (let i = 0; i < batches; i++) {
      const questionsInBatch = Math.min(batchSize, count - allMCQs.length);
      console.log(`🎯 Generating batch ${i + 1}/${batches} (${questionsInBatch} questions)...`);

      const prompt = buildMCQPrompt(contentToUse, questionsInBatch, difficulty, topic, includeExplanations);
      const response = await callOllama(prompt, 1500);
      
      const mcqs = parseMCQResponse(response);
      
      if (mcqs.length > 0) {
        allMCQs.push(...mcqs);
        console.log(`✅ Generated ${mcqs.length} MCQs in this batch`);
      } else {
        console.warn(`⚠️ No MCQs parsed from batch ${i + 1}`);
      }

      // If we have enough, stop
      if (allMCQs.length >= count) {
        break;
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
 * Build prompt for MCQ generation
 */
function buildMCQPrompt(content, count, difficulty, topic, includeExplanations) {
  const difficultyGuide = {
    EASY: 'straightforward recall or basic comprehension',
    MEDIUM: 'application of concepts or moderate analysis',
    HARD: 'complex analysis, synthesis, or evaluation'
  };

  const topicClause = topic ? `Focus on the topic: "${topic}".` : 'Cover various important topics from the content.';
  const explanationClause = includeExplanations ? 'Include a brief explanation for each correct answer.' : '';

  return `You are an expert educator creating multiple choice questions for students.

Based on the following educational content, generate exactly ${count} high-quality multiple-choice questions.

Requirements:
- Difficulty level: ${difficulty} (${difficultyGuide[difficulty]})
- ${topicClause}
- Each question should have 4 options (A, B, C, D)
- Only ONE correct answer per question
- Make distractors (wrong answers) plausible but clearly incorrect
- ${explanationClause}

Return ONLY a valid JSON object in this exact format (no extra text):
{
  "mcqs": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Brief explanation why this is correct",
      "topic": "Specific topic or concept being tested"
    }
  ]
}

Educational Content:
${content}

JSON Response:`;
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

    // Ensure correct answer is in options
    if (!options.includes(mcq.correctAnswer)) {
      console.warn(`⚠️ Invalid MCQ at index ${index}: correct answer not in options`);
      // Try to fix by using first option
      mcq.correctAnswer = options[0];
    }

    return {
      question: mcq.question.trim(),
      options: options.map(opt => String(opt).trim()),
      correctAnswer: mcq.correctAnswer.trim(),
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
  const prompt = `You are an expert educator creating practice questions.

Generate ${count} multiple-choice questions specifically about: "${topic}"

${context ? `Additional context:\n${context}\n` : ''}

Requirements:
- Focus ONLY on the specified topic
- Mix of difficulty levels (easy to hard)
- Each question should have 4 options
- Include brief explanations

Return ONLY valid JSON:
{
  "mcqs": [
    {
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Why this is correct",
      "difficulty": "MEDIUM",
      "topic": "${topic}"
    }
  ]
}

JSON Response:`;

  try {
    const response = await callOllama(prompt, 1200);
    const mcqs = parseMCQResponse(response);
    return mcqs.map((mcq, i) => validateMCQ(mcq, i, 'MEDIUM', topic)).filter(m => m !== null);
  } catch (error) {
    console.error('❌ Topic practice generation error:', error);
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
  
  const prompt = `You are an expert educator helping a student improve in their weak areas.

The student needs practice in these topics: ${topicsList}

Generate ${count} ${difficulty.toLowerCase()} difficulty questions that will help them improve.

Requirements:
- Focus on the weak topics mentioned
- Difficulty: ${difficulty}
- Include clear explanations
- 4 options per question

Return ONLY valid JSON:
{
  "mcqs": [
    {
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Detailed explanation",
      "difficulty": "${difficulty}",
      "topic": "topic name"
    }
  ]
}

JSON Response:`;

  try {
    const response = await callOllama(prompt, 1500);
    const mcqs = parseMCQResponse(response);
    return mcqs.map((mcq, i) => validateMCQ(mcq, i, difficulty, weakTopics[0])).filter(m => m !== null);
  } catch (error) {
    console.error('❌ Adaptive question generation error:', error);
    throw error;
  }
}
