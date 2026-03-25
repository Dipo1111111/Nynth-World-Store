import React, { useEffect } from "react";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";

export default function OurStory() {
    useEffect(() => {
        document.title = "Our Story | Nynth World Store";
    }, []);

    return (
        <div className="min-h-screen bg-white font-inter">
            <Header />
            <main className="section-pad py-20 md:py-32 max-w-4xl mx-auto">
                <h1 className="hero-title text-black text-left mb-20">OUR STORY</h1>

                <div className="space-y-20 text-[14px] md:text-[16px] text-gray-600 leading-[1.8] font-medium">
                    <section>
                        <h2 className="text-[10px] tracking-[0.3em] font-bold uppercase text-black mb-6">NYNTH WORLD</h2>
                        <p>
                            Founded October 20, 2022.
                        </p>
                        <p className="mt-8">
                            Built on the belief that where you start does not define where you end.
                        </p>
                    </section>

                    <section className="bg-black text-white p-12 md:p-20">
                        <p className="text-[20px] md:text-[28px] tracking-tight font-bold italic leading-tight">
                            "By winners, for winners, with the mindset to Stay Above."
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
