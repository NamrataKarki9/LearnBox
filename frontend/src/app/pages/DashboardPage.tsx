import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">LearnBox Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.first_name || user?.username}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">User Profile</h2>
            <div className="space-y-3">
              <div>
                <span className="font-semibold">Username:</span> {user?.username}
              </div>
              <div>
                <span className="font-semibold">Email:</span> {user?.email}
              </div>
              {user?.first_name && (
                <div>
                  <span className="font-semibold">First Name:</span> {user.first_name}
                </div>
              )}
              {user?.last_name && (
                <div>
                  <span className="font-semibold">Last Name:</span> {user.last_name}
                </div>
              )}
              <div>
                <span className="font-semibold">Roles:</span> {user?.roles.join(', ')}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
