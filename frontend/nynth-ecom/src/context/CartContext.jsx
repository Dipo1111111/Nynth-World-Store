import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { trackConversion } from "../utils/monitoring";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    // Load from localStorage on initial render
    try {
      const savedCart = localStorage.getItem("nynth_cart");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Failed to parse cart from localStorage:", error);
      return [];
    }
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("nynth_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Clear cart
  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem("nynth_cart");
  }, []);

  // Add item to cart
  const addToCart = useCallback((product, quantity = 1, selectedSize = null, selectedColor = null) => {
    setCartItems((prevItems) => {
      const size = selectedSize || product.selectedSize || product.size || "M";
      const color = selectedColor || product.selectedColor || product.color || "Black";
      
      const existingItemIndex = prevItems.findIndex(
        (item) =>
          item.id === product.id &&
          item.size === size &&
          item.color === color
      );

      // Track the conversion
      trackConversion("add_to_cart", {
        product_id: product.id,
        title: product.title || product.name,
        price: product.price,
        quantity
      });

      // Auto-open cart sidebar
      setIsCartOpen(true);

      if (existingItemIndex >= 0) {
        const updatedCart = [...prevItems];
        updatedCart[existingItemIndex].quantity += quantity;
        return updatedCart;
      } else {
        return [
          ...prevItems,
          {
            id: product.id,
            name: product.title || product.name,
            price: product.price,
            quantity,
            size: size,
            color: color,
            image: product.image || (product.images && product.images[0]) || product.imageUrl || product.thumbnail || "/placeholder.jpg",
          },
        ];
      }
    });
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((itemToRemove) => {
    setCartItems((prevItems) =>
      prevItems.filter(
        (item) =>
          !(
            item.id === itemToRemove.id &&
            item.size === itemToRemove.size &&
            item.color === itemToRemove.color
          )
      )
    );
  }, []);

  // Update quantity
  const updateQuantity = useCallback((itemToUpdate, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemToUpdate);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemToUpdate.id &&
          item.size === itemToUpdate.size &&
          item.color === itemToUpdate.color
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  }, [removeFromCart]);

  // Update item options (size/color)
  const updateItemOptions = useCallback((itemToUpdate, newSize, newColor, newImage) => {
    setCartItems((prevItems) => {
      // Find the item being modified
      const itemIndex = prevItems.findIndex(
        (item) =>
          item.id === itemToUpdate.id &&
          item.size === itemToUpdate.size &&
          item.color === itemToUpdate.color
      );

      if (itemIndex === -1) return prevItems;

      const updatedCart = [...prevItems];
      const targetItem = updatedCart[itemIndex];

      // Check if another item with the new options already exists
      const existingItemIndex = prevItems.findIndex(
        (item, idx) =>
          idx !== itemIndex &&
          item.id === itemToUpdate.id &&
          item.size === newSize &&
          item.color === newColor
      );

      if (existingItemIndex >= 0) {
        // Merge with existing item
        updatedCart[existingItemIndex].quantity += targetItem.quantity;
        // Remove the old item
        updatedCart.splice(itemIndex, 1);
      } else {
        // Update the item
        updatedCart[itemIndex] = {
          ...targetItem,
          size: newSize,
          color: newColor,
          image: newImage || targetItem.image
        };
      }

      return updatedCart;
    });
  }, []);

  // Calculate total
  const totalAmount = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // Calculate total items count
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemOptions,
        isCartOpen,
        setIsCartOpen,
        clearCart,
        totalAmount,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};