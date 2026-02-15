/**
 * Analytics Service
 * Analyzes student performance, identifies weak points, provides recommendations
 */

import prisma from '../prisma.js';

/**
 * Update performance analytics after quiz submission
 * @param {number} studentId - Student ID
 * @param {Array} attempts - Array of MCQ attempts from the session
 */
export async function updatePerformanceAnalytics(studentId, attempts) {
  try {
    // Group attempts by module, topic, and difficulty
    const groupedAttempts = {};

    for (const attempt of attempts) {
      const mcq = await prisma.mCQ.findUnique({
        where: { id: attempt.mcqId },
        select: { moduleId: true, topic: true, difficulty: true }
      });

      if (!mcq) continue;

      const key = `${mcq.moduleId || 'null'}_${mcq.topic || 'null'}_${mcq.difficulty}`;
      
      if (!groupedAttempts[key]) {
        groupedAttempts[key] = {
          moduleId: mcq.moduleId,
          topic: mcq.topic,
          difficulty: mcq.difficulty,
          total: 0,
          correct: 0
        };
      }

      groupedAttempts[key].total++;
      if (attempt.isCorrect) {
        groupedAttempts[key].correct++;
      }
    }

    // Update or create analytics records
    for (const [key, data] of Object.entries(groupedAttempts)) {
      const { moduleId, topic, difficulty, total, correct } = data;

      const existing = await prisma.performanceAnalytics.findUnique({
        where: {
          studentId_moduleId_topic_difficulty: {
            studentId,
            moduleId,
            topic,
            difficulty
          }
        }
      });

      const newTotal = (existing?.totalAttempts || 0) + total;
      const newCorrect = (existing?.correctAttempts || 0) + correct;
      const accuracy = (newCorrect / newTotal) * 100;

      await prisma.performanceAnalytics.upsert({
        where: {
          studentId_moduleId_topic_difficulty: {
            studentId,
            moduleId,
            topic,
            difficulty
          }
        },
        update: {
          totalAttempts: newTotal,
          correctAttempts: newCorrect,
          accuracy,
          lastAttemptedAt: new Date()
        },
        create: {
          studentId,
          moduleId,
          topic,
          difficulty,
          totalAttempts: total,
          correctAttempts: correct,
          accuracy,
          lastAttemptedAt: new Date()
        }
      });
    }

    console.log(`✅ Updated analytics for student ${studentId}`);
  } catch (error) {
    console.error('❌ Error updating analytics:', error);
    throw error;
  }
}

/**
 * Get student's weak points
 * @param {number} studentId - Student ID
 * @param {number} threshold - Accuracy threshold (default 60%)
 */
export async function getWeakPoints(studentId, threshold = 60) {
  try {
    const weakAreas = await prisma.performanceAnalytics.findMany({
      where: {
        studentId,
        accuracy: { lt: threshold },
        totalAttempts: { gte: 3 } // At least 3 attempts to be statistically relevant
      },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            code: true,
            year: true
          }
        }
      },
      orderBy: {
        accuracy: 'asc' // Weakest first
      }
    });

    return weakAreas.map(area => ({
      module: area.module,
      topic: area.topic || 'General',
      difficulty: area.difficulty,
      accuracy: parseFloat(area.accuracy.toFixed(2)),
      attempts: area.totalAttempts,
      lastAttempted: area.lastAttemptedAt,
      severity: calculateSeverity(area.accuracy, area.totalAttempts)
    }));
  } catch (error) {
    console.error('❌ Error getting weak points:', error);
    throw error;
  }
}

/**
 * Calculate severity of weakness (CRITICAL, HIGH, MEDIUM, LOW)
 */
function calculateSeverity(accuracy, attempts) {
  if (accuracy < 30 && attempts >= 5) return 'CRITICAL';
  if (accuracy < 40 && attempts >= 5) return 'HIGH';
  if (accuracy < 50) return 'MEDIUM';
  return 'LOW';
}

/**
 * Get personalized study recommendations
 * @param {number} studentId - Student ID
 */
export async function getStudyRecommendations(studentId) {
  try {
    const weakPoints = await getWeakPoints(studentId, 65);
    
    if (weakPoints.length === 0) {
      return {
        status: 'STRONG',
        message: 'Great job! You\'re performing well across all areas.',
        recommendations: []
      };
    }

    // Prioritize recommendations
    const recommendations = [];

    // Critical areas - immediate attention
    const critical = weakPoints.filter(w => w.severity === 'CRITICAL');
    if (critical.length > 0) {
      for (const area of critical) {
        recommendations.push({
          priority: 'CRITICAL',
          type: 'IMMEDIATE_REVIEW',
          module: area.module,
          topic: area.topic,
          difficulty: area.difficulty,
          message: `🚨 Urgent: Review ${area.topic} in ${area.module.name}. Current accuracy: ${area.accuracy}%`,
          action: 'Take focused practice quiz',
          estimatedTime: '30-45 minutes'
        });
      }
    }

    // High priority areas
    const high = weakPoints.filter(w => w.severity === 'HIGH');
    if (high.length > 0) {
      for (const area of high.slice(0, 3)) { // Top 3
        recommendations.push({
          priority: 'HIGH',
          type: 'PRACTICE_NEEDED',
          module: area.module,
          topic: area.topic,
          difficulty: area.difficulty,
          message: `⚠️ Practice more on ${area.topic} in ${area.module.name}. Current accuracy: ${area.accuracy}%`,
          action: 'Practice with easier questions first',
          estimatedTime: '20-30 minutes'
        });
      }
    }

    // Medium priority - general improvement
    const medium = weakPoints.filter(w => w.severity === 'MEDIUM');
    if (medium.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        type: 'IMPROVEMENT',
        message: `📚 ${medium.length} topic(s) need improvement`,
        topics: medium.map(m => ({ module: m.module.name, topic: m.topic, accuracy: m.accuracy })),
        action: 'Review notes and attempt practice questions',
        estimatedTime: '15-20 minutes per topic'
      });
    }

    // Difficulty progression recommendation
    const difficultyAnalysis = analyzeDifficultyProgression(weakPoints);
    if (difficultyAnalysis.recommendation) {
      recommendations.push(difficultyAnalysis.recommendation);
    }

    return {
      status: critical.length > 0 ? 'NEEDS_ATTENTION' : 'IMPROVING',
      totalWeakAreas: weakPoints.length,
      recommendations
    };
  } catch (error) {
    console.error('❌ Error getting recommendations:', error);
    throw error;
  }
}

/**
 * Analyze difficulty progression
 */
function analyzeDifficultyProgression(weakPoints) {
  const byDifficulty = {
    EASY: weakPoints.filter(w => w.difficulty === 'EASY'),
    MEDIUM: weakPoints.filter(w => w.difficulty === 'MEDIUM'),
    HARD: weakPoints.filter(w => w.difficulty === 'HARD')
  };

  // If struggling with EASY questions
  if (byDifficulty.EASY.length > 0) {
    return {
      recommendation: {
        priority: 'HIGH',
        type: 'DIFFICULTY_ADJUSTMENT',
        message: '📊 Focus on mastering basic concepts before moving to harder questions',
        action: 'Practice more EASY difficulty questions',
        estimatedTime: '25-30 minutes'
      }
    };
  }

  // If doing well on EASY but struggling with MEDIUM
  if (byDifficulty.EASY.length === 0 && byDifficulty.MEDIUM.length > 2) {
    return {
      recommendation: {
        priority: 'MEDIUM',
        type: 'DIFFICULTY_ADJUSTMENT',
        message: '📈 You\'ve mastered basics. Time to tackle medium difficulty questions',
        action: 'Practice MEDIUM difficulty with explanations',
        estimatedTime: '20-25 minutes'
      }
    };
  }

  return {};
}

/**
 * Get overall student performance statistics
 * @param {number} studentId - Student ID
 */
export async function getOverallStats(studentId) {
  try {
    // Get all attempts
    const attempts = await prisma.mCQAttempt.findMany({
      where: { studentId },
      include: {
        mcq: {
          select: {
            difficulty: true,
            moduleId: true,
            topic: true
          }
        }
      }
    });

    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        correctAttempts: 0,
        accuracy: 0,
        byDifficulty: {},
        byModule: {},
        recentTrend: 'NO_DATA'
      };
    }

    const correctAttempts = attempts.filter(a => a.isCorrect).length;
    const accuracy = (correctAttempts / attempts.length) * 100;

    // By difficulty
    const byDifficulty = {
      EASY: { total: 0, correct: 0 },
      MEDIUM: { total: 0, correct: 0 },
      HARD: { total: 0, correct: 0 }
    };

    attempts.forEach(attempt => {
      const difficulty = attempt.mcq.difficulty;
      byDifficulty[difficulty].total++;
      if (attempt.isCorrect) {
        byDifficulty[difficulty].correct++;
      }
    });

    // Calculate accuracy for each difficulty
    Object.keys(byDifficulty).forEach(key => {
      const data = byDifficulty[key];
      data.accuracy = data.total > 0 ? ((data.correct / data.total) * 100).toFixed(2) : 0;
    });

    // Recent trend (last 20 vs previous 20)
    const recent20 = attempts.slice(-20);
    const previous20 = attempts.slice(-40, -20);
    
    const recentAccuracy = recent20.length > 0 
      ? (recent20.filter(a => a.isCorrect).length / recent20.length) * 100 
      : 0;
    
    const previousAccuracy = previous20.length > 0 
      ? (previous20.filter(a => a.isCorrect).length / previous20.length) * 100 
      : recentAccuracy;

    let recentTrend = 'STABLE';
    if (recentAccuracy > previousAccuracy + 5) recentTrend = 'IMPROVING';
    else if (recentAccuracy < previousAccuracy - 5) recentTrend = 'DECLINING';

    // Quiz sessions completed
    const quizSessions = await prisma.quizSession.findMany({
      where: {
        studentId,
        status: 'SUBMITTED'
      }
    });

    return {
      totalAttempts: attempts.length,
      correctAttempts,
      accuracy: parseFloat(accuracy.toFixed(2)),
      byDifficulty,
      quizzesTaken: quizSessions.length,
      averageQuizScore: quizSessions.length > 0
        ? (quizSessions.reduce((sum, q) => sum + (q.score || 0), 0) / quizSessions.length).toFixed(2)
        : 0,
      recentTrend,
      recentAccuracy: parseFloat(recentAccuracy.toFixed(2))
    };
  } catch (error) {
    console.error('❌ Error getting overall stats:', error);
    throw error;
  }
}

/**
 * Get practice history with daily breakdown
 * @param {number} studentId - Student ID
 * @param {number} days - Number of days (default 30)
 */
export async function getPracticeHistory(studentId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = await prisma.quizSession.findMany({
      where: {
        studentId,
        status: 'SUBMITTED',
        submittedAt: { gte: startDate }
      },
      include: {
        set: {
          select: { title: true }
        },
        module: {
          select: { name: true, code: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Group by date
    const byDate = {};
    sessions.forEach(session => {
      const date = session.submittedAt.toISOString().split('T')[0];
      if (!byDate[date]) {
        byDate[date] = {
          date,
          sessions: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          timeSpent: 0
        };
      }
      byDate[date].sessions++;
      byDate[date].totalQuestions += session.totalQuestions;
      byDate[date].correctAnswers += session.correctAnswers || 0;
      byDate[date].timeSpent += session.timeSpent || 0;
    });

    // Convert to array and add accuracy
    const history = Object.values(byDate).map(day => ({
      ...day,
      accuracy: day.totalQuestions > 0 
        ? ((day.correctAnswers / day.totalQuestions) * 100).toFixed(2) 
        : 0
    }));

    return {
      totalSessions: sessions.length,
      totalQuestions: sessions.reduce((sum, s) => sum + s.totalQuestions, 0),
      totalCorrect: sessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0),
      totalTimeSpent: sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0),
      dailyHistory: history.sort((a, b) => new Date(b.date) - new Date(a.date)),
      recentSessions: sessions.slice(0, 10).map(s => ({
        id: s.id,
        title: s.set?.title || 'Custom Practice',
        module: s.module?.name,
        score: s.score,
        totalQuestions: s.totalQuestions,
        correctAnswers: s.correctAnswers,
        date: s.submittedAt,
        timeSpent: s.timeSpent
      }))
    };
  } catch (error) {
    console.error('❌ Error getting practice history:', error);
    throw error;
  }
}

/**
 * Get module-wise performance
 * @param {number} studentId - Student ID
 */
export async function getModulePerformance(studentId) {
  try {
    const analytics = await prisma.performanceAnalytics.findMany({
      where: { studentId },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            code: true,
            year: true
          }
        }
      }
    });

    // Group by module
    const moduleMap = {};
    
    analytics.forEach(record => {
      if (!record.moduleId) return;
      
      const moduleId = record.moduleId;
      if (!moduleMap[moduleId]) {
        moduleMap[moduleId] = {
          module: record.module,
          totalAttempts: 0,
          correctAttempts: 0,
          topics: [],
          difficulties: {
            EASY: { total: 0, correct: 0 },
            MEDIUM: { total: 0, correct: 0 },
            HARD: { total: 0, correct: 0 }
          }
        };
      }

      const data = moduleMap[moduleId];
      data.totalAttempts += record.totalAttempts;
      data.correctAttempts += record.correctAttempts;
      
      if (record.topic) {
        data.topics.push({
          name: record.topic,
          accuracy: parseFloat(record.accuracy.toFixed(2)),
          attempts: record.totalAttempts
        });
      }

      const diff = record.difficulty;
      data.difficulties[diff].total += record.totalAttempts;
      data.difficulties[diff].correct += record.correctAttempts;
    });

    // Calculate accuracies
    const modulePerformance = Object.values(moduleMap).map(data => {
      const overallAccuracy = data.totalAttempts > 0
        ? ((data.correctAttempts / data.totalAttempts) * 100).toFixed(2)
        : 0;

      Object.keys(data.difficulties).forEach(key => {
        const diff = data.difficulties[key];
        diff.accuracy = diff.total > 0 ? ((diff.correct / diff.total) * 100).toFixed(2) : 0;
      });

      return {
        module: data.module,
        overallAccuracy: parseFloat(overallAccuracy),
        totalAttempts: data.totalAttempts,
        correctAttempts: data.correctAttempts,
        topicBreakdown: data.topics.sort((a, b) => a.accuracy - b.accuracy), // Weakest first
        difficultyBreakdown: data.difficulties
      };
    });

    return modulePerformance.sort((a, b) => a.overallAccuracy - b.overallAccuracy);
  } catch (error) {
    console.error('❌ Error getting module performance:', error);
    throw error;
  }
}
