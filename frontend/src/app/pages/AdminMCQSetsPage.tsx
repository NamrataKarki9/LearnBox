/**
 * Admin MCQ Sets Management Page — Paper & Ink Theme
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mcqAPI, facultyAPI, moduleAPI, MCQSet, Faculty } from '../../services/api';
import { toast } from 'sonner';
import { Eye, Trash2, Upload, Plus, ChevronLeft, ChevronRight, Search, BookOpen, Edit, X, HelpCircle, CheckCircle, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';

import { P, adminSelectStyle } from '../../constants/theme';

interface Module { id: number; name: string; code: string; year: number; facultyId: number; }
interface MCQData { question: string; options: string[]; correctAnswer: string; explanation?: string; difficulty?: 'EASY'|'MEDIUM'|'HARD'; topic?: string; }

function AdminPageModal({ open, title, topColor, onClose, children, actions, width = 600 }: any) {
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

export default function AdminMCQSetsPage() {
  const { user } = useAuth();
  const [mcqSets, setMcqSets] = useState<MCQSet[]>([]);
  const [filteredSets, setFilteredSets] = useState<MCQSet[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'manual'|'document'>('document');
  const [documentFile, setDocumentFile] = useState<File|null>(null);
  const [parsingDocument, setParsingDocument] = useState(false);
  const [mcqsData, setMcqsData] = useState<MCQData[]>([]);
  const [setForm, setSetForm] = useState({ title: '', description: '', facultyId: '', year: '', moduleId: '' });
  const [manualMcq, setManualMcq] = useState<MCQData>({ question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', difficulty: 'MEDIUM', topic: '' });

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFaculty, setFilterFaculty] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Viewer / Delete / Edit
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingSet, setViewingSet] = useState<MCQSet|null>(null);
  const [viewingQuestions, setViewingQuestions] = useState<any[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmSetId, setDeleteConfirmSetId] = useState<number|null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<MCQSet|null>(null);
  const [editFormData, setEditFormData] = useState({ title: '', description: '', facultyId: '', year: '', moduleId: '' });
  const [editAvailableModules, setEditAvailableModules] = useState<Module[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editUploadMode, setEditUploadMode] = useState<'document'|'manual'>('document');
  const [editDocumentFile, setEditDocumentFile] = useState<File|null>(null);
  const [editMcqsData, setEditMcqsData] = useState<any[]>([]);
  const [editParsingDocument, setEditParsingDocument] = useState(false);
  const [editManualMcq, setEditManualMcq] = useState<MCQData>({ question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', difficulty: 'MEDIUM', topic: '' });

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { applyFilters(); }, [mcqSets, searchQuery, filterFaculty, filterYear, filterModule]);
  useEffect(() => { if (setForm.facultyId && setForm.year) fetchModulesForForm(parseInt(setForm.facultyId), parseInt(setForm.year)); else setModules([]); }, [setForm.facultyId, setForm.year]);
  useEffect(() => {
    if (modules.length === 0) { setAvailableYears([]); return; }
    if (filterFaculty === 'all') { const y = new Set<number>(); modules.forEach(m => y.add(m.year)); setAvailableYears(Array.from(y).sort()); }
    else { const fm = modules.filter(m => m.facultyId === parseInt(filterFaculty)); const y = new Set<number>(); fm.forEach(m => y.add(m.year)); setAvailableYears(Array.from(y).sort()); if (filterYear !== 'all' && y.size > 0 && !y.has(parseInt(filterYear))) { setFilterYear('all'); setFilterModule('all'); } }
  }, [filterFaculty, modules]);
  useEffect(() => { if (editDialogOpen && editFormData.facultyId && editFormData.year) fetchEditModules(parseInt(editFormData.facultyId), parseInt(editFormData.year)); }, [editFormData.facultyId, editFormData.year, editDialogOpen]);

  const fetchData = async () => {
    if (!user?.collegeId) { toast.error('No college assigned'); setLoading(false); return; }
    setLoading(true);
    try {
      const [sR, fR, mR] = await Promise.all([
        mcqAPI.getSets(), 
        facultyAPI.getAll({ collegeId: user.collegeId }), 
        moduleAPI.getAll({ collegeId: user.collegeId })
      ]);
      setMcqSets(sR.data.data || []); setFaculties(fR.data.data || []); setModules(mR.data.data || []);
    } catch { toast.error('Failed to load MCQ sets'); } finally { setLoading(false); }
  };

  const fetchModulesForForm = async (f: number, y: number) => { try { const r = await moduleAPI.getByFacultyAndYear(f, y); setModules(r.data.data || []); } catch { setModules([]); } };
  const fetchEditModules = async (f: number, y: number) => { try { const r = await moduleAPI.getByFacultyAndYear(f, y); setEditAvailableModules(r.data.data || []); } catch { setEditAvailableModules([]); } };

  const applyFilters = () => {
    let f = [...mcqSets];
    if (searchQuery) { const q = searchQuery.toLowerCase(); f = f.filter(s => s.title.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)); }
    if (filterFaculty !== 'all') {
      const fm = modules.filter(m => m.facultyId === parseInt(filterFaculty));
      if (filterYear !== 'all') {
        const ym = fm.filter(m => m.year === parseInt(filterYear));
        if (filterModule !== 'all') f = f.filter(s => s.moduleId === parseInt(filterModule));
        else { const mid = ym.map(m => m.id); f = f.filter(s => s.moduleId && mid.includes(s.moduleId)); }
      } else { const mid = fm.map(m => m.id); f = f.filter(s => s.moduleId && mid.includes(s.moduleId)); }
    } else if (filterYear !== 'all') {
      const ym = modules.filter(m => m.year === parseInt(filterYear));
      if (filterModule !== 'all') f = f.filter(s => s.moduleId === parseInt(filterModule));
      else { const mid = ym.map(m => m.id); f = f.filter(s => s.moduleId && mid.includes(s.moduleId)); }
    } else if (filterModule !== 'all') f = f.filter(s => s.moduleId === parseInt(filterModule));
    setFilteredSets(f); setCurrentPage(1);
  };

  const handleDocFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0]; if (!file) return;
    const v = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!v.includes(file.type) && !['.pdf','.doc','.docx'].some(ext => file.name.toLowerCase().endsWith(ext))) { toast.error('PDF or Word document only'); return; }
    if (file.size > 10*1024*1024) { toast.error('Max 10MB'); return; }
    
    if (isEdit) { setEditDocumentFile(file); setEditParsingDocument(true); } else { setDocumentFile(file); setParsingDocument(true); }
    toast.info('Parsing MCQs...');
    
    try {
      const fd = new FormData(); fd.append('file', file);
      const r = isEdit ? await fetch('/api/mcqs/parse-document', { method: 'POST', body: fd }).then(res => res.json()) : (await mcqAPI.parseFromDocument(fd)).data;
      const data = isEdit ? (r.mcqs||[]) : (r.data||[]);
      if ((isEdit ? true : r.success) && data.length > 0) {
        const mcqs = data.map((m:any) => ({ ...m, difficulty: (['EASY','MEDIUM','HARD'].includes(m.difficulty) ? m.difficulty : 'MEDIUM') as any }));
        if (isEdit) setEditMcqsData(mcqs); else setMcqsData(mcqs);
        toast.success(`Extracted ${mcqs.length} questions`);
      } else toast.warning('No MCQs found.');
    } catch { toast.error('Parse failed'); if (isEdit) setEditDocumentFile(null); else setDocumentFile(null); }
    finally { if (isEdit) setEditParsingDocument(false); else setParsingDocument(false); }
  };

  const addMcq = (isEdit = false) => {
    const mcq = isEdit ? editManualMcq : manualMcq;
    if (!mcq.question || !mcq.correctAnswer || mcq.options.some(o => !o)) { toast.error('Fill required fields'); return; }
    if (isEdit) { setEditMcqsData([...editMcqsData, { ...mcq }]); setEditManualMcq({ question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', difficulty: 'MEDIUM', topic: '' }); }
    else { setMcqsData([...mcqsData, { ...mcq }]); setManualMcq({ question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', difficulty: 'MEDIUM', topic: '' }); }
    toast.success('MCQ added');
  };

  const removeMcq = (i: number) => { setMcqsData(mcqsData.filter((_, idx) => idx !== i)); };
  const removeEditMcq = (i: number) => { setEditMcqsData(editMcqsData.filter((_, idx) => idx !== i)); };

  const resetUploadForm = () => { setSetForm({ title: '', description: '', facultyId: '', year: '', moduleId: '' }); setMcqsData([]); setDocumentFile(null); setParsingDocument(false); setManualMcq({ question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', difficulty: 'MEDIUM', topic: '' }); };

  const handleUploadSet = async () => {
    if (!setForm.title || !setForm.facultyId || !setForm.year || !setForm.moduleId) { toast.error('Fill all set details'); return; }
    if (mcqsData.length === 0) { toast.error('Add at least one MCQ'); return; }
    try { await mcqAPI.bulkUpload({ mcqs: mcqsData, moduleId: parseInt(setForm.moduleId), createSet: true, setTitle: setForm.title, setDescription: setForm.description }); toast.success(`Set created with ${mcqsData.length} Qs!`); setUploadDialogOpen(false); resetUploadForm(); fetchData(); } catch { toast.error('Upload failed'); }
  };

  const handleView = async (s: MCQSet) => { try { const r = await mcqAPI.getSetById(s.id); if (r.data.success) { setViewingSet(s); setViewingQuestions(r.data.data.questions || []); setViewerOpen(true); } } catch { toast.error('Failed to load questions'); } };
  const handleDelete = (id: number) => { setDeleteConfirmSetId(id); setDeleteConfirmOpen(true); };
  const confirmDelete = async () => { if (!deleteConfirmSetId) return; setIsDeleting(true); try { await mcqAPI.deleteSet(deleteConfirmSetId); toast.success(' MCQ Set Deleted Successfully'); fetchData(); } catch { toast.error('Delete failed'); } finally { setIsDeleting(false); setDeleteConfirmOpen(false); setDeleteConfirmSetId(null); } };

  const handleEdit = async (s: MCQSet) => {
    setEditingSet(s); let fId = '', yr = '';
    if (s.moduleId) {
      try { const r = await moduleAPI.getAll(); const m = (r.data.data||[]).find((x:any)=>x.id===s.moduleId); if (m) { fId = m.facultyId?.toString()||''; yr = m.year?.toString()||''; if (fId && yr) { const er = await moduleAPI.getByFacultyAndYear(parseInt(fId), parseInt(yr)); setEditAvailableModules(er.data.data||[]); } } } catch {}
    }
    setEditFormData({ title: s.title, description: s.description||'', facultyId: fId, year: yr, moduleId: s.moduleId?.toString()||'' });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSet) return;
    if (!editFormData.title.trim() || !editFormData.facultyId || !editFormData.year || !editFormData.moduleId) { toast.error('Fill required details'); return; }
    setIsSaving(true);
    try {
      try { await mcqAPI.updateSet(editingSet.id, { title: editFormData.title, description: editFormData.description, moduleId: parseInt(editFormData.moduleId) }); } catch {}
      let a = 0;
      if (editMcqsData.length > 0) {
        for (const m of editMcqsData) { try { await mcqAPI.addQuestion(editingSet.id, { question: m.question, options: m.options, correctAnswer: m.correctAnswer, explanation: m.explanation, difficulty: m.difficulty, topic: m.topic }); a++; } catch {} }
        if (a > 0) toast.success(`Updated! ${a} Qs added.`);
      } else toast.success('Updated successfully');
      setEditDialogOpen(false); setEditingSet(null); setEditMcqsData([]); setEditDocumentFile(null); setEditUploadMode('document'); fetchData();
    } catch { toast.error('Update failed'); } finally { setIsSaving(false); }
  };

  const totalPages = Math.ceil(filteredSets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSets = filteredSets.slice(startIndex, endIndex);

  const iS: React.CSSProperties = { width: '100%', padding: '9px 12px', fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.ink, background: P.parchment, border: `1px solid ${P.sand}`, outline: 'none', boxSizing: 'border-box' };
  const selectS: React.CSSProperties = { ...iS, ...adminSelectStyle };
  const compactSelectS: React.CSSProperties = { ...adminSelectStyle, padding: '2px 28px 2px 8px', backgroundColor: P.parchmentLight, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: P.ink, border: `1px solid ${P.sand}`, outline: 'none' };
  const iL: React.CSSProperties = { fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: P.inkSecondary, display: 'block', marginBottom: 6 };
  const softPanel: React.CSSProperties = { background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}, 0 10px 24px rgba(28,18,8,0.04)` };
  const softButton: React.CSSProperties = { padding: '9px 18px', background: P.parchmentDark, border: 'none', boxShadow: `inset 0 0 0 1px ${P.sandLight}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.inkSecondary, cursor: 'pointer' };
  const smallSoftButton: React.CSSProperties = { padding: '4px 8px', background: P.parchmentLight, border: 'none', boxShadow: `inset 0 0 0 1px ${P.sandLight}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 10, textTransform: 'uppercase', cursor: 'pointer' };

  const Modal = ({ open, title, topColor, onClose, children, actions, width = 600 }: any) => !open ? null : (
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

  const MCQFormBuilder = ({ isEdit=false }: { isEdit?: boolean }) => {
    const fdata = isEdit ? editFormData : setForm;
    const setF = isEdit ? setEditFormData : setSetForm;
    const fmods = isEdit ? editAvailableModules : modules;
    const mode = isEdit ? editUploadMode : uploadMode;
    const setMode = isEdit ? setEditUploadMode : setUploadMode;
    const file = isEdit ? editDocumentFile : documentFile;
    const isParsing = isEdit ? editParsingDocument : parsingDocument;
    const mData = isEdit ? editMcqsData : mcqsData;
    const handleFile = (e: any) => handleDocFileSelect(e, isEdit);
    const mMcq = isEdit ? editManualMcq : manualMcq;
    const setMMcq = isEdit ? setEditManualMcq : setManualMcq;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Step 1: Set Details */}
        <div>
          <h3 style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: P.ink, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12, borderBottom: `1px solid ${P.sand}`, paddingBottom: 6 }}>1. Set Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label style={iL}>Title <span style={{ color: P.vermillion }}>*</span></label><input style={iS} value={fdata.title} onChange={e=>setF({...fdata,title:e.target.value})} placeholder="e.g., Midterm Practice" /></div>
            <div><label style={iL}>Description</label><textarea style={{...iS, resize:'vertical'}} rows={2} value={fdata.description} onChange={e=>setF({...fdata,description:e.target.value})} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
              <div><label style={iL}>Faculty <span style={{ color: P.vermillion }}>*</span></label>
                <Select value={fdata.facultyId} onValueChange={v => { setF({ ...fdata, facultyId: v, year: '', moduleId: '' }); if(isEdit) setEditAvailableModules([]); }}>
                  <SelectTrigger style={{ height: 40, background: P.parchmentLight, border: `1px solid ${P.sand}`, borderRadius: 0, fontFamily: "'Lora', Georgia, serif", fontSize: 13.5 }}>
                    <SelectValue placeholder="Select Faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map(f => <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><label style={iL}>Year <span style={{ color: P.vermillion }}>*</span></label>
                <Select value={fdata.year} onValueChange={v => setF({ ...fdata, year: v, moduleId: '' })} disabled={!fdata.facultyId}>
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
              <Select value={fdata.moduleId} onValueChange={v => setF({ ...fdata, moduleId: v })} disabled={!fdata.facultyId || !fdata.year}>
                <SelectTrigger style={{ height: 40, background: P.parchmentLight, border: `1px solid ${P.sand}`, borderRadius: 0, fontFamily: "'Lora', Georgia, serif", fontSize: 13.5 }}>
                  <SelectValue placeholder="Select Module" />
                </SelectTrigger>
                <SelectContent>
                  {fmods.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.code} - {m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Step 2: Add Questions */}
        <div>
          <h3 style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: P.ink, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12, borderBottom: `1px solid ${P.sand}`, paddingBottom: 6 }}>2. Add Questions</h3>
          
          <div style={{ display: 'flex', gap: 0, marginBottom: 16, border: `1px solid ${P.sand}`, width: 'fit-content' }}>
            <button onClick={()=>setMode('document')} style={{ padding: '6px 16px', background: mode==='document'?P.parchmentDark:'transparent', color: P.inkSecondary, border: 'none', boxShadow: mode==='document'?`inset 0 0 0 1px ${P.sandLight}`:'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.1s' }}>Document Upload</button>
            <button onClick={()=>setMode('manual')} style={{ padding: '6px 16px', background: mode==='manual'?P.parchmentDark:'transparent', color: P.inkSecondary, border: 'none', borderLeft: `1px solid ${P.sand}`, boxShadow: mode==='manual'?`inset 0 0 0 1px ${P.sandLight}`:'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.1s' }}>Manual Entry</button>
          </div>

          {mode === 'document' ? (
            <div style={{ border: `1px dashed ${P.ink}`, background: isParsing ? P.parchmentDark : P.parchment, padding: '30px 20px', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={()=>document.getElementById(isEdit?'edit-docfile':'docfile')?.click()}>
              <input type="file" id={isEdit?'edit-docfile':'docfile'} accept=".pdf,.doc,.docx" onChange={handleFile} style={{ display: 'none' }} />
              <FileText size={32} color={P.inkMuted} style={{ marginBottom: 12 }} />
              <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 14, color: P.ink, margin: '0 0 4px', fontWeight: 700 }}>{isParsing?'Parsing document...':(file?file.name:'Click to upload PDF/Word')}</p>
              {!isParsing && <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted }}>The system will automatically extract questions & answers.</p>}
            </div>
          ) : (
            <div style={{ background: P.parchmentDark, border: `1px solid ${P.sand}`, padding: 16 }}>
              <div style={{ marginBottom: 12 }}><label style={iL}>Question</label><textarea style={{...iS, resize:'vertical'}} rows={2} value={mMcq.question} onChange={e=>setMMcq({...mMcq,question:e.target.value})} placeholder="What is..." /></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 10, marginBottom: 12 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: P.parchmentLight, border: `1px solid ${mMcq.correctAnswer===mMcq.options[i]&&mMcq.options[i]!==''?P.moss:P.sand}`, padding: '4px 8px' }}>
                    <input type="radio" name={isEdit?"ecorrect":"correct"} checked={mMcq.correctAnswer===mMcq.options[i]&&mMcq.options[i]!==''} onChange={()=>mMcq.options[i]&&setMMcq({...mMcq,correctAnswer:mMcq.options[i]})} />
                    <input style={{...iS, padding:'4px 8px', border:'none', background:'transparent', fontSize:12.5}} placeholder={`Option ${i+1}`} value={mMcq.options[i]} onChange={e=>{const o=[...mMcq.options]; o[i]=e.target.value; setMMcq({...mMcq,options:o}); if(mMcq.correctAnswer===mMcq.options[i])setMMcq({...mMcq,options:o,correctAnswer:e.target.value});}} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={iL}>Explanation (Optional)</label>
                <input style={{...iS, fontSize: 12}} placeholder="Why is this correct?" value={mMcq.explanation} onChange={e=>setMMcq({...mMcq,explanation:e.target.value})} />
              </div>
              <button onClick={()=>addMcq(isEdit)} style={{ ...softButton, padding: '8px 16px', fontSize: 11 }}>Add Question to Set</button>
            </div>
          )}

          {/* Preview extracted/added MCQs */}
          {mData.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: P.moss, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={14}/> {mData.length} Questions Ready</h4>
              <div style={{ border: `1px solid ${P.sand}`, maxHeight: 300, overflowY: 'auto', background: P.parchmentLight }}>
                {mData.map((m, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderBottom: i<mData.length-1?`1px solid ${P.sandLight}`:'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.ink, margin: '0 0 6px', fontWeight: 700 }}>{i+1}. {m.question}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 4 }}>
                        {(m.options as string[]).map((opt: string, oi: number) => (
                          <div key={oi} style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11.5, color: m.correctAnswer===opt?P.moss:P.inkMuted, fontWeight: m.correctAnswer===opt?700:400 }}>• {opt}</div>
                        ))}
                      </div>
                    </div>
                    <button onClick={()=>isEdit?removeEditMcq(i):removeMcq(i)} style={{ color: P.vermillion, background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${P.sand}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.vermillion, marginBottom: 6 }}>Testing & Practice</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: P.ink, margin: 0 }}>MCQ Sets Management</h1>
          <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkMuted, marginTop: 4 }}>Curate multiple choice question banks for student practice</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', ...softPanel, marginBottom: 24 }}>
        {[['Total Sets', mcqSets.length, P.ink], ['Total Questions', mcqSets.reduce((s, x)=>s+(x.questionCount||0),0), P.moss], ['Filtered Results', filteredSets.length, P.vermillion]].map(([l, v, c], i) => (
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
            <input type="text" placeholder="Search Sets…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ ...iS, paddingLeft: 36 }} />
          </div>
          <Select value={filterFaculty} onValueChange={v => { setFilterFaculty(v); setFilterYear('all'); setFilterModule('all'); }}>
            <SelectTrigger style={{ flex: '1 1 140px', background: P.parchmentLight, border: `1px solid ${P.sand}`, borderRadius: 0 }}>
              <SelectValue placeholder="All Faculties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Faculties</SelectItem>
              {faculties.map(f => <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterYear} onValueChange={v => { setFilterYear(v); setFilterModule('all'); }} disabled={filterFaculty === 'all'}>
            <SelectTrigger style={{ flex: '1 1 120px', background: P.parchmentLight, border: `1px solid ${P.sand}`, borderRadius: 0 }}>
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map(y => <SelectItem key={y} value={y.toString()}>Year {y}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterModule} onValueChange={setFilterModule} disabled={filterFaculty === 'all' || filterYear === 'all'}>
            <SelectTrigger style={{ flex: '1 1 140px', background: P.parchmentLight, border: `1px solid ${P.sand}`, borderRadius: 0 }}>
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {modules.filter(m => (filterFaculty === 'all' || m.facultyId === parseInt(filterFaculty)) && (filterYear === 'all' || m.year === parseInt(filterYear))).map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.code}</SelectItem>)}
            </SelectContent>
          </Select>
          <button onClick={() => setUploadDialogOpen(true)}
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
            <Plus size={14} /> Create Set
          </button>
        </div>
      </div>

      <div style={{ ...softPanel, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr>
            {['Title','Module','Questions','Created','Creator','Actions'].map(l=><th key={l} style={{ padding:'12px 16px', background:P.parchmentDark, borderBottom:`1px solid ${P.sand}`, fontFamily:"'Barlow Semi Condensed', sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:P.inkSecondary, textAlign:'left' }}>{l}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', fontFamily: "'Lora', Georgia, serif", color: P.inkMuted }}>Loading Sets…</td></tr>
            : paginatedSets.length === 0 ? <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', fontFamily: "'Lora', Georgia, serif", color: P.inkMuted }}>No sets found.</td></tr>
            : paginatedSets.map(s => (
              <tr key={s.id} style={{ borderBottom: `1px solid ${P.sandLight}`, transition: 'background 0.12s' }} onMouseEnter={e => (e.currentTarget.style.background = '#FDFAF5')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, fontWeight: 700, color: P.ink, marginBottom: 2 }}>{s.title}</div>
                  {s.description && <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10.5, color: P.inkMuted, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.description}</div>}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, color: P.inkMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.module?.code || 'N/A'}</td>
                <td style={{ padding: '12px 16px', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: P.moss }}>{s.questionCount || 0} Qs</td>
                <td style={{ padding: '12px 16px', fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkSecondary, letterSpacing: '0.04em' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '12px 16px', fontFamily: "'Lora', Georgia, serif", fontSize: 12, color: P.ink }}>{s.creator?s.creator.username:'Auto'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleView(s)} style={{ ...smallSoftButton, color: P.inkSecondary, display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={10} /> View</button>
                    <button onClick={() => handleEdit(s)} style={{ ...smallSoftButton, color: P.moss }}>Edit</button>
                    <button onClick={() => handleDelete(s.id)} style={{ ...smallSoftButton, color: P.vermillion, background: P.vermillionBg, boxShadow: `inset 0 0 0 1px #E7C4BF` }}><Trash2 size={10} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredSets.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${P.sand}`, background: P.parchmentDark, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, color: P.inkMuted, textTransform: 'uppercase' }}>
              Show 
              <Select value={itemsPerPage.toString()} onValueChange={v => { setItemsPerPage(parseInt(v)); setCurrentPage(1); }}>
                <SelectTrigger style={{ height: 24, width: 60, padding: '2px 8px', backgroundColor: P.parchmentLight, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: P.ink, border: `1px solid ${P.sand}`, outline: 'none', borderRadius: 0 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, color: P.inkSecondary, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Page {currentPage} of {totalPages}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1} style={{ ...smallSoftButton, background: currentPage===1?P.parchmentDark:P.parchmentLight, color: P.inkMuted, cursor: currentPage===1?'default':'pointer' }}><ChevronLeft size={14}/></button>
                <button onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages} style={{ ...smallSoftButton, background: currentPage===totalPages?P.parchmentDark:P.parchmentLight, color: P.inkMuted, cursor: currentPage===totalPages?'default':'pointer' }}><ChevronRight size={14}/></button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AdminPageModal open={uploadDialogOpen} title="Create MCQ Set" topColor={P.moss} onClose={() => {setUploadDialogOpen(false);resetUploadForm();}} width={800} actions={<>
        <button onClick={()=>{setUploadDialogOpen(false);resetUploadForm();}} style={{ ...softButton, fontWeight: 600, color: P.inkMuted }}>Cancel</button>
        <button onClick={handleUploadSet} disabled={mcqsData.length===0} 
          style={{ 
            ...softButton, 
            background: P.vermillion, 
            boxShadow: 'none', 
            color: '#fff', 
            cursor: mcqsData.length===0?'not-allowed':'pointer', 
            opacity: mcqsData.length===0?0.5:1,
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#A93226')}
          onMouseLeave={e => (e.currentTarget.style.background = P.vermillion)}
        >
          Create Set ({mcqsData.length} Qs)
        </button>
      </>}>
        {MCQFormBuilder({})}
      </AdminPageModal>

      <AdminPageModal open={editDialogOpen} title="Edit MCQ Set & Add Questions" topColor={P.ink} onClose={() => {setEditDialogOpen(false);setEditingSet(null);setEditMcqsData([]);}} width={800} actions={<>
        <button onClick={()=>{setEditDialogOpen(false);setEditingSet(null);setEditMcqsData([]);}} style={{ ...softButton, fontWeight: 600, color: P.inkMuted }}>Cancel</button>
        <button onClick={handleSaveEdit} disabled={isSaving} 
          style={{ 
            ...softButton, 
            background: P.vermillion, 
            boxShadow: 'none', 
            color: '#fff', 
            cursor: isSaving?'not-allowed':'pointer', 
            opacity: isSaving?0.5:1,
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#A93226')}
          onMouseLeave={e => (e.currentTarget.style.background = P.vermillion)}
        >
          {isSaving?'Saving...':'Update Set'}
        </button>
      </>}>
        {MCQFormBuilder({ isEdit: true })}
      </AdminPageModal>

      <AdminPageModal open={deleteConfirmOpen} title="Delete MCQ Set" topColor={P.vermillion} onClose={() => setDeleteConfirmOpen(false)} actions={<><button onClick={()=>setDeleteConfirmOpen(false)} style={{ ...softButton, fontWeight: 600, color: P.inkMuted }}>Cancel</button><button onClick={confirmDelete} disabled={isDeleting} style={{ ...softButton, background: P.vermillionBg, boxShadow: `inset 0 0 0 1px #E7C4BF`, color: P.vermillion, cursor: isDeleting?'not-allowed':'pointer' }}>{isDeleting ? 'Deleting…' : 'Delete Set'}</button></>}>
        <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.inkMuted, lineHeight: 1.6, margin: 0 }}>This will delete the set and ALL its questions permanently. This action cannot be undone.</p>
      </AdminPageModal>

      {/* Viewer Modal (Student-style Card View) */}
      <AdminPageModal open={viewerOpen} title={viewingSet?.title} topColor={P.ink} onClose={() => {setViewerOpen(false); setViewingQuestions([]);}} width={800}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {viewingQuestions.length === 0 ? (
            <div style={{ background: P.parchmentLight, padding: 40, textAlign: 'center', fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, border: `1px solid ${P.sand}` }}>No questions found in this set.</div>
          ) : viewingQuestions.map((q, i) => (
            <div key={q.id || i} style={{ background: P.parchmentLight, border: `1px solid ${P.sand}`, padding: '24px 32px' }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <span style={{ padding: '2px 8px', background: P.parchmentDark, border: `1px solid ${P.sand}`, borderRadius: 4, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, color: P.inkSecondary }}>{q.difficulty || 'MEDIUM'}</span>
                {q.topic && <span style={{ padding: '2px 8px', background: P.parchmentDark, border: `1px solid ${P.sand}`, borderRadius: 4, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, color: P.inkSecondary }}>{q.topic}</span>}
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: P.ink, margin: '0 0 16px', lineHeight: 1.5 }}><span style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 700 }}>{i+1}</span><span style={{ fontFamily: "'Lora', Georgia, serif" }}>. {q.question}</span></h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12, marginBottom: q.explanation ? 16 : 0 }}>
                {typeof q.options === 'string' ? JSON.parse(q.options).map((opt: string, oi: number) => {
                  const optText = opt.trim();
                  const correctText = (q as any).correctAnswer ? (typeof (q as any).correctAnswer === 'number' ? JSON.parse(q.options)[oi] : (q as any).correctAnswer).trim() : '';
                  const isCorrect = optText === correctText;
                  
                  return (
                    <div key={oi} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px', border: `2px solid ${isCorrect?'#2d5016':P.sand}`, background: P.parchment, borderRadius: 8 }}>
                      <input type="checkbox" style={{ width: 18, height: 18, marginTop: 2, accentColor: P.moss, flexShrink: 0 }} readOnly />
                      <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, color: P.inkSecondary, fontWeight: 500 }}>{optText}</span>
                    </div>
                  );
                }) : Array.isArray(q.options) ? q.options.map((opt: any, oi: number) => {
                  const optText = (typeof opt === 'string' ? opt : opt.text).trim();
                  const correctText = (q as any).correctAnswer ? (typeof (q as any).correctAnswer === 'number' ? q.options[oi] : (q as any).correctAnswer).trim() : '';
                  const isCorrect = optText === correctText;
                  
                  return (
                    <div key={oi} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px', border: `2px solid ${isCorrect?'#2d5016':P.sand}`, background: P.parchment, borderRadius: 8 }}>
                      <input type="checkbox" style={{ width: 18, height: 18, marginTop: 2, accentColor: P.moss, flexShrink: 0 }} readOnly />
                      <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, color: P.inkSecondary, fontWeight: 500 }}>{optText}</span>
                    </div>
                  );
                }) : null}
              </div>
              {q.explanation && (
                <div style={{ padding: '12px 16px', background: P.parchmentDark, borderLeft: `3px solid ${P.ink}`, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkSecondary, lineHeight: 1.5, marginTop: 16 }}>
                  <strong style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 11, display: 'block', marginBottom: 4 }}>Explanation</strong>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </AdminPageModal>
    </div>
  );
}
