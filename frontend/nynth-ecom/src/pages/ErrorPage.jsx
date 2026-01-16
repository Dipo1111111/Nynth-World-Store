import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ServerCrash, ArrowLeft } from "lucide-react";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";

export default function ErrorPage({ status = 500, message }) {
    const is403 = status === 403;

    const content = {
        403: {
            icon: <ShieldAlert size={48} className="text-orange-600" />,
            title: "Access Denied",
            desc: message || "You don't have permission to view this page. This area is reserved for admins.",
            bg: "bg-orange-50"
        },
        500: {
            icon: <ServerCrash size={48} className="text-red-600" />,
            title: "Server Error",
            desc: message || "Our servers are acting up. We've been notified and are looking into it.",
            bg: "bg-red-50"
        }
    }[status] || {
        icon: <ServerCrash size={48} className="text-gray-600" />,
        title: "Unexpected Error",
        desc: "Something went wrong on our end.",
        bg: "bg-gray-50"
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <div className={`w-24 h-24 ${content.bg} rounded-3xl flex items-center justify-center mx-auto mb-8`}>
                        {content.icon}
                    </div>
                    <h1 className="font-space text-4xl font-bold mb-4">{content.title}</h1>
                    <p className="text-gray-500 mb-10 leading-relaxed">
                        {content.desc}
                    </p>
                    <div className="space-y-4">
                        <Link
                            to="/"
                            className="flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg"
                        >
                            <ArrowLeft size={20} />
                            Return to Shop
                        </Link>
                        <p className="text-sm text-gray-400 italic">
                            Error Code: {status}
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
