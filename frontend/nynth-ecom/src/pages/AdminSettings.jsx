import React, { useState, useEffect } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import { fetchSettings, updateSettings } from "../api/firebaseFunctions";
import { Save, Loader2, Globe, Mail, Phone, MapPin, Share2, Truck } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettings() {
    const [settings, setSettings] = useState({
        site_name: "",
        support_email: "",
        support_phone: "",
        office_address: "",
        instagram_url: "",
        twitter_url: "",
        facebook_url: "",
        shipping_fee: 0,
        currency_symbol: "₦"
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await fetchSettings();
                if (data) {
                    setSettings(data);
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
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: name === "shipping_fee" ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const success = await updateSettings(settings);
            if (success) {
                toast.success("Settings updated successfully");
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
                            <label className="text-sm font-medium text-gray-700">Twitter URL</label>
                            <input
                                name="twitter_url"
                                value={settings.twitter_url}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-black transition-colors"
                                placeholder="https://twitter.com/..."
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
