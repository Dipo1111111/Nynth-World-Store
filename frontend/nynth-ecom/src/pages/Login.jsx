import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { getAuthErrorMessage } from "../utils/errorHandlers";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login, loginWithGoogle } = useAuth(); // Added loginWithGoogle
    const navigate = useNavigate();
    const location = useLocation(); // Initialize location

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await login(email, password);
            toast.success("Welcome back!");
            const originBase = location.state?.from?.pathname || "/shop";
            navigate(originBase);
        } catch (error) {
            console.error("Login Error:", error);
            console.error("Login Error Code:", error.code);
            toast.error(getAuthErrorMessage(error.code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center section-pad">
                <div className="w-full max-w-md p-6 sm:p-8">
                    <div className="text-center mb-8">
                        <h1 className="font-space text-3xl font-bold mb-2">Welcome Back</h1>
                        <p className="font-inter text-gray-600">
                            Sign in to access your account and order history.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <Link to="/forgot-password" className="text-xs text-gray-500 hover:text-black hover:underline">
                                    Forgot?
                                </Link>
                            </div>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3 rounded-lg font-medium text-lg flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
                        </button>
                    </form>

                    <div className="mt-6 flex flex-col gap-3">
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
                            className="w-full border border-gray-300 py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                            Sign in with Google
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/checkout")}
                            className="w-full text-gray-500 py-2 font-medium hover:text-black hover:underline text-sm transition-colors"
                        >
                            Continue as Guest
                        </button>
                    </div>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Don't have an account?{" "}
                        <Link to="/signup" className="font-medium text-black hover:underline">
                            Sign up
                        </Link>
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
