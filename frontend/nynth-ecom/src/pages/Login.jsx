import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="min-h-screen bg-white flex flex-col font-inter">
            <Header />

            <main className="flex-1 flex items-center justify-center section-pad py-20 page-content">
                <div className="w-full max-w-sm">
                    <div className="text-left mb-16">
                        <h1 className="hero-title text-black text-left mb-6">WELCOME</h1>
                        <p className="text-[12px] tracking-[0.2em] text-gray-400 font-bold uppercase leading-relaxed">
                            Continue shopping as a guest or create an account.
                        </p>
                    </div>

                    <div className="flex flex-col gap-6">
                        <button
                            type="button"
                            onClick={() => {
                                let originBase = location.state?.from?.pathname || "/shop";
                                if (originBase.startsWith("/admin") || originBase === "/account") {
                                    originBase = "/shop";
                                }
                                navigate(originBase);
                            }}
                            className="w-full bg-black text-white py-5 text-[11px] font-bold tracking-[0.3em] uppercase hover:opacity-90 transition-all"
                        >
                            Continue as Guest
                        </button>

                        <p className="text-center text-[10px] tracking-[0.2em] font-bold text-gray-400 uppercase mt-4">
                            New to NYNTH? <Link to="/signup" className="text-black hover:underline underline-offset-4">Create Account</Link>
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
