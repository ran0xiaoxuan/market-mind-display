
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Confirm from "./pages/auth/Confirm";
import Dashboard from "./pages/Dashboard";
import Strategies from "./pages/Strategies";
import AIStrategy from "./pages/AIStrategy";
import AIStrategyV2 from "./pages/AIStrategyV2";
import StrategyDetail from "./pages/StrategyDetail";
import EditStrategy from "./pages/EditStrategy";
import EditHistory from "./pages/EditHistory";
import Backtest from "./pages/Backtest";
import BacktestHistory from "./pages/BacktestHistory";
import Recommendations from "./pages/Recommendations";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AITest from "./pages/AITest";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Signup />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/confirm" element={<Confirm />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/strategies" element={
                <ProtectedRoute>
                  <Strategies />
                </ProtectedRoute>
              } />
              
              <Route path="/ai-strategy" element={
                <ProtectedRoute>
                  <AIStrategy />
                </ProtectedRoute>
              } />
              
              <Route path="/ai-strategy-v2" element={
                <ProtectedRoute>
                  <AIStrategyV2 />
                </ProtectedRoute>
              } />
              
              <Route path="/strategy/:id" element={
                <ProtectedRoute>
                  <StrategyDetail />
                </ProtectedRoute>
              } />
              
              <Route path="/strategy/:id/edit" element={
                <ProtectedRoute>
                  <EditStrategy />
                </ProtectedRoute>
              } />
              
              <Route path="/strategy/:id/history" element={
                <ProtectedRoute>
                  <EditHistory />
                </ProtectedRoute>
              } />
              
              <Route path="/backtest" element={
                <ProtectedRoute>
                  <Backtest />
                </ProtectedRoute>
              } />
              
              <Route path="/backtest-history" element={
                <ProtectedRoute>
                  <BacktestHistory />
                </ProtectedRoute>
              } />
              
              <Route path="/recommendations" element={
                <ProtectedRoute>
                  <Recommendations />
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              
              <Route path="/ai-test" element={
                <ProtectedRoute>
                  <AITest />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
