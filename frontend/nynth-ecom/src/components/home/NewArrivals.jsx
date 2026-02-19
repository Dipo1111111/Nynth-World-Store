import React, { useEffect, useState } from "react";
import { fetchProducts } from "../../api/firebaseFunctions";
import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";
import { useCart } from "../../context/CartContext";
import toast from "react-hot-toast";

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const image = (product.images && product.images[0]) || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1000";

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Add with default size and color
    const defaultSize = product.sizes?.[0] || "M";
    const defaultColor = product.colors?.[0] || "Black";

    addToCart(product, 1, defaultSize, defaultColor);

    toast.success(`${product.title} added to cart!`);
  };

  return (
    <div className="group">
      <Link to={`/product/${product.id}`}>
        <div className="aspect-square overflow-hidden rounded-xl bg-gray-100 mb-4 relative">
          <img
            src={image}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="bg-white rounded-full p-2 shadow-md hover:bg-gray-50">
              <Star size={18} className="text-gray-700" />
            </button>
          </div>
        </div>
      </Link>
      <div>
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-inter font-semibold text-lg">{product.title}</h3>
          <span className="font-inter font-bold">₦{product.price?.toLocaleString()}</span>
        </div>
        <p className="text-gray-600 text-sm mb-2">{product.category || "Apparel"}</p>
        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
          ))}
          <span className="text-xs text-gray-500 ml-1">(4.8)</span>
        </div>
        <button
          onClick={handleAddToCart}
          className="w-full py-2 text-sm font-medium border border-black rounded-lg hover:bg-black hover:text-white transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export default function NewArrivals() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let mounted = true;
    fetchProducts()
      .then((data) => {
        if (!mounted) return;
        const sorted = data.sort((a, b) => {
          const ta = a.created_at?.seconds ? a.created_at.seconds : 0;
          const tb = b.created_at?.seconds ? b.created_at.seconds : 0;
          return tb - ta;
        });
        setProducts(sorted.slice(0, 8));
      })
      .catch((error) => {
        console.error("Failed to load new arrivals:", error);
        if (mounted) setProducts([]);
      });
    return () => (mounted = false);
  }, []);

  return (
    <section id="new-arrivals" className="section-pad bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <h2 className="font-space text-4xl md:text-5xl font-bold tracking-tight">
              New arrivals
            </h2>
          </div>
          <Link
            to="/shop?new=true"
            className="font-inter text-sm font-medium flex items-center gap-2 mt-4 md:mt-0 hover:gap-3 transition-all"
          >
            View all products <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {products.length ? (
            products.map((p) => <ProductCard key={p.id} product={p} />)
          ) : (
            [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}