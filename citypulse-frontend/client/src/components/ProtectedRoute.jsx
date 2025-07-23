import { Navigate } from "react-router-dom";
import { isLoggedIn, isAdmin } from "../utils/auth";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  if (!isLoggedIn()) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin()) return <Navigate to="/" />;
  return children;
};

export default ProtectedRoute;
