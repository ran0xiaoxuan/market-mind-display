
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Strategies from "./pages/Strategies";
import StrategyDetail from "./pages/StrategyDetail";
import EditStrategy from "./pages/EditStrategy";
import Backtest from "./pages/Backtest";
import Analytics from "./pages/Analytics";
import AIStrategy from "./pages/AIStrategy";
import Settings from "./pages/Settings";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import { ThemeProvider } from "./components/ThemeProvider";
import EditHistory from "./pages/EditHistory";
import BacktestHistory from "./pages/BacktestHistory";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Auth Routes */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Signup />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              
              {/* Protected App Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              <Route path="/strategies" element={
                <ProtectedRoute>
                  <Strategies />
                </ProtectedRoute>
              } />
              <Route path="/strategy/:strategyId" element={
                <ProtectedRoute>
                  <StrategyDetail />
                </ProtectedRoute>
              } />
              <Route path="/strategy/:strategyId/edit" element={
                <ProtectedRoute>
                  <EditStrategy />
                </ProtectedRoute>
              } />
              <Route path="/strategy/:strategyId/history" element={
                <ProtectedRoute>
                  <EditHistory />
                </ProtectedRoute>
              } />
              <Route path="/strategy/:strategyId/backtests" element={
                <ProtectedRoute>
                  <BacktestHistory />
                </ProtectedRoute>
              } />
              <Route path="/backtest" element={
                <ProtectedRoute>
                  <Backtest />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/ai-strategy" element={
                <ProtectedRoute>
                  <AIStrategy />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
