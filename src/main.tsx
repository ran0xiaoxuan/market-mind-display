
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { BrowserRouter as Router } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider.tsx'

// Early guard: if arriving with recovery params, normalize path to /auth/reset-password
(() => {
  try {
    const { search, hash, pathname, origin } = window.location;
    const searchParams = new URLSearchParams(search);
    const hashParams = new URLSearchParams(hash ? hash.substring(1) : '');
    const typeParam = searchParams.get('type') || hashParams.get('type');
    const hasTokenHash = searchParams.has('token_hash') || hashParams.has('token_hash');
    const hasAccessRecoveryTokens = (hashParams.has('access_token') || searchParams.has('access_token')) && (typeParam === 'recovery');
    if ((typeParam === 'recovery' || hasTokenHash || hasAccessRecoveryTokens) && !pathname.startsWith('/auth/reset-password')) {
      const target = `${origin}/auth/reset-password${search}${hash}`;
      console.log('Early recovery redirect to:', target);
      window.history.replaceState(null, '', target);
    }
  } catch (e) {
    // no-op
  }
})();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  </React.StrictMode>
);
