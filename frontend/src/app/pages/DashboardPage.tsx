/**
 * Dashboard Router Component
 * Routes users to role-specific dashboards
 */

import { useAuth, ROLES } from '../../context/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperAdminDashboard from './SuperAdminDashboard';
import StudentDashboard from './StudentDashboard';

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  // Redirect based on role
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Redirect to specific URLs based on role
    if (hasRole(ROLES.SUPER_ADMIN)) {
      navigate('/superadmin');
    } else if (hasRole(ROLES.COLLEGE_ADMIN)) {
      navigate('/admin/dashboard');
    } else if (hasRole(ROLES.STUDENT)) {
      navigate('/student-dashboard');
    }
  }, [user, hasRole, navigate]);

  // For backward compatibility or initial render
  if (hasRole(ROLES.SUPER_ADMIN)) {
    return <SuperAdminDashboard />;
  }

  if (hasRole(ROLES.STUDENT)) {
    return <StudentDashboard />;
  }

  // Fallback
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Invalid Role</h1>
        <p className="text-gray-600 mt-2">Your account role is not recognized.</p>
      </div>
    </div>
  );
}
