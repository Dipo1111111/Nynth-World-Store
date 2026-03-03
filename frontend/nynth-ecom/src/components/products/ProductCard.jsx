// components/products/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../../context/SettingsContext";
import { Eye } from "lucide-react";

export default function ProductCard({ product, displayMode = 'view' }) {
  const { settings } = useSettings();

  // Logic: if mode is model, try to get 2nd image. Otherwise fallback to 1st.
  const mainImage = displayMode === 'model' && product.images?.length > 1
    ? product.images[1]
    : product.images?.[0] || product.thumbnail || "/placeholder.jpg";

  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div className="group flex flex-col w-full bg-white transition-opacity duration-300">
      <Link
        to={`/product/${product.id}`}
        className="relative aspect-[4/5] w-full overflow-hidden block bg-white"
      >
        <img
          src={mainImage}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Badges - Tiny and minimal */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
          {isOutOfStock ? (
            <span className="bg-white text-black text-[8px] font-bold tracking-[0.2em] px-2 py-1 uppercase border border-black/5">
              Sold Out
            </span>
          ) : product.newArrival ? (
            <span className="bg-black text-white text-[8px] font-bold tracking-[0.2em] px-2 py-1 uppercase">
              New
            </span>
          ) : null}
        </div>
      </Link>

      {/* Product Info Bar - Height is implicitly consistent because of the flex-col and aspect ratio above */}
      <div className="pt-4 pb-6 px-4 md:px-6 bg-white flex flex-col justify-between">
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-[8px] md:text-[9px] font-bold tracking-[0.2em] uppercase text-black line-clamp-1 flex-1">
            {product.title}
          </h3>
          <span className="text-[8px] md:text-[9px] font-bold tracking-[0.2em] uppercase text-black whitespace-nowrap">
            {settings.currency_symbol}{product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Categories / Color Fallback - Hidden by default in Suvene layout if not hovered/active */}
        {product.availableColors?.length > 0 && (
          <div className="flex gap-1.5 mt-3">
            {product.availableColors.slice(0, 4).map((color, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 bg-gray-100 border border-black/5"
                style={{ backgroundColor: color.toLowerCase() }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
