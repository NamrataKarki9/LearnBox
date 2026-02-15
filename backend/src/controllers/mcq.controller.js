/**
 * MCQ Controller - College-scoped quiz management
 */

import prisma from '../prisma.js';
import fs from 'fs';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/errors.js';
import { ROLES } from '../constants/roles.js';
import { generateMCQsFromPDF, generateAdaptiveQuestions } from '../services/mcq-generation.service.js';
import { getWeakPoints } from '../services/analytics.service.js';

/**
 * Get MCQs (college-scoped)
 * @route GET /api/mcqs
 * @access COLLEGE_ADMIN (own college), STUDENT (own college)
 */
export const getAllMCQs = async (req, res) => {
    try {
        const { moduleId, difficulty } = req.query;
        
        const whereClause = {
            collegeId: req.collegeId || req.user.collegeId
        };

        if (moduleId) whereClause.moduleId = parseInt(moduleId);
        if (difficulty) whereClause.difficulty = difficulty;

        // Students shouldn't see correct answers in list view
        const selectFields = req.user.role === ROLES.STUDENT ? {
            id: true,
            question: true,
            options: true,
            difficulty: true,
            moduleId: true,
            createdAt: true
        } : undefined;

        const mcqs = await prisma.mCQ.findMany({
            where: whereClause,
            select: selectFields,
            include: req.user.role !== ROLES.STUDENT ? {
                module: { select: { id: true, name: true, code: true } },
                creator: { select: { username: true, first_name: true, last_name: true } }
            } : undefined,
            orderBy: { createdAt: 'desc' }
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            count: mcqs.length,
            data: mcqs
        });
    } catch (error) {
        console.error('Get MCQs error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Create MCQ (COLLEGE_ADMIN only)
 * @route POST /api/mcqs
 * @access COLLEGE_ADMIN
 */
export const createMCQ = async (req, res) => {
    try {
        const { question, options, correctAnswer, explanation, difficulty, moduleId } = req.body;

        if (!question || !options || !correctAnswer) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Question, options, and correctAnswer are required'
            });
        }

        const mcq = await prisma.mCQ.create({
            data: {
                question,
                options: typeof options === 'string' ? options : JSON.stringify(options),
                correctAnswer,
                explanation,
                difficulty: difficulty || 'MEDIUM',
                moduleId: moduleId ? parseInt(moduleId) : null,
                collegeId: req.user.collegeId,
                createdBy: req.user.id
            }
        });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: 'MCQ created successfully',
            data: mcq
        });
    } catch (error) {
        console.error('Create MCQ error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Submit MCQ attempt (STUDENT only)
 * @route POST /api/mcqs/:id/attempt
 * @access STUDENT
 */
export const attemptMCQ = async (req, res) => {
    try {
        const { id } = req.params;
        const { selectedAnswer } = req.body;

        if (!selectedAnswer) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Selected answer is required'
            });
        }

        const mcq = await prisma.mCQ.findUnique({
            where: { id: parseInt(id) }
        });

        if (!mcq) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'MCQ not found'
            });
        }

        // Verify student has access to this MCQ (same college)
        if (mcq.collegeId !== req.user.collegeId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                error: ERROR_MESSAGES.COLLEGE_ACCESS_DENIED
            });
        }

        const isCorrect = mcq.correctAnswer === selectedAnswer;

        const attempt = await prisma.mCQAttempt.create({
            data: {
                mcqId: parseInt(id),
                studentId: req.user.id,
                selectedAnswer,
                isCorrect
            }
        });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            isCorrect,
            correctAnswer: isCorrect ? undefined : mcq.correctAnswer,
            explanation: mcq.explanation,
            attempt
        });
    } catch (error) {
        console.error('MCQ attempt error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Get student's MCQ attempts
 * @route GET /api/mcqs/attempts/me
 * @access STUDENT
 */
export const getMyAttempts = async (req, res) => {
    try {
        const attempts = await prisma.mCQAttempt.findMany({
            where: { studentId: req.user.id },
            include: {
                mcq: {
                    select: {
                        id: true,
                        question: true,
                        difficulty: true,
                        module: {
                            select: { name: true, code: true }
                        }
                    }
                }
            },
            orderBy: { attemptedAt: 'desc' }
        });

        const stats = {
            totalAttempts: attempts.length,
            correctAttempts: attempts.filter(a => a.isCorrect).length,
            accuracy: attempts.length > 0 
                ? ((attempts.filter(a => a.isCorrect).length / attempts.length) * 100).toFixed(2) 
                : 0
        };

        res.status(HTTP_STATUS.OK).json({
            success: true,
            stats,
            data: attempts
        });
    } catch (error) {
        console.error('Get attempts error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Bulk upload MCQs (COLLEGE_ADMIN only)
 * @route POST /api/mcqs/bulk
 * @access COLLEGE_ADMIN
 */
export const bulkUploadMCQs = async (req, res) => {
    try {
        const { mcqs, moduleId, createSet, setTitle, setDescription } = req.body;

        if (!mcqs || !Array.isArray(mcqs) || mcqs.length === 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'MCQs array is required and must not be empty'
            });
        }

        // Validate each MCQ
        for (const mcq of mcqs) {
            if (!mcq.question || !mcq.options || !mcq.correctAnswer) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    error: 'Each MCQ must have question, options, and correctAnswer'
                });
            }
        }

        // Create MCQs
        const createdMCQs = [];
        for (const mcqData of mcqs) {
            const mcq = await prisma.mCQ.create({
                data: {
                    question: mcqData.question,
                    options: typeof mcqData.options === 'string' ? mcqData.options : JSON.stringify(mcqData.options),
                    correctAnswer: mcqData.correctAnswer,
                    explanation: mcqData.explanation || null,
                    difficulty: mcqData.difficulty || 'MEDIUM',
                    topic: mcqData.topic || null,
                    moduleId: moduleId ? parseInt(moduleId) : null,
                    collegeId: req.user.collegeId,
                    createdBy: req.user.id,
                    source: 'MANUAL'
                }
            });
            createdMCQs.push(mcq);
        }

        // Create MCQ set if requested
        let mcqSet = null;
        if (createSet) {
            mcqSet = await prisma.mCQSet.create({
                data: {
                    title: setTitle || `Practice Set - ${new Date().toLocaleDateString()}`,
                    description: setDescription || null,
                    moduleId: moduleId ? parseInt(moduleId) : null,
                    collegeId: req.user.collegeId,
                    createdBy: req.user.id,
                    source: 'MANUAL',
                    isPublic: true
                }
            });

            // Add MCQs to set
            for (let i = 0; i < createdMCQs.length; i++) {
                await prisma.setMCQ.create({
                    data: {
                        setId: mcqSet.id,
                        mcqId: createdMCQs[i].id,
                        order: i
                    }
                });
            }
        }

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: `Successfully created ${createdMCQs.length} MCQs`,
            data: {
                mcqs: createdMCQs,
                set: mcqSet
            }
        });
    } catch (error) {
        console.error('Bulk upload MCQs error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Generate MCQs from PDF (STUDENT can generate for practice)
 * @route POST /api/mcqs/generate-from-pdf
 * @access STUDENT, COLLEGE_ADMIN
 */
export const generateMCQsFromPDFController = async (req, res) => {
    try {
        let { pdfUrl, count = 10, difficulty = 'MEDIUM', topic, moduleId, saveToDatabase = false, createSet = false, setTitle } = req.body;

        // Handle file upload if present (from multipart form-data)
        if (req.file) {
            // Use the uploaded file path
            pdfUrl = req.file.path;
            console.log(`📤 PDF uploaded to: ${pdfUrl}`);
        }

        if (!pdfUrl) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'PDF URL or file is required'
            });
        }

        console.log(`🎯 Generating ${count} MCQs from PDF...`);

        // Generate MCQs using AI
        const generatedMCQs = await generateMCQsFromPDF(pdfUrl, {
            count: parseInt(count),
            difficulty,
            topic,
            includeExplanations: true
        });

        if (generatedMCQs.length === 0) {
            return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
                error: 'Failed to generate MCQs from PDF. Please try again.'
            });
        }

        // Save to database if requested (only for admins or if student explicitly requests)
        let savedMCQs = [];
        let mcqSet = null;

        if (saveToDatabase && (req.user.role === ROLES.COLLEGE_ADMIN || req.user.role === ROLES.STUDENT)) {
            for (const mcqData of generatedMCQs) {
                const mcq = await prisma.mCQ.create({
                    data: {
                        question: mcqData.question,
                        options: JSON.stringify(mcqData.options),
                        correctAnswer: mcqData.correctAnswer,
                        explanation: mcqData.explanation,
                        difficulty: mcqData.difficulty,
                        topic: mcqData.topic,
                        moduleId: moduleId ? parseInt(moduleId) : null,
                        collegeId: req.user.collegeId,
                        createdBy: req.user.id,
                        source: 'AI_GENERATED'
                    }
                });
                savedMCQs.push(mcq);
            }

            // Create MCQ set if requested
            if (createSet) {
                mcqSet = await prisma.mCQSet.create({
                    data: {
                        title: setTitle || `AI Generated - ${new Date().toLocaleDateString()}`,
                        description: `Generated from PDF by ${req.user.username}`,
                        moduleId: moduleId ? parseInt(moduleId) : null,
                        collegeId: req.user.collegeId,
                        createdBy: req.user.id,
                        source: 'AI_GENERATED',
                        sourceFile: pdfUrl,
                        isPublic: req.user.role === ROLES.COLLEGE_ADMIN // Only admin sets are public by default
                    }
                });

                // Add MCQs to set
                for (let i = 0; i < savedMCQs.length; i++) {
                    await prisma.setMCQ.create({
                        data: {
                            setId: mcqSet.id,
                            mcqId: savedMCQs[i].id,
                            order: i
                        }
                    });
                }
            }
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: `Generated ${generatedMCQs.length} MCQs from PDF`,
            data: {
                mcqs: saveToDatabase ? savedMCQs : generatedMCQs,
                set: mcqSet,
                saved: saveToDatabase
            }
        });

        // Cleanup: Delete temporary uploaded file if it exists
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
                console.log(`🗑️ Cleaned up temporary file: ${req.file.path}`);
            } catch (cleanupError) {
                console.error('⚠️ Failed to cleanup temp file:', cleanupError.message);
                // Don't fail the request if cleanup fails
            }
        }
    } catch (error) {
        console.error('Generate MCQs from PDF error:', error);
        
        // Cleanup on error too
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (cleanupError) {
                console.error('⚠️ Failed to cleanup temp file on error:', cleanupError.message);
            }
        }
        
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: error.message || 'Failed to generate MCQs from PDF'
        });
    }
};

/**
 * Get adaptive questions based on weak areas
 * @route GET /api/mcqs/adaptive
 * @access STUDENT
 */
export const getAdaptiveQuestions = async (req, res) => {
    try {
        const { count = 10, difficulty } = req.query;

        // Get student's weak points
        const weakPoints = await getWeakPoints(req.user.id, 65);

        if (weakPoints.length === 0) {
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: 'No weak areas identified. Great job!',
                data: []
            });
        }

        // Get top 3 weakest topics
        const weakTopics = weakPoints.slice(0, 3).map(w => w.topic);
        const targetDifficulty = difficulty || (weakPoints[0].difficulty);

        // First, try to find existing questions in weak areas
        const existingMCQs = await prisma.mCQ.findMany({
            where: {
                collegeId: req.user.collegeId,
                topic: { in: weakTopics },
                difficulty: targetDifficulty
            },
            select: {
                id: true,
                question: true,
                options: true,
                difficulty: true,
                topic: true
            },
            take: parseInt(count)
        });

        if (existingMCQs.length >= count) {
            return res.status(HTTP_STATUS.OK).json({
                success: true,
                message: `Found ${existingMCQs.length} questions for your weak areas`,
                weakAreas: weakTopics,
                data: existingMCQs
            });
        }

        // If not enough existing questions, generate new ones using AI
        console.log('🎯 Generating adaptive questions for weak areas:', weakTopics);
        const generatedMCQs = await generateAdaptiveQuestions(weakTopics, targetDifficulty, parseInt(count));

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: `Generated ${generatedMCQs.length} adaptive questions for your weak areas`,
            weakAreas: weakTopics,
            data: generatedMCQs
        });
    } catch (error) {
        console.error('Get adaptive questions error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: error.message || ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Get all MCQ sets
 * @route GET /api/mcqs/sets
 * @access STUDENT, COLLEGE_ADMIN
 */
export const getMCQSets = async (req, res) => {
    try {
        const { moduleId } = req.query;

        const whereClause = {
            collegeId: req.user.collegeId,
            isPublic: true
        };

        if (moduleId) {
            whereClause.moduleId = parseInt(moduleId);
        }

        const sets = await prisma.mCQSet.findMany({
            where: whereClause,
            include: {
                module: {
                    select: { name: true, code: true }
                },
                creator: {
                    select: { username: true, first_name: true, last_name: true }
                },
                mcqs: {
                    select: { mcqId: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            count: sets.length,
            data: sets.map(set => ({
                ...set,
                questionCount: set.mcqs.length
            }))
        });
    } catch (error) {
        console.error('Get MCQ sets error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Get MCQ set by ID with questions
 * @route GET /api/mcqs/sets/:id
 * @access STUDENT, COLLEGE_ADMIN
 */
export const getMCQSetById = async (req, res) => {
    try {
        const { id } = req.params;

        const set = await prisma.mCQSet.findUnique({
            where: { id: parseInt(id) },
            include: {
                module: {
                    select: { name: true, code: true }
                },
                creator: {
                    select: { username: true, first_name: true, last_name: true }
                },
                mcqs: {
                    include: {
                        mcq: {
                            select: {
                                id: true,
                                question: true,
                                options: true,
                                difficulty: true,
                                topic: true
                            }
                        }
                    },
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!set) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'MCQ set not found'
            });
        }

        // Verify college access
        if (set.collegeId !== req.user.collegeId) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                error: ERROR_MESSAGES.COLLEGE_ACCESS_DENIED
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: {
                ...set,
                questions: set.mcqs.map(m => m.mcq)
            }
        });
    } catch (error) {
        console.error('Get MCQ set by ID error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

