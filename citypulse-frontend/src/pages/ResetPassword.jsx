import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// TASK 3: Reset Password page — the destination after clicking the email link.
// Supabase embeds tokens in the URL hash (#access_token=...&type=recovery).
// The Supabase client auto-parses these and fires an onAuthStateChange event
// with type PASSWORD_RECOVERY. We listen for that event, then show the form.
// ─────────────────────────────────────────────────────────────────────────────

const ResetPassword = () => {
  const navigate = useNavigate();

  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [ready,           setReady]           = useState(false); // true once recovery session active
  const [done,            setDone]            = useState(false);
  const [error,           setError]           = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!ready) setError('Invalid or expired reset link. Please request a new one.');
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
        clearTimeout(timeout);
      }
    });

    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.'); return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.'); return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      setError(updateError.message);
      toast.error(updateError.message || 'Failed to update password.');
    } else {
      setDone(true);
      toast.success('Password updated! Redirecting to sign in…', { duration: 3000 });
      setTimeout(() => navigate('/login'), 3000);
    }
    setLoading(false);
  };

  // Show loading/error while waiting for recovery session
  if (!ready) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          {error ? (
            <>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-city-red/10 border border-city-red/20 mb-2">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2l8 14H2L10 2z" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M10 8v4M10 14.5v.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="font-body text-sm text-city-red">{error}</p>
              <a href="/forgot-password" className="btn-primary inline-block text-sm mt-2">Request New Link</a>
            </>
          ) : (
            <>
              <div className="w-10 h-10 border-2 border-city-orange border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-body text-sm text-city-subtext">Verifying reset link…</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="card">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-city-orange/10 border border-city-orange/20 mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" stroke="#f97316" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-city-text">Set New Password</h1>
            <p className="font-body text-sm text-city-subtext mt-1">Choose a strong, new password.</p>
          </div>

          {done ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-city-green/10 border border-city-green/30 mb-2">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M6 14l5.5 5.5L22 8" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="font-display font-semibold text-city-text">Password updated!</p>
              <p className="font-body text-sm text-city-subtext">Redirecting you to sign in…</p>
              <Link to="/login" className="btn-primary block text-center text-sm mt-2">
                Sign In Now →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-city-red/5 border border-city-red/30">
                  <p className="font-body text-sm text-city-red">{error}</p>
                </div>
              )}

              <div>
                <label className="block font-body text-xs font-medium text-city-subtext uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="input-field"
                  autoComplete="new-password"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-body text-xs font-medium text-city-subtext uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="input-field"
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating…</>
                  : 'Update Password →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
