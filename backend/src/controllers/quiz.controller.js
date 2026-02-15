/**
 * Quiz Controller - Google Forms style quiz sessions
 */

import prisma from '../prisma.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/errors.js';
import { ROLES } from '../constants/roles.js';
import { updatePerformanceAnalytics } from '../services/analytics.service.js';

/**
 * Start a new quiz session
 * @route POST /api/quiz/start
 * @access STUDENT
 */
export const startQuizSession = async (req, res) => {
    try {
        const { setId, moduleId, customMCQIds } = req.body;
        
        let mcqIds = [];
        let setInfo = null;

        if (setId) {
            // Using predefined MCQ set
            const mcqSet = await prisma.mCQSet.findUnique({
                where: { id: parseInt(setId) },
                include: {
                    mcqs: {
                        orderBy: { order: 'asc' },
                        select: { mcqId: true }
                    }
                }
            });

            if (!mcqSet) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    error: 'MCQ set not found'
                });
            }

            // Verify college access
            if (mcqSet.collegeId !== req.user.collegeId) {
                return res.status(HTTP_STATUS.FORBIDDEN).json({
                    error: ERROR_MESSAGES.COLLEGE_ACCESS_DENIED
                });
            }

            mcqIds = mcqSet.mcqs.map(m => m.mcqId);
            setInfo = mcqSet;
        } else if (customMCQIds && Array.isArray(customMCQIds)) {
            // Custom selection of MCQs
            mcqIds = customMCQIds.map(id => parseInt(id));
        } else if (moduleId) {
            // Get random MCQs from module
            const mcqs = await prisma.mCQ.findMany({
                where: {
                    moduleId: parseInt(moduleId),
                    collegeId: req.user.collegeId
                },
                select: { id: true },
                take: 10
            });
            mcqIds = mcqs.map(m => m.id);
        } else {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Either setId, customMCQIds, or moduleId is required'
            });
        }

        if (mcqIds.length === 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'No MCQs available for this quiz'
            });
        }

        // Create quiz session
        const session = await prisma.quizSession.create({
            data: {
                studentId: req.user.id,
                setId: setId ? parseInt(setId) : null,
                moduleId: moduleId ? parseInt(moduleId) : null,
                collegeId: req.user.collegeId,
                totalQuestions: mcqIds.length,
                status: 'IN_PROGRESS'
            }
        });

        // Get MCQ questions (without correct answers)
        const mcqs = await prisma.mCQ.findMany({
            where: {
                id: { in: mcqIds }
            },
            select: {
                id: true,
                question: true,
                options: true,
                difficulty: true,
                topic: true,
                module: {
                    select: {
                        name: true,
                        code: true
                    }
                }
            }
        });

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            session: {
                id: session.id,
                totalQuestions: session.totalQuestions,
                setTitle: setInfo?.title,
                startedAt: session.startedAt
            },
            mcqs: mcqs.map((mcq, index) => ({
                ...mcq,
                questionNumber: index + 1
            }))
        });
    } catch (error) {
        console.error('Start quiz session error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Submit quiz session with all answers
 * @route POST /api/quiz/:sessionId/submit
 * @access STUDENT
 */
export const submitQuizSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { answers, timeSpent } = req.body; // answers: [{ mcqId, selectedAnswer }]

        if (!answers || !Array.isArray(answers)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Answers array is required'
            });
        }

        const session = await prisma.quizSession.findUnique({
            where: { id: parseInt(sessionId) }
        });

        if (!session) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'Quiz session not found'
            });
        }

        // Verify ownership
        if (session.studentId !== req.user.id) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                error: 'Access denied'
            });
        }

        // Check if already submitted
        if (session.status === 'SUBMITTED') {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                error: 'Quiz already submitted'
            });
        }

        // Get MCQs with correct answers
        const mcqIds = answers.map(a => parseInt(a.mcqId));
        const mcqs = await prisma.mCQ.findMany({
            where: { id: { in: mcqIds } }
        });

        const mcqMap = {};
        mcqs.forEach(mcq => {
            mcqMap[mcq.id] = mcq;
        });

        // Grade answers and create attempts
        const attempts = [];
        let correctCount = 0;

        for (const answer of answers) {
            const mcqId = parseInt(answer.mcqId);
            const mcq = mcqMap[mcqId];

            if (!mcq) continue;

            const isCorrect = mcq.correctAnswer === answer.selectedAnswer;
            if (isCorrect) correctCount++;

            const attempt = await prisma.mCQAttempt.create({
                data: {
                    mcqId,
                    studentId: req.user.id,
                    selectedAnswer: answer.selectedAnswer,
                    isCorrect,
                    sessionId: parseInt(sessionId)
                }
            });

            attempts.push({
                mcqId,
                isCorrect,
                selectedAnswer: answer.selectedAnswer,
                correctAnswer: mcq.correctAnswer,
                explanation: mcq.explanation,
                question: mcq.question,
                options: mcq.options,
                difficulty: mcq.difficulty,
                topic: mcq.topic
            });
        }

        // Calculate score
        const score = Math.round((correctCount / answers.length) * 100);

        // Update session
        await prisma.quizSession.update({
            where: { id: parseInt(sessionId) },
            data: {
                status: 'SUBMITTED',
                score,
                correctAnswers: correctCount,
                timeSpent: timeSpent || null,
                submittedAt: new Date()
            }
        });

        // Update performance analytics asynchronously
        updatePerformanceAnalytics(req.user.id, attempts.map(a => ({
            mcqId: a.mcqId,
            isCorrect: a.isCorrect
        }))).catch(err => {
            console.error('Error updating analytics:', err);
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            results: {
                sessionId: parseInt(sessionId),
                score,
                totalQuestions: answers.length,
                correctAnswers: correctCount,
                incorrectAnswers: answers.length - correctCount,
                accuracy: ((correctCount / answers.length) * 100).toFixed(2),
                timeSpent
            },
            answers: attempts.map((att, index) => ({
                questionNumber: index + 1,
                ...att
            }))
        });
    } catch (error) {
        console.error('Submit quiz session error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Get quiz session details
 * @route GET /api/quiz/:sessionId
 * @access STUDENT (own sessions)
 */
export const getQuizSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await prisma.quizSession.findUnique({
            where: { id: parseInt(sessionId) },
            include: {
                set: {
                    select: { title: true, description: true }
                },
                module: {
                    select: { name: true, code: true }
                },
                attempts: {
                    include: {
                        mcq: true
                    }
                }
            }
        });

        if (!session) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'Quiz session not found'
            });
        }

        // Verify ownership
        if (session.studentId !== req.user.id) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                error: 'Access denied'
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Get quiz session error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Get student's quiz history
 * @route GET /api/quiz/history
 * @access STUDENT
 */
export const getQuizHistory = async (req, res) => {
    try {
        const { moduleId, limit = 20 } = req.query;

        const whereClause = {
            studentId: req.user.id,
            status: 'SUBMITTED'
        };

        if (moduleId) {
            whereClause.moduleId = parseInt(moduleId);
        }

        const sessions = await prisma.quizSession.findMany({
            where: whereClause,
            include: {
                set: {
                    select: { title: true }
                },
                module: {
                    select: { name: true, code: true }
                }
            },
            orderBy: { submittedAt: 'desc' },
            take: parseInt(limit)
        });

        const stats = {
            totalQuizzes: sessions.length,
            averageScore: sessions.length > 0
                ? (sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length).toFixed(2)
                : 0,
            totalQuestions: sessions.reduce((sum, s) => sum + s.totalQuestions, 0),
            totalCorrect: sessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0)
        };

        res.status(HTTP_STATUS.OK).json({
            success: true,
            stats,
            data: sessions
        });
    } catch (error) {
        console.error('Get quiz history error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};

/**
 * Abandon a quiz session
 * @route POST /api/quiz/:sessionId/abandon
 * @access STUDENT
 */
export const abandonQuizSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await prisma.quizSession.findUnique({
            where: { id: parseInt(sessionId) }
        });

        if (!session) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                error: 'Quiz session not found'
            });
        }

        if (session.studentId !== req.user.id) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                error: 'Access denied'
            });
        }

        await prisma.quizSession.update({
            where: { id: parseInt(sessionId) },
            data: { status: 'ABANDONED' }
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Quiz session abandoned'
        });
    } catch (error) {
        console.error('Abandon quiz session error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR
        });
    }
};
