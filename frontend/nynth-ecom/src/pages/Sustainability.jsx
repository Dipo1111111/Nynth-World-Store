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
            <main className="section-pad py-20 max-w-4xl mx-auto page-content">
                <h1 className="hero-title text-black mb-16 text-left">SUSTAINABILITY</h1>

                <div className="space-y-12 font-inter text-[13px] text-gray-600 leading-[1.8]">
                    <section>
                        <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">CONSCIOUS CREATION</h2>
                        <p className="text-[13px] text-gray-600 leading-[1.8]">
                            At NYNTH, we recognize that the fashion industry has a significant environmental impact. Our approach to sustainability is built on the principle of "Quality Over Quantity."
                        </p>
                    </section>

                    <div className="grid md:grid-cols-2 gap-8 py-8">
                        <div className="border border-gray-100 p-8">
                            <h3 className="text-[12px] font-bold tracking-[0.2em] mb-3 uppercase">Premium Materials</h3>
                            <p className="text-[11px] text-gray-400 tracking-wider uppercase font-bold leading-relaxed">
                                We source only the highest grade cottons and synthetics designed to last years, not seasons. Longevity is the most effective form of sustainability.
                            </p>
                        </div>
                        <div className="border border-gray-100 p-8">
                            <h3 className="text-[12px] font-bold tracking-[0.2em] mb-3 uppercase">Ethical Production</h3>
                            <p className="text-[11px] text-gray-400 tracking-wider uppercase font-bold leading-relaxed">
                                Our manufacturing partners are chosen based on their commitment to fair wages and safe working conditions. We visit our shops regularly to ensure these standards are met.
                            </p>
                        </div>
                    </div>

                    <section>
                        <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">LIMITED DROPS</h2>
                        <p className="text-[13px] text-gray-600 leading-[1.8]">
                            By producing in limited quantities, we drastically reduce waste. We don't believe in the "fast fashion" cycle that leads to massive amounts of unsold inventory ending up in landfills.
                        </p>
                    </section>

                    <section className="bg-gray-50 p-12 border border-gray-100">
                        <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">OUR GOAL</h2>
                        <p className="text-[14px] font-bold text-black leading-relaxed">
                            "To reach 100% plastic-free packaging by the end of 2026 and continue exploring bio-based alternatives for our technical silhouettes."
                        </p>
                    </section>

                    <section>
                        <h2 className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">CARBON FOOTPRINT</h2>
                        <p className="text-[13px] text-gray-600 leading-[1.8]">
                            We are working to optimize our logistics to reduce our carbon footprint. From consolidation of shipments to localizing as much of our supply chain as possible, we are constantly evolving.
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
