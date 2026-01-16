// pages/Shop.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import ProductCard from "../components/products/ProductCard";
import FiltersSidebar from "../components/shop/FiltersSidebar";
import { fetchProducts } from "../api/firebaseFunctions";
import { Loader2, Grid3x3, List, Filter } from "lucide-react";
import SEO from "../components/SEO";

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize filters from URL parameters
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return searchParams.get("category") || "all";
  });

  const [searchQuery, setSearchQuery] = useState(() => {
    return searchParams.get("search") || "";
  });

  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [sortBy, setSortBy] = useState(() => {
    return searchParams.get("sort") || "newest";
  });

  // Sync search query from URL
  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
    setSelectedCategory(searchParams.get("category") || "all");
    setSortBy(searchParams.get("sort") || "newest");
  }, [searchParams]);

  const [viewMode, setViewMode] = useState("grid");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const categories = [
    { value: "all", label: "All Products" },
    { value: "hoodies", label: "Hoodies" },
    { value: "tees", label: "Tees" },
    { value: "headwear", label: "Headwear" },
  ];

  // NEW ARRIVALS LOGIC:
  // When sortBy = "newest", products are sorted by created_at timestamp (Firestore timestamp)
  // Newest products appear first
  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "price-low-high", label: "Price: Low to High" },
    { value: "price-high-low", label: "Price: High to Low" },
  ];

  // Fetch products from Firebase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts();
        setProducts(data);
      } catch (err) {
        setError("Failed to load products. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedCategory !== "all") {
      params.set("category", selectedCategory);
    }

    if (sortBy !== "newest") {
      params.set("sort", sortBy);
    }

    if (searchQuery) {
      params.set("search", searchQuery);
    }

    // Only update if there are params or we're clearing them
    if (Array.from(params).length > 0) {
      setSearchParams(params);
    } else if (location.search) {
      // Clear all params if we're back to defaults
      setSearchParams({});
    }
  }, [selectedCategory, sortBy, searchQuery, setSearchParams, location.search]);

  // Apply filters whenever products or filter states change
  useEffect(() => {
    if (!products.length) return;

    let result = [...products];

    // 0. SEARCH FILTER
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(product =>
        product.title?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
    }

    // 1. CATEGORY FILTER
    if (selectedCategory !== "all") {
      result = result.filter(product => {
        const productCategory = product.category?.toLowerCase().trim();
        const selectedCategoryLower = selectedCategory.toLowerCase().trim();
        return productCategory === selectedCategoryLower;
      });
    }

    // 2. PRICE FILTER
    result = result.filter(product =>
      product.price >= priceRange.min && product.price <= priceRange.max
    );

    // 3. SORTING (This is where "New Arrivals" works)
    switch (sortBy) {
      case "price-low-high":
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price-high-low":
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "newest":
        // NEW ARRIVALS SORTING:
        // Sort by created_at timestamp (Firestore timestamp object)
        // Products with most recent created_at come first
        result.sort((a, b) => {
          // Handle Firestore timestamps (has seconds and nanoseconds)
          const getTimestamp = (item) => {
            if (item.created_at?.seconds) {
              return item.created_at.seconds;
            } else if (item.created_at?.toDate) {
              return item.created_at.toDate().getTime() / 1000;
            } else if (item.created_at instanceof Date) {
              return item.created_at.getTime() / 1000;
            }
            return 0;
          };

          const timeA = getTimestamp(a);
          const timeB = getTimestamp(b);
          return timeB - timeA; // Newest first (descending)
        });
        break;
      default:
        // Default: newest first
        result.sort((a, b) => {
          const timeA = a.created_at?.seconds || 0;
          const timeB = b.created_at?.seconds || 0;
          return timeB - timeA;
        });
        break;
    }

    setFilteredProducts(result);
  }, [products, selectedCategory, priceRange, sortBy]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory("all");
    setPriceRange({ min: 0, max: 100000 });
    setSortBy("newest");
    setIsMobileFiltersOpen(false);
  };

  // Handle "New Arrivals" link from header
  // When user clicks "New Arrivals" in header, it sets sort=newest
  // This effect handles that
  useEffect(() => {
    const sortFromUrl = searchParams.get("sort");
    const categoryFromUrl = searchParams.get("category");

    if (sortFromUrl === "newest") {
      setSortBy("newest");
    }

    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      <SEO
        title="Shop Premium Streetwear | NYNTH"
        description="Browse our collection of minimal streetwear. Limited drops, premium materials, and craftsmanship."
        url="/shop"
      />
      <Header />

      <main className="section-pad">
        {/* Hero Banner */}
        <div className="mb-12 text-center">
          <h1 className="font-space text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
            {selectedCategory === "all" ? "Shop Collection" : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
          </h1>
          <p className="font-inter text-gray-600 max-w-2xl mx-auto">
            {selectedCategory === "all"
              ? "Explore our curated collection of premium streetwear. Each piece is crafted with attention to detail and designed for the modern minimalist."
              : `Browse our selection of premium ${selectedCategory}. Each piece is crafted with attention to detail and designed for the modern minimalist.`
            }
          </p>
        </div>

        {/* Shop Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <FiltersSidebar
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={(category) => {
                setSelectedCategory(category);
                setIsMobileFiltersOpen(false);
              }}
              priceRange={priceRange}
              onPriceChange={setPriceRange}
              sortBy={sortBy}
              onSortChange={(sort) => {
                setSortBy(sort);
                setIsMobileFiltersOpen(false);
              }}
              onClearFilters={clearFilters}
              isMobileFiltersOpen={isMobileFiltersOpen}
              setIsMobileFiltersOpen={setIsMobileFiltersOpen}
            />
          </div>

          {/* Products Section */}
          <div className="lg:w-3/4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <p className="font-inter text-gray-600">
                  Showing <span className="font-semibold text-black">{filteredProducts.length}</span>
                  {filteredProducts.length === 1 ? " product" : " products"}
                  {selectedCategory !== "all" && ` in ${selectedCategory}`}
                  {sortBy === "newest" && " (Newest First)"}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Mobile Filter Button */}
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter size={16} />
                  Filters
                </button>

                {/* View Toggle */}
                <div className="flex items-center border border-gray-300 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded transition-colors ${viewMode === "grid" ? "bg-gray-100 text-black" : "text-gray-600 hover:bg-gray-50"}`}
                    aria-label="Grid view"
                  >
                    <Grid3x3 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded transition-colors ${viewMode === "list" ? "bg-gray-100 text-black" : "text-gray-600 hover:bg-gray-50"}`}
                    aria-label="List view"
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
                <p className="text-gray-600">Loading products...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-20">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-black text-white rounded-full hover:opacity-90 transition-opacity"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* No Products State */}
            {!loading && !error && filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-600 mb-4">
                  {selectedCategory !== "all"
                    ? `No ${selectedCategory} found. Try a different category or clear filters.`
                    : "No products found matching your filters."
                  }
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 border border-black rounded-full hover:bg-black hover:text-white transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Products Grid */}
            {!loading && !error && filteredProducts.length > 0 && (
              <div className={viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-6"
              }>
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}

            {/* Pagination Placeholder */}
            {filteredProducts.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex justify-center items-center gap-2">
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-600">Page 1 of 1</span>
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Trust Signals Section */}
      <div className="section-pad border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <h3 className="font-space text-2xl font-bold text-center mb-8">
            Why Shop With NYNTH
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">✓</div>
              <p className="font-inter font-medium">Premium Quality</p>
              <p className="text-sm text-gray-600">Heavyweight materials</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">🚚</div>
              <p className="font-inter font-medium">Fast Shipping</p>
              <p className="text-sm text-gray-600">2-4 business days</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">↩️</div>
              <p className="font-inter font-medium">Easy Returns</p>
              <p className="text-sm text-gray-600">30-day policy</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">🛡️</div>
              <p className="font-inter font-medium">Secure Payment</p>
              <p className="text-sm text-gray-600">SSL encrypted</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}