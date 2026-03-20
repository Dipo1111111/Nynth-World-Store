import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';
import { ArrowRight, CheckCircle } from 'lucide-react';

export default function WaitlistConfirmation() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
            {/* Background elements for premium feel */}
            <div className="absolute top-0 left-0 w-full h-1 bg-black/5"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-black/5"></div>

            <div className="w-full max-w-sm flex flex-col items-center animate-fadeIn">
                <Logo size="xl" className="mb-12" />

                <div className="text-center mb-12 space-y-6">
                    <div className="flex justify-center">
                        <CheckCircle size={40} className="text-black/20" strokeWidth={1} />
                    </div>
                    
                    <div className="space-y-4">
                        <h2 className="text-[12px] tracking-[0.4em] font-bold uppercase text-black">
                            OFFICIALLY ADDED
                        </h2>
                        <p className="text-[10px] tracking-[0.2em] uppercase text-black/60 leading-relaxed font-bold">
                            YOU HAVE BEEN OFFICIALLY ADDED TO THE NYNTH WORLD LIST.
                        </p>
                        <p className="text-[10px] tracking-[0.2em] uppercase text-black/30 leading-relaxed font-bold">
                            WE WILL NOTIFY YOU THE MOMENT WE GO LIVE.
                        </p>
                    </div>
                </div>

                <div className="w-full space-y-6">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full border border-black text-black py-4 text-[10px] tracking-[0.4em] font-bold uppercase flex items-center justify-center gap-3 hover:bg-black hover:text-white transition-all group"
                    >
                        BACK TO SHOP
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    
                    <p className="text-center text-[8px] tracking-[0.3em] text-black/20 font-bold uppercase mt-8">
                        STAY ABOVE
                    </p>
                </div>

                <p className="mt-16 text-[8px] tracking-[0.2em] text-black/30 font-bold uppercase">
                    &copy; {new Date().getFullYear()} NYNTH WORLD. ALL RIGHTS RESERVED.
                </p>
            </div>
        </div>
    );
}
