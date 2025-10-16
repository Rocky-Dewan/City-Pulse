import React, { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { motion } from "framer-motion";

const sanitizeInput = (val) => val.replace(/['";$<>]/g, "");

const countries = [
  { code: "+1", label: "🇺🇸 USA" },
  { code: "+44", label: "🇬🇧 UK" },
  { code: "+91", label: "🇮🇳 India" },
  { code: "+880", label: "🇧🇩 Bangladesh" },
  { code: "+81", label: "🇯🇵 Japan" },
  { code: "+49", label: "🇩🇪 Germany" },
  { code: "+971", label: "🇦🇪 UAE" },
];

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
    phone: "",
    countryCode: "+880",
    address: "",
    city: "",
    gender: "",
    age: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: sanitizeInput(e.target.value) });
  };

  const validateForm = () => {
    if (!form.email.includes("@")) return "Invalid email";
    if (form.password.length < 6) return "Password too short";
    if (form.password !== form.confirm) return "Passwords do not match";
    if (!form.gender) return "Please select gender";
    if (!form.phone) return "Please enter phone number";
    if (!form.city) return "City is required";
    if (isNaN(form.age) || form.age <= 0) return "Invalid age";
    return null;
  };

  const handleSignup = async () => {
    const err = validateForm();
    if (err) return alert(err);

    setLoading(true);
    try {
      const res = await api.post("/auth/signup", form);
      alert("Signup successful! Please login.");
      nav("/login");
    } catch (error) {
      alert("Signup failed or server error.");
    } finally {
      setLoading(false);
    }
  };

  const googleSignup = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-gray-900 to-black text-white">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-lg bg-white/10 p-8 rounded-3xl shadow-2xl w-full max-w-2xl border border-white/20"
      >
        <h1 className="text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-400">
          Create Your CityPulse Account
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} className="input-field" />
          <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} className="input-field" />

          <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="input-field col-span-2" />

          <div className="flex items-center gap-2">
            <select name="countryCode" value={form.countryCode} onChange={handleChange} className="bg-white/20 text-white rounded-lg p-3 outline-none">
              {countries.map((c) => (
                <option key={c.code} value={c.code} className="text-black">
                  {c.label} {c.code}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              className="input-field flex-1"
            />
          </div>

          <input type="text" name="address" placeholder="Address" value={form.address} onChange={handleChange} className="input-field col-span-2" />
          <input name="city" placeholder="City" value={form.city} onChange={handleChange} className="input-field" />

          <input name="location" placeholder="Location" value={form.location} onChange={handleChange} className="input-field" />
          <input type="number" name="age" placeholder="Age" value={form.age} onChange={handleChange} className="input-field" />

          <div className="flex items-center justify-between col-span-2 text-sm">
            <div className="flex gap-4">
              <label>
                <input type="radio" name="gender" value="male" checked={form.gender === "male"} onChange={handleChange} /> Male
              </label>
              <label>
                <input type="radio" name="gender" value="female" checked={form.gender === "female"} onChange={handleChange} /> Female
              </label>
              <label>
                <input type="radio" name="gender" value="other" checked={form.gender === "other"} onChange={handleChange} /> Other
              </label>
            </div>
          </div>

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="input-field"
          />
          <input
            type="password"
            name="confirm"
            placeholder="Confirm Password"
            value={form.confirm}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        <div className="flex flex-col mt-6 gap-3">
          <button
            onClick={handleSignup}
            disabled={loading}
            className="transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-2 rounded-lg shadow-lg hover:shadow-purple-400/40"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          <button
            onClick={googleSignup}
            className="flex items-center justify-center gap-2 border border-gray-400 bg-white/10 hover:bg-white/20 transition-all text-sm py-2 rounded-lg"
          >
            <FcGoogle className="text-xl" /> Sign up with Google
          </button>

          <button onClick={() => nav("/login")} className="text-xs text-gray-400 hover:text-blue-400 mt-2 underline">
            Already have an account? Login instead
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Tailwind utility for all input fields
const style = document.createElement("style");
style.innerHTML = `
.input-field {
  @apply p-3 rounded-lg bg-white/20 placeholder-gray-300 text-white focus:ring-2 focus:ring-blue-400 outline-none w-full;
}
`;
document.head.appendChild(style);
