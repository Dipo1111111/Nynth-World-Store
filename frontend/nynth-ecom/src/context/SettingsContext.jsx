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
        office_address: import.meta.env.VITE_OFFICE_ADDRESS || "Abuja, Nigeria",
        instagram_url: import.meta.env.VITE_INSTAGRAM_URL || "https://instagram.com/nynth",
        twitter_url: import.meta.env.VITE_TWITTER_URL || "https://x.com/nynth",
        facebook_url: import.meta.env.VITE_FACEBOOK_URL || "https://facebook.com/nynth",
        shipping_fee: Number(import.meta.env.VITE_DEFAULT_SHIPPING_FEE) || 2500,
        currency_symbol: import.meta.env.VITE_CURRENCY_SYMBOL || "₦",
        hero_banner: "",
        banner_hover_color: "red",
        lock_page_enabled: false,
        lock_epoch: 0,
        lock_timer_enabled: false,
        lock_timer_duration_minutes: 5,
        launch_date: "2026-04-03T18:00:00",
        show_size_chart: true,
        size_chart_model_info: "Our model is 185cm tall and wears a size M. NYNTH pieces are cut to an oversized silhouette — size down if you prefer a more fitted look.",
        disabled_locations: { lagos: ["Abijo","Abule Ado","Abuleegba","Agbara","Agege","Ago palace","Agungi","Ajah","Ajao Estate","Ajegunle","Akowonjo","Akute","Alaguntan","Alaagbado","Alapere","Alimosho","Amuwo","Anthony","Apapa","Araga","Arepo","Asese","Awoyaya","Ayobo","Badagry","Badore","Bariga","Cement","Chevron","Costain","Dangote Refinery","Ebute Metta","Egbeda","Ejigbo","Epe Ibeju","Fadeyi","Festac","Gbagada","Gbagada Phase 1","Ibafo","Iddo","Idi Araba","Idi Iroko","Idimu","Ifako Ijaiye","Igando","Ijegun","Ikeja","Ikeja Airport","Ikate","Ikorodu","Ikosi","Ikota","Ikotun","Ikoyi","Ilasa","Ilasan","Ilasamaja","Ilupeju","Imota","Ipaja","Isheri olofin","Isheri oshun","Isolo","Iyana ipaja","Jakande","Jibowu","Ketu","Kola","Lagos Island","LASU","Lekki 2","Lekkil","LUTH","Magodo","Magodo 1","Mangoro","Marina","Maryland","Meiran","Mile 12","Mile2","Mowe","Mushin","New Garage","Obanikoro","Obawole","Ogba","Ogombo","Ogudu","Ojo","Ojodu","Ojota","Okokomiako","Ologolo","Olowoira","Omole 1","Omole 2","Onipanu","Oniru","Opic","Orchid","Osapa","Oshodi","Oworo","Oyingbo","Palmgrove","Papa Ajao","Pedro","Sango Otta","Sangotedo","Satellite","Shasha","Shibiti","Somolu","Surulere","Tradefair","VGC","Vi","Yaba","Abule Oja","Akoka","Akute Border","Alaka Estate","Computer Village","Dopemu","Fagba","Iganmu","Ijaiye","Ijesha Surulere","Iju","Ojuelegba","Baruwa","Gowon Estate","Okota","Obalende","Osborne Foreshore","Abraham Adesanya","Ilaje","Magboro","Ijanikin","Lekki Deep Sea Port"], abuja: [], interstate: [] },
        announcement_bar_enabled: false,
        announcement_bar_text: "NEXT DROP IN:",
        marquee_enabled: false,
        marquee_text: "FREE DELIVERY ON ORDERS OVER ₦50,000",
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
