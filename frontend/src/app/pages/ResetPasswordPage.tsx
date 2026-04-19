import { useEffect, useState } from "react";
import { API_BASE } from '../../config';
import { Link, useNavigate, useLocation } from "react-router-dom";
import { BookOpen, Eye, EyeOff } from "lucide-react";

import { P } from '../../constants/theme';

const inkInput: React.CSSProperties = {
  width: "100%", padding: "12px 14px",
  fontFamily: "'Lora', Georgia, serif", fontSize: 15, color: P.ink,
  background: P.parchmentLight, border: "none", borderBottom: `2px solid ${P.sand}`,
  outline: "none", transition: "border-color 0.15s", boxSizing: "border-box",
};

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const [formData, setFormData] = useState({ otp: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState({ newPassword: false, confirmPassword: false });
  const softPrimaryButton = { padding: "14px", fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, fontSize: 14, background: P.parchmentDark, color: P.inkSecondary, border: "none", boxShadow: `inset 0 0 0 1px ${P.sandLight}`, cursor: "pointer", transition: "background 0.15s, box-shadow 0.15s, color 0.15s" };

  useEffect(() => {
    setFormData({ otp: "", newPassword: "", confirmPassword: "" });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (formData.newPassword !== formData.confirmPassword) { setError("Passwords do not match"); return; }
    if (formData.newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (!formData.otp || formData.otp.length !== 6) { setError("Please enter a valid 6-digit OTP"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: formData.otp, newPassword: formData.newPassword }),
      });
      const data = await res.json();
      if (res.ok) { setSuccess("Password reset successful! Redirecting to login…"); setTimeout(() => navigate("/login"), 2000); }
      else setError(data.error || "Failed to reset password");
    } catch { setError("Failed to reset password. Please try again."); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose: "FORGOT_PASSWORD" }),
      });
      const data = await res.json();
      if (res.ok) setSuccess("OTP resent to your email.");
      else setError(data.error || "Failed to resend OTP");
    } catch { setError("Failed to resend OTP."); }
  };

  return (
    <div style={{ minHeight: "100vh", background: P.parchment, display: "flex", flexDirection: "column", fontFamily: "'Lora', Georgia, serif" }}>
      <div style={{ background: P.parchmentLight, borderBottom: `2px solid ${P.ink}`, padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <BookOpen size={18} color={P.vermillion} strokeWidth={2} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 20, color: P.ink }}>LearnBox</span>
        </Link>
        <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: P.inkMuted }}>Reset Password</span>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ width: "100%", maxWidth: 460 }}>
          <div style={{ background: P.parchmentLight, border: `1px solid ${P.sand}`, borderTop: `3px solid ${P.ink}` }}>
            <div style={{ borderBottom: `1px solid ${P.sand}`, padding: "24px 32px 20px" }}>
              <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: P.vermillion, marginBottom: 6 }}>Account Recovery</div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: P.ink, margin: 0 }}>Reset Password</h1>
              <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: P.inkMuted, marginTop: 6, lineHeight: 1.6 }}>
                Enter the OTP sent to <strong style={{ color: P.ink }}>{email || "your email"}</strong> and choose a new password.
              </p>
            </div>

            <div style={{ padding: "28px 32px 32px" }}>
              {error && <div style={{ background: P.vermillionBg, borderLeft: `3px solid ${P.vermillion}`, padding: "10px 14px", marginBottom: 20, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: "#7A1C10" }}>{error}</div>}
              {success && <div style={{ background: P.mossBg, borderLeft: `3px solid ${P.moss}`, padding: "10px 14px", marginBottom: 20, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: P.moss }}>{success}</div>}

              <form onSubmit={handleSubmit} autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <input type="text" name="auth_username" autoComplete="username" tabIndex={-1} aria-hidden="true" style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, width: 0 }} />
                <input type="password" name="auth_password" autoComplete="current-password" tabIndex={-1} aria-hidden="true" style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, width: 0 }} />
                {/* OTP */}
                <div>
                  <label style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: P.inkSecondary, display: "block", marginBottom: 8 }}>Verification Code</label>
                  <input type="text" name="reset-otp" autoComplete="one-time-code" placeholder="1  2  3  4  5  6" value={formData.otp} onChange={e => setFormData(p => ({ ...p, otp: e.target.value.replace(/\D/g, "").slice(0, 6) }))} maxLength={6} readOnly required
                    style={{ ...inkInput, fontSize: 24, fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 800, letterSpacing: "0.3em", textAlign: "center" }}
                    onFocus={e => { e.currentTarget.removeAttribute("readonly"); e.target.style.borderBottomColor = P.ink; }} onBlur={e => (e.target.style.borderBottomColor = P.sand)} />
                </div>

                {/* New password */}
                <div>
                  <label style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: P.inkSecondary, display: "block", marginBottom: 8 }}>New Password</label>
                  <div style={{ position: "relative" }}>
                    <input type="text" name={`data_${Math.random().toString(36).substring(7)}`} autoComplete="off" placeholder="••••••••" value={formData.newPassword} onChange={e => setFormData(p => ({ ...p, newPassword: e.target.value }))} required
                      style={{ ...inkInput, paddingRight: 44, WebkitTextSecurity: showPw.newPassword ? "none" : "disc" }} onFocus={e => (e.target.style.borderBottomColor = P.ink)} onBlur={e => (e.target.style.borderBottomColor = P.sand)} />
                    <button type="button" onClick={() => setShowPw(p => ({ ...p, newPassword: !p.newPassword }))} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: P.inkMuted, display: "flex" }}>
                      {showPw.newPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: P.inkSecondary, display: "block", marginBottom: 8 }}>Confirm Password</label>
                  <div style={{ position: "relative" }}>
                    <input type="text" name={`data_${Math.random().toString(36).substring(7)}`} autoComplete="off" placeholder="••••••••" value={formData.confirmPassword} onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))} required
                      style={{ ...inkInput, paddingRight: 44, WebkitTextSecurity: showPw.confirmPassword ? "none" : "disc" }} onFocus={e => (e.target.style.borderBottomColor = P.ink)} onBlur={e => (e.target.style.borderBottomColor = P.sand)} />
                    <button type="button" onClick={() => setShowPw(p => ({ ...p, confirmPassword: !p.confirmPassword }))} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: P.inkMuted, display: "flex" }}>
                      {showPw.confirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} style={{ ...softPrimaryButton, color: loading ? P.inkMuted : P.inkSecondary, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
                  onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.background = P.parchment; (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${P.sand}`; } }}
                  onMouseLeave={e => { if (!loading) { (e.currentTarget as HTMLElement).style.background = P.parchmentDark; (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${P.sandLight}`; } }}>
                  {loading ? "Resetting…" : "Reset Password"}
                </button>
              </form>

              <div style={{ borderTop: `1px solid ${P.sand}`, marginTop: 24, paddingTop: 20, textAlign: "center", display: "flex", flexDirection: "column", gap: 10 }}>
                <button type="button" onClick={handleResend} style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 600, fontSize: 13, color: P.inkMuted, background: "none", border: "none", cursor: "pointer", letterSpacing: "0.04em" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = P.vermillion)}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = P.inkMuted)}>
                  Resend OTP
                </button>
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

      <div style={{ borderTop: `1px solid ${P.sand}`, padding: "16px 40px", background: P.parchmentDark, textAlign: "center" }}>
        <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: P.inkMuted, margin: 0 }}>© 2025 LearnBox. All rights reserved.</p>
      </div>
    </div>
  );
}
