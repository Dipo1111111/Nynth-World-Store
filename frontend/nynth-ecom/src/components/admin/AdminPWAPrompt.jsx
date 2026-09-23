import React, { useState, useEffect } from 'react';
import { X, Smartphone, ArrowBigDown, Share, Plus, BellRing } from 'lucide-react';

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

        // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-10 md:w-96 z-[9999] animate-admin-fade-up">
            <div className="bg-[#0c0c0c] text-white p-6 rounded-xl border border-white/10 shadow-raised relative overflow-hidden">
                <button
                    onClick={dismiss}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Dismiss"
                >
                    <X size={18} />
                </button>

                <div className="flex gap-4 items-start mb-6">
                    <div className="p-3 bg-white/[0.08] rounded-lg shrink-0">
                        <Smartphone size={22} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg tracking-tight">Install NYNTH Admin</h3>
                        <p className="text-sm text-white/50 mt-1">Faster access and real-time sales alerts.</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {('Notification' in window) && Notification.permission !== 'granted' && (
                        <button
                            onClick={() => Notification.requestPermission()}
                            className="w-full bg-[#0a0a0a] text-[#EDEAE2] py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-white/85 transition-all"
                        >
                            <BellRing size={15} />
                            Enable Sales Alerts
                        </button>
                    )}

                    {platform === 'android' ? (
                        <button
                            onClick={handleInstall}
                            className="w-full bg-[#0a0a0a] text-[#EDEAE2] py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-white/85 transition-all"
                        >
                            Install App
                        </button>
                    ) : (
                        <div className="space-y-4 bg-white/[0.06] p-4 rounded-lg border border-white/10">
                            <p className="text-sm font-medium flex items-center gap-2">
                                To install on iPhone:
                            </p>
                            <div className="space-y-3 text-xs text-white/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-white/10 flex items-center justify-center rounded">
                                        <Share size={12} />
                                    </div>
                                    <span>Tap the 'Share' icon</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-white/10 flex items-center justify-center rounded">
                                        <Plus size={12} />
                                    </div>
                                    <span>Select 'Add to Home Screen'</span>
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