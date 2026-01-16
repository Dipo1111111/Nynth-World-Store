// src/pages/ProductDetail.jsx - COMPLETE VERSION
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { fetchSingleProduct } from "../api/firebaseFunctions";
import {
  ShoppingBag,
  Heart,
  ArrowLeft,
  Minus,
  Plus,
  Truck,
  Shield,
  RefreshCw,
  Check,
  ChevronRight
} from "lucide-react";
import { useCart } from "../context/CartContext";
import SEO from "../components/SEO";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Product selection states
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showCartNotification, setShowCartNotification] = useState(false);

  // Load product from Firebase
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchSingleProduct(id);

        if (!data) {
          setError("Product not found");
          return;
        }

        setProduct(data);

        // Set default selections
        if (data.availableColors?.length > 0) {
          setSelectedColor(data.availableColors[0]);
        }
        if (data.availableSizes?.length > 0) {
          setSelectedSize(data.availableSizes[0]);
        }

      } catch (error) {
        console.error("Error loading product:", error);
        setError("Failed to load product. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (id) loadProduct();
  }, [id]);

  // Handle color selection - changes main image
  const handleColorSelect = (color) => {
    setSelectedColor(color);

    // Find image index for this color (assumes images are in same order as colors)
    const colorIndex = product.availableColors?.indexOf(color) || 0;
    if (colorIndex < product.images?.length) {
      setSelectedImage(colorIndex);
    }
  };

  // Handle add to cart with slide-in notification
  const handleAddToCart = async () => {
    if (!product || !product.inStock) return;

    try {
      setAddingToCart(true);

      // Add to cart
      await addToCart(product, quantity, selectedSize, selectedColor);

      // Show success notification
      setShowCartNotification(true);

      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowCartNotification(false);
      }, 3000);

    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add item to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  // Handle wishlist
  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    // You would typically save this to Firebase/user profile
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="section-pad">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            <p className="mt-4 text-gray-600">Loading product details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="section-pad">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <h2 className="text-2xl font-bold mb-4 text-black">Product Not Found</h2>
            <p className="text-gray-600 mb-6">{error || "The product you're looking for doesn't exist."}</p>
            <Link
              to="/shop"
              className="flex items-center gap-2 text-black hover:underline font-medium"
            >
              <ArrowLeft size={16} />
              Back to Shop
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <SEO
        title={`${product.title} | NYNTH`}
        description={product.description || `Shop ${product.title} at NYNTH. Premium streetwear with craftsmanship.`}
        image={product.images?.[0] || product.imageUrl}
        type="product"
        url={`/product/${product.id}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.title,
          "description": product.description,
          "image": product.images || [product.imageUrl],
          "brand": {
            "@type": "Brand",
            "name": "NYNTH"
          },
          "offers": {
            "@type": "Offer",
            "url": `${import.meta.env.VITE_SITE_URL || 'http://localhost:5173'}/product/${product.id}`,
            "priceCurrency": "NGN",
            "price": product.price,
            "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition"
          },
          "category": product.category
        }}
      />
      <Header />

      {/* Cart Success Notification - Slides in from right */}
      {showCartNotification && (
        <div className="fixed top-20 right-6 z-[9999] bg-black text-white px-6 py-4 rounded-lg shadow-xl animate-slideInRight">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 rounded-full p-1">
              <Check size={16} />
            </div>
            <div>
              <p className="font-medium">Added to cart!</p>
              <p className="text-sm text-gray-300">{product.title}</p>
            </div>
            <Link
              to="/cart"
              className="ml-4 text-sm font-medium hover:text-gray-300 underline"
            >
              View Cart
            </Link>
          </div>
        </div>
      )}

      <main className="px-6 md:px-10 lg:px-20 py-6 md:py-10">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-black transition-colors">Home</Link>
            <ChevronRight size={14} />
            <Link to="/shop" className="hover:text-black transition-colors">Shop</Link>
            <ChevronRight size={14} />
            <Link to={`/shop?category=${product.category}`} className="hover:text-black transition-colors capitalize">
              {product.category}
            </Link>
            <ChevronRight size={14} />
            <span className="text-black font-medium truncate max-w-[200px]">{product.title}</span>
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Product Images Section */}
          <div>
            {/* Main Image */}
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4">
              <img
                src={product.images?.[selectedImage] || product.thumbnail || "/placeholder.jpg"}
                alt={product.title}
                className="w-full h-full object-cover"
              />

              {/* Out of Stock Badge */}
              {!product.inStock && (
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                  Out of Stock
                </div>
              )}

              {/* Wishlist Button */}
              <button
                onClick={handleWishlist}
                className="absolute top-4 right-4 bg-white rounded-full p-3 shadow-lg hover:scale-105 transition-transform"
              >
                <Heart
                  size={20}
                  className={isWishlisted ? "fill-red-500 text-red-500" : "text-gray-700"}
                />
              </button>
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index
                      ? "border-black scale-105"
                      : "border-gray-200 hover:border-gray-400"
                      }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} - View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div>
            {/* Category & Status */}
            <div className="mb-4">
              <span className="font-inter text-sm font-medium text-gray-600 uppercase tracking-wider">
                {product.category}
              </span>
              {product.newArrival && (
                <span className="ml-3 px-3 py-1 bg-black text-white text-xs rounded-full">
                  NEW ARRIVAL
                </span>
              )}
              {product.bestSeller && (
                <span className="ml-2 px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                  BEST SELLER
                </span>
              )}
            </div>

            {/* Product Title */}
            <h1 className="font-space text-3xl md:text-4xl font-bold mb-4">
              {product.title}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-4 mb-6">
              <p className="text-2xl md:text-3xl font-bold">₦{product.price?.toLocaleString()}</p>
              {product.stockQuantity && product.stockQuantity < 10 && product.inStock && (
                <span className="px-3 py-1 bg-red-50 text-red-700 text-sm rounded-full">
                  Only {product.stockQuantity} left
                </span>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="font-inter font-semibold mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Color Selector */}
            {product.availableColors && product.availableColors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-inter font-semibold mb-3">
                  Color: <span className="font-normal text-gray-700">{selectedColor}</span>
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.availableColors.map((color) => {
                    const isSelected = color === selectedColor;
                    return (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        className={`flex flex-col items-center gap-2 ${isSelected ? "opacity-100" : "opacity-80 hover:opacity-100"
                          }`}
                      >
                        <div className={`w-10 h-10 rounded-full border-2 ${isSelected ? "border-black" : "border-gray-300"
                          }`}>
                          <div
                            className="w-full h-full rounded-full"
                            style={{
                              backgroundColor: color.toLowerCase(),
                              backgroundImage: color.toLowerCase() === 'white' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 'none'
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{color}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {product.availableSizes && product.availableSizes.length > 0 && (
              <div className="mb-6">
                <h3 className="font-inter font-semibold mb-3">Select Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-5 py-3 border rounded-lg transition-all ${selectedSize === size
                        ? "bg-black text-white border-black"
                        : "border-gray-300 hover:border-black hover:bg-gray-50"
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Quantity Selector */}
                <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="px-4 py-3 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-6 py-3 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-3 hover:bg-gray-100"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock || addingToCart}
                  className="flex-1 bg-black text-white py-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium transition-all hover:scale-[1.02]"
                >
                  {addingToCart ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={20} />
                      {product.inStock ? "Add to Cart" : "Out of Stock"}
                    </>
                  )}
                </button>
              </div>

              {!product.inStock && (
                <p className="text-red-600 font-medium">
                  This product is currently out of stock. Check back soon!
                </p>
              )}
            </div>

            {/* Trust Signals */}
            <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-xl">
              <div className="text-center">
                <Truck size={20} className="mx-auto mb-2 text-gray-700" />
                <p className="text-xs text-gray-600">Free Shipping</p>
              </div>
              <div className="text-center">
                <Check size={20} className="mx-auto mb-2 text-gray-700" />
                <p className="text-xs text-gray-600">Authenticity Guaranteed</p>
              </div>
              <div className="text-center">
                <RefreshCw size={20} className="mx-auto mb-2 text-gray-700" />
                <p className="text-xs text-gray-600">Easy Returns</p>
              </div>
            </div>

            {/* Product Details Accordion */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-inter font-semibold text-lg mb-4">Product Details</h3>

              <div className="space-y-4">
                {product.material && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Material</h4>
                    <p className="text-gray-600">{product.material}</p>
                  </div>
                )}

                {product.tags && product.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Availability</h4>
                  <p className={`font-medium ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                    {product.stockQuantity && product.inStock && ` • ${product.stockQuantity} units available`}
                  </p>
                </div>
              </div>

              {/* Care Instructions (if available) */}
              {product.careInstructions && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Care Instructions</h4>
                  <p className="text-gray-600">{product.careInstructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Add slide-in animation to CSS */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}