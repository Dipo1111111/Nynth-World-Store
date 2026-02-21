// src/pages/ProductDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { fetchSingleProduct } from "../api/firebaseFunctions";
import { Plus, Minus, Check, ChevronDown, ChevronUp } from "lucide-react";
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
  const [isOpenDescription, setIsOpenDescription] = useState(true);
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

      {/* Mini Cart Notification */}
      {showCartNotification && (
        <div className="fixed top-20 right-6 z-[9999] bg-black text-white px-6 py-4 flex items-center gap-3 animate-fadeIn">
          <Check size={16} className="text-green-500" />
          <span className="text-[10px] tracking-widest uppercase font-bold">Added to cart</span>
        </div>
      )}

      <main className="px-4 md:px-10 lg:px-20 py-10 lg:py-20">
        <div className="grid lg:grid-cols-[1fr_400px] gap-20 items-start">

          {/* Left: Sticky Image Section */}
          <div className="lg:sticky lg:top-32 space-y-4">
            <div className="aspect-[4/5] bg-[#F2F2F2] overflow-hidden">
              <img
                src={product.images?.[selectedImage] || product.thumbnail || "/placeholder.jpg"}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            {/* Thumbnail Navigation */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {product.images?.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 aspect-[4/5] bg-[#F2F2F2] flex-shrink-0 transition-opacity ${selectedImage === i ? "opacity-100" : "opacity-40"}`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Scrollable Info Section */}
          <div className="flex flex-col">
            <div className="mb-10">
              <p className="text-[10px] tracking-[0.3em] font-bold text-gray-400 uppercase mb-2">SUVENE</p>
              <div className="flex justify-between items-start gap-4 mb-8">
                <h1 className="text-lg md:text-xl font-bold tracking-[0.1em] uppercase leading-tight">
                  {product.title}
                </h1>
                <span className="text-sm font-bold tracking-widest whitespace-nowrap">
                  {settings.currency_symbol}{product.price?.toLocaleString()}
                </span>
              </div>

              {/* Color Selection */}
              {product.availableColors?.length > 0 && (
                <div className="mb-8">
                  <p className="text-[10px] tracking-[0.2em] font-bold uppercase mb-4 text-gray-400">CHOOSE COLOR</p>
                  <div className="flex flex-wrap gap-2">
                    {product.availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-12 bg-[#F2F2F2] flex items-center justify-center transition-all p-1 ${selectedColor === color ? "ring-1 ring-black" : "hover:opacity-80"}`}
                      >
                        <div className="w-full h-full" style={{ backgroundColor: color.toLowerCase() }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {product.availableSizes?.length > 0 && (
                <div className="mb-10">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] tracking-[0.2em] font-bold uppercase text-gray-400">SIZE:</p>
                    <button className="text-[9px] tracking-widest uppercase underline underline-offset-4 font-bold">SIZECHART</button>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {product.availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-2 text-[10px] font-bold tracking-widest transition-all border ${selectedSize === size ? "bg-black text-white border-black" : "border-gray-200 hover:border-black"}`}
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
                className="w-full bg-[#A3A3A3] text-white py-4 text-[10px] tracking-[0.3em] font-bold uppercase hover:bg-black transition-colors disabled:opacity-50"
              >
                {addingToCart ? "ADDING..." : product.inStock ? "SELECT OPTION" : "OUT OF STOCK"}
              </button>

              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-[10px] tracking-widest font-bold uppercase">
                  <Check size={14} /> 3-5 DAYS SHIPPING
                </div>
                <div className="flex items-center gap-2 text-[10px] tracking-widest font-bold uppercase">
                  <Check size={14} /> 14 DAYS RETURN POLICY
                </div>
              </div>
            </div>

            {/* Accordions */}
            <div className="border-t border-gray-100">
              <button
                onClick={() => setIsOpenDescription(!isOpenDescription)}
                className="w-full flex justify-between items-center py-5 text-[10px] tracking-[0.2em] font-bold uppercase"
              >
                <span>DESCRIPTION</span>
                {isOpenDescription ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {isOpenDescription && (
                <div className="pb-8 text-[11px] leading-relaxed text-gray-500 tracking-wide">
                  {product.description}
                </div>
              )}

              <button
                onClick={() => setIsOpenShipping(!isOpenShipping)}
                className="w-full flex justify-between items-center py-5 border-t border-gray-100 text-[10px] tracking-[0.2em] font-bold uppercase"
              >
                <span>SHIPPING & RETURNS</span>
                {isOpenShipping ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {isOpenShipping && (
                <div className="pb-8 text-[11px] leading-relaxed text-gray-500 tracking-wide">
                  Orders are typically processed within 1-3 business days. We ship worldwide with tracking provided via email. Returns are accepted within 14 days of delivery.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
