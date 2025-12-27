import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "../context/AuthContext";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Landing Page - Has its own header/footer */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth Routes - No Header/Footer */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
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
      </AuthProvider>
    </BrowserRouter>
  );
}
