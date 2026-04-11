import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, BookOpen, Brain, CheckCircle2, Clock, Search, Trophy, Zap } from "lucide-react";
import { P } from "../../constants/theme";

const features = [
  { icon: Search, title: "Semantic Search", description: "Find concepts across notes, slides, and archived materials with context-aware retrieval.", tag: "Discovery" },
  { icon: Brain, title: "MCQ Generation", description: "Turn your learning materials into practice questions with structured difficulty and feedback.", tag: "Practice" },
  { icon: BarChart3, title: "Performance Analysis", description: "Track progress over time with focused insight into strengths, gaps, and study momentum.", tag: "Insight" },
  { icon: Zap, title: "Smart Summaries", description: "Condense long lectures into sharper takeaways for faster revision and clearer recall.", tag: "Recall" },
];

const deepDiveSections = [
  { title: "Semantic Search", subtitle: "Context-first retrieval", description: "Search beyond keywords and surface the exact lecture moments, concepts, and references that matter most.", bullets: ["Cross-material concept mapping", "Fast access to archived lectures", "Cleaner research workflows"], icon: Search },
  { title: "AI-Powered MCQ Generation", subtitle: "Practice built from your own material", description: "Create structured self-tests from course resources so revision feels relevant, focused, and exam-ready.", bullets: ["Question sets from uploaded material", "Difficulty-aware generation", "Immediate answer review"], icon: Brain },
  { title: "Performance Analysis", subtitle: "See learning clearly", description: "Understand how your study sessions are progressing through lightweight analytics designed for academic decision-making.", bullets: ["Progress snapshots", "Weak-topic visibility", "Actionable revision guidance"], icon: BarChart3 },
];

const reasons = [
  { icon: Trophy, title: "Designed for Academic Success", description: "Built around real student workflows, not generic productivity patterns." },
  { icon: Clock, title: "Save Study Time", description: "Spend less time searching for material and more time actively understanding it." },
  { icon: Zap, title: "AI, Carefully Applied", description: "Useful automation where it helps most, without losing clarity or control." },
];

const navItems = [
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
  { label: "Help", path: "/help" },
];

const footerColumns = [
  {
    title: "Features",
    links: [
      { label: "Semantic Search", path: "/" },
      { label: "MCQ Generation", path: "/" },
      { label: "Analytics", path: "/" },
      { label: "Summaries", path: "/" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", path: "/about" },
      { label: "Contact", path: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help", path: "/help" },
      { label: "Documentation", path: "/" },
      { label: "FAQ", path: "/" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", path: "/" },
      { label: "Terms of Service", path: "/" },
      { label: "Cookie Policy", path: "/" },
    ],
  },
];

export function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: P.parchment, color: P.ink, fontFamily: "'Lora', Georgia, serif" }}>
      <style>{`
        .landing-shell{overflow-x:hidden}
        .landing-nav-link{position:relative;color:${P.inkSecondary};text-decoration:none;transition:color 180ms ease}
        .landing-nav-link::after{content:"";position:absolute;left:0;bottom:-8px;width:100%;height:2px;background:${P.vermillion};transform:scaleX(0);transform-origin:left;transition:transform 180ms ease}
        .landing-nav-link:hover{color:${P.vermillion}}
        .landing-nav-link:hover::after{transform:scaleX(1)}
        .hero-grid,.feature-grid,.deep-grid,.reason-grid,.footer-grid{display:grid}
        .hero-grid{grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr);gap:48px;align-items:center}
        .feature-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}
        .deep-grid,.reason-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
        .footer-grid{grid-template-columns:minmax(220px,1.6fr) repeat(4,minmax(120px,1fr));gap:28px}
        .hero-word{position:relative;display:inline-block;color:${P.parchmentLight}}
        .hero-word::after{content:"";position:absolute;left:0;right:0;bottom:.12em;height:.18em;background:rgba(192,57,43,.6);z-index:-1;animation:heroHighlight 3.4s ease-in-out infinite}
        .feature-card,.deep-card,.reason-card,.hero-panel{transition:transform 220ms ease,box-shadow 220ms ease,border-color 220ms ease,background 220ms ease}
        .feature-card:hover,.deep-card:hover,.reason-card:hover,.hero-panel:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(28,18,8,.12)}
        .feature-card:hover{border-color:rgba(192,57,43,.35)}
        .cta-button{border-radius:16px;text-decoration:none;transition:transform 180ms ease,box-shadow 180ms ease,background 180ms ease,color 180ms ease}
        .cta-button:hover{transform:translateY(-2px)}
        .primary-cta:hover{box-shadow:0 16px 30px rgba(192,57,43,.22)}
        .secondary-cta:hover{box-shadow:0 14px 28px rgba(28,18,8,.16)}
        @keyframes heroHighlight{0%,100%{transform:scaleX(.9);opacity:.7}50%{transform:scaleX(1);opacity:1}}
        @media (max-width:1080px){.feature-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.deep-grid,.reason-grid{grid-template-columns:1fr}.footer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media (max-width:820px){.hero-grid{grid-template-columns:1fr}}
        @media (max-width:720px){.feature-grid,.footer-grid{grid-template-columns:1fr}}
      `}</style>
      <div className="landing-shell">
        <header style={{ position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(14px)", background: "rgba(250, 247, 240, 0.92)", borderBottom: `1px solid ${P.sand}` }}>
          <div style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: P.vermillionBg, boxShadow: `inset 0 0 0 1px ${P.sand}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BookOpen size={20} color={P.vermillion} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: P.inkMuted, marginBottom: 2 }}>Academic Platform</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 23, fontWeight: 900, color: P.ink, letterSpacing: "-0.03em" }}>LearnBox</div>
              </div>
            </Link>
            <nav style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
              {navItems.map((item) => (
                <Link key={item.label} to={item.path} className="landing-nav-link" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{item.label}</Link>
              ))}
            </nav>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link to="/login" className="cta-button secondary-cta" style={{ padding: "11px 20px", borderRadius: 16, background: P.parchmentDark, color: P.inkSecondary, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>Login</Link>
              <Link to="/register" className="cta-button primary-cta" style={{ padding: "11px 22px", borderRadius: 16, background: P.vermillion, color: P.parchmentLight, boxShadow: "0 12px 24px rgba(192, 57, 43, 0.18)", fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>Get Started</Link>
            </div>
          </div>
        </header>

        <section style={{ position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${P.inkMuted} 0%, ${P.inkSecondary} 100%)`, color: P.parchmentLight, borderBottom: `1px solid ${P.sand}` }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 18% 20%, rgba(245, 230, 228, 0.08), transparent 28%), radial-gradient(circle at 82% 18%, rgba(192, 57, 43, 0.14), transparent 22%), radial-gradient(circle at 70% 78%, rgba(245, 240, 232, 0.08), transparent 26%)", pointerEvents: "none" }} />
          <div style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: "84px 20px 96px", position: "relative" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 24, padding: "8px 14px", borderRadius: 999, background: "rgba(250, 247, 240, 0.08)", boxShadow: `inset 0 0 0 1px rgba(232, 223, 208, 0.22)` }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: P.vermillion, display: "inline-block" }} />
              <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.parchmentLight }}>Premium Academic Workspace</span>
            </div>
            <div className="hero-grid">
              <div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(3.2rem, 7vw, 5.8rem)", lineHeight: 0.98, letterSpacing: "-0.05em", margin: "0 0 24px", color: P.parchmentLight, maxWidth: 700 }}>
                  Empower Your
                  <br />
                  <span className="hero-word">Learning</span> Journey
                </h1>
                <p style={{ maxWidth: 600, margin: "0 0 34px", fontSize: 18, lineHeight: 1.8, color: "#E9DDCA" }}>LearnBox gives university students a focused digital study environment for resources, revision, practice, and performance tracking with a premium academic feel.</p>
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 34 }}>
                  <Link to="/register" className="cta-button primary-cta" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 28px", borderRadius: 18, background: P.vermillion, color: P.parchmentLight, boxShadow: "0 18px 34px rgba(192, 57, 43, 0.24)", fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase" }}>Register<ArrowRight size={16} /></Link>
                  <Link to="/login" className="cta-button secondary-cta" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "16px 28px", borderRadius: 18, background: "rgba(250, 247, 240, 0.12)", color: P.parchmentLight, boxShadow: `inset 0 0 0 1px rgba(232, 223, 208, 0.28)`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase" }}>Login</Link>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {["Resources", "MCQs", "Summaries", "Analytics"].map((item) => (
                    <div key={item} style={{ padding: "8px 14px", borderRadius: 999, background: "rgba(250, 247, 240, 0.08)", boxShadow: `inset 0 0 0 1px rgba(232, 223, 208, 0.2)`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#EADBC6" }}>{item}</div>
                  ))}
                </div>
              </div>
              <div className="hero-panel">
                <div style={{ position: "relative", borderRadius: 28, padding: 24, background: "rgba(250, 247, 240, 0.9)", color: P.ink, boxShadow: "0 24px 60px rgba(28, 18, 8, 0.22)", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(192, 57, 43, 0.08)" }} />
                  <div style={{ marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                    <div>
                      <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.vermillion, marginBottom: 6 }}>Study Command Center</div>
                      <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 28, lineHeight: 1.05, letterSpacing: "-0.03em", color: P.ink }}>Built for focused academic momentum</h2>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 14 }}>
                    {features.map((feature) => {
                      const Icon = feature.icon;
                      return (
                        <div key={feature.title} className="feature-card" style={{ borderRadius: 22, padding: "18px 18px 16px", background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}` }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                            <div style={{ width: 46, height: 46, borderRadius: 16, background: P.vermillionBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Icon size={18} color={P.vermillion} strokeWidth={2} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                                <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 18, lineHeight: 1.15, color: P.ink }}>{feature.title}</h3>
                                <span style={{ padding: "5px 10px", borderRadius: 999, background: P.parchmentDark, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: P.inkMuted }}>{feature.tag}</span>
                              </div>
                              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: P.inkMuted }}>{feature.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: "84px 0", background: `linear-gradient(180deg, ${P.parchmentLight} 0%, ${P.parchment} 100%)`, borderBottom: `1px solid ${P.sand}` }}>
          <div style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: "0 20px" }}>
            <div style={{ maxWidth: 660, marginBottom: 38 }}>
              <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.vermillion, marginBottom: 12 }}>Core Tools</div>
              <h2 style={{ margin: "0 0 14px", fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 3.2rem)", lineHeight: 1.02, letterSpacing: "-0.04em", color: P.ink }}>A cleaner system for searching, practicing, and mastering your coursework</h2>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.8, color: P.inkMuted }}>Every part of LearnBox is designed to reduce friction and bring important academic actions closer together.</p>
            </div>
            <div className="feature-grid">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="feature-card" style={{ borderRadius: 24, background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, padding: "26px 24px" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 18, background: P.vermillionBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                      <Icon size={20} color={P.vermillion} strokeWidth={2} />
                    </div>
                    <h3 style={{ margin: "0 0 10px", fontFamily: "'Playfair Display', serif", fontSize: 21, lineHeight: 1.15, color: P.ink }}>{feature.title}</h3>
                    <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: P.inkMuted }}>{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ padding: "84px 0", background: P.parchment, borderBottom: `1px solid ${P.sand}` }}>
          <div style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: "0 20px" }}>
            <div style={{ maxWidth: 700, marginBottom: 34 }}>
              <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.vermillion, marginBottom: 12 }}>Deep Dive</div>
              <h2 style={{ margin: "0 0 14px", fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.03, letterSpacing: "-0.04em", color: P.ink }}>Premium study tools that still feel simple and usable</h2>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.8, color: P.inkMuted }}>LearnBox balances elegant presentation with practical utility, so students can stay focused on academic outcomes.</p>
            </div>
            <div className="deep-grid">
              {deepDiveSections.map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.title} className="deep-card" style={{ borderRadius: 28, padding: "28px 26px", background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
                      <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.vermillion }}>{section.subtitle}</div>
                      <div style={{ width: 48, height: 48, borderRadius: 16, background: P.parchmentDark, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={18} color={P.inkSecondary} strokeWidth={2} />
                      </div>
                    </div>
                    <h3 style={{ margin: "0 0 12px", fontFamily: "'Playfair Display', serif", fontSize: 24, lineHeight: 1.08, letterSpacing: "-0.03em", color: P.ink }}>{section.title}</h3>
                    <p style={{ margin: "0 0 18px", fontSize: 14.5, lineHeight: 1.8, color: P.inkMuted }}>{section.description}</p>
                    <div style={{ display: "grid", gap: 10 }}>
                      {section.bullets.map((bullet) => (
                        <div key={bullet} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: `1px solid ${P.sandLight}` }}>
                          <CheckCircle2 size={15} color={P.moss} strokeWidth={2.2} />
                          <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: "0.02em", color: P.inkSecondary }}>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ padding: "84px 0", background: `linear-gradient(180deg, ${P.parchmentDark} 0%, ${P.parchment} 100%)`, borderBottom: `1px solid ${P.sand}` }}>
          <div style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: "0 20px" }}>
            <div style={{ maxWidth: 620, marginBottom: 34 }}>
              <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.vermillion, marginBottom: 12 }}>Why LearnBox</div>
              <h2 style={{ margin: "0 0 14px", fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.04, letterSpacing: "-0.04em", color: P.ink }}>A more refined academic platform without visual clutter</h2>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.8, color: P.inkMuted }}>LearnBox keeps the interface calm, structured, and focused so students can work with confidence instead of distraction.</p>
            </div>
            <div className="reason-grid">
              {reasons.map((reason) => {
                const Icon = reason.icon;
                return (
                  <div key={reason.title} className="reason-card" style={{ borderRadius: 24, background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, padding: "28px 24px" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 18, background: P.vermillionBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                      <Icon size={20} color={P.vermillion} strokeWidth={2} />
                    </div>
                    <h3 style={{ margin: "0 0 10px", fontFamily: "'Playfair Display', serif", fontSize: 22, lineHeight: 1.12, color: P.ink }}>{reason.title}</h3>
                    <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: P.inkMuted }}>{reason.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${P.inkSecondary} 0%, ${P.inkMuted} 100%)`, color: P.parchmentLight, padding: "86px 0" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 20%, rgba(192, 57, 43, 0.18), transparent 18%), radial-gradient(circle at 78% 80%, rgba(245, 240, 232, 0.08), transparent 22%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", width: "100%", maxWidth: 1280, margin: "0 auto", padding: "0 20px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: P.vermillion, marginBottom: 14 }}>Begin Today</div>
            <h2 style={{ margin: "0 0 16px", fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.2rem, 5vw, 4rem)", lineHeight: 1.02, letterSpacing: "-0.05em", color: P.parchmentLight }}>Ready to transform your learning workflow?</h2>
            <p style={{ maxWidth: 620, margin: "0 auto 34px", fontSize: 17, lineHeight: 1.8, color: "#E7D9C6" }}>Join LearnBox and bring resources, practice, summaries, and analytics into a single polished academic workspace.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
              <Link to="/register" className="cta-button primary-cta" style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 28px", borderRadius: 18, background: P.vermillion, color: P.parchmentLight, boxShadow: "0 18px 34px rgba(192, 57, 43, 0.24)", fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase" }}>Register Now<ArrowRight size={16} /></Link>
              <Link to="/login" className="cta-button secondary-cta" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "16px 28px", borderRadius: 18, background: "rgba(250, 247, 240, 0.1)", color: P.parchmentLight, boxShadow: `inset 0 0 0 1px rgba(232, 223, 208, 0.28)`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase" }}>Already a Member? Login</Link>
            </div>
          </div>
        </section>

        <footer style={{ background: "#120D06", color: "#C8B898", borderTop: `1px solid ${P.inkSecondary}`, padding: "58px 0 34px" }}>
          <div style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: "0 20px" }}>
            <div className="footer-grid" style={{ paddingBottom: 38, marginBottom: 28, borderBottom: `1px solid ${P.inkSecondary}` }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <BookOpen size={18} color={P.vermillion} strokeWidth={2} />
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: P.parchmentLight, letterSpacing: "-0.03em" }}>LearnBox</span>
                </div>
                <p style={{ margin: 0, maxWidth: 280, fontSize: 13.5, lineHeight: 1.75, color: "#9E8E76" }}>Your academic command center for resources, revision, structured practice, and learning progress.</p>
              </div>
              {footerColumns.map((column) => (
                <div key={column.title}>
                  <h4 style={{ margin: "0 0 16px", fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: P.parchmentLight }}>{column.title}</h4>
                  <div style={{ display: "grid", gap: 10 }}>
                    {column.links.map((link) => (
                      <Link key={link.label} to={link.path} style={{ textDecoration: "none", fontSize: 13, color: "#9E8E76" }}>{link.label}</Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <p style={{ margin: 0, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, letterSpacing: "0.05em", color: "#8E7D66" }}>© 2025 LearnBox. All rights reserved.</p>
              <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
                {["Twitter", "LinkedIn", "GitHub"].map((social) => (
                  <Link key={social} to="/" style={{ textDecoration: "none", fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#8E7D66" }}>{social}</Link>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
