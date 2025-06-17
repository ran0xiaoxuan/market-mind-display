
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Strategies from "@/pages/Strategies";
import StrategyDetail from "@/pages/StrategyDetail";
import EditStrategy from "@/pages/EditStrategy";
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
import Backtest from "@/pages/Backtest";
import StrategyPreview from "@/pages/StrategyPreview";
import Recommendations from "@/pages/Recommendations";
import AITest from "@/pages/AITest";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import PricingPage from "./pages/Pricing";

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/confirm" element={<Confirm />} />
          <Route path="/auth/confirmed" element={<Confirmed />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/strategies" element={<ProtectedRoute><Strategies /></ProtectedRoute>} />
          <Route path="/strategy/:id" element={<ProtectedRoute><StrategyDetail /></ProtectedRoute>} />
          <Route path="/strategies/:id" element={<ProtectedRoute><StrategyDetail /></ProtectedRoute>} />
          <Route path="/strategies/:id/edit" element={<ProtectedRoute><EditStrategy /></ProtectedRoute>} />
          <Route path="/strategy/:id/edit" element={<ProtectedRoute><EditStrategy /></ProtectedRoute>} />
          <Route path="/ai-strategy" element={<ProtectedRoute><AIStrategy /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/backtest" element={<ProtectedRoute><Backtest /></ProtectedRoute>} />
          <Route path="/strategy-preview" element={<ProtectedRoute><StrategyPreview /></ProtectedRoute>} />
          <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
          <Route path="/ai-test" element={<ProtectedRoute><AITest /></ProtectedRoute>} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
