import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Pages.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      
      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome back, {user?.username}! 👋</h2>
          <div className="user-info">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Status:</strong> {user?.email_verified ? '✓ Verified' : '✗ Not Verified'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
