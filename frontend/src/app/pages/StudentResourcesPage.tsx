import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFilters } from '../../context/FilterContext';
import { useNavigate } from 'react-router-dom';
import { resourceAPI, facultyAPI, type Resource, type Faculty } from '../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Download, FileText, BookOpen, GraduationCap, Eye, LayoutDashboard, HelpCircle, AlignLeft, Link2, Settings, LogOut, ChevronRight, Grid3x3, List } from 'lucide-react';
import { useLogoutConfirm } from '../../hooks/useLogoutConfirm';
import { LogoutConfirmDialog } from '../components/LogoutConfirmDialog';

import { P } from '../../constants/theme';

export default function StudentResourcesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const filters = useFilters();
  const logoutConfirm = useLogoutConfirm();
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const [resources, setResources] = useState<Resource[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingResource, setViewingResource] = useState<{ url: string; title: string } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 5;
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth < 1024;

  useEffect(() => {
    facultyAPI.getAll().then(r => setFaculties(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const go = async () => {
      setLoading(true); setError('');
      try {
        const params: any = {};
        if (filters.facultyId !== 'all') params.facultyId = parseInt(filters.facultyId);
        if (filters.year !== 'all') params.year = parseInt(filters.year);
        if (filters.moduleId !== 'all') params.moduleId = parseInt(filters.moduleId);
        const r = await resourceAPI.filter(params);
        setResources(r.data.data || []);
        setCurrentPage(0); // Reset pagination when resources change
      } catch (e: any) { setError(e.response?.data?.error || 'Failed to fetch resources'); }
      finally { setLoading(false); }
    };
    go();
  }, [filters.facultyId, filters.year, filters.moduleId]);

  const handleDownload = (id: number) => { try { window.open(resourceAPI.getDownloadUrl(id), '_blank', 'noopener,noreferrer'); } catch {} };
  const handleView = (r: Resource) => { try { setViewingResource({ url: resourceAPI.getDownloadUrl(r.id), title: r.title }); setViewerOpen(true); } catch {} };

  // Pagination logic
  const paginatedResources = resources.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const totalPages = Math.ceil(resources.length / pageSize);

  const PaginationControls = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: P.parchmentLight, borderTop: `1px solid ${P.sand}`, marginTop: 0 }}>
      <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, color: P.inkSecondary }}>Page {currentPage + 1} of {totalPages}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 0} style={{ padding: '6px 12px', background: currentPage === 0 ? P.parchment : P.ink, color: currentPage === 0 ? P.inkMuted : P.parchmentLight, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', cursor: currentPage === 0 ? 'not-allowed' : 'pointer' }}>Previous</button>
        <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage >= totalPages - 1} style={{ padding: '6px 12px', background: currentPage >= totalPages - 1 ? P.parchment : P.ink, color: currentPage >= totalPages - 1 ? P.inkMuted : P.parchmentLight, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer' }}>Next</button>
      </div>
    </div>
  );

  const faculty = faculties.find(f => f.id.toString() === filters.facultyId);
  const filterLabel = [
    faculty ? faculty.name : 'All Faculties',
    filters.year !== 'all' ? `Year ${filters.year}` : 'All Years',
    filters.moduleId !== 'all' ? 'Selected Module' : 'All Modules',
  ].join(' › ');

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
    { label: 'Resources', icon: FileText, path: null },
    { label: 'MCQs Practice', icon: HelpCircle, path: '/student/mcq-practice' },
    { label: 'Summaries', icon: AlignLeft, path: '/student/summaries' },
    { label: 'Learning Sites', icon: Link2, path: '/student/learning-sites' },
    { label: 'Settings', icon: Settings, path: '/student/settings' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', background: P.parchment, fontFamily: "'Lora', Georgia, serif" }}>
      {/* Sidebar */}
      <aside style={{ width: isMobile ? '100%' : 232, background: P.parchmentLight, borderRight: isMobile ? 'none' : `1px solid ${P.sand}`, borderBottom: isMobile ? `1px solid ${P.sand}` : 'none', display: 'flex', flexDirection: 'column', position: isMobile ? 'relative' : 'sticky', top: 0, height: isMobile ? 'auto' : '100vh', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${P.sand}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={18} color={P.vermillion} strokeWidth={2} />
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 18, color: P.ink }}>LearnBox</span>
          </div>
          <div style={{ marginTop: 6, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.inkMuted }}>Student Portal</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: 8, overflowX: isMobile ? 'auto' : 'visible' }}>
          {navItems.map(({ label, icon: Icon, path }, i) => {
            const active = i === 1;
            return (
              <button key={label} onClick={() => path && navigate(path)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: 'none', borderLeft: !isMobile && active ? `3px solid ${P.vermillion}` : `3px solid transparent`, borderBottom: isMobile && active ? `2px solid ${P.vermillion}` : '2px solid transparent', background: active ? P.parchmentDark : 'transparent', color: active ? P.ink : P.inkMuted, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: active ? 700 : 500, fontSize: 13.5, letterSpacing: '0.02em', textAlign: 'left', cursor: path ? 'pointer' : 'default', width: isMobile ? 'auto' : '100%', whiteSpace: 'nowrap', transition: 'all 0.12s' }}
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
        <div style={{ borderTop: `1px solid ${P.sand}`, padding: '14px 10px', display: isMobile ? 'none' : 'block' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', marginBottom: 4 }}>
            <div style={{ width: 30, height: 30, background: P.inkMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 800, fontSize: 13, color: P.parchment }}>{(user?.first_name || user?.username || 'S').charAt(0).toUpperCase()}</span>
            </div>
            <div><p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 13, color: P.ink, margin: 0 }}>{user?.first_name || user?.username}</p><p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, color: P.inkMuted, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Student</p></div>
          </div>
          <button onClick={() => logoutConfirm.openConfirm(logout)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: 'none', borderLeft: '3px solid transparent', background: 'transparent', color: P.inkMuted, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 500, fontSize: 13.5, width: '100%', textAlign: 'left', cursor: 'pointer', transition: 'all 0.12s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = P.vermillionBg; (e.currentTarget as HTMLElement).style.color = P.vermillion; (e.currentTarget as HTMLElement).style.borderLeftColor = P.vermillion; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = P.inkMuted; (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'; }}
          >
            <LogOut size={15} strokeWidth={1.8} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: isMobile ? '16px' : '32px', overflow: 'auto', minWidth: 0 }}>
        {/* Page header */}
        <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${P.sand}` }}>
          <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.vermillion, marginBottom: 6 }}>Learning Materials</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: P.ink, margin: 0 }}>Resources</h1>
          <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 14, color: P.inkMuted, marginTop: 6 }}>Browse and download study materials for your courses.</p>
        </div>

        {/* Filter summary bar */}
        <div style={{ background: P.parchmentLight, border: `1px solid ${P.sand}`, borderLeft: `3px solid ${P.ink}`, padding: '14px 20px', marginBottom: 24, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BookOpen size={14} color={P.vermillion} strokeWidth={2} />
            <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.inkMuted }}>Viewing:</span>
            <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: P.ink }}>{filterLabel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 0, boxShadow: `inset 0 0 0 1px ${P.sand}` }}>
              <button onClick={() => { setViewMode('grid'); setCurrentPage(0); }} style={{ padding: '6px 12px', background: viewMode === 'grid' ? P.parchmentDark : 'transparent', color: viewMode === 'grid' ? P.ink : P.inkSecondary, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Grid3x3 size={13} /> Grid
              </button>
              <button onClick={() => { setViewMode('list'); setCurrentPage(0); }} style={{ padding: '6px 12px', background: viewMode === 'list' ? P.parchmentDark : 'transparent', color: viewMode === 'list' ? P.ink : P.inkSecondary, border: 'none', boxShadow: `inset -1px 0 0 ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <List size={13} /> List
              </button>
            </div>
            <button onClick={() => navigate('/student/dashboard')} style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '7px 16px', border: `1px solid ${P.sand}`, background: 'transparent', color: P.inkSecondary, cursor: 'pointer', transition: 'all 0.12s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = P.parchmentDark; (e.currentTarget as HTMLElement).style.borderColor = P.ink; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = P.sand; }}>
              Change Selection
            </button>
          </div>
        </div>

        {/* Error */}
        {error && <div style={{ background: P.vermillionBg, borderLeft: `3px solid ${P.vermillion}`, padding: '12px 16px', marginBottom: 20, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: '#7A1C10' }}>{error}</div>}

        {/* Resources */}
        {loading ? (
          <div style={{ background: P.parchmentLight, border: `1px solid ${P.sand}`, padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ display: 'inline-block', width: 32, height: 32, border: `2px solid ${P.ink}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 13, marginTop: 12 }}>Loading resources…</p>
          </div>
        ) : resources.length === 0 ? (
          <div style={{ background: P.parchmentLight, border: `1px solid ${P.sand}`, padding: '64px 24px', textAlign: 'center' }}>
            <BookOpen size={40} color={P.sand} strokeWidth={1} style={{ display: 'block', margin: '0 auto 16px' }} />
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: P.ink, marginBottom: 8 }}>No resources found</h3>
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 14, color: P.inkMuted }}>
              {filters.facultyId !== 'all' || filters.year !== 'all' || filters.moduleId !== 'all'
                ? 'Try adjusting your filters to find more resources.'
                : 'No resources have been uploaded yet.'}
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div style={{ border: `1px solid ${P.sand}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 0 }}>
                  {paginatedResources.map((res, i) => (
                    <div key={res.id} style={{ background: P.parchmentLight, padding: '22px 24px', borderRight: !isTablet && i % 3 < 2 ? `1px solid ${P.sand}` : isTablet && !isMobile && i % 2 === 0 ? `1px solid ${P.sand}` : 'none', borderBottom: i < paginatedResources.length - 1 ? `1px solid ${P.sand}` : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = P.parchmentDark}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = P.parchmentLight}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{ width: 36, height: 36, background: P.parchmentDark, border: `1px solid ${P.sand}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={16} color={P.vermillion} strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: P.ink, marginBottom: 6, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.title}</h3>
                          {res.description && <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12.5, color: P.inkMuted, marginBottom: 10, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{res.description}</p>}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <GraduationCap size={11} color={P.inkMuted} />
                              <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, letterSpacing: '0.04em' }}>{res.faculty?.code} — {res.faculty?.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <BookOpen size={11} color={P.inkMuted} />
                              <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, letterSpacing: '0.04em' }}>Year {res.year} — {res.module?.name}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, color: P.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                              {new Date(res.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => handleView(res)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: `1px solid ${P.sand}`, background: 'transparent', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.inkSecondary, cursor: 'pointer' }}>
                                <Eye size={12} strokeWidth={2} /> View
                              </button>
                              <button onClick={() => handleDownload(res.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: 'none', background: P.inkMuted, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.parchment, cursor: 'pointer' }}>
                                <Download size={12} strokeWidth={2} /> DL
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && <PaginationControls />}
              </div>
            ) : (
              <div style={{ border: `1px solid ${P.sand}`, background: P.parchmentLight }}>
                <div>
                  {paginatedResources.map((res, i) => (
                    <div key={res.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', borderBottom: i < paginatedResources.length - 1 ? `1px solid ${P.sand}` : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = P.parchmentDark}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = P.parchmentLight}
                    >
                      <div style={{ width: 36, height: 36, background: P.parchmentDark, border: `1px solid ${P.sand}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={16} color={P.vermillion} strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: P.ink, marginBottom: 4 }}>{res.title}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <GraduationCap size={11} color={P.inkMuted} />
                            <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, letterSpacing: '0.04em' }}>{res.faculty?.code} — {res.faculty?.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <BookOpen size={11} color={P.inkMuted} />
                            <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, letterSpacing: '0.04em' }}>Year {res.year} — {res.module?.name}</span>
                          </div>
                          <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, color: P.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            {new Date(res.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button onClick={() => handleView(res)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: `1px solid ${P.sand}`, background: 'transparent', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.inkSecondary, cursor: 'pointer' }}>
                          <Eye size={12} strokeWidth={2} /> View
                        </button>
                        <button onClick={() => handleDownload(res.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: 'none', background: P.inkMuted, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.parchment, cursor: 'pointer' }}>
                          <Download size={12} strokeWidth={2} /> DL
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && <PaginationControls />}
              </div>
            )}
          </>
        )}
      </main>

      {/* Viewer modal */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0" style={{ border: `2px solid ${P.ink}` }}>
          <DialogHeader style={{ padding: '14px 24px', borderBottom: `1px solid ${P.sand}`, background: P.parchmentLight, flexShrink: 0 }}>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: P.ink }}>{viewingResource?.title}</DialogTitle>
          </DialogHeader>
          <div style={{ flex: 1, minHeight: 0, background: P.parchmentDark }}>
            {viewingResource && <iframe src={`${viewingResource.url}#zoom=page-width&view=FitH`} style={{ width: '100%', height: '100%', border: 'none' }} title={viewingResource.title} allow="fullscreen" />}
          </div>
        </DialogContent>
      </Dialog>
      <LogoutConfirmDialog isOpen={logoutConfirm.isOpen} onConfirm={logoutConfirm.onConfirm} onCancel={logoutConfirm.onCancel} isLoading={logoutConfirm.isLoading} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
