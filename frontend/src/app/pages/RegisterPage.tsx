import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAuth } from "../../context/AuthContext";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    college: "",
    username: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
    });
    
    setLoading(false);
    
    if (result.success) {
      navigate("/login");
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
            <h1 className="text-3xl font-bold mb-6">Select your college</h1>
            <Select value={formData.college} onValueChange={(val) => updateField("college", val)}>
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

          {/* Registration Form */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Create New Account</h2>
            <p className="text-muted-foreground text-sm">
              Join LearnBox and unlock your academic potential.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={formData.username}
                onChange={(e) => updateField("username", e.target.value)}
                className="bg-input-background border-0 rounded-xl py-6"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-semibold">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder=""
                value={formData.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                className="bg-input-background border-0 rounded-xl py-6"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
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
              <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="....."
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                className="bg-input-background border-0 rounded-xl py-6"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="....."
                value={formData.confirmPassword}
                onChange={(e) => updateField("confirmPassword", e.target.value)}
                className="bg-input-background border-0 rounded-xl py-6"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-accent hover:bg-accent/90 text-white rounded-xl py-6 mt-6"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Register"}
            </Button>

            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-accent font-semibold hover:underline">
                  Sign in
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
