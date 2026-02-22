// src/pages/ProductDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { fetchSingleProduct } from "../api/firebaseFunctions";
import { Plus, Minus, Check, ShieldCheck } from "lucide-react";
import { useCart } from "../context/CartContext";
import SEO from "../components/SEO";
import { useSettings } from "../context/SettingsContext";

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { settings } = useSettings();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);
  const [showCartNotification, setShowCartNotification] = useState(false);

  // Accordion states
  const [isOpenDescription, setIsOpenDescription] = useState(false);
  const [isOpenShipping, setIsOpenShipping] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const data = await fetchSingleProduct(id);
        if (!data) {
          setError("Product not found");
          return;
        }
        setProduct(data);
        if (data.availableColors?.length > 0) setSelectedColor(data.availableColors[0]);
        if (data.availableSizes?.length > 0) setSelectedSize(data.availableSizes[0]);
      } catch (error) {
        setError("Failed to load product.");
      } finally {
        setLoading(false);
      }
    };
    if (id) loadProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || !product.inStock) return;
    try {
      setAddingToCart(true);
      await addToCart(product, 1, selectedSize, selectedColor);
      setShowCartNotification(true);
      setTimeout(() => setShowCartNotification(false), 3000);
    } catch (error) {
      alert("Failed to add to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading || error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] uppercase tracking-[0.2em] text-[11px]">
          {loading ? "Loading..." : error || "Product not found"}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-inter">
      <SEO title={`${product.title} | NYNTH`} description={product.description} url={`/product/${product.id}`} />
      <Header />

      {/* Added to Cart Notification */}
      {showCartNotification && (
        <div className="fixed top-20 right-6 z-[9999] bg-black text-white px-6 py-4 flex items-center gap-3 animate-fadeIn">
          <Check size={16} className="text-green-500" />
          <span className="text-[10px] tracking-widest uppercase font-bold">Added to cart</span>
        </div>
      )}

      {/* ====== DESKTOP: Two-Column Layout (lg+) ====== */}
      <main className="hidden lg:grid lg:grid-cols-2 min-h-screen pt-[68px]">
        {/* Left: Sticky Image */}
        <div className="bg-white relative lg:min-h-[calc(100vh-68px)] flex flex-col items-center justify-center p-10">
          <div className="lg:sticky lg:top-32 w-full h-full flex flex-col items-center justify-center">
            <div className="w-[85%] aspect-[4/5] relative">
              <img
                src={product.images?.[selectedImage] || product.thumbnail || "/placeholder.jpg"}
                alt={product.title}
                className="w-full h-full object-contain absolute inset-0"
              />
            </div>
            {/* Thumbnail Navigation */}
            {product.images?.length > 1 && (
              <div className="flex gap-2 mt-8 overflow-x-auto no-scrollbar max-w-[85%]">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`h-16 w-12 flex-shrink-0 transition-all border-2 ${selectedImage === i ? "border-black opacity-100" : "border-transparent opacity-40 hover:opacity-100"}`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="bg-white flex flex-col px-12 xl:px-24 py-24">
          <div className="max-w-xl w-full mx-auto">
            <p className="text-[9px] tracking-[0.2em] font-bold text-gray-400 uppercase mb-2">NYNTH</p>
            <div className="flex justify-between items-start gap-4 mb-10">
              <h1 className="text-[13px] font-bold tracking-[0.15em] uppercase leading-tight">
                {product.title}
              </h1>
              <span className="text-[12px] font-bold tracking-widest whitespace-nowrap">
                {settings.currency_symbol}{product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Color Selection */}
            {product.availableColors?.length > 0 && (
              <div className="mb-8">
                <p className="text-[9px] tracking-[0.2em] font-bold uppercase mb-4 text-gray-500">CHOOSE COLOR:</p>
                <div className="flex flex-wrap gap-2">
                  {product.availableColors.map((color, idx) => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                        // Switch to the image for this color if available
                        if (product.images?.[idx]) setSelectedImage(idx);
                      }}
                      className={`w-14 h-16 bg-white overflow-hidden flex items-center justify-center transition-all border-2 ${selectedColor === color ? "border-black" : "border-transparent hover:border-gray-300"}`}
                    >
                      {product.images?.[idx] ? (
                        <img src={product.images[idx]} alt={color} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full border border-gray-200" style={{ backgroundColor: color.toLowerCase() }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.availableSizes?.length > 0 && (
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[9px] tracking-[0.2em] font-bold uppercase text-gray-500">
                    SIZE: <span className="text-black">{selectedSize}</span>
                  </p>
                  <button className="text-[9px] tracking-widest uppercase underline underline-offset-4 font-bold text-gray-500 hover:text-black">SIZECHART</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[52px] py-2.5 px-3 text-[10px] font-bold tracking-widest text-center transition-all border ${selectedSize === size ? "border-black text-black border-2" : "border-gray-300 text-gray-500 hover:border-gray-500"}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock || addingToCart}
              className="w-full bg-black text-white py-4 text-[11px] tracking-[0.2em] font-bold uppercase hover:bg-gray-900 transition-colors disabled:opacity-50 mb-8"
            >
              {addingToCart ? "ADDING..." : product.inStock ? "ADD TO CART" : "OUT OF STOCK"}
            </button>

            {/* Shipping Badges */}
            <div className="space-y-3 mb-12">
              <div className="flex items-center gap-3 text-[10px] tracking-widest font-bold uppercase text-black">
                <ShieldCheck size={14} strokeWidth={2} className="text-green-600" /> 3-5 DAYS SHIPPING
              </div>
              <div className="flex items-center gap-3 text-[10px] tracking-widest font-bold uppercase text-black">
                <ShieldCheck size={14} strokeWidth={2} className="text-green-600" /> 14 DAYS RETURN POLICY
              </div>
            </div>

            {/* Accordions */}
            <div className="border-t border-gray-200">
              <button
                onClick={() => setIsOpenDescription(!isOpenDescription)}
                className="w-full flex justify-between items-center py-5 text-[10px] tracking-[0.2em] font-bold uppercase hover:opacity-70 transition-opacity"
              >
                <span>DESCRIPTION</span>
                {isOpenDescription ? <Minus size={14} /> : <Plus size={14} />}
              </button>
              {isOpenDescription && (
                <div className="pb-6 text-[11px] leading-[1.8] text-gray-500 tracking-wide">
                  {product.description}
                </div>
              )}

              <button
                onClick={() => setIsOpenShipping(!isOpenShipping)}
                className="w-full flex justify-between items-center py-5 border-t border-gray-200 text-[10px] tracking-[0.2em] font-bold uppercase hover:opacity-70 transition-opacity"
              >
                <span>SHIPPING & RETURNS</span>
                {isOpenShipping ? <Minus size={14} /> : <Plus size={14} />}
              </button>
              {isOpenShipping && (
                <div className="pb-6 text-[11px] leading-[1.8] text-gray-500 tracking-wide">
                  Orders are typically processed within 1-3 business days. We ship worldwide with tracking provided via email. Returns are accepted within 14 days of delivery.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ====== MOBILE: Single Column Layout (<lg) ====== */}
      <main className="lg:hidden pt-[68px] pb-24">
        {/* Product Image */}
        <div className="w-full bg-white aspect-square flex items-center justify-center">
          <img
            src={product.images?.[selectedImage] || product.thumbnail || "/placeholder.jpg"}
            alt={product.title}
            className="w-[80%] h-[80%] object-contain"
          />
        </div>

        {/* Product Info */}
        <div className="px-5 pt-6">
          <p className="text-[9px] tracking-[0.2em] font-bold text-gray-400 uppercase mb-1">NYNTH</p>
          <div className="flex justify-between items-start gap-4 mb-6">
            <h1 className="text-[13px] font-bold tracking-[0.12em] uppercase leading-tight">
              {product.title}
            </h1>
            <span className="text-[12px] font-bold tracking-widest whitespace-nowrap">
              {settings.currency_symbol}{product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Color Selection */}
          {product.availableColors?.length > 0 && (
            <div className="mb-6">
              <p className="text-[9px] tracking-[0.2em] font-bold uppercase mb-3 text-gray-500">CHOOSE COLOR:</p>
              <div className="flex flex-wrap gap-2">
                {product.availableColors.map((color, idx) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      if (product.images?.[idx]) setSelectedImage(idx);
                    }}
                    className={`w-12 h-14 bg-[#f0f0f0] overflow-hidden flex items-center justify-center transition-all border-2 ${selectedColor === color ? "border-black" : "border-transparent hover:border-gray-300"}`}
                  >
                    {product.images?.[idx] ? (
                      <img src={product.images[idx]} alt={color} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: color.toLowerCase() }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {product.availableSizes?.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[9px] tracking-[0.2em] font-bold uppercase text-gray-500">
                  SIZE: <span className="text-black">{selectedSize}</span>
                </p>
                <button className="text-[9px] tracking-widest uppercase underline underline-offset-4 font-bold text-gray-500 hover:text-black">SIZECHART</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[48px] py-2.5 px-2 text-[10px] font-bold tracking-widest text-center transition-all border ${selectedSize === size ? "border-black text-black border-2" : "border-gray-300 text-gray-500 hover:border-gray-500"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart (in-flow for mobile) */}
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock || addingToCart}
            className="w-full bg-black text-white py-4 text-[11px] tracking-[0.2em] font-bold uppercase hover:bg-gray-900 transition-colors disabled:opacity-50 mb-6"
          >
            {addingToCart ? "ADDING..." : product.inStock ? "ADD TO CART" : "OUT OF STOCK"}
          </button>

          {/* Shipping Badges */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 text-[10px] tracking-widest font-bold uppercase text-black">
              <ShieldCheck size={14} strokeWidth={2} className="text-green-600" /> 3-5 DAYS SHIPPING
            </div>
            <div className="flex items-center gap-3 text-[10px] tracking-widest font-bold uppercase text-black">
              <ShieldCheck size={14} strokeWidth={2} className="text-green-600" /> 14 DAYS RETURN POLICY
            </div>
          </div>

          {/* Accordions */}
          <div className="border-t border-gray-200">
            <button
              onClick={() => setIsOpenDescription(!isOpenDescription)}
              className="w-full flex justify-between items-center py-5 text-[10px] tracking-[0.2em] font-bold uppercase hover:opacity-70 transition-opacity"
            >
              <span>DESCRIPTION</span>
              {isOpenDescription ? <Minus size={14} /> : <Plus size={14} />}
            </button>
            {isOpenDescription && (
              <div className="pb-6 text-[11px] leading-[1.8] text-gray-500 tracking-wide">
                {product.description}
              </div>
            )}

            <button
              onClick={() => setIsOpenShipping(!isOpenShipping)}
              className="w-full flex justify-between items-center py-5 border-t border-gray-200 text-[10px] tracking-[0.2em] font-bold uppercase hover:opacity-70 transition-opacity"
            >
              <span>SHIPPING & RETURNS</span>
              {isOpenShipping ? <Minus size={14} /> : <Plus size={14} />}
            </button>
            {isOpenShipping && (
              <div className="pb-6 text-[11px] leading-[1.8] text-gray-500 tracking-wide">
                Orders are typically processed within 1-3 business days. We ship worldwide with tracking provided via email. Returns are accepted within 14 days of delivery.
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
