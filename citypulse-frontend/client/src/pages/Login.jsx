import React, { useState, useEffect } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";

const ATTEMPT_KEY = "loginAttempts";

// --- Local security helpers ---
function recordAttempt(success) {
  const rec = JSON.parse(localStorage.getItem(ATTEMPT_KEY) || "[]");
  const now = Date.now();
  rec.push({ t: now, success: !!success });
  while (rec.length > 20) rec.shift();
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(rec));
}

function isBlocked() {
  const rec = JSON.parse(localStorage.getItem(ATTEMPT_KEY) || "[]");
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const fails = rec.filter((r) => !r.success && now - r.t < windowMs).length;
  if (fails >= 6) return { blocked: true, minutes: 10 };
  return { blocked: false };
}

// --- Utility to sanitize SQL/JS injection like payloads ---
function sanitizeInput(input) {
  return input.replace(/['";$<>]/g, "");
}

// --- Email validation ---
function validateEmail(email) {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [human, setHuman] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const b = isBlocked();
    if (b.blocked) alert("Too many failed attempts. Please wait 10 minutes.");
  }, []);

  const login = async () => {
    setErrorMsg("");
    const blocked = isBlocked();
    if (blocked.blocked) return setErrorMsg("Too many attempts. Try later.");
    if (!human) return setErrorMsg("Please confirm you are not a robot.");

    if (!validateEmail(email)) return setErrorMsg("Invalid email format.");
    if (password.length < 6) return setErrorMsg("Password must be 6+ characters.");

    const safeEmail = sanitizeInput(email);
    const safePassword = sanitizeInput(password);

    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: safeEmail,
        password: safePassword,
        recaptchaToken: "demo", // Replace with real token if using reCAPTCHA v3
      });

      if (remember) {
        localStorage.setItem("token", res.data.token);
      } else {
        sessionStorage.setItem("token", res.data.token);
      }

      recordAttempt(true);
      navigate("/");
    } catch (err) {
      recordAttempt(false);
      setErrorMsg(
        err.response?.data?.message || "Invalid credentials or server error."
      );
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-gray-900 to-black text-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-lg bg-white/10 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20"
      >
        <h1 className="text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Welcome Back
        </h1>

        <div className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="p-3 rounded-lg bg-white/20 placeholder-gray-300 text-white focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="p-3 rounded-lg bg-white/20 placeholder-gray-300 text-white focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <div className="flex justify-between items-center mt-1">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={human}
                onChange={(e) => setHuman(e.target.checked)}
              />
              <span className="text-sm text-gray-300">I am not a robot</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span className="text-sm text-gray-300">Remember me</span>
            </label>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-2 text-xs text-red-400 font-semibold">{errorMsg}</div>
        )}

        <div className="flex flex-col gap-3 mt-5">
          <button
            onClick={login}
            disabled={loading}
            className="transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-2 rounded-lg shadow-lg hover:shadow-blue-500/50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <button
            onClick={googleLogin}
            className="flex items-center justify-center gap-2 border border-gray-400 bg-white/10 hover:bg-white/20 transition-all text-sm py-2 rounded-lg"
          >
            <FcGoogle className="text-xl" /> Sign in with Google
          </button>

          <button
            onClick={() => navigate("/signup")}
            className="text-xs text-gray-400 hover:text-blue-400 mt-2 underline"
          >
            Don’t have an account? Sign up
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-6 text-center">
          For production: Integrate Google reCAPTCHA and backend validation.
        </div>
      </motion.div>
    </div>
  );
}
