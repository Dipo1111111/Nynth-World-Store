import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requireAdmin = false }) {
    const { currentUser, isAdmin, isAdminLoading } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        // Redirect to login but save the attempted url
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireAdmin && isAdminLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        );
    }

    if (requireAdmin && !isAdmin) {
        // Redirect to home if user is not admin
        return <Navigate to="/" replace />;
    }

    return children;
}
