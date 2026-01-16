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
        office_address: import.meta.env.VITE_OFFICE_ADDRESS || "123 Fashion Street, Lagos, Nigeria",
        instagram_url: import.meta.env.VITE_INSTAGRAM_URL || "https://instagram.com/nynth",
        twitter_url: import.meta.env.VITE_TWITTER_URL || "https://twitter.com/nynth",
        facebook_url: import.meta.env.VITE_FACEBOOK_URL || "https://facebook.com/nynth",
        shipping_fee: Number(import.meta.env.VITE_DEFAULT_SHIPPING_FEE) || 2500,
        currency_symbol: import.meta.env.VITE_CURRENCY_SYMBOL || "₦"
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
