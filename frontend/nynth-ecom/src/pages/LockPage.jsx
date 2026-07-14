import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';
import { ArrowRight, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { addSubscriber } from '../api/firebaseFunctions';
import { useSettings } from '../context/SettingsContext';

export default function LockPage() {
    const { settings } = useSettings();
    const [waitlistEmail, setWaitlistEmail] = useState('');
    const [waitlistLoading, setWaitlistLoading] = useState(false);
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const lockPassword = settings?.lock_password || 'WINNERSONLY';
    const lockTitle1 = settings?.lock_title1 || 'BY WINNERS FOR WINNERS';
    const lockTitle2 = settings?.lock_title2 || 'STAY ABOVE';
    const lockWaitlistTitle = settings?.lock_waitlist_title || 'JOIN THE WAITLIST';
    const lockWaitlistSubtitle = settings?.lock_waitlist_subtitle || 'BE NOTIFIED WHEN WE GO LIVE';

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleWaitlistSubmit = async (e) => {
        e.preventDefault();
        if (!waitlistEmail) return;

        if (!validateEmail(waitlistEmail)) {
            toast.error('INVALID EMAIL FORMAT', {
                style: {
                    borderRadius: '0px',
                    background: '#000',
                    color: '#fff',
                    fontSize: '10px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                },
            });
            return;
        }

        setWaitlistLoading(true);
        try {
            const result = await addSubscriber(waitlistEmail, 'waitlist');
            if (result.success) {
                if (result.message === 'ALREADY_ADDED') {
                    toast('YOU ARE ALREADY ON THE WAITLIST', {
                        icon: 'ℹ️',
                        style: {
                            borderRadius: '0px',
                            background: '#000',
                            color: '#fff',
                            fontSize: '10px',
                            letterSpacing: '0.2em',
                            fontWeight: 'bold',
                        },
                    });
                } else {
                    navigate('/waitlist-confirmation');
                }
                setWaitlistEmail('');
            } else {
                toast.error(result.message.toUpperCase(), {
                    style: {
                        borderRadius: '0px',
                        background: '#000',
                        color: '#fff',
                        fontSize: '10px',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                    },
                });
            }
        } catch (error) {
            toast.error('SOMETHING WENT WRONG', {
                style: {
                    borderRadius: '0px',
                    background: '#000',
                    color: '#fff',
                    fontSize: '10px',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                },
            });
        } finally {
            setWaitlistLoading(false);
        }
    };

    const handleAdminSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        if (password.trim().toUpperCase() === lockPassword.toUpperCase()) {
            setTimeout(() => {
                localStorage.setItem('nynth_site_unlocked', 'true');
                localStorage.setItem('nynth_lock_epoch', String(settings?.lock_epoch || 0));
                window.location.reload();
                toast.success('ACCESS GRANTED', {
                    style: {
                        borderRadius: '0px',
                        background: '#000',
                        color: '#fff',
                        fontSize: '10px',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                    },
                });
            }, 800);
        } else {
            setTimeout(() => {
                setLoading(false);
                toast.error('ACCESS DENIED', {
                    style: {
                        borderRadius: '0px',
                        background: '#000',
                        color: '#fff',
                        fontSize: '10px',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                    },
                });
            }, 500);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
            {/* Background elements for premium feel */}
            <div className="absolute top-0 left-0 w-full h-1 bg-black/5"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black/5"></div>

            <div className="w-full max-w-sm flex flex-col items-center animate-fadeIn">
                <Logo size="xl" className="mb-12" />

                <div className="text-center mb-10 space-y-2">
                    <h2 className="text-[10px] tracking-[0.4em] font-bold uppercase text-black">
                        {lockTitle1}
                    </h2>
                    <h2 className="text-[10px] tracking-[0.4em] font-bold uppercase text-black/40">
                        {lockTitle2}
                    </h2>
                </div>

                {/* Waitlist Section */}
                <div className="w-full mb-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                    <div className="text-center mb-6">
                        <h3 className="text-[9px] tracking-[0.3em] font-bold uppercase text-black/60">
                            {lockWaitlistTitle}
                        </h3>
                        <p className="text-[8px] tracking-[0.2em] uppercase text-black/30 mt-1">
                            {lockWaitlistSubtitle}
                        </p>
                    </div>

                    <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                        <div className="relative group">
                            <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-black transition-colors" size={14} />
                            <input
                                type="email"
                                value={waitlistEmail}
                                onChange={(e) => setWaitlistEmail(e.target.value)}
                                placeholder="YOUR EMAIL"
                                className="w-full bg-transparent border-b border-black/10 focus:border-black py-4 pl-8 text-[10px] tracking-[0.3em] font-bold uppercase outline-none transition-all placeholder:text-black/20"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={waitlistLoading || !waitlistEmail}
                            className="w-full border border-black text-black py-4 text-[10px] tracking-[0.4em] font-bold uppercase flex items-center justify-center gap-3 hover:bg-black hover:text-white transition-all disabled:opacity-20 group"
                        >
                            {waitlistLoading ? (
                                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    ADD TO LIST
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                </div>

                <div className="w-full flex items-center gap-4 my-6 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                    <div className="h-[1px] flex-1 bg-black/5"></div>
                    <span className="text-[8px] tracking-[0.4em] text-black/20 font-bold">OR</span>
                    <div className="h-[1px] flex-1 bg-black/5"></div>
                </div>

                {/* Password Section */}
                <form onSubmit={handleAdminSubmit} className="w-full space-y-4 animate-fadeInUp mb-6" style={{ animationDelay: '0.3s' }}>
                    <div className="relative group">
                        <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-black transition-colors" size={14} />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="ENTER USING PASSWORD"
                            className="w-full bg-transparent border-b border-black/10 focus:border-black py-4 pl-8 text-[10px] tracking-[0.3em] font-bold uppercase outline-none transition-all placeholder:text-black/20"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !password}
                        className="w-full bg-black text-white py-4 text-[10px] tracking-[0.4em] font-bold uppercase flex items-center justify-center gap-3 hover:bg-black/90 transition-all disabled:opacity-20 group"
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                ENTER NYNTH
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <p className="mt-10 text-[8px] tracking-[0.2em] text-black/30 font-bold uppercase">
                    &copy; {new Date().getFullYear()} NYNTH WORLD. ALL RIGHTS RESERVED.
                </p>
            </div>
        </div>
    );
}
