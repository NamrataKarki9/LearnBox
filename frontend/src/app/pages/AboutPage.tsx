import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Award, BookOpen, Heart, Target, Trophy, Users, Zap } from "lucide-react";

import { P } from "../../constants/theme";

const navItems = [
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
  { label: "Help", path: "/help" },
];

const footerColumns = [
  { title: "Features", links: ["Semantic Search", "MCQ Generation", "Analytics", "Summaries"] },
  { title: "Company", links: ["About", "Contact"] },
  { title: "Resources", links: ["Help Center", "Documentation", "FAQ"] },
  { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy"] },
];

const values = [
  { icon: Heart, title: "Student-Centric", description: "Everything we build is shaped around better learning outcomes and calmer study experiences." },
  { icon: Zap, title: "Innovation First", description: "We use modern tools thoughtfully to make academic work feel clearer, faster, and more useful." },
  { icon: Award, title: "Quality Learning", description: "We care about real academic progress, not just polished interfaces or feature volume." },
  { icon: Users, title: "Community", description: "LearnBox is built to support collaboration between students, educators, and institutions." },
];

const milestones = [
  { year: "2025", title: "Founded", description: "LearnBox began with a simple goal: make academic support more intelligent and accessible." },
  { year: "2025", title: "Beta Launch", description: "We launched an early version with core AI-assisted learning features and student feedback loops." },
  { year: "2026", title: "Expansion", description: "The platform matured with stronger workflows for resources, practice, summaries, and analytics." },
  { year: "2026", title: "Scale", description: "LearnBox continued growing through institutional interest and wider student adoption." },
];

const team = [
  { name: "Namrata Karki", role: "Founder & CEO", description: "Guides LearnBox with a long-term vision for modern, AI-supported education.", icon: "NK" },
  { name: "Aayusha Kandel", role: "Product & Design Lead", description: "Shapes the product experience so students can focus on clarity, not friction.", icon: "AK" },
  { name: "Ashika Kambang", role: "Technology Lead", description: "Builds the technical systems that power LearnBox’s intelligent academic workflows.", icon: "AK" },
  { name: "Subu", role: "Operations & Growth", description: "Expands partnerships and helps LearnBox reach more students and institutions.", icon: "SU" },
];

export function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: P.parchment, color: P.ink, fontFamily: "'Lora', Georgia, serif" }}>
      <style>{`
        .about-nav-link{position:relative;color:${P.inkSecondary};text-decoration:none;transition:color 180ms ease}
        .about-nav-link::after{content:"";position:absolute;left:0;bottom:-8px;width:100%;height:2px;background:${P.vermillion};transform:scaleX(0);transform-origin:left;transition:transform 180ms ease}
        .about-nav-link:hover{color:${P.vermillion}}
        .about-nav-link:hover::after{transform:scaleX(1)}
        .about-shell{overflow-x:hidden}
        .about-value-grid,.about-timeline-grid,.about-team-grid,.about-footer-grid{display:grid}
        .about-value-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}
        .about-timeline-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}
        .about-team-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}
        .about-footer-grid{grid-template-columns:minmax(220px,1.6fr) repeat(4,minmax(120px,1fr));gap:28px}
        .about-card{transition:transform 220ms ease,box-shadow 220ms ease}
        .about-card:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(28,18,8,.12)}
        .cta-button{border-radius:16px;text-decoration:none;transition:transform 180ms ease,box-shadow 180ms ease,background 180ms ease,color 180ms ease}
        .cta-button:hover{transform:translateY(-2px)}
        .primary-cta:hover{box-shadow:0 16px 30px rgba(192,57,43,.22)}
        .secondary-cta:hover{box-shadow:0 14px 28px rgba(28,18,8,.16)}
        @media (max-width:1180px){.about-value-grid,.about-timeline-grid,.about-team-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.about-footer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media (max-width:720px){.about-value-grid,.about-timeline-grid,.about-team-grid,.about-footer-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="about-shell">
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
                <Link key={item.label} to={item.path} className="about-nav-link" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link to="/login" className="cta-button secondary-cta" style={{ padding: "11px 20px", borderRadius: 16, background: P.parchmentDark, color: P.inkSecondary, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>Login</Link>
              <Link to="/register" className="cta-button primary-cta" style={{ padding: "11px 22px", borderRadius: 16, background: P.vermillion, color: P.parchmentLight, boxShadow: "0 12px 24px rgba(192, 57, 43, 0.18)", fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>Get Started</Link>
            </div>
          </div>
        </header>

        <section style={{ position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${P.inkMuted} 0%, ${P.inkSecondary} 100%)`, color: P.parchmentLight, borderBottom: `1px solid ${P.sand}` }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 18% 20%, rgba(245, 230, 228, 0.08), transparent 28%), radial-gradient(circle at 82% 18%, rgba(192, 57, 43, 0.14), transparent 22%)", pointerEvents: "none" }} />
          <div style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: "78px 20px 88px", position: "relative" }}>
            <div style={{ maxWidth: 820 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "8px 14px", borderRadius: 999, background: "rgba(250, 247, 240, 0.08)", boxShadow: `inset 0 0 0 1px rgba(232, 223, 208, 0.22)` }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: P.vermillion, display: "inline-block" }} />
                <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.parchmentLight }}>About LearnBox</span>
              </div>
              <h1 style={{ margin: "0 0 18px", fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.8rem, 6vw, 5rem)", lineHeight: 0.98, letterSpacing: "-0.05em", color: P.parchmentLight, maxWidth: 820 }}>We’re building a more thoughtful academic platform for modern learners.</h1>
              <p style={{ margin: 0, maxWidth: 700, fontSize: 18, lineHeight: 1.8, color: "#E7D9C6" }}>LearnBox exists to help students move from passive content consumption to clearer, more structured academic progress with the support of carefully applied AI.</p>
            </div>
          </div>
        </section>

        <section style={{ padding: "34px 0 84px", background: `linear-gradient(180deg, ${P.parchmentLight} 0%, ${P.parchment} 100%)` }}>
          <div style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: "0 20px", display: "grid", gap: 26 }}>
            <div className="about-card" style={{ borderRadius: 30, background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, padding: "32px 30px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(280px,.95fr)", gap: 28, alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.vermillion, marginBottom: 10 }}>Our Mission</div>
                  <h2 style={{ margin: "0 0 12px", fontFamily: "'Playfair Display', serif", fontSize: 34, lineHeight: 1.02, letterSpacing: "-0.04em", color: P.ink }}>Reimagining academic mastery with clarity, focus, and useful intelligence.</h2>
                  <p style={{ margin: "0 0 12px", fontSize: 15.5, lineHeight: 1.8, color: P.inkMuted }}>We believe every student deserves tools that simplify the complexity of study rather than adding more noise. LearnBox turns resources into something easier to search, practice, summarize, and improve from.</p>
                  <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.8, color: P.inkMuted }}>Our work is grounded in educational usefulness: sharper workflows, calmer interfaces, and academic systems that help students build confidence over time.</p>
                </div>
                <div style={{ borderRadius: 28, background: P.parchmentDark, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, minHeight: 280, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 70% 30%, rgba(192, 57, 43, 0.12), transparent 24%)" }} />
                  <Target size={96} color={P.vermillion} strokeWidth={1.4} />
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.vermillion, marginBottom: 12 }}>Core Values</div>
              <div className="about-value-grid">
                {values.map((value) => (
                  <div key={value.title} className="about-card" style={{ borderRadius: 24, background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, padding: "26px 22px" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 18, background: P.vermillionBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                      <value.icon size={20} color={P.vermillion} strokeWidth={2} />
                    </div>
                    <h3 style={{ margin: "0 0 10px", fontFamily: "'Playfair Display', serif", fontSize: 22, lineHeight: 1.12, color: P.ink }}>{value.title}</h3>
                    <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: P.inkMuted }}>{value.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.vermillion, marginBottom: 12 }}>Timeline</div>
              <div className="about-timeline-grid">
                {milestones.map((milestone) => (
                  <div key={milestone.title} className="about-card" style={{ borderRadius: 24, background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, padding: "24px 22px" }}>
                    <div style={{ display: "inline-flex", padding: "6px 10px", borderRadius: 999, background: P.vermillionBg, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: P.vermillion, marginBottom: 14 }}>{milestone.year}</div>
                    <h3 style={{ margin: "0 0 8px", fontFamily: "'Playfair Display', serif", fontSize: 22, lineHeight: 1.1, color: P.ink }}>{milestone.title}</h3>
                    <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: P.inkMuted }}>{milestone.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.vermillion, marginBottom: 12 }}>The Team</div>
              <div className="about-team-grid">
                {team.map((member) => (
                  <div key={member.name} className="about-card" style={{ borderRadius: 24, background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, padding: "26px 22px" }}>
                    <div style={{ width: 72, height: 72, borderRadius: 22, background: P.parchmentDark, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, letterSpacing: "-0.03em", color: P.ink }}>{member.icon}</div>
                    <h3 style={{ margin: "0 0 4px", fontFamily: "'Playfair Display', serif", fontSize: 22, lineHeight: 1.08, color: P.ink }}>{member.name}</h3>
                    <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: P.vermillion, marginBottom: 12 }}>{member.role}</div>
                    <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.75, color: P.inkMuted }}>{member.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${P.inkSecondary} 0%, ${P.inkMuted} 100%)`, color: P.parchmentLight, padding: "84px 0" }}>
          <div style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: "0 20px", textAlign: "center" }}>
            <Trophy size={40} color={P.parchmentLight} style={{ marginBottom: 18 }} />
            <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.vermillion, marginBottom: 12 }}>Join LearnBox</div>
            <h2 style={{ margin: "0 0 14px", fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.1rem, 4vw, 3.5rem)", lineHeight: 1.03, letterSpacing: "-0.04em", color: P.parchmentLight }}>Build a calmer, smarter academic workflow with us.</h2>
            <p style={{ margin: "0 auto 28px", maxWidth: 620, fontSize: 17, lineHeight: 1.8, color: "#E7D9C6" }}>LearnBox is for students who want more structure, more clarity, and better support in the way they study.</p>
            <Link to="/register" className="cta-button primary-cta" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "16px 28px", borderRadius: 18, background: P.vermillion, color: P.parchmentLight, boxShadow: "0 18px 34px rgba(192, 57, 43, 0.24)", fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase" }}>Get Started</Link>
          </div>
        </section>

        <footer style={{ background: "#120D06", color: "#C8B898", borderTop: `1px solid ${P.inkSecondary}`, padding: "58px 0 34px" }}>
          <div style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: "0 20px" }}>
            <div className="about-footer-grid" style={{ paddingBottom: 38, marginBottom: 28, borderBottom: `1px solid ${P.inkSecondary}` }}>
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
                      <Link key={link} to="/" style={{ textDecoration: "none", fontSize: 13, color: "#9E8E76" }}>{link}</Link>
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
