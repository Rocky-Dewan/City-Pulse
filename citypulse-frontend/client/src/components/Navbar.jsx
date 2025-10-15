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
    if (payload) {
      setUser({ name: payload.name || "", role: payload.role || "user" });
    } else {
      setUser(null);
    }
  }, [isLoggedIn()]); // update if login state changes (page reload may be needed)

  // Debounce search (simple)
  useEffect(() => {
    const t = setTimeout(() => {
      onSearch(q.trim());
    }, 300);
    return () => clearTimeout(t);
  }, [q, onSearch]);

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate("/login");
  };

  const initials = user?.name ? user.name.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase() : "U";

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-blue-600 text-white rounded-md px-2 py-1 font-semibold">CityPulse</div>
              <span className="text-sm text-gray-500 hidden sm:inline">Report & Resolve — your city</span>
            </Link>
            <div className="hidden md:block">
              <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                <input
                  aria-label="Search reports"
                  className="bg-transparent outline-none text-sm w-64"
                  placeholder="Search by title or category..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <button
                  onClick={() => onSearch(q.trim())}
                  className="ml-2 text-gray-600 hover:text-gray-900"
                  aria-label="Search"
                >
                  🔎
                </button>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/" className="text-sm text-gray-700 hover:text-gray-900">Home</Link>
              <Link to="/create" className="text-sm text-gray-700 hover:text-gray-900">Report</Link>
              {isAdmin() && (
                <Link to="/admin" className="text-sm text-blue-600 font-medium hover:underline">Admin</Link>
              )}
            </div>

            {/* Mobile menu toggle */}
            <div className="sm:hidden">
              <button onClick={() => setOpen(o => !o)} aria-label="Open menu" className="p-2 rounded-md">
                {open ? "✖" : "☰"}
              </button>
            </div>

            {/* user / auth */}
            <div className="ml-2">
              {!isLoggedIn() ? (
                <div className="hidden sm:flex gap-2">
                  <Link to="/login" className="text-sm text-gray-700 hover:text-gray-900">Login</Link>
                  <Link to="/signup" className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Signup</Link>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-end text-right mr-2 hidden sm:block">
                    <span className="text-sm font-medium text-gray-800">{user?.name || "You"}</span>
                    <span className="text-xs text-gray-500">{user?.role === "admin" ? "Administrator" : "Citizen"}</span>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => { logout(); navigate("/login"); }}
                      className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold"
                      title="Logout"
                    >
                      {initials}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Mobile menu panel */}
        {open && (
          <div className="sm:hidden pb-4">
            <div className="flex flex-col gap-2 mt-3">
              <input
                aria-label="Search reports mobile"
                className="px-3 py-2 rounded bg-gray-100 text-sm"
                placeholder="Search..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Link to="/" onClick={() => setOpen(false)} className="px-3 py-2 text-gray-700">Home</Link>
              <Link to="/create" onClick={() => setOpen(false)} className="px-3 py-2 text-gray-700">Report</Link>
              {isAdmin() && <Link to="/admin" onClick={() => setOpen(false)} className="px-3 py-2 text-blue-600">Admin</Link>}
              {!isLoggedIn() ? (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="px-3 py-2">Login</Link>
                  <Link to="/signup" onClick={() => setOpen(false)} className="px-3 py-2 bg-blue-600 text-white rounded">Signup</Link>
                </>
              ) : (
                <button onClick={handleLogout} className="px-3 py-2 text-left">Logout</button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
