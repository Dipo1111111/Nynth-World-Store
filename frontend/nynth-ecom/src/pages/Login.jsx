import React, { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, loading: authLoading } = useAuth();

    // Determine safe redirect target
    const getRedirectTarget = () => {
        const from = location.state?.from?.pathname;
        if (from && !from.startsWith("/login") && !from.startsWith("/signup") && !from.startsWith("/admin")) {
            return from;
        }
        return "/shop";
    };

    // If already logged in, redirect immediately
    useEffect(() => {
        if (currentUser && !authLoading) {
            navigate(getRedirectTarget(), { replace: true });
        }
    }, [currentUser, authLoading, navigate, location]);

    // Don't show login form if already logged in
    if (currentUser) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <div className="h-6 w-6 animate-spin border-2 border-black border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col font-inter">
            <Header />

            <main className="flex-1 flex items-center justify-center section-pad py-20">
                <div className="w-full max-w-sm">
                    <div className="text-left mb-16">
                        <h1 className="hero-title text-black text-left mb-6">WELCOME</h1>
                        <p className="text-[12px] tracking-[0.2em] text-gray-400 font-bold uppercase leading-relaxed">
                            Create an account to track orders and access exclusive drops.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Pass the from state through to signup */}
                        <Link
                            to="/signup"
                            state={{ from: location.state?.from }}
                            className="w-full bg-black text-white py-5 text-[11px] font-bold tracking-[0.3em] uppercase hover:opacity-90 transition-all text-center"
                        >
                            Create Account
                        </Link>

                        <button
                            type="button"
                            onClick={() => {
                                navigate(getRedirectTarget(), { replace: true });
                            }}
                            className="w-full border border-black py-5 text-[11px] font-bold tracking-[0.3em] uppercase hover:bg-gray-50 transition-all"
                        >
                            Continue as Guest
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
