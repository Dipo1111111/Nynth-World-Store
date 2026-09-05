import React, { useEffect } from "react";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { useSettings } from "../context/SettingsContext";

export default function OurStory() {
    const { settings } = useSettings();

    useEffect(() => {
        document.title = "Our Story | Nynth World Store";
    }, []);

    // Use settings content if available, otherwise fall back to defaults
    const content = settings?.our_story_content || {};
    const company = content.company || "NYNTH WORLD LTD";
    const founded = content.founded || "Founded October 20, 2022";
    const cac = content.cac || "Registered with the Corporate Affairs Commission (CAC), October 2, 2025";
    const founderLabel = content.founder_label || "Founder & Chief Executive Officer";
    const founderName = content.founder_name || "Yange Newman Terseer";
    const belief = content.belief || "NYNTH WORLD was built on one belief.\nWhere you begin does not define where you finish.";
    const beliefDesc = content.belief_desc || "It is a brand based on mindset.\nA standard for people who choose to rise in every situation.";
    const origin = content.origin || "NYNTH started from a real moment.\nThe Founder was ranked 9th across 9 subjects and told he would not succeed.\nThat moment did not create doubt. It created a shift in mindset.";
    const quote1 = content.quote1 || "Position is temporary.";
    const quote2 = content.quote2 || "Mindset is Permanent.";
    const meaning = content.meaning || "NYNTH is not just a number. It stands for elevation.\nIt represents people who push past limits,\nstay disciplined,\nand keep the mindset of staying above.";
    const philosophy = content.philosophy || "Every NYNTH piece is made with intention.\nNot just as clothing, but as identity.\nWhen you see NYNTH, you see a person who keeps going.";
    const tagline = content.tagline || "BY WINNERS, FOR WINNERS, stay above";
    const footerName = content.footer_name || "NYNTH WORLD LTD";

    return (
        <div className="min-h-screen bg-white font-inter">
            <Header />
            <main className="section-pad py-20 md:py-32 max-w-2xl mx-auto">
                <div className="space-y-16 text-black">
                    {/* Header Info */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-[20px] font-bold tracking-tighter mb-4">{company.toUpperCase()}</h1>
                            <div className="space-y-1 text-gray-500 text-[13px] font-medium leading-relaxed">
                                <p>{founded}</p>
                                <p>{cac}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-400 mb-2">{founderLabel}</p>
                            <p className="text-[15px] font-bold">{founderName}</p>
                        </div>
                    </div>

                    <div className="w-12 h-[1px] bg-gray-200"></div>

                    {/* Belief */}
                    <div className="space-y-6">
                        <p className="text-[18px] md:text-[22px] font-bold tracking-tight leading-tight italic whitespace-pre-line">
                            {belief}
                        </p>
                        <div className="space-y-4 text-gray-600 text-[14px] md:text-[15px] leading-relaxed whitespace-pre-line">
                            {beliefDesc}
                        </div>
                    </div>

                    <div className="w-12 h-[1px] bg-gray-200"></div>

                    {/* Origin */}
                    <div className="space-y-6">
                        <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-gray-400">ORIGIN</h2>
                        <div className="space-y-4 text-gray-600 text-[14px] md:text-[15px] leading-relaxed whitespace-pre-line">
                            {origin}
                        </div>
                        <div className="pt-4 space-y-1">
                            <p className="text-[16px] font-bold tracking-tight italic">{quote1}</p>
                            <p className="text-[16px] font-bold tracking-tight italic">{quote2}</p>
                        </div>
                    </div>

                    <div className="w-12 h-[1px] bg-gray-200"></div>

                    {/* Meaning */}
                    <div className="space-y-6">
                        <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-gray-400">MEANING</h2>
                        <div className="space-y-4 text-gray-600 text-[14px] md:text-[15px] leading-relaxed whitespace-pre-line">
                            {meaning}
                        </div>
                    </div>

                    <div className="w-12 h-[1px] bg-gray-200"></div>

                    {/* Philosophy */}
                    <div className="space-y-6">
                        <h2 className="text-[11px] uppercase tracking-[0.3em] font-bold text-gray-400">PHILOSOPHY</h2>
                        <div className="space-y-4 text-gray-600 text-[14px] md:text-[15px] leading-relaxed whitespace-pre-line">
                            {philosophy}
                        </div>
                    </div>

                    <div className="w-12 h-[1px] bg-gray-200"></div>

                    {/* Footer Statement (Black Box) */}
                    <div className="bg-black text-white p-12 md:p-16 hover:bg-zinc-950 transition-colors duration-500 cursor-default">
                        <p className="text-[14px] md:text-[18px] font-black tracking-[0.1em] uppercase italic leading-relaxed">
                            {(() => {
                                const lowerTag = tagline.toLowerCase();
                                const idx = lowerTag.indexOf("stay above");
                                if (idx === -1) return tagline;
                                const before = tagline.substring(0, idx);
                                const match = tagline.substring(idx, idx + 10);
                                const after = tagline.substring(idx + 10);
                                return <>{before}<span className="opacity-70">{match}</span>{after}</>;
                            })()}
                        </p>

                        <div className="mt-12 pt-8 border-t border-white/10 space-y-1">
                            <p className="text-[11px] font-bold tracking-wider text-white/40">{footerName.toUpperCase()}</p>
                            <p className="text-[10px] text-white/30">All Rights Reserved © 2026</p>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
