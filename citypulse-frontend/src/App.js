import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home           from './pages/Home';
import Login          from './pages/Login';
import Signup         from './pages/Signup';
import ReportIssue    from './pages/ReportIssue';
import AdminDashboard from './pages/AdminDashboard';
import ProfileSettings from './pages/ProfileSettings';
import ForgotPassword  from './pages/ForgotPassword';
import ResetPassword   from './pages/ResetPassword';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1e2e',
              color: '#e2e2f0',
              border: '1px solid #2a2a3d',
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#0d0d14' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#0d0d14' } },
          }}
        />

        <div className="min-h-screen bg-city-bg bg-grid">
          <Navbar />
          <main>
            <Routes>
              {/* Public */}
              <Route path="/"               element={<Home />} />
              <Route path="/login"          element={<Login />} />
              <Route path="/signup"         element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password"  element={<ResetPassword />} />

              {/* Authenticated */}
              <Route path="/report" element={
                <ProtectedRoute><ReportIssue /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute><ProfileSettings /></ProtectedRoute>
              } />

              {/* Admin-only */}
              <Route path="/admin" element={
                <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
