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
  const [gridCols, setGridCols] = useState(4); // 2 or 4
  const [showModels, setShowModels] = useState(false);

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
    <div className="min-h-screen bg-white text-black font-inter">
      <SEO title="Shop Collection | NYNTH" description="Premium Minimal Streetwear" url="/shop" />
      <Header />

      <main className="w-full">
        {/* Full-width Hero Section */}
        <section className="relative w-full aspect-[21/9] md:aspect-[21/7] bg-[#F2F2F2] overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=2070"
            alt="Collection Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/5 flex flex-col items-center justify-center">
            {/* Optional text or logo can go here */}
          </div>
        </section>

        {/* Minimal Filter Bar */}
        <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-4 md:px-10 py-3 text-[10px] tracking-[0.2em] font-bold uppercase transition-all">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">SICHT</span>
              <div className="flex items-center gap-1">
                {[2, 4].map(cols => (
                  <button
                    key={cols}
                    onClick={() => setGridCols(cols)}
                    className={`w-4 h-1 transition-all ${gridCols === cols ? "bg-black" : "bg-gray-200 hover:bg-gray-300"}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-gray-400">MODELL</span>
              <button
                onClick={() => setShowModels(!showModels)}
                className={`relative w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${showModels ? "bg-black" : "bg-gray-200"}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${showModels ? "translate-x-4" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex justify-center gap-8 py-6 md:py-10 border-b border-gray-50 overflow-x-auto no-scrollbar px-4">
          {["all", "hoodies", "shop-all", "accessories"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-[11px] tracking-[0.2em] font-bold uppercase transition-colors whitespace-nowrap ${selectedCategory === cat ? "text-black underline underline-offset-8" : "text-gray-400 hover:text-black"
                }`}
            >
              {cat.replace(/-/g, " ")}
            </button>
          ))}
        </div>

        <div className="px-4 md:px-10 lg:px-20 py-10 bg-[#F5F5F5] min-h-[60vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-black mb-4" />
            </div>
          ) : error ? (
            <div className="text-center py-20 uppercase tracking-widest text-[11px] text-gray-400">
              {error}
            </div>
          ) : (
            <div className={`grid gap-x-2 gap-y-10 transition-all duration-500 ${gridCols === 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4"
              }`}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-20 uppercase tracking-widest text-[11px] text-gray-400">
              No products found.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}