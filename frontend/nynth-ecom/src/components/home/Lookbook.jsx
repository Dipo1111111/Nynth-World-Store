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
    <div className="min-h-screen bg-white text-black">
      <SEO
        title="Lookbook | NYNTH"
        description="Explore our latest collections and style inspiration. Minimal streetwear lookbook."
        url="/lookbook"
      />
      <Header />

      {/* Hero Section - Simplified */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
            alt="Lookbook Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
        </div>

        <div className="relative h-full flex items-end section-pad">
          <div className="max-w-4xl">
            <span className="font-inter text-sm font-medium tracking-wider text-white/90 uppercase mb-4 block">
              Editorial Collection
            </span>
            <h1 className="font-space text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight">
              The NYNTH<br />Lookbook
            </h1>
            <p className="font-inter text-base md:text-lg text-white/90 max-w-2xl">
              Explore curated style narratives. See how minimalism meets streetwear in everyday contexts.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Looks Carousel - FIXED & RESPONSIVE */}
      <section className="section-pad bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-10">
            <div>
              <span className="font-inter text-sm font-medium text-gray-600 uppercase tracking-wider mb-2 block">
                Featured Stories
              </span>
              <h2 className="font-space text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                Editor's Picks
              </h2>
            </div>

            {featuredLooks.length > 1 && (
              <div className="flex items-center gap-3 mt-4 md:mt-0">
                <button
                  onClick={prevSlide}
                  className="p-2 md:p-3 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={18} className="md:w-5 md:h-5" />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2 md:p-3 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                  aria-label="Next slide"
                >
                  <ChevronRight size={18} className="md:w-5 md:h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Carousel Container - FIXED RESPONSIVENESS */}
          {loading ? (
            <div className="min-h-[400px] md:min-h-[500px] bg-gray-100 rounded-2xl animate-pulse"></div>
          ) : featuredLooks.length === 0 ? (
            <div className="min-h-[400px] md:min-h-[500px] bg-gray-50 rounded-2xl flex items-center justify-center p-8">
              <p className="text-gray-600 text-center">
                No featured lookbooks yet. Add some with "featured: true" in the lookbooks collection.
              </p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-gray-200">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${activeSlide * 100}%)` }}
              >
                {featuredLooks.map((look) => (
                  <div key={look.id} className="w-full flex-shrink-0">
                    <div className="flex flex-col md:flex-row min-h-[400px] md:min-h-[500px]">
                      {/* Image Side - RESPONSIVE */}
                      <div className="relative w-full md:w-1/2 h-64 md:h-auto bg-gray-100">
                        <img
                          src={look.image}
                          alt={look.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>

                      {/* Content Side - RESPONSIVE PADDING */}
                      <div className="w-full md:w-1/2 p-6 md:p-8 lg:p-12 flex flex-col justify-center bg-white">
                        {look.season && (
                          <span className="font-inter text-sm font-medium tracking-wider text-gray-600 uppercase mb-2">
                            {look.season}
                          </span>
                        )}
                        <h3 className="font-space text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">
                          {look.title}
                        </h3>
                        <p className="font-inter text-gray-600 mb-4 md:mb-6 leading-relaxed text-sm md:text-base">
                          {look.description}
                        </p>

                        {look.colorPalette && (
                          <div className="mb-4 md:mb-6">
                            <span className="font-inter text-sm font-medium text-gray-900">Color Palette: </span>
                            <span className="ml-2 font-inter text-gray-600">{look.colorPalette}</span>
                          </div>
                        )}

                        {look.products && look.products.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-6 md:mb-8">
                            {look.products.map((product, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs md:text-sm rounded-full font-inter"
                              >
                                {product}
                              </span>
                            ))}
                          </div>
                        )}

                        <Link
                          to="/shop"
                          className="inline-flex items-center gap-2 font-inter text-sm font-medium border-b border-black pb-1 hover:opacity-70 transition-opacity w-fit group"
                        >
                          Shop this look
                          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Carousel Dots - BETTER STYLING */}
              {featuredLooks.length > 1 && (
                <div className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                  {featuredLooks.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveSlide(index)}
                      className={`transition-all duration-300 ${index === activeSlide
                        ? "bg-black w-6 md:w-8 h-2 scale-100"
                        : "bg-gray-300 hover:bg-gray-400 w-2 h-2"
                        } rounded-full`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Grid Gallery - IMPROVED */}
      <section className="section-pad bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <span className="font-inter text-sm font-medium text-gray-600 uppercase tracking-wider mb-2 block">
              Visual Stories
            </span>
            <h2 className="font-space text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Style Gallery
            </h2>
            <p className="font-inter text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
              A collection of moments where NYNTH pieces come to life.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[3/4] bg-gray-100 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : lookbooks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No lookbook items yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {lookbooks.map((look) => (
                <div key={look.id} className="group">
                  <div className="relative overflow-hidden rounded-xl aspect-[3/4] mb-3 md:mb-4">
                    <img
                      src={look.image}
                      alt={look.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      {look.category && (
                        <span className="font-inter text-xs md:text-sm font-medium tracking-wider text-white/90">
                          {look.category}
                        </span>
                      )}
                      <h3 className="font-space text-lg md:text-xl font-bold mt-1">{look.title}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA Section */}
          <div className="text-center mt-12 md:mt-16 pt-8 md:pt-12 border-t border-gray-100">
            <h3 className="font-space text-2xl md:text-3xl font-bold mb-3 md:mb-4">
              Inspired by what you see?
            </h3>
            <p className="font-inter text-gray-600 mb-6 md:mb-8 max-w-xl mx-auto text-sm md:text-base">
              Every look featured is built with NYNTH pieces. Shop the collection to create your own story.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Link
                to="/shop"
                className="btn-primary px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-medium tracking-wide inline-flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
              >
                <ShoppingBag size={16} className="md:w-5 md:h-5" />
                Shop Collection
              </Link>
              <Link
                to="/shop?category=hoodies"
                className="px-6 md:px-8 py-3 md:py-4 border-2 border-black rounded-full text-black font-inter text-sm md:text-base font-medium hover:bg-black hover:text-white transition-all"
              >
                Shop Hoodies
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Shop by Style - FETCHES FROM DATABASE */}
      <section className="section-pad bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="font-space text-3xl md:text-4xl font-bold tracking-tight mb-3 md:mb-4">
              Shop by Style
            </h2>
            <p className="font-inter text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
              Find your signature look from our curated style categories
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Tees */}
            <Link
              to={shopProducts.tees ? `/product/${shopProducts.tees.id}` : "/shop?category=tees"}
              className="group block"
            >
              <div className="relative overflow-hidden rounded-xl aspect-[4/5] mb-4">
                {loading ? (
                  <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                ) : shopProducts.tees ? (
                  <img
                    src={shopProducts.tees.images?.[0] || shopProducts.tees.thumbnail || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2070"}
                    alt={shopProducts.tees.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2070&auto=format&fit=crop"
                    alt="Tees"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
                  <span className="font-inter text-sm font-medium tracking-wider text-white/90 uppercase">
                    Tees
                  </span>
                  <h3 className="font-space text-xl md:text-2xl font-bold mb-2 mt-1">
                    {shopProducts.tees?.title || "Essential Tees"}
                  </h3>
                  <p className="font-inter text-white/90 text-sm md:text-base">
                    {shopProducts.tees?.shortDescription || "Classic fits, bold prints."}
                  </p>
                </div>
              </div>
            </Link>

            {/* Hoodies */}
            <Link
              to={shopProducts.hoodies ? `/product/${shopProducts.hoodies.id}` : "/shop?category=hoodies"}
              className="group block"
            >
              <div className="relative overflow-hidden rounded-xl aspect-[4/5] mb-4">
                {loading ? (
                  <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                ) : shopProducts.hoodies ? (
                  <img
                    src={shopProducts.hoodies.images?.[0] || shopProducts.hoodies.thumbnail || "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=2070"}
                    alt={shopProducts.hoodies.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=2070&auto=format&fit=crop"
                    alt="Hoodies"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
                  <span className="font-inter text-sm font-medium tracking-wider text-white/90 uppercase">
                    Hoodies
                  </span>
                  <h3 className="font-space text-xl md:text-2xl font-bold mb-2 mt-1">
                    {shopProducts.hoodies?.title || "Signature Hoodies"}
                  </h3>
                  <p className="font-inter text-white/90 text-sm md:text-base">
                    {shopProducts.hoodies?.shortDescription || "Heavyweight, premium cotton."}
                  </p>
                </div>
              </div>
            </Link>

            {/* Headwear */}
            <Link
              to={shopProducts.headwear ? `/product/${shopProducts.headwear.id}` : "/shop?category=headwear"}
              className="group block"
            >
              <div className="relative overflow-hidden rounded-xl aspect-[4/5] mb-4">
                {loading ? (
                  <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                ) : shopProducts.headwear ? (
                  <img
                    src={shopProducts.headwear.images?.[0] || shopProducts.headwear.thumbnail || "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=2070"}
                    alt={shopProducts.headwear.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=2070&auto=format&fit=crop"
                    alt="Headwear"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
                  <span className="font-inter text-sm font-medium tracking-wider text-white/90 uppercase">
                    Headwear
                  </span>
                  <h3 className="font-space text-xl md:text-2xl font-bold mb-2 mt-1">
                    {shopProducts.headwear?.title || "NYNTH Headwear"}
                  </h3>
                  <p className="font-inter text-white/90 text-sm md:text-base">
                    {shopProducts.headwear?.shortDescription || "Caps & beanies built for style."}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* <NewsLetter /> */}
      <Footer />
    </div>
  );
}