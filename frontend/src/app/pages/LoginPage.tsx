import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [colleges, setColleges] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [college, setCollege] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch colleges on mount
  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/colleges/public');
      if (!response.ok) {
        console.error('Failed to fetch colleges');
        return;
      }
      const data = await response.json();
      if (data.success && data.data) {
        setColleges(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch colleges:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    setLoading(true);

    // Pass collegeId if selected
    const loginData: any = { email, password };
    if (college) {
      loginData.collegeId = parseInt(college);
    }

    const result = await login(loginData);
    
    setLoading(false);
    
    if (result.success) {
      // Get user from localStorage (set by AuthContext)
      const storedUser = sessionStorage.getItem('user');
      if (!storedUser) {
        setError("Login failed - user data not found");
        return;
      }

      const user = JSON.parse(storedUser);
      
      // CRITICAL: College admins and students MUST select college
      if ((user.role === 'COLLEGE_ADMIN' || user.role === 'STUDENT') && !college) {
        setError("College admins and students must select their college");
        // Logout the user since they didn't select college
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('user');
        return;
      }

      // Validate that selected college matches user's college
      if (college && user.collegeId && parseInt(college) !== user.collegeId) {
        setError("Selected college does not match your account");
        // Logout the user
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('user');
        return;
      }

      // Store selected college for UI reference (if any)
      if (college) {
        localStorage.setItem('selected_college', college);
      }
      
      // Show success toast
      toast.success("Login successful!", {
        description: `Welcome back, ${user.username || user.email}!`,
        duration: 5000,
        className: "text-lg py-4",
        style: {
          fontSize: "16px",
          padding: "20px",
        },
      });
      
      navigate("/dashboard");
    } else {
      // Check if user needs to verify email
      if ((result as any).requiresVerification && (result as any).email) {
        setError(result.error + " Redirecting to verification...");
        setTimeout(() => {
          navigate("/verify-otp", { 
            state: { 
              email: (result as any).email,
              purpose: "REGISTER"
            } 
          });
        }, 2000);
      } else {
        setError(result.error || "Login failed");
      }
    }
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
            <h1 className="text-3xl font-bold mb-6">Select your college</h1>
            <Select value={college} onValueChange={setCollege}>
              <SelectTrigger className="w-full bg-input-background border-0 rounded-xl py-6">
                <SelectValue placeholder="Choose your academic institution.." />
              </SelectTrigger>
              <SelectContent>
                {colleges.length === 0 ? (
                  <SelectItem value="loading" disabled>Loading colleges...</SelectItem>
                ) : (
                  colleges.map((col) => (
                    <SelectItem key={col.id} value={col.id.toString()}>
                      {col.name} ({col.code})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-2">Note: Super admins can skip college selection</p>
          </div>

          {/* Login Form */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Login to LearnBox</h2>
            <p className="text-muted-foreground text-sm">
              Enter your credentials to access your account.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input-background border-0 rounded-xl py-6"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="....."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-input-background border-0 rounded-xl py-6"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-accent hover:bg-accent/90 text-white rounded-xl py-6 mt-6"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/forgot-password"
                className="text-sm text-foreground hover:underline"
              >
                Forgot your password?
              </Link>
            </div>

            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="text-accent font-semibold hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-white text-sm">
        2025 LearnBox. All rights reserved.
      </div>
    </div>
  );
}
