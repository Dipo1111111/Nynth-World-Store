import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchSingleProduct } from "../firebase/functions"; // adjust path if needed
import { useCart } from "../context/CartContext"; // your cart context

export default function Product() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadProduct() {
      const data = await fetchSingleProduct(id);
      if (data) {
        setProduct(data);
        setSelectedColor(data.colors?.[0] || ""); // default first color
        setSelectedSize(data.sizes?.[0] || "");   // default first size
      }
    }

    loadProduct();
  }, [id]);

  if (!product) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-black text-lg">Loading product...</p>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      color: selectedColor,
      size: selectedSize,
      quantity,
    });
    alert("Added to cart!");
  };

  return (
    <div className="w-full min-h-screen bg-white px-5 md:px-12 py-10">
      <div className="flex flex-col md:flex-row gap-10">
        {/* Product Image */}
        <div className="w-full md:w-1/2">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-[500px] object-cover rounded-xl"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 flex flex-col gap-5">
          <h1 className="text-3xl font-bold text-black">{product.name}</h1>
          <p className="text-black opacity-70 text-xl">₦{product.price.toLocaleString()}</p>

          {/* Color Selection */}
          {product.colors && (
            <div>
              <p className="text-black font-medium mb-2">Color:</p>
              <div className="flex gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedColor === color ? "border-black" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {product.sizes && (
            <div>
              <p className="text-black font-medium mb-2">Size:</p>
              <div className="flex gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    className={`px-3 py-1 border-2 rounded ${
                      selectedSize === size ? "border-black" : "border-gray-300"
                    }`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center gap-3 mt-3">
            <button
              className="px-3 py-1 border rounded"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              -
            </button>
            <span className="text-black">{quantity}</span>
            <button
              className="px-3 py-1 border rounded"
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </button>
          </div>

          {/* Add to Cart */}
          <button
            className="mt-5 bg-black text-white rounded-full px-6 py-3 w-max hover:opacity-90 transition"
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
