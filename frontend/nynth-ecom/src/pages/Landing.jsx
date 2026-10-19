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
//
// Red shadow depth added so the boxes don't feel flat (Newman, 19 Oct 2026).
// Centered in the middle of the page per the same request.
const Card = ({ to, title, image }) => (
  <Link
    to={to}
    className="group flex flex-col items-center focus-ring w-full max-w-[340px]"
  >
    <div className="relative w-full aspect-square overflow-hidden rounded-[28px] border border-black/[0.06] bg-black/[0.02] transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_0_30px_rgba(216,35,42,0.14)]">
      <img
        src={image}
        alt={title}
        loading="eager"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />
    </div>
    <span className="mt-6 font-serif font-semibold uppercase leading-tight tracking-tight text-[var(--brand-red)] text-[12px] sm:text-[14px]">
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
      <header className="pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 text-center">
        <Link to="/" className="flex flex-col items-center gap-3 focus-ring" aria-label="NYNTH World home">
          <Logo size="lg" />
          <span className="font-serif font-semibold uppercase tracking-[0.4em] text-black/60 text-[11px] sm:text-[13px]">
            Welcome to NYNTH WORLD LTD
          </span>
        </Link>
      </header>

      {/* Boxes centred in the middle of the screen */}
      <section className="flex-1 w-full max-w-[720px] mx-auto px-5 sm:px-8 flex flex-col items-center">
        <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 md:gap-16 w-full justify-center items-center">
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

      <footer className="px-5 sm:px-8 pt-20 sm:pt-28 pb-16 text-center">
        <p className="font-serif font-medium uppercase tracking-[0.3em] text-black/45 text-[11px] sm:text-[12px]">
          A NYNTH World Ltd Company
        </p>
        <p className="font-serif font-medium uppercase tracking-[0.3em] text-black/35 mt-1 text-[11px] sm:text-[12px]">
          Est. 2022
        </p>
        <p className="mt-12 font-serif font-bold uppercase tracking-[0.28em] text-[var(--brand-red)] text-[11px] sm:text-[13px]">
          Founded by Newman Yange
        </p>
        <p className="mt-2 font-serif font-semibold uppercase tracking-[0.2em] text-black/25 text-[10px] sm:text-[11px]">
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
