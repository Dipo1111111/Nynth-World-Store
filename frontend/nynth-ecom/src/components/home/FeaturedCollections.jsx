// src/components/home/FeaturedCollections.jsx - FETCHES FROM DB + ORIGINAL DESIGN
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { fetchFeaturedProducts } from "../../api/firebaseFunctions";

const CollectionCard = ({ product, category }) => {
  // Determine image based on category
  const getCategoryImage = () => {
    if (product?.images?.[0]) return product.images[0];

    // Fallback images by category
    const fallbackImages = {
      hoodies: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000",
      tees: "https://images.unsplash.com/photo-1574180045827-681f8a1a9622?q=80&w=1000",
      headwear: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1000"
    };
    return fallbackImages[category] || fallbackImages.hoodies;
  };

  const getCategoryTitle = () => {
    const titles = {
      hoodies: "Signature Hoodies",
      tees: "Essential Tees",
      headwear: "Headwear"
    };
    return titles[category] || category;
  };

  const getCategorySubtitle = () => {
    return "Shop collection";
  };

  return (
    <Link
      to={`/shop?category=${category}`}
      className="group relative overflow-hidden rounded-2xl bg-gray-100 aspect-square"
    >
      <img
        src={getCategoryImage()}
        alt={getCategoryTitle()}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="font-space text-2xl font-bold mb-1">{getCategoryTitle()}</h3>
        <p className="font-inter text-sm opacity-90">{getCategorySubtitle()}</p>
      </div>
    </Link>
  );
};

export default function FeaturedCollections() {
  const [productsByCategory, setProductsByCategory] = useState({
    hoodies: [],
    tees: [],
    headwear: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const products = await fetchFeaturedProducts();

        // Group by category
        const grouped = {
          hoodies: products.filter(p => p.category === "hoodies"),
          tees: products.filter(p => p.category === "tees"),
          headwear: products.filter(p => p.category === "headwear")
        };

        setProductsByCategory(grouped);
      } catch (error) {
        console.error("Error loading featured products:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <section className="section-pad bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <span className="font-inter text-sm font-medium text-gray-600 uppercase tracking-wider mb-2 block">
              Curated Collections
            </span>
            <h2 className="font-space text-4xl md:text-5xl font-bold tracking-tight">
              Shop by style
            </h2>
          </div>
          <Link
            to="/shop"
            className="font-inter text-sm font-medium flex items-center gap-2 mt-4 md:mt-0 hover:gap-3 transition-all"
          >
            View all collections <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CollectionCard
              category="hoodies"
              product={productsByCategory.hoodies[0]}
            />
            <CollectionCard
              category="tees"
              product={productsByCategory.tees[0]}
            />
            <CollectionCard
              category="headwear"
              product={productsByCategory.headwear[0]}
            />
          </div>
        )}
      </div>
    </section>
  );
}