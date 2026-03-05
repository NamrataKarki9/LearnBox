import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mcqAPI, quizAPI, resourceAPI, MCQ, QuizAnswerDetail, QuizResult, Recommendation, FocusSection, Resource } from '../../services/api';

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
  const [relatedResources, setRelatedResources] = useState<Record<number, Resource[]>>({});

  useEffect(() => {
    startQuiz();
  }, []);

  // Fetch study resources whenever quiz answers are set (after submission)
  useEffect(() => {
    if (quiz.answerDetails.length === 0) return;
    const incorrectIds = quiz.answerDetails.filter(a => !a.isCorrect).map(a => a.mcqId);
    const weakModuleIds = [...new Set(
      quiz.questions
        .filter(q => incorrectIds.includes(q.id) && q.moduleId)
        .map(q => q.moduleId as number)
    )];
    if (weakModuleIds.length === 0) return;
    const fetchResources = async () => {
      const results: Record<number, Resource[]> = {};
      await Promise.all(weakModuleIds.map(async (moduleId) => {
        try {
          const res = await resourceAPI.getAll({ moduleId });
          if (res.data.data.length > 0) results[moduleId] = res.data.data;
        } catch { /* ignore */ }
      }));
      setRelatedResources(results);
    };
    fetchResources();
  }, [quiz.answerDetails]);

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
    const score = quiz.results.score;
    const scoreColor =
      score >= 80 ? 'text-green-600' :
      score >= 60 ? 'text-yellow-600' : 'text-red-600';
    const scoreBg =
      score >= 80 ? 'bg-green-50 border-green-100' :
      score >= 60 ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100';
    const scoreMessage =
      score >= 90 ? "Outstanding! You've mastered this material." :
      score >= 80 ? 'Great work! Strong understanding overall.' :
      score >= 70 ? 'Good effort! Review the topics below to improve.' :
      score >= 60 ? 'Keep going! More practice will help.' :
      "Don't give up — review the materials below and try again.";

    // Build topic → module map to identify weak areas
    type TopicInfo = { topic: string; moduleId?: number; moduleName?: string; moduleCode?: string; correct: number; total: number };
    const topicModuleMap: Record<string, TopicInfo> = {};
    quiz.answerDetails.forEach(a => {
      const topic = a.topic || 'General';
      const question = quiz.questions.find(q => q.id === a.mcqId);
      if (!topicModuleMap[topic]) {
        topicModuleMap[topic] = {
          topic,
          moduleId: question?.moduleId,
          moduleName: question?.module?.name,
          moduleCode: question?.module?.code,
          correct: 0, total: 0
        };
      }
      topicModuleMap[topic].total++;
      if (a.isCorrect) topicModuleMap[topic].correct++;
    });
    const weakTopics = Object.values(topicModuleMap).filter(t => t.correct / t.total < 0.6);

    // Group weak topics by module
    type ModuleGroup = { moduleName?: string; moduleCode?: string; moduleId?: number; topics: string[] };
    const moduleGroups: Record<string, ModuleGroup> = {};
    weakTopics.forEach(t => {
      const key = t.moduleId?.toString() ?? 'general';
      if (!moduleGroups[key]) {
        moduleGroups[key] = { moduleName: t.moduleName, moduleCode: t.moduleCode, moduleId: t.moduleId, topics: [] };
      }
      moduleGroups[key].topics.push(t.topic);
    });

    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">

        {/* ── Score Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Score band */}
          <div className={`border-b ${scoreBg} px-6 pt-7 pb-5 text-center`}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Quiz Complete</p>
            <div className={`text-7xl font-bold ${scoreColor} leading-none mb-2`}>
              {score}%
            </div>
            <p className="text-sm text-gray-600">{scoreMessage}</p>
          </div>
          {/* Stats + actions */}
          <div className="px-6 py-5">
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="text-center py-3 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-800">{quiz.results.totalQuestions}</div>
                <div className="text-xs text-gray-500 mt-0.5">Questions</div>
              </div>
              <div className="text-center py-3 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-600">{quiz.results.correctAnswers}</div>
                <div className="text-xs text-gray-500 mt-0.5">Correct</div>
              </div>
              <div className="text-center py-3 bg-red-50 rounded-xl">
                <div className="text-2xl font-bold text-red-500">{quiz.results.incorrectAnswers}</div>
                <div className="text-xs text-gray-500 mt-0.5">Incorrect</div>
              </div>
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={() => navigate('/student/dashboard')}
                className="px-5 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/student/mcq-practice')}
                className="px-5 py-2 text-sm rounded-lg border border-primary text-primary hover:bg-primary/5 transition-colors"
              >
                More MCQs
              </button>
            </div>
          </div>
        </div>

        {/* ── What to Study ── */}
        {quiz.answerDetails.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-0.5">📖 What to Study</h2>
            <p className="text-xs text-gray-500 mb-4">
              Review these study materials for the topics you missed
            </p>

            {weakTopics.length === 0 ? (
              <div className="flex items-center gap-2 py-2">
                <span className="text-green-500">✅</span>
                <span className="text-sm text-green-700 font-medium">
                  You performed well on all topics — keep it up!
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(moduleGroups).map(([key, group]) => {
                  const resources = group.moduleId ? (relatedResources[group.moduleId] || []) : [];
                  return (
                    <div key={key} className="border border-gray-200 rounded-xl p-4">
                      {/* Topic badges */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {group.topics.map((t, i) => (
                          <span
                            key={i}
                            className="text-xs bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full font-medium"
                          >
                            ⚠️ {t}
                          </span>
                        ))}
                      </div>
                      {/* Module label */}
                      {group.moduleName && (
                        <p className="text-xs text-gray-500 mb-3">
                          Module:{' '}
                          <span className="font-medium text-gray-700">{group.moduleName}</span>
                          {group.moduleCode && (
                            <span className="text-gray-400"> · {group.moduleCode}</span>
                          )}
                        </p>
                      )}
                      {/* Resource links */}
                      {resources.length > 0 ? (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-gray-500 mb-1">Study materials:</p>
                          {resources.map(r => (
                            <a
                              key={r.id}
                              href={`http://localhost:5000/api/resources/${r.id}/download`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <span className="text-blue-400 text-sm shrink-0">📄</span>
                              <span className="text-sm text-blue-700 font-medium flex-1 truncate">{r.title}</span>
                              <span className="text-xs text-blue-400 shrink-0">Open →</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          {group.moduleId
                            ? 'No documents uploaded for this module yet.'
                            : 'Ask your instructor for study materials on this topic.'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Answer Review ── */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Answer Review</h2>
          <div className="space-y-3">
            {quiz.answerDetails.map((answer) => {
              const options = parseOptions(answer.options);
              return (
                <div
                  key={answer.questionNumber}
                  className={`bg-white rounded-xl shadow-sm border-l-4 p-5 ${
                    answer.isCorrect ? 'border-green-500' : 'border-red-400'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <h3 className="text-sm font-medium text-gray-800 flex-1 leading-relaxed">
                      <span className="text-gray-400 mr-1">Q{answer.questionNumber}.</span>
                      {answer.question}
                    </h3>
                    <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      answer.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {options.map((option, idx) => {
                      const isSelected = option === answer.selectedAnswer;
                      const isCorrect = option === answer.correctAnswer;
                      let style = 'bg-gray-50 border border-gray-100 text-gray-700';
                      if (isCorrect) style = 'bg-green-50 border border-green-300 text-green-800';
                      else if (isSelected && !isCorrect) style = 'bg-red-50 border border-red-300 text-red-800';
                      return (
                        <div key={idx} className={`px-3 py-2 rounded-lg text-sm ${style}`}>
                          <span className="font-medium">{String.fromCharCode(65 + idx)}. </span>
                          {option}
                          {isCorrect && (
                            <span className="ml-2 text-green-600 text-xs font-semibold">✓ Correct</span>
                          )}
                          {isSelected && !isCorrect && (
                            <span className="ml-2 text-red-600 text-xs font-semibold">✗ Your answer</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {answer.explanation && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 px-3 py-2.5 rounded-r-lg mb-2.5">
                      <p className="text-xs font-semibold text-blue-800 mb-0.5">Explanation</p>
                      <p className="text-xs text-blue-700 leading-relaxed">{answer.explanation}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {answer.topic && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {answer.topic}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      answer.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                      answer.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {answer.difficulty}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
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
            className="bg-primary h-2 rounded-full transition-all"
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
                        ? 'border-primary bg-primary/10'
                        : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
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
              className="bg-primary text-white px-8 py-2 rounded-lg hover:bg-primary/90 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {quiz.isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
