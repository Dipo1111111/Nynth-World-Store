import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import SEO from "../components/SEO";
import { Home, Search } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white text-black flex flex-col">
            <SEO
                title="404 - Page Not Found | NYNTH"
                description="The page you're looking for doesn't exist."
            />
            <Header />

            <main className="flex-1 flex items-center justify-center section-pad">
                <div className="text-center max-w-lg">
                    <h1 className="text-[11px] tracking-[0.3em] font-bold uppercase mb-4">404</h1>
                    <h2 className="text-[11px] tracking-[0.3em] font-bold uppercase mb-4">PAGE NOT FOUND</h2>
                    <p className="text-[10px] tracking-[0.15em] text-gray-400 mb-8 uppercase">
                        The page you're looking for doesn't exist or has been moved.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/"
                            className="bg-black text-white px-8 py-4 text-[10px] tracking-[0.3em] font-bold uppercase hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                            <Home size={14} />
                            BACK TO SHOP
                        </Link>
                        <Link
                            to="/shop"
                            className="border border-black/10 px-8 py-4 text-[10px] tracking-[0.3em] font-bold uppercase hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <Search size={14} />
                            BROWSE SHOP
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
