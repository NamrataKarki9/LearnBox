/**
 * Dashboard Router Component
 * Routes users to role-specific dashboards
 */

import { useAuth, ROLES } from '../../context/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperAdminDashboard from './SuperAdminDashboard';
import AdminDashboard from './AdminDashboard';
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

    // Optional: Redirect to specific URLs if preferred
    // if (hasRole(ROLES.SUPER_ADMIN)) {
    //   navigate('/super-admin');
    // } else if (hasRole(ROLES.COLLEGE_ADMIN)) {
    //   navigate('/admin');
    // } else if (hasRole(ROLES.STUDENT)) {
    //   navigate('/student');
    // }
  }, [user, navigate]);

  // Render role-specific dashboard component
  if (hasRole(ROLES.SUPER_ADMIN)) {
    return <SuperAdminDashboard />;
  }

  if (hasRole(ROLES.COLLEGE_ADMIN)) {
    return <AdminDashboard />;
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
