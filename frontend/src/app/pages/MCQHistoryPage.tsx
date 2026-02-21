import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizAPI } from '../../services/api';
import { X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface QuizSession {
  id: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent?: number;
  startedAt: string;
  submittedAt: string;
  set?: {
    title: string;
  };
  module?: {
    name: string;
    code: string;
  };
}

interface HistoryStats {
  totalQuizzes: number;
  averageScore: string;
  totalQuestions: number;
  totalCorrect: number;
}

interface QuizDetail {
  session: QuizSession;
  questions: Array<{
    id: number;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
    selectedAnswer: string;
    isCorrect: boolean;
    difficulty?: string;
    topic?: string;
  }>;
}

export default function MCQHistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<QuizSession[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterModule, setFilterModule] = useState<string>('');
  const [selectedQuiz, setSelectedQuiz] = useState<QuizDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [filterModule]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { limit: 50 };
      if (filterModule) {
        params.moduleId = parseInt(filterModule);
      }

      console.log('📚 Fetching quiz history with params:', params);
      const response = await quizAPI.getHistory(params);
      console.log('✅ Quiz history response:', response.data);
      setHistory(response.data.data);
      setStats(response.data.stats);
    } catch (err: any) {
      console.error('❌ Failed to fetch quiz history:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to load history';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HARD': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchQuizDetails = async (sessionId: number) => {
    try {
      setLoadingDetails(true);
      const response = await quizAPI.getSession(sessionId);
      const sessionData = response.data.data;

      // Transform the backend data to our QuizDetail format
      const questions = sessionData.attempts.map((attempt: any) => ({
        id: attempt.mcq.id,
        question: attempt.mcq.question,
        options: attempt.mcq.options,
        correctAnswer: attempt.mcq.correctAnswer,
        explanation: attempt.mcq.explanation,
        selectedAnswer: attempt.selectedAnswer,
        isCorrect: attempt.isCorrect,
        difficulty: attempt.mcq.difficulty,
        topic: attempt.mcq.topic
      }));

      setSelectedQuiz({
        session: {
          id: sessionData.id,
          score: sessionData.score,
          totalQuestions: sessionData.totalQuestions,
          correctAnswers: sessionData.correctAnswers,
          timeSpent: sessionData.timeSpent,
          startedAt: sessionData.startedAt,
          submittedAt: sessionData.submittedAt,
          set: sessionData.set,
          module: sessionData.module
        },
        questions
      });
    } catch (err: any) {
      console.error('Failed to fetch quiz details:', err);
      setError('Failed to load quiz details');
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your quiz history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/student/dashboard')}
              className="text-[#A8C5B5] hover:text-[#8fb3a3] mb-4 flex items-center font-medium transition-colors"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">MCQ Practice History</h1>
            <p className="text-gray-600 mt-2">Track your progress and review past quiz attempts</p>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="text-3xl font-bold text-[#A8C5B5]">{stats.totalQuizzes}</div>
                <div className="text-sm text-gray-600 mt-1">Total Quizzes</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="text-3xl font-bold text-green-600">{stats.averageScore}%</div>
                <div className="text-sm text-gray-600 mt-1">Average Score</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="text-3xl font-bold text-blue-600">{stats.totalQuestions}</div>
                <div className="text-sm text-gray-600 mt-1">Questions Answered</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="text-3xl font-bold text-purple-600">
                  {stats.totalQuestions > 0
                    ? ((stats.totalCorrect / stats.totalQuestions) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Overall Accuracy</div>
              </div>
            </div>
          )}

          {/* Quiz History List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Quiz History</h2>
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-5xl mb-3">📝</div>
                <p className="text-lg mb-2">No quiz history yet</p>
                <p className="text-sm mb-4">Start practicing to see your history here!</p>
                <button
                  onClick={() => navigate('/student/mcq-practice')}
                  className="bg-[#A8C5B5] text-white px-6 py-2 rounded-lg hover:bg-[#8fb3a3] transition-colors"
                >
                  Start Practicing
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {history.map((session) => (
                  <div key={session.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {session.set?.title || 'Custom Practice'}
                          </h3>
                          {session.module && (
                            <span className="text-sm bg-[#A8C5B5] bg-opacity-20 text-[#6b9485] px-2 py-1 rounded font-medium">
                              {session.module.code}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                          <div>
                            <span className="font-medium">Questions:</span> {session.totalQuestions}
                          </div>
                          <div>
                            <span className="font-medium">Correct:</span> {session.correctAnswers}
                          </div>
                          <div>
                            <span className="font-medium">Time:</span> {formatTime(session.timeSpent)}
                          </div>
                          <div>
                            <span className="font-medium">Date:</span> {formatDate(session.submittedAt)}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 text-right">
                        <div className={`text-3xl font-bold px-4 py-2 rounded-lg ${getScoreColor(session.score)}`}>
                          {session.score}%
                        </div>
                        <button
                          onClick={() => fetchQuizDetails(session.id)}
                          className="mt-2 text-sm text-[#A8C5B5] hover:text-[#8fb3a3] hover:underline font-medium transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            session.score >= 80 ? 'bg-green-600' :
                            session.score >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${session.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => navigate('/student/mcq-practice')}
              className="bg-[#A8C5B5] text-white px-6 py-3 rounded-lg hover:bg-[#8fb3a3] shadow-sm transition-colors font-medium"
            >
              Practice More MCQs
            </button>
          </div>
        </div>

        {/* Quiz Details Modal */}
        {selectedQuiz && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-white to-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {selectedQuiz.session.set?.title || 'Custom Practice'}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Completed on {formatDate(selectedQuiz.session.submittedAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedQuiz(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Score and Stats */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                    <div className={`text-3xl font-bold ${
                      selectedQuiz.session.score >= 80 ? 'text-green-600' :
                      selectedQuiz.session.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {selectedQuiz.session.score}%
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Score</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                    <div className="text-3xl font-bold text-[#A8C5B5]">{selectedQuiz.session.totalQuestions}</div>
                    <div className="text-xs text-gray-600 mt-1">Questions</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                    <div className="text-3xl font-bold text-green-600">{selectedQuiz.session.correctAnswers}</div>
                    <div className="text-xs text-gray-600 mt-1">Correct</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                    <div className="text-3xl font-bold text-blue-600">{formatTime(selectedQuiz.session.timeSpent)}</div>
                    <div className="text-xs text-gray-600 mt-1">Time</div>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loadingDetails ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading quiz details...</p>
                  </div>
                ) : (
                  selectedQuiz.questions.map((question, index) => {
                    const options = typeof question.options === 'string' 
                      ? JSON.parse(question.options) 
                      : question.options;

                    return (
                      <div
                        key={question.id}
                        className={`border rounded-lg p-5 ${
                          question.isCorrect 
                            ? 'border-green-200 bg-green-50/50' 
                            : 'border-red-200 bg-red-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700">Q{index + 1}.</span>
                            {question.difficulty && (
                              <Badge className={getDifficultyColor(question.difficulty)}>
                                {question.difficulty}
                              </Badge>
                            )}
                            {question.isCorrect ? (
                              <Badge className="bg-green-100 text-green-800">✓ Correct</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">✗ Incorrect</Badge>
                            )}
                          </div>
                          {question.topic && (
                            <Badge variant="outline" className="text-xs">{question.topic}</Badge>
                          )}
                        </div>

                        <p className="text-gray-900 mb-4">{question.question}</p>

                        <div className="space-y-2 mb-4">
                          {options.map((option: string, idx: number) => {
                            const isSelected = option === question.selectedAnswer;
                            const isCorrect = option === question.correctAnswer;

                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg border-2 ${
                                  isCorrect
                                    ? 'border-green-500 bg-green-50'
                                    : isSelected
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-200 bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isCorrect && (
                                    <span className="text-green-600 font-semibold">✓</span>
                                  )}
                                  {isSelected && !isCorrect && (
                                    <span className="text-red-600 font-semibold">✗</span>
                                  )}
                                  <span className={`${
                                    isCorrect ? 'font-semibold text-green-900' :
                                    isSelected ? 'font-semibold text-red-900' : 'text-gray-700'
                                  }`}>
                                    {option}
                                  </span>
                                  {isSelected && (
                                    <span className="ml-auto text-xs text-gray-600">(Your answer)</span>
                                  )}
                                  {isCorrect && (
                                    <span className="ml-auto text-xs text-green-700">(Correct answer)</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {question.explanation && (
                          <div className="bg-[#A8C5B5] bg-opacity-10 border border-[#A8C5B5] border-opacity-30 rounded-lg p-4">
                            <p className="text-xs font-semibold text-[#6b9485] mb-1.5">💡 Explanation:</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{question.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <Button
                  onClick={() => setSelectedQuiz(null)}
                  className="w-full bg-[#A8C5B5] hover:bg-[#8fb3a3] text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
