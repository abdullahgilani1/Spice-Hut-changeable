import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaArrowLeft, FaCheck, FaMoneyBillWave } from "react-icons/fa";
import { useCart } from "../context.cart.jsx";
import { orderAPI, profileAPI } from "../../services/api";

const DarkCard = ({ children, className = "" }) => (
  <div
    className={`bg-[#3a2618] text-white rounded-lg p-4 sm:p-6 shadow-md ${className}`}
  >
    {children}
  </div>
);

export default function Billing() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    cartItems,
    loyaltyPoints,
    setLoyaltyPoints,
    applyInstantRedemption,
  } = useCart();

  // Get data passed from Checkout
  const passedData = location.state || {};
  const passedCartItems = passedData.cartItems || cartItems;
  const passedUserInfo = passedData.userInfo || {};
  const passedDeliveryMethod = passedData.deliveryMethod || "home";
  const passedSelectedAddress = passedData.selectedAddress || null;

  // Display items: use passed cart items
  const displayItems = passedCartItems;

  // Billing information state
  const [billingInfo, setBillingInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });

  const [applyLoyaltyDiscount, setApplyLoyaltyDiscount] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [instantDiscount, setInstantDiscount] = useState(0);

  // Prefill billing info from passed delivery address or server profile
  useEffect(() => {
    const loadBillingInfo = async () => {
      const token = localStorage.getItem("token");
      let initialBilling = {
        fullName: passedUserInfo?.fullName || "",
        email: passedUserInfo?.email || "",
        phone: passedUserInfo?.phone || "",
        address: passedSelectedAddress?.address || "",
        city: passedSelectedAddress?.city || "",
        postalCode: passedSelectedAddress?.postalCode || "",
      };

      if (token) {
        try {
          const profile = await profileAPI.getProfile();
          if (profile) {
            if (!passedSelectedAddress) {
              const addrList = await profileAPI.getAddresses().catch(() => []);
              const defaultAddr = Array.isArray(addrList)
                ? addrList.find((a) => a.isDefault) || addrList[0]
                : null;
              initialBilling.address = defaultAddr ? defaultAddr.address : "";
              initialBilling.city = defaultAddr ? defaultAddr.city || "" : "";
              initialBilling.postalCode = defaultAddr
                ? defaultAddr.postalCode || ""
                : "";
            }
            initialBilling.fullName =
              profile.fullName || profile.name || initialBilling.fullName;
            initialBilling.email = profile.email || initialBilling.email;
            initialBilling.phone = profile.phone || initialBilling.phone;
          }
        } catch (err) {
          console.debug("Billing: failed to load profile", err?.message || err);
        }
      }

      setBillingInfo(initialBilling);
    };

    loadBillingInfo();
  }, [passedData, passedUserInfo, passedSelectedAddress]);

  // Handle billing info change
  const handleBillingInfoChange = (field, value) => {
    setBillingInfo((prev) => ({ ...prev, [field]: value }));
  };

  // Calculate order totals
  const subtotal = displayItems.reduce(
    (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
    0
  );
  const tax = 0;
  const deliveryFee = 0;
  const maxPointsBySubtotal = Math.floor(subtotal) * 100;
  const maxPointsAllowed = Math.min(loyaltyPoints, maxPointsBySubtotal);
  const loyaltyDiscount = applyLoyaltyDiscount ? pointsToUse / 100 : 0;
  const instantEligible =
    loyaltyPoints < 100 &&
    subtotal >= 100 &&
    loyaltyPoints + Math.floor(subtotal) >= 100;
  const total =
    subtotal + tax + deliveryFee - loyaltyDiscount - instantDiscount;

  // Handle apply loyalty discount
  const handleApplyLoyaltyDiscount = () => {
    if (loyaltyPoints >= 100) {
      let pts = pointsToUse;
      if (pts < 100) pts = Math.min(100, maxPointsAllowed);
      pts = Math.floor(pts / 100) * 100;
      if (pts > maxPointsAllowed) pts = maxPointsAllowed;
      setPointsToUse(pts);
      setApplyLoyaltyDiscount(!applyLoyaltyDiscount);
    }
  };

  // Validate form
  const validateForm = () => {
    if (!billingInfo.fullName || !billingInfo.email || !billingInfo.phone) {
      alert("Please fill in all required information fields.");
      return false;
    }

    // For home delivery, require address
    if (
      passedDeliveryMethod === "home" ||
      passedDeliveryMethod === "homeDelivery"
    ) {
      if (
        !billingInfo.address ||
        !billingInfo.city ||
        !billingInfo.postalCode
      ) {
        alert("Please fill in all address fields for home delivery.");
        return false;
      }
    }

    return true;
  };

  // Handle apply instant redemption
  const handleApplyInstantRedemption = () => {
    if (instantEligible && instantDiscount === 0) {
      const discount = applyInstantRedemption(subtotal);
      setInstantDiscount(discount);
    } else if (instantDiscount > 0) {
      setInstantDiscount(0);
    }
  };

  // Handle confirm order
  const handleConfirmOrder = async () => {
    if (!validateForm()) return;
    const pointsUsed = applyLoyaltyDiscount ? pointsToUse : 0;

    try {
      const token = localStorage.getItem("token");
      let customerId = null;
      try {
        if (token) {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const decoded = JSON.parse(window.atob(base64));
          customerId = decoded.id || decoded._id || null;
        }
      } catch (err) {
        console.warn("Failed to decode JWT for customerId", err);
      }

      const storedUser = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const customerName =
        storedUser.fullName || storedUser.name || billingInfo.fullName;
      const orderItems = displayItems.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        image: i.image,
      }));

      let currentCoords = null;
      if (
        passedSelectedAddress &&
        passedSelectedAddress.latitude &&
        passedSelectedAddress.longitude
      ) {
        currentCoords = {
          latitude: passedSelectedAddress.latitude,
          longitude: passedSelectedAddress.longitude,
        };
      } else {
        try {
          const profile = await profileAPI.getProfile();
          if (
            profile &&
            profile.currentLocation &&
            profile.currentLocation.latitude &&
            profile.currentLocation.longitude
          ) {
            currentCoords = {
              latitude: profile.currentLocation.latitude,
              longitude: profile.currentLocation.longitude,
            };
          }
        } catch (pfErr) {
          // ignore
        }
      }

      const payload = {
        customerId,
        customerName,
        items: orderItems,
        total: +(
          subtotal +
          tax +
          deliveryFee -
          pointsUsed / 100 -
          instantDiscount
        ).toFixed(2),
        pointsUsed,
        paymentMethod: "Cash on Delivery",
        address: billingInfo.address || "",
        city: billingInfo.city || "",
        postalCode: billingInfo.postalCode || "",
        currentLocation: currentCoords,
        orderType:
          passedDeliveryMethod === "home" ||
          passedDeliveryMethod === "homeDelivery"
            ? "homeDelivery"
            : "pickup",
      };

      const created = await orderAPI.createOrder(payload);
      if (created && (created._id || created.orderId)) {
        try {
          if (customerId) {
            const profile = await profileAPI.getProfile();
            if (profile && typeof profile.loyaltyPoints !== "undefined") {
              setLoyaltyPoints(profile.loyaltyPoints || 0);
              const stored = JSON.parse(
                localStorage.getItem("userInfo") || "{}"
              );
              localStorage.setItem(
                "userInfo",
                JSON.stringify({ ...stored, _id: profile._id })
              );
            }
          }
        } catch (refreshErr) {
          console.warn("Failed to refresh loyalty points after order", refreshErr);
        }
        const id = created._id || created.orderId;
        navigate("/user/order-confirmation", {
          state: { orderId: id, order: created },
        });
      } else {
        navigate("/user/order-confirmation", { state: {} });
      }
    } catch (err) {
      console.error("Failed to create order in Billing:", err);
      alert("Failed to create order. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FF6A00] flex flex-col">
      <main className="flex-1 px-8 py-12 text-white">
        <h1 className="text-3xl text-center font-bold mb-1">Order Review</h1>
        <p className="text-sm text-center mb-8">
          Review your order details and confirm
        </p>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Order Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <DarkCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FaUser /> Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold">Full Name</label>
                  <input
                    type="text"
                    value={billingInfo.fullName}
                    onChange={(e) =>
                      handleBillingInfoChange("fullName", e.target.value)
                    }
                    className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Email Address</label>
                  <input
                    type="email"
                    value={billingInfo.email}
                    onChange={(e) =>
                      handleBillingInfoChange("email", e.target.value)
                    }
                    className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold">Phone Number</label>
                  <input
                    type="tel"
                    value={billingInfo.phone}
                    onChange={(e) =>
                      handleBillingInfoChange("phone", e.target.value)
                    }
                    className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
                  />
                </div>
                {(passedDeliveryMethod === "home" ||
                  passedDeliveryMethod === "homeDelivery") && (
                  <>
                    <div className="md:col-span-2">
                      <label className="text-sm font-semibold">
                        Delivery Address
                      </label>
                      <input
                        type="text"
                        value={billingInfo.address}
                        onChange={(e) =>
                          handleBillingInfoChange("address", e.target.value)
                        }
                        className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold">City</label>
                      <input
                        type="text"
                        value={billingInfo.city}
                        onChange={(e) =>
                          handleBillingInfoChange("city", e.target.value)
                        }
                        className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        value={billingInfo.postalCode}
                        onChange={(e) =>
                          handleBillingInfoChange("postalCode", e.target.value)
                        }
                        className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
                      />
                    </div>
                  </>
                )}
              </div>
            </DarkCard>

            {/* Payment Method */}
            <DarkCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FaMoneyBillWave /> Payment Method
              </h3>
              <div className="bg-[#2a1f0f] p-4 rounded">
                <p className="text-lg font-semibold">Cash on Delivery</p>
                <p className="text-sm text-gray-300 mt-2">
                  Pay with cash when your order is delivered or picked up.
                </p>
              </div>
            </DarkCard>
          </div>

          {/* Right Column: Order Summary */}
          <div className="space-y-6">
            <DarkCard>
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                {displayItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>
                      {item.name} x{item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#5a3f1a] pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                {(passedDeliveryMethod === "home" ||
                  passedDeliveryMethod === "homeDelivery") && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {applyLoyaltyDiscount && (
                  <div className="flex justify-between text-green-400">
                    <span>Loyalty Discount</span>
                    <span>-${loyaltyDiscount.toFixed(2)}</span>
                  </div>
                )}
                {instantDiscount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Instant Redemption</span>
                    <span>-${instantDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t border-[#5a3f1a] pt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Loyalty Points */}
              <div className="mt-4">
                {loyaltyPoints < 100 ? (
                  instantEligible ? (
                    <div>
                      <p className="text-sm mb-2">
                        You have {loyaltyPoints} loyalty points. With this
                        order, you can instantly redeem for a discount!
                      </p>
                      <button
                        onClick={handleApplyInstantRedemption}
                        className={`w-full text-xs px-2 py-1 rounded ${
                          instantDiscount > 0
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-orange-600 hover:bg-orange-700"
                        }`}
                      >
                        {instantDiscount > 0
                          ? "Remove Instant Discount"
                          : "Apply Instant Discount"}
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      You have {loyaltyPoints} loyalty points. Earn{" "}
                      {100 - loyaltyPoints} more to unlock a $1 discount.
                    </p>
                  )
                ) : (
                  <div>
                    <p className="text-sm mb-2">
                      You have {loyaltyPoints} loyalty points. 100 points = $1
                      discount. Enter points to use (min 100):
                    </p>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="number"
                        min={100}
                        step={100}
                        max={maxPointsAllowed}
                        value={pointsToUse}
                        onChange={(e) => {
                          let v = parseInt(e.target.value || "0", 10);
                          if (isNaN(v)) v = 0;
                          v = Math.floor(v / 100) * 100;
                          if (v > maxPointsAllowed) v = maxPointsAllowed;
                          if (v < 0) v = 0;
                          setPointsToUse(v);
                        }}
                        className="w-2/3 bg-[#2a1f0f] rounded px-3 py-2 text-white"
                      />
                      <button
                        onClick={() => {
                          setPointsToUse(maxPointsAllowed);
                          setApplyLoyaltyDiscount(true);
                        }}
                        className="w-1/3 text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600"
                      >
                        Use Max
                      </button>
                    </div>
                    <p className="text-sm mb-2">
                      Discount: ${(pointsToUse / 100).toFixed(2)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleApplyLoyaltyDiscount}
                        className={`flex-1 text-xs px-2 py-1 rounded ${
                          applyLoyaltyDiscount
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-orange-600 hover:bg-orange-700"
                        }`}
                      >
                        {applyLoyaltyDiscount
                          ? `Remove ${(pointsToUse / 100).toFixed(2)} Discount`
                          : `Apply ${(pointsToUse / 100).toFixed(2)} Discount`}
                      </button>
                      <button
                        onClick={() => {
                          setPointsToUse(0);
                          setApplyLoyaltyDiscount(false);
                        }}
                        className="text-xs px-2 py-1 rounded border border-gray-600"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </DarkCard>

            {/* Navigation Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => navigate("/user/checkout")}
                className="w-full bg-transparent border border-white text-white px-4 py-3 rounded hover:bg-white hover:text-[#FF6A00] flex items-center justify-center gap-2"
              >
                <FaArrowLeft /> Back to Checkout
              </button>
              {displayItems && displayItems.length > 0 && (
                <button
                  onClick={handleConfirmOrder}
                  className="w-full bg-orange-600 text-white px-4 py-3 rounded hover:bg-orange-700 flex items-center justify-center gap-2"
                >
                  <FaCheck /> Confirm Order
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
