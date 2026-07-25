import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ServerCrash, ArrowLeft } from "lucide-react";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";

export default function ErrorPage({ status = 500, message }) {
    const is403 = status === 403;

    const content = {
        403: {
            icon: <ShieldAlert size={32} className="text-orange-600" />,
            title: "ACCESS DENIED",
            desc: message || "You don't have permission to view this page. This area is reserved for admins.",
            bg: "bg-orange-50"
        },
        500: {
            icon: <ServerCrash size={32} className="text-red-600" />,
            title: "SERVER ERROR",
            desc: message || "Our servers are acting up. We've been notified and are looking into it.",
            bg: "bg-red-50"
        }
    }[status] || {
        icon: <ServerCrash size={32} className="text-gray-600" />,
        title: "UNEXPECTED ERROR",
        desc: "Something went wrong on our end.",
        bg: "bg-gray-50"
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <div className={`w-24 h-24 ${content.bg} flex items-center justify-center mx-auto mb-8`}>
                        {content.icon}
                    </div>
                    <h1 className="text-[11px] tracking-[0.3em] font-bold uppercase mb-4">{content.title}</h1>
                    <p className="text-[10px] tracking-[0.15em] text-gray-400 mb-10 uppercase leading-relaxed">
                        {content.desc}
                    </p>
                    <div className="space-y-4">
                        <Link
                            to="/"
                            className="flex items-center justify-center gap-2 bg-black text-white px-8 py-4 text-[10px] tracking-[0.3em] font-bold uppercase hover:opacity-90 transition-all"
                        >
                            <ArrowLeft size={14} />
                            RETURN TO SHOP
                        </Link>
                        <p className="text-[9px] tracking-[0.2em] text-gray-300 uppercase">
                            ERROR CODE: {status}
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
