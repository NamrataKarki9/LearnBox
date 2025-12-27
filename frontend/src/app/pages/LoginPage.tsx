import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAuth } from "../../context/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [college, setCollege] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login({ email, password });
    
    setLoading(false);
    
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Login failed");
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
                <SelectItem value="university-a">University A</SelectItem>
                <SelectItem value="university-b">University B</SelectItem>
                <SelectItem value="college-c">College C</SelectItem>
                <SelectItem value="institute-d">Institute D</SelectItem>
              </SelectContent>
            </Select>
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
