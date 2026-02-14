import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription } from "../components/ui/alert";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/verify-registration-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens
        sessionStorage.setItem("access_token", data.tokens.access);
        sessionStorage.setItem("refresh_token", data.tokens.refresh);
        sessionStorage.setItem("user", JSON.stringify(data.user));

        setSuccess("Email verified successfully! Redirecting to dashboard...");
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        setError(data.error || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, purpose })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("OTP has been resent to your email");
      } else {
        setError(data.error || "Failed to resend OTP");
      }
    } catch (error) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
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
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">Verify Your Email</h1>
            <p className="text-muted-foreground text-sm">
              We've sent a 6-digit verification code to
            </p>
            <p className="text-sm font-semibold mt-1">{email}</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-semibold">
                Enter OTP
              </Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="bg-input-background border-0 rounded-xl py-6 text-center text-2xl tracking-widest"
                maxLength={6}
                required
              />
              <p className="text-xs text-muted-foreground text-center">
                OTP expires in 10 minutes
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-accent hover:bg-accent/90 text-white rounded-xl py-6"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Verify Email"}
            </Button>

            <div className="text-center pt-2">
              <p className="text-sm text-muted-foreground mb-2">
                Didn't receive the code?
              </p>
              <Button
                type="button"
                variant="link"
                onClick={handleResendOTP}
                disabled={resending}
                className="text-accent font-semibold"
              >
                {resending ? "Sending..." : "Resend OTP"}
              </Button>
            </div>

            <div className="text-center pt-2">
              <Link to="/login" className="text-sm text-muted-foreground hover:underline">
                Back to Login
              </Link>
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
