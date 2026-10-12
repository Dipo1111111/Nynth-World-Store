import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Mail, Lock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/common/Logo';
import { supabase } from '../api/supabase';

const VALID_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function DropGate() {
  const { slug } = useParams();
  const [phase, setPhase] = useState('loading'); // loading | missing | locked | signup | done
  const [drop, setDrop] = useState(null);
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('get_drop_preview', { p_slug: slug });
      if (cancelled) return;
      if (error || !data || data.length === 0) {
        setPhase('missing');
        return;
      }
      setDrop(data[0]);
      setPhase('locked');
    })();
    return () => { cancelled = true; };
  }, [slug]);

  async function handleUnlock(e) {
    e.preventDefault();
    if (!password.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.rpc('unlock_drop', {
      p_slug: slug,
      p_password: password.trim().toUpperCase(),
    });
    setBusy(false);
    if (error) {
      toast.error('SOMETHING WENT WRONG');
      return;
    }
    if (data === true) {
      toast.success('ACCESS GRANTED');
      setPhase('signup');
    } else {
      toast.error('ACCESS DENIED');
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    if (!VALID_EMAIL.test(email)) {
      toast.error('INVALID EMAIL FORMAT');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.rpc('signup_for_drop', {
      p_slug: slug,
      p_email: email,
    });
    setBusy(false);
    if (error) {
      toast.error('SOMETHING WENT WRONG');
      return;
    }
    if (data === 'ok') {
      setPhase('done');
    } else if (data === 'already_signed_up') {
      toast('YOU ARE ALREADY ON THE LIST', { icon: 'ℹ️' });
      setPhase('done');
    } else if (data === 'invalid_email') {
      toast.error('INVALID EMAIL FORMAT');
    } else {
      toast.error('DROP NOT FOUND');
    }
  }

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <span className="text-[10px] tracking-[0.4em] font-bold uppercase text-black/30">LOADING…</span>
      </div>
    );
  }

  if (phase === 'missing') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="mb-10"><Logo size="xl" /></div>
        <h1 className="text-[10px] tracking-[0.4em] font-bold uppercase text-black mb-3">DROP NOT FOUND</h1>
        <p className="text-[10px] tracking-[0.25em] uppercase text-black/30 mb-8">THIS LINK IS INVALID OR NO LONGER ACTIVE</p>
        <Link to="/shop" className="text-[10px] tracking-[0.3em] font-bold uppercase text-black underline underline-offset-4">BACK TO SHOP</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-black/5" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-black/5" />

      <div className="w-full max-w-[340px] flex flex-col items-center">
        <div className="mb-10"><Logo size="xl" /></div>

        <div className="text-center mb-8">
          <h1 className="text-[10px] tracking-[0.4em] font-bold uppercase text-black mb-2">{drop?.name || 'DROP'}</h1>
          <p className="text-[10px] tracking-[0.4em] font-bold uppercase text-black/30">
            {drop?.status === 'live' ? 'NOW LIVE' : 'UNLOCK YOUR ACCESS'}
          </p>
        </div>

        {phase === 'locked' && (
          <form onSubmit={handleUnlock} className="w-full space-y-3">
            <label htmlFor="drop-password" className="sr-only">Unlock code</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-black/15 pointer-events-none" size={14} />
              <input
                id="drop-password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="UNLOCK CODE"
                autoComplete="off"
                className="w-full bg-transparent border border-black/10 rounded-none pl-10 pr-4 py-3.5 text-[11px] tracking-[0.25em] uppercase placeholder:text-black/20 focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-black text-white py-3.5 text-[11px] tracking-[0.3em] font-bold uppercase hover:bg-black/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? 'CHECKING…' : 'UNLOCK'} <ArrowRight size={13} />
            </button>
          </form>
        )}

        {phase === 'signup' && (
          <form onSubmit={handleSignup} className="w-full space-y-3">
            <p className="text-[9px] tracking-[0.25em] uppercase text-black/40 text-center mb-2">ACCESS GRANTED — ENTER YOUR EMAIL FOR YOUR LINK</p>
            <label htmlFor="drop-email" className="sr-only">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-black/15 pointer-events-none" size={14} />
              <input
                id="drop-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="YOUR EMAIL"
                autoComplete="email"
                className="w-full bg-transparent border border-black/10 rounded-none pl-10 pr-4 py-3.5 text-[11px] tracking-[0.25em] uppercase placeholder:text-black/20 focus:outline-none focus:border-black transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-black text-white py-3.5 text-[11px] tracking-[0.3em] font-bold uppercase hover:bg-black/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? 'SUBMITTING…' : 'GET ACCESS'} <ArrowRight size={13} />
            </button>
          </form>
        )}

        {phase === 'done' && (
          <div className="w-full text-center flex flex-col items-center">
            <CheckCircle2 size={28} className="text-black mb-4" strokeWidth={1.5} />
            <h2 className="text-[10px] tracking-[0.4em] font-bold uppercase text-black mb-2">YOU'RE IN</h2>
            <p className="text-[9px] tracking-[0.25em] uppercase text-black/35 mb-8">CHECK YOUR INBOX FOR YOUR ACCESS LINK</p>
            <Link to="/shop" className="text-[10px] tracking-[0.3em] font-bold uppercase text-black underline underline-offset-4">BROWSE THE SHOP</Link>
          </div>
        )}
      </div>
    </div>
  );
}
