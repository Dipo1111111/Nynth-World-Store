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
            <main className="section-pad py-20 md:py-32 max-w-2xl mx-auto">
                <div className="space-y-16 text-black">
                    {/* Header Info */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-[20px] font-bold tracking-tighter mb-4">NYNTH WORLD LTD</h1>
                            <div className="space-y-1 text-gray-500 text-[13px] font-medium leading-relaxed">
                                <p>Founded October 20, 2022</p>
                                <p>Registered with the Corporate Affairs Commission (CAC), October 2, 2025</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-2">Founder & Chief Executive Officer</p>
                            <p className="text-[15px] font-bold">Yange Newman Terseer</p>
                        </div>
                    </div>

                    <div className="w-12 h-[1px] bg-gray-200"></div>

                    {/* Belief */}
                    <div className="space-y-6">
                        <p className="text-[18px] md:text-[22px] font-bold tracking-tight leading-tight italic">
                            NYNTH WORLD was built on one belief.
                            <br />
                            Where you begin does not define where you finish.
                        </p>
                        <div className="space-y-4 text-gray-600 text-[14px] md:text-[15px] leading-relaxed">
                            <p>It is a brand based on mindset.</p>
                            <p>A standard for people who choose to rise in every situation.</p>
                        </div>
                    </div>

                    <div className="w-12 h-[1px] bg-gray-200"></div>

                    {/* Origin */}
                    <div className="space-y-6">
                        <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-gray-400">ORIGIN</h2>
                        <div className="space-y-4 text-gray-600 text-[14px] md:text-[15px] leading-relaxed">
                            <p>NYNTH started from a real moment.</p>
                            <p>The Founder was ranked 9th across 9 subjects and told he would not succeed.</p>
                            <p>That moment did not create doubt. It created a shift in mindset.</p>
                        </div>
                        <div className="pt-4 space-y-1">
                            <p className="text-[16px] font-bold tracking-tight italic">Position is temporary.</p>
                            <p className="text-[16px] font-bold tracking-tight italic">Mindset is Permanent.</p>
                        </div>
                    </div>

                    <div className="w-12 h-[1px] bg-gray-200"></div>

                    {/* Meaning */}
                    <div className="space-y-6">
                        <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-gray-400">MEANING</h2>
                        <div className="space-y-4 text-gray-600 text-[14px] md:text-[15px] leading-relaxed">
                            <p>NYNTH is not just a number. It stands for elevation.</p>
                            <p>
                                It represents people who push past limits,
                                stay disciplined,
                                and keep the mindset of staying above.
                            </p>
                        </div>
                    </div>

                    <div className="w-12 h-[1px] bg-gray-200"></div>

                    {/* Philosophy */}
                    <div className="space-y-6">
                        <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-gray-400">PHILOSOPHY</h2>
                        <div className="space-y-4 text-gray-600 text-[14px] md:text-[15px] leading-relaxed">
                            <p>Every NYNTH piece is made with intention.</p>
                            <p>Not just as clothing, but as identity.</p>
                            <p>When you see NYNTH, you see a person who keeps going.</p>
                        </div>
                    </div>

                    <div className="w-12 h-[1px] bg-gray-200"></div>

                    {/* Footer Statement (Black Box) */}
                    <div className="bg-black text-white p-12 md:p-16 hover:bg-zinc-950 transition-colors duration-500 cursor-default">
                        <p className="text-[14px] md:text-[18px] font-black tracking-[0.1em] uppercase italic leading-relaxed">
                            BY WINNERS, FOR WINNERS, <span className="opacity-70">stay above</span>
                        </p>
                        
                        <div className="mt-12 pt-8 border-t border-white/10 space-y-1">
                            <p className="text-[11px] font-bold tracking-wider text-white/40">NYNTH WORLD LTD</p>
                            <p className="text-[10px] text-white/30">All Rights Reserved © 2026</p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
