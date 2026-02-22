import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
export default function Signup() {
    const [loading, setLoading] = useState(false);
    const { loginWithGoogle } = useAuth(); // Added loginWithGoogle
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="min-h-screen bg-white flex flex-col font-inter">
            <Header />

            <main className="flex-1 flex items-center justify-center section-pad py-20">
                <div className="w-full max-w-sm">
                    <div className="text-left mb-16">
                        <h1 className="hero-title text-black text-left mb-6">SIGN UP</h1>
                        <p className="text-[12px] tracking-[0.2em] text-gray-400 font-bold uppercase leading-relaxed">
                            Join the NYNTH community for early access to artifacts and curated experiences.
                        </p>
                    </div>

                    <div className="flex flex-col gap-6">
                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    setLoading(true);
                                    await loginWithGoogle();
                                    toast.success("Account created successfully!");
                                    const originBase = location.state?.from?.pathname || "/";
                                    navigate(originBase);
                                } catch (error) {
                                    console.error(error);
                                    toast.error("Google Sign Up Failed");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                            className="w-full border border-black py-5 text-[11px] font-bold tracking-[0.3em] uppercase flex items-center justify-center gap-4 hover:bg-gray-50 transition-all font-inter"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                            Sign up with Google
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
