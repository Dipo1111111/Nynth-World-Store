import React from "react";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { useSettings } from "../context/SettingsContext";

export default function TermsOfService() {
    const { settings } = useSettings();

    return (
        <div className="min-h-screen bg-white text-black flex flex-col">
            <Header />
            <main className="flex-1 section-pad max-w-4xl mx-auto w-full">
                <h1 className="font-space text-3xl md:text-4xl font-bold mb-8">Terms of Service</h1>

                <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
                    <p>
                        This website is operated by NYNTH. Throughout the site, the terms "we", "us" and "our" refer to NYNTH. NYNTH offers this website, including all information, tools and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies and notices stated here.
                    </p>

                    <h3 className="text-black text-xl font-bold pt-4">1. Online Store Terms</h3>
                    <p>
                        By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence. You may not use our products for any illegal or unauthorized purpose nor may you, in the use of the Service, violate any laws in your jurisdiction (including but not limited to copyright laws).
                    </p>

                    <h3 className="text-black text-xl font-bold pt-4">2. General Conditions</h3>
                    <p>
                        We reserve the right to refuse service to anyone for any reason at any time. You understand that your content (not including credit card information), may be transferred unencrypted and involve (a) transmissions over various networks; and (b) changes to conform and adapt to technical requirements of connecting networks or devices.
                    </p>

                    <h3 className="text-black text-xl font-bold pt-4">3. Accuracy, Completeness and Timeliness of Information</h3>
                    <p>
                        We are not responsible if information made available on this site is not accurate, complete or current. The material on this site is provided for general information only and should not be relied upon or used as the sole basis for making decisions without consulting primary, more accurate, more complete or more timely sources of information.
                    </p>

                    <h3 className="text-black text-xl font-bold pt-4">4. Modifications to the Service and Prices</h3>
                    <p>
                        Prices for our products are subject to change without notice. We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time.
                    </p>

                    <h3 className="text-black text-xl font-bold pt-4">5. Contact Information</h3>
                    <p>
                        Questions about the Terms of Service should be sent to us at {settings.support_email}.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
