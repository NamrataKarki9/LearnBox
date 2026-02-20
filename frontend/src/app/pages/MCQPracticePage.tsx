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

        setQuiz(prev => ({
          ...prev,
          results,
          answerDetails,
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

        {/* Recommendations Section */}
        {quiz.recommendations && quiz.recommendations.recommendations.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">💡</span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-purple-900">Personalized Study Plan</h2>
                <p className="text-sm text-purple-700">
                  {quiz.recommendations.message || 'Based on your performance, here are specific sections to focus on'}
                </p>
              </div>
            </div>

            {/* Focus Sections - Priority Areas */}
            {quiz.recommendations.focusSections && quiz.recommendations.focusSections.length > 0 && (
              <div className="mb-6 p-4 bg-white rounded-lg border-l-4 border-purple-600">
                <h3 className="font-bold text-lg text-purple-900 mb-3 flex items-center">
                  🎯 Sections You Should Focus On Now
                </h3>
                <div className="grid gap-3">
                  {quiz.recommendations.focusSections.map((section, idx) => {
                    const priorityColors = {
                      CRITICAL: 'bg-red-50 border-red-400 text-red-900',
                      HIGH: 'bg-orange-50 border-orange-400 text-orange-900',
                      MEDIUM: 'bg-yellow-50 border-yellow-400 text-yellow-900'
                    };

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border-2 ${priorityColors[section.priority] || priorityColors.MEDIUM}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="font-bold text-lg">{idx + 1}. {section.topic}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="text-sm">Current: {section.accuracy}%</div>
                              <div className="text-xs px-2 py-0.5 bg-white rounded">
                                {section.priority} PRIORITY
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{section.accuracy}%</div>
                            <div className="text-xs">accuracy</div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
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
                <div className="mt-4 p-3 bg-purple-100 rounded-lg text-sm text-purple-900">
                  💡 <strong>Tip:</strong> Focus on these sections in order. Mastering each topic will build a strong foundation!
                </div>
              </div>
            )}

            {/* Detailed Recommendations */}
            <h3 className="font-bold text-lg text-purple-900 mb-3">📋 Recommended Actions</h3>
            <div className="space-y-3">
              {quiz.recommendations.recommendations.map((rec, index) => {
                const priorityStyles = {
                  SUCCESS: 'bg-green-100 border-green-500 text-green-900',
                  CRITICAL: 'bg-red-100 border-red-500 text-red-900',
                  HIGH: 'bg-orange-100 border-orange-500 text-orange-900',
                  MEDIUM: 'bg-yellow-100 border-yellow-500 text-yellow-900',
                  LOW: 'bg-blue-100 border-blue-500 text-blue-900',
                  INFO: 'bg-indigo-100 border-indigo-500 text-indigo-900'
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
                    className={`p-4 rounded-lg border-l-4 ${priorityStyles[rec.priority] || priorityStyles.MEDIUM}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start flex-1">
                        <span className="text-2xl mr-2">{priorityIcons[rec.priority] || '📌'}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{rec.message}</h3>
                          
                          {rec.topic && (
                            <p className="text-sm mb-1">
                              <span className="font-medium">Section:</span> {rec.topic}
                              {rec.difficulty && ` (${rec.difficulty} level)`}
                            </p>
                          )}
                          
                          <p className="text-sm mb-1">
                            <span className="font-medium">What to do:</span> {rec.action}
                          </p>
                          
                          <p className="text-sm">
                            <span className="font-medium">Time needed:</span> {rec.estimatedTime}
                          </p>

                          {/* Resources list */}
                          {rec.resources && rec.resources.length > 0 && (
                            <div className="mt-2 bg-white bg-opacity-50 rounded p-2">
                              <p className="text-xs font-semibold mb-1">Study Resources:</p>
                              <ul className="text-xs space-y-1 list-disc list-inside">
                                {rec.resources.map((resource, idx) => (
                                  <li key={idx}>{resource}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {rec.topics && rec.topics.length > 0 && (
                            <div className="mt-2 bg-white bg-opacity-50 rounded p-2">
                              <p className="text-xs font-semibold mb-1">Topics to Review:</p>
                              <div className="space-y-1">
                                {rec.topics.map((topic, idx) => (
                                  <div key={idx} className="text-xs flex justify-between">
                                    <span>{topic.topic} ({topic.module})</span>
                                    <span className="font-medium">{topic.accuracy}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {rec.priority !== 'SUCCESS' && rec.priority !== 'INFO' && (
                        <span className={`ml-3 px-2 py-1 text-xs font-bold rounded`}>
                          {rec.priority}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {quiz.recommendations.totalWeakAreas && quiz.recommendations.totalWeakAreas > 0 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => navigate('/student/analytics')}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 shadow-md"
                >
                  View Full Analytics Dashboard
                </button>
              </div>
            )}
          </div>
        )}

        {/* Positive Feedback for Strong Performance */}
        {quiz.recommendations && quiz.recommendations.status === 'STRONG' && quiz.recommendations.recommendations.length === 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg shadow-lg p-6 mb-6 text-center">
            <span className="text-5xl mb-3 block">🎉</span>
            <h2 className="text-2xl font-bold text-green-900 mb-2">Excellent Performance!</h2>
            <p className="text-green-800">
              {quiz.recommendations.message || 'You\'re doing great! Keep up the excellent work.'}
            </p>
            <button
              onClick={() => navigate('/student/analytics')}
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              View Your Progress
            </button>
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
