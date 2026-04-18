/**
 * MCQ Practice Selection Page — Paper & Ink Theme
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFilters } from '../../context/FilterContext';
import { mcqAPI, facultyAPI, MCQSet, Faculty } from '../../services/api';
import { toast } from 'sonner';
import { Brain, BookOpen, Upload, Zap, Clock, LayoutDashboard, FileText, HelpCircle, AlignLeft, Link2, Settings, LogOut, ChevronRight, Target } from 'lucide-react';
import { LogoutConfirmDialog } from '../components/LogoutConfirmDialog';
import { useLogoutConfirm } from '../../hooks/useLogoutConfirm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

import { P } from '../../constants/theme';

// 🔧 Multi-tier MCQ storage for robustness
const saveMCQsMultiTier = (data: any[]) => {
  try {
    // Tier 1: localStorage
    localStorage.setItem('generated_mcqs', JSON.stringify(data));
    // Tier 2: sessionStorage
    sessionStorage.setItem('generated_mcqs', JSON.stringify(data));
    // Tier 3: IndexedDB
    try {
      const request = indexedDB.open('learnbox_db', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('mcqs')) {
          db.createObjectStore('mcqs', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        const store = db.transaction('mcqs', 'readwrite').objectStore('mcqs');
        store.put({ id: 'generated_mcqs', data });
      };
    } catch (e) {
      console.warn('IndexedDB save failed:', e);
    }
  } catch (err) {
    console.error('Failed to save MCQs:', err);
  }
};

const NAV = [
  { label: 'Dashboard',      icon: LayoutDashboard, path: '/student/dashboard' },
  { label: 'Resources',      icon: FileText,         path: '/student/resources' },
  { label: 'MCQs Practice',  icon: HelpCircle,       path: null },
  { label: 'Summaries',      icon: AlignLeft,         path: '/student/summaries' },
  { label: 'Learning Sites', icon: Link2,             path: '/student/learning-sites' },
  { label: 'Settings',       icon: Settings,           path: '/student/settings' },
];

export default function MCQPracticeSelectionPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const filters = useFilters();
  const logoutConfirm = useLogoutConfirm();

  const [mcqSets, setMcqSets] = useState<MCQSet[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateOptions, setGenerateOptions] = useState({ count: 10, difficulty: 'MEDIUM', topic: '', saveToDatabase: true });

  useEffect(() => { fetchFaculties(); fetchMCQSets(); }, [filters.facultyId, filters.year, filters.moduleId]);

  const fetchFaculties = async () => {
    try { const r = await facultyAPI.getAll(); setFaculties(r.data.data || []); } catch {}
  };

  const fetchMCQSets = async () => {
    setLoading(true); setError('');
    try {
      const params: any = {};
      if (filters.facultyId !== 'all') params.facultyId = parseInt(filters.facultyId);
      if (filters.year !== 'all') params.year = parseInt(filters.year);
      if (filters.moduleId !== 'all') params.moduleId = parseInt(filters.moduleId);
      const r = await mcqAPI.getSets(params);
      setMcqSets(r.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch MCQ sets');
    } finally { setLoading(false); }
  };

  const handleStartQuiz = (setId: number) => navigate(`/student/practice?setId=${setId}`);
  const handleStartAdaptive = () => navigate(`/student/practice?adaptive=true`);

  const handlePDFSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Please upload valid file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return; }
    setPdfFile(file);
    toast.success(`Selected: ${file.name}`);
  };

  const handleGenerateFromPDF = async () => {
    if (!pdfFile) { toast.error('Please upload a PDF first'); return; }
    setIsGenerating(true);
    toast.info('Generating MCQs… this may take several minutes.', { duration: 10000 });
    try {
      const formData = new FormData();
      formData.append('pdfFile', pdfFile);
      formData.append('count', generateOptions.count.toString());
      formData.append('difficulty', generateOptions.difficulty);
      if (generateOptions.topic) formData.append('topic', generateOptions.topic);
      if (filters.moduleId !== 'all') formData.append('moduleId', filters.moduleId);
      formData.append('saveToDatabase', generateOptions.saveToDatabase.toString());
      formData.append('createSet', 'false');
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 600000);
      const response = await fetch('http://localhost:5000/api/mcqs/upload-and-generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` },
        body: formData, signal: controller.signal,
      });
      clearTimeout(tid);
      const data = await response.json();
      if (response.ok && data.success && data.data.mcqs.length > 0) {
        toast.success(`Generated ${data.data.mcqs.length} questions!`);
        saveMCQsMultiTier(data.data.mcqs);
        navigate('/student/practice?generated=true');
      } else { toast.error(data.error || 'Failed to generate MCQs'); }
    } catch { toast.error('Failed. Ensure Ollama is running.'); }
    finally { setIsGenerating(false); }
  };

  const diffBadge = (d: string) => {
    if (d === 'EASY') return { bg: P.mossBg, color: P.moss };
    if (d === 'HARD') return { bg: P.vermillionBg, color: P.vermillion };
    return { bg: '#FEF5E4', color: '#A07A30' };
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: P.parchment, fontFamily: "'Lora', Georgia, serif" }}>

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside style={{ width: 232, background: P.parchmentLight, borderRight: `1px solid ${P.sand}`, display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${P.sand}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={18} color={P.vermillion} strokeWidth={2} />
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 18, color: P.ink }}>LearnBox</span>
          </div>
          <div style={{ marginTop: 6, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.inkMuted }}>Student Portal</div>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV.map(({ label, icon: Icon, path }, i) => {
            const active = i === 2;
            return (
              <button key={label} onClick={() => path && navigate(path)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: 'none', borderLeft: active ? `3px solid ${P.vermillion}` : '3px solid transparent', background: active ? P.parchmentDark : 'transparent', color: active ? P.ink : P.inkMuted, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: active ? 700 : 500, fontSize: 13.5, textAlign: 'left', cursor: path ? 'pointer' : 'default', width: '100%', transition: 'all 0.12s' }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = P.parchmentDark; (e.currentTarget as HTMLElement).style.color = P.ink; } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = P.inkMuted; } }}
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
          <button onClick={() => logoutConfirm.openConfirm(logout)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: 'none', borderLeft: '3px solid transparent', background: 'transparent', color: P.inkMuted, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 500, fontSize: 13.5, width: '100%', textAlign: 'left', cursor: 'pointer', transition: 'all 0.12s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = P.vermillionBg; (e.currentTarget as HTMLElement).style.color = P.vermillion; (e.currentTarget as HTMLElement).style.borderLeftColor = P.vermillion; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = P.inkMuted; (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'; }}>
            <LogOut size={15} strokeWidth={1.8} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────── */}
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${P.sand}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.vermillion, marginBottom: 6 }}>Practice & Assessment</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 800, color: P.ink, margin: 0 }}>MCQ Practice</h1>
          </div>
          <button onClick={() => navigate('/student/history')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', border: `1px solid ${P.sand}`, background: 'transparent', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.inkSecondary, cursor: 'pointer', transition: 'all 0.12s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = P.ink; (e.currentTarget as HTMLElement).style.color = P.ink; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = P.sand; (e.currentTarget as HTMLElement).style.color = P.inkSecondary; }}>
            <Clock size={13} /> View History
          </button>
        </div>

        {/* Adaptive banner */}
        <div onClick={handleStartAdaptive}
          style={{ background: P.inkMuted, borderLeft: `4px solid ${P.vermillion}`, padding: '20px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'opacity 0.15s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.9'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Target size={22} color={P.vermillion} strokeWidth={2} />
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 800, color: P.parchmentLight, margin: 0 }}>Adaptive Practice</h3>
              <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkMuted, margin: '3px 0 0', lineHeight: 1.55 }}>AI targets your weak areas based on past performance</p>
            </div>
          </div>
          <button onClick={e => { e.stopPropagation(); handleStartAdaptive(); }}
            style={{ padding: '10px 20px', background: P.vermillion, color: '#fff', border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', flexShrink: 0 }}>
            Start
          </button>
        </div>

        {/* Two-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

          {/* ── College Practice Sets ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ background: P.inkMuted, color: P.parchment, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 10px' }}>Practice Sets</span>
              <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted }}>{mcqSets.length} available</span>
              <div style={{ flex: 1, height: 1, background: P.sand }} />
            </div>

            {error && (
              <div style={{ background: P.vermillionBg, borderLeft: `3px solid ${P.vermillion}`, padding: '10px 14px', marginBottom: 16, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: '#7A1C10' }}>{error}</div>
            )}

            <div style={{ border: `1px solid ${P.sand}` }}>
              {loading ? (
                <div style={{ background: P.parchmentLight, padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ display: 'inline-block', width: 28, height: 28, border: `2px solid ${P.ink}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : mcqSets.length === 0 ? (
                <div style={{ background: P.parchmentLight, padding: '48px 24px', textAlign: 'center' }}>
                  <Brain size={32} color={P.sand} strokeWidth={1} style={{ display: 'block', margin: '0 auto 12px' }} />
                  <p style={{ fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 13 }}>
                    {filters.facultyId !== 'all' || filters.year !== 'all' ? 'No sets for current filters.' : 'No practice sets uploaded yet.'}
                  </p>
                </div>
              ) : mcqSets.map((set, i) => {
                const db = (set as any).difficulty ? diffBadge((set as any).difficulty) : null;
                return (
                  <div key={set.id}
                    style={{ background: P.parchmentLight, padding: '18px 20px', borderBottom: i < mcqSets.length - 1 ? `1px solid ${P.sand}` : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = P.parchmentDark}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = P.parchmentLight}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, fontWeight: 700, color: P.ink, margin: 0, flex: 1, lineHeight: 1.3 }}>{set.title}</h4>
                      {db && <span style={{ background: db.bg, color: db.color, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', flexShrink: 0, marginLeft: 10 }}>{(set as any).difficulty}</span>}
                    </div>
                    {set.description && <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12.5, color: P.inkMuted, marginBottom: 10, lineHeight: 1.55 }}>{set.description}</p>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {set.questionCount || 0} questions{set.module ? ` · ${set.module.name}` : ''}
                      </span>
                      <button onClick={() => handleStartQuiz(set.id)} disabled={!set.questionCount}
                        style={{ padding: '7px 16px', background: !set.questionCount ? P.sand : P.ink, color: P.parchmentLight, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: !set.questionCount ? 'not-allowed' : 'pointer', transition: 'background 0.12s' }}
                        onMouseEnter={e => { if (set.questionCount) (e.currentTarget as HTMLElement).style.background = P.vermillion; }}
                        onMouseLeave={e => { if (set.questionCount) (e.currentTarget as HTMLElement).style.background = P.ink; }}>
                        Start
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Generate from PDF ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ background: P.inkMuted, color: P.parchment, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 10px' }}>Generate from PDF</span>
              <span style={{ background: P.mossBg, color: P.moss, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px' }}>AI-Powered</span>
              <div style={{ flex: 1, height: 1, background: P.sand }} />
            </div>

            <div style={{ border: `1px solid ${P.sand}`, background: P.parchmentLight, padding: '24px' }}>
              {/* Upload zone */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.inkSecondary, display: 'block', marginBottom: 8 }}>Upload PDF Document</label>
                <label htmlFor="pdf-upload"
                  style={{ display: 'block', border: `1px dashed ${pdfFile ? P.moss : P.sand}`, padding: '24px', textAlign: 'center', cursor: isGenerating ? 'not-allowed' : 'pointer', background: pdfFile ? '#F0F5EE' : P.parchment, transition: 'all 0.15s' }}>
                  <input type="file" accept="application/pdf" onChange={handlePDFSelect} style={{ display: 'none' }} id="pdf-upload" disabled={isGenerating} />
                  <Upload size={24} color={pdfFile ? P.moss : P.inkMuted} strokeWidth={1.5} style={{ display: 'block', margin: '0 auto 8px' }} />
                  {pdfFile ? (
                    <div>
                      <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, fontWeight: 700, color: P.moss, margin: 0 }}>{pdfFile.name}</p>
                      <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, color: P.inkMuted, margin: '4px 0 0' }}>{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, fontWeight: 600, color: P.inkSecondary, margin: 0 }}>Click to upload PDF</p>
                      <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, color: P.inkMuted, margin: '4px 0 0' }}>Max 10MB · PDF only</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: P.inkSecondary, display: 'block', marginBottom: 6 }}>Questions</label>
                  <input type="number" min="5" max="50" value={generateOptions.count}
                    onChange={e => setGenerateOptions(p => ({ ...p, count: parseInt(e.target.value) || 10 }))}
                    disabled={isGenerating}
                    style={{ width: '100%', padding: '9px 12px', fontFamily: "'Lora', Georgia, serif", fontSize: 14, color: P.ink, background: P.parchment, border: `1px solid ${P.sand}`, outline: 'none', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: P.inkSecondary, display: 'block', marginBottom: 6 }}>Difficulty</label>
                  <Select value={generateOptions.difficulty} onValueChange={v => setGenerateOptions(p => ({ ...p, difficulty: v }))} disabled={isGenerating}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HARD">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: P.inkSecondary, display: 'block', marginBottom: 6 }}>Topic (Optional)</label>
                <input type="text" value={generateOptions.topic}
                  onChange={e => setGenerateOptions(p => ({ ...p, topic: e.target.value }))}
                  placeholder="e.g. Algorithms, Data Structures"
                  disabled={isGenerating}
                  style={{ width: '100%', padding: '9px 12px', fontFamily: "'Lora', Georgia, serif", fontSize: 14, color: P.ink, background: P.parchment, border: `1px solid ${P.sand}`, outline: 'none', boxSizing: 'border-box' as const }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <input type="checkbox" id="saveDb" checked={generateOptions.saveToDatabase}
                  onChange={e => setGenerateOptions(p => ({ ...p, saveToDatabase: e.target.checked }))}
                  disabled={isGenerating}
                  style={{ width: 16, height: 16, accentColor: P.ink }} />
                <label htmlFor="saveDb" style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkMuted, cursor: 'pointer' }}>Save to database for tracking</label>
              </div>

              <button onClick={handleGenerateFromPDF} disabled={isGenerating}
                style={{ width: '100%', padding: '13px', background: isGenerating ? P.sand : P.ink, color: P.parchmentLight, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: isGenerating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s' }}
                onMouseEnter={e => { if (!isGenerating) (e.currentTarget as HTMLElement).style.background = P.vermillion; }}
                onMouseLeave={e => { if (!isGenerating) (e.currentTarget as HTMLElement).style.background = P.ink; }}>
                {isGenerating
                  ? <><div style={{ width: 14, height: 14, border: `2px solid ${P.parchmentLight}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} /> Generating…</>
                  : <><Zap size={14} /> Generate MCQs</>}
              </button>
            </div>
          </div>
        </div>
      </main>

      <LogoutConfirmDialog isOpen={logoutConfirm.isOpen} onConfirm={logoutConfirm.onConfirm} onCancel={logoutConfirm.onCancel} isLoading={logoutConfirm.isLoading} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
