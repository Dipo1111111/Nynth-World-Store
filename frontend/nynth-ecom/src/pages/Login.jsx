import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
export default function Login() {
    const [loading, setLoading] = useState(false);
    const { loginWithGoogle } = useAuth(); // Added loginWithGoogle
    const navigate = useNavigate();
    const location = useLocation(); // Initialize location

    return (
        <div className="min-h-screen bg-white flex flex-col font-inter">
            <Header />

            <main className="flex-1 flex items-center justify-center section-pad py-20">
                <div className="w-full max-w-sm">
                    <div className="text-left mb-16">
                        <h1 className="hero-title text-black text-left mb-6">WELCOME</h1>
                        <p className="text-[12px] tracking-[0.2em] text-gray-400 font-bold uppercase leading-relaxed">
                            Sign in to access your curated collection and order status.
                        </p>
                    </div>

                    <div className="flex flex-col gap-6">
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    setLoading(true);
                                    await loginWithGoogle();
                                    toast.success("Welcome back!");
                                    const originBase = location.state?.from?.pathname || "/shop";
                                    navigate(originBase);
                                } catch (error) {
                                    console.error(error);
                                    toast.error("Google Sign In Failed");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                            className="w-full border border-black py-5 text-[11px] font-bold tracking-[0.3em] uppercase flex items-center justify-center gap-4 hover:bg-gray-50 transition-all"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                            Sign in with Google
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-100"></span>
                            </div>
                            <div className="relative flex justify-center text-[9px] uppercase tracking-[0.3em] font-bold">
                                <span className="bg-white px-4 text-gray-300">Or</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                const originBase = location.state?.from?.pathname || "/checkout";
                                navigate(originBase);
                            }}
                            className="w-full bg-black text-white py-5 text-[11px] font-bold tracking-[0.3em] uppercase hover:opacity-90 transition-all"
                        >
                            Continue as Guest
                        </button>

                        <p className="text-center text-[10px] tracking-[0.2em] font-bold text-gray-400 uppercase mt-8">
                            New to NYNTH? <Link to="/signup" className="text-black hover:underline underline-offset-4">Create Account</Link>
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
