// pages/Shop.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import ProductCard from "../components/products/ProductCard";
import { fetchProducts } from "../api/firebaseFunctions";
import { Loader2 } from "lucide-react";
import SEO from "../components/SEO";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get("category") || "all");
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState(() => searchParams.get("sort") || "newest");

  const [displayMode, setDisplayMode] = useState("view");

  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
    setSelectedCategory(searchParams.get("category") || "all");
    setSortBy(searchParams.get("sort") || "newest");
  }, [searchParams]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts();
        setProducts(data);
      } catch (err) {
        setError("Failed to load products.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    if (!products.length) return;
    let result = [...products];
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(p => p.title?.toLowerCase().includes(query) || p.category?.toLowerCase().includes(query));
    }
    if (selectedCategory !== "all") {
      result = result.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());
    }
    // Sorting Newest
    result.sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
    setFilteredProducts(result);
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-white text-black font-inter flex flex-col">
      <SEO title="Shop Collection | NYNTH" description="Premium Minimal Streetwear" url="/shop" />
      <Header />

      <main className="w-full pt-[68px]">
        {/* Full-width Hero Section - Edge to Edge */}
        <section className="relative w-full aspect-[21/9] md:aspect-[21/6] bg-[#ebebeb] overflow-hidden group">
          <img
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=2600"
            alt="Collection Hero"
            fetchpriority="high"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
            <button
              onClick={() => {
                const grid = document.getElementById('product-grid');
                if (grid) grid.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white/90 backdrop-blur-md text-black px-10 py-3 rounded-full text-[10px] tracking-[0.4em] font-bold uppercase hover:bg-black hover:text-white transition-all duration-500 shadow-2xl scale-90 md:scale-100 hover:scale-110"
            >
              SHOP NOW
            </button>
          </div>
        </section>

        {/* Categories Bar - Primary Sticky - Edge to Edge */}
        <div className="sticky top-[68px] z-40 w-full bg-white border-b border-black/5 flex justify-between items-center py-5 px-6 md:px-10 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className={`text-[9px] uppercase tracking-[0.2em] font-bold transition-opacity ${displayMode === 'view' ? 'opacity-100' : 'opacity-30'}`}>SICHT</span>
              <div className="flex items-center gap-[2px]">
                <div className="w-[1.5px] h-3 bg-black opacity-20"></div>
                <div className="flex gap-[1px]">
                  <div className="w-[1.5px] h-3 bg-black"></div>
                  <div className="w-[1.5px] h-3 bg-black"></div>
                  <div className="w-[1.5px] h-3 bg-black"></div>
                  <div className="w-[1.5px] h-3 bg-black"></div>
                </div>
                <div className="w-[1.5px] h-3 bg-black opacity-20 ml-1"></div>
              </div>
              <span className={`text-[9px] uppercase tracking-[0.2em] font-bold transition-opacity ${displayMode === 'model' ? 'opacity-100' : 'opacity-30'}`}>MODELL</span>
              <button
                onClick={() => setDisplayMode(displayMode === 'model' ? 'view' : 'model')}
                className="ml-2 focus:outline-none"
              >
                <div className={`w-8 h-4 rounded-full border border-black flex items-center px-[2px] transition-colors ${displayMode === 'model' ? 'bg-black' : 'bg-transparent'}`}>
                  <div className={`w-3 h-3 rounded-full transition-transform ${displayMode === 'model' ? 'translate-x-[14px] bg-white' : 'translate-x-0 bg-black'}`}></div>
                </div>
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["all", "hoodies", "headwear", "tees"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-[9px] tracking-[0.25em] font-bold uppercase transition-all duration-300 whitespace-nowrap ${selectedCategory === cat ? "text-black underline underline-offset-[10px]" : "text-gray-300 hover:text-black"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Layer - 100% Full Width, 0 Padding, 1px Gaps */}
        <div id="product-grid" className="w-full bg-white min-h-[60vh] scroll-mt-[130px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white h-screen w-full">
              <Loader2 className="h-6 w-6 animate-spin text-black mb-4" />
            </div>
          ) : (
            <section className="w-full px-0">
              <div className={displayMode === 'view' ? "grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-12 bg-white px-4 md:px-10 py-10" : "grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-12 bg-white px-4 md:px-10 py-10"}>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} displayMode={displayMode} />
                ))}

                {/* Fill all empty slots in the last row to maintain 1px grid lines (only in model mode) */}
                {displayMode !== 'view' && filteredProducts.length > 0 && Array.from({
                  length: (4 - (filteredProducts.length % 4)) % 4
                }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-full h-full min-h-[300px]"></div>
                ))}
              </div>
            </section>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-40 uppercase tracking-[0.3em] text-[10px] text-gray-400 bg-white h-full w-full">
              NO PRODUCTS FOUND
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
