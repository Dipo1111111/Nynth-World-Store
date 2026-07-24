import React from "react";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { useSettings } from "../context/SettingsContext";

export default function ShippingReturns() {
    const { settings } = useSettings();
    return (
        <div className="min-h-screen bg-white text-black flex flex-col">
            <Header />
            <main className="flex-1 section-pad py-20 max-w-4xl mx-auto w-full">
                <h1 className="hero-title text-black mb-16 text-left">SHIPPING & RETURNS</h1>

                <div className="space-y-12">
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">SHIPPING POLICY</h3>
                        <p className="text-[13px] text-gray-600 leading-[1.8]">
                            We currently ship within Nigeria. Orders are processed within 3–10 business days.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">DELIVERY TIMELINES</h3>
                        <ul className="space-y-2">
                            <li className="text-[13px] text-gray-600 leading-[1.8] flex items-start gap-3">
                                <span className="w-1 h-1 rounded-full bg-black mt-2 shrink-0"></span>
                                Lagos Deliveries: 3–5 business days
                            </li>
                            <li className="text-[13px] text-gray-600 leading-[1.8] flex items-start gap-3">
                                <span className="w-1 h-1 rounded-full bg-black mt-2 shrink-0"></span>
                                Nationwide Deliveries (Outside Lagos): 5–10 business days
                            </li>
                        </ul>
                        <p className="text-[13px] text-gray-600 leading-[1.8]">
                            International shipping is not available at this time.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">RETURN POLICY</h3>
                        <p className="text-[13px] text-gray-600 leading-[1.8]">
                            We operate a 4-day return policy. This means you have 4 days after receiving your item to request a return.
                        </p>
                        <p className="text-[13px] text-gray-600 leading-[1.8]">
                            To be eligible, items must be returned in the same condition they were received — unworn, unused, with all tags intact and in original packaging. Proof of purchase is required.
                        </p>
                        <p className="text-[13px] text-gray-600 leading-[1.8]">
                            Returns are only accepted in cases of incorrect items or verified defects. All requests are subject to approval.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">DAMAGES AND ISSUES</h3>
                        <p className="text-[13px] text-gray-600 leading-[1.8]">
                            Please inspect your order upon delivery and contact us immediately if your item is defective, damaged, or if you receive the wrong item. This allows us to review the issue and resolve it accordingly.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">NEED HELP?</h3>
                        <p className="text-[13px] text-gray-600 leading-[1.8]">
                            For any questions regarding shipping or returns, please contact us at nynthworld@gmail.com.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
