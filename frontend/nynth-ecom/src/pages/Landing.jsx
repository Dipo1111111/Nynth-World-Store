import React from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import Logo from "../components/common/Logo";

/* =====================================================================
   HARD RULE, FROM THE FOUNDER (Newman, 17 Oct 2026, verbatim):

     "NEVER EVER, UNLESS EXPLICITLY MENTIONED, CHANGE THE LANDING PAGE
      TO DARK MODE. THE PAGE IS MOSTLY WHITE. NEVER USE THAT."

   The landing page is a white page. It is not a theme surface. It does not
   follow the admin ink system and it does not follow a dark mode. There is no
   toggle here and there must never be one. If a future change wants a dark
   landing, it needs Newman saying so out loud first.

   landing.page.test.js fails the build if anything dark creeps back in.
   ===================================================================== */

// Real images from the products table, so the page is never artless on a fresh
// deploy. The founder overrides either one from Settings > Landing without a
// deploy. Picked from live products: the red WINNERS tee and the Private Pool
// Party flyer.
export const DEFAULT_STORE_IMAGE =
  "https://res.cloudinary.com/dqouigbvm/image/upload/v1783796006/ced9jfcczep8h24h7ggj.jpg";
export const DEFAULT_TICKET_IMAGE =
  "https://res.cloudinary.com/dqouigbvm/image/upload/v1789771810/uvesq0qqrfhyqrfbc6rt.jpg";

const normalize = (raw) => {
  const landing = raw ?? {};
  return {
    enabled: landing.enabled !== false,
    storeImage: landing.storeImage ?? landing.store_image ?? "",
    ticketImage: landing.ticketImage ?? landing.ticket_image ?? "",
    storeTitle: landing.storeTitle ?? "NYNTH WORLD STORE",
    ticketTitle: landing.ticketTitle ?? "TICKET STORE",
  };
};

// One rounded card with its red label underneath. The product photography is
// shot on white, so the tile carries a hairline border and the faintest tint
// fill. That is what keeps a white-background shot from dissolving into the
// white page.
const Card = ({ to, title, image }) => (
  <Link to={to} className="group flex flex-col items-center focus-ring">
    <div className="relative w-full aspect-square overflow-hidden rounded-[28px] border border-black/[0.06] bg-black/[0.02] transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-card-hover">
      <img
        src={image}
        alt={title}
        loading="eager"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
    </div>
    <span className="mt-5 text-center font-extrabold uppercase leading-tight tracking-tight text-[var(--brand-red)] text-[11px] sm:text-[13px]">
      {title}
    </span>
  </Link>
);

export default function Landing() {
  const { settings } = useSettings();
  const landing = normalize(settings?.landing);

  // Not switched on in the panel: keep the old behaviour of going straight to
  // the shop, so nothing is ever unreachable.
  if (!landing.enabled) {
    return <NavigateToShop />;
  }

  return (
    // White page. Always. See the hard rule at the top of this file.
    <main className="min-h-screen bg-white flex flex-col bg-[#ffffff]">
      <header className="pt-12 sm:pt-16 md:pt-20 pb-10 sm:pb-14">
        <Link to="/" className="flex flex-col items-center gap-2 focus-ring" aria-label="NYNTH World home">
          <Logo size="lg" />
          <span className="text-[9px] font-bold uppercase tracking-[0.45em] text-black/55">
            Stay Above
          </span>
        </Link>
      </header>

      <section className="flex-1 w-full max-w-[860px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 gap-6 sm:gap-10 md:gap-14">
          <Card
            to="/shop"
            title={landing.storeTitle}
            image={landing.storeImage || DEFAULT_STORE_IMAGE}
          />
          <Card
            to="/tickets"
            title={landing.ticketTitle}
            image={landing.ticketImage || DEFAULT_TICKET_IMAGE}
          />
        </div>
      </section>

      <footer className="px-5 sm:px-8 pt-16 sm:pt-24 pb-12 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-black/45">
          A NYNTH World Ltd Company
        </p>
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-black/35 mt-1.5">
          Est. 2022
        </p>
        <p className="mt-10 text-[9px] font-bold uppercase tracking-[0.28em] text-[var(--brand-red)]">
          Founded by Newman Yange
        </p>
        <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-black/25">
          By Winners, For Winners
        </p>
      </footer>
    </main>
  );
}

const NavigateToShop = () => {
  React.useEffect(() => {
    window.location.replace("/shop");
  }, []);
  return null;
};
