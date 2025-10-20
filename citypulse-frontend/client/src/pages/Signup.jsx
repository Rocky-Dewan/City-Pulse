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
      await api.post("/auth/signup", form);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-800 to-black text-white">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="backdrop-blur-lg bg-gray-800/70 p-8 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-700"
      >
        <h1 className="text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-400">
          Create Your CityPulse Account-
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomInput label="First Name" name="firstName" value={form.firstName} onChange={handleChange} />
          <CustomInput label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />

          <CustomInput label="Email" type="email" name="email" value={form.email} onChange={handleChange} className="md:col-span-2" />

          <div className="flex items-center gap-2 md:col-span-2">
            <select
              name="countryCode"
              value={form.countryCode}
              onChange={handleChange}
              className="bg-gray-700/80 text-white rounded-lg p-3 outline-none border border-gray-600 focus:border-blue-400 transition-all"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code} className="text-black">
                  {c.label} {c.code}
                </option>
              ))}
            </select>
            <CustomInput label="Phone Number" name="phone" value={form.phone} onChange={handleChange} />
          </div>

          <CustomInput label="Address" name="address" value={form.address} onChange={handleChange} className="md:col-span-2" />
          <CustomInput label="City" name="city" value={form.city} onChange={handleChange} />
          <CustomInput label="Location" name="location" value={form.location} onChange={handleChange} />
          <CustomInput label="Age" name="age" type="number" value={form.age} onChange={handleChange} />

          <div className="flex items-center justify-between md:col-span-2 text-sm">
            <div className="flex gap-4">
              {["male", "female", "other"].map((g) => (
                <label key={g} className="flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-all">
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={form.gender === g}
                    onChange={handleChange}
                    className="accent-blue-500"
                  />
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <CustomInput label="Password" type="password" name="password" value={form.password} onChange={handleChange} />
          <CustomInput label="Confirm Password" type="password" name="confirm" value={form.confirm} onChange={handleChange} />
        </div>

        <div className="flex flex-col mt-6 gap-3">
          <button
            onClick={handleSignup}
            disabled={loading}
            className="transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-500 hover:to-blue-600 text-white font-semibold py-2 rounded-lg shadow-lg hover:shadow-purple-400/40"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>

          <button
            onClick={googleSignup}
            className="flex items-center justify-center gap-2 border border-gray-500 bg-gray-700/70 hover:bg-gray-600 transition-all text-sm py-2 rounded-lg shadow-md"
          >
            <FcGoogle className="text-xl" /> Sign up with Google
          </button>

          <button
            onClick={() => nav("/login")}
            className="text-xs text-gray-400 hover:text-blue-400 mt-2 underline"
          >
            Already have an account? Login instead
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CustomInput({ label, type = "text", className = "", ...props }) {
  return (
    <div className={`relative ${className}`}>
      <input
        type={type}
        {...props}
        id={props.name}
        className="peer w-full bg-gray-800/70 text-gray-100 placeholder-transparent border border-gray-600 rounded-lg px-3 py-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 transition-all"
        placeholder={label}
      />
      <label
        htmlFor={props.name}
        className="absolute left-3 -top-2.5 bg-gray-800 px-1 text-xs text-gray-400 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-blue-400 transition-all"
      >
        {label}
      </label>
    </div>
  );
}
