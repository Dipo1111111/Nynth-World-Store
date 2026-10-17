import React, { useState, useEffect } from "react";
import { fetchProductsByCategory } from "../api/firebaseFunctions";
import { eventHasPassed } from "../utils/tickets";
import TicketCard from "../components/products/TicketCard";
import Footer from "../components/home/Footer";
import { Ticket } from "lucide-react";

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
      <main className="max-w-6xl mx-auto px-5 md:px-8 pt-28 md:pt-36 pb-20">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/40 mb-4">
          NYNTH World Ticketing
        </p>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-[-0.03em] uppercase leading-[0.95]">
          Events
        </h1>
        <p className="text-sm text-black/55 mt-4 max-w-md">
          Every NYNTH event, and events run by organizers on the NYNTH World ticket platform. Your
          e-ticket arrives by email.
        </p>

        {loading ? (
          <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 mt-20">
            Loading events
          </p>
        ) : upcoming.length === 0 ? (
          <div className="border border-dashed border-black/15 rounded-2xl p-14 text-center mt-16">
            <Ticket size={28} className="mx-auto mb-4 text-black/25" />
            <p className="text-sm text-black/55">No events on sale right now.</p>
            <p className="text-xs text-black/40 mt-2">Check back soon.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
            {upcoming.map((e) => (
              <TicketCard key={e.id} product={e} />
            ))}
          </div>
        )}

        {past.length > 0 && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/30 mt-20 mb-6">
              Past events
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {past.map((e) => (
                <TicketCard key={e.id} product={e} />
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
