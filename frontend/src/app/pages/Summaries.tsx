import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { summaryAPI } from '../../services/api';
import { toast } from 'sonner';
import { Upload, FileText, Loader2, Trash2, Clock, BookOpen, LayoutDashboard, HelpCircle, AlignLeft, Link2, Settings, LogOut, ChevronRight } from 'lucide-react';
import { useLogoutConfirm } from '../../hooks/useLogoutConfirm';
import { LogoutConfirmDialog } from '../components/LogoutConfirmDialog';

import { P } from '../../constants/theme';

interface Summary { id: number; originalFileName: string; quickSummary: string; keyConcepts?: { concepts: Array<{ term: string; definition: string }> }; createdAt: string; processingTime: number; }
interface ChatMessage { role: 'user' | 'assistant'; content: string; isUploading?: boolean; }

const WELCOME = "Hi! Upload a PDF document and I'll provide a comprehensive summary with key concepts.";

const cleanSummaryText = (text: string) =>
  text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^---+$/gm, '')
    .replace(/^===+$/gm, '')
    .replace(/^[•●▪■◦]\s*/gm, '- ')
    .replace(/^\s*\d+\.\s+/gm, '- ')
    .replace(/^\s*[A-Za-z]\)\s+/gm, '- ')
    .replace(/^\s*-\s*/gm, '- ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
  { label: 'Resources', icon: FileText, path: '/student/resources' },
  { label: 'MCQs Practice', icon: HelpCircle, path: '/student/mcq-practice' },
  { label: 'Summaries', icon: AlignLeft, path: null },
  { label: 'Learning Sites', icon: Link2, path: '/student/learning-sites' },
  { label: 'Settings', icon: Settings, path: '/student/settings' },
];

export default function Summaries() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const logoutConfirm = useLogoutConfirm();
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: WELCOME }]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<Summary[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const isMobile = viewportWidth < 768;

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { summaryAPI.getHistory().then(r => setHistory(r.data.data)).catch(() => {}); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fmt = (s: any) => {
    return `Document: "${s.originalFileName || s.fileName}"\n\n${cleanSummaryText(s.quickSummary || '')}\n\nProcessing time: ${(s.processingTime / 1000).toFixed(2)}s`;
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Please upload valid file.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Max 10MB'); return; }
    setMessages(p => [...p, { role: 'user', content: `Uploaded: ${file.name}` }, { role: 'assistant', content: 'Processing...', isUploading: true }]);
    setIsProcessing(true);
    try {
      const r = await summaryAPI.upload(file);
      setMessages(p => [...p.filter(m => !m.isUploading), { role: 'assistant', content: fmt(r.data.data) }]);
      toast.success('Done!');
      summaryAPI.getHistory().then(r2 => setHistory(r2.data.data)).catch(() => {});
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || 'Failed to process document';
      setMessages(p => [...p.filter(m => !m.isUploading), { role: 'assistant', content: `Sorry, couldn't process. ${message}` }]);
      toast.error(message);
    } finally { setIsProcessing(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const deleteHistoryItem = async (id: number) => {
    setDeletingId(id);
    setHistory((prev) => prev.filter((item) => item.id !== id));
    try {
      await summaryAPI.deleteSummary(id);
      toast.success('Deleted');
    } catch (error) {
      toast.error('Failed to delete summary');
      summaryAPI.getHistory().then(r => setHistory(r.data.data)).catch(() => {});
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', background: P.parchment, fontFamily: "'Lora', Georgia, serif" }}>
      <aside style={{ width: isMobile ? '100%' : 232, background: P.parchmentLight, borderRight: isMobile ? 'none' : `1px solid ${P.sand}`, borderBottom: isMobile ? `1px solid ${P.sand}` : 'none', display: 'flex', flexDirection: 'column', position: isMobile ? 'relative' : 'sticky', top: 0, height: isMobile ? 'auto' : '100vh', flexShrink: 0 }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: `1px solid ${P.sand}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><BookOpen size={18} color={P.vermillion} strokeWidth={2} /><span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 18, color: P.ink }}>LearnBox</span></div>
        </div>
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: 8, overflowX: isMobile ? 'auto' : 'visible' }}>
          {navItems.map(({ label, icon: Icon, path }, i) => {
            const active = i === 3;
            return (
              <button key={label} onClick={() => path && navigate(path)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: 'none', borderLeft: !isMobile && active ? `3px solid ${P.vermillion}` : '3px solid transparent', borderBottom: isMobile && active ? `2px solid ${P.vermillion}` : '2px solid transparent', background: active ? P.parchmentDark : 'transparent', color: active ? P.ink : P.inkMuted, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: active ? 700 : 500, fontSize: 13.5, textAlign: 'left', cursor: path ? 'pointer' : 'default', width: isMobile ? 'auto' : '100%', whiteSpace: 'nowrap', transition: 'all 0.12s' }}
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
            <div style={{ width: 30, height: 30, background: P.inkMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 800, fontSize: 13, color: P.parchment }}>{(user?.first_name || 'S').charAt(0).toUpperCase()}</span></div>
            <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 13, color: P.ink, margin: 0 }}>{user?.first_name || user?.username}</p>
          </div>
          <button onClick={() => logoutConfirm.openConfirm(logout)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: 'none', borderLeft: '3px solid transparent', background: 'transparent', color: P.inkMuted, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 500, fontSize: 13.5, width: '100%', textAlign: 'left', cursor: 'pointer', transition: 'all 0.12s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = P.vermillionBg; (e.currentTarget as HTMLElement).style.color = P.vermillion; (e.currentTarget as HTMLElement).style.borderLeftColor = P.vermillion; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = P.inkMuted; (e.currentTarget as HTMLElement).style.borderLeftColor = 'transparent'; }}>
            <LogOut size={15} strokeWidth={1.8} /> Logout
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{ background: P.parchmentLight, borderBottom: `1px solid ${P.sand}`, padding: isMobile ? '12px 16px' : '0 32px', minHeight: 60, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: P.ink, margin: 0 }}>Document Summaries</h1>
          <button onClick={() => setShowHistory(!showHistory)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', border: `1px solid ${P.sand}`, background: showHistory ? P.parchmentDark : 'transparent', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.ink, cursor: 'pointer' }}>
            <Clock size={13} /> History ({history.length})
          </button>
        </header>
        <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: isMobile ? '100%' : '72%', background: msg.role === 'user' ? P.ink : P.parchmentLight, color: msg.role === 'user' ? P.parchment : P.ink, border: `1px solid ${msg.role === 'user' ? 'transparent' : P.sand}`, padding: '12px 16px', fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, lineHeight: 1.65 }}>
                    {msg.isUploading ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /><span>{msg.content}</span></div> : <div style={{ whiteSpace: 'pre-line' }}>{msg.content}</div>}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ borderTop: `1px solid ${P.sand}`, background: P.parchmentLight, padding: isMobile ? '16px' : '16px 32px', flexShrink: 0, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="file" ref={fileInputRef} onChange={upload} accept=".pdf" style={{ display: 'none' }} disabled={isProcessing} />
              <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: P.inkMuted, color: P.parchmentLight, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.6 : 1, transition: 'background 0.15s' }}
                onMouseEnter={e => { if (!isProcessing) (e.currentTarget as HTMLElement).style.background = P.vermillion; }}
                onMouseLeave={e => { if (!isProcessing) (e.currentTarget as HTMLElement).style.background = P.ink; }}>
                <Upload size={14} /> Upload PDF
              </button>
              <button onClick={() => setMessages([{ role: 'assistant', content: WELCOME }])} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'transparent', color: P.inkMuted, border: `1px solid ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                New Chat
              </button>
            </div>
          </div>
          {showHistory && (
            <div style={{ width: isMobile ? '100%' : 280, borderLeft: isMobile ? 'none' : `1px solid ${P.sand}`, borderTop: isMobile ? `1px solid ${P.sand}` : 'none', background: P.parchmentLight, overflowY: 'auto', flexShrink: 0, maxHeight: isMobile ? 280 : 'none' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${P.sand}` }}>
                <h3 style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.ink, margin: 0 }}>Summary History</h3>
              </div>
              <div style={{ padding: '12px' }}>
                {history.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 12px' }}><FileText size={28} color={P.sand} strokeWidth={1} style={{ display: 'block', margin: '0 auto 10px' }} /><p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkMuted }}>No summaries yet</p></div>
                ) : history.map(s => (
                  <div key={s.id} style={{ background: P.parchment, border: `1px solid ${P.sand}`, padding: '12px 14px', marginBottom: 8, cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = P.parchmentDark}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = P.parchment}
                    onClick={() => { setMessages(p => [...p, { role: 'user', content: `Show: ${s.originalFileName}` }, { role: 'assistant', content: fmt({ fileName: s.originalFileName, quickSummary: s.quickSummary, keyConcepts: s.keyConcepts, processingTime: s.processingTime }) }]); setShowHistory(false); }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5, gap: 6 }}>
                      <h4 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, fontWeight: 700, color: P.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{s.originalFileName}</h4>
                      <button onClick={ev => { ev.stopPropagation(); if (!deletingId) void deleteHistoryItem(s.id); }} disabled={deletingId === s.id} style={{ background: 'none', border: 'none', cursor: deletingId === s.id ? 'default' : 'pointer', color: P.inkMuted, padding: 0, flexShrink: 0, opacity: deletingId === s.id ? 0.5 : 1 }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = P.vermillion)}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = P.inkMuted)}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 11.5, color: P.inkMuted, margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{s.quickSummary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <LogoutConfirmDialog isOpen={logoutConfirm.isOpen} onConfirm={logoutConfirm.onConfirm} onCancel={logoutConfirm.onCancel} isLoading={logoutConfirm.isLoading} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
