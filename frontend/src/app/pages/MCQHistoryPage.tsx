import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizAPI } from '../../services/api';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

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

export default function MCQHistoryPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<QuizSession[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterModule, setFilterModule] = useState<string>('');

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your quiz history...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/student/dashboard')}
              className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
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
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-3xl font-bold text-blue-600">{stats.totalQuizzes}</div>
                <div className="text-sm text-gray-600 mt-1">Total Quizzes</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-3xl font-bold text-green-600">{stats.averageScore}%</div>
                <div className="text-sm text-gray-600 mt-1">Average Score</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-3xl font-bold text-purple-600">{stats.totalQuestions}</div>
                <div className="text-sm text-gray-600 mt-1">Questions Answered</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="text-3xl font-bold text-orange-600">
                  {stats.totalQuestions > 0
                    ? ((stats.totalCorrect / stats.totalQuestions) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Overall Accuracy</div>
              </div>
            </div>
          )}

          {/* Quiz History List */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Quiz History</h2>
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-5xl mb-3">📝</div>
                <p className="text-lg mb-2">No quiz history yet</p>
                <p className="text-sm mb-4">Start practicing to see your history here!</p>
                <button
                  onClick={() => navigate('/student/mcq-practice')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
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
                          <h3 className="font-semibold text-lg">
                            {session.set?.title || 'Custom Practice'}
                          </h3>
                          {session.module && (
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
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
                          onClick={() => navigate(`/student/quiz-review/${session.id}`)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
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
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow-md"
            >
              Practice More MCQs
            </button>
            <button
              onClick={() => navigate('/student/analytics')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 shadow-md"
            >
              View Analytics Dashboard
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
