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

      <main className="px-4 md:px-10 lg:px-20 py-6 md:py-10">
        {/* Simplified Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="font-space text-3xl md:text-5xl font-bold tracking-tight mb-6 md:mb-8">
            {selectedCategory === "all" ? "Shop Collection" : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
          </h1>

          {/* Category Quick Filters (Matching Hunter Style) */}
          <div className="flex gap-2.5 mb-8 md:mb-10 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`
                  px-6 md:px-8 py-3 md:py-3.5 rounded-xl text-sm font-medium border transition-all whitespace-nowrap
                  ${selectedCategory === cat.value
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-gray-200 hover:border-black"}
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shop Content */}
        <div className="flex flex-col gap-8">
          {/* Products Section */}
          <div className="w-full">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <p className="font-inter text-[13px] md:text-base text-gray-500">
                Showing <span className="font-semibold text-black">{filteredProducts.length}</span>
                {filteredProducts.length === 1 ? " product" : " products"}
              </p>

              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 md:px-4 py-2 border border-gray-200 rounded-lg text-xs md:text-sm bg-white focus:outline-none focus:border-black"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
                <p className="text-gray-600">Loading products...</p>
              </div>
            )}

            {/* Products Grid - 2x2 on Mobile */}
            {!loading && !error && filteredProducts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            )}

            {/* No Products State */}
            {!loading && !error && filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-gray-600 mb-4">No products found matching your filters.</p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 border border-black rounded-full hover:bg-black hover:text-white transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}