
import { Toaster } from "@/components/ui/toaster";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Confirm from "./pages/auth/Confirm";
import ForgotPassword from "./pages/auth/ForgotPassword";
import AuthCallback from "./pages/auth/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Strategies from "./pages/Strategies";
import StrategyDetail from "./pages/StrategyDetail";
import EditStrategy from "./pages/EditStrategy";
import Settings from "./pages/Settings";
import Backtest from "./pages/Backtest";
import Recommendations from "./pages/Recommendations";
import AIStrategy from "./pages/AIStrategy";
import StrategyPreview from "./pages/StrategyPreview";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Pricing from "./pages/Pricing";
import AITest from "./pages/AITest";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background font-sans antialiased">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/index" element={<Index />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/confirm" element={<Confirm />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/ai-test" element={<AITest />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/strategies"
                element={
                  <ProtectedRoute>
                    <Strategies />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/strategies/:id"
                element={
                  <ProtectedRoute>
                    <StrategyDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/strategies/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditStrategy />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/backtest"
                element={
                  <ProtectedRoute>
                    <Backtest />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recommendations"
                element={
                  <ProtectedRoute>
                    <Recommendations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai-strategy"
                element={
                  <ProtectedRoute>
                    <AIStrategy />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/strategy-preview"
                element={
                  <ProtectedRoute>
                    <StrategyPreview />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
