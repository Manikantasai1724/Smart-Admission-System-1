import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage message="Authenticating..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const userRole = user?.role?.toLowerCase() || "";
    if (!allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      if (userRole === "admin") {
        return <Navigate to="/admin/dashboard" replace />;
      }
      if (userRole === "hod") {
        return <Navigate to="/hod/dashboard" replace />;
      }
      return <Navigate to="/volunteer/dashboard" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
