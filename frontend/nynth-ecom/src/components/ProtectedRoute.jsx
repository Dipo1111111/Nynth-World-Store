import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requireAdmin = false }) {
    const { currentUser, isAdmin } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        // Redirect to login but save the attempted url
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireAdmin && !isAdmin) {
        // Redirect to home if user is not admin
        return <Navigate to="/" replace />;
    }

    return children;
}
