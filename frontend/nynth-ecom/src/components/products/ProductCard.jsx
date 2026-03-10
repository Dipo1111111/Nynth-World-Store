import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../../context/SettingsContext";
import { useCart } from "../../context/CartContext";
import { Plus, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { incrementCounter } from "../../api/firebaseFunctions";

export default function ProductCard({ product, displayMode = 'model' }) {
  const { settings } = useSettings();
  const { addToCart } = useCart();
  const [selectedColor, setSelectedColor] = useState(product.availableColors?.[0] || "");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const isSightMode = displayMode === 'view';

  // In model mode, prefer 2nd image for visual variety. Otherwise use selected.
  const mainImage = !isSightMode && product.images?.length > 1
    ? product.images[1]
    : product.images?.[selectedImageIndex] || product.images?.[0] || product.thumbnail || "/placeholder.jpg";

  const isOutOfStock = product.stockQuantity <= 0;

  const handleAddToCart = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (isOutOfStock) return;
    incrementCounter('clicks');
    addToCart(product, 1, product.availableSizes?.[0] || "M", selectedColor);
    toast.success(`Added to bag`, {
      style: {
        borderRadius: '0px',
        background: '#000',
        color: '#fff',
        fontSize: '10px',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
      },
    });
  };

  const handleColorSelect = (e, color, index) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColor(color);
    if (product.images?.[index]) setSelectedImageIndex(index);
  };

  // ===== SIGHT MODE (single column) =====
  if (isSightMode) {
    return (
      <div className="group flex flex-col md:flex-row w-full bg-white border-b border-black/5">
        {/* Image */}
        <Link
          to={`/product/${product.id}`}
          className="relative w-full md:w-1/2 aspect-square overflow-hidden block bg-[#f5f5f5] flex-shrink-0"
        >
          <img
            src={mainImage}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {isOutOfStock && (
            <span className="absolute top-4 left-4 bg-white text-black text-[8px] font-bold tracking-[0.2em] px-2 py-1 uppercase border border-black/5">
              Sold Out
            </span>
          )}
          {!isOutOfStock && product.newArrival && (
            <span className="absolute top-4 left-4 bg-black text-white text-[8px] font-bold tracking-[0.2em] px-2 py-1 uppercase">
              New
            </span>
          )}
        </Link>

        {/* Info */}
        <div className="flex flex-col justify-between px-8 py-8 md:px-16 md:py-16 md:w-1/2">
          <div>
            <Link to={`/product/${product.id}`}>
              <h3 className="text-[14px] md:text-[18px] font-bold tracking-[0.2em] uppercase text-black mb-4 hover:opacity-60 transition-opacity">
                {product.title}
              </h3>
            </Link>
            <p className="text-[14px] md:text-[18px] font-bold tracking-[0.2em] uppercase text-black mb-8">
              {settings.currency_symbol}{product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Swatches */}
          {product.availableColors?.length > 0 && (
            <div className="flex gap-2 mb-8">
              {product.availableColors.slice(0, 8).map((color, i) => (
                <button
                  key={i}
                  onClick={(e) => handleColorSelect(e, color, i)}
                  className={`w-8 h-10 border transition-all ${selectedColor === color ? 'border-black' : 'border-transparent opacity-50 hover:opacity-100'}`}
                >
                  {product.images?.[i] ? (
                    <img src={product.images[i]} alt={color} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" style={{ backgroundColor: color.toLowerCase() }} />
                  )}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-full md:w-auto px-8 py-4 bg-black text-white text-[9px] tracking-[0.3em] font-bold uppercase transition-all hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <ShoppingBag size={12} />
            {isOutOfStock ? "SOLD OUT" : "ADD TO BAG"}
          </button>
        </div>
      </div>
    );
  }

  // ===== MODEL GRID MODE =====
  return (
    <div className="group flex flex-col w-full bg-white border-r border-b border-black/5">
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

        {/* Quick Add button */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 bg-white text-black size-10 rounded-full flex items-center justify-center shadow-xl z-20 hover:bg-black hover:text-white"
        >
          <Plus size={16} />
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 pointer-events-none">
          {isOutOfStock ? (
            <span className="bg-white text-black text-[7px] font-bold tracking-[0.2em] px-2 py-1 uppercase border border-black/5">
              Sold Out
            </span>
          ) : product.newArrival ? (
            <span className="bg-black text-white text-[7px] font-bold tracking-[0.2em] px-2 py-1 uppercase">
              New
            </span>
          ) : null}
        </div>
      </Link>

      {/* Card Info — name + price only, NO subtitle */}
      <div className="pt-3 pb-4 px-3 md:px-4 bg-white">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-[8px] md:text-[9px] font-bold tracking-[0.15em] uppercase text-black line-clamp-1 flex-1">
            {product.title}
          </h3>
          <span className="text-[8px] md:text-[9px] font-bold tracking-[0.15em] uppercase text-black whitespace-nowrap">
            {settings.currency_symbol}{product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Color swatches (tiny) */}
        {product.availableColors?.length > 0 && (
          <div className="flex gap-1 mt-2">
            {product.availableColors.slice(0, 5).map((color, i) => (
              <button
                key={i}
                onClick={(e) => handleColorSelect(e, color, i)}
                title={color}
                className={`w-3 h-4 border transition-all ${selectedColor === color ? 'border-black' : 'border-transparent opacity-50 hover:opacity-100'}`}
              >
                {product.images?.[i] ? (
                  <img src={product.images[i]} alt={color} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{ backgroundColor: color.toLowerCase() }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
