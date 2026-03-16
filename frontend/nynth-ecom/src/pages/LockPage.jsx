import React, { useState } from 'react';
import Logo from '../components/common/Logo';
import { Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LockPage({ onUnlock }) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        // Required Password: NYNTH-WORLD-IS-BOSS
        if (password.toUpperCase() === 'NYNTH-WORLD-IS-BOSS') {
            setTimeout(() => {
                localStorage.setItem('nynth_site_unlocked', 'true');
                onUnlock();
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

                <div className="text-center mb-12 space-y-2">
                    <h2 className="text-[10px] tracking-[0.4em] font-bold uppercase text-black">
                        BY WINNERS FOR WINNERS
                    </h2>
                    <h2 className="text-[10px] tracking-[0.4em] font-bold uppercase text-black/40">
                        STAY ABOVE
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="w-full space-y-6">
                    <div className="relative group">
                        <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-black transition-colors" size={14} />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="ENTER PASSWORD"
                            className="w-full bg-transparent border-b border-black/10 focus:border-black py-4 pl-8 text-[10px] tracking-[0.3em] font-bold uppercase outline-none transition-all placeholder:text-black/20"
                            autoFocus
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

                <p className="mt-16 text-[8px] tracking-[0.2em] text-black/30 font-bold uppercase">
                    &copy; {new Date().getFullYear()} NYNTH WORLD. ALL RIGHTS RESERVED.
                </p>
            </div>
        </div>
    );
}
