import React, { useEffect } from "react";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";

export default function OurStory() {
    useEffect(() => {
        document.title = "Our Story | Nynth World Store";
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <Header />
            <main className="section-pad max-w-4xl mx-auto">
                <h1 className="font-space text-5xl md:text-7xl font-bold mb-12 tracking-tighter">Our Story</h1>

                <div className="space-y-12 font-inter text-lg text-gray-800 leading-relaxed">
                    <section>
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">Origins</h2>
                        <p>
                            NYNTH was born out of a desire to bridge the gap between high-level craftsmanship and the raw energy of urban streetwear. Founded in Lagos, our mission has always been to create pieces that feel as premium as they look.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">Philosophy</h2>
                        <p>
                            We believe in "Minimal Streetwear" – stripping away the noise to focus on silhouette, material, and detail. Every piece in our collection is a testament to the idea that simplicity is the ultimate sophistication.
                        </p>
                        <p className="mt-6">
                            Our drops are limited, not out of artificial scarcity, but because we take the time to ensure every garment meets our standards. Once it's gone, it's a part of history.
                        </p>
                    </section>

                    <section className="bg-black text-white p-12 rounded-3xl">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4">The Craft</h2>
                        <p className="text-2xl md:text-3xl font-space font-medium leading-tight">
                            "We don't just design clothes; we build them for the visionaries, the outliers, and the ones who appreciate the silent details."
                        </p>
                    </section>

                    <section>
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">Community</h2>
                        <p>
                            NYNTH WORLD isn't just a store; it's a collective. We are inspired by artists, designers, and creators who push boundaries. Thank you for being a part of the journey.
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
