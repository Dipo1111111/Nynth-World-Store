// src/pages/lookbook.jsx - UPDATED WITH FIXED CAROUSEL
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowRight } from "lucide-react";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import NewsLetter from "./NewsLetter.jsx";
import { fetchLookbooks, fetchProductsByCategory } from "../../api/firebaseFunctions";
import SEO from "../SEO";

export default function Lookbook() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [lookbooks, setLookbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopProducts, setShopProducts] = useState({
    hoodies: null,
    tees: null,
    headwear: null
  });

  // Load lookbooks and shop products
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load lookbooks
        const lookbookData = await fetchLookbooks();
        setLookbooks(lookbookData);

        // Load one product from each category for "Shop by Style"
        const hoodies = await fetchProductsByCategory("hoodies", 1);
        const tees = await fetchProductsByCategory("tees", 1);
        const headwear = await fetchProductsByCategory("headwear", 1);

        setShopProducts({
          hoodies: hoodies[0] || null,
          tees: tees[0] || null,
          headwear: headwear[0] || null
        });

      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter featured looks for carousel
  const featuredLooks = lookbooks.filter(look => look.featured);

  // Carousel Navigation - FIXED
  const nextSlide = () => {
    if (featuredLooks.length <= 1) return;
    setActiveSlide((prev) => (prev === featuredLooks.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    if (featuredLooks.length <= 1) return;
    setActiveSlide((prev) => (prev === 0 ? featuredLooks.length - 1 : prev - 1));
  };

  // Auto-advance only if we have multiple slides
  useEffect(() => {
    if (featuredLooks.length <= 1) return;

    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev === featuredLooks.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredLooks.length]);

  return (
    <div className="min-h-screen bg-white text-black font-inter">
      <SEO
        title="Lookbook | NYNTH"
        description="Explore our latest collections and style inspiration. Minimal streetwear lookbook."
        url="/lookbook"
      />
      <Header />

      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
            alt="Lookbook Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        <div className="relative h-full flex items-end section-pad pb-20">
          <div className="max-w-4xl">
            <span className="text-[10px] tracking-[0.4em] text-white uppercase mb-6 block font-bold">
              Editorial Collection
            </span>
            <h1 className="hero-title text-white text-left mb-8">
              THE NYNTH<br />LOOKBOOK
            </h1>
            <p className="text-[14px] md:text-[16px] text-white/90 max-w-2xl tracking-wider uppercase font-medium">
              Explore curated style narratives. Minimalism meets streetwear.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Looks Carousel */}
      <section className="section-pad py-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div className="space-y-4">
              <span className="text-[10px] tracking-[0.3em] font-bold text-gray-400 uppercase">
                Featured Stories
              </span>
              <h2 className="text-[24px] md:text-[32px] tracking-widest font-bold uppercase">
                Editor's Picks
              </h2>
            </div>

            {featuredLooks.length > 1 && (
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
          ) : featuredLooks.length === 0 ? (
            <div className="min-h-[500px] bg-gray-50 flex items-center justify-center p-8 border border-gray-100">
              <p className="text-[11px] tracking-[0.2em] font-bold text-gray-400 uppercase text-center">
                Collection pending discovery.
              </p>
            </div>
          ) : (
            <div className="relative overflow-hidden border border-gray-100">
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {featuredLooks.map((look) => (
                  <div key={look.id} className="w-full flex-shrink-0">
                    <div className="flex flex-col md:flex-row min-h-[500px] md:min-h-[600px]">
                      <div className="w-full md:w-1/2 h-[400px] md:h-auto bg-gray-50">
                        <img
                          src={look.image}
                          alt={look.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="w-full md:w-1/2 p-10 md:p-16 lg:p-24 flex flex-col justify-center bg-white">
                        {look.season && (
                          <span className="text-[10px] tracking-[0.3em] font-bold text-gray-400 uppercase mb-4">
                            {look.season}
                          </span>
                        )}
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
                          Shop Artifacts
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {featuredLooks.length > 1 && (
                <div className="absolute bottom-8 left-10 md:left-auto md:right-10 flex gap-4">
                  {featuredLooks.map((_, index) => (
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

      {/* Grid Gallery */}
      <section className="section-pad py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-left mb-16 space-y-4">
            <span className="text-[10px] tracking-[0.3em] font-bold text-gray-400 uppercase">
              Visual Narrative
            </span>
            <h2 className="text-[24px] md:text-[32px] tracking-widest font-bold uppercase mb-4">
              Style Gallery
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="aspect-[3/4] bg-gray-50 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {lookbooks.map((look) => (
                <div key={look.id} className="group cursor-pointer">
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 mb-6">
                    <img
                      src={look.image}
                      alt={look.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] tracking-[0.25em] font-bold text-gray-400 uppercase">
                      {look.category || "General"}
                    </span>
                    <h3 className="text-[14px] tracking-widest font-bold uppercase">{look.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-32 pt-20 border-t border-gray-100 text-center">
            <h3 className="text-[20px] md:text-[28px] tracking-widest font-bold uppercase mb-8">
              Defined by Details
            </h3>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                to="/shop"
                className="px-12 py-5 bg-black text-white text-[11px] font-bold tracking-[0.3em] uppercase hover:opacity-90 transition-all"
              >
                Shop Collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {['TEES', 'HOODIES', 'HEADWEAR'].map((cat) => (
              <Link
                key={cat}
                to={`/shop?category=${cat.toLowerCase()}`}
                className="group block"
              >
                <div className="space-y-6">
                  <div className="aspect-[4/5] bg-white overflow-hidden border border-gray-200">
                    <img
                      src={cat === 'TEES' ? "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2070" : cat === 'HOODIES' ? "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=2070" : "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=2070"}
                      alt={cat}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-[14px] tracking-[0.25em] font-bold uppercase">{cat}</h3>
                    <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}