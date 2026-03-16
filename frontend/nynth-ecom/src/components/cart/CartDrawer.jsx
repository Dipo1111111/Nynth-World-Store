// src/components/cart/CartDrawer.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useSettings } from "../../context/SettingsContext";
import { fetchSingleProduct } from "../../api/firebaseFunctions";

const CartItem = ({ item, settings, onClose }) => {
    const { removeFromCart, updateQuantity, updateItemOptions } = useCart();
    const [availableSizes, setAvailableSizes] = useState([]);
    const [availableColors, setAvailableColors] = useState([]);
    const [productImages, setProductImages] = useState([]);

    useEffect(() => {
        const loadProductData = async () => {
            const product = await fetchSingleProduct(item.id);
            if (product) {
                setAvailableSizes(product.availableSizes || []);
                setAvailableColors(product.availableColors || []);
                setProductImages(product.images || []);
            }
        };
        loadProductData();
    }, [item.id]);

    const handleOptionChange = (newSize, newColor) => {
        // Find if there's a corresponding image for the new color
        let newImage = item.image;
        if (newColor && newColor !== item.color) {
            const colorIndex = availableColors.indexOf(newColor);
            if (colorIndex !== -1 && productImages[colorIndex]) {
                newImage = productImages[colorIndex];
            }
        }
        updateItemOptions(item, newSize || item.size, newColor || item.color, newImage);
    };

    return (
        <div className="flex items-start gap-4 py-6 border-b border-gray-100 last:border-0">
            {/* Product Image */}
            <Link
                to={`/product/${item.id}`}
                onClick={onClose}
                className="w-20 h-24 bg-white border border-gray-100 overflow-hidden flex-shrink-0"
            >
                <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-contain"
                />
            </Link>

            {/* Product Details */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex justify-between items-start gap-2 mb-1">
                    <Link
                        to={`/product/${item.id}`}
                        onClick={onClose}
                        className="text-[10px] tracking-[0.1em] font-bold uppercase text-black block truncate"
                    >
                        {item.name}
                    </Link>
                    <button
                        onClick={() => removeFromCart(item)}
                        className="text-gray-400 hover:text-black transition-colors flex-shrink-0"
                        aria-label="Remove item"
                    >
                        <Trash2 size={12} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold tracking-widest text-black mb-3">
                    <span>{settings?.currency_symbol || "₦"}{item.price.toLocaleString()}</span>
                </div>

                {/* Color Selection */}
                {availableColors.length > 0 && (
                    <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                            {availableColors.map((color, idx) => (
                                <button
                                    key={color}
                                    onClick={() => handleOptionChange(null, color)}
                                    className={`w-6 h-7 bg-white flex items-center justify-center border transition-all ${item.color === color ? "border-black" : "border-gray-100 opacity-60 hover:opacity-100"}`}
                                    title={color}
                                >
                                    {productImages[idx] ? (
                                        <img src={productImages[idx]} alt={color} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-3 h-3 border border-black/10" style={{ backgroundColor: color.toLowerCase() }} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Size Selection */}
                {availableSizes.length > 0 && (
                    <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                            {availableSizes.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => handleOptionChange(size, null)}
                                    className={`px-2 py-1 text-[8px] font-bold tracking-widest border transition-all ${item.size === size ? "bg-black text-white border-black" : "bg-white text-black border-gray-200 hover:border-black"}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4 bg-gray-50 px-3 py-1.5 rounded-sm">
                        <button
                            onClick={() => updateQuantity(item, Math.max(1, item.quantity - 1))}
                            className="text-black hover:opacity-50 disabled:opacity-20"
                            disabled={item.quantity <= 1}
                        >
                            <Minus size={10} strokeWidth={2.5} />
                        </button>
                        <span className="text-[10px] font-bold w-4 text-center">{item.quantity}</span>
                        <button
                            onClick={() => updateQuantity(item, item.quantity + 1)}
                            className="text-black hover:opacity-50"
                        >
                            <Plus size={10} strokeWidth={2.5} />
                        </button>
                    </div>

                    <p className="text-[10px] font-bold tracking-widest text-black">
                        {settings?.currency_symbol || "₦"}{(item.price * item.quantity).toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default function CartDrawer({ isOpen, onClose }) {
    const { cartItems } = useCart();
    const { settings } = useSettings();
    const navigate = useNavigate();

    const subtotal = cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
    );

    const handleCheckout = () => {
        if (cartItems.length === 0) return;
        onClose();
        navigate("/checkout");
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 z-[9998] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-[9999] flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-6 border-b border-gray-100">
                    <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase">
                        YOUR CART ({cartItems.length})
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:opacity-60 transition-opacity"
                        aria-label="Close cart"
                    >
                        <X size={20} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {cartItems.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-32 px-6 text-center">
                            <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-8 font-bold">Your cart is empty</p>
                            <button
                                onClick={() => { onClose(); navigate("/shop"); }}
                                className="bg-black text-white px-12 py-4 text-[10px] tracking-[0.3em] uppercase font-bold hover:bg-gray-900 transition-colors"
                            >
                                START SHOPPING
                            </button>
                        </div>
                    ) : (
                        <div className="px-6">
                            {cartItems.map((item) => (
                                <CartItem
                                    key={`${item.id}-${item.color}-${item.size}`}
                                    item={item}
                                    settings={settings}
                                    onClose={onClose}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer (sticky at bottom) */}
                {cartItems.length > 0 && (
                    <div className="border-t border-gray-100 px-6 py-8 bg-white">
                        <div className="flex justify-between font-bold text-[12px] tracking-[0.25em] uppercase mb-6 text-black">
                            <span>SUBTOTAL</span>
                            <span>
                                {settings?.currency_symbol || "₦"}{subtotal.toLocaleString()}
                            </span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="w-full bg-black text-white py-5 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-gray-900 transition-colors shadow-sm"
                        >
                            SECURE CHECKOUT
                        </button>
                        
                        <button
                            onClick={onClose}
                            className="w-full mt-4 text-[9px] font-bold tracking-[0.25em] uppercase text-gray-500 hover:text-black transition-colors"
                        >
                            CONTINUE SHOPPING
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
