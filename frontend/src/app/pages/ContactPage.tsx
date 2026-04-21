import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Mail, MapPin, Phone, Send, Sparkles } from "lucide-react";

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

const contactInfo = [
  { icon: Mail, title: "Email Support", detail: "karkinamrata030@gmail.com", description: "Best for general questions and partnership inquiries." },
  { icon: Phone, title: "Direct Line", detail: "+977 9841001742", description: "Available during standard academic support hours." },
  { icon: MapPin, title: "Campus Office", detail: "Naxal, Kathmandu", description: "For scheduled visits and institutional coordination." },
];

const faqs = [
  { q: "How quickly can I expect a response?", a: "Most messages receive a response within 24 hours on business days." },
  { q: "Can institutions reach out for collaboration?", a: "Yes. Use the contact form and mention your institution or project scope." },
  { q: "Is technical help available here?", a: "Yes. We can help with access issues, navigation questions, and platform guidance." },
];

export function ContactPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormData({ name: "", email: "", subject: "", message: "" });
    alert("Your message has been received.");
  };

  return (
    <div style={{ minHeight: "100vh", background: P.parchment, color: P.ink, fontFamily: "'Lora', Georgia, serif" }}>
      <style>{`
        .contact-nav-link{position:relative;color:${P.inkSecondary};text-decoration:none;transition:color 180ms ease}
        .contact-nav-link::after{content:"";position:absolute;left:0;bottom:-8px;width:100%;height:2px;background:${P.vermillion};transform:scaleX(0);transform-origin:left;transition:transform 180ms ease}
        .contact-nav-link:hover{color:${P.vermillion}}
        .contact-nav-link:hover::after{transform:scaleX(1)}
        .contact-shell{overflow-x:hidden}
        .contact-hero-grid,.contact-grid,.contact-footer-grid{display:grid}
        .contact-hero-grid{grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);gap:32px;align-items:end}
        .contact-grid{grid-template-columns:minmax(0,1.15fr) minmax(320px,.85fr);gap:28px}
        .contact-footer-grid{grid-template-columns:minmax(220px,1.6fr) repeat(4,minmax(120px,1fr));gap:28px}
        .contact-card{transition:transform 220ms ease,box-shadow 220ms ease}
        .contact-card:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(28,18,8,.12)}
        .cta-button{border-radius:16px;text-decoration:none;transition:transform 180ms ease,box-shadow 180ms ease,background 180ms ease,color 180ms ease}
        .cta-button:hover{transform:translateY(-2px)}
        .primary-cta:hover{box-shadow:0 16px 30px rgba(192,57,43,.22)}
        .secondary-cta:hover{box-shadow:0 14px 28px rgba(28,18,8,.16)}
        @media (max-width:980px){.contact-hero-grid,.contact-grid{grid-template-columns:1fr}.contact-footer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media (max-width:720px){.contact-footer-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="contact-shell">
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
                <Link key={item.label} to={item.path} className="contact-nav-link" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
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
            <div className="contact-hero-grid">
              <div style={{ maxWidth: 760 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "8px 14px", borderRadius: 999, background: "rgba(250, 247, 240, 0.08)", boxShadow: `inset 0 0 0 1px rgba(232, 223, 208, 0.22)` }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: P.vermillion, display: "inline-block" }} />
                  <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.parchmentLight }}>Contact LearnBox</span>
                </div>
                <h1 style={{ margin: "0 0 18px", fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.8rem, 6vw, 5rem)", lineHeight: 0.98, letterSpacing: "-0.05em", color: P.parchmentLight, maxWidth: 760 }}>Let’s make support feel clear, calm, and personal.</h1>
                <p style={{ margin: 0, maxWidth: 650, fontSize: 18, lineHeight: 1.8, color: "#E7D9C6" }}>Reach out for platform guidance, academic collaboration, onboarding questions, or technical help.</p>
              </div>
              <div style={{ minHeight: 320, display: "grid", gap: 16 }}>
                <div style={{ borderRadius: 30, minHeight: 190, background: "linear-gradient(145deg, rgba(250,247,240,0.12), rgba(250,247,240,0.04))", boxShadow: "inset 0 0 0 1px rgba(232,223,208,0.16)", padding: "24px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", right: -24, bottom: -30, width: 150, height: 150, borderRadius: "50%", background: "rgba(192,57,43,0.16)" }} />
                  <Sparkles size={26} color={P.vermillion} />
                  <div style={{ marginTop: 40, fontFamily: "'Playfair Display', serif", fontSize: 28, lineHeight: 1.08, color: P.parchmentLight }}>One clean point of contact.</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 16 }}>
                  {[Mail, Phone, MapPin].map((Icon, index) => (
                    <div key={index} style={{ borderRadius: 22, background: "rgba(250,247,240,0.08)", boxShadow: "inset 0 0 0 1px rgba(232,223,208,0.16)", minHeight: 86, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={22} color={P.parchmentLight} strokeWidth={1.8} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: "34px 0 84px", background: `linear-gradient(180deg, ${P.parchmentLight} 0%, ${P.parchment} 100%)` }}>
          <div className="contact-grid" style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: "0 20px" }}>
            <div className="contact-card" style={{ borderRadius: 28, background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, padding: "30px 28px" }}>
              <div style={{ marginBottom: 22 }}>
                <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.vermillion, marginBottom: 10 }}>Message Desk</div>
                <h2 style={{ margin: "0 0 10px", fontFamily: "'Playfair Display', serif", fontSize: 32, lineHeight: 1.02, letterSpacing: "-0.04em", color: P.ink }}>Send us your message</h2>
                <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.75, color: P.inkMuted }}>Use the form below and we’ll route your message to the right person as quickly as possible.</p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: P.inkSecondary }}>Full Name</label>
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Your name" style={{ width: "100%", padding: "14px 16px", borderRadius: 18, border: "none", boxShadow: `inset 0 0 0 1px ${P.sandLight}`, background: P.parchment, color: P.ink, fontFamily: "'Lora', Georgia, serif", fontSize: 15, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: P.inkSecondary }}>Email Address</label>
                    <input name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" style={{ width: "100%", padding: "14px 16px", borderRadius: 18, border: "none", boxShadow: `inset 0 0 0 1px ${P.sandLight}`, background: P.parchment, color: P.ink, fontFamily: "'Lora', Georgia, serif", fontSize: 15, boxSizing: "border-box" }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: P.inkSecondary }}>Subject</label>
                  <input name="subject" value={formData.subject} onChange={handleChange} placeholder="How can we help?" style={{ width: "100%", padding: "14px 16px", borderRadius: 18, border: "none", boxShadow: `inset 0 0 0 1px ${P.sandLight}`, background: P.parchment, color: P.ink, fontFamily: "'Lora', Georgia, serif", fontSize: 15, boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: P.inkSecondary }}>Message</label>
                  <textarea name="message" value={formData.message} onChange={handleChange} rows={6} placeholder="Tell us what you need..." style={{ width: "100%", padding: "16px", borderRadius: 22, border: "none", boxShadow: `inset 0 0 0 1px ${P.sandLight}`, background: P.parchment, color: P.ink, fontFamily: "'Lora', Georgia, serif", fontSize: 15, lineHeight: 1.7, boxSizing: "border-box", resize: "vertical" }} />
                </div>
                <button type="submit" className="cta-button secondary-cta" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "15px 24px", border: "none", borderRadius: 18, background: P.parchmentDark, color: P.inkSecondary, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", width: "fit-content" }}>
                  <Send size={16} />
                  Submit Message
                </button>
              </form>
            </div>

            <div style={{ display: "grid", gap: 24 }}>
              <div className="contact-card" style={{ borderRadius: 28, background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, padding: "28px 24px" }}>
                <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.vermillion, marginBottom: 12 }}>Direct Contact</div>
                <div style={{ display: "grid", gap: 16 }}>
                  {contactInfo.map((item) => (
                    <div key={item.title} style={{ display: "flex", gap: 14, padding: "16px 0", borderTop: `1px solid ${P.sandLight}` }}>
                      <div style={{ width: 46, height: 46, borderRadius: 16, background: P.vermillionBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <item.icon size={18} color={P.vermillion} strokeWidth={2} />
                      </div>
                      <div>
                        <h3 style={{ margin: "0 0 4px", fontFamily: "'Playfair Display', serif", fontSize: 20, lineHeight: 1.1, color: P.ink }}>{item.title}</h3>
                        <p style={{ margin: "0 0 4px", fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: P.vermillion }}>{item.detail}</p>
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: P.inkMuted }}>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="contact-card" style={{ borderRadius: 28, background: P.parchmentLight, boxShadow: `inset 0 0 0 1px ${P.sandLight}`, padding: "28px 24px" }}>
                <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.vermillion, marginBottom: 12 }}>Quick Answers</div>
                <div style={{ display: "grid", gap: 14 }}>
                  {faqs.map((faq) => (
                    <div key={faq.q} style={{ padding: "18px 18px 16px", borderRadius: 20, background: P.parchment, boxShadow: `inset 0 0 0 1px ${P.sandLight}` }}>
                      <h4 style={{ margin: "0 0 8px", fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: P.inkSecondary }}>{faq.q}</h4>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: P.inkMuted }}>{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer style={{ background: "#120D06", color: "#C8B898", borderTop: `1px solid ${P.inkSecondary}`, padding: "58px 0 34px" }}>
          <div style={{ width: "100%", maxWidth: 1280, margin: "0 auto", padding: "0 20px" }}>
            <div className="contact-footer-grid" style={{ paddingBottom: 38, marginBottom: 28, borderBottom: `1px solid ${P.inkSecondary}` }}>
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
