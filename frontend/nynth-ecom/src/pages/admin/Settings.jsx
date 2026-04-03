import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { fetchSettings, updateSettings, mergeSubscriberDuplicates, uploadImage } from "../../api/firebaseFunctions";
import toast from "react-hot-toast";
import { Save, Loader2, Globe, Mail, Phone, MapPin, Share2, Truck, Upload, ImageIcon, X, Trash2, Plus, Ruler, Package as PackageIcon } from "lucide-react";
import { compressImage } from "../../utils/imageUtils";
import { useSettings } from "../../context/SettingsContext";
import headerBanner from "../../assets/header.JPEG";

export default function AdminSettings() {
    const [settings, setSettings] = useState({
        site_name: "",
        support_email: "",
        support_phone: "",
        office_address: "",
        instagram_url: "",
        twitter_url: "",
        facebook_url: "",
        tiktok_url: "",
        shipping_fee: 0,
        currency_symbol: import.meta.env.VITE_CURRENCY_SYMBOL || "₦",
        hero_banner: "",
        lock_page_enabled: false,
        launch_date: "2026-04-03T18:00:00",
        show_size_chart: true,
        size_chart_model_info: "",
        size_chart_data: [],
        // Lock Page Settings
        lock_password: "WINNERSONLY",
        lock_title1: "BY WINNERS FOR WINNERS",
        lock_title2: "STAY ABOVE",
        lock_waitlist_title: "JOIN THE WAITLIST",
        lock_waitlist_title: "JOIN THE WAITLIST",
        lock_waitlist_subtitle: "BE NOTIFIED WHEN WE GO LIVE",
        lock_page_enabled: false,
        launch_date: "2026-04-03T18:00:00",
        // Product Options
        available_colors: "Black, White, Grey, Navy, Beige, Red, Blue, Green, Olive, Brown, Burgundy, Pink, Yellow, Purple",
        available_sizes: "XS, S, M, L, XL, XXL, XXXL"
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { refreshSettings } = useSettings();
    const [isUploading, setIsUploading] = useState(false);
    const [isMerging, setIsMerging] = useState(false);

    const handleHeroBannerUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsUploading(true);
            toast.loading("Uploading Hero Banner...", { id: "upload-status" });
            
            const compressed = await compressImage(file, { maxSizeMB: 2, maxWidthOrHeight: 2500 });
            const url = await uploadImage(compressed);
            
            setSettings(prev => ({ ...prev, hero_banner: url }));
            toast.success("Image uploaded. Remember to Save All Settings.", { id: "upload-status" });
        } catch (error) {
            console.error("Banner upload failed:", error);
            toast.error("Upload failed.", { id: "upload-status" });
        } finally {
            setIsUploading(false);
            e.target.value = "";
        }
    };

    const handleMerge = async () => {
        if (!window.confirm("This will find all duplicate emails and merge them into single entries (keeping the oldest signup). Proceed?")) return;
        
        setIsMerging(true);
        try {
            const result = await mergeSubscriberDuplicates();
            if (result.success) {
                toast.success(`Succesfully merged ${result.mergedCount} duplicates.`);
            }
        } catch (error) {
            toast.error("Failed to merge duplicates");
        } finally {
            setIsMerging(false);
        }
    };

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await fetchSettings();
                if (data) {
                    setSettings(prev => ({
                        ...prev,
                        ...data,
                        // Ensure defaults if missing in DB
                        lock_password: data.lock_password || "WINNERSONLY",
                        lock_title1: data.lock_title1 || "BY WINNERS FOR WINNERS",
                        lock_title2: data.lock_title2 || "STAY ABOVE",
                        lock_waitlist_title: data.lock_waitlist_title || "JOIN THE WAITLIST",
                        lock_waitlist_subtitle: data.lock_waitlist_subtitle || "BE NOTIFIED WHEN WE GO LIVE",
                        available_colors: data.available_colors || "Black, White, Grey, Navy, Beige, Red, Blue, Green, Olive, Brown, Burgundy, Pink, Yellow, Purple",
                        available_sizes: data.available_sizes || "XS, S, M, L, XL, XXL, XXXL"
                    }));
                }
            } catch (error) {
                toast.error("Failed to load settings");
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : (name === "shipping_fee" ? Number(value) : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const success = await updateSettings(settings);
            if (success) {
                toast.success("Settings updated successfully");
                refreshSettings();
            } else {
                toast.error("Failed to update settings");
            }
        } catch (error) {
            toast.error("Error updating settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout title="Settings">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin text-gray-400" size={32} />
                </div>
            </AdminLayout>
        );
    }

    const SectionTitle = ({ icon: Icon, title }) => (
        <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100">
            <Icon size={18} className="text-gray-400" />
            <h3 className="font-bold text-lg">{title}</h3>
        </div>
    );

    return (
        <AdminLayout title="Settings">
            <form onSubmit={handleSubmit} className="max-w-4xl space-y-8">
                {/* General Settings */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <SectionTitle icon={Globe} title="General Configuration" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Site Name</label>
                            <input
                                name="site_name"
                                value={settings.site_name}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors"
                                placeholder="NYNTH"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Currency Symbol</label>
                            <input
                                name="currency_symbol"
                                value={settings.currency_symbol}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors"
                                placeholder="₦"
                            />
                        </div>
                    </div>
                </div>

                {/* PRODUCT VARIANT OPTIONS */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <SectionTitle icon={PackageIcon} title="Product Variant Options" />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6 leading-relaxed">
                        Manage the preset options available when creating or editing products. Separate items with commas.
                    </p>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Available Colors</label>
                            <textarea
                                name="available_colors"
                                value={settings.available_colors}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors font-mono text-xs"
                                placeholder="Black, White, Red..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Available Sizes</label>
                            <textarea
                                name="available_sizes"
                                value={settings.available_sizes}
                                onChange={handleChange}
                                rows={2}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors font-mono text-xs"
                                placeholder="XS, S, M, L, XL..."
                            />
                        </div>
                    </div>
                </div>

                {/* LOCK PAGE CONFIGURATION */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <SectionTitle icon={MapPin} title="Lock Page Configuration" />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6 leading-relaxed">
                        Control the content and access for the pre-launch/maintenance page.
                    </p>
                    
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg flex items-center justify-between border border-black/5">
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-black uppercase tracking-tight">Enable Lock Page</h4>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">When enabled, all public store pages will be hidden behind the password wall.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="lock_page_enabled"
                                checked={settings.lock_page_enabled}
                                onChange={handleChange}
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Launch Countdown Date</label>
                            <input
                                type="datetime-local"
                                name="launch_date"
                                value={settings.launch_date ? settings.launch_date.substring(0, 16) : ""}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors font-mono"
                            />
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">This sets the timer for the Lock Page and Header Announcement.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Lock Password</label>
                            <input
                                name="lock_password"
                                value={settings.lock_password}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors font-mono"
                                placeholder="WINNERSONLY"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Title Line 1</label>
                            <input
                                name="lock_title1"
                                value={settings.lock_title1}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors"
                                placeholder="BY WINNERS FOR WINNERS"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Title Line 2 (Faded)</label>
                            <input
                                name="lock_title2"
                                value={settings.lock_title2}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors"
                                placeholder="STAY ABOVE"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Waitlist Section Title</label>
                            <input
                                name="lock_waitlist_title"
                                value={settings.lock_waitlist_title}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors"
                                placeholder="JOIN THE WAITLIST"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Waitlist Section Subtitle</label>
                            <input
                                name="lock_waitlist_subtitle"
                                value={settings.lock_waitlist_subtitle}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors"
                                placeholder="BE NOTIFIED WHEN WE GO LIVE"
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <SectionTitle icon={Mail} title="Contact Information" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Support Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    name="support_email"
                                    type="email"
                                    value={settings.support_email}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors"
                                    placeholder="support@nynth.com"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Support Phone</label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    name="support_phone"
                                    value={settings.support_phone}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors"
                                    placeholder="+234..."
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Support WhatsApp</label>
                            <div className="relative">
                                <Share2 size={16} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    name="support_whatsapp"
                                    value={settings.support_whatsapp}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors"
                                    placeholder="+234..."
                                />
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Office Address</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    name="office_address"
                                    value={settings.office_address}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors"
                                    placeholder="123 Street, Lagos"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Media */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <SectionTitle icon={Share2} title="Social Media Links" />
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Instagram URL</label>
                            <input
                                name="instagram_url"
                                value={settings.instagram_url}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors"
                                placeholder="https://instagram.com/..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">X (Twitter) URL</label>
                            <input
                                name="twitter_url"
                                value={settings.twitter_url}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors"
                                placeholder="https://x.com/..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Facebook URL</label>
                            <input
                                name="facebook_url"
                                value={settings.facebook_url}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors"
                                placeholder="https://facebook.com/..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">TikTok URL</label>
                            <input
                                name="tiktok_url"
                                value={settings.tiktok_url || ""}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors"
                                placeholder="https://tiktok.com/..."
                            />
                        </div>
                    </div>
                </div>

                {/* Google Analytics Settings */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <SectionTitle icon={Globe} title="Google Analytics 4 (Data API)" />
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">GA4 Property ID</label>
                            <input
                                name="ga_property_id"
                                value={settings.ga_property_id || ""}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors font-mono text-sm"
                                placeholder="e.g. 123456789"
                            />
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                                Required for the Admin Dashboard to pull real-time metrics. <br/>
                                Find this in: <b>GA4 Admin &gt; Property Settings &gt; Property ID</b>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Brand Assets Section */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <SectionTitle icon={ImageIcon} title="Brand Hero Assets" />
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-black/5">
                            <span className="text-[10px] font-bold text-black uppercase tracking-widest leading-none">Currently Active Banner</span>
                            {!settings.hero_banner && (
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-white px-2 py-1 rounded border border-black/5">Default System Asset</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="relative w-full aspect-[21/9] md:aspect-[21/6] rounded-lg overflow-hidden border border-black/5">
                                <img 
                                    src={settings.hero_banner || headerBanner} 
                                    className="w-full h-full object-cover transition-opacity duration-300" 
                                    alt="Hero Preview" 
                                />
                                {settings.hero_banner && (
                                    <button
                                        type="button"
                                        onClick={() => setSettings(prev => ({ ...prev, hero_banner: "" }))}
                                        className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black transition-colors shadow-lg"
                                        title="Reset to Default"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                            <div className="relative border-2 border-dashed border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center hover:bg-gray-50 transition-all cursor-pointer group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleHeroBannerUpload}
                                    disabled={isUploading}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <Upload size={24} className="text-gray-400 mb-2 group-hover:text-black transition-colors" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-black">
                                    {isUploading ? "Uploading..." : "Replace Header Image"}
                                </span>
                                <p className="text-[10px] text-gray-400 mt-2">Recommended: 2000 x 600 px (Horizontal)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shipping Settings */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <SectionTitle icon={Truck} title="Shipping Configuration" />
                    <div className="max-w-xs space-y-2">
                        <label className="text-sm font-medium text-gray-700">Default Shipping Fee ({settings.currency_symbol})</label>
                        <input
                            name="shipping_fee"
                            type="number"
                            value={settings.shipping_fee}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors"
                        />
                    </div>
                </div>

                {/* Email Section Settings */}
                <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm">
                    <SectionTitle icon={Mail} title="Email Section Settings" />
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight">Database Cleanup</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                                    Merge duplicate subscriber entries to maintain a clean mailing list.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleMerge}
                                disabled={isMerging}
                                className="px-6 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-50 shrink-0"
                            >
                                {isMerging ? "Cleaning..." : "Clean Duplicates"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Size Chart Settings */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <SectionTitle icon={Ruler} title="Size Chart Configuration" />
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-widest text-black">Enable Size Chart</h4>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Show or hide the size guide on product pages</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSettings(prev => ({ ...prev, show_size_chart: !prev.show_size_chart }))}
                                className={`w-12 h-6 rounded-full transition-colors relative ${settings.show_size_chart ? 'bg-black' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.show_size_chart ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        {settings.show_size_chart && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold uppercase tracking-widest text-black">Model & Sizing Info</label>
                                    <textarea
                                        name="size_chart_model_info"
                                        value={settings.size_chart_model_info}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black transition-colors text-[11px] leading-relaxed"
                                        placeholder="Our model is 185cm tall and wears a size M..."
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold uppercase tracking-widest text-black">Measurement Table</label>
                                        <button
                                            type="button"
                                            onClick={() => setSettings(prev => ({
                                                ...prev,
                                                size_chart_data: [...(prev.size_chart_data || []), { size: "", chest: "", waist: "", length: "" }]
                                            }))}
                                            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-black text-white px-3 py-1.5 rounded hover:opacity-80 transition-opacity"
                                        >
                                            <Plus size={12} /> Add Row
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto border border-gray-100 rounded-lg">
                                        <table className="w-full text-left">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                    <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Size</th>
                                                    <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Chest (cm)</th>
                                                    <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Waist (cm)</th>
                                                    <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Length (cm)</th>
                                                    <th className="p-3 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {(settings.size_chart_data || []).map((row, idx) => (
                                                    <tr key={idx}>
                                                        <td className="p-2">
                                                            <input
                                                                value={row.size}
                                                                onChange={(e) => {
                                                                    const newData = [...settings.size_chart_data];
                                                                    newData[idx].size = e.target.value;
                                                                    setSettings({ ...settings, size_chart_data: newData });
                                                                }}
                                                                className="w-full px-2 py-1.5 border border-transparent focus:border-gray-200 rounded text-[11px] font-bold uppercase text-center"
                                                                placeholder="M"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                value={row.chest}
                                                                onChange={(e) => {
                                                                    const newData = [...settings.size_chart_data];
                                                                    newData[idx].chest = e.target.value;
                                                                    setSettings({ ...settings, size_chart_data: newData });
                                                                }}
                                                                className="w-full px-2 py-1.5 border border-transparent focus:border-gray-200 rounded text-[11px] text-center"
                                                                placeholder="91-97"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                value={row.waist}
                                                                onChange={(e) => {
                                                                    const newData = [...settings.size_chart_data];
                                                                    newData[idx].waist = e.target.value;
                                                                    setSettings({ ...settings, size_chart_data: newData });
                                                                }}
                                                                className="w-full px-2 py-1.5 border border-transparent focus:border-gray-200 rounded text-[11px] text-center"
                                                                placeholder="76-81"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                value={row.length}
                                                                onChange={(e) => {
                                                                    const newData = [...settings.size_chart_data];
                                                                    newData[idx].length = e.target.value;
                                                                    setSettings({ ...settings, size_chart_data: newData });
                                                                }}
                                                                className="w-full px-2 py-1.5 border border-transparent focus:border-gray-200 rounded text-[11px] text-center"
                                                                placeholder="72"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newData = settings.size_chart_data.filter((_, i) => i !== idx);
                                                                    setSettings({ ...settings, size_chart_data: newData });
                                                                }}
                                                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {(!settings.size_chart_data || settings.size_chart_data.length === 0) && (
                                            <div className="p-8 text-center bg-gray-50/50">
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">No measurement rows added</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>


                {/* Submit */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-70 transition-all shadow-lg"
                    >
                        {saving ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <Save size={20} />
                        )}
                        {saving ? "Saving Changes..." : "Save All Settings"}
                    </button>
                </div>
            </form>
        </AdminLayout>

    );
}
