import React, { useState } from "react";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { Mail, MapPin, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { useSettings } from "../context/SettingsContext";
import { saveContactMessage, sendTriggerEmail } from "../api/firebaseFunctions";

export default function Contact() {
    const { settings } = useSettings();
    const [form, setForm] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!form.name.trim()) {
            newErrors.name = "Name is required";
        }

        if (!form.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!form.subject.trim()) {
            newErrors.subject = "Subject is required";
        }

        if (!form.message.trim()) {
            newErrors.message = "Message is required";
        } else if (form.message.trim().length < 10) {
            newErrors.message = "Message must be at least 10 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fix the errors in the form");
            return;
        }

        setIsSubmitting(true);

        try {
            const success = await saveContactMessage(form);
            if (success) {
                // Send notification email to admin
                await sendTriggerEmail(
                    settings.support_email,
                    `New Contact from ${form.name}: ${form.subject}`,
                    `
                    <h3>New Contact Message</h3>
                    <p><strong>From:</strong> ${form.name} (${form.email})</p>
                    <p><strong>Subject:</strong> ${form.subject}</p>
                    <p><strong>Message:</strong></p>
                    <p>${form.message}</p>
                    `
                );

                toast.success("Message sent successfully! We'll get back to you soon.");
                setForm({ name: "", email: "", subject: "", message: "" });
                setErrors({});
            } else {
                toast.error("Failed to send message. Please try again.");
            }
        } catch (error) {
            console.error("Contact form error:", error);
            toast.error("Something went wrong. Please try again or email us directly.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-black flex flex-col font-inter">
            <Header />
            <main className="flex-1 section-pad py-20 md:py-32">
                <div className="max-w-6xl mx-auto">
                    <h1 className="hero-title text-black text-left mb-20">CONTACT</h1>

                    <div className="grid lg:grid-cols-2 gap-20 lg:gap-32">
                        {/* Info */}
                        <div className="space-y-12">
                            <div>
                                <h3 className="text-[12px] tracking-[0.3em] font-bold uppercase text-gray-400 mb-8 border-b border-gray-100 pb-4 inline-block">Support Hub</h3>
                                <p className="text-[14px] md:text-[16px] text-gray-600 leading-[1.8] font-medium max-w-md">
                                    Have a question about an order, a collaboration, or just want to say hi?
                                    Fill out the form or reach out directly to our Lagos studio.
                                </p>
                            </div>

                            <div className="space-y-10">
                                <div className="space-y-2">
                                    <h4 className="text-[10px] tracking-[0.2em] font-bold text-gray-400 uppercase">Email</h4>
                                    <p className="text-[14px] font-bold tracking-widest">{settings.support_email}</p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-[10px] tracking-[0.2em] font-bold text-gray-400 uppercase">Phone</h4>
                                    <p className="text-[14px] font-bold tracking-widest">{settings.support_phone}</p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-[10px] tracking-[0.2em] font-bold text-gray-400 uppercase">Studio</h4>
                                    <p className="text-[14px] font-bold tracking-widest uppercase">{settings.office_address}</p>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="bg-[#F9F9F9] p-10 md:p-16">
                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="text-[9px] tracking-[0.3em] font-bold text-gray-400 uppercase">Full Name</label>
                                        <input
                                            required
                                            className={`w-full py-4 bg-transparent border-b transition-all outline-none text-[13px] font-medium tracking-wider uppercase ${errors.name ? 'border-red-500' : 'border-gray-200 focus:border-black'
                                                }`}
                                            value={form.name}
                                            onChange={e => {
                                                setForm({ ...form, name: e.target.value });
                                                if (errors.name) setErrors({ ...errors, name: null });
                                            }}
                                            placeholder="JOHN DOE"
                                        />
                                        {errors.name && <p className="text-[9px] text-red-500 font-bold tracking-widest uppercase">{errors.name}</p>}
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[9px] tracking-[0.3em] font-bold text-gray-400 uppercase">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            className={`w-full py-4 bg-transparent border-b transition-all outline-none text-[13px] font-medium tracking-wider uppercase ${errors.email ? 'border-red-500' : 'border-gray-200 focus:border-black'
                                                }`}
                                            value={form.email}
                                            onChange={e => {
                                                setForm({ ...form, email: e.target.value });
                                                if (errors.email) setErrors({ ...errors, email: null });
                                            }}
                                            placeholder="JOHN@EXAMPLE.COM"
                                        />
                                        {errors.email && <p className="text-[9px] text-red-500 font-bold tracking-widest uppercase">{errors.email}</p>}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] tracking-[0.3em] font-bold text-gray-400 uppercase">Subject</label>
                                    <input
                                        required
                                        className={`w-full py-4 bg-transparent border-b transition-all outline-none text-[13px] font-medium tracking-wider uppercase ${errors.subject ? 'border-red-500' : 'border-gray-200 focus:border-black'
                                            }`}
                                        value={form.subject}
                                        onChange={e => {
                                            setForm({ ...form, subject: e.target.value });
                                            if (errors.subject) setErrors({ ...errors, subject: null });
                                        }}
                                        placeholder="ORDER INQUIRY"
                                    />
                                    {errors.subject && <p className="text-[9px] text-red-500 font-bold tracking-widest uppercase">{errors.subject}</p>}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] tracking-[0.3em] font-bold text-gray-400 uppercase">Message</label>
                                    <textarea
                                        required
                                        rows={4}
                                        className={`w-full py-4 bg-transparent border-b transition-all outline-none text-[13px] font-medium tracking-wider uppercase resize-none ${errors.message ? 'border-red-500' : 'border-gray-200 focus:border-black'
                                            }`}
                                        value={form.message}
                                        onChange={e => {
                                            setForm({ ...form, message: e.target.value });
                                            if (errors.message) setErrors({ ...errors, message: null });
                                        }}
                                        placeholder="YOUR MESSAGE..."
                                    />
                                    {errors.message && <p className="text-[9px] text-red-500 font-bold tracking-widest uppercase">{errors.message}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-black text-white py-5 text-[11px] font-bold tracking-[0.3em] uppercase hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center"
                                >
                                    {isSubmitting ? "Processing..." : "Submit Inquiry"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
