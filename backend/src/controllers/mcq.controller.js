/**
 * MCQ Controller - College-scoped quiz management
 */

import prisma from '../prisma.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/errors.js';
import { ROLES } from '../constants/roles.js';

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
