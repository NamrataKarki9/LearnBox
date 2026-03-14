import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAuth } from "../../context/AuthContext";
import { FieldError } from "../components/FieldValidation";
import { PasswordStrengthIndicator } from "../components/PasswordStrengthIndicator";
import { Eye, EyeOff } from "lucide-react";
import {
  validateUsername,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePasswordMatch,
  validateCollegeSelection,
  sanitizeUsername,
  sanitizeFullName,
} from "../../utils/validators";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [colleges, setColleges] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    collegeId: "",
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({
    collegeId: "",
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  
  // Touched fields (to show errors only after user interaction)
  const [touched, setTouched] = useState({
    collegeId: false,
    username: false,
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false
  });

  // Fetch colleges on mount
  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      console.log('Fetching colleges from:', 'http://localhost:5000/api/colleges/public');
      const response = await fetch('http://localhost:5000/api/colleges/public');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        console.error('Failed to fetch colleges:', response.statusText);
        setError('Failed to load colleges. Please refresh the page.');
        return;
      }
      
      const data = await response.json();
      console.log('Colleges data:', data);
      
      if (data.success && data.data) {
        // Data is already filtered by backend to only active colleges
        setColleges(data.data);
        console.log('Loaded colleges:', data.data.length);
      } else {
        setError('No colleges available. Please contact support.');
      }
    } catch (error) {
      console.error('Failed to fetch colleges:', error);
      setError('Unable to connect to server. Please check if the backend is running.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Mark all fields as touched
    setTouched({
      collegeId: true,
      username: true,
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true
    });

    // Validate all fields
    const newErrors: typeof fieldErrors = {
      collegeId: "",
      username: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: ""
    };

    // Validate college
    const collegeValidation = validateCollegeSelection(formData.collegeId);
    if (!collegeValidation.valid) {
      newErrors.collegeId = collegeValidation.error || "Invalid college";
    }

    // Validate username
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.valid) {
      newErrors.username = usernameValidation.error || "Invalid username";
    }

    // Validate full name
    const fullNameValidation = validateFullName(formData.fullName);
    if (!fullNameValidation.valid) {
      newErrors.fullName = fullNameValidation.error || "Invalid full name";
    }

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error || "Invalid email";
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.errors[0] || "Invalid password";
    }

    // Validate password match
    const passwordMatchValidation = validatePasswordMatch(formData.password, formData.confirmPassword);
    if (!passwordMatchValidation.valid) {
      newErrors.confirmPassword = passwordMatchValidation.error || "Passwords do not match";
    }

    setFieldErrors(newErrors);

    // If there are any errors, stop submission
    if (Object.values(newErrors).some(err => err !== "")) {
      setError("Please fix all errors before submitting.");
      return;
    }

    setLoading(true);

    // Split full name into first and last name
    const nameParts = formData.fullName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const result = await register({
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
      first_name: firstName,
      last_name: lastName,
      collegeId: parseInt(formData.collegeId)
    });
    
    setLoading(false);
    
    if (result.success) {
      // Navigate to OTP verification page
      navigate("/verify-otp", { 
        state: { 
          email: formData.email,
          purpose: "REGISTER"
        } 
      });
    } else {
      setError(result.error || "Registration failed");
    }
  };

  const updateField = (field: string, value: string) => {
    let sanitizedValue = value;
    
    // Sanitize username - only letters and underscores
    if (field === "username") {
      sanitizedValue = sanitizeUsername(value);
    }
    
    // Sanitize full name - only letters, spaces, hyphens, apostrophes
    if (field === "fullName") {
      sanitizedValue = sanitizeFullName(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Validate field in real-time (only if touched)
    if (touched[field as keyof typeof touched]) {
      validateField(field, sanitizedValue);
    }
  };

  const validateField = (fieldName: string, value: string) => {
    let error = "";

    switch (fieldName) {
      case "username":
        const usernameValidation = validateUsername(value);
        error = usernameValidation.error || "";
        break;
      case "fullName":
        const fullNameValidation = validateFullName(value);
        error = fullNameValidation.error || "";
        break;
      case "email":
        const emailValidation = validateEmail(value);
        error = emailValidation.error || "";
        break;
      case "password":
        const passwordValidation = validatePassword(value);
        error = passwordValidation.errors[0] || "";
        break;
      case "confirmPassword":
        const passwordMatchValidation = validatePasswordMatch(formData.password, value);
        error = passwordMatchValidation.error || "";
        break;
      case "collegeId":
        const collegeValidation = validateCollegeSelection(value);
        error = collegeValidation.error || "";
        break;
      default:
        break;
    }

    setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, formData[fieldName as keyof typeof formData]);
  };

  return (
    <div className="min-h-screen bg-accent flex flex-col">
      {/* Header */}
      <div className="py-6 px-6">
        <Link to="/" className="text-2xl font-semibold text-white">
          LearnBox
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-lg">
          {/* College Selection */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Student Registration</h1>
            <p className="text-sm text-muted-foreground mb-4">
              Register as a student. Only students can register publicly.
            </p>
            <Label htmlFor="college" className="text-sm font-semibold mb-2 block">Select your college *</Label>
            <Select 
              value={formData.collegeId} 
              onValueChange={(val) => {
                updateField("collegeId", val);
                setTouched(prev => ({ ...prev, collegeId: true }));
              }}
            >
              <SelectTrigger className={`w-full bg-input-background border-0 rounded-xl py-6 ${
                touched.collegeId && fieldErrors.collegeId ? "border-2 border-red-500" : ""
              }`}>
                <SelectValue placeholder="Choose your academic institution.." />
              </SelectTrigger>
              <SelectContent>
                {colleges.length === 0 ? (
                  <SelectItem value="loading" disabled>Loading colleges...</SelectItem>
                ) : (
                  colleges.map((college) => (
                    <SelectItem key={college.id} value={college.id.toString()}>
                      {college.name} ({college.code})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {touched.collegeId && fieldErrors.collegeId && (
              <FieldError error={fieldErrors.collegeId} />
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold">Username *</Label>
              <Input
                id="username"
                type="text"
                placeholder="john_doe (letters and underscores only)"
                value={formData.username}
                onChange={(e) => updateField("username", e.target.value)}
                onBlur={() => handleFieldBlur("username")}
                className={`bg-input-background border-0 rounded-xl py-6 ${
                  touched.username && fieldErrors.username ? "border-2 border-red-500" : ""
                }`}
                required
              />
              {touched.username && fieldErrors.username && (
                <FieldError error={fieldErrors.username} />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-semibold">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="enter your full name"
                value={formData.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                onBlur={() => handleFieldBlur("fullName")}
                className={`bg-input-background border-0 rounded-xl py-6 ${
                  touched.fullName && fieldErrors.fullName ? "border-2 border-red-500" : ""
                }`}
                required
              />
              {touched.fullName && fieldErrors.fullName && (
                <FieldError error={fieldErrors.fullName} />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                onBlur={() => handleFieldBlur("email")}
                className={`bg-input-background border-0 rounded-xl py-6 ${
                  touched.email && fieldErrors.email ? "border-2 border-red-500" : ""
                }`}
                required
              />
              {touched.email && fieldErrors.email && (
                <FieldError error={fieldErrors.email} />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPasswords.password ? "text" : "password"}
                  placeholder="password"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  onBlur={() => handleFieldBlur("password")}
                  className={`bg-input-background border-0 rounded-xl py-6 pr-10 ${
                    touched.password && fieldErrors.password ? "border-2 border-red-500" : ""
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, password: !showPasswords.password })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {touched.password && fieldErrors.password && (
                <FieldError error={fieldErrors.password} />
              )}
              {formData.password && (
                <PasswordStrengthIndicator password={formData.password} showRequirements={true} />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirmPassword ? "text" : "password"}
                  placeholder="confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField("confirmPassword", e.target.value)}
                  onBlur={() => handleFieldBlur("confirmPassword")}
                  className={`bg-input-background border-0 rounded-xl py-6 pr-10 ${
                    touched.confirmPassword && fieldErrors.confirmPassword ? "border-2 border-red-500" : ""
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirmPassword: !showPasswords.confirmPassword })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.confirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {touched.confirmPassword && fieldErrors.confirmPassword && (
                <FieldError error={fieldErrors.confirmPassword} />
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground rounded-xl py-6 text-base font-semibold hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs text-blue-800">
              <strong>🔒 Secure Registration:</strong> Only students can register publicly. 
              College admins are created by super admins. Role assignment is controlled server-side for security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
