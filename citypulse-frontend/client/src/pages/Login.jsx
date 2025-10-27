import React, { useState, useEffect, useRef } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";
import ReCAPTCHA from "react-google-recaptcha";

const ATTEMPT_KEY = "loginAttempts";
const SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

// --- Helpers ---
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

function sanitizeInput(input) {
  return input.replace(/['";$<>]/g, "");
}

function validateEmail(email) {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  useEffect(() => {
    const b = isBlocked();
    if (b.blocked) alert("Too many failed attempts. Please wait 10 minutes.");
  }, []);

  const handleRecaptcha = (token) => {
    setRecaptchaToken(token);
  };

  const login = async () => {
    setErrorMsg("");
    const blocked = isBlocked();
    if (blocked.blocked) return setErrorMsg("Too many attempts. Try later.");

    if (!validateEmail(email)) return setErrorMsg("Invalid email format.");
    if (password.length < 6) return setErrorMsg("Password must be 6+ characters.");
    if (!recaptchaToken) return setErrorMsg("Please verify the reCAPTCHA.");

    const safeEmail = sanitizeInput(email);
    const safePassword = sanitizeInput(password);

    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: safeEmail,
        password: safePassword,
        recaptchaToken,
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
      recaptchaRef.current?.reset(); // reset reCAPTCHA
      setRecaptchaToken("");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = () => {
    // Redirect user to your backend Google OAuth route
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
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span className="text-sm text-gray-300">Remember me</span>
            </label>
          </div>
        </div>

        {/* --- Google reCAPTCHA --- */}
        <div className="mt-4 flex justify-center">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={SITE_KEY}
            onChange={handleRecaptcha}
            theme="dark"
          />
        </div>

        {errorMsg && (
          <div className="mt-2 text-xs text-red-400 font-semibold text-center">
            {errorMsg}
          </div>
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
            className="text-xs text-gray-400 hover:text-blue-400 mt-2 underline text-center"
          >
            Don’t have an account? Sign up
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-6 text-center">
          Secure login with Google OAuth & reCAPTCHA verification.
        </div>
      </motion.div>
    </div>
  );
}
