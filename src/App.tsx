
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            
            {/* App Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/strategy/:strategyId" element={<StrategyDetail />} />
            <Route path="/strategy/:strategyId/edit" element={<EditStrategy />} />
            <Route path="/backtest" element={<Backtest />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/ai-strategy" element={<AIStrategy />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
