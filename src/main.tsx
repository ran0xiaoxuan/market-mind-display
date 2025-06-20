
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { AuthNavigationHandler } from './components/AuthNavigationHandler.tsx'
import { BrowserRouter as Router } from 'react-router-dom'

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <AuthNavigationHandler>
          <App />
        </AuthNavigationHandler>
      </AuthProvider>
    </Router>
  </React.StrictMode>
);
