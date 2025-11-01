import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaMapMarkerAlt,
  FaTruck,
  FaShoppingBag,
  FaArrowLeft,
  FaCreditCard,
  FaLocationArrow,
} from "react-icons/fa";
import { useCart } from "../context.cart.jsx";
import { orderAPI, profileAPI } from "../../services/api";
import { getCurrentLocation } from "../utils/geolocation";

const DarkCard = ({ children, className = "" }) => (
  <div
    className={`bg-[#3a2618] text-white rounded-lg p-6 shadow-md ${className}`}
  >
    {children}
  </div>
);

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems } = useCart();

  // Dummy user data (in real app, fetch from context or localStorage)
  const [userInfo, setUserInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  // Delivery method state
  const [deliveryMethod, setDeliveryMethod] = useState("home");

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "",
    addressLine1: "",
    city: "",
    postalCode: "",
    instructions: "",
  });
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);

  // Load data from localStorage or backend on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("userInfo");
    if (savedUser) {
      setUserInfo(JSON.parse(savedUser));
    }

    // If logged in, prefer server profile & addresses
    (async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const serverProfile = await profileAPI.getProfile();
          if (serverProfile) {
            const mapped = {
              fullName:
                serverProfile.name ||
                (serverProfile.firstName
                  ? `${serverProfile.firstName} ${serverProfile.lastName || ""}`
                  : ""),
              email: serverProfile.email || "",
              phone: serverProfile.phone || "",
            };
            setUserInfo((prev) => ({ ...prev, ...mapped }));

            try {
              const serverAddresses = await profileAPI.getAddresses();
              // Always set addresses from server, even if empty
              const mappedAddrs = Array.isArray(serverAddresses)
                ? serverAddresses.map((a) => ({
                    ...a,
                    id: String(a._id),
                  }))
                : [];
              setAddresses(mappedAddrs);
              if (mappedAddrs.length) {
                const def =
                  mappedAddrs.find((a) => a.isDefault) || mappedAddrs[0];
                setSelectedAddress(def.id);
              } else {
                setSelectedAddress(null);
              }
            } catch (addrErr) {
              console.warn("Failed to load addresses from server", addrErr);
              // Set empty addresses if server call fails
              setAddresses([]);
              setSelectedAddress(null);
            }
          }
        } catch (err) {
          console.warn("Failed to fetch profile from server", err);
          // Set empty addresses if profile fetch fails
          setAddresses([]);
          setSelectedAddress(null);
        }
      } else {
        // Not logged in, set empty addresses
        setAddresses([]);
        setSelectedAddress(null);
      }
    })();
  }, []);

  // Save user info to localStorage
  const saveUserInfo = () => {
    localStorage.setItem("userInfo", JSON.stringify(userInfo));
  };

  // Handle user info change
  const handleUserInfoChange = (field, value) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }));
  };

  // Handle add new address
  const handleAddAddress = async () => {
    if (
      newAddress.label &&
      newAddress.addressLine1 &&
      newAddress.city &&
      newAddress.postalCode
    ) {
      try {
        const fullAddress = `${newAddress.addressLine1}, ${newAddress.city}, ${newAddress.postalCode}`;

        // Save to server
        const addedAddress = await profileAPI.addAddress({
          label: newAddress.label,
          address: fullAddress,
          city: newAddress.city,
          postalCode: newAddress.postalCode,
          isDefault: false,
          latitude: newAddress.latitude,
          longitude: newAddress.longitude,
        });

        // Refresh address list from server to ensure consistency
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const serverAddresses = await profileAPI.getAddresses();
            const mappedAddrs = Array.isArray(serverAddresses)
              ? serverAddresses.map((a) => ({
                  ...a,
                  id: String(a._id),
                }))
              : [];
            setAddresses(mappedAddrs);
            // Set the newly added address as selected (find by matching label and address)
            const newAddr = mappedAddrs.find(
              (a) => a.label === newAddress.label && a.address === fullAddress
            );
            if (newAddr) {
              setSelectedAddress(newAddr.id);
            }
          } catch (refreshErr) {
            console.warn(
              "Failed to refresh addresses after adding",
              refreshErr
            );
            // Fallback to local update
            const newAddr = {
              ...addedAddress.address,
              id: String(addedAddress.address._id),
            };
            setAddresses((prev) => [...prev, newAddr]);
            setSelectedAddress(newAddr.id);
          }
        } else {
          // Fallback for non-logged in users
          const newAddr = {
            ...addedAddress.address,
            id: String(addedAddress.address._id),
          };
          setAddresses((prev) => [...prev, newAddr]);
          setSelectedAddress(newAddr.id);
        }

        // Reset form
        setNewAddress({
          label: "",
          addressLine1: "",
          city: "",
          postalCode: "",
          instructions: "",
          latitude: null,
          longitude: null,
        });
        setShowAddAddress(false);
      } catch (error) {
        console.error("Failed to add address:", error);
        alert("Failed to add address. Please try again.");
      }
    }
  };

  // Handle geolocation
  const handleUseCurrentLocation = () => {
    setShowAddAddress(true); // Open the add address form
    getCurrentLocation(
      (address) => {
        setNewAddress((prev) => ({
          ...prev,
          addressLine1: address.addressLine1,
          city: address.city,
          postalCode: address.postalCode,
          latitude: address.latitude,
          longitude: address.longitude,
        }));
      },
      (error) => {
        alert(error);
      }
    );
  };

  const handleEditClick = (addr) => {
    setEditingAddressId(addr.id);
    const parts = (addr.address || "").split(",").map((p) => p.trim());
    const [line1 = "", city = "", postalCode = ""] = parts;
    setEditingAddress({ label: addr.label || "", addressLine1: line1, city, postalCode });
  };

  const handleCancelEdit = () => {
    setEditingAddressId(null);
    setEditingAddress(null);
  };

  const handleSaveEditedAddress = async (id) => {
    if (!editingAddress || !editingAddress.addressLine1 || !editingAddress.city || !editingAddress.postalCode) {
      alert('Please fill in all required fields.');
      return;
    }
    const fullAddress = `${editingAddress.addressLine1}, ${editingAddress.city}, ${editingAddress.postalCode}`;
    try {
      await profileAPI.updateAddress(id, { label: editingAddress.label, address: fullAddress, city: editingAddress.city, postalCode: editingAddress.postalCode });
      const serverAddresses = await profileAPI.getAddresses();
      const mappedAddrs = Array.isArray(serverAddresses)
        ? serverAddresses.map((a) => ({ ...a, id: String(a._id) }))
        : [];
      setAddresses(mappedAddrs);
      setEditingAddressId(null);
      setEditingAddress(null);
    } catch (err) {
      console.error('Failed to update address', err);
      alert('Failed to update address.');
    }
  };

  // Calculate order totals
  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const tax = 0;
  const deliveryFee = 0;
  const total = subtotal + tax + deliveryFee;

  // Handle proceed to billing
  const handleProceedToBilling = () => {
    // Basic validation
    if (!userInfo.fullName || !userInfo.email || !userInfo.phone) {
      alert("Please fill in all user information fields.");
      return;
    }
    if (deliveryMethod === "home" && !selectedAddress) {
      alert("Please select a delivery address.");
      return;
    }

    saveUserInfo();

    // Pass the selected address object directly
    let selectedAddressObj = null;
    if (deliveryMethod === "home") {
      selectedAddressObj =
        addresses.find((a) => a.id === selectedAddress) || null;
    }

    // Pass cart data and user info to billing without creating order yet
    navigate("/user/billing", {
      state: {
        cartItems,
        userInfo,
        deliveryMethod,
        selectedAddress: selectedAddressObj,
        total,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#FF6A00] flex flex-col">
      <main className="flex-1 px-8 py-12 text-white">
        <h1 className="text-3xl text-center font-bold mb-1">Checkout</h1>
        <p className="text-sm text-center mb-8">Complete your order details</p>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: User Info, Address, Delivery Method */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Information */}
            <DarkCard>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FaUser /> User Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold">Full Name</label>
                  <input
                    type="text"
                    value={userInfo.fullName}
                    onChange={(e) =>
                      handleUserInfoChange("fullName", e.target.value)
                    }
                    className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold">Email Address</label>
                  <input
                    type="email"
                    value={userInfo.email}
                    onChange={(e) =>
                      handleUserInfoChange("email", e.target.value)
                    }
                    className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold">Phone Number</label>
                  <input
                    type="tel"
                    value={userInfo.phone}
                    onChange={(e) =>
                      handleUserInfoChange("phone", e.target.value)
                    }
                    className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
                  />
                </div>
              </div>
            </DarkCard>

            {/* Delivery Method */}
            <DarkCard>
              <h3 className="font-semibold mb-4">Delivery Method</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="delivery"
                    value="home"
                    checked={deliveryMethod === "home"}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="text-orange-600"
                  />
                  <FaTruck className="text-orange-600" />
                  <span>Home Delivery</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="delivery"
                    value="pickup"
                    checked={deliveryMethod === "pickup"}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="text-orange-600"
                  />
                  <FaShoppingBag className="text-orange-600" />
                  <span>Pickup from Restaurant</span>
                </label>
              </div>
            </DarkCard>

            {/* Delivery Address - Only show if home delivery */}
            {deliveryMethod === "home" && (
              <DarkCard>
                <h3 className="font-semibold mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FaMapMarkerAlt /> Delivery Address
                  </span>
                  <button
                    onClick={handleUseCurrentLocation}
                    className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 flex items-center justify-center gap-2"
                  >
                    <FaLocationArrow /> Use Current Location
                  </button>
                </h3>
                <div className="space-y-3">
                  <h4 className="font-semibold">Saved Addresses</h4>
                  {addresses.map((addr) => (
                    <div key={addr.id} className="flex items-start gap-3">
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input
                          type="radio"
                          name="address"
                          value={addr.id}
                          checked={selectedAddress === addr.id}
                          onChange={(e) => setSelectedAddress(e.target.value)}
                          className="text-orange-600"
                        />
                        <div>
                          <span className="font-semibold">{addr.label}</span>
                          {addr.isDefault && (
                            <span className="text-orange-600 text-sm ml-2">
                              (Default)
                            </span>
                          )}
                          <p className="text-sm text-gray-300">{addr.address}</p>
                        </div>
                      </label>
                      <div className="flex items-center gap-2">
                        {editingAddressId === addr.id && editingAddress ? (
                          <>
                            <button
                              onClick={() => handleSaveEditedAddress(addr.id)}
                              className="bg-orange-600 text-white px-2 py-1 rounded text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-sm text-white px-2 py-1"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditClick(addr)}
                              className="text-sm text-white px-2 py-1 border border-white rounded"
                            >
                              Edit
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {editingAddressId && editingAddress && (
                    <div className="bg-[#1a1209] p-3 rounded mt-3 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editingAddress.label}
                          onChange={(e) =>
                            setEditingAddress((prev) => ({ ...prev, label: e.target.value }))
                          }
                          className="bg-[#2a1f0f] rounded px-3 py-2 text-white"
                        />
                        <input
                          type="text"
                          value={editingAddress.addressLine1}
                          onChange={(e) =>
                            setEditingAddress((prev) => ({ ...prev, addressLine1: e.target.value }))
                          }
                          className="bg-[#2a1f0f] rounded px-3 py-2 text-white"
                        />
                        <input
                          type="text"
                          value={editingAddress.city}
                          onChange={(e) =>
                            setEditingAddress((prev) => ({ ...prev, city: e.target.value }))
                          }
                          className="bg-[#2a1f0f] rounded px-3 py-2 text-white"
                        />
                        <input
                          type="text"
                          value={editingAddress.postalCode}
                          onChange={(e) =>
                            setEditingAddress((prev) => ({ ...prev, postalCode: e.target.value }))
                          }
                          className="bg-[#2a1f0f] rounded px-3 py-2 text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEditedAddress(editingAddressId)}
                          className="bg-orange-600 text-white px-3 py-2 rounded"
                        >
                          Save
                        </button>
                        <button onClick={handleCancelEdit} className="px-3 py-2 rounded border border-white">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setShowAddAddress(!showAddAddress)}
                    className="text-orange-600 hover:text-orange-700 text-sm"
                  >
                    + Add New Address
                  </button>
                  {showAddAddress && (
                    <div className="bg-[#2a1f0f] p-4 rounded mt-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Label (e.g., Home, Work)"
                          value={newAddress.label}
                          onChange={(e) =>
                            setNewAddress((prev) => ({
                              ...prev,
                              label: e.target.value,
                            }))
                          }
                          className="bg-[#1a1209] rounded px-3 py-2 text-white"
                        />
                        <input
                          type="text"
                          placeholder="Address Line 1"
                          value={newAddress.addressLine1}
                          onChange={(e) =>
                            setNewAddress((prev) => ({
                              ...prev,
                              addressLine1: e.target.value,
                            }))
                          }
                          className="bg-[#1a1209] rounded px-3 py-2 text-white"
                        />
                        {/* Address Line 2 removed — use Address Line 1 + City + Postal Code */}
                        <input
                          type="text"
                          placeholder="City"
                          value={newAddress.city}
                          onChange={(e) =>
                            setNewAddress((prev) => ({
                              ...prev,
                              city: e.target.value,
                            }))
                          }
                          className="bg-[#1a1209] rounded px-3 py-2 text-white"
                        />
                        <input
                          type="text"
                          placeholder="Postal Code"
                          value={newAddress.postalCode}
                          onChange={(e) =>
                            setNewAddress((prev) => ({
                              ...prev,
                              postalCode: e.target.value,
                            }))
                          }
                          className="bg-[#1a1209] rounded px-3 py-2 text-white"
                        />
                        <textarea
                          placeholder="Delivery Instructions (optional)"
                          value={newAddress.instructions}
                          onChange={(e) =>
                            setNewAddress((prev) => ({
                              ...prev,
                              instructions: e.target.value,
                            }))
                          }
                          className="bg-[#1a1209] rounded px-3 py-2 text-white md:col-span-2"
                          rows="2"
                        />
                      </div>
                      <button
                        onClick={handleAddAddress}
                        className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                      >
                        Add Address
                      </button>
                    </div>
                  )}
                </div>
              </DarkCard>
            )}
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
                <div className="flex justify-between font-bold text-lg border-t border-[#5a3f1a] pt-2">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </DarkCard>

            {/* Navigation Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => navigate("/user/cart")}
                className="w-full bg-transparent border border-white text-white px-4 py-3 rounded hover:bg-white hover:text-[#FF6A00] flex items-center justify-center gap-2"
              >
                <FaArrowLeft /> Back to Cart
              </button>
              <button
                onClick={handleProceedToBilling}
                className="w-full bg-orange-600 text-white px-4 py-3 rounded hover:bg-orange-700 flex items-center justify-center gap-2"
              >
                <FaCreditCard /> Proceed to Billing
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
