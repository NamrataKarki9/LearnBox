/**
 * Admin Learning Sites Page — Paper & Ink Theme
 */

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { learningSiteAPI, facultyAPI, moduleAPI, LearningSite, Faculty, Module } from '../../services/api';
import { toast } from 'sonner';
import { Plus, Search, ExternalLink, Trash2, Edit, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

import { P, adminSelectStyle } from '../../constants/theme';

function AdminPageModal({ open, title, topColor, onClose, children, actions, width = 500 }: any) {
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,8,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}, 0 18px 40px rgba(28,18,8,0.12)`, borderTop: `3px solid ${topColor}`, padding: '28px 32px', maxWidth: width, width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800, color: P.ink, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.inkMuted }}><X size={18} /></button>
        </div>
        {children}
        {actions && <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${P.sand}` }}>{actions}</div>}
      </div>
    </div>
  );
}

export default function AdminLearningSitesPage() {
  const { user } = useAuth();
  const [sites, setSites] = useState<LearningSite[]>([]);
  const [filteredSites, setFilteredSites] = useState<LearningSite[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmSiteId, setDeleteConfirmSiteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<LearningSite | null>(null);
  const [editFormData, setEditFormData] = useState({ title: '', description: '', facultyId: '', year: '', moduleId: '', url: '' });
  const [editFormModules, setEditFormModules] = useState<Module[]>([]);
  const [editSaving, setEditSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [filterModule, setFilterModule] = useState('all');

  const [formData, setFormData] = useState({ title: '', description: '', facultyId: '', year: '', moduleId: '', url: '' });
  const [formModules, setFormModules] = useState<Module[]>([]);

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => { applyFilters(); }, [sites, searchQuery, filterFaculty, filterYear, filterModule]);
  useEffect(() => {
    if (!formData.facultyId || !formData.year) { setFormModules([]); return; }
    const loadM = async () => { try { const r = await moduleAPI.getByFacultyAndYear(parseInt(formData.facultyId), parseInt(formData.year)); setFormModules(r.data.data||[]); } catch { setFormModules([]); } };
    loadM();
  }, [formData.facultyId, formData.year]);

  useEffect(() => {
    if (!editDialogOpen || !editFormData.facultyId || !editFormData.year) { setEditFormModules([]); return; }
    const loadEM = async () => { try { const r = await moduleAPI.getByFacultyAndYear(parseInt(editFormData.facultyId), parseInt(editFormData.year)); setEditFormModules(r.data.data||[]); } catch { setEditFormModules([]); } };
    loadEM();
  }, [editFormData.facultyId, editFormData.year, editDialogOpen]);

  const fetchInitialData = async () => {
    if (!user?.collegeId) { toast.error('No college assigned'); setLoading(false); return; }
    setLoading(true);
    try {
      const [sR, fR, mR] = await Promise.allSettled([learningSiteAPI.getAll({ collegeId: user.collegeId }), facultyAPI.getAll({ collegeId: user.collegeId }), moduleAPI.getAll({ collegeId: user.collegeId })]);
      if (sR.status === 'fulfilled') setSites(sR.value.data.data||[]); else setSites([]);
      if (fR.status === 'fulfilled') setFaculties(fR.value.data.data||[]); else setFaculties([]);
      if (mR.status === 'fulfilled') setModules(mR.value.data.data||[]); else setModules([]);
    } catch { toast.error('Failed to load data'); } finally { setLoading(false); }
  };

  const applyFilters = () => {
    let r = [...sites];
    if (searchQuery) { const q = searchQuery.toLowerCase(); r = r.filter(s => s.title.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q) || s.module?.name?.toLowerCase().includes(q)); }
    if (filterFaculty !== 'all') r = r.filter(s => s.facultyId === parseInt(filterFaculty));
    if (filterYear !== 'all') r = r.filter(s => s.year === parseInt(filterYear));
    if (filterModule !== 'all') r = r.filter(s => s.moduleId === parseInt(filterModule));
    setFilteredSites(r);
  };

  const resetForm = () => { setFormData({ title: '', description: '', facultyId: '', year: '', moduleId: '', url: '' }); setFormModules([]); };

  const handleCreateSite = async () => {
    if (!formData.title.trim() || !formData.facultyId || !formData.year || !formData.moduleId || !formData.url.trim()) { toast.error('Fill required fields'); return; }
    setSaving(true);
    try {
      await learningSiteAPI.create({ title: formData.title.trim(), description: formData.description.trim()||undefined, facultyId: parseInt(formData.facultyId), year: parseInt(formData.year), moduleId: parseInt(formData.moduleId), url: formData.url.trim() });
      toast.success('Site added'); setDialogOpen(false); resetForm(); fetchInitialData();
    } catch { toast.error('Failed to add site'); } finally { setSaving(false); }
  };

  const handleDeleteSite = (id: number) => { setDeleteConfirmSiteId(id); setDeleteConfirmOpen(true); };
  const confirmDeleteSite = async () => {
    if (!deleteConfirmSiteId) return; setIsDeleting(true);
    try { await learningSiteAPI.delete(deleteConfirmSiteId); toast.success('Deleted Sucessfully'); fetchInitialData(); } catch { toast.error('Delete failed'); }
    finally { setIsDeleting(false); setDeleteConfirmOpen(false); setDeleteConfirmSiteId(null); }
  };

  const handleEdit = async (s: LearningSite) => {
    setEditingSite(s); let fId = s.facultyId?.toString()||'', yr = s.year?.toString()||'';
    if (!fId && !yr && s.moduleId) { try { const r = await moduleAPI.getAll(); const m = (r.data.data||[]).find((x:any)=>x.id===s.moduleId); if (m) { fId = m.facultyId?.toString()||''; yr = m.year?.toString()||''; } } catch {} }
    if (fId && yr) { try { const eR = await moduleAPI.getByFacultyAndYear(parseInt(fId), parseInt(yr)); setEditFormModules(eR.data.data||[]); } catch {} }
    setEditFormData({ title: s.title, description: s.description||'', facultyId: fId, year: yr, moduleId: s.moduleId?.toString()||'', url: s.url });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSite) return;
    if (!editFormData.title.trim() || !editFormData.facultyId || !editFormData.year || !editFormData.moduleId || !editFormData.url.trim()) { toast.error('Fill required fields'); return; }
    setEditSaving(true);
    try {
      await learningSiteAPI.delete(editingSite.id);
      await learningSiteAPI.create({ title: editFormData.title.trim(), description: editFormData.description.trim()||undefined, facultyId: parseInt(editFormData.facultyId), year: parseInt(editFormData.year), moduleId: parseInt(editFormData.moduleId), url: editFormData.url.trim() });
      toast.success('Updated Sucessfully'); setEditDialogOpen(false); setEditingSite(null); fetchInitialData();
    } catch { toast.error('Update failed'); } finally { setEditSaving(false); }
  };

  const years = Array.from(new Set([1, 2, 3, 4, ...sites.map(s => s.year).filter(Boolean)])).sort((a,b)=>a-b);

  const iS: React.CSSProperties = { width: '100%', padding: '9px 12px', fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.ink, background: P.parchment, border: `1px solid ${P.sand}`, outline: 'none', boxSizing: 'border-box' };
  const selectS: React.CSSProperties = { ...iS, ...adminSelectStyle };
  const iL: React.CSSProperties = { fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: P.inkSecondary, display: 'block', marginBottom: 6 };
  const softPanel: React.CSSProperties = { background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}, 0 10px 24px rgba(28,18,8,0.04)` };
  const softButton: React.CSSProperties = { padding: '9px 18px', background: P.parchmentDark, border: 'none', boxShadow: `inset 0 0 0 1px ${P.sandLight}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.inkSecondary, cursor: 'pointer' };
  const smallSoftButton: React.CSSProperties = { padding: '4px 8px', background: P.parchmentLight, border: 'none', boxShadow: `inset 0 0 0 1px ${P.sandLight}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' };

  const Modal = ({ open, title, topColor, onClose, children, actions, width = 500 }: any) => !open ? null : (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,8,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}, 0 18px 40px rgba(28,18,8,0.12)`, borderTop: `3px solid ${topColor}`, padding: '28px 32px', maxWidth: width, width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800, color: P.ink, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.inkMuted }}><X size={18} /></button>
        </div>
        {children}
        {actions && <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${P.sand}` }}>{actions}</div>}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${P.sand}` }}>
        <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.vermillion, marginBottom: 6 }}>External Links</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: P.ink, margin: 0 }}>Learning Sites Management</h1>
        <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkMuted, marginTop: 4 }}>Add and manage curated external websites for your students</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', ...softPanel, marginBottom: 24 }}>
        {[['Total Sites', sites.length, P.ink], ['Filtered Results', filteredSites.length, P.moss], ['Faculties', faculties.length, P.vermillion]].map(([l, v, c], i) => (
          <div key={l as string} style={{ background: P.parchmentLight, padding: '16px 20px', borderRight: i < 2 ? `1px solid ${P.sand}` : 'none' }}>
            <p style={{ fontFamily: "var(--font-numeric)", fontSize: 26, fontWeight: 800, color: c as string, margin: '0 0 2px' }}>{v}</p>
            <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l as string}</p>
          </div>
        ))}
      </div>

      <div style={{ ...softPanel, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 250px', position: 'relative' }}>
            <Search size={14} color={P.inkMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Search resources…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...iS, paddingLeft: 36 }} />
          </div>
          <Select value={filterFaculty} onValueChange={setFilterFaculty}>
            <SelectTrigger style={{ flex: '1 1 140px', background: P.parchmentLight, border: `1px solid ${P.sand}`, borderRadius: 0 }}>
              <SelectValue placeholder="All Faculties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Faculties</SelectItem>
              {faculties.map(f => <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger style={{ flex: '1 1 120px', background: P.parchmentLight, border: `1px solid ${P.sand}`, borderRadius: 0 }}>
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map(y => <SelectItem key={y} value={y.toString()}>Year {y}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterModule} onValueChange={setFilterModule}>
            <SelectTrigger style={{ flex: '1 1 140px', background: P.parchmentLight, border: `1px solid ${P.sand}`, borderRadius: 0 }}>
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {modules.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.code}</SelectItem>)}
            </SelectContent>
          </Select>
          <button onClick={() => setDialogOpen(true)}
            style={{ 
              ...softButton, 
              flex: '0 0 auto', 
              padding: '0 20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              background: P.vermillion,
              color: '#fff',
              boxShadow: 'none',
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#A93226')}
            onMouseLeave={e => (e.currentTarget.style.background = P.vermillion)}
          >
            <Plus size={14} /> Add Site
          </button>
        </div>
      </div>

      <div style={{ ...softPanel, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr>
            {['Title','Module','Year','URL','Actions'].map(l=><th key={l} style={{ padding:'12px 16px', background:P.parchmentDark, borderBottom:`1px solid ${P.sand}`, fontFamily:"'Barlow Semi Condensed', sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:P.inkSecondary, textAlign:'left' }}>{l}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', fontFamily: "'Lora', Georgia, serif", color: P.inkMuted }}>Loading Sites…</td></tr>
            : filteredSites.length === 0 ? <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', fontFamily: "'Lora', Georgia, serif", color: P.inkMuted }}>No sites found.</td></tr>
            : filteredSites.map(s => (
              <tr key={s.id} style={{ borderBottom: `1px solid ${P.sandLight}`, transition: 'background 0.12s' }} onMouseEnter={e => (e.currentTarget.style.background = '#FDFAF5')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, fontWeight: 700, color: P.ink, marginBottom: 2 }}>{s.title}</div>
                  {s.description && <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10.5, color: P.inkMuted, maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.description}</div>}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, color: P.inkMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{s.module?.code || 'N/A'}</div>
                  <span style={{ background: P.parchmentDark, border: `1px solid ${P.sand}`, padding: '2px 6px', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, color: P.inkSecondary, letterSpacing: '0.04em' }}>{s.faculty?.name || 'Faculty'}</span>
                </td>
                <td style={{ padding: '12px 16px', fontFamily: "'Lora', Georgia, serif", fontSize: 12, color: P.inkMuted }}>Year {s.year}</td>
                <td style={{ padding: '12px 16px', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.ink, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: P.moss, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}><ExternalLink size={10}/> Open Link</a>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => window.open(s.url,'_blank')} style={{ ...smallSoftButton, color: P.moss, display: 'flex', alignItems: 'center', gap: 4 }}><ExternalLink size={10} /> Visit</button>
                    <button onClick={() => handleEdit(s)} style={{ ...smallSoftButton, color: P.inkSecondary }}>Edit</button>
                    <button onClick={() => handleDeleteSite(s.id)} style={{ ...smallSoftButton, color: P.vermillion, background: P.vermillionBg, boxShadow: `inset 0 0 0 1px #E7C4BF` }}><Trash2 size={10} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminPageModal open={dialogOpen} title="Add Learning Site" topColor={P.moss} onClose={() => {setDialogOpen(false);resetForm();}} actions={<>
        <button onClick={()=>{setDialogOpen(false);resetForm();}} style={{ ...softButton, fontWeight: 600, color: P.inkMuted }}>Cancel</button>
        <button onClick={handleCreateSite} disabled={saving} 
          style={{ 
            ...softButton, 
            background: P.vermillion, 
            boxShadow: 'none', 
            color: '#fff', 
            cursor: saving?'not-allowed':'pointer',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#A93226')}
          onMouseLeave={e => (e.currentTarget.style.background = P.vermillion)}
        >
          {saving?'Adding...':'Add Site'}
        </button>
      </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={iL}>Title <span style={{ color: P.vermillion }}>*</span></label><input style={iS} value={formData.title} onChange={e=>setFormData({...formData,title:e.target.value})} placeholder="e.g., Coursera" /></div>
          <div><label style={iL}>Description</label><textarea style={{...iS, resize:'vertical'}} rows={2} value={formData.description} onChange={e=>setFormData({...formData,description:e.target.value})} placeholder="Optional description" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
            <div><label style={iL}>Faculty <span style={{ color: P.vermillion }}>*</span></label>
              <Select value={formData.facultyId} onValueChange={v => setFormData({ ...formData, facultyId: v, year: '', moduleId: '' })}>
                <SelectTrigger style={{ height: 40, background: P.parchmentLight, border: `1px solid ${P.sand}`, borderRadius: 0, fontFamily: "'Lora', Georgia, serif", fontSize: 13.5 }}>
                  <SelectValue placeholder="Select Faculty" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map(f => <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label style={iL}>Year <span style={{ color: P.vermillion }}>*</span></label>
              <Select value={formData.year} onValueChange={v => setFormData({ ...formData, year: v, moduleId: '' })} disabled={!formData.facultyId}>
                <SelectTrigger style={{ height: 40, background: P.parchmentLight, border: `1px solid ${P.sand}`, borderRadius: 0, fontFamily: "'Lora', Georgia, serif", fontSize: 13.5 }}>
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4].map(y => <SelectItem key={y} value={y.toString()}>Year {y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><label style={iL}>Module <span style={{ color: P.vermillion }}>*</span></label>
            <Select value={formData.moduleId} onValueChange={v => setFormData({ ...formData, moduleId: v })} disabled={!formData.facultyId || !formData.year}>
              <SelectTrigger style={{ height: 40, background: P.parchmentLight, border: `1px solid ${P.sand}`, borderRadius: 0, fontFamily: "'Lora', Georgia, serif", fontSize: 13.5 }}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {formModules.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.code} - {m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><label style={iL}>Site Link <span style={{ color: P.vermillion }}>*</span></label><input type="url" style={iS} value={formData.url} onChange={e=>setFormData({...formData,url:e.target.value})} placeholder="https://..." /></div>
        </div>
      </AdminPageModal>

      <AdminPageModal open={editDialogOpen} title="Edit Learning Site" topColor={P.ink} onClose={() => {setEditDialogOpen(false);setEditingSite(null);}} actions={<>
        <button onClick={()=>{setEditDialogOpen(false);setEditingSite(null);}} style={{ ...softButton, fontWeight: 600, color: P.inkMuted }}>Cancel</button>
        <button onClick={handleSaveEdit} disabled={editSaving} 
          style={{ 
            ...softButton, 
            background: P.vermillion, 
            boxShadow: 'none', 
            color: '#fff', 
            cursor: editSaving?'not-allowed':'pointer',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#A93226')}
          onMouseLeave={e => (e.currentTarget.style.background = P.vermillion)}
        >
          {editSaving?'Saving...':'Update Site'}
        </button>
      </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={iL}>Title <span style={{ color: P.vermillion }}>*</span></label><input style={iS} value={editFormData.title} onChange={e=>setEditFormData({...editFormData,title:e.target.value})} /></div>
          <div><label style={iL}>Description</label><textarea style={{...iS, resize:'vertical'}} rows={2} value={editFormData.description} onChange={e=>setEditFormData({...editFormData,description:e.target.value})} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
            <div><label style={iL}>Faculty <span style={{ color: P.vermillion }}>*</span></label>
              <Select value={editFormData.facultyId} onValueChange={v => { setEditFormData({ ...editFormData, facultyId: v, year: '', moduleId: '' }); setEditFormModules([]); }}>
                <SelectTrigger style={{ height: 40, background: P.parchmentLight, border: `1px solid ${P.sand}`, borderRadius: 0, fontFamily: "'Lora', Georgia, serif", fontSize: 13.5 }}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map(f => <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><label style={iL}>Year <span style={{ color: P.vermillion }}>*</span></label>
              <Select value={editFormData.year} onValueChange={v => setEditFormData({ ...editFormData, year: v, moduleId: '' })} disabled={!editFormData.facultyId}>
                <SelectTrigger style={{ height: 40, background: P.parchmentLight, border: `1px solid ${P.sand}`, borderRadius: 0, fontFamily: "'Lora', Georgia, serif", fontSize: 13.5 }}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4].map(y => <SelectItem key={y} value={y.toString()}>Year {y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><label style={iL}>Module <span style={{ color: P.vermillion }}>*</span></label>
            <Select value={editFormData.moduleId} onValueChange={v => setEditFormData({ ...editFormData, moduleId: v })} disabled={!editFormData.facultyId || !editFormData.year}>
              <SelectTrigger style={{ height: 40, background: P.parchmentLight, border: `1px solid ${P.sand}`, borderRadius: 0, fontFamily: "'Lora', Georgia, serif", fontSize: 13.5 }}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {editFormModules.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.code} - {m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><label style={iL}>Site Link <span style={{ color: P.vermillion }}>*</span></label><input type="url" style={iS} value={editFormData.url} onChange={e=>setEditFormData({...editFormData,url:e.target.value})} /></div>
        </div>
      </AdminPageModal>

      <AdminPageModal open={deleteConfirmOpen} title="Delete Learning Site" topColor={P.vermillion} onClose={() => setDeleteConfirmOpen(false)} actions={<><button onClick={()=>setDeleteConfirmOpen(false)} style={{ ...softButton, fontWeight: 600, color: P.inkMuted }}>Cancel</button><button onClick={confirmDeleteSite} disabled={isDeleting} style={{ ...softButton, background: P.vermillionBg, boxShadow: `inset 0 0 0 1px #E7C4BF`, color: P.vermillion, cursor: isDeleting?'not-allowed':'pointer' }}>{isDeleting ? 'Deleting…' : 'Delete Site'}</button></>}>
        <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.inkMuted, lineHeight: 1.6, margin: 0 }}>This will delete the learning site completely. This action cannot be undone.</p>
      </AdminPageModal>
    </div>
  );
}
