import { useState } from "react";
import { API_BASE } from '../../config';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { BookOpen } from "lucide-react";

import { P } from '../../constants/theme';

export function VerifyOTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const purpose = location.state?.purpose || "REGISTER";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const softPrimaryButton = { padding: "14px", fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, fontSize: 14, background: P.parchmentDark, color: P.inkSecondary, border: "none", boxShadow: `inset 0 0 0 1px ${P.sandLight}`, cursor: "pointer", transition: "background 0.15s, box-shadow 0.15s, color 0.15s" };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (!otp || otp.length !== 6) { setError("Please enter a valid 6-digit OTP"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-registration-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem("access_token", data.tokens.access);
        sessionStorage.setItem("refresh_token", data.tokens.refresh);
        sessionStorage.setItem("user", JSON.stringify(data.user));
        setSuccess("Email verified! Redirecting to dashboard…");
        setTimeout(() => navigate("/dashboard"), 2000);
      } else setError(data.error || "Invalid OTP. Please try again.");
    } catch { setError("Failed to verify OTP. Please try again."); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true); setError(""); setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, purpose }),
      });
      const data = await res.json();
      if (res.ok) setSuccess("OTP resent to your email.");
      else setError(data.error || "Failed to resend OTP");
    } catch { setError("Failed to resend OTP. Please try again."); }
    finally { setResending(false); }
  };

  return (
    <div style={{ minHeight: "100vh", background: P.parchment, display: "flex", flexDirection: "column", fontFamily: "'Lora', Georgia, serif" }}>
      <div style={{ background: P.parchmentLight, borderBottom: `2px solid ${P.ink}`, padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <BookOpen size={18} color={P.vermillion} strokeWidth={2} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 20, color: P.ink }}>LearnBox</span>
        </Link>
        <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: P.inkMuted }}>Email Verification</span>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>
          <div style={{ background: P.parchmentLight, border: `1px solid ${P.sand}`, borderTop: `3px solid ${P.ink}` }}>
            <div style={{ borderBottom: `1px solid ${P.sand}`, padding: "24px 32px 20px" }}>
              <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.vermillion, marginBottom: 6 }}>Step 2 of 2</div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: P.ink, margin: 0 }}>Verify Your Email</h1>
              <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.inkMuted, marginTop: 6, lineHeight: 1.6 }}>
                We've sent a 6-digit verification code to{" "}
                <strong style={{ color: P.ink }}>{email}</strong>
              </p>
            </div>

            <div style={{ padding: "28px 32px 32px" }}>
              {error && <div style={{ background: P.vermillionBg, borderLeft: `3px solid ${P.vermillion}`, padding: "10px 14px", marginBottom: 20, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: "#7A1C10" }}>{error}</div>}
              {success && <div style={{ background: P.mossBg, borderLeft: `3px solid ${P.moss}`, padding: "10px 14px", marginBottom: 20, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.moss }}>{success}</div>}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: P.inkSecondary, display: "block", marginBottom: 8 }}>6-Digit OTP</label>
                  <input
                    id="otp" type="text" placeholder="1  2  3  4  5  6"
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6} required
                    style={{ width: "100%", padding: "16px 14px", fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: "0.3em", color: P.ink, background: P.parchmentLight, border: "none", borderBottom: `2px solid ${P.sand}`, outline: "none", textAlign: "center", boxSizing: "border-box" as const }}
                    onFocus={e => (e.target.style.borderBottomColor = P.ink)}
                    onBlur={e => (e.target.style.borderBottomColor = P.sand)}
                  />
                  <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, color: P.inkMuted, textAlign: "center", marginTop: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>OTP expires in 10 minutes</p>
                </div>
                <button type="submit" disabled={loading || otp.length !== 6} style={{ ...softPrimaryButton, color: otp.length !== 6 ? P.inkMuted : P.inkSecondary, cursor: otp.length !== 6 ? "not-allowed" : "pointer", opacity: otp.length !== 6 ? 0.7 : 1 }}
                  onMouseEnter={e => { if (otp.length === 6) { (e.currentTarget as HTMLElement).style.background = P.parchment; (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${P.sand}`; } }}
                  onMouseLeave={e => { if (otp.length === 6) { (e.currentTarget as HTMLElement).style.background = P.parchmentDark; (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${P.sandLight}`; } }}>
                  {loading ? "Verifying…" : "Verify Email"}
                </button>
              </form>

              <div style={{ borderTop: `1px solid ${P.sand}`, marginTop: 24, paddingTop: 20, textAlign: "center" }}>
                <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.inkMuted, marginBottom: 10 }}>Didn't receive the code?</p>
                <button type="button" onClick={handleResend} disabled={resending} style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, fontSize: 13, color: P.vermillion, letterSpacing: "0.04em", background: "none", border: "none", cursor: resending ? "not-allowed" : "pointer", textDecoration: "underline", textDecorationColor: P.vermillion }}>
                  {resending ? "Sending…" : "Resend OTP"}
                </button>
                <div style={{ marginTop: 12 }}>
                  <Link to="/login" style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 600, fontSize: 12, color: P.inkMuted, letterSpacing: "0.04em", textDecoration: "none", textTransform: "uppercase" }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = P.inkSecondary)}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = P.inkMuted)}>
                    ← Back to Login
                  </Link>
                </div>
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
