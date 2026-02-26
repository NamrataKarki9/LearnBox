import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { VerifyOTPPage } from "./pages/VerifyOTPPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import StudentDashboard from "./pages/StudentDashboard";
import StudentResourcesPage from "./pages/StudentResourcesPage";
import StudentSettingsPage from "./pages/StudentSettingsPage";
import Summaries from "./pages/Summaries";
import MCQPracticeSelectionPage from "./pages/MCQPracticeSelectionPage";
import MCQPracticePage from "./pages/MCQPracticePage";
import MCQHistoryPage from "./pages/MCQHistoryPage";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "../context/AuthContext";
import { FilterProvider } from "../context/FilterContext";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FilterProvider>
          <Toaster 
          position="top-right"
          expand={true}
          richColors
          toastOptions={{
            style: {
              fontSize: "16px",
              padding: "20px",
              minWidth: "350px",
            },
          }}
        />
        <Routes>
          {/* Landing Page - Has its own header/footer */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth Routes - No Header/Footer */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOTPPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/resources"
            element={
              <ProtectedRoute>
                <StudentResourcesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/summaries"
            element={
              <ProtectedRoute>
                <Summaries />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/mcq-practice"
            element={
              <ProtectedRoute>
                <MCQPracticeSelectionPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/practice"
            element={
              <ProtectedRoute>
                <MCQPracticePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/history"
            element={
              <ProtectedRoute>
                <MCQHistoryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/settings"
            element={
              <ProtectedRoute>
                <StudentSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - Nested routing */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Route */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Placeholder Routes */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl mb-4 text-primary">Page Not Found</h1>
                    <p className="text-muted-foreground mb-6">
                      The page you're looking for doesn't exist.
                    </p>
                    <a href="/" className="text-primary hover:underline">
                      Return to Home
                    </a>
                  </div>
                </main>
                <Footer />
              </div>
            }
          />
        </Routes>
        </FilterProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
