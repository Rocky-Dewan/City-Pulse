import { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  const login = async () => {
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      nav("/");
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <input className="input" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input className="input mt-2" placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} />
      <button className="btn mt-4" onClick={login}>Login</button>
    </div>
  );
}
