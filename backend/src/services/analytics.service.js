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

      // Skip analytics for MCQs without moduleId
      // Analytics are module-based, so we need a module to track performance
      if (!mcq.moduleId) {
        console.log(`⚠️ Skipping analytics for MCQ ${attempt.mcqId} - no moduleId`);
        continue;
      }

      const key = `${mcq.moduleId}_${mcq.topic || 'null'}_${mcq.difficulty}`;
      
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
 * Analyze immediate quiz results and generate targeted recommendations
 * @param {Array} attempts - Quiz attempts with topics and correctness
 * @param {number} score - Quiz score percentage
 */
export function analyzeQuizPerformance(attempts, score) {
  // Group by topic
  const topicPerformance = {};
  const difficultyPerformance = { EASY: { total: 0, correct: 0 }, MEDIUM: { total: 0, correct: 0 }, HARD: { total: 0, correct: 0 } };
  
  attempts.forEach(attempt => {
    const topic = attempt.topic || 'General';
    const difficulty = attempt.difficulty || 'MEDIUM';
    
    if (!topicPerformance[topic]) {
      topicPerformance[topic] = { total: 0, correct: 0, difficulty: difficulty };
    }
    topicPerformance[topic].total++;
    if (attempt.isCorrect) {
      topicPerformance[topic].correct++;
    }
    
    difficultyPerformance[difficulty].total++;
    if (attempt.isCorrect) {
      difficultyPerformance[difficulty].correct++;
    }
  });

  // Calculate topic accuracies
  const topicAnalysis = Object.entries(topicPerformance).map(([topic, data]) => ({
    topic,
    accuracy: ((data.correct / data.total) * 100).toFixed(1),
    total: data.total,
    correct: data.correct,
    difficulty: data.difficulty
  })).sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy));

  // Find weak topics (below 60%)
  const weakTopics = topicAnalysis.filter(t => parseFloat(t.accuracy) < 60);
  const moderateTopics = topicAnalysis.filter(t => parseFloat(t.accuracy) >= 60 && parseFloat(t.accuracy) < 80);
  const strongTopics = topicAnalysis.filter(t => parseFloat(t.accuracy) >= 80);

  return {
    topicAnalysis,
    weakTopics,
    moderateTopics,
    strongTopics,
    difficultyPerformance,
    overallScore: score
  };
}

/**
 * Get personalized study recommendations
 * @param {number} studentId - Student ID
 * @param {Object} quizAnalysis - Optional immediate quiz analysis
 */
export async function getStudyRecommendations(studentId, quizAnalysis = null) {
  try {
    const weakPoints = await getWeakPoints(studentId, 65);
    return buildGapAnalysisRecommendations(weakPoints, quizAnalysis);
    const recommendations = [];
    let focusSections = [];
    
    // If we have immediate quiz analysis, prioritize those recommendations
    if (quizAnalysis) {
      const { weakTopics, moderateTopics, strongTopics, overallScore, difficultyPerformance } = quizAnalysis;
      
      // Immediate feedback based on quiz
      if (overallScore >= 80) {
        recommendations.push({
          priority: 'SUCCESS',
          type: 'POSITIVE_REINFORCEMENT',
          message: `🎉 Excellent work! You scored ${overallScore}%`,
          action: strongTopics.length > 0 
            ? `You\'ve mastered: ${strongTopics.map(t => t.topic).join(', ')}. Ready for harder challenges!`
            : 'Keep up the great work!',
          estimatedTime: 'Continue practicing'
        });
      }

      // Immediate weak areas from this quiz
      if (weakTopics.length > 0) {
        focusSections = weakTopics;
        
        weakTopics.forEach((topic, index) => {
          if (index < 3) { // Top 3 weak topics from this quiz
            const isCritical = parseFloat(topic.accuracy) < 40;
            const isVeryWeak = parseFloat(topic.accuracy) < 20;
            
            // Generate specific study plan based on performance level
            const studyPlan = generateDetailedStudyPlan(topic, isCritical, isVeryWeak);
            
            recommendations.push({
              priority: isCritical ? 'CRITICAL' : 'HIGH',
              type: 'FOCUS_SECTION',
              topic: topic.topic,
              difficulty: topic.difficulty,
              message: `📍 Master "${topic.topic}" - Current Performance: ${topic.correct}/${topic.total} (${topic.accuracy}%)`,
              action: studyPlan.action,
              estimatedTime: studyPlan.timeEstimate,
              resources: studyPlan.resources,
              studySteps: studyPlan.steps,
              specificFocus: studyPlan.specificAreas,
              quickWins: studyPlan.quickWins
            });
          }
        });
      }

      // Moderate topics - need some work
      if (moderateTopics.length > 0 && weakTopics.length === 0) {
        moderateTopics.slice(0, 2).forEach(topic => {
          recommendations.push({
            priority: 'MEDIUM',
            type: 'IMPROVEMENT_AREA',
            topic: topic.topic,
            difficulty: topic.difficulty,
            message: `📚 Strengthen "${topic.topic}" - Current: ${topic.accuracy}%, Target: 80%+`,
            action: 'Review concepts and practice edge cases',
            estimatedTime: '15-20 minutes',
            resources: [
              'Re-read key sections',
              'Try 3-5 practice problems'
            ]
          });
        });
      }

      // Difficulty-based recommendations
      const easyAcc = difficultyPerformance.EASY.total > 0 
        ? (difficultyPerformance.EASY.correct / difficultyPerformance.EASY.total) * 100 
        : 100;
      const mediumAcc = difficultyPerformance.MEDIUM.total > 0 
        ? (difficultyPerformance.MEDIUM.correct / difficultyPerformance.MEDIUM.total) * 100 
        : 100;
      const hardAcc = difficultyPerformance.HARD.total > 0 
        ? (difficultyPerformance.HARD.correct / difficultyPerformance.HARD.total) * 100 
        : 100;

      if (easyAcc < 70 && difficultyPerformance.EASY.total > 0) {
        recommendations.push({
          priority: 'HIGH',
          type: 'DIFFICULTY_ADJUSTMENT',
          message: `⚡ Struggling with basic concepts (${easyAcc.toFixed(0)}% on EASY questions)`,
          action: 'Focus on fundamentals before moving to harder topics',
          estimatedTime: '30-40 minutes',
          resources: [
            'Review basic definitions and concepts',
            'Work through simple examples step-by-step',
            'Build strong foundation before advancing'
          ]
        });
      } else if (mediumAcc < 60 && difficultyPerformance.MEDIUM.total > 0) {
        recommendations.push({
          priority: 'MEDIUM',
          type: 'DIFFICULTY_ADJUSTMENT',
          message: `📊 Ready to tackle medium-level problems (${mediumAcc.toFixed(0)}% on MEDIUM questions)`,
          action: 'Practice applying concepts to new scenarios',
          estimatedTime: '20-30 minutes'
        });
      } else if (easyAcc >= 80 && mediumAcc >= 80 && difficultyPerformance.HARD.total > 0) {
        recommendations.push({
          priority: 'LOW',
          type: 'CHALLENGE',
          message: `🚀 Strong performance! ${hardAcc > 0 ? `${hardAcc.toFixed(0)}% on HARD questions` : 'Ready for advanced challenges'}`,
          action: 'Challenge yourself with complex problems',
          estimatedTime: '30-45 minutes'
        });
      }
    }
    
    // Add historical weak points if no immediate quiz analysis or for additional context
    if (weakPoints.length === 0 && recommendations.length === 0) {
      return {
        status: 'STRONG',
        message: 'Great job! You\'re performing well across all areas.',
        focusSections: [],
        recommendations: []
      };
    }

    // Critical areas from history - immediate attention
    const critical = weakPoints.filter(w => w.severity === 'CRITICAL');
    if (critical.length > 0 && !quizAnalysis) {
      for (const area of critical.slice(0, 2)) {
        recommendations.push({
          priority: 'CRITICAL',
          type: 'HISTORICAL_WEAKNESS',
          module: area.module,
          topic: area.topic,
          difficulty: area.difficulty,
          message: `🚨 Persistent weak area: ${area.topic} in ${area.module.name}. Accuracy: ${area.accuracy}%`,
          action: 'Dedicate focused study session to this topic',
          estimatedTime: '30-45 minutes',
          resources: [
            'Review all study materials',
            'Take practice quizzes',
            'Seek help from instructor if needed'
          ]
        });
      }
    }

    // High priority areas from history
    const high = weakPoints.filter(w => w.severity === 'HIGH');
    if (high.length > 0 && recommendations.length < 5) {
      for (const area of high.slice(0, 2)) {
        recommendations.push({
          priority: 'HIGH',
          type: 'PRACTICE_NEEDED',
          module: area.module,
          topic: area.topic,
          difficulty: area.difficulty,
          message: `⚠️ Needs improvement: ${area.topic} in ${area.module.name} (${area.accuracy}%)`,
          action: 'Regular practice with increasing difficulty',
          estimatedTime: '20-30 minutes'
        });
      }
    }

    // Study path recommendation
    if (focusSections.length > 0) {
      const studyPath = generateStudyPath(focusSections);
      recommendations.push({
        priority: 'INFO',
        type: 'STUDY_PATH',
        message: '📋 Recommended Study Path',
        action: studyPath,
        estimatedTime: 'Follow this sequence for best results'
      });
    }

    const status = critical.length > 0 || (quizAnalysis && quizAnalysis.overallScore < 60) 
      ? 'NEEDS_ATTENTION' 
      : quizAnalysis && quizAnalysis.overallScore >= 80 
        ? 'STRONG' 
        : 'IMPROVING';

    return {
      status,
      message: generateStatusMessage(status, quizAnalysis),
      totalWeakAreas: weakPoints.length,
      focusSections: focusSections.map(t => ({
        topic: t.topic,
        accuracy: t.accuracy,
        priority: parseFloat(t.accuracy) < 40 ? 'CRITICAL' : parseFloat(t.accuracy) < 60 ? 'HIGH' : 'MEDIUM'
      })),
      recommendations: recommendations.slice(0, 6) // Limit to top 6 recommendations
    };
  } catch (error) {
    console.error('❌ Error getting recommendations:', error);
    throw error;
  }
}

/**
 * Generate detailed, actionable study plan for a specific topic
 * @param {Object} topic - Topic data with accuracy, correct, total
 * @param {boolean} isCritical - Whether this is a critical weak area
 * @param {boolean} isVeryWeak - Whether performance is extremely low
 * @returns {Object} Detailed study plan with steps, resources, and specific focus areas
 */
function generateDetailedStudyPlan(topic, isCritical, isVeryWeak) {
  const topicName = topic.topic;
  const accuracy = parseFloat(topic.accuracy);
  const difficulty = topic.difficulty;
  
  // Base action based on severity
  let action;
  let timeEstimate;
  let steps = [];
  let specificAreas = [];
  let quickWins = [];
  let resources = [];

  if (isVeryWeak) {
    // Less than 20% - needs complete restart
    action = `Start from the basics - you need a fresh foundation in ${topicName}`;
    timeEstimate = '45-60 minutes (spread over 2-3 sessions)';
    
    steps = [
      {
        step: 1,
        title: 'Understand the Fundamentals',
        description: `Begin with basic definitions and core concepts of ${topicName}`,
        duration: '15-20 min',
        actionItems: [
          `Read introduction and overview of ${topicName}`,
          'Take notes on key terminology and basic principles',
          'Create a simple concept map or diagram'
        ]
      },
      {
        step: 2,
        title: 'Study Simple Examples',
        description: 'Work through 2-3 basic examples step-by-step',
        duration: '15-20 min',
        actionItems: [
          'Find the simplest example problems',
          'Follow along with detailed solutions',
          'Identify the pattern or approach used'
        ]
      },
      {
        step: 3,
        title: 'Practice Easy Questions',
        description: 'Try 3-5 EASY difficulty questions on your own',
        duration: '15-20 min',
        actionItems: [
          'Start with very basic questions',
          'Check your answers immediately',
          'Review mistakes and understand why you got them wrong'
        ]
      }
    ];

    specificAreas = [
      `Core definition and purpose of ${topicName}`,
      `Basic terminology related to ${topicName}`,
      `Simple real-world applications`,
      `Common beginner mistakes to avoid`
    ];

    quickWins = [
      'Start with just understanding WHAT it is before WHY it works',
      'Use visual aids (diagrams, flowcharts) if available',
      'Practice explaining the concept in your own words'
    ];

    resources = [
      `📖 Review course textbook: Chapter on ${topicName} (introduction section)`,
      `🎥 Watch beginner tutorial video: "${topicName} explained for beginners"`,
      `📝 Study lecture notes specifically covering ${topicName} basics`,
      `💡 Find simple examples: Search for "easy ${topicName} examples"`,
      `👥 Consider: Ask your instructor or TA for fundamental concept clarification`
    ];

  } else if (isCritical) {
    // 20-40% - significant gaps
    action = `Strengthen your foundation in ${topicName} through focused review and practice`;
    timeEstimate = '30-40 minutes';
    
    steps = [
      {
        step: 1,
        title: 'Identify Knowledge Gaps',
        description: `Review which aspects of ${topicName} you're struggling with`,
        duration: '5-10 min',
        actionItems: [
          'Look at the questions you got wrong',
          'Identify common patterns in your mistakes',
          'List specific concepts that confused you'
        ]
      },
      {
        step: 2,
        title: 'Targeted Concept Review',
        description: 'Study the specific areas you identified',
        duration: '15-20 min',
        actionItems: [
          `Re-read sections about ${topicName} focusing on your weak areas`,
          'Pay special attention to formulas, rules, or key principles',
          'Create summary notes highlighting important points'
        ]
      },
      {
        step: 3,
        title: 'Practice Similar Problems',
        description: 'Work on 5-7 practice questions at your current level',
        duration: '10-15 min',
        actionItems: [
          `Find practice questions on ${topicName}`,
          'Try to solve them without looking at solutions first',
          'Review explanations for both correct and incorrect attempts'
        ]
      }
    ];

    specificAreas = [
      `Key principles and rules governing ${topicName}`,
      `Common problem-solving patterns`,
      `Typical question formats and what they're testing`,
      `Mistakes you made and how to avoid them`
    ];

    quickWins = [
      'Focus on the question types you saw in this quiz',
      'Master one sub-concept at a time rather than everything at once',
      'Create a cheat sheet with key formulas or steps'
    ];

    resources = [
      `📖 Course material: Detailed chapter on ${topicName}`,
      `🎥 Tutorial videos covering ${topicName} applications`,
      `📝 Review your class notes and homework on this topic`,
      `💻 Practice problems: ${difficulty} level ${topicName} exercises`,
      `📚 Additional resources: Online tutorials or study guides`
    ];

  } else {
    // 40-60% - needs reinforcement
    action = `Reinforce and deepen your understanding of ${topicName}`;
    timeEstimate = '20-30 minutes';
    
    steps = [
      {
        step: 1,
        title: 'Review Mistakes',
        description: 'Analyze the questions you got wrong',
        duration: '5-10 min',
        actionItems: [
          'Understand why your answers were incorrect',
          'Identify if it was a concept issue or careless mistake',
          'Note specific areas that need attention'
        ]
      },
      {
        step: 2,
        title: 'Practice Edge Cases',
        description: `Work on trickier ${topicName} problems`,
        duration: '10-15 min',
        actionItems: [
          'Try variations of problems you got wrong',
          'Focus on edge cases and special scenarios',
          'Look for common tricks or gotchas'
        ]
      },
      {
        step: 3,
        title: 'Test Understanding',
        description: 'Attempt 3-5 new practice questions',
        duration: '5-10 min',
        actionItems: [
          'Try questions you haven\'t seen before',
          'Check if you can consistently get them right',
          'Aim for 80%+ accuracy to confirm mastery'
        ]
      }
    ];

    specificAreas = [
      `Advanced applications of ${topicName}`,
      `Common variations and edge cases`,
      `Integration with related concepts`,
      `Subtle distinctions and nuances`
    ];

    quickWins = [
      'You\'re close! Focus on consistency rather than learning new concepts',
      'Practice time management - make sure you read questions carefully',
      'Review the explanation for each mistake to prevent repeating them'
    ];

    resources = [
      `📝 Review solutions to similar problems`,
      `💡 Practice question banks focusing on ${topicName}`,
      `🎯 Past exam questions on this topic`,
      `📖 Advanced examples and case studies`
    ];
  }

  return {
    action,
    timeEstimate,
    steps,
    specificAreas,
    quickWins,
    resources
  };
}

function buildGapAnalysisRecommendations(weakPoints, quizAnalysis) {
  const recommendations = [];
  let focusSections = [];

  if (quizAnalysis) {
    const { weakTopics, moderateTopics, strongTopics, overallScore, difficultyPerformance, topicAnalysis } = quizAnalysis;
    const prioritizedTopics = weakTopics.length > 0 ? weakTopics : moderateTopics;
    focusSections = prioritizedTopics.slice(0, 3);

    recommendations.push(buildStrengthRecommendation(strongTopics, moderateTopics, overallScore));

    if (focusSections.length > 0) {
      recommendations.push(buildWeakAreasRecommendation(focusSections));
      recommendations.push(buildPriorityRecommendation(focusSections, topicAnalysis));
    }

    recommendations.push(buildTimeManagementRecommendation(difficultyPerformance, overallScore));
  } else if (weakPoints.length > 0) {
    const historicalFocus = weakPoints.slice(0, 3).map((area) => ({
      topic: area.topic,
      accuracy: area.accuracy,
      total: area.attempts,
      correct: Math.round((area.accuracy / 100) * area.attempts),
      difficulty: area.difficulty
    }));

    focusSections = historicalFocus;

    recommendations.push({
      priority: 'MEDIUM',
      type: 'STRENGTHS',
      message: 'Your recent practice history shows that you are staying engaged.',
      action: 'Keep one stronger topic active each week while you repair the weaker ones.',
      estimatedTime: '10-15 minutes',
      resources: [
        'Retain your better topics with one short revision session each week.',
        'Use a stronger topic first if you need a quick confidence reset before harder revision.'
      ]
    });
    recommendations.push(buildWeakAreasRecommendation(historicalFocus));
    recommendations.push(buildPriorityRecommendation(historicalFocus, historicalFocus));
    recommendations.push({
      priority: 'MEDIUM',
      type: 'TIME_MANAGEMENT',
      message: 'Your history suggests you need a steady revision rhythm.',
      action: 'Use short and repeated sessions instead of one long review block.',
      estimatedTime: '20-25 minutes',
      resources: [
        'Spend 15 minutes reviewing concepts and 10 minutes answering practice questions.',
        'Revisit the same weak topic within 24 hours to improve recall.'
      ]
    });
  } else {
    return {
      status: 'STRONG',
      message: 'You are performing well overall. Maintain regular practice and push into harder questions.',
      focusSections: [],
      recommendations: [
        {
          priority: 'SUCCESS',
          type: 'STRENGTHS',
          message: 'You are showing balanced performance across the assessed topics.',
          action: 'Maintain your level with short revision and gradually increase difficulty.',
          estimatedTime: '10-15 minutes',
          resources: [
            'Review one completed quiz before attempting the next one.',
            'Add a few medium and hard questions to keep improving.'
          ]
        }
      ]
    };
  }

  const critical = weakPoints.filter((point) => point.severity === 'CRITICAL');
  const status = critical.length > 0 || (quizAnalysis && quizAnalysis.overallScore < 60)
    ? 'NEEDS_ATTENTION'
    : quizAnalysis && quizAnalysis.overallScore >= 80
      ? 'STRONG'
      : 'IMPROVING';

  return {
    status,
    message: generateStatusMessage(status, quizAnalysis),
    totalWeakAreas: quizAnalysis ? quizAnalysis.weakTopics.length : weakPoints.length,
    focusSections: focusSections.map((topic) => ({
      topic: topic.topic,
      accuracy: parseFloat(topic.accuracy),
      attempts: topic.total,
      priority: parseFloat(topic.accuracy) < 40 ? 'CRITICAL' : parseFloat(topic.accuracy) < 60 ? 'HIGH' : 'MEDIUM',
      estimatedTime: getEstimatedRevisionTime(parseFloat(topic.accuracy))
    })),
    recommendations: recommendations.filter(Boolean).slice(0, 4)
  };
}

function getEstimatedRevisionTime(accuracy) {
  if (accuracy < 40) return '25-30 minutes';
  if (accuracy < 60) return '20-25 minutes';
  return '15-20 minutes';
}

function buildStrengthRecommendation(strongTopics, moderateTopics, overallScore) {
  const strongestTopics = strongTopics.slice(0, 3).map((topic) => topic.topic);
  const fallbackTopics = moderateTopics.slice(0, 2).map((topic) => topic.topic);
  const topicsToMention = strongestTopics.length > 0 ? strongestTopics : fallbackTopics;

  return {
    priority: overallScore >= 80 ? 'SUCCESS' : 'MEDIUM',
    type: 'STRENGTHS',
    message: topicsToMention.length > 0
      ? `Your strengths in this attempt were ${topicsToMention.join(', ')}.`
      : 'You are starting to build a working understanding of this set.',
    action: overallScore >= 80
      ? 'Maintain these areas with a short mixed review while you focus on weaker topics.'
      : 'Use your stronger topics to keep confidence high while you repair weaker areas.',
    estimatedTime: '10-15 minutes',
    resources: [
      'Reattempt one or two correct questions to confirm why your reasoning worked.',
      'Do not spend most of your revision time here; maintain, then move to weaker topics.'
    ]
  };
}

function buildWeakAreasRecommendation(focusSections) {
  return {
    priority: focusSections.some((topic) => parseFloat(topic.accuracy) < 40) ? 'CRITICAL' : 'HIGH',
    type: 'WEAK_AREAS',
    message: 'These topics are causing the main score loss right now.',
    action: 'Fix these first before moving to new content.',
    estimatedTime: getEstimatedRevisionTime(parseFloat(focusSections[0]?.accuracy || 60)),
    resources: focusSections.map((topic) => {
      const accuracy = parseFloat(topic.accuracy);
      const base = `${topic.topic}: ${accuracy.toFixed(1)}% accuracy`;

      if (accuracy < 40) {
        return `${base}. Relearn the core concept, then solve 4-5 basic questions on it.`;
      }

      return `${base}. Review the mistakes and practice similar questions until the method feels clear.`;
    })
  };
}

function buildPriorityRecommendation(focusSections, topicAnalysis) {
  const strongerTopics = topicAnalysis
    .filter((topic) => parseFloat(topic.accuracy) >= 60)
    .slice(0, 2)
    .map((topic) => topic.topic);

  return {
    priority: 'HIGH',
    type: 'STUDY_PRIORITY',
    message: 'Use this revision order to recover marks faster.',
    action: 'Move to the next topic only after you can answer a similar question correctly without guessing.',
    estimatedTime: '30-40 minutes',
    resources: [
      ...focusSections.map((topic, index) => `${index + 1}. ${topic.topic} for ${getEstimatedRevisionTime(parseFloat(topic.accuracy))}.`),
      strongerTopics.length > 0
        ? `After that, briefly maintain ${strongerTopics.join(' and ')} so you do not lose accuracy there.`
        : 'End with a short mixed review set to check whether the improvement holds.'
    ]
  };
}

function buildTimeManagementRecommendation(difficultyPerformance, overallScore) {
  const easyAcc = difficultyPerformance.EASY.total > 0
    ? (difficultyPerformance.EASY.correct / difficultyPerformance.EASY.total) * 100
    : null;
  const mediumAcc = difficultyPerformance.MEDIUM.total > 0
    ? (difficultyPerformance.MEDIUM.correct / difficultyPerformance.MEDIUM.total) * 100
    : null;
  const hardAcc = difficultyPerformance.HARD.total > 0
    ? (difficultyPerformance.HARD.correct / difficultyPerformance.HARD.total) * 100
    : null;

  const resources = [
    'Use a two-pass approach: secure the quick marks first, then return to the harder questions.',
    'If a question is taking too long, eliminate weak options and move on instead of getting stuck early.'
  ];

  if (easyAcc !== null && easyAcc < 70) {
    resources.push('Because easy-question accuracy is low, slow down slightly and read the stem carefully before choosing an answer.');
  } else if (mediumAcc !== null && mediumAcc < 60) {
    resources.push('Spend more of your revision time on application questions where selecting the right method is the issue.');
  } else if (hardAcc !== null && hardAcc < 50) {
    resources.push('Treat hard questions as second-pass questions. Secure easy and medium marks first.');
  } else if (overallScore >= 80) {
    resources.push('Your base accuracy is stable, so you can now allocate a little more time to the harder questions.');
  }

  return {
    priority: 'MEDIUM',
    type: 'TIME_MANAGEMENT',
    message: 'Your next score can improve with better timing as well as topic review.',
    action: 'Keep revision sessions short, focused, and timed.',
    estimatedTime: '15-20 minutes',
    resources
  };
}

/**
 * Generate a study path based on weak sections
 */
function generateStudyPath(weakTopics) {
  const steps = [];
  
  weakTopics.sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy));
  
  weakTopics.forEach((topic, index) => {
    steps.push(`${index + 1}. Master "${topic.topic}" (currently ${topic.accuracy}%)`);
  });
  
  return steps.join(' → ');
}

/**
 * Generate status message based on performance
 */
function generateStatusMessage(status, quizAnalysis) {
  if (!quizAnalysis) {
    if (status === 'STRONG') return 'You\'re doing great overall!';
    if (status === 'NEEDS_ATTENTION') return 'Several areas need focused attention.';
    return 'You\'re making progress. Keep practicing!';
  }
  
  const score = quizAnalysis.overallScore;
  if (score >= 90) return `Outstanding performance! ${score}% - You\'ve mastered this material.`;
  if (score >= 80) return `Great work! ${score}% - You have a strong grasp of the concepts.`;
  if (score >= 70) return `Good effort! ${score}% - Focus on the areas below to improve.`;
  if (score >= 60) return `You\'re getting there! ${score}% - Review the recommended sections.`;
  return `${score}% - Don\'t worry! Focus on the sections below and you\'ll improve quickly.`;
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
