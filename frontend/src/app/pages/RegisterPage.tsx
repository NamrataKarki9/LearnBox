import { useState, useEffect } from "react";
import { API_BASE } from '../../config';
import { Link, useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAuth } from "../../context/AuthContext";
import { FieldError } from "../components/FieldValidation";
import { toast } from "sonner";
import { Eye, EyeOff, BookOpen } from "lucide-react";
import {
  validateUsername, validateEmail, validateFullName, validatePassword,
  validatePasswordMatch, validateCollegeSelection, sanitizeUsername, sanitizeFullName,
} from "../../utils/validators";

const inkInput: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  fontFamily: "'Lora', Georgia, serif",
  fontSize: 15,
  color: "#1C1208",
  background: "#FAF7F0",
  border: "none",
  borderBottom: "2px solid #D4C5A9",
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};

const inkLabel: React.CSSProperties = {
  fontFamily: "'Barlow Semi Condensed', sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: "#3D2E18",
  display: "block",
  marginBottom: 8,
};

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [colleges, setColleges] = useState<any[]>([]);
  const [formData, setFormData] = useState({ collegeId: "", username: "", fullName: "", email: "", password: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState({ collegeId: "", username: "", fullName: "", email: "", password: "", confirmPassword: "" });
  const [touched, setTouched] = useState({ collegeId: false, username: false, fullName: false, email: false, password: false, confirmPassword: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ password: false, confirmPassword: false });
  const validationOrder: Array<keyof typeof fieldErrors> = ["collegeId", "username", "fullName", "email", "password", "confirmPassword"];

  useEffect(() => {
    fetchColleges();
    const blank = { collegeId: "", username: "", fullName: "", email: "", password: "", confirmPassword: "" };
    setFormData(blank);
    const t = setTimeout(() => {
      setFormData(blank);
      ["email","password","confirmPassword","username","fullName"].forEach(id => {
        const el = document.getElementById(id) as HTMLInputElement;
        if (el) el.value = "";
      });
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const fetchColleges = async () => {
    try {
      const res = await fetch(`${API_BASE}/colleges/public`);
      if (!res.ok) { setError("Failed to load colleges."); return; }
      const data = await res.json();
      if (data.success && data.data) setColleges(data.data);
      else setError("No colleges available.");
    } catch { setError("Unable to connect to server."); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    setTouched({ collegeId: true, username: true, fullName: true, email: true, password: true, confirmPassword: true });
    const newErrors = { collegeId: "", username: "", fullName: "", email: "", password: "", confirmPassword: "" };
    const cv = validateCollegeSelection(formData.collegeId); if (!cv.valid) newErrors.collegeId = cv.error || "Required";
    const uv = validateUsername(formData.username); if (!uv.valid) newErrors.username = uv.error || "Invalid";
    const fv = validateFullName(formData.fullName); if (!fv.valid) newErrors.fullName = fv.error || "Invalid";
    const ev = validateEmail(formData.email); if (!ev.valid) newErrors.email = ev.error || "Invalid";
    const pv = validatePassword(formData.password); if (!pv.valid) newErrors.password = pv.errors[0] || "Invalid";
    const pmv = validatePasswordMatch(formData.password, formData.confirmPassword); if (!pmv.valid) newErrors.confirmPassword = pmv.error || "Mismatch";
    setFieldErrors(newErrors);
    const firstError = validationOrder.map((key) => newErrors[key]).find(Boolean);
    if (firstError) {
      toast.error(firstError);
      return;
    }
    setLoading(true);
    const parts = formData.fullName.trim().split(" ");
    const result = await register({ username: formData.username.trim(), email: formData.email.trim(), password: formData.password, first_name: parts[0] || "", last_name: parts.slice(1).join(" ") || "", collegeId: parseInt(formData.collegeId) });
    setLoading(false);
    if (result.success) navigate("/verify-otp", { state: { email: formData.email, purpose: "REGISTER" } });
    else {
      const message = result.error || "Registration failed";
      setError(message);
      toast.error(message);
    }
  };

  const updateField = (field: string, value: string) => {
    let v = value;
    if (field === "username") v = sanitizeUsername(value);
    if (field === "fullName") v = sanitizeFullName(value);
    setFormData(p => ({ ...p, [field]: v }));
    if (touched[field as keyof typeof touched]) validateFieldFn(field, v);
  };

  const validateFieldFn = (name: string, value: string) => {
    let err = "";
    if (name === "username") { const r = validateUsername(value); err = r.error || ""; }
    else if (name === "fullName") { const r = validateFullName(value); err = r.error || ""; }
    else if (name === "email") { const r = validateEmail(value); err = r.error || ""; }
    else if (name === "password") { const r = validatePassword(value); err = r.errors[0] || ""; }
    else if (name === "confirmPassword") { const r = validatePasswordMatch(formData.password, value); err = r.error || ""; }
    else if (name === "collegeId") { const r = validateCollegeSelection(value); err = r.error || ""; }
    setFieldErrors(p => ({ ...p, [name]: err }));
  };

  const handleBlur = (name: string) => {
    setTouched(p => ({ ...p, [name]: true }));
    validateFieldFn(name, formData[name as keyof typeof formData]);
  };

  const fields = [
    { id: "username", label: "Username", placeholder: "Ram", type: "text" },
    { id: "fullName", label: "Full Name", placeholder: "Ramu", type: "text" },
    { id: "email", label: "Email Address", placeholder: "your.email@example.com", type: "email" },
    { id: "password", label: "Password", placeholder: "••••••••", type: "password" },
    { id: "confirmPassword", label: "Confirm Password", placeholder: "••••••••", type: "password" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F5F0E8", display: "flex", flexDirection: "column", fontFamily: "'Lora', Georgia, serif" }}>
      {/* Top bar */}
      <div style={{ background: "#FAF7F0", borderBottom: "2px solid #1C1208", padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <BookOpen size={18} color="#C0392B" strokeWidth={2} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 20, color: "#1C1208" }}>LearnBox</span>
        </Link>
        <span style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7A6A52" }}>Student Registration</span>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ width: "100%", maxWidth: 480 }}>
          <div style={{ background: "#FAF7F0", border: "1px solid #D4C5A9", borderTop: "3px solid #1C1208" }}>
            {/* Header */}
            <div style={{ borderBottom: "1px solid #D4C5A9", padding: "24px 32px 20px" }}>
              <div style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#C0392B", marginBottom: 6 }}>
                Create Account
              </div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 800, color: "#1C1208", margin: 0, letterSpacing: "-0.02em" }}>
                Student Registration
              </h1>
              <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13.5, color: "#7A6A52", marginTop: 6, lineHeight: 1.6 }}>
                Only students can register publicly. College admins are invited by administrators.
              </p>
            </div>

            <div style={{ padding: "28px 32px 32px" }}>
              {/* College */}
              <div style={{ marginBottom: 20 }}>
                <label style={inkLabel}>Select College *</label>
                <Select value={formData.collegeId} onValueChange={(v) => { updateField("collegeId", v); setTouched(p => ({ ...p, collegeId: true })); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your academic institution…" />
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.length === 0
                      ? <SelectItem value="loading" disabled>Loading colleges…</SelectItem>
                      : colleges.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name} ({c.code})</SelectItem>)
                    }
                  </SelectContent>
                </Select>
                {touched.collegeId && fieldErrors.collegeId && <FieldError error={fieldErrors.collegeId} />}
              </div>

              <div style={{ borderTop: "1px solid #D4C5A9", marginBottom: 20 }} />

              {error && (
                <div style={{ background: "#F5E6E4", borderLeft: "3px solid #C0392B", padding: "10px 14px", marginBottom: 20, fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: "#7A1C10" }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} autoComplete="off" noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <input type="text" name="auth_username" autoComplete="username" tabIndex={-1} aria-hidden="true" style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, width: 0 }} />
                <input type="password" name="auth_password" autoComplete="current-password" tabIndex={-1} aria-hidden="true" style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, width: 0 }} />
                {fields.map(({ id, label, placeholder, type }) => {
                  const isPassword = type === "password";
                  const showToggle = id === "password" ? showPasswords.password : showPasswords.confirmPassword;
                  const actualType = isPassword ? (showToggle ? "text" : "password") : type;
                  const hasError = touched[id as keyof typeof touched] && fieldErrors[id as keyof typeof fieldErrors];
                  return (
                    <div key={id}>
                      <label style={inkLabel}>{label} *</label>
                      <div style={{ position: "relative" }}>
                        <input
                          id={id}
                          type={actualType}
                          placeholder={placeholder}
                          name={`register-${id}`}
                          value={formData[id as keyof typeof formData]}
                          onChange={(e) => updateField(id, e.target.value)}
                          autoComplete={id === "password" || id === "confirmPassword" ? "new-password" : "off"}
                          readOnly
                          style={{
                            ...inkInput,
                            paddingRight: isPassword ? 44 : 14,
                            borderBottomColor: hasError ? "#C0392B" : "#D4C5A9",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.removeAttribute("readonly");
                            e.target.style.borderBottomColor = "#1C1208";
                          }}
                          onBlur={(e) => {
                            handleBlur(id);
                            const currentValue = e.target.value;
                            let nextError = "";
                            if (id === "username") nextError = validateUsername(currentValue).error || "";
                            else if (id === "fullName") nextError = validateFullName(currentValue).error || "";
                            else if (id === "email") nextError = validateEmail(currentValue).error || "";
                            else if (id === "password") nextError = validatePassword(currentValue).errors[0] || "";
                            else if (id === "confirmPassword") nextError = validatePasswordMatch(formData.password, currentValue).error || "";
                            e.target.style.borderBottomColor = nextError ? "#C0392B" : "#D4C5A9";
                          }}
                        />
                        {isPassword && (
                          <button
                            type="button"
                            onClick={() => setShowPasswords(p => ({ ...p, [id]: !p[id as keyof typeof p] }))}
                            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#7A6A52", padding: 0, display: "flex" }}
                          >
                            {showToggle ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        )}
                      </div>
                      {touched[id as keyof typeof touched] && fieldErrors[id as keyof typeof fieldErrors] && (
                        <FieldError error={fieldErrors[id as keyof typeof fieldErrors]} />
                      )}
                    </div>
                  );
                })}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: 8,
                    width: "100%",
                    padding: "14px",
                    fontFamily: "'Barlow Semi Condensed', sans-serif",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontSize: 14,
                    background: loading ? "#D4C5A9" : "#1C1208",
                    color: "#FAF7F0",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#C0392B"; }}
                  onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = "#1C1208"; }}
                >
                  {loading ? "Creating Account…" : "Create Account"}
                </button>
              </form>

              <div style={{ borderTop: "1px solid #D4C5A9", margin: "24px 0" }} />
              <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: "#7A6A52", textAlign: "center", margin: 0 }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "#C0392B", fontFamily: "'Barlow Semi Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.04em", textDecoration: "none" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "underline")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "none")}
                >
                  Sign In
                </Link>
              </p>

              {/* Security note */}
              <div style={{ marginTop: 16, background: "#EDE5D4", border: "1px solid #D4C5A9", padding: "12px 16px" }}>
                <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 12, color: "#7A6A52", margin: 0, lineHeight: 1.6 }}>
                  🔒 <strong style={{ color: "#3D2E18" }}>Secure Registration:</strong> Only students may register publicly. Role assignment is controlled server‑side for security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #D4C5A9", padding: "16px 40px", background: "#EDE5D4", textAlign: "center" }}>
        <p style={{ fontFamily: "'Barlow Semi Condensed', sans-serif", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "#7A6A52", margin: 0 }}>
          © 2025 LearnBox. All rights reserved.
        </p>
      </div>
    </div>
  );
}
