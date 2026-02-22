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
                        We ship to most locations worldwide. Orders are typically processed within 1-3 business days.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Domestic Shipping:</strong> Usually takes 3-5 business days.</li>
                        <li><strong>International Shipping:</strong> Can take 7-14 business days depending on location and customs processing.</li>
                    </ul>
                    <p>
                        Once your order ships, you will receive a tracking number via email.
                    </p>

                    <h3 className="text-black text-xl font-bold pt-4">Return Policy</h3>
                    <p>
                        We have a 14-day return policy, which means you have 14 days after receiving your item to request a return.
                    </p>
                    <p>
                        To be eligible for a return, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You’ll also need the receipt or proof of purchase.
                    </p>

                    <h3 className="text-black text-xl font-bold pt-4">Damages and Issues</h3>
                    <p>
                        Please inspect your order upon reception and contact us immediately if the item is defective, damaged or if you receive the wrong item, so that we can evaluate the issue and make it right.
                    </p>

                    <h3 className="text-black text-xl font-bold pt-4">Exchanges</h3>
                    <p>
                        The fastest way to ensure you get what you want is to return the item you have, and once the return is accepted, make a separate purchase for the new item.
                    </p>

                    <h3 className="text-black text-xl font-bold pt-4">Need Help?</h3>
                    <p>
                        If you have any questions concerning our shipping or return policies, please contact us at {settings.support_email}.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
