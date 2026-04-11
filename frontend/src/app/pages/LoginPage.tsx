import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAuth } from "../../context/AuthContext";
import { FieldError } from "../components/FieldValidation";
import { toast } from "sonner";
import { validateEmail, validateLoginForm } from "../../utils/validators";
import { Eye, EyeOff, BookOpen } from "lucide-react";

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

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [colleges, setColleges] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [college, setCollege] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const validationOrder: Array<keyof typeof fieldErrors> = ["email", "password"];

  useEffect(() => {
    fetchColleges();
    setEmail("");
    setPassword("");
    setCollege("");

    const timer = setTimeout(() => {
      setEmail("");
      setPassword("");
      setCollege("");
      const ei = document.getElementById("email") as HTMLInputElement;
      const pi = document.getElementById("password") as HTMLInputElement;
      if (ei) ei.value = "";
      if (pi) pi.value = "";
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const fetchColleges = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/colleges/public");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.data) setColleges(data.data);
    } catch {
      toast.error("Unable to load colleges right now.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setTouched({ email: true, password: true });

    const validation = validateLoginForm({ email, password, college: college || undefined });
    const nextFieldErrors = {
      email: validation.errors.email || "",
      password: validation.errors.password || "",
    };
    setFieldErrors(nextFieldErrors);

    const firstError = validationOrder.map((key) => nextFieldErrors[key]).find(Boolean);
    if (firstError) {
      toast.error(firstError);
      return;
    }

    setLoading(true);
    try {
      const loginData: any = { email: email.trim(), password };
      if (college) loginData.collegeId = parseInt(college);

      const result = await login(loginData);

      if (result.success) {
        const storedUser = sessionStorage.getItem("user");
        if (!storedUser) {
          const message = "Login failed: user data not found.";
          setError(message);
          toast.error(message);
          sessionStorage.removeItem("access_token");
          sessionStorage.removeItem("refresh_token");
          sessionStorage.removeItem("user");
          return;
        }

        const user = JSON.parse(storedUser);

        if ((user.role === "COLLEGE_ADMIN" || user.role === "STUDENT") && !college) {
          const message = "College admins and students must select their college.";
          setError(message);
          toast.error(message);
          sessionStorage.removeItem("access_token");
          sessionStorage.removeItem("refresh_token");
          sessionStorage.removeItem("user");
          return;
        }

        if (college && user.collegeId && parseInt(college) !== user.collegeId) {
          const message = "Selected college does not match your account.";
          setError(message);
          toast.error(message);
          sessionStorage.removeItem("access_token");
          sessionStorage.removeItem("refresh_token");
          sessionStorage.removeItem("user");
          return;
        }

        if (college) localStorage.setItem("selected_college", college);
        toast.success("Login successful!", { description: `Welcome back, ${user.username || user.email}!` });
        navigate("/dashboard");
        return;
      }

      if ((result as any).requiresVerification && (result as any).email) {
        const message = `${result.error || "Verification required."} Redirecting to verification...`;
        setError(message);
        toast.warning(message);
        setTimeout(() => navigate("/verify-otp", { state: { email: (result as any).email, purpose: "REGISTER" } }), 2000);
      } else {
        const message = result.error || "Login failed";
        setError(message);
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (v: string) => {
    setEmail(v);
    if (touched.email) {
      const vv = validateEmail(v);
      setFieldErrors((p) => ({ ...p, email: vv.error || "" }));
    }
  };

  const handleEmailBlur = () => {
    setTouched((p) => ({ ...p, email: true }));
    const vv = validateEmail(email);
    setFieldErrors((p) => ({ ...p, email: vv.error || "" }));
  };

  const handlePasswordChange = (v: string) => {
    setPassword(v);
    if (touched.password) {
      setFieldErrors((p) => ({ ...p, password: v.trim() ? "" : "Password is required." }));
    }
  };

  const handlePasswordBlur = () => {
    setTouched((p) => ({ ...p, password: true }));
    setFieldErrors((p) => ({ ...p, password: password.trim() ? "" : "Password is required." }));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F0E8",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Lora', Georgia, serif",
      }}
    >
      <div
        style={{
          background: "#FAF7F0",
          borderBottom: "2px solid #1C1208",
          padding: "0 40px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <BookOpen size={18} color="#C0392B" strokeWidth={2} />
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 800,
              fontSize: 20,
              color: "#1C1208",
            }}
          >
            LearnBox
          </span>
        </Link>
        <span
          style={{
            fontFamily: "'Barlow Semi Condensed', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#7A6A52",
          }}
        >
          Student Portal
        </span>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        <div style={{ width: "100%", maxWidth: 460 }}>
          <div
            style={{
              background: "#FAF7F0",
              border: "1px solid #D4C5A9",
              borderTop: "3px solid #1C1208",
            }}
          >
            <div
              style={{
                borderBottom: "1px solid #D4C5A9",
                padding: "24px 32px 20px",
              }}
            >
              <div
                style={{
                  fontFamily: "'Barlow Semi Condensed', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#C0392B",
                  marginBottom: 6,
                }}
              >
                Academic Access
              </div>
              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#1C1208",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Login to LearnBox
              </h1>
              <p
                style={{
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: 13.5,
                  color: "#7A6A52",
                  marginTop: 6,
                  lineHeight: 1.6,
                }}
              >
                Enter your credentials to access your account.
              </p>
            </div>

            <div style={{ padding: "28px 32px 32px" }}>
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    fontFamily: "'Barlow Semi Condensed', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#3D2E18",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Select College
                </label>
                <Select value={college} onValueChange={setCollege}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your academic institution..." />
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.length === 0 ? (
                      <SelectItem value="loading" disabled>
                        Loading colleges...
                      </SelectItem>
                    ) : (
                      colleges.map((col) => (
                        <SelectItem key={col.id} value={col.id.toString()}>
                          {col.name} ({col.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p
                  style={{
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: 11.5,
                    color: "#7A6A52",
                    marginTop: 6,
                  }}
                >
                  Super admins may skip college selection.
                </p>
              </div>

              <div style={{ borderTop: "1px solid #D4C5A9", marginBottom: 24 }} />

              {error && (
                <div
                  style={{
                    background: "#F5E6E4",
                    borderLeft: "3px solid #C0392B",
                    padding: "10px 14px",
                    marginBottom: 20,
                    fontFamily: "'Lora', Georgia, serif",
                    fontSize: 13,
                    color: "#7A1C10",
                  }}
                >
                  <div>{error}</div>
                  {error.toLowerCase().includes("register") && (
                    <Link
                      to="/register"
                      style={{
                        display: "inline-block",
                        marginTop: 8,
                        padding: "6px 12px",
                        background: "#C0392B",
                        color: "#FAF7F0",
                        textDecoration: "none",
                        fontSize: 12,
                        fontFamily: "'Barlow Semi Condensed', sans-serif",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        borderRadius: 2,
                      }}
                    >
                      Go to Register
                    </Link>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} autoComplete="off" noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <input
                  type="text"
                  name="auth_username"
                  autoComplete="username"
                  tabIndex={-1}
                  aria-hidden="true"
                  style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, width: 0 }}
                />
                <input
                  type="password"
                  name="auth_password"
                  autoComplete="current-password"
                  tabIndex={-1}
                  aria-hidden="true"
                  style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, width: 0 }}
                />

                <div>
                  <label
                    style={{
                      fontFamily: "'Barlow Semi Condensed', sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#3D2E18",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="login-email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onBlur={handleEmailBlur}
                    autoComplete="off"
                    readOnly
                    style={{
                      ...inkInput,
                      borderBottomColor: touched.email && fieldErrors.email ? "#C0392B" : "#D4C5A9",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.removeAttribute("readonly");
                      e.target.style.borderBottomColor = "#1C1208";
                    }}
                  />
                  <FieldError error={touched.email ? fieldErrors.email : ""} />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <label
                      style={{
                        fontFamily: "'Barlow Semi Condensed', sans-serif",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#3D2E18",
                      }}
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      style={{
                        fontFamily: "'Barlow Semi Condensed', sans-serif",
                        fontSize: 11,
                        color: "#C0392B",
                        textDecoration: "none",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      onBlur={handlePasswordBlur}
                      name="login-password"
                      autoComplete="new-password"
                      readOnly
                      style={{ ...inkInput, paddingRight: 44 }}
                      onFocus={(e) => {
                        e.currentTarget.removeAttribute("readonly");
                        e.target.style.borderBottomColor = "#1C1208";
                      }}
                      onBlurCapture={(e) => (e.currentTarget.style.borderBottomColor = "#D4C5A9")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#7A6A52",
                        padding: 0,
                        display: "flex",
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <FieldError error={touched.password ? fieldErrors.password : ""} />
                </div>

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
                  onMouseEnter={(e) => {
                    if (!loading) (e.currentTarget as HTMLElement).style.background = "#C0392B";
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) (e.currentTarget as HTMLElement).style.background = "#1C1208";
                  }}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              <div style={{ borderTop: "1px solid #D4C5A9", margin: "24px 0" }} />

              <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 13, color: "#7A6A52", textAlign: "center", margin: 0 }}>
                Don't have an account?{" "}
                <Link
                  to="/register"
                  style={{
                    color: "#C0392B",
                    fontFamily: "'Barlow Semi Condensed', sans-serif",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "underline")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.textDecoration = "none")}
                >
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid #D4C5A9",
          padding: "16px 40px",
          background: "#EDE5D4",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "'Barlow Semi Condensed', sans-serif",
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#7A6A52",
            margin: 0,
          }}
        >
          (c) 2025 LearnBox. All rights reserved.
        </p>
      </div>
    </div>
  );
}
