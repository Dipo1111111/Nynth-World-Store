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
                    <h1 className="font-space text-9xl font-bold mb-4">404</h1>
                    <h2 className="font-space text-2xl md:text-3xl font-bold mb-4">Page Not Found</h2>
                    <p className="text-gray-600 mb-8">
                        The page you're looking for doesn't exist or has been moved.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/"
                            className="btn-primary flex items-center justify-center gap-2"
                        >
                            <Home size={20} />
                            Back to Home
                        </Link>
                        <Link
                            to="/shop"
                            className="px-6 py-3 border border-black rounded-full font-medium hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <Search size={20} />
                            Browse Shop
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
