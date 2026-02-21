// components/products/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../../context/SettingsContext";

export default function ProductCard({ product }) {
  const { settings } = useSettings();
  const mainImage = product.images?.[0] || product.thumbnail || "/placeholder.jpg";
  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div className="group flex flex-col">
      <Link
        to={`/product/${product.id}`}
        className="relative aspect-[4/5] bg-[#F2F2F2] overflow-hidden mb-3 block"
      >
        <img
          src={mainImage}
          alt={product.title}
          className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-90"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isOutOfStock && (
            <span className="bg-white/90 backdrop-blur-sm text-black text-[9px] font-bold tracking-widest px-2.5 py-1 uppercase">
              Sold Out
            </span>
          )}
          {product.newArrival && !isOutOfStock && (
            <span className="bg-black text-white text-[9px] font-bold tracking-widest px-2.5 py-1 uppercase">
              New
            </span>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="text-[11px] tracking-widest font-medium text-black uppercase truncate">
            {product.title}
          </h3>
          <p className="text-[10px] text-gray-400 tracking-wider uppercase mt-0.5">
            {product.category || 'Apparel'}
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-medium text-black">
            {settings.currency_symbol}{product.price?.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
