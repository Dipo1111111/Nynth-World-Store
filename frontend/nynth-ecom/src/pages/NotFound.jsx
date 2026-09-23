import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import SEO from "../components/SEO";

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
                    <p className="text-[11px] tracking-[0.3em] font-bold uppercase text-black/40 mb-3">Error 404</p>
                    <h1 className="text-7xl md:text-8xl font-extrabold tracking-[-0.04em] leading-none mb-4">404</h1>
                    <p className="text-sm text-black/60 max-w-sm mx-auto mb-8 leading-relaxed">
                        This page doesn't exist or was moved. The shop is still open - let's get you back to it.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <Link
                            to="/"
                            className="bg-black text-white px-8 py-4 text-[10px] tracking-[0.3em] font-bold uppercase hover:opacity-90 transition-all"
                        >
                            Back to shop
                        </Link>
                        <Link
                            to="/shop"
                            className="text-[10px] tracking-[0.3em] font-bold uppercase text-black/60 hover:text-black transition-colors underline underline-offset-8 decoration-black/20"
                        >
                            Browse all products
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
