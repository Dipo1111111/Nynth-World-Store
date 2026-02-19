// components/products/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Eye } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useSettings } from "../../context/SettingsContext";
import toast from "react-hot-toast";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { settings } = useSettings();
  const mainImage = product.images?.[0] || "/placeholder.jpg";
  const isOutOfStock = product.stockQuantity <= 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) {
      toast.error("Sorry, this item is out of stock.");
      return;
    }

    // Add with default size and color
    const defaultSize = product.availableSizes?.[0] || product.sizes?.[0] || "M";
    const defaultColor = product.availableColors?.[0] || product.colors?.[0] || "Black";

    addToCart(product, 1, defaultSize, defaultColor);
    toast.success(`${product.title} added to cart!`);
  };

  return (
    <div className="group flex flex-col">
      <Link to={`/product/${product.id}`} className="relative aspect-[4/5] bg-[#F5F5F7] rounded-xl overflow-hidden mb-4 block">
        <img
          src={mainImage}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Quick Actions Overlay (Hunter Style) */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 scale-0 group-hover:scale-100 transition-transform origin-right">
          <button
            className="bg-white rounded-full p-2.5 shadow-sm hover:bg-gray-100 transition-colors"
            aria-label="Quick View"
          >
            <Eye size={20} className="text-gray-900" />
          </button>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`bg-white rounded-full p-2.5 shadow-sm transition-colors ${isOutOfStock ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
            aria-label={isOutOfStock ? "Out of stock" : "Add to cart"}
          >
            <ShoppingBag size={20} className="text-gray-900" />
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {isOutOfStock && (
            <span className="bg-white/90 backdrop-blur-sm text-red-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase border border-red-100">
              Sold Out
            </span>
          )}
          {product.isNew && !isOutOfStock && (
            <span className="bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
              New
            </span>
          )}
          {product.salePrice && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">
              Sale
            </span>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="space-y-1">
        <h3 className="text-base font-inter font-medium text-gray-900">{product.title}</h3>
        <p className="text-sm text-gray-400 font-inter">{product.subLabel || product.category || 'Apparel'}</p>
        <div className="pt-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {product.salePrice ? (
              <>
                <span className="text-lg font-bold font-inter text-red-600">{settings.currency_symbol}{product.salePrice?.toLocaleString()}</span>
                <span className="text-sm text-gray-400 line-through decoration-gray-300">{settings.currency_symbol}{product.price?.toLocaleString()}</span>
              </>
            ) : (
              <span className="text-lg font-bold font-inter text-gray-900">{settings.currency_symbol}{product.price?.toLocaleString()}</span>
            )}
          </div>

          {/* Color Previews */}
          <div className="flex gap-1.5">
            {product.availableColors?.slice(0, 3).map((color, i) => (
              <div
                key={i}
                className="w-3.5 h-3.5 rounded-full border border-gray-200"
                style={{
                  backgroundColor: color.toLowerCase(),
                  backgroundImage: color.toLowerCase() === 'white' ? 'linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee)' : 'none'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}