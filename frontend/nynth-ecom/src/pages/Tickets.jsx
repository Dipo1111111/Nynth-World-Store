import React, { useState, useEffect } from "react";
import { fetchProductsByCategory } from "../api/firebaseFunctions";
import { eventHasPassed } from "../utils/tickets";
import EventPoster from "../components/products/EventPoster";
import Footer from "../components/home/Footer";
import Logo from "../components/common/Logo";

// The ticket half of the platform. Access to an event here never implies
// access to the clothing store, and the other way round.
export default function Tickets() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchProductsByCategory("tickets", 50);
        if (!cancelled) setEvents(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const upcoming = events.filter((e) => !eventHasPassed(e.eventDateTime));
  const past = events.filter((e) => eventHasPassed(e.eventDateTime));

  return (
    <div className="min-h-screen bg-white">
      <header className="pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 text-center">
        <div className="flex flex-col items-center gap-2">
          <LinkToHome />
          <h1 className="text-4xl md:text-[60px] font-black uppercase tracking-tighter text-[#d8232a] leading-none">
            TICKETS
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 md:px-8 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/40">
              Loading events
            </p>
          </div>
        ) : upcoming.length === 0 ? (
          <div className="border border-dashed border-black/15 rounded-2xl p-16 text-center mt-24">
            <p className="text-sm text-black/55 mb-8">No events on sale right now.</p>
            <p className="text-xs text-black/40">Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 mt-12">
            {upcoming.map((e) => (
              <EventPoster key={e.id} product={e} />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/30 mt-24 sm:mt-32 mb-8">
              Past events
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
              {past.map((e) => (
                <EventPoster key={e.id} product={e} />
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function LinkToHome() {
  return (
    <a
      href="/"
      className="flex items-center justify-center focus-ring"
      aria-label="NYNTH World home"
    >
      <Logo size="lg" />
    </a>
  );
}
