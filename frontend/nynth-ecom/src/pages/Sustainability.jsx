import React, { useEffect } from "react";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";

export default function Sustainability() {
    useEffect(() => {
        document.title = "Sustainability | Nynth World Store";
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <Header />
            <main className="section-pad max-w-4xl mx-auto">
                <h1 className="font-space text-5xl md:text-7xl font-bold mb-12 tracking-tighter">Sustainability</h1>

                <div className="space-y-12 font-inter text-lg text-gray-800 leading-relaxed">
                    <section>
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">Conscious Creation</h2>
                        <p>
                            At NYNTH, we recognize that the fashion industry has a significant environmental impact. Our approach to sustainability is built on the principle of "Quality Over Quantity."
                        </p>
                    </section>

                    <div className="grid md:grid-cols-2 gap-8 py-8">
                        <div className="border border-gray-100 p-8 rounded-2xl">
                            <h3 className="font-space text-xl font-bold mb-3">Premium Materials</h3>
                            <p className="text-sm text-gray-600">
                                We source only the highest grade cottons and synthetics designed to last years, not seasons. Longevity is the most effective form of sustainability.
                            </p>
                        </div>
                        <div className="border border-gray-100 p-8 rounded-2xl">
                            <h3 className="font-space text-xl font-bold mb-3">Ethical Production</h3>
                            <p className="text-sm text-gray-600">
                                Our manufacturing partners are chosen based on their commitment to fair wages and safe working conditions. We visit our shops regularly to ensure these standards are met.
                            </p>
                        </div>
                    </div>

                    <section>
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">Limited Drops</h2>
                        <p>
                            By producing in limited quantities, we drastically reduce waste. We don't believe in the "fast fashion" cycle that leads to massive amounts of unsold inventory ending up in landfills.
                        </p>
                    </section>

                    <section className="bg-gray-50 p-12 rounded-3xl border border-gray-100">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4">Our Goal</h2>
                        <p className="text-xl font-medium text-black italic">
                            "To reach 100% plastic-free packaging by the end of 2026 and continue exploring bio-based alternatives for our technical silhouettes."
                        </p>
                    </section>

                    <section>
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">Carbon Footprint</h2>
                        <p>
                            We are working to optimize our logistics to reduce our carbon footprint. From consolidation of shipments to localizing as much of our supply chain as possible, we are constantly evolving.
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
