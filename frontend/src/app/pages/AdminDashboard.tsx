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
import AdminMCQSetsPage from './AdminMCQSetsPage';
import { LayoutDashboard, FileText, BookOpen, Settings, LogOut, Brain } from 'lucide-react';

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
      path: '/admin/mcq-sets', 
      label: 'MCQ Sets', 
      icon: Brain 
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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col fixed h-screen">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">LearnBox</h1>
          <p className="text-xs text-muted-foreground mt-1">Admin Portal</p>
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
                    ? 'text-foreground bg-accent font-medium' 
                    : 'text-muted-foreground hover:bg-muted'
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
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
              {user?.first_name?.[0] || user?.username?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground text-sm truncate">
                {user?.first_name} {user?.last_name}
              </div>
              <div className="text-xs text-muted-foreground">College Admin</div>
            </div>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="w-full"
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
        <header className="bg-card border-b border-border px-8 py-4 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {navItems.find(item => isActive(item.path, item.exact))?.label || 'Admin Dashboard'}
              </h2>
            </div>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
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
            <Route path="mcq-sets" element={<AdminMCQSetsPage />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="bg-muted py-6 border-t border-border">
          <div className="text-center text-sm text-muted-foreground">
            2025 LearnBox. All rights reserved.
          </div>
        </footer>
      </main>
    </div>
  );
}
