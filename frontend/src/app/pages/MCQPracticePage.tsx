import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mcqAPI, quizAPI, MCQ, QuizAnswerDetail, QuizResult, Recommendation, FocusSection } from '../../services/api';

interface QuizState {
  sessionId: number | null;
  questions: (MCQ & { questionNumber: number })[];
  answers: { [key: number]: string };
  startTime: number;
  isSubmitting: boolean;
  results: QuizResult | null;
  answerDetails: QuizAnswerDetail[];
  recommendations: {
    status: string;
    message?: string;
    totalWeakAreas?: number;
    recommendations: Recommendation[];
    focusSections?: FocusSection[];
    studyPath?: string;
  } | null;
}

export default function MCQPracticePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<QuizState>({
    sessionId: null,
    questions: [],
    answers: {},
    startTime: Date.now(),
    isSubmitting: false,
    results: null,
    answerDetails: [],
    recommendations: null
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startQuiz();
  }, []);

  const startQuiz = async () => {
    try {
      setLoading(true);
      setError(null);

      const setId = searchParams.get('setId');
      const moduleId = searchParams.get('moduleId');
      const adaptive = searchParams.get('adaptive');
      const generated = searchParams.get('generated');

      let response;

      if (generated === 'true') {
        // Handle generated MCQs from sessionStorage
        const generatedMCQsStr = sessionStorage.getItem('generated_mcqs');
        if (!generatedMCQsStr) {
          setError('No generated MCQs found. Please generate MCQs again.');
          setLoading(false);
          return;
        }

        const generatedMCQs = JSON.parse(generatedMCQsStr);
        
        // Check if MCQs have IDs (saved to database) or need to be saved
        if (generatedMCQs.length > 0 && generatedMCQs[0].id) {
          // MCQs are already in database, start quiz with them
          response = await quizAPI.start({
            customMCQIds: generatedMCQs.map((q: any) => q.id)
          });
        } else {
          // MCQs were not saved to database, display them directly without backend session
          setQuiz(prev => ({
            ...prev,
            sessionId: null, // No backend session for unsaved MCQs
            questions: generatedMCQs.map((mcq: any, index: number) => ({
              ...mcq,
              questionNumber: index + 1
            })),
            startTime: Date.now()
          }));
          sessionStorage.removeItem('generated_mcqs'); // Clear after loading
          setLoading(false);
          return;
        }
        
        sessionStorage.removeItem('generated_mcqs'); // Clear after using
      } else if (adaptive === 'true') {
        // Get adaptive questions
        const adaptiveRes = await mcqAPI.getAdaptive({ count: 10 });
        if (adaptiveRes.data.data.length === 0) {
          setError('No adaptive questions available. Complete more quizzes to get personalized recommendations!');
          setLoading(false);
          return;
        }
        // Start quiz with adaptive questions
        response = await quizAPI.start({
          customMCQIds: adaptiveRes.data.data.map((q: any) => q.id)
        });
      } else if (setId) {
        response = await quizAPI.start({ setId: parseInt(setId) });
      } else if (moduleId) {
        response = await quizAPI.start({ moduleId: parseInt(moduleId) });
      } else {
        setError('No quiz parameters provided');
        setLoading(false);
        return;
      }

      setQuiz(prev => ({
        ...prev,
        sessionId: response.data.session.id,
        questions: response.data.mcqs,
        startTime: Date.now()
      }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (mcqId: number, answer: string) => {
    setQuiz(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [mcqId]: answer
      }
    }));
  };

  // Helper function to generate detailed study plan (client-side)
  const generateClientStudyPlan = (topic: any, accuracy: number, difficulty: string) => {
    const topicName = topic.topic;
    const isVeryWeak = accuracy < 20;
    const isCritical = accuracy < 40;
    
    let studySteps, specificFocus, quickWins, resources;

    if (isVeryWeak) {
      studySteps = [
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

      specificFocus = [
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
      studySteps = [
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

      specificFocus = [
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
      studySteps = [
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

      specificFocus = [
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

    return { studySteps, specificFocus, quickWins, resources };
  };

  // Client-side gap analysis for generated MCQs
  const analyzeClientSidePerformance = (answerDetails: QuizAnswerDetail[], score: number) => {
    // Group by topic
    const topicPerformance: Record<string, { total: number; correct: number; difficulty: string }> = {};
    const difficultyPerformance = { 
      EASY: { total: 0, correct: 0 }, 
      MEDIUM: { total: 0, correct: 0 }, 
      HARD: { total: 0, correct: 0 } 
    };
    
    answerDetails.forEach(attempt => {
      const topic = attempt.topic || 'General';
      const difficulty = (attempt.difficulty || 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD';
      
      if (!topicPerformance[topic]) {
        topicPerformance[topic] = { total: 0, correct: 0, difficulty };
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
      accuracy: parseFloat(((data.correct / data.total) * 100).toFixed(1)),
      total: data.total,
      correct: data.correct,
      difficulty: data.difficulty,
      attempts: data.total
    })).sort((a, b) => a.accuracy - b.accuracy);

    // Categorize topics
    const weakTopics = topicAnalysis.filter(t => t.accuracy < 60);
    const moderateTopics = topicAnalysis.filter(t => t.accuracy >= 60 && t.accuracy < 80);
    const strongTopics = topicAnalysis.filter(t => t.accuracy >= 80);

    // Generate focus sections with priority
    const focusSections: FocusSection[] = [...weakTopics, ...moderateTopics.slice(0, 2)].map(t => ({
      topic: t.topic,
      accuracy: t.accuracy,
      attempts: t.attempts,
      priority: t.accuracy < 40 ? 'CRITICAL' : t.accuracy < 60 ? 'HIGH' : 'MEDIUM' as const,
      estimatedTime: t.accuracy < 40 ? '30-45 minutes' : t.accuracy < 60 ? '25-35 minutes' : '15-20 minutes'
    }));

    // Generate recommendations
    const recommendations: Recommendation[] = [];

    // Overall performance feedback
    if (score >= 80) {
      recommendations.push({
        priority: 'SUCCESS',
        type: 'POSITIVE_REINFORCEMENT',
        message: `🎉 Excellent work! You scored ${score}%`,
        action: strongTopics.length > 0 
          ? `You've mastered: ${strongTopics.map(t => t.topic).join(', ')}. Ready for harder challenges!`
          : 'Keep up the great work!',
        estimatedTime: 'Continue practicing'
      });
    }

    // Weak topics recommendations with detailed study plans
    weakTopics.slice(0, 3).forEach((topic, index) => {
      const studyPlan = generateClientStudyPlan(topic, topic.accuracy, topic.difficulty);
      
      recommendations.push({
        priority: topic.accuracy < 40 ? 'CRITICAL' : 'HIGH',
        type: 'FOCUS_SECTION',
        topic: topic.topic,
        difficulty: topic.difficulty,
        message: `📍 Master "${topic.topic}" - Current Performance: ${topic.correct}/${topic.total} (${topic.accuracy.toFixed(1)}%)`,
        action: topic.accuracy < 20 
          ? `Start from the basics - you need a fresh foundation in ${topic.topic}`
          : topic.accuracy < 40
          ? `Strengthen your foundation in ${topic.topic} through focused review and practice`
          : `Reinforce and deepen your understanding of ${topic.topic}`,
        estimatedTime: topic.accuracy < 20 ? '45-60 minutes (spread over 2-3 sessions)' : topic.accuracy < 40 ? '30-40 minutes' : '20-30 minutes',
        resources: studyPlan.resources,
        studySteps: studyPlan.studySteps,
        specificFocus: studyPlan.specificFocus,
        quickWins: studyPlan.quickWins
      });
    });

    // Moderate topics
    if (moderateTopics.length > 0 && weakTopics.length === 0) {
      moderateTopics.slice(0, 2).forEach(topic => {
        recommendations.push({
          priority: 'MEDIUM',
          type: 'IMPROVEMENT_AREA',
          topic: topic.topic,
          difficulty: topic.difficulty,
          message: `📚 Strengthen "${topic.topic}" - Current: ${topic.accuracy.toFixed(1)}%, Target: 80%+`,
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
    } else if (easyAcc >= 80 && mediumAcc >= 80 && difficultyPerformance.HARD.total > 0) {
      recommendations.push({
        priority: 'LOW',
        type: 'CHALLENGE',
        message: `🚀 Strong performance! ${hardAcc > 0 ? `${hardAcc.toFixed(0)}% on HARD questions` : 'Ready for advanced challenges'}`,
        action: 'Challenge yourself with complex problems',
        estimatedTime: '30-45 minutes'
      });
    }

    const status = score >= 80 ? 'STRONG' : score >= 60 ? 'IMPROVING' : 'NEEDS_ATTENTION';
    const message = score >= 90 ? `Outstanding performance! ${score}% - You've mastered this material.`
      : score >= 80 ? `Great work! ${score}% - You have a strong grasp of the concepts.`
      : score >= 70 ? `Good effort! ${score}% - Focus on the areas below to improve.`
      : score >= 60 ? `You're getting there! ${score}% - Review the recommended sections.`
      : `${score}% - Don't worry! Focus on the sections below and you'll improve quickly.`;

    return {
      status,
      message,
      totalWeakAreas: weakTopics.length,
      recommendations: recommendations.slice(0, 6),
      focusSections
    };
  };

  const handleSubmit = async () => {
    if (Object.keys(quiz.answers).length !== quiz.questions.length) {
      const confirm = window.confirm('You haven\'t answered all questions. Submit anyway?');
      if (!confirm) return;
    }

    try {
      setQuiz(prev => ({ ...prev, isSubmitting: true }));

      const timeSpent = Math.floor((Date.now() - quiz.startTime) / 1000);

      // If no session (generated MCQs not saved to DB), calculate results locally
      if (!quiz.sessionId) {
        const answerDetails: QuizAnswerDetail[] = quiz.questions.map((q, index) => {
          const selectedAnswer = quiz.answers[q.id] || '';
          const correctAnswer = q.correctAnswer || '';
          const isCorrect = selectedAnswer === correctAnswer;
          
          return {
            questionNumber: index + 1,
            question: q.question,
            options: q.options,
            selectedAnswer,
            correctAnswer,
            isCorrect,
            explanation: q.explanation,
            mcqId: q.id,
            topic: q.topic,
            difficulty: q.difficulty || 'MEDIUM'
          };
        });

        const correctAnswers = answerDetails.filter(a => a.isCorrect).length;
        const totalQuestions = quiz.questions.length;
        const score = Math.round((correctAnswers / totalQuestions) * 100);
        const accuracy = ((correctAnswers / totalQuestions) * 100).toFixed(2);

        const results: QuizResult = {
          sessionId: 0, // No backend session
          totalQuestions,
          correctAnswers,
          incorrectAnswers: totalQuestions - correctAnswers,
          score,
          accuracy,
          timeSpent
        };

        // Generate client-side recommendations
        const recommendations = analyzeClientSidePerformance(answerDetails, score);

        setQuiz(prev => ({
          ...prev,
          results,
          answerDetails,
          recommendations,
          isSubmitting: false
        }));

        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Normal flow with backend session
      const answers = quiz.questions.map(q => ({
        mcqId: q.id,
        selectedAnswer: quiz.answers[q.id] || ''
      }));

      const response = await quizAPI.submit(quiz.sessionId!, {
        answers,
        timeSpent
      });

      setQuiz(prev => ({
        ...prev,
        results: response.data.results as QuizResult,
        recommendations: response.data.recommendations || null,
        answerDetails: response.data.answers,
        isSubmitting: false
      }));

      // Scroll to top to see results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit quiz');
      setQuiz(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const parseOptions = (options: string[] | string): string[] => {
    if (Array.isArray(options)) return options;
    try {
      return JSON.parse(options);
    } catch {
      return [options];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 text-xl font-semibold mb-2">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Results view
  if (quiz.results) {
    const scoreColor = 
      quiz.results.score >= 80 ? 'text-green-600' :
      quiz.results.score >= 60 ? 'text-yellow-600' : 'text-red-600';

    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Results Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-center mb-6">Quiz Results</h1>
          
          <div className="flex justify-center items-center mb-8">
            <div className="text-center">
              <div className={`text-6xl font-bold ${scoreColor} mb-2`}>
                {quiz.results.score}%
              </div>
              <div className="text-gray-600">Your Score</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{quiz.results.totalQuestions}</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{quiz.results.correctAnswers}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{quiz.results.incorrectAnswers}</div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {quiz.results.timeSpent ? `${Math.floor(quiz.results.timeSpent / 60)}:${(quiz.results.timeSpent % 60).toString().padStart(2, '0')}` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Time Taken</div>
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => navigate('/student/dashboard')}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Practice Again
            </button>
            <button
              onClick={() => navigate('/student/mcq-practice')}
              className="bg-[#A8C5B5] text-white px-6 py-2 rounded-lg hover:bg-[#96B5A5]"
            >
              Browse More MCQs
            </button>
          </div>
        </div>

        {/* Topic Performance Breakdown */}
        {quiz.answerDetails.length > 0 && (() => {
          // Calculate topic breakdown
          const topicBreakdown: Record<string, { correct: number; total: number; questions: number[] }> = {};
          quiz.answerDetails.forEach(answer => {
            const topic = answer.topic || 'General';
            if (!topicBreakdown[topic]) {
              topicBreakdown[topic] = { correct: 0, total: 0, questions: [] };
            }
            topicBreakdown[topic].total++;
            topicBreakdown[topic].questions.push(answer.questionNumber);
            if (answer.isCorrect) {
              topicBreakdown[topic].correct++;
            }
          });

          const topicStats = Object.entries(topicBreakdown)
            .map(([topic, data]) => ({
              topic,
              correct: data.correct,
              total: data.total,
              accuracy: Math.round((data.correct / data.total) * 100),
              questions: data.questions
            }))
            .sort((a, b) => a.accuracy - b.accuracy); // Sort by accuracy (weakest first)

          return topicStats.length > 1 ? (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg p-6 mb-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-2">📊</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Topic Performance Analysis</h2>
                  <p className="text-sm text-gray-600">See where you excel and where to focus your study time</p>
                </div>
              </div>

              <div className="space-y-3">
                {topicStats.map((stat, idx) => {
                  const isWeak = stat.accuracy < 60;
                  const isModerate = stat.accuracy >= 60 && stat.accuracy < 80;
                  const isStrong = stat.accuracy >= 80;

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 ${
                        isWeak ? 'bg-red-50 border-red-500' :
                        isModerate ? 'bg-yellow-50 border-yellow-500' :
                        'bg-green-50 border-green-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{stat.topic}</span>
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                              isWeak ? 'bg-red-100 text-red-800' :
                              isModerate ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {isWeak ? '⚠️ Needs Focus' : isModerate ? '📚 Review' : '✅ Strong'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {stat.correct} of {stat.total} correct • Questions: {stat.questions.join(', ')}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className={`text-3xl font-bold ${
                            isWeak ? 'text-red-600' :
                            isModerate ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {stat.accuracy}%
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${
                            isWeak ? 'bg-red-500' :
                            isModerate ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${stat.accuracy}%` }}
                        ></div>
                      </div>

                      {/* Recommendation for weak topics */}
                      {isWeak && (
                        <div className="mt-2 text-sm text-red-800 bg-red-100 p-2 rounded">
                          💡 <strong>Focus Area:</strong> Review this topic thoroughly and practice more questions
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Summary insight */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>📌 Quick Insight:</strong>{' '}
                  {topicStats.filter(t => t.accuracy < 60).length > 0
                    ? `Focus on: ${topicStats.filter(t => t.accuracy < 60).map(t => t.topic).join(', ')}`
                    : topicStats.filter(t => t.accuracy < 80).length > 0
                    ? `Almost there! Review: ${topicStats.filter(t => t.accuracy >= 60 && t.accuracy < 80).map(t => t.topic).join(', ')}`
                    : 'Excellent! You\'re performing well across all topics. Try harder difficulty levels!'}
                </p>
              </div>
            </div>
          ) : null;
        })()}

        {/* Recommendations Section */}
        {quiz.recommendations && quiz.recommendations.recommendations.length > 0 && (
          <div className="bg-gradient-to-br from-[#A8C5B5]/10 to-blue-50 border-2 border-[#A8C5B5]/30 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">💡</span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">Personalized Study Plan</h2>
                <p className="text-sm text-gray-700">
                  {quiz.recommendations.message || 'Based on your performance, here are specific sections to focus on'}
                </p>
              </div>
              {quiz.recommendations.status && (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  quiz.recommendations.status === 'STRONG' ? 'bg-green-100 text-green-800' :
                  quiz.recommendations.status === 'NEEDS_ATTENTION' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {quiz.recommendations.status.replace('_', ' ')}
                </span>
              )}
            </div>

            {/* Focus Sections - Priority Areas */}
            {quiz.recommendations.focusSections && quiz.recommendations.focusSections.length > 0 && (
              <div className="mb-6 p-5 bg-white rounded-lg border-2 border-[#A8C5B5]/40 shadow-sm">
                <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center">
                  🎯 Priority Focus Areas
                  <span className="ml-2 text-xs font-normal text-gray-600">
                    ({quiz.recommendations.focusSections.length} {quiz.recommendations.focusSections.length === 1 ? 'topic' : 'topics'})
                  </span>
                </h3>
                <div className="grid gap-3">
                  {quiz.recommendations.focusSections.map((section, idx) => {
                    const priorityColors = {
                      CRITICAL: 'bg-red-50 border-red-400 text-red-900',
                      HIGH: 'bg-orange-50 border-orange-400 text-orange-900',
                      MEDIUM: 'bg-yellow-50 border-yellow-400 text-yellow-900'
                    };

                    const priorityIcons = {
                      CRITICAL: '🚨',
                      HIGH: '⚠️',
                      MEDIUM: '📚'
                    };

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-2 ${priorityColors[section.priority] || priorityColors.MEDIUM} transition-all hover:shadow-md`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{priorityIcons[section.priority]}</span>
                              <span className="font-bold text-lg">{idx + 1}. {section.topic}</span>
                              <span className="text-xs px-2 py-0.5 bg-white rounded font-semibold">
                                {section.priority} PRIORITY
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <div>Current Performance: <strong>{section.accuracy}%</strong></div>
                              <div className="text-gray-600">•</div>
                              <div>{section.estimatedTime}</div>
                              {section.attempts && (
                                <>
                                  <div className="text-gray-600">•</div>
                                  <div>{section.attempts} questions attempted</div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-4xl font-bold">{section.accuracy}%</div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3 w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              section.accuracy >= 80 ? 'bg-green-500' :
                              section.accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${section.accuracy}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 bg-[#A8C5B5]/10 border border-[#A8C5B5]/30 rounded-lg text-sm text-gray-800">
                  💡 <strong>Study Tip:</strong> Focus on these topics in order. Master each one before moving to the next for best results!
                </div>
              </div>
            )}

            {/* Detailed Recommendations */}
            <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center">
              📋 Recommended Actions
              <span className="ml-2 text-xs font-normal text-gray-600">
                ({quiz.recommendations.recommendations.length} recommendations)
              </span>
            </h3>
            <div className="space-y-3">
              {quiz.recommendations.recommendations.map((rec, index) => {
                const priorityStyles = {
                  SUCCESS: 'bg-green-50 border-green-400 text-green-900',
                  CRITICAL: 'bg-red-50 border-red-400 text-red-900',
                  HIGH: 'bg-orange-50 border-orange-400 text-orange-900',
                  MEDIUM: 'bg-yellow-50 border-yellow-400 text-yellow-900',
                  LOW: 'bg-blue-50 border-blue-400 text-blue-900',
                  INFO: 'bg-indigo-50 border-indigo-400 text-indigo-900'
                };

                const priorityIcons = {
                  SUCCESS: '🎉',
                  CRITICAL: '🚨',
                  HIGH: '⚠️',
                  MEDIUM: '📚',
                  LOW: '💡',
                  INFO: '📋'
                };

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${priorityStyles[rec.priority] || priorityStyles.MEDIUM} hover:shadow-md transition-all`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start flex-1">
                        <span className="text-2xl mr-3 mt-0.5">{priorityIcons[rec.priority] || '📌'}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{rec.message}</h3>
                          
                          {rec.topic && (
                            <p className="text-sm mb-1.5">
                              <span className="font-medium">📍 Topic:</span> {rec.topic}
                              {rec.difficulty && ` (${rec.difficulty} level)`}
                            </p>
                          )}
                          
                          <p className="text-sm mb-1.5 bg-white/50 p-2 rounded">
                            <span className="font-medium">✅ Action:</span> {rec.action}
                          </p>
                          
                          <p className="text-sm">
                            <span className="font-medium">⏱️ Time:</span> {rec.estimatedTime}
                          </p>

                          {/* Quick Wins - Fast tips to get started */}
                          {rec.quickWins && rec.quickWins.length > 0 && (
                            <div className="mt-3 bg-green-50 rounded-lg p-3 border-l-4 border-green-400">
                              <p className="text-xs font-bold mb-2 text-green-900 flex items-center">
                                ⚡ Quick Wins - Start Here!
                              </p>
                              <ul className="text-xs space-y-1.5 list-none">
                                {rec.quickWins.map((tip, idx) => (
                                  <li key={idx} className="flex items-start text-green-800">
                                    <span className="mr-2">✓</span>
                                    <span className="flex-1 font-medium">{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Specific Focus Areas */}
                          {rec.specificFocus && rec.specificFocus.length > 0 && (
                            <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <p className="text-xs font-semibold mb-2 text-blue-900 flex items-center">
                                🎯 Specific Areas to Focus On:
                              </p>
                              <ul className="text-xs space-y-1.5 list-none">
                                {rec.specificFocus.map((area, idx) => (
                                  <li key={idx} className="flex items-start text-blue-800">
                                    <span className="mr-2 text-blue-500">•</span>
                                    <span className="flex-1">{area}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Step-by-Step Study Plan */}
                          {rec.studySteps && rec.studySteps.length > 0 && (
                            <div className="mt-3 bg-purple-50 rounded-lg p-4 border-2 border-purple-300">
                              <p className="text-sm font-bold mb-3 text-purple-900 flex items-center">
                                📖 Step-by-Step Study Plan
                              </p>
                              <div className="space-y-3">
                                {rec.studySteps.map((step, idx) => (
                                  <div key={idx} className="bg-white rounded-lg p-3 border border-purple-200">
                                    <div className="flex items-start gap-2 mb-2">
                                      <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {step.step}
                                      </span>
                                      <div className="flex-1">
                                        <h4 className="font-bold text-sm text-purple-900">{step.title}</h4>
                                        <p className="text-xs text-gray-600 mt-0.5">{step.description}</p>
                                        <p className="text-xs text-purple-700 font-medium mt-1">⏱️ {step.duration}</p>
                                      </div>
                                    </div>
                                    <div className="ml-8 mt-2">
                                      <p className="text-xs font-semibold text-gray-700 mb-1">Action Items:</p>
                                      <ul className="text-xs space-y-1">
                                        {step.actionItems.map((item, itemIdx) => (
                                          <li key={itemIdx} className="flex items-start text-gray-700">
                                            <span className="mr-2 text-[#A8C5B5]">▸</span>
                                            <span className="flex-1">{item}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Resources list */}
                          {rec.resources && rec.resources.length > 0 && (
                            <div className="mt-3 bg-white/70 rounded-lg p-3 border border-gray-200">
                              <p className="text-xs font-semibold mb-2 text-gray-800">📚 Study Resources:</p>
                              <ul className="text-xs space-y-1.5 list-none">
                                {rec.resources.map((resource, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="mr-2 text-[#A8C5B5]">▸</span>
                                    <span className="flex-1">{resource}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {rec.topics && rec.topics.length > 0 && (
                            <div className="mt-3 bg-white/70 rounded-lg p-3 border border-gray-200">
                              <p className="text-xs font-semibold mb-2 text-gray-800">📖 Topics to Review:</p>
                              <div className="space-y-1.5">
                                {rec.topics.map((topic, idx) => (
                                  <div key={idx} className="text-xs flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <span>{topic.topic} <span className="text-gray-500">({topic.module})</span></span>
                                    <span className={`font-bold ${
                                      topic.accuracy >= 80 ? 'text-green-600' :
                                      topic.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>{topic.accuracy}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {rec.priority !== 'SUCCESS' && rec.priority !== 'INFO' && (
                        <span className={`ml-3 px-2.5 py-1 text-xs font-bold rounded shadow-sm ${
                          rec.priority === 'CRITICAL' ? 'bg-red-200 text-red-900' :
                          rec.priority === 'HIGH' ? 'bg-orange-200 text-orange-900' :
                          rec.priority === 'MEDIUM' ? 'bg-yellow-200 text-yellow-900' :
                          'bg-blue-200 text-blue-900'
                        }`}>
                          {rec.priority}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {quiz.recommendations.totalWeakAreas && quiz.recommendations.totalWeakAreas > 0 && (
              <div className="mt-5 text-center p-4 bg-white/50 rounded-lg border border-[#A8C5B5]/30">
                <p className="text-sm text-gray-700">
                  💪 <strong>Keep practicing!</strong> You have {quiz.recommendations.totalWeakAreas} area{quiz.recommendations.totalWeakAreas > 1 ? 's' : ''} to improve.
                  Regular practice will help you master {quiz.recommendations.totalWeakAreas > 1 ? 'them' : 'it'}!
                </p>
              </div>
            )}
          </div>
        )}

      {/* Positive Feedback for Strong Performance */}
      {quiz.recommendations && quiz.recommendations.status === 'STRONG' && quiz.recommendations.recommendations.length === 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-lg p-8 mb-6 text-center">
          <span className="text-6xl mb-4 block animate-bounce">🎉</span>
          <h2 className="text-3xl font-bold text-green-900 mb-3">Outstanding Performance!</h2>
          <p className="text-lg text-green-800 mb-2">
            {quiz.recommendations.message || 'You\'re doing great! Keep up the excellent work.'}
          </p>
          <div className="mt-4 inline-block bg-green-100 px-6 py-3 rounded-lg border border-green-300">
            <p className="text-sm text-green-900 font-semibold">
              ✨ You're mastering this material! Consider challenging yourself with harder difficulty levels.
            </p>
          </div>
        </div>
      )}

      {/* Answer Review */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-4">Answer Review</h2>
        
        {quiz.answerDetails.map((answer) => {
          const options = parseOptions(answer.options);
          return (
            <div
              key={answer.questionNumber}
              className={`bg-white rounded-lg shadow p-6 border-l-4 ${
                answer.isCorrect ? 'border-green-500' : 'border-red-500'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg flex-1">
                  Q{answer.questionNumber}. {answer.question}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {options.map((option, idx) => {
                  const isSelected = option === answer.selectedAnswer;
                  const isCorrect = option === answer.correctAnswer;
                  
                  let bgColor = 'bg-gray-50';
                  if (isCorrect) bgColor = 'bg-green-50 border-2 border-green-500';
                  else if (isSelected && !isCorrect) bgColor = 'bg-red-50 border-2 border-red-500';

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded ${bgColor}`}
                    >
                      <span className="font-medium">{String.fromCharCode(65 + idx)}. </span>
                      {option}
                      {isCorrect && <span className="ml-2 text-green-600 font-semibold">✓ Correct Answer</span>}
                      {isSelected && !isCorrect && <span className="ml-2 text-red-600 font-semibold">✗ Your Answer</span>}
                    </div>
                  );
                })}
              </div>

              {answer.explanation && (
                <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
                  <p className="font-semibold text-blue-900 mb-1">💡 Explanation:</p>
                  <p className="text-blue-800">{answer.explanation}</p>
                </div>
              )}

              <div className="flex gap-3 mt-3 text-sm text-gray-600">
                {answer.topic && <span className="bg-gray-100 px-2 py-1 rounded">📚 {answer.topic}</span>}
                <span className={`px-2 py-1 rounded ${
                  answer.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                  answer.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {answer.difficulty}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

  // Quiz interface
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <h1 className="text-3xl font-bold mb-2">MCQ Practice</h1>
        <p className="text-gray-600 mb-4">Answer all questions and submit to see your results</p>
        
        <div className="flex justify-between items-center text-sm text-gray-600 mb-6">
          <span>Questions: {quiz.questions.length}</span>
          <span>Answered: {Object.keys(quiz.answers).length} / {quiz.questions.length}</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(Object.keys(quiz.answers).length / quiz.questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {quiz.questions.map((question) => {
          const options = parseOptions(question.options);
          return (
            <div key={question.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg flex-1">
                  Q{question.questionNumber}. {question.question}
                </h3>
                {question.difficulty && (
                  <span className={`px-3 py-1 rounded-full text-sm ml-3 ${
                    question.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                    question.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {question.difficulty}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {options.map((option, idx) => (
                  <label
                    key={idx}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      quiz.answers[question.id] === option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={quiz.answers[question.id] === option}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="mr-3 h-5 w-5"
                    />
                    <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                    <span>{option}</span>
                  </label>
                ))}
              </div>

              {question.topic && (
                <div className="mt-3">
                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    📚 Topic: {question.topic}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-0 bg-white border-t shadow-lg p-4 mt-6 rounded-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Answered: {Object.keys(quiz.answers).length} / {quiz.questions.length}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to abandon this quiz?')) {
                  navigate('/student/dashboard');
                }
              }}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={quiz.isSubmitting}
              className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {quiz.isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
