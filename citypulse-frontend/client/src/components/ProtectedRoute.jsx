import React from "react";
import { Navigate } from "react-router-dom";
import { getToken, getTokenPayload, isTokenExpired } from "../utils/auth";


export default function ProtectedRoute({ children, adminOnly = false }) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;


  try {
    if (isTokenExpired(token)) {
      // token expired: force logout
      localStorage.removeItem("token");
      return <Navigate to="/login" replace />;
    }
    const payload = getTokenPayload(token);
    if (!payload) return <Navigate to="/login" replace />;

    if (adminOnly && payload.role !== "admin") {
      return <Navigate to="/" replace />;
    }

    return children;
  } catch (err) {
    console.error("ProtectedRoute error:", err);
    return <Navigate to="/login" replace />;
  }
}
