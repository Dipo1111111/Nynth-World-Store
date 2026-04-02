import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchSettings } from "../api/firebaseFunctions";
import { withRetry } from "../utils/errorHandlers";

const SettingsContext = createContext();

export function useSettings() {
    return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({
        site_name: import.meta.env.VITE_SITE_NAME || "NYNTH",
        support_email: import.meta.env.VITE_SUPPORT_EMAIL || "support@nynth.com",
        support_phone: import.meta.env.VITE_SUPPORT_PHONE || "+234 123 456 7890",
        support_whatsapp: import.meta.env.VITE_SUPPORT_WHATSAPP || "+234 123 456 7890",
        office_address: import.meta.env.VITE_OFFICE_ADDRESS || "123 Fashion Street, Lagos, Nigeria",
        instagram_url: import.meta.env.VITE_INSTAGRAM_URL || "https://instagram.com/nynth",
        twitter_url: import.meta.env.VITE_TWITTER_URL || "https://x.com/nynth",
        facebook_url: import.meta.env.VITE_FACEBOOK_URL || "https://facebook.com/nynth",
        shipping_fee: Number(import.meta.env.VITE_DEFAULT_SHIPPING_FEE) || 2500,
        currency_symbol: import.meta.env.VITE_CURRENCY_SYMBOL || "₦",
        hero_banner: "",
        show_size_chart: true,
        size_chart_model_info: "Our model is 185cm tall and wears a size M. NYNTH pieces are cut to an oversized silhouette — size down if you prefer a more fitted look.",
        size_chart_data: [
          { size: "XS", chest: "81-86", waist: "66-71", length: "68" },
          { size: "S", chest: "86-91", waist: "71-76", length: "70" },
          { size: "M", chest: "91-97", waist: "76-81", length: "72" },
          { size: "L", chest: "97-102", waist: "81-86", length: "74" },
          { size: "XL", chest: "102-107", waist: "86-91", length: "76" },
          { size: "XXL", chest: "107-112", waist: "91-97", length: "78" },
        ]
    });
    const [loading, setLoading] = useState(true);

    const refreshSettings = async () => {
        try {
            const data = await withRetry(fetchSettings);
            if (data) {
                setSettings(data);
            }
        } catch (error) {
            console.error("Failed to fetch settings after retries:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshSettings();
    }, []);

    const value = {
        settings,
        loading,
        refreshSettings
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}
