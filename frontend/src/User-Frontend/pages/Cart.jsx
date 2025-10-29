import React from "react";
import { useNavigate } from "react-router-dom";
import { FaTrashAlt, FaGift, FaStar, FaRegStar } from "react-icons/fa";
import { useCart } from "../context.cart.jsx";
import { orderAPI, profileAPI } from "../../services/api";
import { useEffect } from "react";

const DarkCard = ({ children, className = "" }) => (
  <div
    className={`bg-[#3a2618] text-white rounded-lg p-4 sm:p-6 shadow-md ${className}`}
  >
    {children}
  </div>
);

export default function Cart() {
  const navigate = useNavigate();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    emptyCart,
    loyaltyPoints,
    setLoyaltyPoints,
  } = useCart();

  // Refresh loyalty points for the currently authenticated user on mount
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const profile = await profileAPI.getProfile();
        if (profile && typeof profile.loyaltyPoints !== "undefined") {
          setLoyaltyPoints(profile.loyaltyPoints || 0);
        }
      } catch (err) {
        console.debug(
          "Cart: failed to refresh loyalty points",
          err?.message || err
        );
      }
    })();
  }, [setLoyaltyPoints]);

  const incrementQuantity = (item) => {
    updateQuantity(item.name, item.category, item.quantity + 1);
  };
  const decrementQuantity = (item) => {
    if (item.quantity > 1) {
      updateQuantity(item.name, item.category, item.quantity - 1);
    }
  };

  const continueShopping = () => {
    navigate("/user/menu");
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0;
  const deliveryFee = 0;
  const total = subtotal + tax + deliveryFee;
  const pointsToEarn = Math.floor(subtotal);

  // Navigate to checkout page
  const proceedToCheckout = () => {
    navigate("/user/checkout");
  };

  // Place order directly (quick order) - requires authenticated user
  const _placeOrder = async () => {
    try {
      // Ensure user is authenticated
      const token = localStorage.getItem("token");
      if (!token) {
        // Redirect to login if not authenticated
        navigate("/login");
        return;
      }

      // Try to get customerId from token payload
      let customerId = null;
      try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const decoded = JSON.parse(window.atob(base64));
        customerId = decoded.id || decoded._id || decoded?.sub;
      } catch (e) {
        console.warn("Failed to decode token payload", e);
      }

      // As a fallback, try to read userInfo stored in localStorage
      const storedUser = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const customerName = storedUser.fullName || storedUser.name || undefined;
      if (!customerId && storedUser._id) customerId = storedUser._id;

      if (!customerId) {
        // As a last resort, fetch profile from backend (if API available)
        // but avoid introducing heavy logic here; instead, prompt login
        alert("Please login to place an order");
        navigate("/login");
        return;
      }

      const orderItems = cartItems.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      }));
      const subtotal = cartItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );
      const tax = 0; // Set tax to 0 for consistency
      const deliveryFee = 0;
      const total = subtotal + tax + deliveryFee;

      const orderPayload = {
        customerId,
        customerName,
        items: orderItems,
        total,
        paymentMethod: "Cash on Delivery",
        address: "",
      };

      const created = await orderAPI.createOrder(orderPayload);
      // created should be the order object
      if (created && created.orderId) {
        // clear cart and navigate to confirmation
        emptyCart();
        navigate("/user/order-confirmation", {
          state: { orderId: created.orderId },
        });
      } else {
        alert("Order created but no order id returned.");
      }
    } catch (err) {
      console.error("Place order failed", err);
      alert(err?.response?.data?.message || "Failed to place order");
    }
  };

  return (
    <div className="min-h-screen bg-[#FF6A00] flex flex-col">
      <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12 text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl text-center font-bold mb-1">
            Your Cart
          </h1>
          <p className="text-xs text-center sm:text-sm mb-6 sm:mb-8">
            Review your order and proceed to checkout
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Left Column: Cart Items */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {cartItems.length === 0 && (
                <DarkCard className="text-center">Your cart is empty.</DarkCard>
              )}
              {cartItems.map((item) => (
                <DarkCard
                  key={item.name + item.category}
                  className="flex flex-col sm:flex-row justify-between gap-4"
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-base sm:text-lg">
                      {item.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-300">
                      {item.category}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {item.tags && item.tags.includes("GF") && (
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                          GF
                        </span>
                      )}
                      {item.tags && item.tags.includes("LF") && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          LF
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-400 mt-1">
                        {item.description}
                      </div>
                    )}
                    <div className="mt-3 sm:mt-4 flex items-center gap-2">
                      <button
                        onClick={() => decrementQuantity(item)}
                        className="bg-[#6b4a1d] px-3 py-1 rounded text-sm sm:text-base"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="min-w-[30px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => incrementQuantity(item)}
                        className="bg-[#f97316] px-3 py-1 rounded text-sm sm:text-base"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-between gap-2">
                    <div className="flex flex-col items-start sm:items-end">
                      <span className="text-xs sm:text-sm text-[#ffffff] font-semibold">
                        ${item.price.toFixed(2)}
                      </span>
                      <span className="font-bold text-base sm:text-lg">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.name, item.category)}
                      aria-label="Remove item"
                      className="text-gray-400 hover:text-red-600 text-lg sm:text-base"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </DarkCard>
              ))}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4">
                <button
                  onClick={emptyCart}
                  className="flex-1 border border-white bg-transparent text-white hover:bg-[#600227] px-4 py-2 sm:py-2 rounded text-sm sm:text-base"
                >
                  Empty Cart
                </button>
                <button
                  onClick={continueShopping}
                  className="flex-1 bg-orange-600 text-white px-4 py-2 sm:py-2 rounded hover:bg-orange-700 text-sm sm:text-base"
                >
                  Continue Shopping
                </button>
              </div>
            </div>

            {/* Right Column: Loyalty Points and Order Summary */}
            <div className="space-y-4 sm:space-y-6">
              <DarkCard>
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <FaGift className="text-[#e64a19] text-lg sm:text-base" />
                  <h3 className="font-semibold text-sm sm:text-base">
                    Loyalty Points
                  </h3>
                </div>
                <p className="text-xs sm:text-sm mb-2">
                  Current Points{" "}
                  <span className="font-bold text-yellow-400 inline-flex items-center gap-1">
                    <FaStar className="text-xs" /> {loyaltyPoints}
                  </span>
                </p>
                <p className="text-xs sm:text-sm mb-2">
                  You will earn {pointsToEarn} points on this order. (Total:{" "}
                  {loyaltyPoints + pointsToEarn})
                </p>
                <div className="bg-[#2a1f0f] p-2 sm:p-3 rounded text-xs mt-3 sm:mt-4 text-center">
                  <p className="font-bold">Earn 1 point for every $1 spent!</p>
                  <p className="mt-1">
                    100 points = $1 discount on future orders
                  </p>
                </div>
              </DarkCard>

              <DarkCard>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">
                  Order Summary
                </h3>
                <div className="flex justify-between mb-2 text-xs sm:text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2 text-xs sm:text-sm">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2 text-xs sm:text-sm">
                  <span>Delivery Fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#fffdfe] mb-3 sm:mb-4 text-sm sm:text-base">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <button
                  onClick={proceedToCheckout}
                  disabled={cartItems.length === 0}
                  className={`w-full px-4 py-2 sm:py-2 rounded flex justify-center items-center gap-2 text-sm sm:text-base ${
                    cartItems.length === 0
                      ? "bg-gray-500 text-gray-300 cursor-not-allowed opacity-50"
                      : "bg-orange-600 text-white hover:bg-orange-700"
                  }`}
                >
                  Proceed to Checkout <span>→</span>
                </button>
                <p className="text-xs text-center mt-2 text-gray-400">
                  Secure checkout powered by industry-leading encryption
                </p>
              </DarkCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
