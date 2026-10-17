import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ErrorPage from "../pages/ErrorPage";

// Route guard. `requireAdmin` is the founder. `requirePermission` is one
// permission key from utils/permissions, or a list where holding any of them
// opens the page. Postgres refuses the data either way, so this is the friendly
// version, not the security boundary.
export default function ProtectedRoute({ children, requireAdmin = false, requirePermission = null }) {
    const { currentUser, isAdmin, isAdminLoading, accessLoading, isStaff, can } = useAuth();
    const location = useLocation();

    const allowed = !requirePermission
        || (Array.isArray(requirePermission)
            ? requirePermission.some((key) => can(key))
            : can(requirePermission));

    if (!currentUser) {
        // Redirect to login but save the attempted url
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireAdmin && isAdminLoading) {
        return <Loading />;
    }

    if (requireAdmin && !isAdmin) {
        // Redirect to home if user is not the founder
        return <Navigate to="/" replace />;
    }

    // Any staff role at all may open the dashboard; each page then narrows.
    if (!requireAdmin && !isStaff) {
        if (accessLoading) return <Loading />;
        return <Navigate to="/" replace />;
    }

    if (!allowed) {
        return <ErrorPage status={403} />;
    }

    return children;
}

const Loading = () => (
    <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
    </div>
);
