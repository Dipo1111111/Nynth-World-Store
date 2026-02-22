import React, { useState, useEffect } from "react";
import Header from "../components/home/Header.jsx";
import Footer from "../components/home/Footer.jsx";
import SEO from "../components/SEO";
import { fetchProducts } from "../api/firebaseFunctions";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import ProductCard from "../components/products/ProductCard";

const categories = ["Explore", "Apparel", "Homeware", "Accessories", "Drinkware"];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("Explore");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts();
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const filteredProducts = activeCategory === "Explore"
    ? products
    : products.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());

  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white min-h-screen">
      <SEO />
      <Header />
      <SEO />

      <main className="flex-1 w-full bg-[#FCFCFC]">
        {/* Simplified Luxury Hero / Featured Section */}
        <section className="bg-white border-b border-gray-100">
          <div className="section-pad py-16 md:py-24 text-center">
            <span className="font-inter text-[9px] md:text-[10px] tracking-[0.4em] text-gray-400 uppercase mb-4 block animate-fadeIn">
              Collection 001 / NYNTH
            </span>
            <h1 className="hero-title text-black mb-8 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              {activeCategory === "Explore" ? "FEATURED" : activeCategory}
            </h1>
          </div>
        </section>

        {/* Categories Bar - Sticky to match Shop */}
        <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 flex justify-center gap-8 py-4 md:py-6 overflow-x-auto no-scrollbar px-4 transition-all duration-300">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setCurrentPage(1);
              }}
              className={`text-[10px] tracking-[0.25em] font-bold uppercase transition-all duration-300 whitespace-nowrap ${activeCategory === cat ? "text-black underline underline-offset-8" : "text-gray-400 hover:text-black"
                }`}
            >
              {cat === "Explore" ? "ALL" : cat}
            </button>
          ))}
        </div>

        <div className="section-pad py-10 md:py-16 min-h-[60vh]">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <p className="text-gray-400 font-inter text-[10px] tracking-widest uppercase">
              Showing {currentProducts.length} of {filteredProducts.length} artifacts
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-12">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-gray-100 mb-4 h-full"></div>
                  <div className="h-3 bg-gray-100 w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 w-1/4"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-12 mb-20 animate-fadeIn">
                {currentProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination UI - Minimal */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-6 mt-8 pb-10">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-3 text-black disabled:opacity-30 transition-all hover:-translate-x-1"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="flex gap-4">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => paginate(i + 1)}
                        className={`
                          text-[11px] font-bold tracking-widest transition-all
                          ${currentPage === i + 1
                            ? "text-black underline underline-offset-4"
                            : "text-gray-300 hover:text-black"}
                        `}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-3 text-black disabled:opacity-30 transition-all hover:translate-x-1"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-32 border border-dashed border-gray-100 rounded-xl">
              <h3 className="text-[11px] tracking-[0.3em] font-bold uppercase text-gray-400">Inventory Empty</h3>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}