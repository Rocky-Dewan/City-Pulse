// client/src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getTokenPayload, isLoggedIn, isAdmin, logout } from "../utils/auth";

export default function Navbar({ onSearch = () => { } }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const payload = getTokenPayload();
    if (payload) setUser({ name: payload.name || "", role: payload.role || "user" });
    else setUser(null);
  }, [isLoggedIn()]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => onSearch(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q, onSearch]);

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  return (
    <header className="bg-black/50 backdrop-blur-md border-b border-gray-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo + Search */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-cyan-400 to-purple-500 text-white rounded-md px-3 py-1 font-bold shadow-lg shadow-purple-500/50 hover:scale-105 transition-transform">
                CityPulse
              </div>
              <span className="text-sm text-gray-300 hidden sm:inline">
                Report & Resolve — your city
              </span>
            </Link>

            {/* Desktop Search */}
            <div className="hidden md:block">
              <div className="flex items-center bg-white/10 backdrop-blur-md rounded-full px-3 py-1 border border-white/20">
                <input
                  aria-label="Search reports"
                  className="bg-transparent outline-none text-sm w-64 text-white placeholder-gray-300"
                  placeholder="Search by title or category..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <button
                  onClick={() => onSearch(q.trim())}
                  className="ml-2 px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-pink-500 hover:to-purple-500 transition-all shadow-md shadow-pink-500/40"
                  aria-label="Search"
                >
                  🔎
                </button>
              </div>
            </div>
          </div>

          {/* Nav Links & User */}
          <nav className="flex items-center gap-3">

            {/* Desktop Links */}
            <div className="hidden sm:flex items-center gap-3">
              <Link className="px-3 py-1 rounded-lg text-white hover:text-cyan-400 hover:underline transition-colors" to="/">Home</Link>
              <Link className="px-3 py-1 rounded-lg text-white hover:text-green-400 hover:underline transition-colors" to="/create">Report</Link>
              {isAdmin() && (
                <Link className="px-3 py-1 rounded-lg text-white bg-purple-600 hover:bg-purple-500 transition-colors font-semibold" to="/admin">
                  Admin
                </Link>
              )}
            </div>

            {/* Mobile menu toggle */}
            <div className="sm:hidden">
              <button onClick={() => setOpen(o => !o)} aria-label="Open menu" className="p-2 rounded-md text-white hover:text-cyan-400 transition-colors">
                {open ? "✖" : "☰"}
              </button>
            </div>

            {/* User auth buttons */}
            <div className="ml-2">
              {!isLoggedIn() ? (
                <div className="hidden sm:flex gap-2">
                  <Link className="px-3 py-1 rounded-lg text-white hover:text-cyan-400 transition-colors" to="/login">Login</Link>
                  <Link className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold shadow-lg shadow-pink-500/40 hover:from-pink-500 hover:to-purple-500 transition-transform" to="/signup">Signup</Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end text-right hidden sm:block">
                    <span className="text-sm font-medium text-white">{user?.name || "You"}</span>
                    <span className="text-xs text-gray-300">{user?.role === "admin" ? "Administrator" : "Citizen"}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-9 h-9 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-sm font-semibold text-white shadow-lg shadow-pink-500/50 hover:scale-110 transition-transform"
                    title="Logout"
                  >
                    {initials}
                  </button>
                </div>
              )}
            </div>

          </nav>
        </div>

        {/* Mobile Menu Panel */}
        {open && (
          <div className="sm:hidden pb-4 mt-2 bg-black/50 backdrop-blur-md rounded-xl border border-white/20 shadow-lg">
            <div className="flex flex-col gap-2 mt-3 px-2">
              <input
                aria-label="Search reports mobile"
                className="px-3 py-2 rounded-lg bg-white/10 text-white placeholder-gray-300 outline-none backdrop-blur-md"
                placeholder="Search..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Link onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-white hover:text-cyan-400 transition-colors" to="/">Home</Link>
              <Link onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-white hover:text-green-400 transition-colors" to="/create">Report</Link>
              {isAdmin() && (
                <Link onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-white bg-purple-600 hover:bg-purple-500 transition-colors font-semibold">Admin</Link>
              )}
              {!isLoggedIn() ? (
                <>
                  <Link onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg text-white hover:text-cyan-400 transition-colors" to="/login">Login</Link>
                  <Link onClick={() => setOpen(false)} className="px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg shadow-pink-500/40 hover:from-pink-500 hover:to-purple-500 transition-transform" to="/signup">Signup</Link>
                </>
              ) : (
                <button onClick={handleLogout} className="px-3 py-2 text-left text-white rounded-lg hover:text-red-400 transition-colors">Logout</button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
