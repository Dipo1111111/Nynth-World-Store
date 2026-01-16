// components/shop/FiltersSidebar.jsx
import React, { useState } from "react";
import { Filter, X } from "lucide-react";

const FiltersSidebar = ({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceChange,
  sortBy,
  onSortChange,
  onClearFilters,
  isMobileFiltersOpen,
  setIsMobileFiltersOpen
}) => {
  const sortOptions = [
    { value: "newest", label: "Newest" },
    { value: "price-low-high", label: "Price: Low to High" },
    { value: "price-high-low", label: "Price: High to Low" },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 space-y-8 pr-8">
        <div>
          <h3 className="font-inter font-semibold text-lg mb-4">Categories</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => onCategoryChange(category.value)}
                className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory === category.value
                  ? "bg-black text-white"
                  : "hover:bg-gray-100 text-gray-700"
                  }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-inter font-semibold text-lg mb-4">Price Range</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>₦{priceRange.min.toLocaleString()}</span>
              <span>₦{priceRange.max.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100000"
              value={priceRange.max}
              onChange={(e) => onPriceChange({ ...priceRange, max: parseInt(e.target.value) })}
              className="w-full h-1 bg-gray-300 rounded-lg appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black"
            />
          </div>
        </div>

        <div>
          <h3 className="font-inter font-semibold text-lg mb-4">Sort By</h3>
          <div className="space-y-2">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${sortBy === option.value
                  ? "bg-gray-100 text-black font-medium"
                  : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClearFilters}
          className="w-full py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear All Filters
        </button>
      </aside>

      {/* Mobile Filters Modal */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn"
            onClick={() => setIsMobileFiltersOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white p-6 shadow-2xl flex flex-col animate-slideRight">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-space text-xl font-bold">Filters</h2>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close filters"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-inter font-semibold mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      onClick={() => {
                        onCategoryChange(category.value);
                        setIsMobileFiltersOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-2 rounded-lg ${selectedCategory === category.value
                        ? "bg-black text-white"
                        : "hover:bg-gray-100"
                        }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-inter font-semibold mb-3">Price Range</h3>
                <input
                  type="range"
                  min="0"
                  max="100000"
                  value={priceRange.max}
                  onChange={(e) => onPriceChange({ ...priceRange, max: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>₦{priceRange.min.toLocaleString()}</span>
                  <span>₦{priceRange.max.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h3 className="font-inter font-semibold mb-3">Sort By</h3>
                <div className="space-y-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onSortChange(option.value);
                        setIsMobileFiltersOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-2 rounded-lg ${sortBy === option.value
                        ? "bg-gray-100 text-black font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  onClearFilters();
                  setIsMobileFiltersOpen(false);
                }}
                className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FiltersSidebar;