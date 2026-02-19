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
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center section-pad">
                <div className="w-full max-w-md p-6 sm:p-8">
                    <div className="text-center mb-8">
                        <h1 className="font-space text-3xl font-bold mb-2">Welcome</h1>
                        <p className="font-inter text-gray-600">
                            Sign in with Google to save your orders, or continue as a guest.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
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
                            className="w-full border border-gray-300 py-4 rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-gray-50 transition-all hover:scale-[1.02]"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                            Sign in with Google
                        </button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-100"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-400">Or</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                const originBase = location.state?.from?.pathname || "/checkout";
                                navigate(originBase);
                            }}
                            className="w-full bg-black text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-all hover:scale-[1.02]"
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
