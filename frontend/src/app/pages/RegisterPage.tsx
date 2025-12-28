import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAuth } from "../../context/AuthContext";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    // Validate college selection
    if (!formData.collegeId) {
      setError("Please select your college");
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    // Split full name into first and last name
    const nameParts = formData.fullName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const result = await register({
      username: formData.username,
      email: formData.email,
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
    setFormData(prev => ({ ...prev, [field]: value }));
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
            <Select value={formData.collegeId} onValueChange={(val) => updateField("collegeId", val)}>
              <SelectTrigger className="w-full bg-input-background border-0 rounded-xl py-6">
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
                placeholder="enter your username"
                value={formData.username}
                onChange={(e) => updateField("username", e.target.value)}
                className="bg-input-background border-0 rounded-xl py-6"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-semibold">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="enter your full name"
                value={formData.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                className="bg-input-background border-0 rounded-xl py-6"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="bg-input-background border-0 rounded-xl py-6"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="password"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                className="bg-input-background border-0 rounded-xl py-6"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="confirm password"
                value={formData.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                className="bg-input-background border-0 rounded-xl py-6"
                required
              />
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
