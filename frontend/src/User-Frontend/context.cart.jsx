/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: "" });

  // Load cart and loyalty points from localStorage when user changes
  useEffect(() => {
    if (user && user._id) {
      const savedCart = localStorage.getItem(`cart_${user._id}`);
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (e) {
          console.error("Failed to parse saved cart:", e);
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }

      const savedPoints = localStorage.getItem(`loyalty_${user._id}`);
      if (savedPoints) {
        try {
          setLoyaltyPoints(parseInt(savedPoints, 10) || 0);
        } catch (e) {
          console.error("Failed to parse saved loyalty points:", e);
          setLoyaltyPoints(0);
        }
      } else {
        setLoyaltyPoints(0);
      }
    } else {
      setCartItems([]);
      setLoyaltyPoints(0);
    }
  }, [user]);

  // Save cart to localStorage whenever cartItems change
  useEffect(() => {
    if (user && user._id) {
      localStorage.setItem(`cart_${user._id}`, JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  // Save loyalty points to localStorage whenever loyaltyPoints change
  useEffect(() => {
    if (user && user._id) {
      localStorage.setItem(`loyalty_${user._id}`, loyaltyPoints.toString());
    }
  }, [loyaltyPoints, user]);

  const showToast = (message, ms = 1800) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: "" }), ms);
  };

  // Add item to cart
  const addToCart = (dish, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.name === dish.name && item.category === dish.category
      );
      if (existing) {
        return prev.map((item) =>
          item.name === dish.name && item.category === dish.category
            ? { ...item, quantity: existing.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...dish, quantity }];
    });
    // show a small confirmation when item added
    showToast(`${dish.name} added to cart`);
  };

  // Remove item from cart
  const removeFromCart = (name, category) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.name === name && item.category === category))
    );
  };

  // Update quantity
  const updateQuantity = (name, category, quantity) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.name === name && item.category === category
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Empty cart
  const emptyCart = () => setCartItems([]);

  // Loyalty points logic
  const addLoyaltyPoints = (amount) => {
    // 5 points for every $10 spent
    setLoyaltyPoints((prev) => prev + Math.floor(amount / 10) * 5);
  };

  const useLoyaltyDiscount = () => {
    if (loyaltyPoints >= 100) {
      setLoyaltyPoints((prev) => prev - 100);
      return 1; // $1 discount
    }
    return 0;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        emptyCart,
        loyaltyPoints,
        addLoyaltyPoints,
        useLoyaltyDiscount,
        setLoyaltyPoints,
        toast,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
