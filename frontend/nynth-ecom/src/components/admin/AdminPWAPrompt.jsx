import React, { useState, useEffect } from 'react';
import { X, Smartphone, ArrowBigDown, Share } from 'lucide-react';

const AdminPWAPrompt = () => {
    const [show, setShow] = useState(false);
    const [platform, setPlatform] = useState(null);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) return;

        // Check if dismissed before
        const isDismissed = localStorage.getItem('pwa_prompt_dismissed');
        if (isDismissed) return;

        // Detect platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);

        if (isIOS) setPlatform('ios');
        else if (isAndroid) setPlatform('android');

        // Handle Android/Chrome prompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShow(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Show prompt for iOS after a small delay
        if (isIOS) {
            setTimeout(() => setShow(true), 3000);
        }

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShow(false);
        }
        setDeferredPrompt(null);
    };

    const dismiss = () => {
        setShow(false);
        localStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    if (!show || !platform) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-10 md:w-96 z-[9999] animate-slideUp">
            <div className="bg-black text-white p-6 rounded-2xl shadow-2xl border border-white/10 relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl" />

                <button
                    onClick={dismiss}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="flex gap-4 items-start mb-6">
                    <div className="p-3 bg-white/10 rounded-xl">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h3 className="font-space font-bold text-lg">Install NYNTH Admin</h3>
                        <p className="text-sm text-gray-400 mt-1">Access your store management faster and get real-time sales alerts.</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {Notification.permission !== 'granted' && (
                        <button
                            onClick={() => Notification.requestPermission()}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all mb-2"
                        >
                            Enable Sales Alerts 🔔
                        </button>
                    )}

                    {platform === 'android' ? (
                        <button
                            onClick={handleInstall}
                            className="w-full bg-white text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                        >
                            Install App
                        </button>
                    ) : (
                        <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                            <p className="text-sm font-medium flex items-center gap-2">
                                To install on iPhone:
                            </p>
                            <div className="space-y-3 text-xs text-gray-400">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                                        <Share size={12} />
                                    </div>
                                    <span>1. Tap the 'Share' icon below</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                                        <Plus size={12} className="border border-white/50 rounded-sm p-0.5" />
                                    </div>
                                    <span>2. Select 'Add to Home Screen'</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPWAPrompt;
