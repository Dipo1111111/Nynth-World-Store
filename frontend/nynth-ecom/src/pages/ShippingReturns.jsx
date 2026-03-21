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

                <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
                    <h3 className="text-black text-xl font-bold pt-4">Shipping Policy</h3>
                    <p>
                        We currently ship within Nigeria. Orders are processed within 1–5 business days.
                    </p>

                    <h3 className="text-black text-xl font-bold pt-4">Delivery Timelines</h3>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Lagos Deliveries: 2–3 business days</li>
                        <li>Nationwide Deliveries (Outside Lagos): 3–7 business days</li>
                    </ul>
                    <p>
                        International shipping is not available at this time.
                    </p>

                    <h3 className="text-black text-xl font-bold pt-4">Return Policy</h3>
                    <p>
                        We operate a 4-day return policy. This means you have 4 days after receiving your item to request a return.
                    </p>
                    <p>
                        To be eligible, items must be returned in the same condition they were received — unworn, unused, with all tags intact and in original packaging. Proof of purchase is required.
                    </p>
                    <p>
                        Returns are only accepted in cases of incorrect items or verified defects. All requests are subject to approval.
                    </p>

                    <h3 className="text-black text-xl font-bold pt-4">Damages and Issues</h3>
                    <p>
                        Please inspect your order upon delivery and contact us immediately if your item is defective, damaged, or if you receive the wrong item. This allows us to review the issue and resolve it accordingly.
                    </p>


                    <h3 className="text-black text-xl font-bold pt-4">Need Help?</h3>
                    <p>
                        For any questions regarding shipping or returns, please contact us at nynthworld@gmail.com.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
