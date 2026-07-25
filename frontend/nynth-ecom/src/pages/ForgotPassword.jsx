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
                    <Link to="/login" className="inline-flex items-center text-[10px] tracking-[0.2em] text-gray-400 hover:text-black mb-8 transition-colors uppercase font-bold">
                        <ArrowLeft size={12} className="mr-1" /> BACK TO LOGIN
                    </Link>

                    {sent ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-50 flex items-center justify-center mx-auto mb-6 text-green-600">
                                <Mail size={32} />
                            </div>
                            <h1 className="text-[11px] tracking-[0.3em] font-bold uppercase mb-4">CHECK YOUR EMAIL</h1>
                            <p className="text-[10px] tracking-[0.15em] text-gray-400 mb-8 uppercase leading-relaxed">
                                We have sent a password reset link to <strong className="text-black">{email}</strong>.
                            </p>
                            <button
                                onClick={() => setSent(false)}
                                className="text-[10px] tracking-[0.2em] font-bold uppercase text-gray-400 hover:text-black transition-colors"
                            >
                                DIDN'T RECEIVE THE EMAIL? CLICK TO RESEND
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8">
                                <h1 className="text-[11px] tracking-[0.3em] font-bold uppercase mb-2">RESET PASSWORD</h1>
                                <p className="text-[10px] tracking-[0.15em] text-gray-400 uppercase">
                                    Enter your email address to receive password reset instructions.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] tracking-widest uppercase font-bold text-gray-400 mb-2">EMAIL ADDRESS</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-4 py-3 border-b border-gray-100 focus:border-black transition-all outline-none text-[13px] tracking-wider font-medium bg-transparent"
                                        placeholder="YOU@EXAMPLE.COM"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-black text-white py-4 text-[10px] tracking-[0.3em] font-bold uppercase hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : "SEND RESET LINK"}
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
