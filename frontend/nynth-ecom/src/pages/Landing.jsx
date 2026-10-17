import React from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { ArrowUpRight } from "lucide-react";

// The brief asks for two boxes on the landing page, one for the store and one
// for tickets. Both images come from settings.data.landing, so the founder
// swaps them from the admin panel without a deploy. With no image set, each box
// still reads as a deliberate, minimal block rather than a broken one.
const normalize = (raw) => {
  const landing = raw ?? {};
  return {
    enabled: landing.enabled !== false,
    storeImage: landing.storeImage ?? landing.store_image ?? "",
    ticketImage: landing.ticketImage ?? landing.ticket_image ?? "",
    storeTitle: landing.storeTitle ?? "NYNTH WORLD STORE",
    ticketTitle: landing.ticketTitle ?? "TICKET",
    storeBlurb: landing.storeBlurb ?? "Drops, pieces and the lookbook.",
    ticketBlurb: landing.ticketBlurb ?? "Events, e-tickets and the door.",
  };
};

const Box = ({ to, title, blurb, image, cta }) => (
  <Link
    to={to}
    className="group relative flex flex-col justify-end min-h-[46vh] md:min-h-[70vh] overflow-hidden focus-ring"
  >
    {image ? (
      <img
        src={image}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        loading="lazy"
      />
    ) : (
      <div className="absolute inset-0 bg-[#0c0c0c]" aria-hidden="true" />
    )}
    <div
      className={`absolute inset-0 ${image ? "bg-gradient-to-t from-black/75 via-black/25 to-black/10" : "bg-gradient-to-t from-black/40 to-transparent"}`}
      aria-hidden="true"
    />
    <div className="relative p-6 md:p-10 text-white">
      <h2 className="text-2xl md:text-4xl font-extrabold uppercase tracking-tight">{title}</h2>
      {blurb && <p className="text-sm text-white/70 mt-2 max-w-sm">{blurb}</p>}
      <span className="inline-flex items-center gap-1.5 mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
        {cta}
        <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </div>
  </Link>
);

export default function Landing() {
  const { settings } = useSettings();
  const landing = normalize(settings?.landing);

  // Not switched on in the panel yet, or somebody bookmarked /: keep the old
  // behaviour of going straight to the shop.
  if (!landing.enabled) {
    return <NavigateToShop />;
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="grid md:grid-cols-2 min-h-screen">
        <Box
          to="/shop"
          title={landing.storeTitle}
          blurb={landing.storeBlurb}
          image={landing.storeImage}
          cta="Enter the store"
        />
        <Box
          to="/tickets"
          title={landing.ticketTitle}
          blurb={landing.ticketBlurb}
          image={landing.ticketImage}
          cta="Find an event"
        />
      </div>
    </main>
  );
}

const NavigateToShop = () => {
  React.useEffect(() => {
    window.location.replace("/shop");
  }, []);
  return null;
};
