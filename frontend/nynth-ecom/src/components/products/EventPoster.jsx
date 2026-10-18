import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, TicketX } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { getOptimizedImageUrl } from "../../api/cloudinary";
import { eventHasPassed, formatEventDateParts } from "../../utils/tickets";

// Poster card for /tickets. Matches the Newman reference: a portrait event
// poster image filling the card, with a red SOLD OUT badge top-right when the
// event is sold out or has passed. Clicking opens the event product page.
export default function EventPoster({ product }) {
  const { settings } = useSettings();
  const passed = eventHasPassed(product.eventDateTime);
  const soldOut = !product.inStock || Number(product.stockQuantity || 0) <= 0 || passed;
  const image =
    getOptimizedImageUrl(product.image || (product.images && product.images[0])) ||
    product.image ||
    "/placeholder.jpg";
  const { date, time } = formatEventDateParts(product.eventDateTime);

  return (
    <Link
      to={`/product/${product.id}`}
      onClick={(e) => (soldOut ? e.preventDefault() : null)}
      className="group block relative w-full overflow-hidden focus-ring"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-black/[0.06] bg-black/[0.02]">
        <img
          src={image}
          alt={product.title || product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          loading="lazy"
        />
        {soldOut && (
          <span className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white text-black text-[8px] font-bold tracking-[0.25em] uppercase px-2.5 py-1.5 shadow-card">
            <TicketX size={10} /> SOLD OUT
          </span>
        )}
        {!soldOut && (
          <span className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white text-black text-[8px] font-bold tracking-[0.25em] uppercase px-2.5 py-1.5 shadow-card">
            <svg
              viewBox="0 0 24 24"
              width="10"
              height="10"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0"
            >
              <path d="M22 12h-4v-4a2 2 0 00-2-2H8a2 2 0 00-2 2v4H2a2 2 0 00-2 2v8a2 2 0 002 2h16a2 2 0 002-2v-8a2 2 0 00-2-2z" />
              <path d="M12 13v4m0 0L8 17m4 4l4-4" />
            </svg>
            E-TICKET
          </span>
        )}
      </div>
      <div className="mt-4 text-center">
        <h3 className="text-sm sm:text-base font-extrabold uppercase leading-tight tracking-tight text-black mb-1">
          {product.title || product.name || "Untitled event"}
        </h3>
        {product.eventDateTime || product.venue ? (
          <p className="text-[10px] sm:text-[11px] text-black/50 tracking-wider uppercase font-bold flex flex-col items-center gap-0.5">
            {product.eventDateTime ? (
              <>
                <span>{date}</span>
                <span>{time}</span>
              </>
            ) : null}
            {product.eventDateTime && product.venue ? (
              <span className="mt-0.5 flex items-center gap-1">
                <MapPin size={10} className="text-black/35" /> {product.venue}
              </span>
            ) : product.venue ? (
              <span className="flex items-center gap-1">
                <MapPin size={10} className="text-black/35" /> {product.venue}
              </span>
            ) : null}
          </p>
        ) : null}
        {!soldOut && settings.currency_symbol ? (
          <p className="mt-2 text-[11px] sm:text-[12px] font-extrabold text-black tracking-tight">
            {settings.currency_symbol}{product.price?.toLocaleString()}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
