import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen } from "lucide-react";

import { P } from '../../constants/theme';

const inkInput: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  fontFamily: "'Lora', Georgia, serif", fontSize: 15, color: P.ink,
  background: P.parchmentLight, border: "none", borderBottom: `2px solid ${P.sand}`,
  outline: "none", transition: "border-color 0.15s", boxSizing: "border-box",
};

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail("");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) { setSuccess("Password reset code sent to your email. Redirecting…"); setTimeout(() => navigate("/reset-password", { state: { email } }), 2000); }
      else setError(data.error || "Failed to send reset code");
    } catch { setError("Failed to send reset code. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: P.parchment, display: "flex", flexDirection: "column", fontFamily: "'Lora', Georgia, serif" }}>
      <div style={{ background: P.parchmentLight, borderBottom: `2px solid ${P.ink}`, padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <BookOpen size={18} color={P.vermillion} strokeWidth={2} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 20, color: P.ink }}>LearnBox</span>
        </Link>
        <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: P.inkMuted }}>Account Recovery</span>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <div style={{ background: P.parchmentLight, border: `1px solid ${P.sand}`, borderTop: `3px solid ${P.ink}` }}>
            <div style={{ borderBottom: `1px solid ${P.sand}`, padding: "24px 32px 20px" }}>
              <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.vermillion, marginBottom: 6 }}>Password Recovery</div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: P.ink, margin: 0 }}>Forgot Password</h1>
              <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.inkMuted, marginTop: 6, lineHeight: 1.6 }}>Enter your email address and we'll send you a reset code.</p>
            </div>

            <div style={{ padding: "28px 32px 32px" }}>
              {error && <div style={{ background: P.vermillionBg, borderLeft: `3px solid ${P.vermillion}`, padding: "10px 14px", marginBottom: 20, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: "#7A1C10" }}>{error}</div>}
              {success && <div style={{ background: P.mossBg, borderLeft: `3px solid ${P.moss}`, padding: "10px 14px", marginBottom: 20, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.moss }}>{success}</div>}

              <form onSubmit={handleSubmit} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <input type="text" name="auth_username" autoComplete="username" tabIndex={-1} aria-hidden="true" style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, width: 0 }} />
                <input type="password" name="auth_password" autoComplete="current-password" tabIndex={-1} aria-hidden="true" style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, width: 0 }} />
                <div>
                  <label style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: P.inkSecondary, display: "block", marginBottom: 8 }}>Email Address</label>
                  <input id="email" name="forgot-password-email" type="email" placeholder="your.email@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="off" readOnly required style={inkInput}
                    onFocus={e => { e.currentTarget.removeAttribute("readonly"); e.target.style.borderBottomColor = P.ink; }}
                    onBlur={e => (e.target.style.borderBottomColor = P.sand)} />
                </div>
                <button type="submit" disabled={loading} style={{ padding: "14px", fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 14, background: loading ? P.sand : P.ink, color: P.parchmentLight, border: "none", cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = P.vermillion; }}
                  onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = P.ink; }}>
                  {loading ? "Sending…" : "Send Reset Code"}
                </button>
              </form>

              <div style={{ borderTop: `1px solid ${P.sand}`, marginTop: 24, paddingTop: 20, textAlign: "center" }}>
                <Link to="/login" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 13, color: P.inkMuted, letterSpacing: "0.04em", textDecoration: "none" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = P.vermillion)}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = P.inkMuted)}>
                  ← Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${P.sand}`, padding: "16px 40px", background: P.parchmentDark, textAlign: "center" }}>
        <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: P.inkMuted, margin: 0 }}>© 2025 LearnBox. All rights reserved.</p>
      </div>
    </div>
  );
}
