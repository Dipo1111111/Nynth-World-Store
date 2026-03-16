import React, { useState } from "react";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { Mail, MapPin, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { useSettings } from "../context/SettingsContext";
import { saveContactMessage, sendTriggerEmail } from "../api/firebaseFunctions";

export default function Contact() {
    const { settings } = useSettings();

    return (
        <div className="min-h-screen bg-white text-black flex flex-col font-inter">
            <Header />
            <main className="flex-1 section-pad py-20 md:py-32">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="hero-title text-black mb-20">CONTACT</h1>

                    <div className="max-w-2xl mx-auto space-y-16">
                        <div className="space-y-6">
                            <h3 className="text-[12px] tracking-[0.4em] font-bold uppercase text-gray-400">Support Hub</h3>
                            <p className="text-[14px] md:text-[16px] text-gray-600 leading-[1.8] font-medium">
                                For all inquiries regarding orders, collaborations, or general questions, 
                                please reach out directly via WhatsApp or Email. Our team is available 
                                to assist you Monday through Friday.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12 pt-8">
                            <div className="space-y-4 p-8 border border-black/5 hover:border-black/20 transition-all group">
                                <h4 className="text-[10px] tracking-[0.3em] font-bold text-gray-400 uppercase">WhatsApp</h4>
                                <p className="text-[15px] font-bold tracking-widest">{settings.support_phone}</p>
                                <a
                                    href={`https://wa.me/+234${settings.support_phone?.replace(/\D/g, '').slice(-10)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 mt-4 px-10 py-4 bg-black text-white text-[10px] font-bold tracking-[0.3em] uppercase hover:opacity-90 transition-all"
                                >
                                    Chat Now
                                </a>
                            </div>

                            <div className="space-y-4 p-8 border border-black/5 hover:border-black/20 transition-all">
                                <h4 className="text-[10px] tracking-[0.3em] font-bold text-gray-400 uppercase">Email</h4>
                                <p className="text-[15px] font-bold tracking-widest">{settings.support_email}</p>
                                <a
                                    href={`mailto:${settings.support_email}`}
                                    className="inline-flex items-center gap-2 mt-4 px-10 py-4 border border-black text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-black hover:text-white transition-all"
                                >
                                    Send Email
                                </a>
                            </div>
                        </div>

                        <div className="pt-12 space-y-4">
                            <h4 className="text-[10px] tracking-[0.3em] font-bold text-gray-400 uppercase">Lagos Studio</h4>
                            <p className="text-[14px] font-bold tracking-[0.2em] uppercase max-w-xs mx-auto text-gray-800">
                                {settings.office_address}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
