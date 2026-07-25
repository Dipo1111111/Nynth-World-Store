import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function Signup() {
    const [loading, setLoading] = useState(false);
    const { loginWithGoogle, currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Determine safe redirect target — never loop back to auth pages
    const getRedirectTarget = () => {
        const from = location.state?.from?.pathname;
        if (from && !from.startsWith("/login") && !from.startsWith("/signup") && !from.startsWith("/admin")) {
            return from;
        }
        return "/shop";
    };

    // Redirect when user becomes authenticated (fires as soon as onAuthStateChanged sets currentUser)
    useEffect(() => {
        if (currentUser) {
            navigate(getRedirectTarget(), { replace: true });
        }
    }, [currentUser, navigate, location]);

    // Don't show signup form if already logged in
    if (currentUser) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-black" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col font-inter">
            <Header />

            <main className="flex-1 flex items-center justify-center section-pad py-20">
                <div className="w-full max-w-sm">
                    <div className="text-left mb-16">
                        <h1 className="hero-title text-black text-left mb-6">SIGN UP</h1>
                        <p className="text-[12px] tracking-[0.2em] text-gray-400 font-bold uppercase leading-relaxed">
                            Join the NYNTH community to access exclusive Pieces and track your orders.
                        </p>
                    </div>

                    <div className="flex flex-col gap-6">
                        <button
                            type="button"
                            onClick={async () => {
                                if (loading) return;
                                try {
                                    setLoading(true);
                                    const result = await loginWithGoogle();
                                    if (result?.isNewUser) {
                                        toast.success("Welcome to NYNTH");
                                    } else {
                                        toast.success("Welcome back");
                                    }
                                    // Direct navigate as backup (in case useEffect timing is off)
                                    navigate(getRedirectTarget(), { replace: true });
                                } catch (error) {
                                    setLoading(false);
                                    // Silent for user-cancelled popups
                                    if (error.code !== "auth/popup-closed-by-user" && error.code !== "auth/cancelled-popup-request") {
                                        console.error("Google auth error:", error);
                                        toast.error("Google Sign Up Failed");
                                    }
                                }
                            }}
                            disabled={loading}
                            className="w-full border border-black py-5 text-[11px] font-bold tracking-[0.3em] uppercase flex items-center justify-center gap-4 hover:bg-gray-50 transition-all font-inter disabled:opacity-40"
                        >
                            {loading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                            )}
                            {loading ? "AUTHENTICATING..." : "SIGN UP WITH GOOGLE"}
                        </button>

                        <p className="text-center text-[10px] tracking-[0.2em] font-bold text-gray-400 uppercase mt-8">
                            Already have an account?{" "}
                            <Link to="/login" className="text-black hover:underline underline-offset-4">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
