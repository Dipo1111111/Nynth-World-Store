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

  // In model mode, prefer explicit modelImage, then 2nd image. Otherwise use selected.
  const mainImage = !isSightMode 
    ? (product.modelImage || (product.images?.length > 1 ? product.images[1] : (product.images?.[selectedImageIndex] || product.images?.[0] || "/placeholder.jpg")))
    : (product.images?.[selectedImageIndex] || product.images?.[0] || product.thumbnail || "/placeholder.jpg");

  const isOutOfStock = product.stockQuantity <= 0;

  // Filter allowed visual tags (ignores hidden SEO tags like 'cotton', 't-shirt')
  const allowedTags = ["new", "best seller", "essential", "limited edition", "sale", "restocked"];
  let activeTags = [];
  if (product.newArrival) activeTags.push("New");
  if (product.tags) {
    product.tags
      .filter(t => allowedTags.includes(t.toLowerCase()))
      .forEach(t => {
        if (!activeTags.some(at => at.toLowerCase() === t.toLowerCase())) {
          activeTags.push(t);
        }
      });
  }
  // User prefers max 1 or 2
  const tagsToShow = activeTags.slice(0, 2);

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

  // ===== SIGHT MODE (4x4 Grid but Richer Info) =====
  if (isSightMode) {
    return (
      <div className="group flex flex-col w-full bg-white mb-8">
        {/* Image */}
        <Link
          to={`/product/${product.id}`}
          className="relative w-full aspect-[4/5] overflow-hidden block bg-[#f5f5f5]"
        >
          <img
            src={mainImage}
            alt={product.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1 pointer-events-none">
            {isOutOfStock ? (
              <span className="bg-white text-black text-[7px] font-bold tracking-[0.2em] px-2 py-1 uppercase border border-black/5">
                Sold Out
              </span>
            ) : (
              <>
                {tagsToShow.map((tag, i) => (
                  <span key={i} className="bg-black text-white text-[7px] font-bold tracking-[0.2em] px-2 py-1 uppercase shadow-sm">
                    {tag}
                  </span>
                ))}
              </>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="flex flex-col pt-4 px-2">
          <Link to={`/product/${product.id}`}>
            <h3 className="text-[9px] md:text-[10px] font-bold tracking-[0.15em] uppercase text-black line-clamp-1 mb-1 hover:opacity-60 transition-opacity">
              {product.title}
            </h3>
          </Link>
          <p className="text-[9px] md:text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-4">
            {settings.currency_symbol}{product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>


          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-full py-3 min-h-[40px] bg-black text-white text-[8px] tracking-[0.2em] font-bold uppercase transition-all hover:bg-black/80 disabled:opacity-30 flex items-center justify-center gap-2"
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
    <div className="group flex flex-col w-full bg-white">
      <Link
        to={`/product/${product.id}`}
        className="relative aspect-[4/5] w-full overflow-hidden block bg-white"
      >
        <img
          src={mainImage}
          alt={product.title}
          loading="lazy"
          decoding="async"
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
        <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1 pointer-events-none">
          {isOutOfStock ? (
            <span className="bg-white text-black text-[7px] font-bold tracking-[0.2em] px-2 py-1 uppercase border border-black/5">
              Sold Out
            </span>
          ) : (
            <>
              {tagsToShow.map((tag, i) => (
                <span key={i} className="bg-black text-white text-[7px] font-bold tracking-[0.2em] px-2 py-1 uppercase shadow-sm">
                  {tag}
                </span>
              ))}
            </>
          )}
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

      </div>
    </div>
  );
}
