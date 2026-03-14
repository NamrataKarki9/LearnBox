/**
 * Quiz Controller - Google Forms style quiz sessions
 */

import prisma from '../prisma.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/errors.js';
import { ROLES } from '../constants/roles.js';
import { updatePerformanceAnalytics, getStudyRecommendations } from '../services/analytics.service.js';

/**
 * Start a new quiz session
 * @route POST /api/quiz/start
 * @access STUDENT
 */
export const startQuizSession = async (req, res) => {
    try {
        const { setId, moduleId, customMCQIds } = req.body;
        
        // Validate user authentication
        if (!req.user || !req.user.id) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                error: 'User authentication required'
            });
        }
        
        let mcqIds = [];
        let setInfo = null;

        if (setId) {
            // Validate setId format
            const parsedSetId = parseInt(setId);
            if (isNaN(parsedSetId)) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'Invalid MCQ set ID format',
                    field: 'setId'
                });
            }

            // Using predefined MCQ set
            const mcqSet = await prisma.mCQSet.findUnique({
                where: { id: parsedSetId },
                include: {
                    mcqs: {
                        orderBy: { order: 'asc' },
                        select: { mcqId: true }
                    }
                }
            });

            if (!mcqSet) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
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
            // Validate custom MCQ IDs
            if (customMCQIds.length === 0) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'At least one MCQ ID must be provided',
                    field: 'customMCQIds'
                });
            }
            mcqIds = customMCQIds.map(id => {
                const parsed = parseInt(id);
                if (isNaN(parsed)) {
                    throw new Error(`Invalid MCQ ID format: ${id}`);
                }
                return parsed;
            });
        } else if (moduleId) {
            // Validate moduleId format
            const parsedModuleId = parseInt(moduleId);
            if (isNaN(parsedModuleId)) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'Invalid module ID format',
                    field: 'moduleId'
                });
            }

            // Get random MCQs from module
            const mcqs = await prisma.mCQ.findMany({
                where: {
                    moduleId: parsedModuleId,
                    collegeId: req.user.collegeId
                },
                select: { id: true },
                take: 10
            });
            if (mcqs.length === 0) {
                return res.status(HTTP_STATUS.NOT_FOUND).json({
                    success: false,
                    error: 'No MCQs available in this module'
                });
            }
            mcqIds = mcqs.map(m => m.id);
        } else {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Either setId, customMCQIds, or moduleId is required',
                fields: ['setId', 'customMCQIds', 'moduleId']
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
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        // Validate user authentication
        if (!req.user || !req.user.id) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                error: 'User authentication required'
            });
        }

        const { sessionId } = req.params;
        const { answers, timeSpent } = req.body;

        // Validate sessionId format
        const parsedSessionId = parseInt(sessionId);
        if (isNaN(parsedSessionId)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Invalid session ID format',
                field: 'sessionId'
            });
        }

        // Validate answers array
        if (!answers || !Array.isArray(answers) || answers.length === 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Answers array is required and must contain at least one answer',
                field: 'answers'
            });
        }

        // Validate each answer object
        for (let i = 0; i < answers.length; i++) {
            const answer = answers[i];
            if (!answer.mcqId || !answer.selectedAnswer) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: `Answer at index ${i} is missing mcqId or selectedAnswer`,
                    field: `answers[${i}]`
                });
            }
        }

        const session = await prisma.quizSession.findUnique({
            where: { id: parsedSessionId }
        });

        if (!session) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                error: 'Quiz session not found'
            });
        }

        // Verify ownership
        if (session.studentId !== req.user.id) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                error: 'You do not have permission to submit this quiz session'
            });
        }

        // Check if already submitted
        if (session.status === 'SUBMITTED') {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'This quiz has already been submitted'
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
                    sessionId: parsedSessionId
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
            where: { id: parsedSessionId },
            data: {
                status: 'SUBMITTED',
                score,
                correctAnswers: correctCount,
                timeSpent: timeSpent || null,
                submittedAt: new Date()
            }
        });

        // Update performance analytics and get recommendations
        let recommendations = null;
        try {
            await updatePerformanceAnalytics(req.user.id, attempts.map(a => ({
                mcqId: a.mcqId,
                isCorrect: a.isCorrect
            })));
            
            // Analyze immediate quiz performance
            const { analyzeQuizPerformance, getStudyRecommendations } = await import('../services/analytics.service.js');
            const quizAnalysis = analyzeQuizPerformance(attempts, score);
            
            // Get personalized recommendations based on quiz analysis and historical data
            recommendations = await getStudyRecommendations(req.user.id, quizAnalysis);
        } catch (err) {
            console.error('Error updating analytics or getting recommendations:', err);
            // Don't fail the response if analytics fail
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            results: {
                sessionId: parsedSessionId,
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
            })),
            recommendations: recommendations || {
                status: 'UNAVAILABLE',
                message: 'Recommendations are being calculated. Check your analytics dashboard.',
                recommendations: []
            }
        });
    } catch (error) {
        console.error('Submit quiz session error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        // Validate user authentication
        if (!req.user || !req.user.id) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                error: 'User authentication required'
            });
        }

        const { sessionId } = req.params;

        // Validate sessionId format
        const parsedSessionId = parseInt(sessionId);
        if (isNaN(parsedSessionId)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Invalid session ID format',
                field: 'sessionId'
            });
        }

        const session = await prisma.quizSession.findUnique({
            where: { id: parsedSessionId },
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
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        // Validate user authentication
        if (!req.user || !req.user.id) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                error: 'User authentication required'
            });
        }

        console.log('📚 Getting quiz history for student:', req.user.id);
        const { moduleId, limit = 20 } = req.query;

        // Validate limit parameter
        const parsedLimit = parseInt(limit);
        if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Limit must be a number between 1 and 100',
                field: 'limit'
            });
        }

        // Validate moduleId if provided
        let parsedModuleId = null;
        if (moduleId) {
            parsedModuleId = parseInt(moduleId);
            if (isNaN(parsedModuleId)) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({
                    success: false,
                    error: 'Invalid module ID format',
                    field: 'moduleId'
                });
            }
        }

        const whereClause = {
            studentId: req.user.id,
            status: 'SUBMITTED'
        };

        if (parsedModuleId) {
            whereClause.moduleId = parsedModuleId;
        }

        console.log('🔍 Query params:', { moduleId, limit, whereClause });

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
            take: parsedLimit
        });

        console.log('✅ Found sessions:', sessions.length);

        const stats = {
            totalQuizzes: sessions.length,
            averageScore: sessions.length > 0
                ? (sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length).toFixed(2)
                : '0.00',
            totalQuestions: sessions.reduce((sum, s) => sum + s.totalQuestions, 0),
            totalCorrect: sessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0)
        };

        res.status(HTTP_STATUS.OK).json({
            success: true,
            stats,
            data: sessions
        });
    } catch (error) {
        console.error('❌ Get quiz history error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            user: req.user?.id
        });
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        // Validate user authentication
        if (!req.user || !req.user.id) {
            return res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                error: 'User authentication required'
            });
        }

        const { sessionId } = req.params;

        // Validate sessionId format
        const parsedSessionId = parseInt(sessionId);
        if (isNaN(parsedSessionId)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Invalid session ID format',
                field: 'sessionId'
            });
        }

        const session = await prisma.quizSession.findUnique({
            where: { id: parsedSessionId }
        });

        if (!session) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                error: 'Quiz session not found'
            });
        }

        // Verify ownership
        if (session.studentId !== req.user.id) {
            return res.status(HTTP_STATUS.FORBIDDEN).json({
                success: false,
                error: 'You do not have permission to abandon this quiz session'
            });
        }

        // Validate session can be abandoned
        if (session.status === 'SUBMITTED') {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'Cannot abandon a quiz that has already been submitted'
            });
        }

        if (session.status === 'ABANDONED') {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: 'This quiz session is already abandoned'
            });
        }

        await prisma.quizSession.update({
            where: { id: parsedSessionId },
            data: { status: 'ABANDONED', abandonedAt: new Date() }
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: 'Quiz session abandoned successfully'
        });
    } catch (error) {
        console.error('Abandon quiz session error:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: ERROR_MESSAGES.DATABASE_ERROR,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
