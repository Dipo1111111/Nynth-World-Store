// src/components/cart/CartDrawer.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useSettings } from "../../context/SettingsContext";

export default function CartDrawer({ isOpen, onClose }) {
    const { cartItems, removeFromCart, updateQuantity } = useCart();
    const { settings } = useSettings();
    const navigate = useNavigate();

    const subtotal = cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
    );
    const total = subtotal;

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
                <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100">
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
                    {/* Free Shipping Progress */}
                    <div className="px-6 py-4 bg-gray-50">
                        <div className="text-[9px] tracking-widest font-bold uppercase mb-2">
                            You have unlocked free shipping!
                        </div>
                        <div className="w-full h-[2px] bg-gray-200">
                            <div className="h-full bg-black w-full"></div>
                        </div>
                    </div>

                    {cartItems.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
                            <p className="text-[11px] tracking-widest uppercase text-gray-400 mb-6">Your cart is empty</p>
                            <button
                                onClick={() => { onClose(); navigate("/shop"); }}
                                className="bg-black text-white px-8 py-3 text-[10px] tracking-widest uppercase font-bold hover:bg-gray-900 transition-colors"
                            >
                                SHOP NOW
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Cart Items */}
                            <div className="px-6 py-4">
                                {cartItems.map((item) => (
                                    <div
                                        key={`${item.id}-${item.color}-${item.size}`}
                                        className="flex items-start gap-4 py-4 border-b border-gray-100 last:border-0"
                                    >
                                        {/* Product Image */}
                                        <Link
                                            to={`/product/${item.id}`}
                                            onClick={onClose}
                                            className="w-16 h-20 bg-white overflow-hidden flex-shrink-0"
                                        >
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-contain"
                                            />
                                        </Link>

                                        {/* Product Details */}
                                        <div className="flex-1 flex flex-col min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="min-w-0">
                                                    <Link
                                                        to={`/product/${item.id}`}
                                                        onClick={onClose}
                                                        className="text-[10px] tracking-[0.1em] font-bold uppercase text-black block truncate"
                                                    >
                                                        {item.name}
                                                    </Link>
                                                    <p className="text-[9px] tracking-wider text-gray-400 uppercase mt-0.5">
                                                        SIZE: {item.size}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center mt-3">
                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-3 text-black text-[10px]">
                                                    <button
                                                        onClick={() => updateQuantity(item, Math.max(1, item.quantity - 1))}
                                                        className="hover:opacity-50 disabled:opacity-20"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus size={10} strokeWidth={2} />
                                                    </button>
                                                    <span className="font-bold min-w-[12px] text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item, item.quantity + 1)}
                                                        className="hover:opacity-50"
                                                    >
                                                        <Plus size={10} strokeWidth={2} />
                                                    </button>
                                                    <button
                                                        onClick={() => removeFromCart(item)}
                                                        className="ml-2 text-gray-400 hover:text-black transition-colors"
                                                        aria-label="Remove item"
                                                    >
                                                        <Trash2 size={11} strokeWidth={1.5} />
                                                    </button>
                                                </div>

                                                <p className="text-[10px] font-bold tracking-widest text-black">
                                                    {settings?.currency_symbol || "₦"}{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Cross-sell Section */}
                            <div className="px-6 py-4 border-t border-gray-100">
                                <h3 className="text-[9px] font-bold tracking-[0.2em] uppercase mb-4 text-black">YOU MIGHT ALSO LIKE</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="group cursor-pointer">
                                            <div className="aspect-[4/5] bg-white relative overflow-hidden mb-2">
                                                <div className="w-[70%] h-[70%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-200 animate-pulse"></div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[8px] font-bold tracking-widest">
                                                    {settings?.currency_symbol || "₦"}0.00
                                                </span>
                                                <Plus size={10} className="text-gray-400 group-hover:text-black transition-colors" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer (sticky at bottom) */}
                {cartItems.length > 0 && (
                    <div className="border-t border-gray-100 px-6 py-4 bg-white">
                        <Link
                            to="#"
                            className="flex justify-between items-center text-[9px] tracking-[0.2em] font-bold uppercase text-black mb-4 hover:opacity-70"
                        >
                            <span>SHIPPING & RETURNS</span>
                            <ArrowRight size={10} />
                        </Link>

                        <div className="flex justify-between font-bold text-[11px] tracking-[0.2em] uppercase mb-4 text-black">
                            <span>TOTAL</span>
                            <span>
                                {settings?.currency_symbol || "₦"}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGN
                            </span>
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="w-full bg-black text-white py-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-gray-900 transition-colors"
                        >
                            SAFE CHECK OUT
                        </button>

                        <div className="mt-3 flex justify-center gap-2 opacity-40">
                            <span className="text-[8px] tracking-wider">💳</span>
                            <span className="text-[8px] tracking-wider">Apple Pay</span>
                            <span className="text-[8px] tracking-wider">G Pay</span>
                            <span className="text-[8px] tracking-wider">Visa</span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
