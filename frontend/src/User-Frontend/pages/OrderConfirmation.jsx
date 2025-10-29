import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaCheck,
  FaShoppingCart,
  FaHistory,
  FaStar,
  FaDownload,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import { useCart } from "../context.cart.jsx";
import { orderAPI, profileAPI } from "../../services/api";

const DarkCard = ({ children, className = "" }) => (
  <div
    className={`bg-[#3a2618] text-white rounded-lg p-6 shadow-md ${className}`}
  >
    {children}
  </div>
);

export default function OrderConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    cartItems,
    emptyCart,
    instantApplied: _instantApplied,
    setLoyaltyPoints,
  } = useCart();

  // Order data state
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Optional UX state
  const [rating, setRating] = useState(0);
  const [saveAddress, setSaveAddress] = useState(false);

  // Load order data on mount (prefer backend when orderId is provided).
  // If no server orderId is provided, fall back to a local/hardcoded snapshot built from
  // cartItems or previously saved localStorage snapshots so the page still shows a confirmation.
  useEffect(() => {
    const loadOrderData = async () => {
      setLoading(true);
      setNotFound(false);
      const passedOrderId = location.state?.orderId;

      // If we have a server-provided order id, prefer fetching it.
      if (passedOrderId) {
        try {
          const order = await orderAPI.getOrder(passedOrderId);
          if (!order) {
            setNotFound(true);
            return;
          }

          const orderDateObj = order.createdAt
            ? new Date(order.createdAt)
            : new Date();
          const orderDate = orderDateObj.toLocaleDateString();
          const orderTime = orderDateObj.toLocaleTimeString();
          const items = order.items || [];
          const enrichedItems = (items || []).map((it) => ({
            ...it,
            name: it.name || it.title || it.productName || "Item",
            price: it.price ?? it.unitPrice ?? it.amount ?? 0,
          }));

          const subtotal = enrichedItems.reduce(
            (acc, it) => acc + (it.price || 0) * (it.quantity || 1),
            0
          );
          const tax = 0;
          const total = order.total || +(subtotal + tax).toFixed(2);
          const deliveryFee = +(total - subtotal - tax).toFixed(2) || 0;
          const userName =
            order.customerName || (order.customer && order.customer.name) || "";
          const paymentMethod = order.paymentMethod || "Unknown";
          const deliveryAddress = order.address || "";
          const deliveryMethod = deliveryAddress
            ? "Home Delivery"
            : "Pickup from Restaurant";
          const estimatedTime =
            deliveryMethod === "Home Delivery"
              ? "30–45 minutes"
              : "Ready for pickup in 15 minutes";

          setOrderData({
            orderId: order.orderId || order._id,
            orderDate,
            orderTime,
            userName: userName || "Valued Customer",
            paymentMethod,
            deliveryAddress,
            deliveryMethod,
            estimatedTime,
            items: enrichedItems,
            subtotal,
            tax,
            deliveryFee,
            total,
          });

          // Clear cart; refresh loyalty points from profile if available
          emptyCart();
          try {
            const profile = await profileAPI.getProfile();
            if (profile && typeof profile.loyaltyPoints !== "undefined") {
              setLoyaltyPoints(profile.loyaltyPoints || 0);
            }
          } catch (e) {
            console.warn("Failed to refresh loyalty points after order", e);
          }
        } catch (err) {
          console.warn("Failed to fetch order from server", err);
          setNotFound(true);
        } finally {
          setLoading(false);
        }

        return;
      }

      // No server orderId — build a local/hardcoded order snapshot so the user still sees confirmation.
      try {
        // Try to re-use the most recent locally saved order for the user (if any)
        const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
        const email = userInfo?.email;
        let existingOrders = [];
        if (email) {
          existingOrders = JSON.parse(
            localStorage.getItem(`orders_${email}`) || "[]"
          );
        }

        let syntheticOrder = null;
        if (existingOrders && existingOrders.length) {
          syntheticOrder = existingOrders[existingOrders.length - 1];
        }

        // If no snapshot, build one from cartItems (hardcoded fallback)
        if (!syntheticOrder) {
          const items = (cartItems || []).map((it) => ({
            name: it.name || it.title || it.productName || "Item",
            price: it.price ?? it.unitPrice ?? it.amount ?? 0,
            quantity: it.quantity || 1,
          }));

          const subtotal = items.reduce(
            (acc, it) => acc + (it.price || 0) * (it.quantity || 1),
            0
          );
          const tax = 0;
          const deliveryFee = 0;
          const total = +(subtotal + tax + deliveryFee).toFixed(2);

          syntheticOrder = {
            orderId: `local_${Date.now()}`,
            createdAt: new Date().toISOString(),
            customerName:
              userInfo?.name ||
              `${userInfo?.firstName || ""} ${
                userInfo?.lastName || ""
              }`.trim() ||
              "Guest",
            items,
            subtotal,
            tax,
            deliveryFee,
            total,
            address: userInfo?.address || "",
            paymentMethod: "Cash on Delivery",
          };

          // Persist the snapshot per user so it's available later
          if (email) {
            existingOrders.push(syntheticOrder);
            localStorage.setItem(
              `orders_${email}`,
              JSON.stringify(existingOrders)
            );
          }
        }

        const orderDateObj = new Date(syntheticOrder.createdAt);
        const orderDate = orderDateObj.toLocaleDateString();
        const orderTime = orderDateObj.toLocaleTimeString();
        const enrichedItems = (syntheticOrder.items || []).map((it) => ({
          ...it,
          name: it.name || "Item",
          price: it.price || 0,
        }));

        setOrderData({
          orderId: syntheticOrder.orderId || syntheticOrder._id,
          orderDate,
          orderTime,
          userName: syntheticOrder.customerName || "Guest",
          paymentMethod: syntheticOrder.paymentMethod || "Unknown",
          deliveryAddress: syntheticOrder.address || "",
          deliveryMethod: syntheticOrder.address
            ? "Home Delivery"
            : "Pickup from Restaurant",
          estimatedTime: syntheticOrder.address
            ? "30–45 minutes"
            : "Ready for pickup in 15 minutes",
          items: enrichedItems,
          subtotal: syntheticOrder.subtotal || 0,
          tax: syntheticOrder.tax || 0,
          deliveryFee: syntheticOrder.deliveryFee || 0,
          total: syntheticOrder.total || 0,
        });

        // Clear cart locally
        emptyCart();
        try {
          const profile = await profileAPI.getProfile();
          if (profile && typeof profile.loyaltyPoints !== "undefined") {
            setLoyaltyPoints(profile.loyaltyPoints || 0);
          }
        } catch {
          // ignore
        }
      } catch (e) {
        console.warn("Failed to build local/hardcoded order", e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();
  }, [location.state?.orderId]);

  // Handle rating
  const handleRating = (value) => {
    setRating(value);
  };

  // Handle continue shopping
  const handleContinueShopping = () => {
    navigate("/user/menu");
  };

  // Handle view order history (placeholder)
  {
    /*const handleViewOrderHistory = () => {
    // For now, just navigate to profile or show alert
    alert('Order history feature coming soon!');
    navigate('/user/profile');
  };*/
  }

  // Handle download invoice (placeholder)
  {
    /*const handleDownloadInvoice = () => {
    alert("Invoice download feature coming soon!");
  };*/
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading order...
      </div>
    );
  if (notFound || !orderData)
    return (
      <div className="min-h-screen bg-[#FF6A00] flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Order not found</h2>
          <p className="mb-6">
            We couldn't find the requested order. If you just placed it, please
            wait a moment and check your orders in your profile.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate("/user/menu")}
              className="px-4 py-2 bg-orange-600 rounded text-white"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => navigate("/user/profile")}
              className="px-4 py-2 border border-white rounded text-white"
            >
              View Profile
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#FF6A00] flex flex-col">
      <main className="flex-1 px-8 py-12 text-white">
        {/* Success Message */}
        <div className="max-w-4xl mx-auto text-center mb-8 animate-fade-in">
          <div className="bg-green-600 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <FaCheck className="text-white text-3xl" />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            🎉 Thank You, {orderData.userName}!
          </h1>
          <p className="text-lg mb-4">
            Your order has been successfully placed.
          </p>
          <p className="text-sm text-gray-200">
            Your delicious food is being prepared. You will receive an update
            once it's out for delivery.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary Card */}
            <DarkCard className="animate-fade-in-delay">
              <h3 className="font-semibold mb-4 text-xl">Order Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-300">Order ID</p>
                  <p className="font-semibold">{orderData.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Order Date & Time</p>
                  <p className="font-semibold">
                    {orderData.orderDate} at {orderData.orderTime}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Payment Method</p>
                  <p className="font-semibold">{orderData.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Delivery Method</p>
                  <p className="font-semibold">{orderData.deliveryMethod}</p>
                </div>
                {orderData.deliveryAddress && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-300">Delivery Address</p>
                    <p className="font-semibold">{orderData.deliveryAddress}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-300">
                    Estimated Delivery Time
                  </p>
                  <p className="font-semibold text-orange-400">
                    {orderData.estimatedTime}
                  </p>
                </div>
              </div>
            </DarkCard>

            {/* Ordered Items */}
            <DarkCard className="animate-fade-in-delay">
              <h3 className="font-semibold mb-4">Ordered Items</h3>
              <div className="space-y-4">
                {orderData.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border-b border-[#5a3f1a] pb-4 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <h4 className="font-semibold">{item.name}</h4>
                      <p className="text-sm text-gray-300">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-300">
                        ${(item.price || 0).toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Totals */}
              <div className="border-t border-[#5a3f1a] pt-4 mt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${orderData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${orderData.tax.toFixed(2)}</span>
                </div>
                {orderData.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>${orderData.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t border-[#5a3f1a] pt-2">
                  <span>Total Amount Paid</span>
                  <span>${orderData.total.toFixed(2)}</span>
                </div>
              </div>
            </DarkCard>
          </div>

          {/* Right Column: Actions and Optional Features */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <DarkCard className="animate-fade-in-delay">
              <h3 className="font-semibold mb-4">What's Next?</h3>
              <div className="space-y-3">
                <button
                  onClick={handleContinueShopping}
                  className="w-full bg-orange-600 text-white px-4 py-3 rounded hover:bg-orange-700 flex items-center justify-center gap-2"
                >
                  <FaShoppingCart /> Continue Shopping
                </button>
                {/*<button
                  onClick={handleViewOrderHistory}
                  className="w-full bg-transparent border border-white text-white px-4 py-3 rounded hover:bg-white hover:text-[#FF6A00] flex items-center justify-center gap-2"
                >
                  <FaHistory /> View Order History
                </button>*/}
              </div>
            </DarkCard>

            {/* Optional UX Elements */}
            <DarkCard className="animate-fade-in-delay">
              <h3 className="font-semibold mb-4">Rate Your Experience</h3>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`cursor-pointer text-xl ${
                      star <= rating ? "text-yellow-400" : "text-gray-400"
                    }`}
                    onClick={() => handleRating(star)}
                  />
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-300">
                  Thank you for your {rating} star rating!
                </p>
              )}
            </DarkCard>

            <DarkCard className="animate-fade-in-delay">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold">
                  Save this address for next order
                </span>
                <button
                  onClick={() => setSaveAddress(!saveAddress)}
                  className="text-orange-400"
                >
                  {saveAddress ? (
                    <FaToggleOn className="text-2xl" />
                  ) : (
                    <FaToggleOff className="text-2xl text-gray-400" />
                  )}
                </button>
              </div>
              {/*<button
                onClick={handleDownloadInvoice}
                className="w-full bg-transparent border border-orange-400 text-orange-400 px-4 py-2 rounded hover:bg-orange-400 hover:text-white flex items-center justify-center gap-2"
              >
                <FaDownload /> Download Invoice (PDF)
              </button>*/}
            </DarkCard>
          </div>
        </div>
      </main>
    </div>
  );
}
