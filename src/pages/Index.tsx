
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getDomainConfig, redirectToAppDomain } from "@/lib/domain";
import Landing from "./Landing";

const Index = () => {
  const { user } = useAuth();
  const domainConfig = getDomainConfig();

  // If user is authenticated and we're on landing domain, redirect to app domain
  if (user && domainConfig.hostname.includes('www.') && !domainConfig.hostname.includes('localhost')) {
    redirectToAppDomain();
    return null;
  }

  // If user is authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  // If user is not authenticated, show landing page
  return <Landing />;
};

export default Index;
