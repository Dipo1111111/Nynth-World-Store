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

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {/* Category Filters */}
        <div className="flex gap-2.5 mb-8 md:mb-12 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setCurrentPage(1);
              }}
              className={`
                px-8 py-3.5 rounded-xl text-sm font-medium border transition-all whitespace-nowrap
                ${activeCategory === cat
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 border-gray-200 hover:border-black"}
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dynamic Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-10 gap-2">
          <div>
            <h1 className="text-3xl md:text-5xl font-space font-bold tracking-tight">
              {activeCategory === "Explore" ? "Featured Products" : `${activeCategory} Collection`}
            </h1>
          </div>
          <p className="text-gray-400 font-inter text-[13px] md:text-sm">
            Showing {currentProducts.length} of {filteredProducts.length} products
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] bg-gray-100 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 mb-16">
              {currentProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8 pb-10">
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-gray-200 rounded-full hover:border-black disabled:opacity-30 disabled:hover:border-gray-200 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex gap-2">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => paginate(i + 1)}
                      className={`
                        w-10 h-10 rounded-full text-sm font-medium transition-all
                        ${currentPage === i + 1
                          ? "bg-black text-white"
                          : "bg-white text-gray-600 border border-gray-200 hover:border-black"}
                      `}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-gray-200 rounded-full hover:border-black disabled:opacity-30 disabled:hover:border-gray-200 transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl">
            <h3 className="text-xl font-bold mb-2">No products found</h3>
            <p className="text-gray-500">We're updating this collection soon.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}