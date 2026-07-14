import React, { useState, useEffect } from 'react';
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

    // Countdown state
    const timerEnabled = settings?.lock_timer_enabled === true;
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        if (!timerEnabled) return;

        const launchDate = settings?.launch_date || '2026-04-03T18:00:00';
        const target = new Date(launchDate).getTime();

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const difference = target - now;

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        };

        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();
        return () => clearInterval(timer);
    }, [timerEnabled, settings?.launch_date]);

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
                style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' },
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
                        style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px', letterSpacing: '0.2em', fontWeight: 'bold' },
                    });
                } else {
                    navigate('/waitlist-confirmation');
                }
                setWaitlistEmail('');
            } else {
                toast.error(result.message.toUpperCase(), {
                    style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' },
                });
            }
        } catch (error) {
            toast.error('SOMETHING WENT WRONG', {
                style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' },
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
                    style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' },
                });
            }, 800);
        } else {
            setTimeout(() => {
                setLoading(false);
                toast.error('ACCESS DENIED', {
                    style: { borderRadius: '0px', background: '#000', color: '#fff', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' },
                });
            }, 500);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
            {/* Subtle top/bottom lines */}
            <div className="absolute top-0 left-0 w-full h-px bg-black/5"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-black/5"></div>

            <div className="w-full max-w-[340px] flex flex-col items-center">
                {/* Logo */}
                <div className="mb-10">
                    <Logo size="xl" />
                </div>

                {/* Titles */}
                <div className="text-center mb-8">
                    <h1 className="text-[10px] tracking-[0.4em] font-bold uppercase text-black mb-2">
                        {lockTitle1}
                    </h1>
                    <p className="text-[10px] tracking-[0.4em] font-bold uppercase text-black/30">
                        {lockTitle2}
                    </p>
                </div>

                {/* Launch Countdown — only when timer is ON */}
                {timerEnabled && (
                    <div className="w-full mb-10 flex items-center justify-center gap-5">
                        {[
                            { value: timeLeft.days, label: 'DAYS' },
                            { value: String(timeLeft.hours).padStart(2, '0'), label: 'HRS' },
                            { value: String(timeLeft.minutes).padStart(2, '0'), label: 'MIN' },
                            { value: String(timeLeft.seconds).padStart(2, '0'), label: 'SEC' },
                        ].map((item, i) => (
                            <React.Fragment key={item.label}>
                                {i > 0 && <span className="text-xl text-black/10 self-start mt-3">:</span>}
                                <div className="flex flex-col items-center">
                                    <span className="text-[28px] md:text-[36px] font-inter font-bold tracking-[0.15em] tabular-nums leading-none">
                                        {item.value}
                                    </span>
                                    <span className="text-[6px] tracking-[0.35em] font-bold uppercase text-black/25 mt-2">
                                        {item.label}
                                    </span>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* ─── Waitlist Section ─── */}
                <div className="w-full">
                    <div className="text-center mb-5">
                        <h2 className="text-[9px] tracking-[0.3em] font-bold uppercase text-black/50">
                            {lockWaitlistTitle}
                        </h2>
                        <p className="text-[7px] tracking-[0.2em] uppercase text-black/25 mt-1.5">
                            {lockWaitlistSubtitle}
                        </p>
                    </div>

                    <form onSubmit={handleWaitlistSubmit} className="space-y-3">
                        {/* Visually hidden label for accessibility */}
                        <label htmlFor="lock-waitlist-email" className="sr-only">Email address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-black/15 pointer-events-none" size={14} />
                            <input
                                id="lock-waitlist-email"
                                type="email"
                                value={waitlistEmail}
                                onChange={(e) => setWaitlistEmail(e.target.value)}
                                placeholder="YOUR EMAIL"
                                autoComplete="email"
                                className="w-full bg-transparent border border-black/8 focus:border-black/20 rounded-none py-3.5 pl-10 pr-4 text-[10px] tracking-[0.25em] font-bold uppercase outline-none transition-colors placeholder:text-black/20 placeholder:font-normal min-h-[44px]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={waitlistLoading || !waitlistEmail}
                            className="w-full border border-black text-black py-3.5 text-[10px] tracking-[0.35em] font-bold uppercase flex items-center justify-center gap-2.5 hover:bg-black hover:text-white active:scale-[0.98] transition-all duration-150 disabled:opacity-20 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[44px]"
                        >
                            {waitlistLoading ? (
                                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    ADD TO LIST
                                    <ArrowRight size={13} strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* ─── Divider ─── */}
                <div className="w-full flex items-center gap-4 my-7">
                    <div className="h-px flex-1 bg-black/6"></div>
                    <span className="text-[7px] tracking-[0.4em] text-black/15 font-bold">OR</span>
                    <div className="h-px flex-1 bg-black/6"></div>
                </div>

                {/* ─── Password Section ─── */}
                <div className="w-full">
                    <form onSubmit={handleAdminSubmit} className="space-y-3">
                        {/* Visually hidden label for accessibility */}
                        <label htmlFor="lock-password" className="sr-only">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-black/15 pointer-events-none" size={14} />
                            <input
                                id="lock-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="ENTER USING PASSWORD"
                                autoComplete="current-password"
                                className="w-full bg-transparent border border-black/8 focus:border-black/20 rounded-none py-3.5 pl-10 pr-4 text-[10px] tracking-[0.25em] font-bold uppercase outline-none transition-colors placeholder:text-black/20 placeholder:font-normal min-h-[44px]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !password}
                            className="w-full bg-black text-white py-3.5 text-[10px] tracking-[0.35em] font-bold uppercase flex items-center justify-center gap-2.5 hover:bg-black/85 active:scale-[0.98] transition-all duration-150 disabled:opacity-20 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[44px]"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    ENTER NYNTH
                                    <ArrowRight size={13} strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="mt-12 text-[7px] tracking-[0.2em] text-black/20 font-bold uppercase">
                    &copy; {new Date().getFullYear()} NYNTH WORLD
                </p>
            </div>
        </div>
    );
}
