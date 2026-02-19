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
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center section-pad">
                <div className="w-full max-w-md p-6 sm:p-8">
                    <div className="text-center mb-10">
                        <h1 className="font-space text-3xl font-bold mb-2">Join NYNTH</h1>
                        <p className="font-inter text-gray-600">
                            Create an account with Google for exclusive drops and faster checkout.
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
                            className="w-full border border-gray-300 py-4 rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-gray-50 transition-all hover:scale-[1.02]"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                            Sign up with Google
                        </button>

                        <p className="text-center text-sm text-gray-600">
                            Already have an account?{" "}
                            <Link to="/login" className="font-medium text-black hover:underline">
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
