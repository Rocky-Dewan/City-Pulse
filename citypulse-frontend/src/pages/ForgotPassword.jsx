import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// TASK 3: Forgot Password flow using supabase.auth.resetPasswordForEmail()
// Sends a magic reset link to the user's email.
// Supabase redirects to /reset-password with an access token in the URL.
// ─────────────────────────────────────────────────────────────────────────────

const ForgotPassword = () => {
  const { sendPasswordReset } = useAuth();
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Please enter your email.'); return; }

    setLoading(true);
    const { error } = await sendPasswordReset(email.trim().toLowerCase());
    if (error) {
      toast.error(error.message || 'Failed to send reset email.');
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-city-orange/10 border border-city-orange/20 mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="8" width="14" height="10" rx="2" stroke="#f97316" strokeWidth="1.5"/>
                <path d="M7 8V5a3 3 0 116 0v3" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-city-text">Forgot Password</h1>
            <p className="font-body text-sm text-city-subtext mt-1">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {sent ? (
            /* Success state */
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-city-green/10 border border-city-green/30 mb-2">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M6 14l5.5 5.5L22 8" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="font-display font-semibold text-city-text">Check your inbox!</p>
              <p className="font-body text-sm text-city-subtext">
                A reset link was sent to <span className="text-city-orange font-medium">{email}</span>.
                Check your spam folder if you don't see it.
              </p>
              <p className="font-mono text-xs text-city-muted">
                The link will expire in 1 hour.
              </p>
              <Link to="/login" className="btn-secondary w-full block text-center text-sm mt-4">
                ← Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-xs font-medium text-city-subtext uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  className="input-field"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending…</>
                  : 'Send Reset Link →'}
              </button>

              <p className="text-center font-body text-sm text-city-muted mt-4">
                Remember it?{' '}
                <Link to="/login" className="text-city-orange hover:text-city-orange-dim font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
