import { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState(""); // Assuming you collect name too
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  const signup = async () => {
    try {
      const res = await api.post("/auth/signup", {
        name,
        email,
        password,
      });

      // Assuming backend returns a token after signup (optional)
      localStorage.setItem("token", res.data.token);

      alert("Signup successful!");
      nav("/"); // Redirect to home or login
    } catch (err) {
      alert("Signup failed: " + (err.response?.data?.message || "Unknown error"));
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Signup</h1>

      <input
        className="input"
        placeholder="Name"
        onChange={(e) => setName(e.target.value)}
        value={name}
      />
      <input
        className="input mt-2"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        value={email}
      />
      <input
        className="input mt-2"
        placeholder="Password"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
        value={password}
      />
      <button className="btn mt-4" onClick={signup}>
        Signup
      </button>
    </div>
  );
}
