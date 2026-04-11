import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Brain, ChevronDown, Database, Layers, MessageCircle, Search, Shield, Target } from "lucide-react";

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

export function HelpPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [openCategory, setOpenCategory] = useState<number | null>(0);
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    {
      title: "Getting Started",
      icon: Database,
      articles: [
        { id: 1, title: "Creating your account", description: "The fastest way to begin using LearnBox.", answer: "Select Get Started, enter your email, complete your profile, and set up your password. Once you're in, you can begin uploading or exploring academic content immediately." },
        { id: 2, title: "What to do after registration", description: "The best first steps after your account is active.", answer: "Complete your academic details, connect to your course structure, upload initial study material, and test search or MCQ features to get comfortable with the workflow." },
      ],
    },
    {
      title: "Search & Discovery",
      icon: Search,
      articles: [
        { id: 4, title: "How semantic search works", description: "Search by meaning, not just exact words.", answer: "Semantic search helps you discover related concepts across lectures, notes, and resources even when you don’t remember the precise wording used in the source material." },
        { id: 5, title: "Using filters effectively", description: "Narrow results by module, year, or source.", answer: "Use filters to reduce noise and focus on the most relevant material. This is especially useful when revising across large sets of academic resources." },
      ],
    },
    {
      title: "Practice & AI Tools",
      icon: Brain,
      articles: [
        { id: 7, title: "Generating MCQs", description: "Turn documents into practice questions.", answer: "Upload study material or choose an existing source, then create an MCQ set with your preferred level of difficulty. LearnBox organizes the output for revision and self-testing." },
        { id: 9, title: "Understanding feedback", description: "Use explanations to learn faster.", answer: "Question feedback is designed to reinforce understanding. Review both correct and incorrect responses to identify patterns and strengthen weak areas." },
      ],
    },
    {
      title: "Analytics",
      icon: Target,
      articles: [
        { id: 10, title: "Reading performance insights", description: "Track strengths and weak areas.", answer: "Analytics show how you are progressing over time, where you are strongest, and which topics need more focused revision." },
      ],
    },
    {
      title: "Summaries & Notes",
      icon: Layers,
      articles: [
        { id: 13, title: "Generating summaries", description: "Turn long material into usable revisions.", answer: "Choose a document or lecture source, request a summary, and use the generated digest to review key ideas more efficiently." },
      ],
    },
    {
      title: "Privacy & Control",
      icon: Shield,
      articles: [
        { id: 17, title: "Managing your data", description: "Control how your information is handled.", answer: "You can review what you upload, manage access to your materials, and use available settings to control how data is stored and used." },
      ],
    },
  ];

  const filteredCategories = categories
    .map((category) => ({
      ...category,
      articles: category.articles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.answer.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((category) => category.articles.length > 0);

  return (
    <div style={{ minHeight: "100vh", background: P.parchment, color: P.ink, fontFamily: "'Lora', Georgia, serif" }}>
      <style>{`
        .help-nav-link{position:relative;color:${P.inkSecondary};text-decoration:none;transition:color 180ms ease}
        .help-nav-link::after{content:"";position:absolute;left:0;bottom:-8px;width:100%;height:2px;background:${P.vermillion};transform:scaleX(0);transform-origin:left;transition:transform 180ms ease}
        .help-nav-link:hover{color:${P.vermillion}}
        .help-nav-link:hover::after{transform:scaleX(1)}
        .help-shell{overflow-x:hidden}
        .help-footer-grid{display:grid;grid-template-columns:minmax(220px,1.6fr) repeat(4,minmax(120px,1fr));gap:28px}
        .help-card{transition:transform 220ms ease,box-shadow 220ms ease}
        .help-card:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(28,18,8,.12)}
        .cta-button{border-radius:16px;text-decoration:none;transition:transform 180ms ease,box-shadow 180ms ease,background 180ms ease,color 180ms ease}
        .cta-button:hover{transform:translateY(-2px)}
        .primary-cta:hover{box-shadow:0 16px 30px rgba(192,57,43,.22)}
        .secondary-cta:hover{box-shadow:0 14px 28px rgba(28,18,8,.16)}
        @media (max-width:980px){.help-footer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media (max-width:720px){.help-footer-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="help-shell">
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
                <Link key={item.label} to={item.path} className="help-nav-link" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
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
                <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.parchmentLight }}>Help & Guidance</span>
              </div>
              <h1 style={{ margin: "0 0 18px", fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.8rem, 6vw, 5rem)", lineHeight: 0.98, letterSpacing: "-0.05em", color: P.parchmentLight, maxWidth: 760 }}>Find answers fast without leaving the flow of study.</h1>
              <p style={{ margin: "0 0 28px", maxWidth: 680, fontSize: 18, lineHeight: 1.8, color: "#E7D9C6" }}>This help page now follows the same premium visual rhythm as the landing page, with cleaner spacing, clearer hierarchy, and a more useful search-first layout.</p>
              <div style={{ position: "relative", maxWidth: 620 }}>
                <Search size={18} color="#E7D9C6" style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)" }} />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search help topics, answers, and workflows..." style={{ width: "100%", padding: "16px 18px 16px 50px", borderRadius: 20, border: "none", boxShadow: `inset 0 0 0 1px rgba(232, 223, 208, 0.24)`, background: "rgba(250, 247, 240, 0.08)", color: P.parchmentLight, fontFamily: "'Lora', Georgia, serif", fontSize: 16, boxSizing: "border-box" }} />
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: "34px 0 84px", background: `linear-gradient(180deg, ${P.parchmentLight} 0%, ${P.parchment} 100%)` }}>
          <div style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: "0 20px", display: "grid", gap: 22 }}>
            {filteredCategories.length === 0 ? (
              <div className="help-card" style={{ borderRadius: 28, padding: "34px 28px", background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: P.inkMuted }}>No matching help topics were found. Try a broader keyword.</p>
              </div>
            ) : (
              filteredCategories.map((category, categoryIndex) => {
                const isOpen = openCategory === categoryIndex;
                return (
                  <div key={category.title} className="help-card" style={{ borderRadius: 28, background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, overflow: "hidden" }}>
                    <button onClick={() => setOpenCategory(isOpen ? null : categoryIndex)} style={{ width: "100%", padding: "24px 24px", border: "none", background: isOpen ? P.parchmentDark : P.parchmentLight, color: P.ink, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 16, background: P.vermillionBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <category.icon size={18} color={P.vermillion} strokeWidth={2} />
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: P.vermillion, marginBottom: 4 }}>Knowledge Base</div>
                          <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 26, lineHeight: 1.05, letterSpacing: "-0.03em", color: P.ink }}>{category.title}</h2>
                        </div>
                      </div>
                      <ChevronDown size={20} color={P.inkSecondary} style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 180ms ease" }} />
                    </button>

                    {isOpen && (
                      <div style={{ padding: "0 24px 24px", background: P.parchmentLight }}>
                        <div style={{ display: "grid", gap: 14 }}>
                          {category.articles.map((article) => {
                            const expanded = expandedArticle === article.id;
                            return (
                              <div key={article.id} style={{ borderRadius: 22, background: P.parchment, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, overflow: "hidden" }}>
                                <button onClick={() => setExpandedArticle(expanded ? null : article.id)} style={{ width: "100%", padding: "18px 18px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
                                  <h3 style={{ margin: "0 0 6px", fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: P.inkSecondary }}>{article.title}</h3>
                                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: P.inkMuted }}>{article.description}</p>
                                </button>
                                {expanded && (
                                  <div style={{ padding: "0 18px 18px", fontSize: 14.5, lineHeight: 1.8, color: P.inkSecondary }}>
                                    {article.answer}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section style={{ position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${P.inkSecondary} 0%, ${P.inkMuted} 100%)`, color: P.parchmentLight, padding: "84px 0" }}>
          <div style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: "0 20px", textAlign: "center" }}>
            <MessageCircle size={40} color={P.parchmentLight} style={{ marginBottom: 18 }} />
            <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.vermillion, marginBottom: 12 }}>Still Need Help?</div>
            <h2 style={{ margin: "0 0 14px", fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.1rem, 4vw, 3.5rem)", lineHeight: 1.03, letterSpacing: "-0.04em", color: P.parchmentLight }}>Reach out when the knowledge base isn’t enough.</h2>
            <p style={{ margin: "0 auto 28px", maxWidth: 620, fontSize: 17, lineHeight: 1.8, color: "#E7D9C6" }}>If you still need support, move straight to the contact page and send us your question directly.</p>
            <Link to="/contact" className="cta-button primary-cta" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "16px 28px", borderRadius: 18, background: P.vermillion, color: P.parchmentLight, boxShadow: "0 18px 34px rgba(192, 57, 43, 0.24)", fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase" }}>Open Contact Page</Link>
          </div>
        </section>

        <footer style={{ background: "#120D06", color: "#C8B898", borderTop: `1px solid ${P.inkSecondary}`, padding: "58px 0 34px" }}>
          <div style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: "0 20px" }}>
            <div className="help-footer-grid" style={{ paddingBottom: 38, marginBottom: 28, borderBottom: `1px solid ${P.inkSecondary}` }}>
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
