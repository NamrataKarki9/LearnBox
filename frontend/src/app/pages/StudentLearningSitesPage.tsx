import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFilters } from '../../context/FilterContext';
import { useNavigate } from 'react-router-dom';
import { learningSiteAPI, facultyAPI, moduleAPI, type LearningSite, type Faculty, type Module } from '../../services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { ExternalLink, BookOpen, Globe, LayoutDashboard, FileText, HelpCircle, AlignLeft, Link2, Settings, LogOut, ChevronRight } from 'lucide-react';
import { LogoutConfirmDialog } from '../components/LogoutConfirmDialog';
import { useLogoutConfirm } from '../../hooks/useLogoutConfirm';

import { P } from '../../constants/theme';

function Sidebar({ activeIdx, user, logout, logoutConfirm, navigate }: any) {
  const navItems = [
    { label: 'Dashboard',     icon: LayoutDashboard, path: '/student/dashboard' },
    { label: 'Resources',     icon: FileText,         path: '/student/resources' },
    { label: 'MCQs Practice', icon: HelpCircle,       path: '/student/mcq-practice' },
    { label: 'Summaries',     icon: AlignLeft,        path: '/student/summaries' },
    { label: 'Learning Sites',icon: Link2,             path: null },
    { label: 'Settings',      icon: Settings,          path: '/student/settings' },
  ];
  return (
    <aside style={{ width: 232, background: P.parchmentLight, borderRight: `1px solid ${P.sand}`, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${P.sand}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BookOpen size={18} color={P.vermillion} strokeWidth={2} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 18, color: P.ink }}>LearnBox</span>
        </div>
        <div style={{ marginTop: 6, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.inkMuted }}>Student Portal</div>
      </div>
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {navItems.map(({ label, icon: Icon, path }, i) => {
          const active = i === activeIdx;
          return (
            <button key={label} onClick={() => path && navigate(path)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: 'none', borderLeft: active ? `3px solid ${P.vermillion}` : `3px solid transparent`, background: active ? P.parchmentDark : 'transparent', color: active ? P.ink : P.inkMuted, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: active ? 700 : 500, fontSize: 13.5, letterSpacing: '0.02em', textAlign: 'left', cursor: path ? 'pointer' : 'default', width: '100%', transition: 'all 0.12s' }}
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
      <div style={{ borderTop: `1px solid ${P.sand}`, padding: '14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', marginBottom: 4 }}>
          <div style={{ width: 30, height: 30, background: P.inkMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 800, fontSize: 13, color: P.parchment }}>{(user?.first_name || user?.username || 'S').charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 13, color: P.ink, margin: 0 }}>{user?.first_name || user?.username}</p>
            <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, color: P.inkMuted, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Student</p>
          </div>
        </div>
        <button onClick={() => logoutConfirm.openConfirm(logout)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: 'none', borderLeft: '3px solid transparent', background: 'transparent', color: P.inkMuted, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 500, fontSize: 13.5, width: '100%', textAlign: 'left', cursor: 'pointer', transition: 'all 0.12s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = P.vermillionBg; (e.currentTarget as HTMLElement).style.color = P.vermillion; (e.currentTarget as HTMLElement).style.borderLeftColor = P.vermillion; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = P.inkMuted; (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'; }}>
          <LogOut size={15} strokeWidth={1.8} /> Logout
        </button>
      </div>
    </aside>
  );
}

export default function StudentLearningSitesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const filters = useFilters();
  const logoutConfirm = useLogoutConfirm();
  const [sites, setSites] = useState<LearningSite[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { facultyAPI.getAll().then(r => setFaculties(r.data.data || [])).catch(() => {}); }, []);
  useEffect(() => {
    const p: any = {};
    if (filters.facultyId !== 'all') p.facultyId = parseInt(filters.facultyId);
    if (filters.year !== 'all') p.year = parseInt(filters.year);
    moduleAPI.getAll(p).then(r => setModules(r.data.data || [])).catch(() => {});
  }, [filters.facultyId, filters.year]);

  useEffect(() => {
    const go = async () => {
      setLoading(true);
      try {
        const p: any = {};
        if (filters.facultyId !== 'all') p.facultyId = parseInt(filters.facultyId);
        if (filters.year !== 'all') p.year = parseInt(filters.year);
        if (filters.moduleId !== 'all') p.moduleId = parseInt(filters.moduleId);
        const r = await learningSiteAPI.getAll(p);
        setSites(r.data.data || []);
      } catch { toast.error('Failed to load learning sites'); }
      finally { setLoading(false); }
    };
    go();
  }, [filters.facultyId, filters.year, filters.moduleId]);

  const availableYears = useMemo(() => {
    const src = filters.facultyId === 'all' ? modules : modules.filter(m => m.facultyId === parseInt(filters.facultyId));
    return Array.from(new Set(src.map(m => m.year))).sort((a, b) => a - b);
  }, [modules, filters.facultyId]);

  const filteredModules = useMemo(() => {
    let r = modules;
    if (filters.facultyId !== 'all') r = r.filter(m => m.facultyId === parseInt(filters.facultyId));
    if (filters.year !== 'all') r = r.filter(m => m.year === parseInt(filters.year));
    return r;
  }, [modules, filters.facultyId, filters.year]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: P.parchment, fontFamily: "'Lora', Georgia, serif" }}>
      <Sidebar activeIdx={4} user={user} logout={logout} logoutConfirm={logoutConfirm} navigate={navigate} />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${P.sand}` }}>
          <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.vermillion, marginBottom: 6 }}>Curated Links</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: P.ink, margin: 0 }}>Learning Sites</h1>
          <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 14, color: P.inkMuted, marginTop: 6 }}>Handpicked external resources from your college administration.</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Faculty', width: 220, value: filters.facultyId, onChange: (v: string) => { filters.setFacultyId(v); filters.setYear('all'); filters.setModuleId('all'); }, options: [{ value: 'all', label: 'All Faculties' }, ...faculties.map(f => ({ value: f.id.toString(), label: f.name }))] },
            { label: 'Year', width: 150, value: filters.year, onChange: (v: string) => { filters.setYear(v); filters.setModuleId('all'); }, options: [{ value: 'all', label: 'All Years' }, ...availableYears.map(y => ({ value: y.toString(), label: `Year ${y}` }))] },
            { label: 'Module', width: 220, value: filters.moduleId, onChange: filters.setModuleId, options: [{ value: 'all', label: 'All Modules' }, ...filteredModules.map(m => ({ value: m.id.toString(), label: m.name }))] },
          ].map(({ label, width, value, onChange, options }) => (
            <div key={label} style={{ width }}>
              <Select value={value} onValueChange={onChange}>
                <SelectTrigger style={{ background: P.parchmentLight, border: `1px solid ${P.sand}`, borderRadius: 0, height: 38, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.ink }}>
                  <SelectValue placeholder={`Select ${label}`} />
                </SelectTrigger>
                <SelectContent>{options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          ))}
        </div>

        {/* Sites */}
        {loading ? (
          <div style={{ background: P.parchmentLight, border: `1px solid ${P.sand}`, padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', width: 32, height: 32, border: `2px solid ${P.ink}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 13, marginTop: 12 }}>Loading learning sites…</p>
          </div>
        ) : sites.length === 0 ? (
          <div style={{ background: P.parchmentLight, border: `1px solid ${P.sand}`, padding: '56px 24px', textAlign: 'center' }}>
            <Globe size={40} color={P.sand} strokeWidth={1} style={{ display: 'block', margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: P.ink, marginBottom: 8 }}>No learning sites found</h3>
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 14, color: P.inkMuted }}>Try adjusting your filters or check back after your admin adds links.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: `1px solid ${P.sand}` }}>
            {sites.map((site, i) => (
              <div key={site.id} style={{ background: P.parchmentLight, padding: '22px 24px', borderRight: i % 3 < 2 ? `1px solid ${P.sand}` : 'none', borderBottom: i < sites.length - (sites.length % 3 || 3) ? `1px solid ${P.sand}` : 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = P.parchmentDark}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = P.parchmentLight}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: P.ink, margin: 0, flex: 1, lineHeight: 1.3 }}>{site.title}</h3>
                  <span style={{ background: P.moss, color: '#fff', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', flexShrink: 0, marginLeft: 10 }}>Year {site.year}</span>
                </div>
                {site.description && <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkMuted, lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{site.description}</p>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {site.faculty && <span style={{ background: P.parchmentDark, color: P.inkSecondary, border: `1px solid ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 8px' }}>{site.faculty.name}</span>}
                  {site.module && <span style={{ background: P.mossBg, color: P.moss, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 8px' }}>{site.module.code}</span>}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <BookOpen size={11} color={P.inkMuted} strokeWidth={1.5} />
                    <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, color: P.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Curated link</span>
                  </div>
                  <button onClick={() => window.open(site.url, '_blank', 'noopener,noreferrer')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', background: P.inkMuted, color: P.parchmentLight, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = P.vermillion}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = P.ink}>
                    <ExternalLink size={12} strokeWidth={2} /> Visit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <LogoutConfirmDialog isOpen={logoutConfirm.isOpen} onConfirm={logoutConfirm.onConfirm} onCancel={logoutConfirm.onCancel} isLoading={logoutConfirm.isLoading} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
