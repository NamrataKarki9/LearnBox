import { extractTextFromPDF } from './pdf.service.js';
import { callLLM, getLLMInfo } from './llm.service.js';

function normalizeWhitespace(text = '') {
  return text
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanSummaryOutput(text = '') {
  return normalizeWhitespace(
    text
      .replace(/```[\s\S]*?```/g, (match) => match.replace(/```(?:json)?/g, '').trim())
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/^---+$/gm, '')
      .replace(/^===+$/gm, '')
      .replace(/^[•●▪■◦]\s*/gm, '- ')
      .replace(/^\s*\d+\.\s+/gm, '- ')
      .replace(/^\s*[A-Za-z]\)\s+/gm, '- ')
      .replace(/^\s*-\s*/gm, '- ')
      .replace(/\s+:\s+/g, ': ')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
  );
}

function buildRevisionPrompt(text, { mode = 'summary' } = {}) {
  const truncatedText = text.slice(0, 12000);

  if (mode === 'detailed') {
    return `You are creating exam revision notes from a document.

Read the document carefully and write a full revision summary in clean plain text.

Requirements:
Cover all major topics, subtopics, definitions, explanations, processes, formulas, classifications, examples, comparisons, applications, and conclusions mentioned in the document.
Do not skip important sections just to be brief.
Make the summary detailed enough that a student can revise from it without reopening the file.
Use clear section titles.
Under every section title, write multiple bullet points.
Each bullet point should contain one complete idea or fact.
Keep bullets compact but informative.
Avoid repeating the same concept in multiple sections unless absolutely necessary for clarity.
Do not create duplicate headings or duplicate points.
If the document includes formulas, steps, rules, or cause-effect relationships, include them clearly in words.
If the document includes advantages, disadvantages, assumptions, limitations, or use cases, include them.
Do not use markdown.
Do not use asterisks, double asterisks, code fences, or decorative separators.
Use plain text headings followed by normal hyphen bullets only.
Do not use unnecessary extra spaces.
Write in simple academic language.
If something is unclear in the document, do not invent information.

Preferred output structure:
Document Summary
Main Idea
Core Topics
Important Details
Key Terms and Meanings
Processes, Methods, or Formulas
Applications and Examples
Important Conclusions

Applications and Examples rules:
Include at most 2 examples or applications in total.
Choose only the 2 most useful examples for revision.

Document text:
${truncatedText}

Write the detailed revision summary now:`;
  }

  if (mode === 'study-notes') {
    return `You are turning a document into clean revision notes for a student.

Create complete study notes in plain text.

Requirements:
Cover every major topic and important supporting detail in the document.
Explain each topic clearly enough for revision.
Keep the notes concise but information-rich.
Use headings with bullet points underneath each heading.
Each bullet should be one clear revision point.
Use plain hyphen bullets only.
Avoid repetition across headings.
Do not repeat the same definition or fact in different sections.
Do not use markdown, asterisks, code blocks, or decorative lines.
Do not use unnecessary repeated spacing.
Preserve important formulas, definitions, steps, contrasts, and examples in plain text.
Limit examples or applications to the 2 most important ones.
Do not add information that is not in the document.

Document text:
${truncatedText}

Write the study notes now:`;
  }

  return `You are an expert academic summarizer creating high-quality revision notes from an uploaded document.

Your task is to produce a complete revision summary in clean plain text.

Requirements:
Cover all important topics from the document, not just the introduction.
Include definitions, key concepts, main arguments, explanations, formulas, steps, methods, classifications, examples, applications, advantages, disadvantages, and conclusions whenever they appear in the document.
Make the summary detailed enough for exam revision and last-minute review.
Do not make it too short. Aim for a rich summary that captures the whole document.
Use a clear structure with section headings and bullet points under each heading.
Each bullet point should be a complete sentence or complete revision point.
Use plain hyphen bullets only.
Avoid redundancy.
Do not repeat the same topic, definition, or explanation in more than one section.
Do not create duplicate headings.
In the Examples or Applications section, include no more than 2 of the most useful examples/applications.
Write in plain text only.
Do not use markdown.
Do not use symbols like **, *, ---, or code fences.
Do not add unnecessary spaces.
Do not repeat the same point.
Do not invent facts that are not present in the document.

Output structure:
Topic Overview
Key Concepts
Important Explanations
Methods or Formulas
Examples or Applications
Final Revision Points

Document text:
${truncatedText}

Write the revision summary now:`;
}

async function callLLMForSummary(prompt, maxTokens = 500) {
  try {
    const info = await getLLMInfo();
    console.log(`Calling ${info.provider} (${info.model}) for summarization`);

    const response = await callLLM(prompt, maxTokens);
    return cleanSummaryOutput(response);
  } catch (error) {
    console.error('LLM API error:', error.message);

    if (error.message.includes('rate limit')) {
      throw new Error('API rate limit reached. Please wait a moment before generating more summaries.');
    }
    if (error.message.includes('quota')) {
      throw new Error('API quota exhausted. Please check your LLM configuration or upgrade your plan.');
    }

    throw new Error(`Failed to connect to LLM: ${error.message}`);
  }
}

export async function generateQuickSummary(text) {
  const prompt = buildRevisionPrompt(text, { mode: 'summary' });
  return await callLLMForSummary(prompt, 1400);
}

export async function extractKeyConcepts(text) {
  const prompt = `Extract 8 to 15 important key concepts from the document.

Return JSON only in this format:
{"concepts":[{"term":"concept name","definition":"clear exam-focused definition"}]}

Rules:
Choose the most important concepts for revision.
Definitions should be clean, direct, and based only on the document.
Do not include markdown or extra commentary.

Document text:
${text.slice(0, 9000)}

JSON:`;

  const response = await callLLMForSummary(prompt, 900);

  try {
    const jsonMatch = response.match(/\{[\s\S]*"concepts"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        concepts: Array.isArray(parsed.concepts)
          ? parsed.concepts
              .map((concept) => ({
                term: normalizeWhitespace(concept.term || ''),
                definition: cleanSummaryOutput(concept.definition || ''),
              }))
              .filter((concept) => concept.term && concept.definition)
          : [],
      };
    }

    console.warn('Failed to parse key concepts from LLM response:', response.slice(0, 200));
    return { concepts: [] };
  } catch (error) {
    console.error('Error parsing key concepts:', error.message);
    return { concepts: [] };
  }
}

export async function generateDetailedSummary(text) {
  const prompt = buildRevisionPrompt(text, { mode: 'detailed' });
  return await callLLMForSummary(prompt, 1800);
}

export async function generateStudyNotes(text) {
  const prompt = buildRevisionPrompt(text, { mode: 'study-notes' });
  return await callLLMForSummary(prompt, 1600);
}

export async function answerQuestion(text, question) {
  const prompt = `Answer the question using only the document.

Requirements:
Give a direct, clear answer in plain text.
Use short bullet points if that improves clarity.
Use plain hyphen bullets only.
Do not use markdown, asterisks, or decorative symbols.
If the answer is not in the document, say that clearly.

Document text:
${text.slice(0, 9000)}

Question: ${question}

Answer:`;

  return await callLLMForSummary(prompt, 500);
}

export async function processDocument(fileUrl, userId, fileName) {
  const startTime = Date.now();

  console.log(`Processing document: ${fileName}`);

  try {
    console.log('Extracting text from PDF...');
    const text = await extractTextFromPDF(fileUrl);

    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }

    console.log(`Extracted ${text.length} characters`);
    console.log('Generating summary with local LLM...');

    const quickSummary = await generateQuickSummary(text);
    let keyConcepts = { concepts: [] };

    try {
      keyConcepts = await extractKeyConcepts(text);
    } catch (conceptError) {
      console.warn('Key concept extraction failed, continuing with summary only:', conceptError.message);
    }

    const processingTime = Date.now() - startTime;
    console.log(`Processing complete in ${(processingTime / 1000).toFixed(2)}s`);

    return {
      quickSummary: cleanSummaryOutput(quickSummary),
      keyConcepts,
      processingTime,
      text
    };
  } catch (error) {
    console.error('Document processing error:', error);
    throw error;
  }
}

export async function processDocumentFromText(text, fileName) {
  const startTime = Date.now();

  console.log(`Processing document: ${fileName}`);

  try {
    if (!text || text.trim().length === 0) {
      throw new Error('No text content provided');
    }

    console.log(`Processing ${text.length} characters of text`);
    console.log('Generating summary with local LLM...');

    const quickSummary = await generateQuickSummary(text);
    let keyConcepts = { concepts: [] };

    try {
      keyConcepts = await extractKeyConcepts(text);
    } catch (conceptError) {
      console.warn('Key concept extraction failed, continuing with summary only:', conceptError.message);
    }

    const processingTime = Date.now() - startTime;
    console.log(`Processing complete in ${(processingTime / 1000).toFixed(2)}s`);

    return {
      quickSummary: cleanSummaryOutput(quickSummary),
      keyConcepts,
      processingTime,
      text
    };
  } catch (error) {
    console.error('Document processing error:', error);
    throw error;
  }
}

export async function checkOllamaHealth() {
  try {
    const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
    const MODEL_NAME = process.env.OLLAMA_MODEL || 'gemma3:1b';

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
    const modelExists = data.models?.some((m) => m.name.includes(MODEL_NAME.split(':')[0]));

    if (!modelExists) {
      return {
        healthy: false,
        error: `Model '${MODEL_NAME}' not found. Available models: ${data.models?.map((m) => m.name).join(', ')}`
      };
    }

    return {
      healthy: true,
      models: data.models?.map((m) => m.name),
      activeModel: MODEL_NAME
    };
  } catch (error) {
    const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
    return {
      healthy: false,
      error: `Cannot connect to Ollama at ${OLLAMA_BASE_URL}. Make sure it's running.`
    };
  }
}
