
import Dashboard from "./Dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  
  // If user is authenticated, show dashboard, otherwise redirect to login
  return user ? <Dashboard /> : <Navigate to="/auth/login" />;
};

export default Index;
