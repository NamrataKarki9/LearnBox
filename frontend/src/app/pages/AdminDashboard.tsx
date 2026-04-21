/**
 * Admin Dashboard Layout 
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import AdminOverview from './AdminOverview';
import AdminResourcesPage from './AdminResourcesPage';
import AdminModulesPage from './AdminModulesPage';
import AdminMCQSetsPage from './AdminMCQSetsPage';
import AdminLearningSitesPage from './AdminLearningSitesPage';
import { LayoutDashboard, FileText, BookOpen, Settings, LogOut, Brain, Link2, ChevronRight } from 'lucide-react';
import { LogoutConfirmDialog } from '../components/LogoutConfirmDialog';
import { useLogoutConfirm } from '../../hooks/useLogoutConfirm';

import { P } from '../../constants/theme';

const NAV = [
  { path: '/admin/dashboard', label: 'Dashboard',        icon: LayoutDashboard, exact: true },
  { path: '/admin/resources', label: 'Manage Resources', icon: FileText },
  { path: '/admin/modules',   label: 'Manage Modules',   icon: BookOpen },
  { path: '/admin/mcq-sets',  label: 'MCQ Sets',         icon: Brain },
  { path: '/admin/learning-sites', label: 'Learning Sites', icon: Link2 },
  { path: '/admin/settings',  label: 'Settings',          icon: Settings },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const logoutConfirm = useLogoutConfirm();
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = viewportWidth < 768;

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const currentLabel = NAV.find(n => isActive(n.path, n.exact))?.label || 'Admin Dashboard';

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', background: P.parchment, fontFamily: "'Lora', Georgia, serif" }}>

      {/* Sidebar */}
      <aside style={{ width: isMobile ? '100%' : 240, background: P.parchmentLight, borderRight: isMobile ? 'none' : `1px solid ${P.sand}`, borderBottom: isMobile ? `1px solid ${P.sand}` : 'none', display: 'flex', flexDirection: 'column', position: isMobile ? 'relative' : 'sticky', top: 0, height: isMobile ? 'auto' : '100vh', zIndex: 20, flexShrink: 0 }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${P.sand}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={18} color={P.vermillion} strokeWidth={2} />
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 18, color: P.ink }}>LearnBox</span>
          </div>
          <div style={{ marginTop: 6, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.inkMuted }}>Admin Portal</div>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: 8, overflowY: 'auto', overflowX: isMobile ? 'auto' : 'visible' }}>
          {NAV.map(({ path, label, icon: Icon, exact }) => {
            const active = isActive(path, exact);
            return (
              <button key={path} onClick={() => navigate(path)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: 'none', borderLeft: !isMobile && active ? `3px solid ${P.vermillion}` : '3px solid transparent', borderBottom: isMobile && active ? `2px solid ${P.vermillion}` : '2px solid transparent', background: active ? P.parchmentDark : 'transparent', color: active ? P.ink : P.inkMuted, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: active ? 700 : 500, fontSize: 13.5, textAlign: 'left', cursor: 'pointer', width: isMobile ? 'auto' : '100%', whiteSpace: 'nowrap', transition: 'all 0.12s' }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = P.parchmentDark; (e.currentTarget as HTMLElement).style.color = P.ink; } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = P.inkMuted; } }}>
                <Icon size={15} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
                <span>{label}</span>
                {active && <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />}
              </button>
            );
          })}
        </nav>

        <div style={{ borderTop: `1px solid ${P.sand}`, padding: '14px 10px', display: isMobile ? 'none' : 'block' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', marginBottom: 4 }}>
            <div style={{ width: 30, height: 30, background: P.inkMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 800, fontSize: 13, color: P.parchment }}>{(user?.first_name || user?.username || 'A').charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 13, color: P.ink, margin: 0 }}>{user?.first_name} {user?.last_name}</p>
              <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, color: P.inkMuted, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>College Admin</p>
            </div>
          </div>
          <button onClick={() => logoutConfirm.openConfirm(logout)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: 'none', borderLeft: '3px solid transparent', background: 'transparent', color: P.inkMuted, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 500, fontSize: 13.5, width: '100%', textAlign: 'left', cursor: 'pointer', transition: 'all 0.12s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = P.vermillionBg; (e.currentTarget as HTMLElement).style.color = P.vermillion; (e.currentTarget as HTMLElement).style.borderLeftColor = P.vermillion; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = P.inkMuted; (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'; }}>
            <LogOut size={15} strokeWidth={1.8} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{ background: P.parchmentLight, borderBottom: `1px solid ${P.sand}`, padding: isMobile ? '12px 16px' : '0 40px', minHeight: 60, display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, flexShrink: 0 }}>
          <div>
            <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.vermillion }}>Admin Portal</span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800, color: P.ink, margin: 0 }}>{currentLabel}</h2>
          </div>
        </header>

        <div style={{ flex: 1, background: P.parchment }}>
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="dashboard" element={<AdminOverview />} />
            <Route path="resources" element={<AdminResourcesPage />} />
            <Route path="modules" element={<AdminModulesPage />} />
            <Route path="mcq-sets" element={<AdminMCQSetsPage />} />
            <Route path="learning-sites" element={<AdminLearningSitesPage />} />
          </Routes>
        </div>

        <footer style={{ background: P.parchmentLight, borderTop: `1px solid ${P.sand}`, padding: isMobile ? '14px 16px' : '16px 40px', textAlign: 'center', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          © 2025 LearnBox. All rights reserved.
        </footer>
      </main>

      <LogoutConfirmDialog isOpen={logoutConfirm.isOpen} onConfirm={logoutConfirm.onConfirm} onCancel={logoutConfirm.onCancel} isLoading={logoutConfirm.isLoading} />
    </div>
  );
}
