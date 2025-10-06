
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { RecoveryGuard } from "@/components/RecoveryGuard";
import ErrorBoundary from "@/components/ErrorBoundary";

import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Strategies from "@/pages/Strategies";
import StrategyDetail from "@/pages/StrategyDetail";
import EditStrategy from "@/pages/EditStrategy";
import ManualStrategy from "@/pages/ManualStrategy";
import AIStrategy from "@/pages/AIStrategy";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import Confirm from "@/pages/auth/Confirm";
import Confirmed from "@/pages/auth/Confirmed";
import AuthCallback from "@/pages/auth/AuthCallback";
import ResetPassword from "@/pages/auth/ResetPassword";
import StrategyPreview from "@/pages/StrategyPreview";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import OptimizedDashboard from "@/pages/OptimizedDashboard";
import OptimizedStrategies from "@/pages/OptimizedStrategies";
import Recommendation from "@/pages/Recommendation";
import RecommendationDetail from "@/pages/RecommendationDetail";
import PublicRecommendation from "@/pages/PublicRecommendation";
import PublicStrategy from "@/pages/PublicStrategy";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RecoveryGuard />
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/confirm" element={<Confirm />} />
          <Route path="/auth/confirmed" element={<Confirmed />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <OptimizedDashboard />
            </ProtectedRoute>
          } />
          <Route path="/strategies" element={
            <ProtectedRoute>
              <OptimizedStrategies />
            </ProtectedRoute>
          } />
          <Route path="/recommendation" element={
            <ProtectedRoute>
              <Recommendation />
            </ProtectedRoute>
          } />
          <Route path="/recommendation/:id" element={
            <ProtectedRoute>
              <RecommendationDetail />
            </ProtectedRoute>
          } />
          <Route path="/recommendations" element={
            <ProtectedRoute>
              <Recommendation />
            </ProtectedRoute>
          } />
          <Route path="/recommendations/:id" element={
            <ProtectedRoute>
              <RecommendationDetail />
            </ProtectedRoute>
          } />
          <Route path="/strategy/:id" element={<ProtectedRoute><StrategyDetail /></ProtectedRoute>} />
          <Route path="/strategies/:id" element={<ProtectedRoute><StrategyDetail /></ProtectedRoute>} />
          <Route path="/strategies/:id/edit" element={<ProtectedRoute><EditStrategy /></ProtectedRoute>} />
          <Route path="/strategy/:id/edit" element={<ProtectedRoute><EditStrategy /></ProtectedRoute>} />
          <Route path="/manual-strategy" element={<ProtectedRoute><ManualStrategy /></ProtectedRoute>} />
          <Route path="/ai-strategy" element={<ProtectedRoute><AIStrategy /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/strategy-preview" element={<ProtectedRoute><StrategyPreview /></ProtectedRoute>} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />

          {/* Public shareable routes */}
          <Route path="/p/recommendations/:id" element={<PublicRecommendation />} />
          <Route path="/p/strategies/:id" element={<PublicStrategy />} />

          <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
