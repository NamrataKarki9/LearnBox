import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizAPI } from '../../services/api';
import { X, BookOpen, Clock, Target, BarChart2, ChevronLeft } from 'lucide-react';

import { P } from '../../constants/theme';

interface QuizSession { id: number; score: number; totalQuestions: number; correctAnswers: number; timeSpent?: number; startedAt: string; submittedAt: string; set?: { title: string }; module?: { name: string; code: string }; }
interface HistoryStats { totalQuizzes: number; averageScore: string; totalQuestions: number; totalCorrect: number; }
interface QuizDetail { session: QuizSession; questions: Array<{ id: number; question: string; options: string[]; correctAnswer: string; explanation?: string; selectedAnswer: string; isCorrect: boolean; difficulty?: string; topic?: string }>; }

export default function MCQHistoryPage() {
  const navigate = useNavigate();
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const [history, setHistory] = useState<QuizSession[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const isMobile = viewportWidth < 768;
  const isTablet = viewportWidth < 1024;

  useEffect(() => {
    quizAPI.getHistory({ limit: 50 }).then(r => { setHistory(r.data.data); setStats(r.data.stats); }).catch(e => setError(e.response?.data?.error || 'Failed')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const fmtTime = (s?: number) => { if (!s) return '-'; const m = Math.floor(s / 60); return `${m}:${(s % 60).toString().padStart(2, '0')}`; };
  const scoreColor = (s: number) => s >= 80 ? P.moss : s >= 60 ? '#A07A30' : P.vermillion;

  const fetchDetails = async (id: number) => {
    setLoadingDetails(true);
    try {
      const r = await quizAPI.getSession(id);
      const d = r.data.data;
      setSelectedQuiz({ session: { id: d.id, score: d.score, totalQuestions: d.totalQuestions, correctAnswers: d.correctAnswers, timeSpent: d.timeSpent, startedAt: d.startedAt, submittedAt: d.submittedAt, set: d.set, module: d.module }, questions: d.attempts.map((a: any) => ({ id: a.mcq.id, question: a.mcq.question, options: a.mcq.options, correctAnswer: a.mcq.correctAnswer, explanation: a.mcq.explanation, selectedAnswer: a.selectedAnswer, isCorrect: a.isCorrect, difficulty: a.mcq.difficulty, topic: a.mcq.topic })) });
    } catch { setError('Failed to load quiz details'); }
    finally { setLoadingDetails(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: P.parchment, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-block', width: 36, height: 36, border: `2px solid ${P.ink}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 13, marginTop: 12 }}>Loading history…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: P.parchment, fontFamily: "'Lora', Georgia, serif", padding: isMobile ? '20px 16px' : isTablet ? '24px 24px' : '32px 40px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Back */}
        <button onClick={() => navigate('/student/mcq-practice')} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: P.inkMuted, cursor: 'pointer', marginBottom: 24, padding: 0 }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = P.vermillion)}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = P.inkMuted)}>
          <ChevronLeft size={13} /> Back to MCQ Practice
        </button>

        {/* Header */}
        <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${P.sand}` }}>
          <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.vermillion, marginBottom: 6 }}>Progress Tracking</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 24 : 28, fontWeight: 800, color: P.ink, margin: 0 }}>MCQ Practice History</h1>
        </div>

        {error && <div style={{ background: P.vermillionBg, borderLeft: `3px solid ${P.vermillion}`, padding: '10px 14px', marginBottom: 20, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: '#7A1C10' }}>{error}</div>}

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 0, border: `1px solid ${P.sand}`, marginBottom: 28 }}>
            {[
              { label: 'Total Quizzes', value: stats.totalQuizzes, color: P.ink },
              { label: 'Average Score', value: `${stats.averageScore}%`, color: P.moss },
              { label: 'Questions Done', value: stats.totalQuestions, color: P.inkSecondary },
              { label: 'Overall Accuracy', value: stats.totalQuestions > 0 ? `${((stats.totalCorrect / stats.totalQuestions) * 100).toFixed(1)}%` : '0%', color: P.vermillion },
            ].map(({ label, value, color }, i) => (
              <div key={label} style={{ background: P.parchmentLight, padding: '20px 22px', borderRight: !isTablet && i < 3 ? `1px solid ${P.sand}` : 'none', borderBottom: isMobile ? (i < 3 ? `1px solid ${P.sand}` : 'none') : isTablet ? (i < 2 ? `1px solid ${P.sand}` : 'none') : 'none' }}>
                <p style={{ fontFamily: "var(--font-numeric)", fontSize: 28, fontWeight: 800, color, margin: 0, lineHeight: 1 }}>{value}</p>
                <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, marginTop: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* History list */}
        <div style={{ border: `1px solid ${P.sand}`, background: P.parchmentLight }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${P.sand}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: P.inkMuted, color: P.parchment, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 10px' }}>Quiz History</span>
            <div style={{ flex: 1, height: 1, background: P.sand }} />
          </div>
          {history.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <BookOpen size={40} color={P.sand} strokeWidth={1} style={{ display: 'block', margin: '0 auto 16px' }} />
              <p style={{ fontFamily: "'Lora', Georgia, serif", color: P.inkMuted, fontSize: 14, marginBottom: 16 }}>No quiz history yet. Start practising!</p>
              <button onClick={() => navigate('/student/mcq-practice')} style={{ padding: '10px 24px', background: P.inkMuted, color: P.parchmentLight, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>Start Practising</button>
            </div>
          ) : history.map((s, i) => (
            <div key={s.id} style={{ padding: isMobile ? '16px' : '18px 20px', borderBottom: i < history.length - 1 ? `1px solid ${P.sandLight}` : 'none', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'flex-start', justifyContent: 'space-between', gap: 20, transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = P.parchmentDark}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: P.ink, margin: 0 }}>{s.set?.title || 'Custom Practice'}</h3>
                  {s.module && <span style={{ background: P.mossBg, color: P.moss, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px' }}>{s.module.code}</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, auto))', gap: isMobile ? '8px 14px' : '0 24px', marginBottom: 10 }}>
                  {[['Questions', s.totalQuestions], ['Correct', s.correctAnswers], ['Time', fmtTime(s.timeSpent)], ['Date', fmtDate(s.submittedAt)]].map(([k, v]) => (
                    <span key={k as string} style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}><strong style={{ color: P.inkSecondary }}>{k}:</strong> {v}</span>
                  ))}
                </div>
                <div style={{ height: 3, background: P.sandLight }}>
                  <div style={{ height: '100%', width: `${s.score}%`, background: scoreColor(s.score), transition: 'width 0.4s' }} />
                </div>
              </div>
              <div style={{ textAlign: isMobile ? 'left' : 'right', flexShrink: 0, width: isMobile ? '100%' : 'auto', display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: isMobile ? 'center' : 'flex-end', justifyContent: isMobile ? 'space-between' : 'flex-start', gap: isMobile ? 12 : 0 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 800, color: scoreColor(s.score), marginBottom: 6 }}>{s.score}%</div>
                <button onClick={() => fetchDetails(s.id)} style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: P.vermillion, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: P.vermillion }}>View Details</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button onClick={() => navigate('/student/mcq-practice')} style={{ padding: '12px 32px', background: P.inkMuted, color: P.parchmentLight, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>Practice More MCQs</button>
        </div>
      </div>

      {/* Detail modal */}
      {selectedQuiz && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,18,8,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: P.parchmentLight, border: `2px solid ${P.ink}`, maxWidth: 800, width: '100%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: isMobile ? '16px' : '20px 24px', borderBottom: `1px solid ${P.sand}`, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'flex-start', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 800, color: P.ink, margin: 0 }}>{selectedQuiz.session.set?.title || 'Custom Practice'}</h2>
                <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkMuted, marginTop: 4 }}>Completed on {fmtDate(selectedQuiz.session.submittedAt)}</p>
              </div>
              <button onClick={() => setSelectedQuiz(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: P.inkMuted, display: 'flex', padding: 0 }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = P.ink)}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = P.inkMuted)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', borderBottom: `1px solid ${P.sand}`, flexShrink: 0 }}>
              {[['Score', `${selectedQuiz.session.score}%`, scoreColor(selectedQuiz.session.score)], ['Questions', selectedQuiz.session.totalQuestions, P.ink], ['Correct', selectedQuiz.session.correctAnswers, P.moss], ['Time', fmtTime(selectedQuiz.session.timeSpent), P.inkSecondary]].map(([k, v, c], i) => (
                <div key={k as string} style={{ padding: '16px 20px', borderRight: !isMobile && i < 3 ? `1px solid ${P.sand}` : 'none', borderBottom: isMobile && i < 2 ? `1px solid ${P.sand}` : 'none', textAlign: 'center' }}>
                  <p style={{ fontFamily: "var(--font-numeric)", fontSize: 22, fontWeight: 800, color: c as string, margin: 0 }}>{v}</p>
                  <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, color: P.inkMuted, margin: '4px 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{k}</p>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {loadingDetails ? <p style={{ textAlign: 'center', color: P.inkMuted, fontFamily: "'Lora', Georgia, serif" }}>Loading…</p> : selectedQuiz.questions.map((q, idx) => {
                const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                return (
                  <div key={q.id} style={{ border: `1px solid ${q.isCorrect ? P.moss : P.vermillion}`, borderLeft: `3px solid ${q.isCorrect ? P.moss : P.vermillion}`, padding: '16px 18px', background: q.isCorrect ? '#F0F5EE' : P.vermillionBg }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 12, color: P.inkMuted }}>Q{idx+1}.</span>
                      {q.difficulty && <span style={{ background: P.parchmentDark, border: `1px solid ${P.sand}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: P.inkMuted, padding: '1px 7px' }}>{q.difficulty}</span>}
                      <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: q.isCorrect ? P.moss : P.vermillion, padding: '1px 7px', border: `1px solid ${q.isCorrect ? P.moss : P.vermillion}` }}>{q.isCorrect ? '✓ Correct' : '✗ Incorrect'}</span>
                    </div>
                    <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.ink, marginBottom: 12, lineHeight: 1.6 }}>{q.question}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {opts.map((opt: string, oi: number) => {
                        const isSel = opt === q.selectedAnswer, isCorr = opt === q.correctAnswer;
                        return (
                          <div key={oi} style={{ padding: '8px 12px', border: `2px solid ${isCorr ? P.moss : isSel ? P.vermillion : P.sand}`, background: isCorr ? '#EBF3E8' : isSel ? P.vermillionBg : P.parchmentLight }}>
                            <span style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: isCorr ? P.moss : isSel ? P.vermillion : P.ink }}>{isCorr ? '✓ ' : isSel && !isCorr ? '✗ ' : ''}{opt}{isSel && <span style={{ marginLeft: 8, fontSize: 11, color: P.inkMuted }}>(your answer)</span>}{isCorr && <span style={{ marginLeft: 8, fontSize: 11, color: P.moss }}>(correct)</span>}</span>
                          </div>
                        );
                      })}
                    </div>
                    {q.explanation && <div style={{ marginTop: 10, background: P.parchmentDark, borderLeft: `3px solid ${P.moss}`, padding: '8px 12px' }}><p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12.5, color: P.inkSecondary, fontStyle: 'italic', margin: 0 }}>💡 {q.explanation}</p></div>}
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '14px 24px', borderTop: `1px solid ${P.sand}`, flexShrink: 0 }}>
              <button onClick={() => setSelectedQuiz(null)} style={{ width: '100%', padding: '12px', background: P.inkMuted, color: P.parchmentLight, border: 'none', fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
