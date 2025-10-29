import React, { useState, useEffect, useRef } from "react";
import Modal from "../components/Modal.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaCreditCard, FaArrowLeft, FaCheck } from "react-icons/fa";
import { useCart } from "../context.cart.jsx";
import { orderAPI, profileAPI } from "../../services/api";
import {
  validateCardNumber,
  formatCardNumber,
  formatExpiryDate,
  validateExpiryDate,
  formatCVV,
  validateCVV,
  formatCardholderName,
  validateCardholderName,
} from "../utils/cardUtils.js";

// Small helper card used across pages (kept local to avoid adding a new file)
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
    instantApplied: _instantApplied,
    applyInstantRedemption,
  } = useCart();

  // Get data passed from Checkout
  const passedData = location.state || {};
  const passedCartItems = passedData.cartItems || cartItems;
  const passedUserInfo = passedData.userInfo || {};
  const passedDeliveryMethod = passedData.deliveryMethod || "home";
  const passedSelectedAddress = passedData.selectedAddress || null;
  const passedTotal = passedData.total || 0;

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

  const [paymentMethod, setPaymentMethod] = useState("credit");
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    paypalEmail: "",
    bankAccount: "",
    routingNumber: "",
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  // Refs for auto-focus
  const expiryRef = useRef(null);
  const cvvRef = useRef(null);
  const nameRef = useRef(null);

  const [applyLoyaltyDiscount, setApplyLoyaltyDiscount] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [instantDiscount, setInstantDiscount] = useState(0);
  const [showPrivacyModal, setShowPrivacyModal] = useState(true);

  // Prefill billing info from passed delivery address or server profile for authenticated users
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
            // Always use passed delivery address if available, otherwise use profile default
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
          console.debug(
            "Billing: failed to load profile billing",
            err?.message || err
          );
        }
      }

      setBillingInfo(initialBilling);
    };

    loadBillingInfo();
  }, [passedData, passedUserInfo, passedSelectedAddress]);

  // Save billing info is a no-op: do not persist billing info anywhere.
  const saveBillingInfo = () => {
    // intentionally do not save billing info to localStorage or server
    return;
  };

  // Save payment details is a no-op: never persist payment details.
  const savePaymentDetails = () => {
    // intentionally do not save payment details to localStorage or server
    return;
  };

  // Handle billing info change
  const handleBillingInfoChange = (field, value) => {
    setBillingInfo((prev) => ({ ...prev, [field]: value }));
  };

  // Handle payment details change with formatting and validation
  const handlePaymentChange = (field, value) => {
    let formattedValue = value;
    let error = "";

    if (field === "cardNumber") {
      formattedValue = formatCardNumber(value);
      // Temporarily disabled card number validation (Luhn check) - only check length
      if (
        formattedValue.replace(/\s/g, "").length > 0 &&
        formattedValue.replace(/\s/g, "").length < 16
      ) {
        error = "Enter a valid card number";
      }
      // Auto-focus to expiry when card number is complete
      if (formattedValue.replace(/\s/g, "").length === 16 && !error) {
        setTimeout(() => expiryRef.current?.focus(), 100);
      }
    } else if (field === "expiryDate") {
      formattedValue = formatExpiryDate(value);
      if (formattedValue.length === 5) {
        if (!validateExpiryDate(formattedValue)) {
          error = "Enter a valid expiry date";
        }
      } else if (formattedValue.length > 0) {
        error = "Enter a valid expiry date";
      }
      // Auto-focus to CVV when expiry is complete
      if (formattedValue.length === 5 && !error) {
        setTimeout(() => cvvRef.current?.focus(), 100);
      }
    } else if (field === "cvv") {
      formattedValue = formatCVV(value);
      if (formattedValue.length === 3 || formattedValue.length === 4) {
        if (!validateCVV(formattedValue)) {
          error = "Enter valid CVV";
        }
      } else if (formattedValue.length > 0) {
        error = "Enter valid CVV";
      }
      // Auto-focus to name when CVV is complete
      if (
        (formattedValue.length === 3 || formattedValue.length === 4) &&
        !error
      ) {
        setTimeout(() => nameRef.current?.focus(), 100);
      }
    } else if (field === "cardholderName") {
      formattedValue = formatCardholderName(value);
      if (
        formattedValue.length > 0 &&
        !validateCardholderName(formattedValue)
      ) {
        error = "Enter a valid name";
      }
    }

    setPaymentDetails((prev) => ({ ...prev, [field]: formattedValue }));
    setValidationErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Calculate order totals
  // Calculate order totals (use passed order when available)
  const subtotal = displayItems.reduce(
    (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
    0
  );
  const tax = 0; // Set tax to 0 as per requirement
  const deliveryMethod = localStorage.getItem("deliveryMethod") || "home";
  const deliveryFee = 0;
  const maxPointsBySubtotal = Math.floor(subtotal) * 100; // 100 points = $1, cap by whole dollars of subtotal
  const maxPointsAllowed = Math.min(loyaltyPoints, maxPointsBySubtotal);
  const loyaltyDiscount = applyLoyaltyDiscount ? pointsToUse / 100 : 0;
  const instantEligible =
    loyaltyPoints < 100 &&
    subtotal >= 100 &&
    loyaltyPoints + Math.floor(subtotal) >= 100;
  const total =
    subtotal + tax + deliveryFee - loyaltyDiscount - instantDiscount;

  // Handle apply loyalty discount (toggle) — normalize pointsToUse when applying
  const handleApplyLoyaltyDiscount = () => {
    if (loyaltyPoints >= 100) {
      // normalize requested points
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
    if (
      !billingInfo.fullName ||
      !billingInfo.email ||
      !billingInfo.phone ||
      !billingInfo.address ||
      !billingInfo.city ||
      !billingInfo.postalCode
    ) {
      alert(
        "Please fill in all billing information fields (including city and postal code)."
      );
      return false;
    }

    if (paymentMethod === "credit" || paymentMethod === "debit") {
      if (
        !paymentDetails.cardNumber ||
        !paymentDetails.expiryDate ||
        !paymentDetails.cvv ||
        !paymentDetails.cardholderName
      ) {
        alert("Please fill in all card details.");
        return false;
      }
    } else if (paymentMethod === "paypal") {
      if (!paymentDetails.paypalEmail) {
        alert("Please enter your PayPal email.");
        return false;
      }
    } else if (paymentMethod === "bank") {
      if (!paymentDetails.bankAccount || !paymentDetails.routingNumber) {
        alert("Please fill in all bank transfer details.");
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
    // Do not mutate client-side points until server confirms; include pointsUsed in payload
    const pointsUsed = applyLoyaltyDiscount ? pointsToUse : 0;

    // Create the order on the server now with all billing info
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

      // Include delivery address from checkout
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
        paymentMethod:
          paymentMethod === "credit" ? "Card Payment" : paymentMethod,
        address: billingInfo.address || "",
        city: billingInfo.city || "",
        postalCode: billingInfo.postalCode || "",
      };

      const created = await orderAPI.createOrder(payload);
      if (created && (created._id || created.orderId)) {
        // Refresh user's loyalty points from server profile if available
        try {
          if (customerId) {
            const profile = await profileAPI.getProfile();
            if (profile && typeof profile.loyaltyPoints !== "undefined") {
              setLoyaltyPoints(profile.loyaltyPoints || 0);
              // update local userInfo copy
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
          console.warn(
            "Failed to refresh loyalty points after order",
            refreshErr
          );
        }
        const id = created._id || created.orderId;
        // Clear payment details from memory and any leftover localStorage after successful order
        try {
          localStorage.removeItem("paymentDetails");
        } catch (e) {}
        setPaymentDetails({
          cardNumber: "",
          expiryDate: "",
          cvv: "",
          cardholderName: "",
          paypalEmail: "",
          bankAccount: "",
          routingNumber: "",
        });

        navigate("/user/order-confirmation", {
          state: { orderId: id, order: created },
        });
      } else {
        // Fallback
        try {
          localStorage.removeItem("paymentDetails");
        } catch (e) {}
        setPaymentDetails({
          cardNumber: "",
          expiryDate: "",
          cvv: "",
          cardholderName: "",
          paypalEmail: "",
          bankAccount: "",
          routingNumber: "",
        });
        navigate("/user/order-confirmation", { state: {} });
      }
    } catch (err) {
      console.error("Failed to create order in Billing:", err);
      alert("Failed to create order. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FF6A00] flex flex-col">
      <Modal
        visible={showPrivacyModal}
        title="Payment Privacy"
        onClose={() => setShowPrivacyModal(false)}
      >
        <p>
          We do not save your card details. You must enter payment information
          for each order. Card details are discarded after order completion.
        </p>
        <div className="mt-4 text-right">
          <button
            onClick={() => setShowPrivacyModal(false)}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            OK
          </button>
        </div>
      </Modal>
      <main className="flex-1 px-8 py-12 text-white">
        <h1 className="text-3xl text-center font-bold mb-1">Billing</h1>
        <p className="text-sm text-center mb-8">
          Complete your payment information
        </p>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Billing Info and Payment Method */}
          <div className="lg:col-span-2 space-y-6">
            {/* Billing Information */}
            <DarkCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FaUser /> Billing Information
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
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold">
                    Billing Address
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
                  <label className="text-sm font-semibold">Postal Code</label>
                  <input
                    type="text"
                    value={billingInfo.postalCode}
                    onChange={(e) =>
                      handleBillingInfoChange("postalCode", e.target.value)
                    }
                    className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
                  />
                </div>
              </div>
            </DarkCard>

            {/* Payment Method */}
            <DarkCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FaCreditCard /> Payment Method
              </h3>
              <div className="space-y-3 mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="credit"
                    checked={paymentMethod === "credit"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-orange-600"
                  />
                  <span>Credit Card</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="debit"
                    checked={paymentMethod === "debit"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-orange-600"
                  />
                  <span>Debit Card</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="paypal"
                    checked={paymentMethod === "paypal"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-orange-600"
                  />
                  <span>PayPal</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="bank"
                    checked={paymentMethod === "bank"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-orange-600"
                  />
                  <span>Bank Transfer</span>
                </label>
              </div>

              {/* Payment Details */}
              {(paymentMethod === "credit" || paymentMethod === "debit") && (
                <div className="space-y-3">
                  {/* Card Preview */}
                  <div className="flex justify-center mb-4">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 w-80 shadow-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-bold">Credit Card</span>
                        <span className="text-xs">Visa</span>
                      </div>
                      <div className="text-lg font-mono mb-2">
                        {paymentDetails.cardNumber || "**** **** **** ****"}
                      </div>
                      <div className="flex justify-between text-sm">
                        <div>
                          <div className="text-xs">Cardholder</div>
                          <div>{paymentDetails.cardholderName || "NAME"}</div>
                        </div>
                        <div>
                          <div className="text-xs">Expires</div>
                          <div>{paymentDetails.expiryDate || "MM/YY"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <label className="text-sm font-semibold">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={paymentDetails.cardNumber}
                        onChange={(e) =>
                          handlePaymentChange("cardNumber", e.target.value)
                        }
                        className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
                      />
                      {validationErrors.cardNumber && (
                        <p className="text-red-400 text-xs mt-1">
                          {validationErrors.cardNumber}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-semibold">
                        Expiry Date
                      </label>
                      <input
                        ref={expiryRef}
                        type="text"
                        placeholder="MM/YY"
                        value={paymentDetails.expiryDate}
                        onChange={(e) =>
                          handlePaymentChange("expiryDate", e.target.value)
                        }
                        className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
                      />
                      {validationErrors.expiryDate && (
                        <p className="text-red-400 text-xs mt-1">
                          {validationErrors.expiryDate}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-semibold">CVV</label>
                      <input
                        ref={cvvRef}
                        type="text"
                        placeholder="123"
                        value={paymentDetails.cvv}
                        onChange={(e) =>
                          handlePaymentChange("cvv", e.target.value)
                        }
                        className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
                      />
                      {validationErrors.cvv && (
                        <p className="text-red-400 text-xs mt-1">
                          {validationErrors.cvv}
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-semibold">
                        Cardholder Name
                      </label>
                      <input
                        ref={nameRef}
                        type="text"
                        value={paymentDetails.cardholderName}
                        onChange={(e) =>
                          handlePaymentChange("cardholderName", e.target.value)
                        }
                        className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
                      />
                      {validationErrors.cardholderName && (
                        <p className="text-red-400 text-xs mt-1">
                          {validationErrors.cardholderName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "paypal" && (
                <div>
                  <label className="text-sm font-semibold">PayPal Email</label>
                  <input
                    type="email"
                    value={paymentDetails.paypalEmail}
                    onChange={(e) =>
                      handlePaymentChange("paypalEmail", e.target.value)
                    }
                    className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
                  />
                </div>
              )}

              {paymentMethod === "bank" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.bankAccount}
                      onChange={(e) =>
                        handlePaymentChange("bankAccount", e.target.value)
                      }
                      className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">
                      Routing Number
                    </label>
                    <input
                      type="text"
                      value={paymentDetails.routingNumber}
                      onChange={(e) =>
                        handlePaymentChange("routingNumber", e.target.value)
                      }
                      className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
                    />
                  </div>
                </div>
              )}
            </DarkCard>
          </div>

          {/* Right Column: Order Summary */}
          <div className="space-y-6">
            <DarkCard>
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                {cartItems.map((item, idx) => (
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
                {deliveryMethod === "home" && (
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
                          // Set to max allowed (normalized)
                          setPointsToUse(maxPointsAllowed);
                          setApplyLoyaltyDiscount(true);
                        }}
                        className={`w-1/3 text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600`}
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
              {cartItems && cartItems.length > 0 && (
                <button
                  onClick={handleConfirmOrder}
                  disabled={
                    (paymentMethod === "credit" || paymentMethod === "debit") &&
                    (!paymentDetails.cardNumber ||
                      !paymentDetails.expiryDate ||
                      !paymentDetails.cvv ||
                      !paymentDetails.cardholderName ||
                      validationErrors.cardNumber ||
                      validationErrors.expiryDate ||
                      validationErrors.cvv ||
                      validationErrors.cardholderName)
                  }
                  className={`w-full px-4 py-3 rounded flex items-center justify-center gap-2 ${
                    (paymentMethod === "credit" || paymentMethod === "debit") &&
                    (!paymentDetails.cardNumber ||
                      !paymentDetails.expiryDate ||
                      !paymentDetails.cvv ||
                      !paymentDetails.cardholderName ||
                      validationErrors.cardNumber ||
                      validationErrors.expiryDate ||
                      validationErrors.cvv ||
                      validationErrors.cardholderName)
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-orange-600 text-white hover:bg-orange-700"
                  }`}
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
