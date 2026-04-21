import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mcqAPI, quizAPI, resourceAPI, MCQ, QuizAnswerDetail, QuizResult, Recommendation, FocusSection, Resource } from '../../services/api';
import { API_BASE } from '../../config';
import { ConfirmDialog } from '../components/ConfirmDialog';

//  Global in-memory cache for MCQs (survives navigation)
let GLOBAL_MCQ_CACHE: any[] | null = null;
const setGlobalMCQCache = (data: any[] | null) => {
  GLOBAL_MCQ_CACHE = data;
  console.log(' Global MCQ cache updated:', GLOBAL_MCQ_CACHE?.length, 'questions');
};
const getGlobalMCQCache = () => GLOBAL_MCQ_CACHE;

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

// 🔧 Multi-tier storage utility - tries multiple methods
const MultiTierStorage = {
  setMCQs: (data: any[]) => {
    try {
      // Tier 1: Global memory cache (always works)
      setGlobalMCQCache(data);
      
      // Tier 2: Try localStorage
      try {
        localStorage.setItem('generated_mcqs', JSON.stringify(data));
        console.log('✅ Data saved to localStorage');
      } catch (e) {
        console.warn('⚠️ localStorage failed:', (e as any).message);
      }
      
      // Tier 3: Try sessionStorage
      try {
        sessionStorage.setItem('generated_mcqs', JSON.stringify(data));
        console.log('✅ Data saved to sessionStorage');
      } catch (e) {
        console.warn('⚠️ sessionStorage failed:', (e as any).message);
      }
      
      // Tier 4: Try IndexedDB
      try {
        const request = indexedDB.open('learnbox_db', 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('mcqs')) {
            db.createObjectStore('mcqs', { keyPath: 'id' });
          }
        };
        request.onsuccess = () => {
          const db = request.result;
          const store = db.transaction('mcqs', 'readwrite').objectStore('mcqs');
          store.put({ id: 'generated_mcqs', data });
          console.log('✅ Data saved to IndexedDB');
        };
      } catch (e) {
        console.warn('⚠️ IndexedDB failed:', (e as any).message);
      }
    } catch (err) {
      console.error('❌ All storage methods failed:', err);
    }
  },

  getMCQs: async () => {
    // Tier 1: Check global memory cache first (fastest)
    const cached = getGlobalMCQCache();
    if (cached) {
      console.log('✅ MCQs loaded from memory cache');
      return cached;
    }

    // Tier 2: Try localStorage
    try {
      const data = localStorage.getItem('generated_mcqs');
      if (data) {
        const parsed = JSON.parse(data);
        setGlobalMCQCache(parsed);
        console.log('✅ MCQs loaded from localStorage');
        return parsed;
      }
    } catch (e) {
      console.warn('⚠️ localStorage read failed:', (e as any).message);
    }

    // Tier 3: Try sessionStorage
    try {
      const data = sessionStorage.getItem('generated_mcqs');
      if (data) {
        const parsed = JSON.parse(data);
        setGlobalMCQCache(parsed);
        localStorage.setItem('generated_mcqs', data); // Back up to localStorage
        console.log('✅ MCQs loaded from sessionStorage');
        return parsed;
      }
    } catch (e) {
      console.warn('⚠️ sessionStorage read failed:', (e as any).message);
    }

    // Tier 4: Try IndexedDB
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open('learnbox_db', 1);
        request.onsuccess = () => {
          const db = request.result;
          const store = db.transaction('mcqs', 'readonly').objectStore('mcqs');
          const getRequest = store.get('generated_mcqs');
          
          getRequest.onsuccess = () => {
            const result = getRequest.result;
            if (result?.data) {
              setGlobalMCQCache(result.data);
              console.log('✅ MCQs loaded from IndexedDB');
              resolve(result.data);
            } else {
              console.warn('⚠️ No data in IndexedDB');
              resolve(null);
            }
          };
        };
      } catch (e) {
        console.warn('⚠️ IndexedDB read failed:', (e as any).message);
        resolve(null);
      }
    });
  },

  clearMCQs: () => {
    setGlobalMCQCache(null);
    localStorage.removeItem('generated_mcqs');
    sessionStorage.removeItem('generated_mcqs');
  }
};

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

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    isDangerous?: boolean;
    autoClose?: boolean;
    closeDelay?: number;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    onConfirm: () => {},
    isDangerous: false,
    autoClose: false,
    closeDelay: 3000
  });

  useEffect(() => {
    startQuiz();
  }, []);

  // Auto-retry mechanism for recovered MCQs
  useEffect(() => {
    if (error && error.includes('MCQs session expired')) {
      const retryTimer = setInterval(() => {
        const mcqsStr = localStorage.getItem('generated_mcqs') || sessionStorage.getItem('generated_mcqs');
        if (mcqsStr) {
          console.log('✅ MCQs recovered! Reloading...');
          setError(null);
          clearInterval(retryTimer);
          window.location.reload();
        }
      }, 1000); // Retry every 1 second

      return () => clearInterval(retryTimer);
    }
  }, [error]);

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

  const openConfirmDialog = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDangerous = false,
    autoClose = false,
    closeDelay = 3000
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmLabel,
      cancelLabel,
      onConfirm,
      isDangerous,
      autoClose,
      closeDelay
    });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
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
        // Handle generated MCQs from multi-tier storage (localStorage → sessionStorage → Memory → IndexedDB)
        let generatedMCQs = null;
        const attemptCount = parseInt(sessionStorage.getItem('mcq_load_attempts') || '0');

        // Try to retrieve MCQs from multi-tier storage
        generatedMCQs = await MultiTierStorage.getMCQs();

        if (!generatedMCQs || generatedMCQs.length === 0) {
          if (attemptCount < 5) {
            // Haven't tried enough times yet
            sessionStorage.setItem('mcq_load_attempts', String(attemptCount + 1));
            console.log(`Attempt ${attemptCount + 1}/5: MCQs not found, retrying in 1000ms...`);
            
            setTimeout(() => {
              startQuiz();
            }, 1000);
            
            setLoading(true);
            setError(null);
            return;
          } else {
            // All retry attempts exhausted
            sessionStorage.removeItem('mcq_load_attempts');
            setError('MCQs could not be recovered. Please generate new MCQs to continue.');
            setLoading(false);
            return;
          }
        }

        // Success! Clear retry counter
        sessionStorage.removeItem('mcq_load_attempts');

        try {
          // Validate MCQs data
          if (!Array.isArray(generatedMCQs) || generatedMCQs.length === 0) {
            throw new Error('Invalid MCQs data format');
          }
          
          // Check if MCQs have IDs (saved to database) or need to be saved
          if (generatedMCQs[0].id) {
            // MCQs are already in database, start quiz with them
            try {
              response = await quizAPI.start({
                customMCQIds: generatedMCQs.map((q: any) => q.id)
              });
              // Only clear after successful backend start
              MultiTierStorage.clearMCQs();
            } catch (err) {
              // If backend quiz creation fails, keep data for retry and show error
              console.error('Failed to start quiz session:', err);
              setError('Failed to start quiz session. Retrying...');
              setLoading(false);
              setTimeout(() => startQuiz(), 2000);
              return;
            }
          } else {
            // MCQs were not saved to database, display them directly without backend session
            setQuiz(prev => ({
              ...prev,
              sessionId: null,
              questions: generatedMCQs.map((mcq: any, index: number) => ({
                ...mcq,
                questionNumber: index + 1
              })),
              startTime: Date.now()
            }));
            setLoading(false);
            return;
          }
        } catch (parseErr) {
          console.error('Failed to parse MCQs:', parseErr);
          MultiTierStorage.clearMCQs();
          setError('Failed to load MCQs. Please generate new MCQs.');
          setLoading(false);
          return;
        }
      } else if (adaptive === 'true') {
        setError('Adaptive practice is under progress.');
        setLoading(false);
        return;
      } else if (setId) {
        response = await quizAPI.start({ setId: parseInt(setId) });
      } else if (moduleId) {
        response = await quizAPI.start({ moduleId: parseInt(moduleId) });
      } else {
        setError('No quiz parameters provided');
        setLoading(false);
        return;
      }

      // Ensure response is set before using it
      if (!response) {
        setError('Failed to initialize quiz');
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
      console.error('Quiz start error:', err);
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

  const getEstimatedRevisionTime = (accuracy: number) => {
    if (accuracy < 40) return '25-30 minutes';
    if (accuracy < 60) return '20-25 minutes';
    return '15-20 minutes';
  };

  const buildClientGapAnalysis = (
    topicAnalysis: Array<{ topic: string; accuracy: number; total: number; correct: number; difficulty: string; attempts: number }>,
    difficultyPerformance: Record<'EASY' | 'MEDIUM' | 'HARD', { total: number; correct: number }>,
    score: number
  ) => {
    const weakTopics = topicAnalysis.filter(t => t.accuracy < 60);
    const moderateTopics = topicAnalysis.filter(t => t.accuracy >= 60 && t.accuracy < 80);
    const strongTopics = topicAnalysis.filter(t => t.accuracy >= 80);
    const focusSections = (weakTopics.length > 0 ? weakTopics : moderateTopics).slice(0, 3).map(t => ({
      topic: t.topic,
      accuracy: t.accuracy,
      attempts: t.attempts,
      priority: (t.accuracy < 40 ? 'CRITICAL' : t.accuracy < 60 ? 'HIGH' : 'MEDIUM') as const,
      estimatedTime: getEstimatedRevisionTime(t.accuracy)
    }));

    const strongerTopics = strongTopics.slice(0, 3).map(t => t.topic);
    const fallbackStrengths = moderateTopics.slice(0, 2).map(t => t.topic);
    const strengths = strongerTopics.length > 0 ? strongerTopics : fallbackStrengths;

    const easyAcc = difficultyPerformance.EASY.total > 0
      ? (difficultyPerformance.EASY.correct / difficultyPerformance.EASY.total) * 100
      : null;
    const mediumAcc = difficultyPerformance.MEDIUM.total > 0
      ? (difficultyPerformance.MEDIUM.correct / difficultyPerformance.MEDIUM.total) * 100
      : null;
    const hardAcc = difficultyPerformance.HARD.total > 0
      ? (difficultyPerformance.HARD.correct / difficultyPerformance.HARD.total) * 100
      : null;

    const recommendations: Recommendation[] = [
      {
        priority: score >= 80 ? 'SUCCESS' : 'MEDIUM',
        type: 'STRENGTHS',
        message: strengths.length > 0
          ? `Your strengths in this attempt were ${strengths.join(', ')}.`
          : 'You are starting to build a working understanding of this set.',
        action: score >= 80
          ? 'Maintain these areas with a short mixed review while you focus on weaker topics.'
          : 'Use your stronger topics to keep confidence high while you repair weaker areas.',
        estimatedTime: '10-15 minutes',
        resources: [
          'Reattempt one or two correct questions to confirm why your reasoning worked.',
          'Do not spend most of your revision time here; maintain, then move to weaker topics.'
        ]
      }
    ];

    if (focusSections.length > 0) {
      recommendations.push({
        priority: focusSections.some(topic => topic.accuracy < 40) ? 'CRITICAL' : 'HIGH',
        type: 'WEAK_AREAS',
        message: 'These topics are causing the main score loss right now.',
        action: 'Fix these first before moving to new content.',
        estimatedTime: getEstimatedRevisionTime(focusSections[0].accuracy),
        resources: focusSections.map((topic) =>
          topic.accuracy < 40
            ? `${topic.topic}: ${topic.accuracy.toFixed(1)}% accuracy. Relearn the core concept, then solve 4-5 basic questions on it.`
            : `${topic.topic}: ${topic.accuracy.toFixed(1)}% accuracy. Review the mistakes and practice similar questions until the method feels clear.`
        )
      });

      recommendations.push({
        priority: 'HIGH',
        type: 'STUDY_PRIORITY',
        message: 'Use this revision order to recover marks faster.',
        action: 'Move to the next topic only after you can answer a similar question correctly without guessing.',
        estimatedTime: '30-40 minutes',
        resources: [
          ...focusSections.map((topic, index) => `${index + 1}. ${topic.topic} for ${getEstimatedRevisionTime(topic.accuracy)}.`),
          strengths.length > 0
            ? `After that, briefly maintain ${strengths.slice(0, 2).join(' and ')} so you do not lose accuracy there.`
            : 'End with a short mixed review set to check whether the improvement holds.'
        ]
      });
    }

    const timeManagementResources = [
      'Use a two-pass approach: secure the quick marks first, then return to the harder questions.',
      'If a question is taking too long, eliminate weak options and move on instead of getting stuck early.'
    ];

    if (easyAcc !== null && easyAcc < 70) {
      timeManagementResources.push('Because easy-question accuracy is low, slow down slightly and read the stem carefully before choosing an answer.');
    } else if (mediumAcc !== null && mediumAcc < 60) {
      timeManagementResources.push('Spend more of your revision time on application questions where selecting the right method is the issue.');
    } else if (hardAcc !== null && hardAcc < 50) {
      timeManagementResources.push('Treat hard questions as second-pass questions. Secure easy and medium marks first.');
    } else if (score >= 80) {
      timeManagementResources.push('Your base accuracy is stable, so you can now allocate a little more time to the harder questions.');
    }

    recommendations.push({
      priority: 'MEDIUM',
      type: 'TIME_MANAGEMENT',
      message: 'Your next score can improve with better timing as well as topic review.',
      action: 'Keep revision sessions short, focused, and timed.',
      estimatedTime: '15-20 minutes',
      resources: timeManagementResources
    });

    const status = score >= 80 ? 'STRONG' : score >= 60 ? 'IMPROVING' : 'NEEDS_ATTENTION';
    const message = score >= 90
      ? `Outstanding performance. ${score}% shows very strong understanding.`
      : score >= 80
        ? `Strong work. ${score}% shows a good grasp of the material.`
        : score >= 70
          ? `Good effort. ${score}% can improve with targeted revision.`
          : score >= 60
            ? `You are close. ${score}% can improve with focused practice.`
            : `${score}% shows some clear gaps, but they are fixable with focused revision.`;

    return {
      status,
      message,
      totalWeakAreas: weakTopics.length,
      recommendations: recommendations.slice(0, 4),
      focusSections
    };
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
        `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Review course textbook: Chapter on ${topicName} (introduction section)`,
        `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ Watch beginner tutorial video: "${topicName} explained for beginners"`,
        `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Study lecture notes specifically covering ${topicName} basics`,
        `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ Find simple examples: Search for "easy ${topicName} examples"`,
        `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¹Ã…â€œÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ Consider: Ask your instructor or TA for fundamental concept clarification`
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
        `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Course material: Detailed chapter on ${topicName}`,
        `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¥ Tutorial videos covering ${topicName} applications`,
        `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Review your class notes and homework on this topic`,
        `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â» Practice problems: ${difficulty} level ${topicName} exercises`,
        `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ Additional resources: Online tutorials or study guides`
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
        `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Review solutions to similar problems`,
        `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ Practice question banks focusing on ${topicName}`,
        `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ Past exam questions on this topic`,
        `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Advanced examples and case studies`
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

    return buildClientGapAnalysis(topicAnalysis, difficultyPerformance, score);

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
        message: `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â½ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â° Excellent work! You scored ${score}%`,
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
        message: `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Master "${topic.topic}" - Current Performance: ${topic.correct}/${topic.total} (${topic.accuracy.toFixed(1)}%)`,
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
          message: `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ Strengthen "${topic.topic}" - Current: ${topic.accuracy.toFixed(1)}%, Target: 80%+`,
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
        message: `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ Struggling with basic concepts (${easyAcc.toFixed(0)}% on EASY questions)`,
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
        message: `ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Strong performance! ${hardAcc > 0 ? `${hardAcc.toFixed(0)}% on HARD questions` : 'Ready for advanced challenges'}`,
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
      openConfirmDialog(
        "Incomplete Quiz",
        "You haven't answered all questions.",
        async () => {
          closeConfirmDialog();
        },
        "Submit",
        "Cancel",
        true,
        true,
        2000
      );
      return;
    }

    await submitQuiz();
  };

  const submitQuiz = async () => {
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

        // Clear generated MCQs from all storage tiers after submission
        MultiTierStorage.clearMCQs();

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

      // Clear generated MCQs from all storage tiers after submission
      MultiTierStorage.clearMCQs();

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
          <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-ink-secondary">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isAdaptiveUnavailable = error.toLowerCase().includes('adaptive practice is not ready');
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className={`${isAdaptiveUnavailable ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'} border p-6 max-w-lg`}>
          <h2 className={`${isAdaptiveUnavailable ? 'text-amber-900' : 'text-red-800'} text-xl font-semibold mb-2`}>
            {isAdaptiveUnavailable ? 'Adaptive Practice Not Ready Yet' : 'Error'}
          </h2>
          <p className={`${isAdaptiveUnavailable ? 'text-amber-800' : 'text-red-600'} mb-4`}>{error}</p>
          {isAdaptiveUnavailable && (
            <div className="mb-4 text-sm text-amber-900 bg-amber-100 border border-amber-200 p-3 leading-6">
              Adaptive practice uses your previous quiz results to target weak topics. Once you complete a few normal MCQ practice sets, this section can generate personalized questions for you.
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/student/mcq-practice')}
              className={`flex-1 text-white px-4 py-2 ${isAdaptiveUnavailable ? 'bg-ink-muted hover:bg-ink-muted/90' : 'bg-gray-600 hover:bg-gray-700'}`}
            >
              {isAdaptiveUnavailable ? 'Practice Sets' : 'Back'}
            </button>
            <button
              onClick={() => navigate('/student/dashboard')}
              className={`flex-1 text-white px-4 py-2 ${isAdaptiveUnavailable ? 'bg-amber-700 hover:bg-amber-800' : 'bg-red-600 hover:bg-red-700'}`}
            >
              Dashboard
            </button>
          </div>
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
      "Don't give up. Review the materials below and try again.";

    // Build topic ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ module map to identify weak areas
    const gapRecommendations = quiz.recommendations?.recommendations || [];
    const gapTitles: Record<string, string> = {
      STRENGTHS: 'Strengths',
      WEAK_AREAS: 'Weak Areas',
      STUDY_PRIORITY: 'Study Priority',
      TIME_MANAGEMENT: 'Time Management'
    };

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

        {/* ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Score Card ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ */}
        <div className="bg-parchment border border-sand-light overflow-hidden">
          {/* Score band */}
          <div className={`border-b ${scoreBg} px-6 pt-7 pb-5 text-center`}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Quiz Complete</p>
            <div className={`text-7xl font-bold ${scoreColor} leading-none mb-2`}>
              {score}%
            </div>
            <p className="text-sm text-ink-secondary">{scoreMessage}</p>
          </div>
          {/* Stats + actions */}
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="text-center py-3 bg-parchment-light">
                <div className="text-2xl font-bold text-gray-800">{quiz.results.totalQuestions}</div>
                <div className="text-xs text-ink-muted mt-0.5">Questions</div>
              </div>
              <div className="text-center py-3 bg-green-50">
                <div className="text-2xl font-bold text-green-600">{quiz.results.correctAnswers}</div>
                <div className="text-xs text-ink-muted mt-0.5">Correct</div>
              </div>
              <div className="text-center py-3 bg-red-50">
                <div className="text-2xl font-bold text-red-500">{quiz.results.incorrectAnswers}</div>
                <div className="text-xs text-ink-muted mt-0.5">Incorrect</div>
              </div>
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={() => navigate('/student/dashboard')}
                className="px-5 py-2 text-sm border border-ink-muted text-ink-secondary hover:bg-parchment-light transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 text-sm bg-ink-muted text-white hover:bg-ink-muted/90 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/student/mcq-practice')}
                className="px-5 py-2 text-sm border border-primary text-ink hover:bg-ink-muted/5 transition-colors"
              >
                More MCQs
              </button>
            </div>
          </div>
        </div>

        {/* ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Recommended Materials ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ */}
        {gapRecommendations.length > 0 && (
          <div className="bg-parchment border border-sand-light p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Gap Analysis</h2>
            {quiz.recommendations?.message && (
              <p className="text-sm text-ink-muted mb-4">{quiz.recommendations.message}</p>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              {gapRecommendations.map((recommendation, index) => (
                <div key={`${recommendation.type}-${index}`} className="border border-sand p-4 bg-parchment-light/40">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    {gapTitles[recommendation.type] || recommendation.type.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-ink-secondary mb-2">{recommendation.message}</p>
                  <p className="text-sm text-ink-muted mb-3">{recommendation.action}</p>
                  {recommendation.resources && recommendation.resources.length > 0 && (
                    <ul className="space-y-1 text-sm text-ink-secondary list-disc pl-5">
                      {recommendation.resources.map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {quiz.answerDetails.length > 0 && (
          <div className="bg-parchment border border-sand-light p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-0.5">Recommended Materials</h2>
            <p className="text-xs text-ink-muted mb-4">
              Study these topics first. If related PDFs are available in the system, they are listed below.
            </p>

            {weakTopics.length === 0 ? (
              <p className="text-sm text-green-700 font-medium py-2">
                You performed well on all topics. Continue with mixed revision to maintain your level.
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(moduleGroups).map(([key, group]) => {
                  const resources = group.moduleId ? (relatedResources[group.moduleId] || []) : [];
                  return (
                    <div key={key} className="border border-sand p-4">
                      {/* Topic badges */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {group.topics.map((t, i) => (
                          <span
                            key={i}
                            className="text-xs bg-amber-100 text-amber-700 px-2.5 py-0.5 font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      {/* Module label */}
                      {group.moduleName && (
                        <p className="text-xs text-ink-muted mb-3">
                          Module:{' '}
                          <span className="font-medium text-ink-secondary">{group.moduleName}</span>
                          {group.moduleCode && (
                            <span className="text-gray-400"> - {group.moduleCode}</span>
                          )}
                        </p>
                      )}
                      {/* Resource links */}
                      {resources.length > 0 ? (
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-ink-muted mb-1">Recommended PDFs:</p>
                          {resources.map(r => (
                            <a
                              key={r.id}
                              href={`${API_BASE}/resources/${r.id}/download`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between gap-3 px-3 py-2 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
                            >
                              <span className="text-sm text-blue-700 font-medium flex-1 truncate">{r.title}</span>
                              <span className="text-xs text-blue-500 shrink-0">Open PDF</span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          {group.moduleId
                            ? 'No PDF resource is available for this module yet.'
                            : 'Ask your instructor for study material on this topic.'}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Answer Review ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Answer Review</h2>
          <div className="space-y-3">
            {quiz.answerDetails.map((answer) => {
              const options = parseOptions(answer.options);
              return (
                <div
                  key={answer.questionNumber}
                  className={`bg-parchment   border-l-4 p-5 ${
                    answer.isCorrect ? 'border-green-500' : 'border-red-400'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <h3 className="text-sm font-medium text-gray-800 flex-1 leading-relaxed">
                      <span className="text-gray-400 mr-1">Q{answer.questionNumber}.</span>
                      {answer.question}
                    </h3>
                    <span className={`shrink-0 px-2.5 py-0.5  text-xs font-semibold ${
                      answer.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {answer.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {options.map((option, idx) => {
                      const isSelected = option === answer.selectedAnswer;
                      const isCorrect = option === answer.correctAnswer;
                      let style = 'bg-parchment-light border border-sand-light text-ink-secondary';
                      if (isCorrect) style = 'bg-green-50 border border-green-300 text-green-800';
                      else if (isSelected && !isCorrect) style = 'bg-red-50 border border-red-300 text-red-800';
                      return (
                        <div key={idx} className={`px-3 py-2  text-sm ${style}`}>
                          <span className="font-medium">{String.fromCharCode(65 + idx)}. </span>
                          {option}
                          {isCorrect && (
                            <span className="ml-2 text-green-600 text-xs font-semibold">Correct</span>
                          )}
                          {isSelected && !isCorrect && (
                            <span className="ml-2 text-red-600 text-xs font-semibold">Your answer</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {answer.explanation && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 px-3 py-2.5 -lg mb-2.5">
                      <p className="text-xs font-semibold text-blue-800 mb-0.5">Explanation</p>
                      <p className="text-xs text-blue-700 leading-relaxed">{answer.explanation}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {answer.topic && (
                      <span className="text-xs bg-parchment-light text-ink-secondary px-2 py-0.5">
                        {answer.topic}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5  ${
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
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="bg-parchment p-5 sm:p-6 md:p-8 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-ink-secondary border border-ink-muted hover:bg-parchment-light transition-colors"
          >
            ← Go Back
          </button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">MCQ Practice</h1>
        <p className="text-ink-secondary mb-4">Answer all questions and submit to see your results</p>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-ink-secondary mb-6">
          <span>Questions: {quiz.questions.length}</span>
          <span>Answered: {Object.keys(quiz.answers).length} / {quiz.questions.length}</span>
        </div>

        <div className="w-full bg-parchment-dark h-2 mb-6">
          <div
            className="bg-ink-muted h-2 transition-all"
            style={{ width: `${(Object.keys(quiz.answers).length / quiz.questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {quiz.questions.map((question) => {
          const options = parseOptions(question.options);
          return (
            <div key={question.id} className="bg-parchment p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                <h3 className="font-semibold text-lg flex-1">
                  Q{question.questionNumber}. {question.question}
                </h3>
                {question.difficulty && (
                  <span className={`px-3 py-1 text-sm sm:ml-3 ${
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
                    className={`flex items-start sm:items-center p-4 border-2 cursor-pointer transition-all ${
                      quiz.answers[question.id] === option
                        ? 'border-primary bg-ink-muted/10'
                        : 'border-sand hover:border-primary/50 hover:bg-parchment-light'
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
                  <span className="text-sm text-ink-secondary bg-parchment-light px-2 py-1">
                    Topic: {question.topic}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-0 bg-parchment border-t p-4 mt-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="text-sm text-ink-secondary">
            Answered: {Object.keys(quiz.answers).length} / {quiz.questions.length}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              onClick={() => {
                openConfirmDialog(
                  "Abandon Quiz",
                  "Are you sure you want to abandon this quiz?",
                  () => {
                    closeConfirmDialog();
                    navigate('/student/mcq-practice');
                  },
                  "Abandon",
                  "Cancel",
                  true
                );
              }}
              className="px-6 py-2 border border-ink-muted bg-parchment text-ink-secondary hover:bg-parchment-light transition-colors w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={quiz.isSubmitting}
              className="bg-ink-muted text-white px-8 py-2 hover:bg-ink-muted/90 disabled:bg-sand disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {quiz.isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
        isDangerous={confirmDialog.isDangerous}
        autoClose={confirmDialog.autoClose}
        closeDelay={confirmDialog.closeDelay}
      />
    </div>
  );
}


