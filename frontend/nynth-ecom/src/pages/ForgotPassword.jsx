import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const { resetPassword } = useAuth();
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await resetPassword(email);
            setSent(true);
            toast.success("Check your email for instructions");
        } catch (error) {
            console.error(error);
            toast.error("Failed to reset password: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center section-pad">
                <div className="w-full max-w-md p-6 sm:p-8">
                    <Link to="/login" className="inline-flex items-center text-sm text-gray-500 hover:text-black mb-8 transition-colors">
                        <ArrowLeft size={16} className="mr-1" /> Back to Login
                    </Link>

                    {sent ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                                <Mail size={32} />
                            </div>
                            <h1 className="font-space text-3xl font-bold mb-4">Check your email</h1>
                            <p className="font-inter text-gray-600 mb-8 leading-relaxed">
                                We have sent a password reset link to <strong>{email}</strong>.
                            </p>
                            <button
                                onClick={() => setSent(false)}
                                className="text-sm font-medium hover:underline"
                            >
                                Didn't receive the email? Click to resend
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <h1 className="font-space text-3xl font-bold mb-2">Reset Password</h1>
                                <p className="font-inter text-gray-600">
                                    Enter your email address to receive password reset instructions.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-black text-white py-4 rounded-xl font-medium text-lg hover:opacity-90 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Send Reset Link"}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
