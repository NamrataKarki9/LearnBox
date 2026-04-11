import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { VerifyOTPPage } from "./pages/VerifyOTPPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import InvitationAcceptPage from "./pages/InvitationAcceptPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { HelpPage } from "./pages/HelpPage";
import DashboardPage from "./pages/DashboardPage";
import StudentDashboard from "./pages/StudentDashboard";
import StudentResourcesPage from "./pages/StudentResourcesPage";
import StudentLearningSitesPage from "./pages/StudentLearningSitesPage";
import StudentSettingsPage from "./pages/StudentSettingsPage";
import Summaries from "./pages/Summaries";
import MCQPracticeSelectionPage from "./pages/MCQPracticeSelectionPage";
import MCQPracticePage from "./pages/MCQPracticePage";
import MCQHistoryPage from "./pages/MCQHistoryPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminSettingsPage from "./pages/SuperAdminSettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, ROLES } from "../context/AuthContext";
import { FilterProvider } from "../context/FilterContext";
import { Toaster } from "./components/ui/sonner";
import {
  applyTheme,
  getStoredAdminTheme,
  getStoredStudentTheme,
} from "../utils/theme";

function ThemeSync() {
  const location = useLocation();

  useEffect(() => {
    const syncTheme = () => {
      const pathname = window.location.pathname;

      if (pathname.startsWith("/admin")) {
        applyTheme(getStoredAdminTheme());
        return;
      }

      if (pathname.startsWith("/student")) {
        applyTheme(getStoredStudentTheme());
        return;
      }

      applyTheme("light");
    };

    syncTheme();
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, [location.pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeSync />
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

          {/* Info Pages - Has their own header/footer  */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/help" element={<HelpPage />} />

          {/* Auth Routes - No Header/Footer */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOTPPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/invitation/accept" element={<InvitationAcceptPage />} />

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
              <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                <StudentResourcesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/summaries"
            element={
              <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                <Summaries />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/learning-sites"
            element={
              <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                <StudentLearningSitesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/mcq-practice"
            element={
              <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                <MCQPracticeSelectionPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/practice"
            element={
              <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                <MCQPracticePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/history"
            element={
              <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                <MCQHistoryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/settings"
            element={
              <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                <StudentSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Settings - Standalone (no sidebar) */}
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={[ROLES.COLLEGE_ADMIN]}>
                <AdminSettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - Nested routing */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={[ROLES.COLLEGE_ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Route */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/dashboard"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/settings"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <SuperAdminSettingsPage />
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
