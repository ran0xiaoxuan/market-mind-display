
import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "sonner";
import { supabase } from "./integrations/supabase/client";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Strategies from "./pages/Strategies";
import AIStrategy from "./pages/AIStrategy";
import Backtest from "./pages/Backtest";
import BacktestHistory from "./pages/BacktestHistory";
import EditStrategy from "./pages/EditStrategy";
import EditHistory from "./pages/EditHistory";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AITest from "./pages/AITest";
import StrategyDetail from "./pages/StrategyDetail";
import { useAuth } from "./contexts/AuthContext";

function App() {
  const { session } = useAuth();

  const ProtectedRoute = ({ children }) => {
    if (!session) {
      return <Navigate to="/login" />;
    }
    return <>{children}</>;
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/strategies" element={<Strategies />} />
          <Route path="/strategy/:id" element={<StrategyDetail />} />
          <Route path="/ai-strategy" element={<AIStrategy />} />
          <Route path="/backtest" element={<Backtest />} />
          <Route path="/backtest-history" element={<BacktestHistory />} />
          <Route path="/edit-strategy/:strategyId" element={<EditStrategy />} />
          <Route path="/edit-history/:id" element={<EditHistory />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ai-test" element={<AITest />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster richColors />
    </>
  );
}

export default App;
