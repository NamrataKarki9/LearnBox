import { useState, useEffect } from 'react';
import { moduleAPI, facultyAPI, Faculty, Module as APIModule } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Search, BookOpen, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

import { P, adminSelectStyle } from '../../constants/theme';

type Module = APIModule;
interface GroupedModules {
  [fid: string]: { faculty: Faculty; years: { [y: string]: Module[] } };
}

function AdminPageModal({ open, title, topColor, onClose, onConfirm, confirmLabel, children, softActionButtonStyle }: any) {
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,8,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}, 0 18px 40px rgba(28,18,8,0.12)`, borderTop: `3px solid ${topColor}`, padding: '28px 32px', maxWidth: 460, width: '90%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800, color: P.ink, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.inkMuted }}><X size={18} /></button>
        </div>
        {children}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${P.sand}` }}>
          <button onClick={onClose} style={{ ...softActionButtonStyle, fontWeight: 600, color: P.inkMuted }}>Cancel</button>
          {onConfirm && (
            <button 
              onClick={onConfirm} 
              style={{ ...softActionButtonStyle, background: P.vermillion, color: '#fff', boxShadow: 'none' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = '#A93226';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = P.vermillion;
              }}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminModulesPage() {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaculties, setExpandedFaculties] = useState<Set<number>>(new Set());
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmModuleId, setDeleteConfirmModuleId] = useState<number | null>(null);
  const [deletingModuleName, setDeletingModuleName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', year: 1, facultyId: 0 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!user?.collegeId) { toast.error('No college assigned'); setLoading(false); return; }
      const [mR, fR] = await Promise.all([moduleAPI.getAll({ collegeId: user.collegeId }), facultyAPI.getAll({ collegeId: user.collegeId })]);
      setModules(mR.data.data || []);
      setFaculties(fR.data.data || []);
      setExpandedFaculties(new Set((fR.data.data || []).map((f: Faculty) => f.id)));
    } catch { toast.error('Failed to load modules'); }
    finally { setLoading(false); }
  };

  const groupModules = (): GroupedModules => {
    const q = searchQuery.toLowerCase();
    const filtered = modules.filter(m => !q || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q));
    const grouped: GroupedModules = {};
    filtered.forEach(m => {
      const fid = m.facultyId.toString(), yr = m.year.toString();
      if (!grouped[fid]) { const f = faculties.find(f => f.id === m.facultyId); grouped[fid] = { faculty: f || { id: m.facultyId, name: 'Unknown', code: 'UNK', collegeId: 0 }, years: {} }; }
      if (!grouped[fid].years[yr]) grouped[fid].years[yr] = [];
      grouped[fid].years[yr].push(m);
    });
    return grouped;
  };

  const toggleFaculty = (id: number) => { const s = new Set(expandedFaculties); s.has(id) ? s.delete(id) : s.add(id); setExpandedFaculties(s); };
  const toggleYear = (fid: number, yr: string) => { const k = `${fid}-${yr}`, s = new Set(expandedYears); s.has(k) ? s.delete(k) : s.add(k); setExpandedYears(s); };
  const resetForm = () => setFormData({ name: '', code: '', description: '', year: 1, facultyId: 0 });

  const handleCreate = async () => {
    if (!formData.name || !formData.code || !formData.facultyId) { toast.error('Fill in all required fields'); return; }
    try { await moduleAPI.create(formData); toast.success('Module created'); setCreateDialogOpen(false); resetForm(); fetchData(); }
    catch (e: any) { toast.error(e?.response?.data?.error || 'Failed'); }
  };

  const handleEdit = (m: Module) => { setEditingModule(m); setFormData({ name: m.name, code: m.code, description: m.description || '', year: m.year, facultyId: m.facultyId }); setEditDialogOpen(true); };

  const handleUpdate = async () => {
    if (!editingModule) return;
    try { await moduleAPI.update(editingModule.id, formData); toast.success('Module updated'); setEditDialogOpen(false); setEditingModule(null); resetForm(); fetchData(); }
    catch (e: any) { toast.error(e?.response?.data?.error || 'Failed'); }
  };

  const handleDelete = (m: Module) => { setDeleteConfirmModuleId(m.id); setDeletingModuleName(m.name); setDeleteConfirmOpen(true); };

  const confirmDelete = async () => {
    if (!deleteConfirmModuleId) return;
    setIsDeleting(true);
    try { await moduleAPI.delete(deleteConfirmModuleId); toast.success('Module Deleted Successfully'); fetchData(); }
    catch (e: any) { toast.error(e?.response?.data?.error || 'Failed'); }
    finally { setIsDeleting(false); setDeleteConfirmOpen(false); setDeleteConfirmModuleId(null); setDeletingModuleName(''); }
  };

  const grouped = groupModules();
  const iS: React.CSSProperties = { width: '100%', padding: '9px 12px', fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.ink, background: P.parchment, border: `1px solid ${P.sand}`, outline: 'none', boxSizing: 'border-box' };
  const selectS: React.CSSProperties = { ...iS, ...adminSelectStyle };
  const iL: React.CSSProperties = { fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: P.inkSecondary, display: 'block', marginBottom: 6 };
  const softPanel: React.CSSProperties = { background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}, 0 10px 24px rgba(28,18,8,0.04)` };
  const softActionButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    background: P.parchmentDark,
    color: P.inkSecondary,
    border: 'none',
    boxShadow: `inset 0 0 0 1px ${P.sandLight}`,
    fontFamily: "'Barlow Semi Condensed', sans-serif",
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'background 0.15s, box-shadow 0.15s, color 0.15s'
  };
  const smallSoftButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '6px 12px',
    background: P.parchmentLight,
    border: 'none',
    boxShadow: `inset 0 0 0 1px ${P.sandLight}`,
    color: P.inkSecondary,
    fontFamily: "'Barlow Semi Condensed', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer'
  };

  const FormFields = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div><label style={iL}>Module Name <span style={{ color: P.vermillion }}>*</span></label><input style={iS} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Data Structures" /></div>
      <div><label style={iL}>Module Code <span style={{ color: P.vermillion }}>*</span></label><input style={iS} value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} placeholder="e.g., CS201" /></div>
      <div><label style={iL}>Description</label><textarea style={{ ...iS, resize: 'vertical' }} rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description" /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={iL}>Faculty <span style={{ color: P.vermillion }}>*</span></label>
          <Select value={formData.facultyId === 0 ? "" : formData.facultyId.toString()} onValueChange={v => setFormData({ ...formData, facultyId: parseInt(v) })}>
            <SelectTrigger style={{ height: 40, background: P.parchmentLight, border: `1px solid ${P.sand}`, borderRadius: 0, fontFamily: "'Lora', Georgia, serif", fontSize: 13.5 }}>
              <SelectValue placeholder="Select Faculty" />
            </SelectTrigger>
            <SelectContent>
              {faculties.map(f => <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><label style={iL}>Year <span style={{ color: P.vermillion }}>*</span></label>
          <Select value={formData.year === 0 ? "" : formData.year.toString()} onValueChange={v => setFormData({ ...formData, year: parseInt(v) })}>
            <SelectTrigger style={{ height: 40, background: P.parchmentLight, border: `1px solid ${P.sand}`, borderRadius: 0, fontFamily: "'Lora', Georgia, serif", fontSize: 13.5 }}>
              <SelectValue placeholder="Select Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Year 1</SelectItem>
              <SelectItem value="2">Year 2</SelectItem>
              <SelectItem value="3">Year 3</SelectItem>
              <SelectItem value="4">Year 4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const Modal = ({ open, title, topColor, onClose, onConfirm, confirmLabel, children }: any) => !open ? null : (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,8,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}, 0 18px 40px rgba(28,18,8,0.12)`, borderTop: `3px solid ${topColor}`, padding: '28px 32px', maxWidth: 460, width: '90%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 800, color: P.ink, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.inkMuted }}><X size={18} /></button>
        </div>
        {children}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20, paddingTop: 16, borderTop: `1px solid ${P.sand}` }}>
          <button onClick={onClose} style={{ ...softActionButtonStyle, fontWeight: 600, color: P.inkMuted }}>Cancel</button>
          {onConfirm && (
            <button 
              onClick={onConfirm} 
              style={{ ...softActionButtonStyle, background: P.vermillion, color: '#fff', boxShadow: 'none' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = '#A93226';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = P.vermillion;
              }}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${P.sand}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.vermillion, marginBottom: 6 }}>Curriculum</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: P.ink, margin: 0 }}>Module Management</h1>
          <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkMuted, marginTop: 4 }}>Create, edit and organise academic modules</p>
        </div>
        <button onClick={() => setCreateDialogOpen(true)}
          style={{ ...softActionButtonStyle, background: P.vermillion, color: '#fff', boxShadow: 'none' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = '#A93226';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = P.vermillion;
          }}>
          <Plus size={13} /> Create Module
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', ...softPanel, marginBottom: 20 }}>
        {[['Total Modules', modules.length, P.ink], ['Faculties', faculties.length, P.moss], ['Years Covered', new Set(modules.map(m => m.year)).size, P.vermillion]].map(([l, v, c], i) => (
          <div key={l as string} style={{ background: P.parchmentLight, padding: '16px 20px', borderRight: i < 2 ? `1px solid ${P.sand}` : 'none' }}>
            <p style={{ fontFamily: "var(--font-numeric)", fontSize: 26, fontWeight: 800, color: c as string, margin: '0 0 2px' }}>{v as number}</p>
            <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l as string}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20, position: 'relative' }}>
        <Search size={14} color={P.inkMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input type="text" placeholder="Search modules…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '10px 12px 10px 36px', fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.ink, background: P.parchmentLight, border: 'none', boxShadow: `inset 0 0 0 1px ${P.sandLight}`, outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ ...softPanel, padding: '56px', textAlign: 'center', fontFamily: "'Lora', Georgia, serif", color: P.inkMuted }}>Loading…</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{ ...softPanel, padding: '56px', textAlign: 'center' }}>
          <BookOpen size={40} color={P.sand} strokeWidth={1} style={{ display: 'block', margin: '0 auto 16px' }} />
          <p style={{ fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 14, marginBottom: 16 }}>No modules found</p>
          <button
            onClick={() => setCreateDialogOpen(true)}
            style={{ ...softActionButtonStyle, padding: '10px 24px', margin: '0 auto', background: P.vermillion, color: '#fff', boxShadow: 'none' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = '#A93226';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = P.vermillion;
            }}>
            Create First Module
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(grouped).map(([fid, { faculty, years }]) => (
            <div key={fid} style={softPanel}>
              <div onClick={() => toggleFaculty(faculty.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', cursor: 'pointer', borderBottom: expandedFaculties.has(faculty.id) ? `1px solid ${P.sand}` : 'none', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = P.parchmentDark}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {expandedFaculties.has(faculty.id) ? <ChevronDown size={16} color={P.inkMuted} /> : <ChevronRight size={16} color={P.inkMuted} />}
                  <div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: P.ink, margin: 0 }}>{faculty.name}</h3>
                    <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Code: {faculty.code}</p>
                  </div>
                </div>
                <span style={{ background: P.parchmentDark, color: P.inkSecondary, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 10px', border: `1px solid ${P.sand}` }}>{Object.values(years).flat().length} modules</span>
              </div>
              {expandedFaculties.has(faculty.id) && (
                <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(years).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([yr, mods]) => (
                    <div key={yr} style={{ boxShadow: `inset 0 0 0 1px ${P.sandLight}` }}>
                      <div onClick={() => toggleYear(faculty.id, yr)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: P.parchmentDark, cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {expandedYears.has(`${faculty.id}-${yr}`) ? <ChevronDown size={13} color={P.inkMuted} /> : <ChevronRight size={13} color={P.inkMuted} />}
                          <h4 style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, color: P.inkSecondary, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Year {yr}</h4>
                        </div>
                        <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, color: P.inkMuted }}>{(mods as Module[]).length} modules</span>
                      </div>
                      {expandedYears.has(`${faculty.id}-${yr}`) && (
                        <div>
                          {(mods as Module[]).map((m, mi) => (
                            <div key={m.id}
                              style={{ padding: '12px 16px', borderTop: `1px solid ${P.sandLight}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, transition: 'background 0.12s' }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FDFAF5'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                              <div style={{ flex: 1 }}>
                                <h5 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, fontWeight: 700, color: P.ink, margin: '0 0 3px' }}>{m.name}</h5>
                                <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Code: {m.code}</p>
                                {m.description && <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12.5, color: P.inkMuted, marginTop: 4 }}>{m.description}</p>}
                              </div>
                              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                <button onClick={() => handleEdit(m)}
                                  style={smallSoftButtonStyle}>
                                  <Edit size={11} /> Edit
                                </button>
                                <button onClick={() => handleDelete(m)}
                                  style={{ ...smallSoftButtonStyle, background: P.vermillionBg, boxShadow: 'inset 0 0 0 1px #E7C4BF', color: P.vermillion }}>
                                  <Trash2 size={11} /> Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AdminPageModal open={createDialogOpen} title="Create New Module" topColor={P.moss} onClose={() => { setCreateDialogOpen(false); resetForm(); }} onConfirm={handleCreate} confirmLabel="Create Module" softActionButtonStyle={softActionButtonStyle}>
        {FormFields()}
      </AdminPageModal>

      <AdminPageModal open={editDialogOpen} title="Edit Module" topColor={P.moss} onClose={() => { setEditDialogOpen(false); setEditingModule(null); resetForm(); }} onConfirm={handleUpdate} confirmLabel="Update Module" softActionButtonStyle={softActionButtonStyle}>
        {FormFields()}
      </AdminPageModal>

      <AdminPageModal open={deleteConfirmOpen} title="Delete Module" topColor={P.vermillion} onClose={() => setDeleteConfirmOpen(false)} onConfirm={confirmDelete} confirmLabel={isDeleting ? 'Deleting…' : 'Delete'} softActionButtonStyle={softActionButtonStyle}>
        <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.inkMuted, lineHeight: 1.6 }}>
          Are you sure you want to delete <strong style={{ color: P.ink }}>"{deletingModuleName}"</strong>? This cannot be undone.
        </p>
      </AdminPageModal>
    </div>
  );
}
