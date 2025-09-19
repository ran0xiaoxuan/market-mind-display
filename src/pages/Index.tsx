
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  // Recovery guard: support query and hash; also handle access_token + type=recovery
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  const searchParams = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash ? hash.substring(1) : '');
  const typeParam = searchParams.get('type') || hashParams.get('type');
  const hasTokenHash = searchParams.has('token_hash') || hashParams.has('token_hash');
  const hasAccessRecoveryTokens = (hashParams.has('access_token') || searchParams.has('access_token')) && (typeParam === 'recovery');
  if (typeParam === 'recovery' || hasTokenHash || hasAccessRecoveryTokens) {
    return <Navigate to={`/auth/reset-password${search}${hash}`} replace />;
  }

  // If user is authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" />;
  }

  // If user is not authenticated, redirect to signup
  return <Navigate to="/signup" />;
};

export default Index;
