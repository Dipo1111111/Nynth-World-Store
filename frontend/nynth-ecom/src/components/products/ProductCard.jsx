// components/products/ProductCard.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Heart } from "lucide-react";
import { useCart } from "../../context/CartContext";
import toast from "react-hot-toast";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const mainImage = product.images?.[0] || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000";
  const secondaryImage = product.images?.[1] || mainImage;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Add with default size and color
    const defaultSize = product.sizes?.[0] || "M";
    const defaultColor = product.colors?.[0] || "Black";

    addToCart(product, 1, defaultSize, defaultColor);

    toast.success("Added to cart");
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div
        className="relative overflow-hidden rounded-xl bg-gray-100 mb-4 aspect-square"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={isHovered && secondaryImage ? secondaryImage : mainImage}
          alt={product.title}
          className="w-full h-full object-cover transition-opacity duration-500"
        />

        {/* Quick Actions Overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleWishlist}
            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors"
          >
            <Heart
              size={18}
              className={isWishlisted ? "fill-red-500 text-red-500" : "text-gray-700"}
            />
          </button>
          <button
            onClick={handleAddToCart}
            className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors"
          >
            <ShoppingBag size={18} className="text-gray-700" />
          </button>
        </div>

        {/* New Badge */}
        {product.isNew && (
          <div className="absolute top-3 left-3">
            <span className="bg-black text-white text-xs font-medium px-3 py-1 rounded-full">
              NEW
            </span>
          </div>
        )}

        {/* Sale Badge */}
        {product.salePrice && (
          <div className="absolute top-3 left-3">
            <span className="bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-full">
              SALE
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-1">
        <h3 className="font-inter font-semibold text-base group-hover:underline">
          {product.title}
        </h3>
        <p className="text-sm text-gray-600">{product.category}</p>
        <div className="flex items-center gap-2">
          {product.salePrice ? (
            <>
              <span className="font-inter font-bold text-red-500">
                ₦{product.salePrice?.toLocaleString()}
              </span>
              <span className="font-inter text-sm text-gray-400 line-through">
                ₦{product.price?.toLocaleString()}
              </span>
            </>
          ) : (
            <span className="font-inter font-bold">₦{product.price?.toLocaleString()}</span>
          )}
        </div>
      </div>
    </Link>
  );
}