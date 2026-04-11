/**
 * Admin Resources Management Page — Paper & Ink Theme
 */

import { useState, useEffect } from 'react';
import { resourceAPI, facultyAPI, moduleAPI, Resource, Faculty } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import UploadResourceDialog from '../components/UploadResourceDialog';
import { toast } from 'sonner';
import { Eye, Download, Trash2, Upload, ChevronLeft, ChevronRight, Search, FileText, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

import { P, adminSelectStyle } from '../../constants/theme';

interface Module { id: number; name: string; code: string; year: number; facultyId: number; }

function AdminPageModal({ open, title, topColor, onClose, children, actions }: any) {
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,8,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}, 0 18px 40px rgba(28,18,8,0.12)`, borderTop: `3px solid ${topColor}`, padding: '28px 32px', maxWidth: 500, width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
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

export default function AdminResourcesPage() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isFetching, setIsFetching] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFaculty, setFilterFaculty] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterFileType, setFilterFileType] = useState<string>('all');
  const [sortField, setSortField] = useState<'title' | 'createdAt' | 'fileType'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingResource, setViewingResource] = useState<{ url: string; title: string } | null>(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmResourceId, setDeleteConfirmResourceId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editFormData, setEditFormData] = useState({ title: '', description: '', year: '', facultyId: '', moduleId: '' });
  const [editAvailableModules, setEditAvailableModules] = useState<Module[]>([]);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { applyFiltersAndSort(); }, [resources, searchQuery, filterFaculty, filterYear, filterModule, filterFileType, sortField, sortOrder]);
  useEffect(() => { if (editDialogOpen && editFormData.facultyId && editFormData.year) fetchEditModules(parseInt(editFormData.facultyId), parseInt(editFormData.year)); }, [editFormData.facultyId, editFormData.year, editDialogOpen]);

  const fetchData = async (retryCount = 0, maxRetries = 3) => {
    setIsFetching(true);
    if (resources.length === 0) setLoading(true);
    setError('');
    try {
      if (!user?.collegeId) { toast.error('No college assigned'); setIsFetching(false); setLoading(false); return; }
      const [rR, fR] = await Promise.all([resourceAPI.getAll(), facultyAPI.getAll({ collegeId: user.collegeId })]);
      setResources(rR.data.data || []); setFaculties(fR.data.data || []); setError('');
      try { const mR = await moduleAPI.getAll({ collegeId: user.collegeId }); setModules(mR.data.data || []); } catch { setModules([]); }
    } catch (error: any) {
      if (retryCount < maxRetries) { setTimeout(() => { setIsFetching(false); fetchData(retryCount + 1, maxRetries); }, Math.pow(2, retryCount) * 500); return; }
      setError('Failed to load resources. Please try again.'); toast.error('Failed to load resources');
    } finally { setIsFetching(false); setLoading(false); }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...resources];
    if (searchQuery) { const q = searchQuery.toLowerCase(); filtered = filtered.filter(r => r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q) || r.module?.name.toLowerCase().includes(q)); }
    if (filterFaculty !== 'all') filtered = filtered.filter(r => r.facultyId === parseInt(filterFaculty));
    if (filterYear !== 'all') filtered = filtered.filter(r => r.year === parseInt(filterYear));
    if (filterModule !== 'all') filtered = filtered.filter(r => r.moduleId === parseInt(filterModule));
    if (filterFileType !== 'all') filtered = filtered.filter(r => r.fileType.toLowerCase() === filterFileType.toLowerCase());

    filtered.sort((a, b) => {
      let aV: any, bV: any;
      if (sortField === 'title') { aV = a.title.toLowerCase(); bV = b.title.toLowerCase(); }
      else if (sortField === 'createdAt') { aV = new Date(a.createdAt).getTime(); bV = new Date(b.createdAt).getTime(); }
      else { aV = a.fileType.toLowerCase(); bV = b.fileType.toLowerCase(); }
      if (sortOrder === 'asc') return aV > bV ? 1 : -1;
      return aV < bV ? 1 : -1;
    });
    setFilteredResources(filtered); setCurrentPage(1);
  };

  const handleSort = (field: 'title' | 'createdAt' | 'fileType') => { if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortOrder('desc'); } };
  
  const handleView = (r: Resource) => { try { setViewingResource({ url: resourceAPI.getDownloadUrl(r.id), title: r.title }); setViewerOpen(true); } catch { toast.error('Failed to open viewer'); } };
  const handleDownload = (id: number) => { try { window.open(resourceAPI.getDownloadUrl(id), '_blank', 'noopener,noreferrer'); } catch { toast.error('Failed to download'); } };
  const handleDelete = (id: number) => { setDeleteConfirmResourceId(id); setDeleteConfirmOpen(true); };

  const confirmDelete = async () => {
    if (!deleteConfirmResourceId) return;
    setIsDeleting(true);
    try { 
      // 1. Locally update the UI IMMEDIATELY for instant feedback
      setResources(prev => prev.filter(r => r.id !== deleteConfirmResourceId));
      
      // 2. Clear selections and close modal right away
      setDeleteConfirmOpen(false);
      
      // 3. Perform the actual delete on the server
      await resourceAPI.delete(deleteConfirmResourceId); 
      
      // 4. Show success message
      toast.success('Deleted Successfully'); 
      setDeleteConfirmResourceId(null); 
      
      // 5. Re-fetch in the background to ensure consistency with DB
      fetchData();
    }
    catch { 
      toast.error('Delete failed'); 
      // If server fails, restore the data (fetchData will handle this)
      fetchData();
    } finally { 
      setIsDeleting(false); 
    }
  };

  const handleEdit = (r: Resource) => {
    setEditingResource(r);
    setEditFormData({ title: r.title, description: r.description || '', year: r.year?.toString()||'', facultyId: r.facultyId?.toString()||'', moduleId: r.moduleId?.toString()||'' });
    if (r.facultyId) setEditAvailableModules(modules.filter(m => m.facultyId === r.facultyId)); else setEditAvailableModules([]);
    setEditDialogOpen(true);
  };

  const handleEditFacultyChange = (id: string) => { setEditFormData({ ...editFormData, facultyId: id, year: '', moduleId: '' }); setEditAvailableModules([]); };
  const fetchEditModules = async (fId: number, yr: number) => { try { const r = await moduleAPI.getByFacultyAndYear(fId, yr); setEditAvailableModules(r.data.data || []); } catch { setEditAvailableModules([]); } };
  const handleSaveEdit = async () => {
    if (!editingResource) return;
    if (!editFormData.title.trim() || !editFormData.facultyId || !editFormData.moduleId || !editFormData.year) { toast.error('Fill required fields'); return; }
    setIsSaving(true);
    try {
      let fU = editingResource.fileUrl; let fT = editingResource.fileType;
      if (editFile) {
        const o = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
        if (!o.includes(editFile.type)) { toast.error('PDF, DOC, PPT only'); setIsSaving(false); return; }
        if (editFile.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); setIsSaving(false); return; }
        const d = new FormData(); d.append('file', editFile); d.append('title', editFormData.title); d.append('facultyId', editFormData.facultyId); d.append('year', editFormData.year); d.append('moduleId', editFormData.moduleId);
        if (editFormData.description) d.append('description', editFormData.description);
        try { 
          const uR = await resourceAPI.upload(d); 
          fU = uR.data.data.fileUrl; 
          fT = uR.data.data.fileType; 
          await resourceAPI.delete(editingResource.id); 
          
          // Close modal and clear state first for instant feedback
          setEditDialogOpen(false); 
          setEditingResource(null); 
          setEditFile(null); 
          
          // Re-fetch data in the background and show toast
          await fetchData();
          toast.success('Updated Successfully'); 
          return; 
        } catch { 
          toast.error('Upload failed'); 
          setIsSaving(false); 
          return; 
        }
      }
      await resourceAPI.update(editingResource.id, { 
        title: editFormData.title, 
        description: editFormData.description, 
        year: parseInt(editFormData.year), 
        facultyId: parseInt(editFormData.facultyId), 
        moduleId: parseInt(editFormData.moduleId), 
        fileUrl: fU, 
        fileType: fT 
      });

      // Close modal first for instant feedback
      setEditDialogOpen(false); 
      setEditingResource(null); 
      setEditFile(null);

      // Refresh data and then show toast
      await fetchData();
      toast.success('Updated Successfully'); 
    } catch { 
      toast.error('Failed to update'); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const handleUploadSuccess = async () => { 
    setUploadDialogOpen(false); 
    // Start fetching the new list immediately
    await fetchData();
    // Only show the toast once the list is actually refreshed
    toast.success('Uploaded Successfully!'); 
  };
  const getUploaderName = (r: Resource) => r.uploader ? (r.uploader.first_name || r.uploader.last_name ? `${r.uploader.first_name||''} ${r.uploader.last_name||''}`.trim() : r.uploader.username) : 'Unknown';
  
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResources = filteredResources.slice(startIndex, endIndex);
  
  const fileTypes = [...new Set(resources.map(r => r.fileType))];
  const allYears = [...new Set(resources.map(r => r.year).filter(Boolean))].sort();
  const years = Array.from(new Set([1, 2, 3, ...allYears])).sort();

  const Th = ({ l, f }: { l: string, f?: 'title' | 'createdAt' | 'fileType' }) => (
    <th onClick={() => f && handleSort(f)} style={{ padding: '12px 16px', background: P.parchmentDark, borderBottom: `1px solid ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.inkSecondary, textAlign: 'left', cursor: f ? 'pointer' : 'default', whiteSpace: 'nowrap' }}>
      {l} {f && sortField === f && (sortOrder === 'asc' ? '↑' : '↓')}
    </th>
  );

  const iS: React.CSSProperties = { width: '100%', padding: '9px 12px', fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.ink, background: P.parchment, border: `1px solid ${P.sand}`, outline: 'none', boxSizing: 'border-box' };
  const selectS: React.CSSProperties = { ...iS, ...adminSelectStyle };
  const compactSelectS: React.CSSProperties = { ...adminSelectStyle, padding: '2px 28px 2px 8px', backgroundColor: P.parchmentLight, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: P.ink, border: `1px solid ${P.sand}`, outline: 'none' };
  const iL: React.CSSProperties = { fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: P.inkSecondary, display: 'block', marginBottom: 6 };
  const softPanel: React.CSSProperties = { background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}, 0 10px 24px rgba(28,18,8,0.04)` };

  const Modal = ({ open, title, topColor, onClose, children, actions }: any) => !open ? null : (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,8,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={onClose}>
      <div style={{ background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}, 0 18px 40px rgba(28,18,8,0.12)`, borderTop: `3px solid ${topColor}`, padding: '28px 32px', maxWidth: 500, width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
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
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${P.sand}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.vermillion, marginBottom: 6 }}>Files & Media</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: P.ink, margin: 0 }}>Resource Management</h1>
          <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkMuted, marginTop: 4 }}>View, upload, and catalogue academic resources</p>
        </div>
      </div>

      {error && (
        <div style={{ background: P.vermillionBg, borderLeft: `4px solid ${P.vermillion}`, padding: '16px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 14, color: '#7A1C10', margin: '0 0 4px', fontWeight: 700 }}>{error}</p>
            <button onClick={() => fetchData()} style={{ background: 'none', border: 'none', color: P.vermillion, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>Retry</button>
          </div>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A1C10' }}><X size={16} /></button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', ...softPanel, marginBottom: 24 }}>
        {[['Total Resources', resources.length, P.ink], ['Filtered Results', filteredResources.length, P.moss], ['Showing', `${startIndex + 1}—${Math.min(endIndex, filteredResources.length)}`, P.vermillion]].map(([l, v, c], i) => (
          <div key={l as string} style={{ background: P.parchmentLight, padding: '16px 20px', borderRight: i < 2 ? `1px solid ${P.sand}` : 'none' }}>
            <p style={{ fontFamily: "var(--font-numeric)", fontSize: 26, fontWeight: 800, color: c as string, margin: '0 0 2px' }}>{v}</p>
            <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{l as string}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ ...softPanel, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
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

          <Select value={filterFileType} onValueChange={setFilterFileType}>
            <SelectTrigger style={{ flex: '1 1 140px', background: P.parchmentLight, border: `1px solid ${P.sand}`, borderRadius: 0 }}>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {fileTypes.map(t => <SelectItem key={t} value={t}>{t.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
          <button onClick={() => setUploadDialogOpen(true)}
            style={{ 
              flex: '0 0 auto', 
              padding: '0 20px', 
              background: P.vermillion, 
              color: '#fff', 
              border: 'none', 
              fontFamily: "'Barlow Semi Condensed', sans-serif", 
              fontWeight: 700, 
              fontSize: 12, 
              letterSpacing: '0.06em', 
              textTransform: 'uppercase', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#A93226')}
            onMouseLeave={e => (e.currentTarget.style.background = P.vermillion)}
          >
            <Upload size={14} /> Upload
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...softPanel, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead><tr><Th l="Title" f="title"/><Th l="Module"/><Th l="Type" f="fileType"/><Th l="Year"/><Th l="Date" f="createdAt"/><Th l="Uploader"/><Th l="Actions"/></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', fontFamily: "'Lora', Georgia, serif", color: P.inkMuted }}>Loading resources…</td></tr>
            : paginatedResources.length === 0 ? <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', fontFamily: "'Lora', Georgia, serif", color: P.inkMuted }}>No resources found.</td></tr>
            : paginatedResources.map(r => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${P.sandLight}`, transition: 'background 0.12s' }} onMouseEnter={e => (e.currentTarget.style.background = '#FDFAF5')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, fontWeight: 700, color: P.ink, marginBottom: 2 }}>{r.title}</div>
                  {r.description && <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10.5, color: P.inkMuted, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.description}</div>}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, color: P.inkMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{r.module?.code || 'N/A'}</td>
                <td style={{ padding: '12px 16px' }}><span style={{ background: P.parchmentDark, border: `1px solid ${P.sand}`, padding: '2px 6px', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, color: P.inkSecondary, letterSpacing: '0.06em' }}>{r.fileType.toUpperCase()}</span></td>
                <td style={{ padding: '12px 16px', fontFamily: "'Lora', Georgia, serif", fontSize: 12, color: P.inkMuted }}>{r.year ? `Year ${r.year}` : '—'}</td>
                <td style={{ padding: '12px 16px', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkSecondary, letterSpacing: '0.04em' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '12px 16px', fontFamily: "'Lora', Georgia, serif", fontSize: 12, color: P.ink }}>{getUploaderName(r)}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleView(r)} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${P.moss}`, color: P.moss, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={10} /> View</button>
                    <button onClick={() => handleDownload(r.id)} style={{ padding: '4px 8px', background: P.moss, border: 'none', color: '#fff', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Download size={10} /> Get</button>
                    <button onClick={() => handleEdit(r)} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${P.ink}`, color: P.ink, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDelete(r.id)} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${P.vermillion}`, color: P.vermillion, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' }}><Trash2 size={10} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination bar */}
        {filteredResources.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${P.sand}`, background: P.parchmentDark, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, color: P.inkMuted, textTransform: 'uppercase' }}>
              Show
              <Select value={itemsPerPage.toString()} onValueChange={v => { setItemsPerPage(parseInt(v)); setCurrentPage(1); }}>
                <SelectTrigger style={{ height: 24, width: 60, padding: '2px 8px', backgroundColor: P.parchmentLight, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, color: P.ink, border: `1px solid ${P.sand}`, outline: 'none', borderRadius: 0 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, color: P.inkSecondary, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Page {currentPage} of {totalPages}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1} style={{ padding: '4px 8px', background: currentPage===1?P.parchmentDark:P.parchmentLight, border: `1px solid ${P.sand}`, color: P.inkMuted, cursor: currentPage===1?'default':'pointer' }}><ChevronLeft size={14}/></button>
                <button onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages} style={{ padding: '4px 8px', background: currentPage===totalPages?P.parchmentDark:P.parchmentLight, border: `1px solid ${P.sand}`, color: P.inkMuted, cursor: currentPage===totalPages?'default':'pointer' }}><ChevronRight size={14}/></button>
              </div>
            </div>
          </div>
        )}
      </div>

      <UploadResourceDialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} onSuccess={handleUploadSuccess} />

      {/* Viewer modal (Student-style card view) */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0" style={{ border: `2px solid ${P.ink}` }}>
          <DialogHeader style={{ padding: '14px 24px', borderBottom: `1px solid ${P.sand}`, background: P.parchmentLight, flexShrink: 0 }}>
            <DialogTitle style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: P.ink }}>{viewingResource?.title}</DialogTitle>
          </DialogHeader>
          <div style={{ flex: 1, minHeight: 0, background: P.parchmentDark }}>
            {viewingResource && <iframe src={`${viewingResource.url}#zoom=page-width&view=FitH`} style={{ width: '100%', height: '100%', border: 'none' }} title={viewingResource.title} allow="fullscreen" />}
          </div>
        </DialogContent>
      </Dialog>

      <AdminPageModal open={deleteConfirmOpen} title="Delete Resource" topColor={P.vermillion} onClose={() => setDeleteConfirmOpen(false)}
        actions={<><button onClick={() => setDeleteConfirmOpen(false)} style={{ padding: '9px 18px', background: 'transparent', border: `1px solid ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.inkMuted, cursor: 'pointer' }}>Cancel</button><button onClick={confirmDelete} disabled={isDeleting} style={{ padding: '9px 18px', background: P.vermillion, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', cursor: isDeleting?'default':'pointer' }}>{isDeleting ? 'Deleting…' : 'Delete'}</button></>}>
        <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.inkMuted, lineHeight: 1.6, margin: 0 }}>Delete this resource completely? This action is permanent.</p>
      </AdminPageModal>

      <AdminPageModal open={editDialogOpen} title="Edit Resource" topColor={P.ink} onClose={() => { setEditDialogOpen(false); setEditingResource(null); setEditFile(null); }}
        actions={<>
          <button onClick={() => { setEditDialogOpen(false); setEditingResource(null); setEditFile(null); }} style={{ padding: '9px 18px', background: 'transparent', border: `1px solid ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.inkMuted, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSaveEdit} disabled={isSaving} 
            style={{ 
              padding: '9px 18px', 
              background: P.vermillion, 
              border: 'none', 
              fontFamily: "'Barlow Semi Condensed', sans-serif", 
              fontWeight: 700, 
              fontSize: 12, 
              letterSpacing: '0.06em', 
              textTransform: 'uppercase', 
              color: '#fff', 
              cursor: isSaving?'default':'pointer',
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#A93226')}
            onMouseLeave={e => (e.currentTarget.style.background = P.vermillion)}
          >
            {isSaving ? 'Saving…' : 'Update Resource'}
          </button>
        </>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={iL}>Title <span style={{ color: P.vermillion }}>*</span></label><input style={iS} value={editFormData.title} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} /></div>
          <div><label style={iL}>Description</label><textarea style={{ ...iS, resize: 'vertical' }} rows={3} value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
            <div><label style={iL}>Faculty <span style={{ color: P.vermillion }}>*</span></label>
              <select style={selectS} value={editFormData.facultyId} onChange={e => handleEditFacultyChange(e.target.value)}><option value="">Select</option>{faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
            </div>
            <div><label style={iL}>Year <span style={{ color: P.vermillion }}>*</span></label>
              <select style={selectS} value={editFormData.year} onChange={e => setEditFormData({ ...editFormData, year: e.target.value })}><option value="">Select</option>{years.map(y => <option key={y} value={y}>Year {y}</option>)}</select>
            </div>
          </div>
          <div><label style={iL}>Module <span style={{ color: P.vermillion }}>*</span></label>
            <select style={selectS} value={editFormData.moduleId} onChange={e => setEditFormData({ ...editFormData, moduleId: e.target.value })} disabled={!editFormData.facultyId || !editFormData.year}>
              <option value="">Select Module</option>
              {editAvailableModules.map(m => <option key={m.id} value={m.id}>{m.code} - {m.name}</option>)}
            </select>
          </div>
          <div>
            <label style={iL}>Replace File (Optional)</label>
            <div style={{ border: `1px dashed ${P.sand}`, padding: '16px', background: P.parchmentLight, textAlign: 'center' }}>
              <input type="file" id="edit-file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={e => setEditFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
              <label htmlFor="edit-file" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: P.ink, textDecoration: 'underline', cursor: 'pointer' }}>Choose alternative file</label>
              <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 11, color: P.inkMuted, marginTop: 4 }}>{editFile ? editFile.name : `Current Format: ${editingResource?.fileType.toUpperCase()}`}</p>
            </div>
          </div>
        </div>
      </AdminPageModal>
    </div>
  );
}
