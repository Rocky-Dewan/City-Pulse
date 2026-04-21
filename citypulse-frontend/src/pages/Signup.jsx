import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// BUG FIX (Task 1): InputField is defined OUTSIDE the Signup function scope.
// Previously it was inside Signup, causing React to treat it as a NEW component
// on every render — every keystroke would unmount/remount the input, losing focus.
// Hoisting it here gives it a stable reference between renders.
// ─────────────────────────────────────────────────────────────────────────────
const InputField = ({ id, label, type = 'text', placeholder, value, onChange, autoComplete }) => (
  <div>
    <label htmlFor={id} className="block font-body text-xs font-medium text-city-subtext uppercase tracking-wider mb-1.5">
      {label}
    </label>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      className="input-field"
      required
    />
  </div>
);

const Signup = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '', username: '', email: '', password: '', confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    if (!form.fullName || !form.username || !form.email || !form.password) {
      toast.error('Please fill in all fields.'); return false;
    }
    if (form.username.length < 3) {
      toast.error('Username must be at least 3 characters.'); return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      toast.error('Username can only contain letters, numbers, and underscores.'); return false;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.'); return false;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.'); return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const { error } = await signUp(form.email, form.password, form.username, form.fullName);
    if (error) {
      toast.error(error.message || 'Sign up failed.');
    } else {
      toast.success('Account created! Check your email to confirm, then sign in.', { duration: 6000 });
      navigate('/login');
    }
    setLoading(false);
  };

  const strengthScore = (() => {
    const p = form.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  })();
  const strengthColors = ['bg-city-red', 'bg-city-amber', 'bg-city-amber', 'bg-city-green', 'bg-city-green'];

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-slide-up">
        <div className="card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-city-orange/10 border border-city-orange/20 mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="7" r="3.5" stroke="#f97316" strokeWidth="1.5" />
                <path d="M10 12.5c-3.866 0-7 1.567-7 3.5" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M14 12v4M12 14h4" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold text-city-text">Join CityPulse</h1>
            <p className="font-body text-sm text-city-subtext mt-1">Help make your city better</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <InputField id="fullName" label="Full Name" placeholder="Rocky Dewan" value={form.fullName} onChange={set('fullName')} autoComplete="name" />
              <InputField id="username" label="Username" placeholder="Rock_y" value={form.username} onChange={set('username')} autoComplete="username" />
            </div>

            <InputField id="email" label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" />

            {/* Password with strength bar */}
            <div>
              <label className="block font-body text-xs font-medium text-city-subtext uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                  className="input-field pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-city-muted hover:text-city-subtext"
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
              {form.password && (
                <div className="mt-1.5 flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strengthScore ? strengthColors[strengthScore] : 'bg-city-border'
                      }`} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block font-body text-xs font-medium text-city-subtext uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  autoComplete="new-password"
                  className="input-field pr-10"
                  required
                />
                <button type="button" onClick={() => setShowConfirmPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-city-muted hover:text-city-subtext"
                  tabIndex={-1}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2" />
                    {showConfirmPass
                      ? <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      : <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" />
                    }
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account…</>
              ) : 'Create account →'}
            </button>
          </form>

          <p className="text-center font-body text-sm text-city-muted mt-6">
            Already a member?{' '}
            <Link to="/login" className="text-city-orange hover:text-city-orange-dim font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
