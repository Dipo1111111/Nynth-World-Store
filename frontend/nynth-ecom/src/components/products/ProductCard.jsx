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
    <div className="group flex flex-col h-full bg-white">
      <Link
        to={`/product/${product.id}`}
        className="relative aspect-[4/5] overflow-hidden block"
      >
        <img
          src={mainImage}
          alt={product.title}
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
        />

        {/* Quick View Icon */}
        <div className="absolute top-2 right-2 z-20 w-7 h-7 md:w-8 md:h-8 bg-white rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <Eye size={14} className="text-gray-500" />
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1 pointer-events-none">
          {isOutOfStock && (
            <span className="bg-white/90 text-black text-[8px] md:text-[9px] font-bold tracking-widest px-2 py-0.5 uppercase">
              Sold Out
            </span>
          )}
          {product.newArrival && !isOutOfStock && (
            <span className="bg-black text-white text-[8px] md:text-[9px] font-bold tracking-widest px-2 py-0.5 uppercase">
              New
            </span>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="pt-3 md:pt-4 pb-1 bg-white">
        {/* Title + Price Row */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-[10px] md:text-[11px] font-medium text-black truncate leading-tight">
            {product.title}
          </h3>
          <span className="text-[10px] md:text-[11px] font-medium text-black flex-shrink-0">
            {settings.currency_symbol}{product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Category */}
        <p className="text-[9px] md:text-[10px] text-gray-400 mt-1 truncate">
          {product.category || 'Apparel'}
        </p>

        {/* Color Dots */}
        {product.availableColors?.length > 0 && (
          <div className="flex gap-1 mt-1.5 md:mt-2">
            {product.availableColors.slice(0, 5).map((color, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border border-gray-200"
                style={{ backgroundColor: color.toLowerCase() }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
