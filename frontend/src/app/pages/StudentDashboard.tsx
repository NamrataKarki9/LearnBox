/**
 * Student Dashboard 
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFilters } from '../../context/FilterContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import { facultyAPI, moduleAPI, resourceAPI, Faculty, searchAPI, SemanticSearchResult, analyticsAPI } from '../../services/api';
import { toast } from 'sonner';
import {
  Download, Eye, TrendingUp, Target, BookOpen, Clock, Search, X,
  ChevronRight, LayoutDashboard, FileText, HelpCircle, AlignLeft,
  Link2, Settings, LogOut, Bell, BarChart2, Layers,
} from 'lucide-react';
import { LogoutConfirmDialog } from '../components/LogoutConfirmDialog';
import { useLogoutConfirm } from '../../hooks/useLogoutConfirm';

/* ── palette ── */
import { P } from '../../constants/theme';

interface Module {
  id: number; name: string; code: string; description?: string;
  year: number; facultyId: number; collegeId: number;
  faculty?: { id: number; name: string; code: string };
}
interface RecentSession {
  id: number; title: string; module?: string; score: number;
  totalQuestions: number; correctAnswers: number; date: string; timeSpent?: number;
}
interface WeakArea { topic: string; accuracy: number; module?: string; difficulty?: string; }
interface Recommendation { topic: string; priority: 'HIGH' | 'MEDIUM' | 'LOW'; reason: string; suggestedActions?: string[]; }

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const filters = useFilters();
  const logoutConfirm = useLogoutConfirm();
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);

  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [performanceStats, setPerformanceStats] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SemanticSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingResource, setViewingResource] = useState<{ url: string; title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth < 1024;

  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: P.parchment }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: 36, height: 36, border: `2px solid ${P.ink}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, color: P.inkMuted, marginTop: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Authenticating…</p>
      </div>
    </div>
  );

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [fRes, aRes] = await Promise.all([
          facultyAPI.getAll().catch(() => ({ data: { data: [] } })),
          analyticsAPI.getDashboard().catch(() => ({ data: { success: false, data: {} } })),
        ]);
        setFaculties(fRes?.data?.data || []);
        if (aRes?.data?.success && aRes?.data?.data) {
          const d = aRes.data.data as any;
          setPerformanceStats(d.overview || null);
          setRecentSessions(Array.isArray(d.recentActivity) ? d.recentActivity : []);
          setWeakAreas(Array.isArray(d.weakAreas) ? d.weakAreas : []);
          const recs = Array.isArray(d.recommendations) ? d.recommendations : (d.recommendations?.recommendations || []);
          setRecommendations(Array.isArray(recs) ? recs : []);
        }
        setLoading(false);
      } catch { setLoading(false); }
      finally { setAnalyticsLoading(false); }
    };
    fetch();
  }, []);

  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const r = await analyticsAPI.getDashboard().catch(() => ({ data: { success: false, data: {} } }));
        if (r?.data?.success && r?.data?.data) {
          const d = r.data.data as any;
          setPerformanceStats(d.overview || null);
          setRecentSessions(Array.isArray(d.recentActivity) ? d.recentActivity : []);
          setWeakAreas(Array.isArray(d.weakAreas) ? d.weakAreas : []);
          const recs = Array.isArray(d.recommendations) ? d.recommendations : (d.recommendations?.recommendations || []);
          setRecommendations(Array.isArray(recs) ? recs : []);
        }
      } catch {}
    }, 600000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const go = async () => {
      try {
        setLoading(true);
        const params: any = {};
        if (filters.facultyId !== 'all') params.facultyId = parseInt(filters.facultyId);
        const r = await moduleAPI.getAll(params);
        setModules(r.data.data);
        setLoading(false);
      } catch { setLoading(false); }
    };
    go();
  }, [filters.facultyId]);

  useEffect(() => {
    if (!modules.length) return;
    if (filters.facultyId === 'all') {
      const ys = new Set<number>(); modules.forEach(m => ys.add(m.year));
      setAvailableYears(Array.from(ys).sort());
    } else {
      const fm = modules.filter(m => m.facultyId === parseInt(filters.facultyId));
      const ys = new Set<number>(); fm.forEach(m => ys.add(m.year));
      setAvailableYears(Array.from(ys).sort());
      if (filters.year !== 'all' && ys.size > 0 && !ys.has(parseInt(filters.year))) filters.setYear('all');
    }
  }, [filters.facultyId, modules]);

  useEffect(() => {
    let f = modules;
    if (filters.facultyId !== 'all') f = f.filter(m => m.facultyId === parseInt(filters.facultyId));
    if (filters.year !== 'all') f = f.filter(m => m.year === parseInt(filters.year));
    if (filters.moduleId !== 'all') f = f.filter(m => m.id === parseInt(filters.moduleId));
    setFilteredModules(f);
  }, [modules, filters.facultyId, filters.year, filters.moduleId]);

  const handleFacultyChange = (v: string) => { filters.setFacultyId(v); filters.setYear('all'); filters.setModuleId('all'); };
  const handleYearChange = (v: string) => { filters.setYear(v); filters.setModuleId('all'); };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { toast.error('Please enter a search query'); return; }
    setIsSearching(true); setShowSearchResults(true);
    try {
      const r = await searchAPI.semanticSearch({ query: searchQuery, limit: 10 });
      setSearchResults(r.data.data);
      if (!r.data.data.length) toast.info('No results found.');
      else toast.success(`Found ${r.data.data.length} resources`);
    } catch (e: any) {
      if (e.response?.status === 503) toast.error('Search initialising, try again shortly.');
      else toast.error('Search failed.');
      setSearchResults([]);
    } finally { setIsSearching(false); }
  };

  const clearSearch = () => { setSearchQuery(''); setSearchResults([]); setShowSearchResults(false); };

  const handleView = (r: SemanticSearchResult) => {
    try { setViewingResource({ url: resourceAPI.getDownloadUrl(r.id), title: r.title }); setViewerOpen(true); }
    catch { toast.error('Failed to open resource viewer'); }
  };
  const handleDownload = (id: number) => {
    try { window.open(resourceAPI.getDownloadUrl(id), '_blank', 'noopener,noreferrer'); }
    catch { toast.error('Failed to download resource'); }
  };

  const stats = (() => {
    if (!performanceStats) return { totalModules: filteredModules.length, inProgress: filteredModules.length, averageScore: 0, accuracy: 0, totalAttempts: 0 };
    const avg = parseFloat(performanceStats.averageQuizScore) || 0;
    const acc = parseFloat(performanceStats.accuracy) || 0;
    return { totalModules: filteredModules.length, inProgress: filteredModules.length, averageScore: Math.round(avg * 10) / 10, accuracy: Math.round(acc * 10) / 10, totalAttempts: performanceStats.totalAttempts || 0 };
  })();

  const modulesByYear = filteredModules.reduce((acc, m) => {
    const y = m.year || 1; if (!acc[y]) acc[y] = []; acc[y].push(m); return acc;
  }, {} as Record<number, Module[]>);

  const formatDate = (d: any) => {
    try {
      if (!d) return '-';
      const dt = new Date(d); if (isNaN(dt.getTime())) return '-';
      const h = (Date.now() - dt.getTime()) / 3600000;
      if (h < 1) return 'Just now'; if (h < 24) return `${Math.floor(h)}h ago`; if (h < 48) return 'Yesterday';
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return '-'; }
  };
  const formatTime = (s: any) => {
    if (!s || s <= 0) return '-'; const m = Math.floor(s / 60);
    if (m < 1) return `${Math.round(s)}s`; if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  };
  const safe = (v: any, fb = '-') => {
    if (v == null) return fb; if (typeof v === 'string') return v.trim() || fb;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    return fb;
  };

  const navItems = [
    { label: 'Dashboard',          icon: LayoutDashboard, path: null },
    { label: 'Resources',          icon: FileText,         path: '/student/resources' },
    { label: 'MCQs Practice',      icon: HelpCircle,       path: '/student/mcq-practice' },
    { label: 'Summaries',          icon: AlignLeft,        path: '/student/summaries' },
    { label: 'Learning Sites',     icon: Link2,            path: '/student/learning-sites' },
    { label: 'Settings',           icon: Settings,         path: '/student/settings' },
  ];

  const statCards = [
    { label: 'Total Modules',  value: stats.totalModules,          icon: Layers,    color: P.ink,       tag: 'MODULES'  },
    { label: 'In Progress',    value: stats.inProgress,            icon: TrendingUp,color: P.inkSecondary, tag: 'ACTIVE'  },
    { label: 'Quiz Accuracy',  value: `${stats.accuracy}%`,        icon: Target,    color: P.vermillion,tag: 'ACCURACY' },
    { label: 'Average Score',  value: `${stats.averageScore}%`,    icon: BarChart2, color: P.moss,      tag: 'SCORE'    },
  ];
  const softPanel: React.CSSProperties = { background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}, 0 10px 24px rgba(28,18,8,0.04)` };

  /* Barlow Sub heading style */
  const sectionHead = (text: string, icon?: React.ReactNode) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      {icon && <span style={{ color: P.vermillion, display: 'flex' }}>{icon}</span>}
      <span style={{ background: P.inkMuted, color: P.parchment, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 10px' }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: P.sand }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', background: P.parchment, fontFamily: "'Lora', Georgia, serif" }}>

      {/* ──────────── SIDEBAR ──────────── */}
      <aside style={{ width: isMobile ? '100%' : 232, background: P.parchmentLight, boxShadow: isMobile ? `inset 0 -1px 0 ${P.sandLight}` : `inset -1px 0 0 ${P.sandLight}`, display: 'flex', flexDirection: 'column', position: isMobile ? 'relative' : 'sticky', top: 0, height: isMobile ? 'auto' : '100vh', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${P.sandLight}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={18} color={P.vermillion} strokeWidth={2} />
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 18, color: P.ink, letterSpacing: '-0.02em' }}>LearnBox</span>
          </div>
          <div style={{ marginTop: 6, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.inkMuted }}>
            Student Portal
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: 8, overflowX: isMobile ? 'auto' : 'visible' }}>
          {navItems.map(({ label, icon: Icon, path }, i) => {
            const active = i === 0;
            return (
              <button
                key={label}
                onClick={() => path && navigate(path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                  border: 'none', borderLeft: !isMobile && active ? `3px solid ${P.vermillion}` : '3px solid transparent',
                  borderBottom: isMobile && active ? `2px solid ${P.vermillion}` : '2px solid transparent',
                  background: active ? P.parchmentDark : 'transparent',
                  color: active ? P.ink : P.inkMuted,
                  fontFamily: "'Barlow Semi Condensed', sans-serif",
                  fontWeight: active ? 700 : 500,
                  fontSize: 13.5,
                  letterSpacing: '0.02em',
                  textAlign: 'left', cursor: path ? 'pointer' : 'default', width: isMobile ? 'auto' : '100%', whiteSpace: 'nowrap',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = P.parchmentDark; (e.currentTarget as HTMLElement).style.color = P.ink; }}}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = P.inkMuted; }}}
              >
                <Icon size={15} strokeWidth={active ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
                <span>{label}</span>
                {active && <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.4 }} />}
              </button>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div style={{ borderTop: `1px solid ${P.sandLight}`, padding: '14px 10px', display: isMobile ? 'none' : 'block' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', marginBottom: 4 }}>
            <div style={{ width: 30, height: 30, background: P.inkMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 800, fontSize: 13, color: P.parchment }}>
                {(user?.first_name || user?.username || 'S').charAt(0).toUpperCase()}
              </span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 13, color: P.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.first_name || user?.username || 'Student'}
              </p>
              <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, color: P.inkMuted, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Student</p>
            </div>
          </div>
          <button
            onClick={() => logoutConfirm.openConfirm(logout)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
              border: 'none', borderLeft: `3px solid transparent`,
              background: 'transparent', color: P.inkMuted,
              fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 500, fontSize: 13.5,
              width: '100%', textAlign: 'left', cursor: 'pointer', transition: 'all 0.12s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = P.vermillionBg; (e.currentTarget as HTMLElement).style.color = P.vermillion; (e.currentTarget as HTMLElement).style.borderLeftColor = P.vermillion; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = P.inkMuted; (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'; }}
          >
            <LogOut size={15} strokeWidth={1.8} /> Logout
          </button>
        </div>
      </aside>

      {/* ──────────── MAIN ──────────── */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar */}
        <header style={{ background: P.parchmentLight, borderBottom: `1px solid ${P.sandLight}`, padding: isMobile ? '12px 16px' : '0 32px', minHeight: 60, display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 0, zIndex: 10, flexShrink: 0, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          {/* Search */}
          <div style={{ flex: isMobile ? '1 1 100%' : 1, maxWidth: isMobile ? '100%' : 400, display: 'flex', gap: 0, background: P.parchment, boxShadow: `inset 0 0 0 1px ${P.sandLight}` }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: P.inkMuted, pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search resources and modules…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSearch()}
                style={{ width: '100%', padding: '9px 32px 9px 32px', border: 'none', background: 'transparent', fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.ink, outline: 'none', boxSizing: 'border-box' }}
              />
              {searchQuery && (
                <button onClick={clearSearch} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: P.inkMuted, padding: 0, display: 'flex' }}>
                  <X size={13} />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              style={{ padding: '0 16px', background: searchQuery.trim() ? P.ink : P.sandLight, color: searchQuery.trim() ? P.parchment : P.inkMuted, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: searchQuery.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.15s', flexShrink: 0 }}
            >
              {isSearching ? '…' : 'Search'}
            </button>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={{ width: 34, height: 34, border: 'none', boxShadow: `inset 0 0 0 1px ${P.sandLight}`, background: P.parchment, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Bell size={15} color={P.inkMuted} strokeWidth={1.8} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{ padding: isMobile ? '16px' : '32px', flex: 1 }}>

          {/* Search results */}
          {showSearchResults && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: P.ink, margin: 0 }}>Search Results</h2>
                  <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkMuted, marginTop: 4 }}>Results for: <em>"{searchQuery}"</em></p>
                </div>
                <button onClick={clearSearch} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', boxShadow: `inset 0 0 0 1px ${P.sandLight}`, background: P.parchmentLight, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.inkSecondary, cursor: 'pointer' }}>
                  <X size={12} /> Back
                </button>
              </div>

              {isSearching ? (
                <div style={{ textAlign: 'center', padding: '64px 0' }}>
                  <div style={{ display: 'inline-block', width: 36, height: 36, border: `2px solid ${P.ink}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 13, marginTop: 12 }}>Searching…</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div style={{ ...softPanel, padding: '56px 24px', textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 14 }}>No results found. Try different keywords.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, ...softPanel }}>
                  {searchResults.map((res, i) => (
                    <div key={res.id} style={{ background: P.parchmentLight, padding: '20px 24px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start', gap: 20, borderBottom: i < searchResults.length - 1 ? `1px solid ${P.sand}` : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = P.parchmentDark}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = P.parchmentLight}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: P.ink, margin: 0 }}>{res.title}</h3>
                          <span style={{ background: P.moss, color: '#fff', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px' }}>
                            {Math.round(res.relevanceScore * 100)}% match
                          </span>
                        </div>
                        {res.description && <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkMuted, marginBottom: 8 }}>{res.description}</p>}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                          {res.faculty && <span style={{ background: P.parchmentDark, color: P.inkSecondary, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 8px' }}>{res.faculty.name}</span>}
                          {res.year && <span style={{ background: P.parchmentDark, color: P.inkSecondary, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 8px' }}>Year {res.year}</span>}
                          {res.module && <span style={{ background: P.mossBg, color: P.moss, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 8px' }}>{res.module.name}</span>}
                          <span style={{ background: P.parchmentDark, color: P.inkMuted, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 8px' }}>{res.fileType.toUpperCase()}</span>
                        </div>
                        {res.matchedChunks && res.matchedChunks.length > 0 && (
                          <div style={{ background: P.parchmentDark, borderLeft: `3px solid ${P.vermillion}`, padding: '8px 12px' }}>
                            <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, color: P.inkMuted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>Relevant excerpt</p>
                            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, color: P.inkSecondary, fontStyle: 'italic', margin: 0 }}>"{res.matchedChunks[0]}"</p>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: 8, flexShrink: 0, width: isMobile ? '100%' : 'auto' }}>
                        <button onClick={() => handleView(res)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: 'none', boxShadow: `inset 0 0 0 1px ${P.sandLight}`, background: P.parchmentLight, fontFamily: "'Barlow Semi Condensed', sans-serif", color: P.inkSecondary, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                          <Eye size={13} /> View
                        </button>
                        <button onClick={() => handleDownload(res.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: 'none', background: P.inkMuted, fontFamily: "'Barlow Semi Condensed', sans-serif", color: P.parchment, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                          <Download size={13} /> Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dashboard content */}
          {!showSearchResults && (
            <>
              {/* Welcome */}
              <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${P.sand}` }}>
                <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.vermillion, marginBottom: 6 }}>
                  Student Dashboard
                </div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: P.ink, margin: 0, letterSpacing: '-0.02em' }}>
                  Welcome back, {user?.first_name || user?.username || 'Student'}
                </h1>
                <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 14, color: P.inkMuted, marginTop: 6 }}>
                  Here's your academic overview and recent activity.
                </p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                {[
                  { label: 'Faculty', width: 220, value: filters.facultyId, onChange: handleFacultyChange, options: [{ value: 'all', label: 'All Faculties' }, ...faculties.map(f => ({ value: f.id.toString(), label: f.name }))] },
                  { label: 'Year', width: 150, value: filters.year, onChange: handleYearChange, options: [{ value: 'all', label: 'All Years' }, ...availableYears.map(y => ({ value: y.toString(), label: `Year ${y}` }))], disabled: filters.facultyId === 'all' },
                  { label: 'Module', width: 220, value: filters.moduleId, onChange: filters.setModuleId, options: [{ value: 'all', label: 'All Modules' }, ...filteredModules.map(m => ({ value: m.id.toString(), label: m.name }))], disabled: filters.year === 'all' },
                ].map(({ label, width, value, onChange, options, disabled }) => (
                  <div key={label} style={{ width: isMobile ? '100%' : width }}>
                    <Select value={value} onValueChange={onChange} disabled={disabled}>
                      <SelectTrigger style={{ background: P.parchmentLight, border: 'none', boxShadow: `inset 0 0 0 1px ${P.sandLight}`, borderRadius: 0, height: 38, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.ink }}>
                        <SelectValue placeholder={`Select ${label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              {/* Stat cards */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 0, ...softPanel, marginBottom: 32 }}>
                {statCards.map(({ label, value, icon: Icon, color, tag }, i) => (
                    <div key={label} style={{ background: P.parchmentLight, padding: '20px 22px', borderRight: !isTablet && i < 3 ? `1px solid ${P.sand}` : 'none', borderBottom: (isMobile || isTablet) && i < statCards.length - 1 ? `1px solid ${P.sand}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ background: P.parchmentDark, color: P.inkMuted, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 8px', boxShadow: `inset 0 0 0 1px ${P.sandLight}` }}>{tag}</span>
                      <Icon size={16} color={color} strokeWidth={1.8} />
                    </div>
                    <p style={{ fontFamily: "var(--font-numeric)", fontSize: 28, fontWeight: 800, color: P.ink, margin: 0, lineHeight: 1 }}>{value}</p>
                    <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, marginTop: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* My Modules */}
              <div style={{ marginBottom: 32 }}>
                {sectionHead('My Modules', <BookOpen size={14} strokeWidth={2} />)}

                {loading ? (
                  <div style={{ ...softPanel, padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-block', width: 30, height: 30, border: `2px solid ${P.ink}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 13, marginTop: 10 }}>Loading modules…</p>
                  </div>
                ) : filteredModules.length === 0 ? (
                  <div style={{ ...softPanel, padding: '48px 24px', textAlign: 'center' }}>
                    <p style={{ fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 13 }}>No modules found for the selected filters.</p>
                  </div>
                ) : (
                  Object.keys(modulesByYear).sort().map(year => (
                    <div key={year} style={{ marginBottom: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <span style={{ background: P.moss, color: '#fff', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 10px' }}>Year {year}</span>
                        <div style={{ flex: 1, height: 1, background: P.sand }} />
                        <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted }}>{modulesByYear[parseInt(year)].length} module{modulesByYear[parseInt(year)].length !== 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 0, ...softPanel }}>
                        {modulesByYear[parseInt(year)].map((mod, mi) => (
                          <div
                            key={mod.id}
                            style={{ background: P.parchmentLight, padding: '22px 24px', borderRight: !isMobile && mi % 2 === 0 ? `1px solid ${P.sand}` : 'none', borderBottom: mi < modulesByYear[parseInt(year)].length - (isMobile ? 1 : 2) ? `1px solid ${P.sand}` : 'none', transition: 'background 0.15s' }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = P.parchmentDark}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = P.parchmentLight}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                              <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: P.ink, margin: 0, flex: 1 }}>{mod.name}</h4>
                              <span style={{ background: P.parchmentDark, color: P.moss, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', flexShrink: 0, marginLeft: 10 }}>{mod.code}</span>
                            </div>
                            {mod.faculty && <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>{mod.faculty.name}</p>}
                            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkSecondary, lineHeight: 1.55, marginBottom: 16 }}>
                              {mod.description || 'No description available.'}
                            </p>
                            {/* Progress bar */}
                            <div style={{ marginBottom: 16 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, color: P.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Progress</span>
                                <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, color: P.ink }}>0%</span>
                              </div>
                              <div style={{ height: 3, background: P.sandLight }}>
                                <div style={{ height: '100%', width: '0%', background: P.vermillion }} />
                              </div>
                            </div>
                            <button
                              onClick={() => { filters.setFilters({ facultyId: mod.facultyId.toString(), year: mod.year.toString(), moduleId: mod.id.toString() }); navigate('/student/resources'); }}
                              style={{ width: '100%', padding: '9px', border: 'none', background: P.inkMuted, color: P.parchment, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.15s' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = P.vermillion}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = P.ink}
                            >
                              View Module <ChevronRight size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom grid: Recent sessions + Weak areas */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 28 }}>

                {/* Recent Sessions */}
                <div>
                  {sectionHead('Recent Quiz Sessions', <Clock size={14} strokeWidth={2} />)}
                  <div style={softPanel}>
                    {analyticsLoading ? (
                      <div style={{ padding: '32px 24px', textAlign: 'center', fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 13 }}>Loading…</div>
                    ) : recentSessions.length === 0 ? (
                      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                        <Clock size={24} color={P.sand} strokeWidth={1.5} style={{ display: 'block', margin: '0 auto 10px' }} />
                        <p style={{ fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 13 }}>No quiz sessions yet. Start practising!</p>
                      </div>
                    ) : (
                      recentSessions.slice(0, 5).map((sess, i) => (
                        <div key={i} style={{ padding: '14px 20px', borderBottom: i < Math.min(recentSessions.length, 5) - 1 ? `1px solid ${P.sandLight}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 32, height: 32, background: P.parchmentDark, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <BookOpen size={14} color={P.vermillion} strokeWidth={2} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontFamily: "'Lora', Georgia, serif", fontWeight: 700, fontSize: 13, color: P.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{safe(sess.title, 'Quiz')}</p>
                            <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, margin: 0, marginTop: 2 }}>
                              <span style={{ color: P.moss, fontWeight: 700 }}>{sess.correctAnswers || 0}</span>/{sess.totalQuestions || 0} correct
                              {sess.timeSpent ? ` · ${formatTime(sess.timeSpent)}` : ''}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted }}>{formatDate(sess.date)}</span>
                            {sess.module && <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, color: P.moss, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{safe(sess.module)}</div>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Weak Areas */}
                <div>
                  {sectionHead('Areas to Focus', <Target size={14} strokeWidth={2} />)}
                  <div style={softPanel}>
                    {analyticsLoading ? (
                      <div style={{ padding: '32px 24px', textAlign: 'center', fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 13 }}>Loading…</div>
                    ) : weakAreas.length === 0 ? (
                      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                        <Target size={24} color={P.sand} strokeWidth={1.5} style={{ display: 'block', margin: '0 auto 10px' }} />
                        <p style={{ fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 13 }}>No weak areas identified yet. Keep practising!</p>
                      </div>
                    ) : (
                      weakAreas.slice(0, 5).map((area, i) => {
                        const acc = Math.min(100, Math.max(0, typeof area.accuracy === 'number' ? area.accuracy : 0));
                        const barCol = acc < 40 ? P.vermillion : acc < 65 ? '#C0882B' : P.moss;
                        return (
                          <div key={i} style={{ padding: '14px 20px', borderBottom: i < Math.min(weakAreas.length, 5) - 1 ? `1px solid ${P.sandLight}` : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div>
                                <p style={{ fontFamily: "'Lora', Georgia, serif", fontWeight: 700, fontSize: 13, color: P.ink, margin: 0 }}>{safe(area.topic, 'Unknown')}</p>
                                {area.module && <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, color: P.inkMuted, margin: 0, marginTop: 2, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{safe(area.module)}</p>}
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 800, color: barCol }}>{acc.toFixed(0)}%</span>
                                {area.difficulty && <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, color: P.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{safe(area.difficulty)}</div>}
                              </div>
                            </div>
                            <div style={{ height: 3, background: P.sandLight }}>
                              <div style={{ height: '100%', width: `${acc}%`, background: barCol, transition: 'width 0.4s ease' }} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div style={{ marginBottom: 32 }}>
                {sectionHead('Personalised Study Recommendations', <BookOpen size={14} strokeWidth={2} />)}
                <div style={softPanel}>
                  {analyticsLoading ? (
                    <div style={{ padding: '32px 24px', textAlign: 'center', fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 13 }}>Loading…</div>
                  ) : !recommendations || recommendations.length === 0 ? (
                    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                      <p style={{ fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 13 }}>Keep practising to get personalised recommendations!</p>
                    </div>
                  ) : (
                    recommendations.slice(0, 5).map((rec, i) => {
                      const pMap: Record<string, { bg: string; color: string; label: string }> = {
                        HIGH:   { bg: P.vermillionBg, color: P.vermillion, label: 'High' },
                        MEDIUM: { bg: '#FEF5E4', color: '#A07A30', label: 'Medium' },
                        LOW:    { bg: P.mossBg, color: P.moss, label: 'Low' },
                      };
                      const ps = pMap[rec.priority] || pMap.MEDIUM;
                      return (
                        <div key={i} style={{ padding: '16px 20px', borderBottom: i < Math.min(recommendations.length, 5) - 1 ? `1px solid ${P.sandLight}` : 'none', display: 'flex', gap: 16, alignItems: 'flex-start', borderLeft: `3px solid ${ps.color}` }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                              <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14, color: P.ink, margin: 0 }}>{safe(rec.topic, 'Study Area')}</p>
                              <span style={{ background: ps.bg, color: ps.color, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px' }}>{ps.label} Priority</span>
                            </div>
                            {rec.reason && <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12.5, color: P.inkMuted, margin: 0, lineHeight: 1.55 }}>{safe(rec.reason)}</p>}
                            {rec.suggestedActions && Array.isArray(rec.suggestedActions) && rec.suggestedActions.length > 0 && (
                              <ul style={{ margin: '8px 0 0 16px', padding: 0, listStyle: 'disc' }}>
                                {rec.suggestedActions.slice(0, 2).map((a, ai) => (
                                  <li key={ai} style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, color: P.inkMuted, lineHeight: 1.6 }}>{safe(a)}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Dashboard footer */}
        <footer style={{ background: P.parchmentDark, borderTop: `1px solid ${P.sandLight}`, padding: isMobile ? '20px 16px' : '28px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 32, marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${P.sand}` }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <BookOpen size={15} color={P.vermillion} strokeWidth={2} />
                <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 15, color: P.ink }}>LearnBox</span>
              </div>
              <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, color: P.inkMuted, lineHeight: 1.65, margin: 0 }}>Your academic learning companion.</p>
            </div>
            {[
              { title: 'About Us', links: ['Our Story', 'Mission', 'Vision'] },
              { title: 'Support', links: ['Help Center', 'Contact Us', 'FAQ'] },
              { title: 'Legal', links: ['Privacy Policy', 'Terms of Service'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, color: P.ink, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{title}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {links.map(link => (
                    <li key={link} style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, color: P.inkMuted, marginBottom: 6, cursor: 'pointer', transition: 'color 0.12s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = P.vermillion}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = P.inkMuted}
                    >{link}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, textAlign: 'center', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>© 2025 LearnBox. All rights reserved.</p>
        </footer>
      </main>

      {/* Resource viewer modal */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0" style={{ overflow: 'hidden', boxShadow: `inset 0 0 0 1px ${P.sandLight}, 0 22px 50px rgba(28,18,8,0.16)` }}>
          <DialogHeader style={{ padding: '14px 24px', borderBottom: `1px solid ${P.sandLight}`, background: P.parchmentLight, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: P.ink }}>{viewingResource?.title}</DialogTitle>
              <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, letterSpacing: '0.04em' }}>Use Ctrl +/− to zoom</span>
            </div>
          </DialogHeader>
          <div style={{ flex: 1, minHeight: 0, background: P.parchmentDark }}>
            {viewingResource && (
              <iframe src={`${viewingResource.url}#zoom=page-width&view=FitH`} style={{ width: '100%', height: '100%', border: 'none' }} title={viewingResource.title} allow="fullscreen" />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <LogoutConfirmDialog isOpen={logoutConfirm.isOpen} onConfirm={logoutConfirm.onConfirm} onCancel={logoutConfirm.onCancel} isLoading={logoutConfirm.isLoading} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
