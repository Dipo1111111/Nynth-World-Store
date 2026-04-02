// src/pages/lookbook.jsx - UPDATED WITH FIXED CAROUSEL
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowRight } from "lucide-react";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import { fetchLookbooks, fetchProductsByCategory, fetchProducts } from "../../api/firebaseFunctions";
import SEO from "../SEO";
import headerBanner from "../../assets/header.JPEG";
import { useSettings } from "../../context/SettingsContext";

export default function Lookbook() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [lookbooks, setLookbooks] = useState([]);
  const [fallbackProducts, setFallbackProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopProducts, setShopProducts] = useState({
    hoodies: null,
    tees: null,
    headwear: null
  });
  const { settings } = useSettings();

  // Load lookbooks and shop products
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch all data in parallel
        const [lookbookData, hoodies, tees, headwear] = await Promise.all([
          fetchLookbooks(),
          fetchProductsByCategory("hoodies", 1),
          fetchProductsByCategory("tees", 1),
          fetchProductsByCategory("headwear", 1)
        ]);

        console.log(`Lookbook Data Fetched: ${lookbookData.length} items`);
        setLookbooks(lookbookData);
        setShopProducts({
          hoodies: hoodies[0] || null,
          tees: tees[0] || null,
          headwear: headwear[0] || null
        });

        // Fallback: load all products for editorial grid if no lookbooks
        if (lookbookData.length === 0) {
          console.log("No lookbooks found in database - showing product fallback");
          const allProducts = await fetchProducts();
          setFallbackProducts(allProducts.slice(0, 6));
        }

      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter lookbooks to show in carousel
  // If we have featured looks, use them. Otherwise, use all available lookbooks.
  const featuredLooks = lookbooks.filter(look => look.featured);
  const displayLooks = featuredLooks.length > 0 ? featuredLooks : lookbooks;

  // Carousel Navigation
  const nextSlide = () => {
    if (displayLooks.length <= 1) return;
    setActiveSlide((prev) => (prev === displayLooks.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    if (displayLooks.length <= 1) return;
    setActiveSlide((prev) => (prev === 0 ? displayLooks.length - 1 : prev - 1));
  };

  // Auto-advance only if we have multiple slides
  useEffect(() => {
    if (displayLooks.length <= 1) return;

    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev === displayLooks.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [displayLooks.length]);

  return (
    <div className="min-h-screen bg-white text-black font-inter flex flex-col">
      <SEO
        title="Lookbook | NYNTH"
        description="Explore our latest collections and style inspiration. Minimal streetwear lookbook."
        url="/lookbook"
      />
      <Header />

      <main className="w-full pt-[68px]">
        {/* Full-width Hero Section - Edge to Edge */}
        <section className="relative w-full aspect-[21/9] md:aspect-[21/6] bg-[#ebebeb] overflow-hidden group">
          <img
            src={settings.hero_banner || headerBanner}
            alt="Lookbook Hero"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <h1 className="text-white text-[14px] md:text-[20px] tracking-[0.5em] font-bold uppercase text-center drop-shadow-sm">
              NYNTH WORLD LOOKBOOK
            </h1>
          </div>
        </section>

        {/* Featured Looks Carousel */}
        <section className="section-pad py-24 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
              <div className="space-y-4">
                <h2 className="text-[24px] md:text-[32px] tracking-widest font-bold uppercase">
                  Editor's Picks
                </h2>
              </div>

              {displayLooks.length > 1 && (
                <div className="flex items-center gap-6 mt-8 md:mt-0">
                  <button
                    onClick={prevSlide}
                    className="hover:opacity-50 transition-opacity"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft size={24} strokeWidth={1} />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="hover:opacity-50 transition-opacity"
                    aria-label="Next slide"
                  >
                    <ChevronRight size={24} strokeWidth={1} />
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="min-h-[500px] bg-gray-50 animate-pulse"></div>
            ) : lookbooks.length === 0 ? (
              // Case 1: No lookbooks at all, show product fallback
              fallbackProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fallbackProducts.map((product) => (
                    <Link key={product.id} to={`/product/${product.id}`} className="group block">
                      <div className="aspect-[3/4] overflow-hidden bg-gray-50 mb-4">
                        <img
                          src={product.images?.[0] || product.imageUrl}
                          alt={product.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <h3 className="text-[11px] tracking-[0.2em] font-bold uppercase">{product.title}</h3>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="min-h-[500px] bg-gray-50 flex items-center justify-center p-8 border border-gray-100">
                  <p className="text-[11px] tracking-[0.2em] font-bold text-gray-400 uppercase text-center">
                    Collection pending discovery.
                  </p>
                </div>
              )
            ) : (
              // Case 2: We have lookbooks (either featured or total), show them in the carousel
              <div className="relative overflow-hidden border border-gray-100">
                <div
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                >
                  {displayLooks.map((look) => (
                    <div key={look.id} className="w-full flex-shrink-0">
                      <div className="flex flex-col md:flex-row min-h-[500px] md:min-h-[600px]">
                        <div className="w-full md:w-1/2 h-[400px] md:h-auto bg-gray-50">
                          <img
                            src={look.image}
                            alt={look.title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="w-full md:w-1/2 p-10 md:p-16 lg:p-24 flex flex-col justify-center bg-white">
                          {look.season && (
                            <span className="text-[10px] tracking-[0.3em] font-bold text-gray-400 uppercase mb-4">
                              {look.season}
                            </span>
                          )}
                          <p className="font-inter text-[10px] md:text-[11px] tracking-[0.3em] font-bold uppercase text-gray-400 mb-8">
                            The definitive lookbook piece.
                          </p>
                          <h3 className="text-[20px] md:text-[28px] tracking-widest font-bold mb-6 uppercase">
                            {look.title}
                          </h3>
                          <p className="text-[13px] md:text-[14px] text-gray-600 mb-8 leading-relaxed tracking-wider uppercase font-medium">
                            {look.description}
                          </p>

                          {look.colorPalette && (
                            <div className="mb-8">
                              <span className="text-[10px] tracking-[0.2em] font-bold uppercase text-black">Palette: </span>
                              <span className="ml-2 text-[10px] tracking-[0.2em] font-bold uppercase text-gray-400">{look.colorPalette}</span>
                            </div>
                          )}

                          <Link
                            to="/shop"
                            className="inline-flex items-center gap-4 text-[11px] tracking-[0.3em] font-bold uppercase border-b border-black pb-2 hover:opacity-50 transition-opacity w-fit"
                          >
                            Shop collection
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {displayLooks.length > 1 && (
                  <div className="absolute bottom-8 left-10 md:left-auto md:right-10 flex gap-4">
                    {displayLooks.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveSlide(index)}
                        className={`h-[2px] transition-all duration-500 ${index === activeSlide ? "bg-black w-12" : "bg-gray-200 w-6"}`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}