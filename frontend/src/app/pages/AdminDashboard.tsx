/**
 * Admin Dashboard Layout
 * Wrapper with sidebar navigation for admin routes
 */

import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { Button } from '../components/ui/button';
import AdminOverview from './AdminOverview';
import AdminResourcesPage from './AdminResourcesPage';
import AdminModulesPage from './AdminModulesPage';
import AdminSettingsPage from './AdminSettingsPage';
import { LayoutDashboard, FileText, BookOpen, Settings, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { 
      path: '/admin/dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      exact: true 
    },
    { 
      path: '/admin/resources', 
      label: 'Manage Resources', 
      icon: FileText 
    },
    { 
      path: '/admin/modules', 
      label: 'Manage Modules', 
      icon: BookOpen 
    },
    { 
      path: '/admin/settings', 
      label: 'Settings', 
      icon: Settings
    },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-screen">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">LearnBox</h1>
          <p className="text-xs text-gray-500 mt-1">Admin Portal</p>
        </div>
        
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                  w-full text-left px-4 py-3 rounded-lg mb-1 flex items-center gap-3 transition-colors
                  ${active 
                    ? 'text-gray-900 bg-gray-100 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#A8C5B5] flex items-center justify-center text-white font-medium">
              {user?.first_name?.[0] || user?.username?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 text-sm truncate">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="text-xs text-gray-500">College Admin</div>
            </div>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            size="sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {navItems.find(item => isActive(item.path, item.exact))?.label || 'Admin Dashboard'}
              </h2>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Nested Routes */}
        <div className="min-h-[calc(100vh-73px)]">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="resources" element={<AdminResourcesPage />} />
            <Route path="modules" element={<AdminModulesPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="bg-[#D5E3DF] py-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            2025 LearnBox. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}
