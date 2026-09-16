import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, ArrowUpRight, Ticket, TicketX } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { getOptimizedImageUrl } from "../../api/cloudinary";
import {
  isTicket,
  eventHasPassed,
  formatEventDateParts,
} from "../../utils/tickets";

const GlossySheen = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
    <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,transparent_30%,rgba(255,255,255,0.14)_46%,rgba(255,255,255,0.28)_50%,rgba(255,255,255,0.14)_54%,transparent_70%)]"></div>
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(120%_60%_at_85%_-10%,rgba(255,255,255,0.12)_0%,transparent_55%)]"></div>
  </div>
);

const TicketStatus = ({ passed, soldOut }) => {
  if (soldOut) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-white text-black text-[8px] font-bold tracking-[0.25em] uppercase px-2.5 py-1.5">
        <TicketX size={10} /> SOLD OUT
      </span>
    );
  }
  if (passed) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-white text-black text-[8px] font-bold tracking-[0.25em] uppercase px-2.5 py-1.5">
        <TicketX size={10} /> EVENT ENDED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 bg-white text-black text-[8px] font-bold tracking-[0.25em] uppercase px-2.5 py-1.5">
      <Ticket size={10} /> E-TICKET
    </span>
  );
};

export default function TicketCard({ product, wide, disabled }) {
  const { settings } = useSettings();
  const passed = eventHasPassed(product.eventDateTime);
  const soldOut = disabled || !product.inStock || Number(product.stockQuantity) <= 0;
  const image =
    getOptimizedImageUrl(product.image || (product.images && product.images[0])) ||
    product.image ||
    "/placeholder.jpg";
  const { date, time } = formatEventDateParts(product.eventDateTime);

  if (wide) {
    return (
      <Link
        to={`/product/${product.id}`}
        onClick={(e) => (soldOut ? e.preventDefault() : null)}
        className="group relative block w-full bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white overflow-hidden border border-white/10"
      >
        <GlossySheen />
        <div className="relative grid grid-cols-1 sm:grid-cols-[190px_1fr_auto] items-stretch">
          <div className="relative h-32 sm:h-full overflow-hidden flex-shrink-0">
            <img
              src={image}
              alt={product.title || product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-black/50"></div>
          </div>

          <div className="relative px-5 sm:px-7 py-5 sm:py-6 flex flex-col justify-center gap-3 sm:border-r border-dashed border-white/15">
            <div className="flex flex-wrap items-center gap-3">
              <TicketStatus passed={passed} soldOut={soldOut} />
              <p className="text-[8px] tracking-[0.3em] font-bold uppercase text-zinc-400">
                INSTANT E-TICKET · NO DELIVERY
              </p>
            </div>
            <div>
              <h3 className="text-lg sm:text-[19px] font-bold tracking-tight uppercase leading-tight">
                {product.title || product.name}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[10px] text-zinc-400 tracking-wider uppercase font-bold">
              <span className="flex items-center gap-1.5">
                <Calendar size={11} className="text-zinc-500" /> {date}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={11} className="text-zinc-500" /> {time}
              </span>
              <span className="flex items-center gap-1.5 truncate max-w-[220px]">
                <MapPin size={11} className="text-zinc-500" /> {product.venue || "EVENT VENUE"}
              </span>
            </div>
          </div>

          <div className="relative flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 px-5 sm:px-7 py-4 sm:py-0">
            <p className="text-[14px] sm:text-[17px] font-bold">
              {soldOut ? (
                <span className="text-zinc-500">SOLD OUT</span>
              ) : (
                <>
                  {settings.currency_symbol}
                  {product.price?.toLocaleString()}
                </>
              )}
            </p>
            {!soldOut && (
              <span className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.25em] font-bold uppercase text-white border border-white/20 px-3.5 py-2.5 group-hover:bg-white group-hover:text-black transition-all">
                GET TICKETS <ArrowUpRight size={11} />
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/product/${product.id}`}
      onClick={(e) => (soldOut ? e.preventDefault() : null)}
      className="group block relative w-full bg-gradient-to-br from-zinc-900 via-black to-zinc-800 text-white overflow-hidden text-left"
    >
      <div className="relative aspect-[16/11] overflow-hidden">
        <img
          src={image}
          alt={product.title || product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <GlossySheen />
        <div className="absolute top-3 left-3">
          <TicketStatus passed={passed} soldOut={soldOut} />
        </div>
        <span className="absolute bottom-3 right-3 flex items-center gap-1 text-[9px] font-bold tracking-[0.15em] uppercase text-white">
          VIEW EVENT <ArrowUpRight size={11} />
        </span>
      </div>
      <div className="px-4 py-4">
        <p className="text-[11px] font-bold tracking-tight uppercase mb-2">
          {product.title || product.name}
        </p>
        <div className="flex items-center justify-between text-[9px] text-zinc-400 tracking-wider uppercase">
          <span className="flex items-center gap-1.5">
            <Calendar size={10} /> {date} · {time}
          </span>
          <span className="flex items-center gap-1.5 truncate max-w-[45%]">
            <MapPin size={10} /> {product.venue || "EVENT VENUE"}
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[9px] tracking-[0.2em] uppercase text-zinc-400">
            <Clock size={10} /> INSTANT E-TICKET
          </span>
          <span className="text-[13px] font-bold">
            {soldOut
              ? "SOLD OUT"
              : `${settings.currency_symbol}${product.price?.toLocaleString()}`}
          </span>
        </div>
      </div>
    </Link>
  );
}

export { isTicket };