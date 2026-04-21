import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// TASK 4: Phone OTP auth added alongside existing email/password flow.
// Three tabs: Email | Phone (OTP) flow; phone flow has send + verify steps.
// ─────────────────────────────────────────────────────────────────────────────

const TAB_EMAIL = 'email';
const TAB_PHONE = 'phone';

const Login = () => {
  const { signIn, sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Email tab state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Phone tab state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [tab, setTab] = useState(TAB_EMAIL);
  const [loading, setLoading] = useState(false);

  // ── Email Sign In ──────────────────────────────────────────────────────────
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields.'); return; }
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message || 'Sign in failed.');
    } else {
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    }
    setLoading(false);
  };

  // ── Phone: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone.trim()) { toast.error('Enter your phone number.'); return; }
    const cleaned = phone.trim().replace(/\s+/g, '');
    if (!/^\+[1-9]\d{6,14}$/.test(cleaned)) {
      toast.error('Use international format: +8801XXXXXXXXX'); return;
    }
    setLoading(true);
    const { error } = await sendPhoneOtp(cleaned);
    if (error) {
      toast.error(error.message || 'Failed to send OTP.');
    } else {
      setOtpSent(true);
      toast.success(`OTP sent to ${cleaned}`);
    }
    setLoading(false);
  };

  // ── Phone: Verify OTP ─────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 6) {
      toast.error('Enter the 6-digit OTP from your SMS.'); return;
    }
    setLoading(true);
    const { error } = await verifyPhoneOtp(phone.trim(), otp.trim());
    if (error) {
      toast.error(error.message || 'Invalid OTP. Try again.');
    } else {
      toast.success('Signed in successfully!');
      navigate(from, { replace: true });
    }
    setLoading(false);
  };

  const switchTab = (t) => {
    setTab(t);
    setOtpSent(false);
    setOtp('');
    setPhone('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">

        <div className="card border-city-border/80">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-city-orange/10 border border-city-orange/20 mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="7" r="3.5" stroke="#f97316" strokeWidth="1.5" />
                <path d="M3 17c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-city-text">Welcome back</h1>
            <p className="font-body text-sm text-city-subtext mt-1">Sign in to your CityPulse account</p>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-city-surface border border-city-border rounded-lg p-1 mb-6">
            {[
              { key: TAB_EMAIL, label: '✉ Email' },
              { key: TAB_PHONE, label: '📱 Phone OTP' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => switchTab(key)}
                className={`flex-1 py-2 rounded-md text-xs font-mono font-medium transition-all ${tab === key
                    ? 'bg-city-orange text-white shadow'
                    : 'text-city-subtext hover:text-city-text'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Email Form ─────────────────────────────────────────────────── */}
          {tab === TAB_EMAIL && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-xs font-medium text-city-subtext uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-body text-xs font-medium text-city-subtext uppercase tracking-wider">
                    Password
                  </label>
                  <Link to="/forgot-password" className="font-body text-xs text-city-orange hover:text-city-orange-dim transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-city-muted hover:text-city-subtext transition-colors"
                    tabIndex={-1}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2" />
                      {showPass
                        ? <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        : <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
                      }
                    </svg>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</>
                  : 'Sign in →'}
              </button>
            </form>
          )}

          {/* ── Phone OTP Form ─────────────────────────────────────────────── */}
          {tab === TAB_PHONE && (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block font-body text-xs font-medium text-city-subtext uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+8801XXXXXXXXX"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="input-field"
                      required
                    />
                    <p className="font-mono text-[11px] text-city-muted mt-1">
                      Include country code, e.g. +880 for Bangladesh
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending OTP…</>
                      : 'Send OTP →'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="px-4 py-3 rounded-xl bg-city-green/5 border border-city-green/20">
                    <p className="font-body text-sm text-city-green font-medium">OTP sent!</p>
                    <p className="font-mono text-xs text-city-muted mt-0.5">Check your SMS at {phone}</p>
                  </div>

                  <div>
                    <label className="block font-body text-xs font-medium text-city-subtext uppercase tracking-wider mb-1.5">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="6-digit code"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="input-field text-center font-mono text-xl tracking-widest"
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {loading
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying…</>
                      : 'Verify & Sign In →'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                    className="w-full text-center font-body text-xs text-city-muted hover:text-city-subtext"
                  >
                    ← Change number
                  </button>
                </form>
              )}
            </div>
          )}

          <p className="text-center font-body text-sm text-city-muted mt-6">
            No account?{' '}
            <Link to="/signup" className="text-city-orange hover:text-city-orange-dim font-medium transition-colors">
              Create one free
            </Link>
          </p>
        </div>

        {/* <p className="text-center font-mono text-xs text-city-muted mt-4 px-4">
          💡 First signup? Promote yourself to admin in Supabase:{' '}
          <code className="bg-city-card px-1 rounded">UPDATE profiles SET role = 'admin'</code>
        </p> */}
      </div>
    </div>
  );
};

export default Login;
