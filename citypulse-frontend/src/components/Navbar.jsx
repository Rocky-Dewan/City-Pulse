import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CityIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2"  y="14" width="5" height="12" fill="#f97316"/>
    <rect x="9"  y="9"  width="5" height="17" fill="#f97316" opacity="0.8"/>
    <rect x="16" y="6"  width="5" height="20" fill="#f97316"/>
    <rect x="23" y="12" width="3" height="14" fill="#f97316" opacity="0.6"/>
    <rect x="0"  y="25" width="28" height="1" fill="#f97316" opacity="0.4"/>
    <rect x="10" y="17" width="1.5" height="2.5" fill="#0d0d14"/>
    <rect x="12.5" y="17" width="1.5" height="2.5" fill="#0d0d14"/>
    <rect x="17" y="14" width="1.5" height="2.5" fill="#f59e0b"/>
    <rect x="19.5" y="14" width="1.5" height="2.5" fill="#0d0d14"/>
  </svg>
);

const Navbar = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userMenuOpen]);

  // ── BUG FIX (Task 1): Redirect to /login, not '/', after sign out ──────────
  const handleSignOut = async () => {
    await signOut();                     // clears user + profile state first
    toast.success('Signed out.');
    navigate('/login', { replace: true });
    setMenuOpen(false);
    setUserMenuOpen(false);
  };

  const navLinks = [
    { to: '/',       label: 'Feed' },
    ...(user ? [{ to: '/report', label: '+ Report Issue' }] : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const displayName = profile?.username || user?.email?.split('@')[0] || 'Account';

  return (
    <nav className="sticky top-0 z-50 border-b border-city-border bg-city-bg/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <CityIcon />
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-lg text-city-text tracking-tight group-hover:text-city-orange transition-colors">
                CityPulse
              </span>
              <span className="font-mono text-[9px] text-city-muted tracking-widest uppercase">
                Urban Reports
              </span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-lg font-body text-sm font-medium transition-all duration-200 ${
                  isActive(to)
                    ? 'bg-city-orange/10 text-city-orange'
                    : 'text-city-subtext hover:text-city-text hover:bg-city-card'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Auth area */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                {/* User pill — clicking opens dropdown */}
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-city-card border border-city-border rounded-lg hover:border-city-orange/30 transition-colors"
                >
                  {/* Avatar */}
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="orange-dot" />
                  )}
                  <span className="font-body text-sm text-city-subtext">{displayName}</span>
                  {isAdmin && (
                    <span className="badge bg-city-amber/10 text-city-amber border border-city-amber/20 text-[10px] py-0.5">
                      ADMIN
                    </span>
                  )}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`text-city-muted transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}>
                    <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-city-card border border-city-border rounded-xl shadow-card overflow-hidden animate-fade-in z-50">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-city-subtext hover:text-city-text hover:bg-city-surface transition-colors font-body"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      Profile Settings
                    </Link>
                    <div className="border-t border-city-border" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-city-red hover:bg-city-red/5 transition-colors font-body text-left"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M5 2H2v10h3M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"  className="btn-ghost text-sm">Sign in</Link>
                <Link to="/signup" className="btn-primary text-sm py-2">Join free</Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-city-subtext hover:text-city-text"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-city-border py-3 animate-fade-in">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg font-body text-sm transition-colors ${
                  isActive(to)
                    ? 'text-city-orange bg-city-orange/10'
                    : 'text-city-subtext hover:text-city-text hover:bg-city-card'
                }`}
              >
                {label}
              </Link>
            ))}

            {user && (
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-lg font-body text-sm text-city-subtext hover:text-city-text hover:bg-city-card transition-colors"
              >
                ⚙️ Profile Settings
              </Link>
            )}

            <div className="border-t border-city-border mt-3 pt-3 flex items-center gap-2">
              {user ? (
                <button onClick={handleSignOut} className="w-full btn-secondary text-sm py-2">
                  Sign Out
                </button>
              ) : (
                <>
                  <Link to="/login"  onClick={() => setMenuOpen(false)} className="flex-1 btn-secondary text-sm py-2 text-center">Sign in</Link>
                  <Link to="/signup" onClick={() => setMenuOpen(false)} className="flex-1 btn-primary  text-sm py-2 text-center">Join free</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
