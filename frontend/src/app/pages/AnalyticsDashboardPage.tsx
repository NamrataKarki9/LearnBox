import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsAPI, PerformanceStats, WeakPoint, Recommendation, ModulePerformance } from '../../services/api';

export default function AnalyticsDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [dashboard, setDashboard] = useState<{
    overview: PerformanceStats | null;
    weakAreas: WeakPoint[];
    recommendations: {
      status: string;
      totalWeakAreas?: number;
      recommendations: Recommendation[];
    } | null;
    recentActivity: any[];
    dailyProgress: any[];
    modulePerformance: ModulePerformance[];
  }>({
    overview: null,
    weakAreas: [],
    recommendations: null,
    recentActivity: [],
    dailyProgress: [],
    modulePerformance: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getDashboard();
      setDashboard(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard.overview) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <h2 className="text-yellow-800 text-xl font-semibold mb-2">No Data Available</h2>
          <p className="text-yellow-600 mb-4">
            {error || 'Start practicing MCQs to see your performance analytics!'}
          </p>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const overview = dashboard.overview;
  const accuracyColor = 
    overview.accuracy >= 80 ? 'text-green-600' :
    overview.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600';

  const trendIcon = 
    overview.recentTrend === 'IMPROVING' ? '📈' :
    overview.recentTrend === 'DECLINING' ? '📉' : '➡️';

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Performance Analytics</h1>
        <p className="text-gray-600">Track your progress and identify areas for improvement</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Overall Accuracy</div>
          <div className={`text-3xl font-bold ${accuracyColor}`}>{overview.accuracy.toFixed(1)}%</div>
          <div className="text-sm text-gray-500 mt-1">
            {overview.correctAttempts} / {overview.totalAttempts} correct
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Quizzes Taken</div>
          <div className="text-3xl font-bold text-blue-600">{overview.quizzesTaken}</div>
          <div className="text-sm text-gray-500 mt-1">
            Avg: {overview.averageQuizScore}% score
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Questions</div>
          <div className="text-3xl font-bold text-purple-600">{overview.totalAttempts}</div>
          <div className="text-sm text-gray-500 mt-1">
            Attempted so far
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Recent Trend</div>
          <div className="text-3xl font-bold text-gray-700">
            {trendIcon} {overview.recentTrend}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Last 20 attempts: {overview.recentAccuracy.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Difficulty Breakdown */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Performance by Difficulty</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(overview.byDifficulty).map(([difficulty, data]) => (
            <div key={difficulty} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className={`font-semibold ${
                  difficulty === 'EASY' ? 'text-green-600' :
                  difficulty === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {difficulty}
                </span>
                <span className="text-2xl font-bold">{data.accuracy}%</span>
              </div>
              <div className="text-sm text-gray-600">
                {data.correct} / {data.total} correct
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${
                    difficulty === 'EASY' ? 'bg-green-500' :
                    difficulty === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${data.accuracy}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {dashboard.recommendations && dashboard.recommendations.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📚 Study Recommendations</h2>
          <div className="space-y-3">
            {dashboard.recommendations.recommendations.map((rec, idx) => {
              const priorityColors = {
                CRITICAL: 'border-red-500 bg-red-50',
                HIGH: 'border-orange-500 bg-orange-50',
                MEDIUM: 'border-yellow-500 bg-yellow-50',
                LOW: 'border-blue-500 bg-blue-50'
              };

              return (
                <div
                  key={idx}
                  className={`border-l-4 p-4 rounded ${priorityColors[rec.priority]}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold flex-1">{rec.message}</p>
                    <span className="text-xs bg-white px-2 py-1 rounded ml-2">
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Action:</strong> {rec.action}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>⏱️ {rec.estimatedTime}</span>
                    {rec.topic && rec.module && (
                      <span className="text-xs bg-white px-2 py-1 rounded">
                        {rec.module.name} - {rec.topic}
                      </span>
                    )}
                  </div>
                  {rec.topics && rec.topics.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {rec.topics.slice(0, 3).map((t: any, i: number) => (
                        <div key={i} className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                          {t.module} - {t.topic}: {t.accuracy}%
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weak Areas */}
      {dashboard.weakAreas.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">⚠️ Areas Needing Attention</h2>
            <button
              onClick={() => navigate('/student/practice?adaptive=true')}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
            >
              Practice Weak Areas
            </button>
          </div>
          <div className="space-y-3">
            {dashboard.weakAreas.map((weak, idx) => (
              <div
                key={idx}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">
                      {weak.module?.name || 'General'} - {weak.topic}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {weak.difficulty} difficulty • {weak.attempts} attempts
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      weak.severity === 'CRITICAL' ? 'text-red-600' :
                      weak.severity === 'HIGH' ? 'text-orange-600' :
                      weak.severity === 'MEDIUM' ? 'text-yellow-600' : 'text-blue-600'
                    }`}>
                      {weak.accuracy.toFixed(1)}%
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      weak.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      weak.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      weak.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {weak.severity}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      weak.accuracy < 40 ? 'bg-red-500' :
                      weak.accuracy < 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${weak.accuracy}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Module Performance */}
      {dashboard.modulePerformance.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📊 Module-wise Performance</h2>
          <div className="space-y-4">
            {dashboard.modulePerformance.map((mod, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{mod.module.name}</h3>
                    <p className="text-sm text-gray-600">
                      {mod.module.code} • Year {mod.module.year}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      mod.overallAccuracy >= 80 ? 'text-green-600' :
                      mod.overallAccuracy >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {mod.overallAccuracy.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">
                      {mod.correctAttempts} / {mod.totalAttempts}
                    </div>
                  </div>
                </div>

                {mod.topicBreakdown && mod.topicBreakdown.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Weakest Topics:</p>
                    <div className="space-y-1">
                      {mod.topicBreakdown.slice(0, 3).map((topic, i) => (
                        <div key={i} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                          <span className="text-gray-700">{topic.name}</span>
                          <span className={`font-semibold ${
                            topic.accuracy >= 60 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {topic.accuracy.toFixed(1)}% ({topic.attempts} attempts)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {dashboard.recentActivity && dashboard.recentActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">🕒 Recent Quizzes</h2>
          <div className="space-y-3">
            {dashboard.recentActivity.map((activity: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center border-b pb-3 last:border-0">
                <div className="flex-1">
                  <h4 className="font-semibold">{activity.title}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(activity.date).toLocaleDateString()} • {activity.module || 'General'}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${
                    activity.score >= 80 ? 'text-green-600' :
                    activity.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {activity.score}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {activity.correctAnswers}/{activity.totalQuestions}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3 justify-center">
        <button
          onClick={() => navigate('/student/practice?adaptive=true')}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold"
        >
          🎯 Practice Weak Areas
        </button>
        <button
          onClick={() => navigate('/student/dashboard')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
        >
          📝 Practice More
        </button>
      </div>
    </div>
  );
}
