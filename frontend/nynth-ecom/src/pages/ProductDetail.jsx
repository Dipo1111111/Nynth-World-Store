// src/pages/ProductDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { fetchSingleProduct } from "../api/firebaseFunctions";
import { Plus, Minus, Check, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import SEO from "../components/SEO";
import { useSettings } from "../context/SettingsContext";
import SizeGuideModal from "../components/products/SizeGuideModal";

const getColorHex = (colorName) => {
  const map = {
    black: "#000000",
    white: "#FFFFFF",
    grey: "#808080",
    navy: "#000080",
    beige: "#F5F5DC",
    red: "#FF0000",
    blue: "#0000FF",
    green: "#008000",
    olive: "#808000",
    brown: "#654321",
    burgundy: "#800020",
    pink: "#FFC0CB",
    yellow: "#FFFF00",
    purple: "#800080"
  };
  return map[colorName.toLowerCase()] || colorName.toLowerCase();
};

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

  const timerRef = React.useRef(null);

  const startAutoScroll = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSelectedImage(prev => {
        return product?.images?.length > 1 ? (prev + 1) % product.images.length : prev;
      });
    }, 4000); // 4 seconds for slower, smoother feel
  }, [product?.images]);

  useEffect(() => {
    if (product?.images?.length > 1) {
      startAutoScroll();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [product, startAutoScroll]);

  const handleManualImageChange = (newIndex) => {
    setSelectedImage(newIndex);
    startAutoScroll(); // Clear and restart timer to prevent buggy jumps
  };

  const nextImage = () => {
    if (!product?.images) return;
    handleManualImageChange((selectedImage + 1) % product.images.length);
  };

  const prevImage = () => {
    if (!product?.images) return;
    handleManualImageChange(selectedImage === 0 ? product.images.length - 1 : selectedImage - 1);
  };
  const [addingToCart, setAddingToCart] = useState(false);
  const [showCartNotification, setShowCartNotification] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

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

      {/* Size Guide Modal */}
      {showSizeGuide && <SizeGuideModal onClose={() => setShowSizeGuide(false)} />}

      {/* Added to Cart Notification */}
      {showCartNotification && (
        <div className="fixed top-20 right-6 z-[9999] bg-black text-white px-6 py-4 flex items-center gap-3 animate-fadeIn">
          <Check size={16} className="text-green-500" />
          <span className="text-[10px] tracking-widest uppercase font-bold">Added to cart</span>
        </div>
      )}

      {/* ====== DESKTOP: Two-Column Layout (lg+) ====== */}
      <main className="hidden lg:grid lg:grid-cols-2 min-h-screen pt-[60px]">
        {/* Left: Edge-to-Edge Image Half */}
        <div className="bg-white relative h-[calc(100vh-60px)] flex flex-col items-center justify-center sticky top-[60px]">
          <div className="w-full h-full flex flex-col items-center justify-center p-20 xl:p-32">
            <div className="w-full h-full relative flex items-center justify-center">
              <img
                src={product.images?.[selectedImage] || product.thumbnail || "/placeholder.jpg"}
                alt={product.title}
                loading="lazy"
                className="w-full h-full object-cover transition-opacity duration-500"
              />
            </div>

            {/* Thumbnail Navigation - Floating at bottom of grey half */}
            {product.images?.length > 1 && (
              <div className="absolute bottom-20 flex gap-1.5 overflow-x-auto no-scrollbar max-w-[80%]">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => handleManualImageChange(i)}
                    className={`h-14 w-11 flex-shrink-0 transition-opacity border ${selectedImage === i ? "border-black opacity-100" : "border-transparent opacity-30 hover:opacity-100"}`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Info Half */}
        <div className="bg-white flex flex-col p-16 xl:p-32 min-h-screen overflow-y-auto">
          <div className="max-w-xl w-full">
            <p className="text-[8px] tracking-[0.3em] font-bold text-gray-400 uppercase mb-2">NYNTH WORLD</p>
            <div className="flex justify-between items-start gap-4 mb-12">
              <h1 className="text-[11px] font-bold tracking-[0.15em] uppercase leading-tight">
                {product.title}
              </h1>
              <span className="text-[10px] font-bold tracking-[0.2em] whitespace-nowrap">
                {settings.currency_symbol}{product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Color Selection - Exact Suvene Style Boxes */}
            {product.availableColors?.length > 0 && (
              <div className="mb-10">
                <p className="text-[8px] tracking-[0.25em] font-bold uppercase mb-4 text-black">CHOOSE COLOR:</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.availableColors.map((color, idx) => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                      }}
                      className={`w-12 h-14 bg-white flex items-center justify-center transition-all border ${selectedColor === color ? "border-black border-[1.5px]" : "border-transparent hover:border-black/20"}`}
                    >
                      <div className="w-5 h-5 border border-black/10" style={{ backgroundColor: getColorHex(color) }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection - Exact Suvene Style Boxes */}
            {product.availableSizes?.length > 0 && (
              <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[8px] tracking-[0.25em] font-bold uppercase text-black">
                    SIZE: <span className="font-normal text-gray-400 ml-1">{selectedSize}</span>
                  </p>
                  <button onClick={() => setShowSizeGuide(true)} className="text-[8px] tracking-[0.2em] uppercase underline underline-offset-8 font-bold text-black hover:opacity-50 transition-opacity">SIZECHART</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {product.availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`flex-1 min-w-[50px] py-1 text-[9px] font-bold tracking-[0.2em] text-center transition-all border ${selectedSize === size ? "border-black bg-black text-white" : "border-black/10 text-black hover:border-black"}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart Button - Suvene Grey Button */}
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock || addingToCart}
              className="w-full bg-[#999999] text-white py-4 text-[10px] tracking-[0.3em] font-bold uppercase hover:bg-black transition-all duration-500 disabled:opacity-50 mb-10"
            >
              {addingToCart ? "ADDING..." : product.inStock ? "SELECT OPTION" : "OUT OF STOCK"}
            </button>

            {/* Shipping Badges - Simple minimalist */}
            <div className="space-y-3 mb-16">
              <div className="flex items-center gap-3 text-[9px] tracking-[0.2em] font-bold uppercase text-black">
                <div className="w-1.5 h-1.5 rounded-full bg-black"></div> 3-5 DAYS SHIPPING
              </div>
              <div className="flex items-center gap-3 text-[9px] tracking-[0.2em] font-bold uppercase text-black">
                <div className="w-1.5 h-1.5 rounded-full bg-black"></div> 14 DAYS RETURN POLICY
              </div>
            </div>

            {/* Accordions - Simple borders */}
            <div className="border-t border-black/5">
              <button
                onClick={() => setIsOpenDescription(!isOpenDescription)}
                className="w-full flex justify-between items-center py-7 text-[9px] tracking-[0.25em] font-bold uppercase hover:opacity-50 transition-all"
              >
                <span>DESCRIPTION</span>
                <Plus size={14} className={`transition-transform duration-500 ${isOpenDescription ? "rotate-45" : ""}`} />
              </button>
              {isOpenDescription && (
                <div className="pb-10 text-[10px] leading-[2] text-gray-500 tracking-wide pr-10">
                  {product.description}
                </div>
              )}

              <button
                onClick={() => setIsOpenShipping(!isOpenShipping)}
                className="w-full flex justify-between items-center py-7 border-t border-black/5 text-[9px] tracking-[0.25em] font-bold uppercase hover:opacity-50 transition-all"
              >
                <span>SHIPPING & RETURNS</span>
                <Plus size={14} className={`transition-transform duration-500 ${isOpenShipping ? "rotate-45" : ""}`} />
              </button>
              {isOpenShipping && (
                <div className="pb-10 text-[10px] leading-[2] text-gray-500 tracking-wide pr-10">
                  Orders are typically processed within 1-3 business days. We ship worldwide with tracking provided via email. Returns are accepted within 14 days of delivery.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ====== MOBILE: Single Column Layout (<lg) ====== */}
      <main className="lg:hidden pt-[68px] pb-24">
        {/* Product Image Mobile Carousel */}
        <div className="w-full bg-white relative aspect-square flex items-center justify-center overflow-hidden group">
          <img
            src={product.images?.[selectedImage] || product.thumbnail || "/placeholder.jpg"}
            alt={product.title}
            className="w-[85%] h-[85%] object-contain transition-opacity duration-300"
          />
          
          {product.images?.length > 1 && (
            <>
              {/* Arrows */}
              <button 
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-gray-100/80 rounded-full shadow-sm text-black opacity-80 hover:opacity-100"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-gray-100/80 rounded-full shadow-sm text-black opacity-80 hover:opacity-100"
              >
                <ChevronRight size={18} />
              </button>

              {/* Dots */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-white/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                {product.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handleManualImageChange(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === selectedImage ? "bg-black w-4" : "bg-black/30 w-1.5"}`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
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
                    }}
                    className={`w-12 h-14 bg-[#f0f0f0] flex items-center justify-center transition-all border-2 ${selectedColor === color ? "border-black" : "border-transparent hover:border-gray-300"}`}
                  >
                    <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: getColorHex(color) }} />
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
