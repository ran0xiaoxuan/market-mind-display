
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

const Index = () => {
  const { user } = useAuth();
  
  // If user is authenticated, show dashboard, otherwise redirect to login
  return user ? (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <Navigate to="/dashboard" />
    </div>
  ) : (
    <Navigate to="/login" />
  );
};

export default Index;
