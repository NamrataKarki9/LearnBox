import prisma from '../prisma.js';
import { uploadToCloudinary } from '../config/cloudinary.config.js';
import { 
  processDocumentFromText,
  generateDetailedSummary, 
  generateStudyNotes,
  answerQuestion,
  checkOllamaHealth
} from '../services/summary.service.js';
import { extractTextFromPDF, extractTextFromLocalPDF } from '../services/pdf.service.js';
import { unlink } from 'fs/promises';

/**
 * Health check endpoint
 */
export const healthCheck = async (req, res) => {
  try {
    const health = await checkOllamaHealth();
    
    if (!health.healthy) {
      return res.status(503).json({
        success: false,
        message: 'LLM service is not available',
        error: health.error
      });
    }
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        models: health.models,
        activeModel: health.activeModel
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check LLM health',
      error: error.message
    });
  }
};

/**
 * Upload and summarize document
 */
export const uploadAndSummarize = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }
    
    console.log(`📤 Uploading file: ${req.file.originalname}`);
    
    // STEP 1: Extract text from LOCAL file FIRST (before uploading)
    console.log('📄 Extracting text from local PDF file...');
    const extractedText = await extractTextFromLocalPDF(req.file.path);
    
    // STEP 2: Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.path);
    
    // Validate Cloudinary response
    if (!cloudinaryResult || !cloudinaryResult.url) {
      throw new Error('Failed to get URL from Cloudinary upload');
    }
    
    // STEP 3: Clean up local file
    await unlink(req.file.path);
    
    console.log('☁️ File uploaded to Cloudinary:', cloudinaryResult.url);
    
    // STEP 4: Process extracted text with local LLM
    const result = await processDocumentFromText(
      extractedText,
      req.file.originalname
    );
    
    // Save to database
    const summary = await prisma.documentSummary.create({
      data: {
        userId: req.user.id,
        originalFileName: req.file.originalname,
        fileUrl: cloudinaryResult.url,
        fileType: cloudinaryResult.format || 'pdf',
        fileSize: cloudinaryResult.bytes,
        quickSummary: result.quickSummary,
        keyConcepts: result.keyConcepts,
        processingTime: result.processingTime,
        model: process.env.OLLAMA_MODEL || 'gemma3:1b'
      }
    });
    
    console.log('✅ Summary saved to database');
    
    res.json({
      success: true,
      data: {
        id: summary.id,
        quickSummary: summary.quickSummary,
        keyConcepts: summary.keyConcepts,
        fileName: summary.originalFileName,
        processingTime: summary.processingTime
      }
    });
  } catch (error) {
    console.error('❌ Summarization error:', error);
    
    // Clean up file if it still exists
    if (req.file && req.file.path) {
      try {
        await unlink(req.file.path);
      } catch (unlinkError) {
        // File might already be deleted, ignore error
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process document',
      error: error.message 
    });
  }
};

/**
 * Get detailed summary for a document
 */
export const getDetailedSummary = async (req, res) => {
  try {
    const { id } = req.params;
    
    const summary = await prisma.documentSummary.findUnique({
      where: { 
        id: parseInt(id),
        userId: req.user.id 
      }
    });
    
    if (!summary) {
      return res.status(404).json({ 
        success: false, 
        message: 'Summary not found' 
      });
    }
    
    // Generate detailed summary if not cached
    if (!summary.detailedSummary) {
      console.log('🔄 Generating detailed summary...');
      const text = await extractTextFromPDF(summary.fileUrl);
      const detailedSummary = await generateDetailedSummary(text);
      
      await prisma.documentSummary.update({
        where: { id: summary.id },
        data: { detailedSummary }
      });
      
      return res.json({ 
        success: true, 
        data: { detailedSummary } 
      });
    }
    
    res.json({ 
      success: true, 
      data: { detailedSummary: summary.detailedSummary } 
    });
  } catch (error) {
    console.error('Detailed summary error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Get study notes for a document
 */
export const getStudyNotes = async (req, res) => {
  try {
    const { id } = req.params;
    
    const summary = await prisma.documentSummary.findUnique({
      where: { 
        id: parseInt(id),
        userId: req.user.id 
      }
    });
    
    if (!summary) {
      return res.status(404).json({ 
        success: false, 
        message: 'Summary not found' 
      });
    }
    
    // Generate study notes if not cached
    if (!summary.studyNotes) {
      console.log('📝 Generating study notes...');
      const text = await extractTextFromPDF(summary.fileUrl);
      const studyNotes = await generateStudyNotes(text);
      
      await prisma.documentSummary.update({
        where: { id: summary.id },
        data: { studyNotes }
      });
      
      return res.json({ 
        success: true, 
        data: { studyNotes } 
      });
    }
    
    res.json({ 
      success: true, 
      data: { studyNotes: summary.studyNotes } 
    });
  } catch (error) {
    console.error('Study notes error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Ask question about document
 */
export const askQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question } = req.body;
    
    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }
    
    const summary = await prisma.documentSummary.findUnique({
      where: { 
        id: parseInt(id),
        userId: req.user.id 
      }
    });
    
    if (!summary) {
      return res.status(404).json({ 
        success: false, 
        message: 'Document not found' 
      });
    }
    
    console.log('❓ Answering question...');
    const text = await extractTextFromPDF(summary.fileUrl);
    const answer = await answerQuestion(text, question);
    
    // Save Q&A
    await prisma.summaryQuestion.create({
      data: { 
        summaryId: summary.id, 
        question: question.trim(), 
        answer: answer.trim() 
      }
    });
    
    res.json({ 
      success: true, 
      data: { answer: answer.trim() } 
    });
  } catch (error) {
    console.error('Question answering error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Get user's summary history
 */
export const getSummaryHistory = async (req, res) => {
  try {
    const summaries = await prisma.documentSummary.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        originalFileName: true,
        fileUrl: true,
        quickSummary: true,
        keyConcepts: true,
        processingTime: true,
        createdAt: true
      }
    });
    
    res.json({ 
      success: true, 
      data: summaries 
    });
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Get single summary by ID
 */
export const getSummaryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const summary = await prisma.documentSummary.findUnique({
      where: { 
        id: parseInt(id),
        userId: req.user.id 
      },
      include: {
        questions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!summary) {
      return res.status(404).json({ 
        success: false, 
        message: 'Summary not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: summary 
    });
  } catch (error) {
    console.error('Summary fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

/**
 * Delete a summary
 */
export const deleteSummary = async (req, res) => {
  try {
    const { id } = req.params;
    
    const summary = await prisma.documentSummary.findUnique({
      where: { 
        id: parseInt(id),
        userId: req.user.id 
      }
    });
    
    if (!summary) {
      return res.status(404).json({ 
        success: false, 
        message: 'Summary not found' 
      });
    }
    
    // Delete related questions first
    await prisma.summaryQuestion.deleteMany({
      where: { summaryId: summary.id }
    });
    
    // Delete summary
    await prisma.documentSummary.delete({
      where: { id: summary.id }
    });
    
    res.json({ 
      success: true, 
      message: 'Summary deleted successfully' 
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
