/**
 * Admin Overview — Paper & Ink Theme
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resourceAPI, moduleAPI, facultyAPI, Resource, Faculty } from '../../services/api';
import UploadResourceDialog from '../components/UploadResourceDialog';
import { toast } from 'sonner';
import { FileText, BookOpen, Clock, Upload, Eye, Download, Calendar, TrendingUp } from 'lucide-react';

import { P } from '../../constants/theme';

interface Module { id: number; name: string; code: string; facultyId: number; }

export default function AdminOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    if (!user?.collegeId) { toast.error('No college assigned'); setLoading(false); return; }
    setLoading(true);
    try {
      const [rR, mR, fR] = await Promise.all([
        resourceAPI.getAll({ collegeId: user.collegeId }),
        moduleAPI.getAll({ collegeId: user.collegeId }),
        facultyAPI.getAll({ collegeId: user.collegeId }),
      ]);
      setResources(rR.data.data || []);
      setModules(mR.data.data || []);
      setFaculties(fR.data.data || []);
    } catch { toast.error('Failed to load dashboard data'); }
    finally { setLoading(false); }
  };

  const recentResources = resources.filter(r => { const d = new Date(r.createdAt); const y = new Date(); y.setDate(y.getDate() - 1); return d > y; }).length;
  const thisWeekResources = resources.filter(r => { const d = new Date(r.createdAt); const w = new Date(); w.setDate(w.getDate() - 7); return d > w; }).length;
  const recentUploads = [...resources].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
  const resourcesByFaculty = faculties.map(f => ({ name: f.name, code: f.code, count: resources.filter(r => r.facultyId === f.id).length })).sort((a, b) => b.count - a.count);

  const fmtDate = (d: string) => {
    const date = new Date(d); const now = new Date(); const h = (now.getTime() - date.getTime()) / 3600000;
    if (h < 1) return 'Just now'; if (h < 24) return `${Math.floor(h)}h ago`; if (h < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const statCards = [
    { label: 'Total Resources', value: resources.length, sub: 'Across all modules', icon: FileText, color: P.vermillion, bg: P.vermillionBg, onClick: () => navigate('/admin/resources') },
    { label: 'Active Modules', value: modules.length, sub: `In ${faculties.length} faculties`, icon: BookOpen, color: P.moss, bg: P.mossBg, onClick: () => navigate('/admin/modules') },
    { label: 'Last 24 Hours', value: recentResources, sub: 'New uploads', icon: Clock, color: '#A07A30', bg: '#FEF5E4' },
    { label: 'This Week', value: thisWeekResources, sub: 'Resources added', icon: Calendar, color: P.ink, bg: P.parchmentDark },
  ];
  const softPanel: React.CSSProperties = { background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}, 0 10px 24px rgba(28,18,8,0.04)` };
  const softPrimaryButton: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: P.parchmentDark, color: P.inkSecondary, border: 'none', boxShadow: `inset 0 0 0 1px ${P.sandLight}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.15s, box-shadow 0.15s, color 0.15s' };
  const softGhostButton: React.CSSProperties = { ...softPrimaryButton, background: P.parchmentLight };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${P.sand}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.vermillion, marginBottom: 6 }}>Overview</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: P.ink, margin: 0 }}>Admin Dashboard</h1>
          <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 14, color: P.inkMuted, marginTop: 4 }}>Academic resources overview for your college</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setUploadDialogOpen(true)}
            style={softPrimaryButton}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = P.parchment; (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${P.sand}`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = P.parchmentDark; (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${P.sandLight}`; }}>
            <Upload size={13} /> Upload Resource
          </button>
          <button onClick={() => navigate('/admin/modules')}
            style={softGhostButton}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = P.parchmentDark; (e.currentTarget as HTMLElement).style.color = P.ink; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = P.parchmentLight; (e.currentTarget as HTMLElement).style.color = P.inkSecondary; }}>
            <BookOpen size={13} /> Manage Modules
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, ...softPanel, marginBottom: 28 }}>
        {statCards.map(({ label, value, sub, icon: Icon, color, bg, onClick }, i) => (
          <div key={label} onClick={onClick}
            style={{ background: P.parchmentLight, padding: '20px 22px', borderRight: i < 3 ? `1px solid ${P.sand}` : 'none', cursor: onClick ? 'pointer' : 'default', transition: 'background 0.12s' }}
            onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.background = P.parchmentDark; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = P.parchmentLight; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} strokeWidth={2} />
              </div>
              {i === 0 && <TrendingUp size={14} color={P.moss} strokeWidth={2} />}
            </div>
            <p style={{ fontFamily: "var(--font-numeric)", fontSize: 28, fontWeight: 800, color: P.ink, margin: '0 0 2px', lineHeight: 1 }}>{loading ? '—' : value}</p>
            <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, color: P.inkSecondary, margin: '4px 0 1px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</p>
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 11.5, color: P.inkMuted, margin: 0 }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Two column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Recent uploads */}
        <div style={softPanel}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${P.sandLight}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: P.inkMuted, color: P.parchment, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 10px' }}>Recent Uploads</span>
          </div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 13 }}>Loading…</div>
          ) : recentUploads.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 13 }}>No recent uploads</div>
          ) : recentUploads.map((r, i) => (
            <div key={r.id} onClick={() => navigate('/admin/resources')}
              style={{ padding: '12px 20px', borderBottom: i < recentUploads.length - 1 ? `1px solid ${P.sandLight}` : 'none', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = P.parchmentDark}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                <div style={{ width: 30, height: 30, background: P.vermillionBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={13} color={P.vermillion} strokeWidth={2} />
                </div>
                <div>
                  <h4 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, fontWeight: 700, color: P.ink, margin: 0, lineHeight: 1.3 }}>{r.title}</h4>
                  <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, margin: '2px 0 0', letterSpacing: '0.04em' }}>{r.module?.name || 'No module'}</p>
                </div>
              </div>
              <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtDate(r.createdAt)}</span>
            </div>
          ))}
        </div>

        {/* Resources by faculty */}
        <div style={softPanel}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${P.sandLight}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: P.inkMuted, color: P.parchment, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 10px' }}>By Faculty</span>
          </div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 13 }}>Loading…</div>
          ) : resourcesByFaculty.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 13 }}>No data available</div>
          ) : resourcesByFaculty.map((f, i) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: i < resourcesByFaculty.length - 1 ? `1px solid ${P.sandLight}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <div>
                  <h4 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, fontWeight: 700, color: P.ink, margin: 0 }}>{f.name}</h4>
                  <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, margin: '2px 0 0' }}>{f.code}</p>
                </div>
                <span style={{ fontFamily: "var(--font-numeric)", fontSize: 20, fontWeight: 800, color: P.vermillion }}>{f.count}</span>
              </div>
              <div style={{ height: 3, background: P.sandLight }}>
                <div style={{ height: '100%', width: resources.length > 0 ? `${(f.count / resources.length) * 100}%` : '0%', background: P.vermillion, transition: 'width 0.4s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, ...softPanel }}>
        {[
          { label: 'PDF Documents', value: resources.filter(r => r.fileType?.toLowerCase() === 'pdf').length, icon: FileText, color: P.vermillion },
          { label: 'Image Files', value: resources.filter(r => ['jpg','jpeg','png','gif'].includes(r.fileType?.toLowerCase())).length, icon: Eye, color: P.moss },
          { label: 'Other Files', value: resources.filter(r => !['pdf','jpg','jpeg','png','gif'].includes(r.fileType?.toLowerCase())).length, icon: Download, color: '#A07A30' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <div key={label} style={{ background: P.parchmentLight, padding: '18px 22px', borderRight: i < 2 ? `1px solid ${P.sand}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, color: P.inkMuted, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 4px' }}>{label}</p>
              <p style={{ fontFamily: "var(--font-numeric)", fontSize: 22, fontWeight: 800, color: P.ink, margin: 0 }}>{loading ? '—' : value}</p>
            </div>
            <Icon size={28} color={color} strokeWidth={1} />
          </div>
        ))}
      </div>

      <UploadResourceDialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} onSuccess={() => { toast.success('Uploaded!'); fetchData(); }} />
    </div>
  );
}
