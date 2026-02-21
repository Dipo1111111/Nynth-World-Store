import React from "react";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { useSettings } from "../context/SettingsContext";

export default function PrivacyPolicy() {
    const { settings } = useSettings();

    return (
        <div className="min-h-screen bg-white text-black flex flex-col">
            <Header />
            <main className="flex-1 section-pad max-w-4xl mx-auto w-full">
                <h1 className="font-space text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>

                <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>

                    <p>
                        This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from NYNTH.
                    </p>

                    <h3 className="text-black text-xl font-bold pt-4">Personal Information We Collect</h3>
                    <p>
                        When you visit the Site, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device.
                    </p>
                    <p>
                        Additionally, when you make a purchase or attempt to make a purchase through the Site, we collect certain information from you, including your name, billing address, shipping address, payment info, email address, and phone number.
                    </p>

                    <h3 className="text-black text-xl font-bold pt-4">How We Use Your Personal Information</h3>
                    <p>
                        We use the Order Information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations). Additionally, we use this Order Information to:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Communicate with you;</li>
                        <li>Screen our orders for potential risk or fraud; and</li>
                        <li>When in line with the preferences you have shared with us, provide you with information or advertising relating to our products or services.</li>
                    </ul>

                    <h3 className="text-black text-xl font-bold pt-4">Sharing Your Personal Information</h3>
                    <p>
                        We share your Personal Information with third parties to help us use your Personal Information, as described above. For example, we use Google Analytics to help us understand how our customers use the Site.
                    </p>
                    <p>
                        Finally, we may also share your Personal Information to comply with applicable laws and regulations, to respond to a subpoena, search warrant or other lawful request for information we receive, or to otherwise protect our rights.
                    </p>

                    <h3 className="text-black text-xl font-bold pt-4">Cookies and Tracking Technologies</h3>
                    <p>We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. Cookies are files with small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>

                    <h3 className="text-black text-xl font-bold pt-4">Log Files</h3>
                    <p>NYNTH follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.</p>

                    <h3 className="text-black text-xl font-bold pt-4">Contact Us</h3>
                    <p>
                        For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at {settings.support_email}.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
