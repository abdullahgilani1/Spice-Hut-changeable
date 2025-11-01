import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaClock,
  FaGift,
  FaHome,
  FaBriefcase,
  FaTrash,
  FaStar,
  FaMapMarkerAlt,
  FaRedo,
  FaLocationArrow,
} from "react-icons/fa";
import { useCart } from "../context.cart.jsx";
import { profileAPI, orderAPI, utilsAPI } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext.jsx";
import PasswordInput from "../components/PasswordInput";
import { validatePassword } from "../utils/passwordUtils";
import { FiEye, FiEyeOff } from "react-icons/fi";

const Profile = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getProfile: fetchAuthProfile } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [showAddresses, setShowAddresses] = useState(true);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(null);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "",
    addressLine1: "",
    city: "",
    postalCode: "",
    instructions: "",
    latitude: null,
    longitude: null,
  });
  const [locationError, setLocationError] = useState(null);

  const [loyaltyPoints, setLoyaltyPointsState] = useState(0);
  const nextRewardPoints = 100;
  const _totalOrders = orderHistory.length;
  const _totalSpent = orderHistory
    .reduce((acc, order) => acc + order.total, 0)
    .toFixed(2);
  const _favoriteItem = "Butter Chicken";

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Try to get profile from backend (requires token)
        let serverProfile = null;
        try {
          serverProfile = await profileAPI.getProfile();
        } catch {
          // fallback to AuthContext profile if available
          try {
            const authProfile = await fetchAuthProfile();
            serverProfile = authProfile || null;
          } catch {
            serverProfile = null;
          }
        }

        if (serverProfile && serverProfile._id) {
          // Map server shape to local profile fields
          const mapped = {
            firstName:
              serverProfile.name?.split(" ")?.[0] || serverProfile.name || "",
            lastName: serverProfile.name?.split(" ")?.slice(1).join(" ") || "",
            email: serverProfile.email || "",
            phone: serverProfile.phone || "",
            memberSince: serverProfile.createdAt
              ? new Date(serverProfile.createdAt).toLocaleDateString()
              : "—",
          };
          setProfile(mapped);
          setLoyaltyPointsState(serverProfile.loyaltyPoints || 0);
          setIsLoggedIn(true);
          // persist to localStorage for other pages
          localStorage.setItem(
            "userInfo",
            JSON.stringify({
              fullName: `${mapped.firstName} ${mapped.lastName}`.trim(),
              email: mapped.email,
              _id: serverProfile._id,
            })
          );
          // fetch orders from backend for this user
          try {
            const serverOrders = await orderAPI.getUserOrders();
            setOrderHistory(serverOrders || []);
          } catch (ordErr) {
            console.error("Failed to load orders from server", ordErr);
            // Do not fall back to localStorage; show empty history
            setOrderHistory([]);
          }

          // Fetch addresses from backend
          try {
            const serverAddresses = await profileAPI.getAddresses();
            setAddresses(
              serverAddresses.map((addr) => ({ ...addr, id: String(addr._id) }))
            );
          } catch (addrErr) {
            console.error("Failed to load addresses", addrErr);
          }
        } else {
          // No server profile - treat as logged out
          setIsLoggedIn(false);
          setOrderHistory([]);
          setProfile(null);
        }
      } catch (err) {
        console.error("Profile load error", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Toggle edit mode for personal information. When turning edit mode off
  // (i.e. user clicked Save), call handleSaveProfile to persist changes.
  const handleEditToggle = async () => {
    // If we are switching from editing -> not editing, save first
    if (isEditing) {
      try {
        await handleSaveProfile();
      } catch (err) {
        // handleSaveProfile already logs errors; keep editing mode if save failed
        console.error("Error saving profile during toggle", err);
        return;
      }
    }
    setIsEditing((prev) => !prev);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setError(null);
    setLoading(true);
    try {
      // Build payload (simple merge)
      const payload = {
        name: `${profile.firstName || ""} ${profile.lastName || ""}`.trim(),
        email: profile.email,
        phone: profile.phone,
      };
      const updated = await profileAPI.updateProfile(payload);
      if (updated) {
        // update local storage and state
        localStorage.setItem(
          "userInfo",
          JSON.stringify({ fullName: payload.name, email: payload.email })
        );
        // Optionally map updated response
        setProfile((prev) => ({ ...prev, memberSince: prev.memberSince }));
      }
    } catch (err) {
      console.error("Failed to save profile", err);
      setError(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    const errors = validatePassword(value);
    setPasswordErrors(errors);
  };

  const handleChangePassword = async () => {
    setPasswordChangeError(null);
    setPasswordChangeSuccess(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordChangeError("Please provide and confirm your new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError("Passwords do not match.");
      return;
    }
    // Validate password criteria
    const passwordValidationErrors = validatePassword(newPassword);
    if (passwordValidationErrors.length > 0) {
      setPasswordChangeError(
        "Please ensure your password meets all requirements."
      );
      return;
    }
    setPasswordChangeLoading(true);
    try {
      await profileAPI.changePassword({ currentPassword, newPassword });
      setPasswordChangeSuccess("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      setPasswordErrors([]);
      setShowChangePassword(false);
    } catch (err) {
      console.error("Failed to change password", err);
      setPasswordChangeError(
        err?.response?.data?.message || "Failed to update password."
      );
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleSetDefaultAddress = (id) => {
    // Update on server
    (async () => {
      try {
        // Find the address object
        const addr = addresses.find((a) => a.id === id);
        if (!addr) return;
        await profileAPI.updateAddress(id, {
          label: addr.label,
          address: addr.address,
          isDefault: true,
        });
        // Refresh addresses from server
        const serverAddresses = await profileAPI.getAddresses();
        setAddresses(serverAddresses.map((a) => ({ ...a, id: a._id })));
      } catch (err) {
        console.error("Failed to set default address", err);
        alert("Unable to set default address.");
      }
    })();
  };

  const handleDeleteAddress = (id) => {
    (async () => {
      try {
        await profileAPI.deleteAddress(id);
        const serverAddresses = await profileAPI.getAddresses();
        setAddresses(serverAddresses.map((a) => ({ ...a, id: a._id })));
      } catch (err) {
        console.error("Failed to delete address", err);
        alert("Unable to delete address.");
      }
    })();
  };

  const handleAddAddress = () => {
    setShowAddAddress(true);
  };

  const handleUseCurrentLocation = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        // Call server-side reverse geocode to get structured address
        try {
          const geo = await utilsAPI.reverseGeocode(latitude, longitude);
          // geo: { formattedAddress, city, province, postalCode, country, latitude, longitude }
          // Update the newAddress fields for quick add and also update user profile with currentLocation
          setNewAddress((prev) => ({
            ...prev,
            addressLine1: geo.formattedAddress || prev.addressLine1,
            city: geo.city || prev.city,
            postalCode: geo.postalCode || prev.postalCode,
            latitude,
            longitude,
          }));

          // Persist user's current coordinates to profile so backend can use them when placing orders
          try {
            await profileAPI.updateProfile({ currentLocation: { latitude, longitude } });
          } catch (upErr) {
            console.warn('Failed to save currentLocation to profile', upErr);
          }
        } catch (rgErr) {
          console.error('Reverse geocode failed', rgErr);
          const message = rgErr?.response?.data?.message || rgErr?.message || 'Unable to resolve your location to an address.';
          setLocationError(message + ' (reverse geocode)');
        }
      } catch (err) {
        console.error('Geolocation handling failed', err);
        setLocationError('Unable to read your location.');
      }
    }, (err) => {
      let message = 'Unable to get location, please enter your address manually.';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          message = 'Location access denied. Please allow location access and try again.';
          break;
        case err.POSITION_UNAVAILABLE:
          message = 'Location information is unavailable.';
          break;
        case err.TIMEOUT:
          message = 'Location request timed out.';
          break;
        default:
          break;
      }
      setLocationError(message);
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
  };

  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editingAddress, setEditingAddress] = useState(null);

  const handleSaveNewAddress = async () => {
    if (
      !newAddress.label ||
      !newAddress.addressLine1 ||
      !newAddress.city ||
      !newAddress.postalCode
    ) {
      alert("Please fill in all required fields.");
      return;
    }
    const fullAddress = `${newAddress.addressLine1}, ${newAddress.city}, ${newAddress.postalCode}`;
    try {
      const added = await profileAPI.addAddress({
        label: newAddress.label,
        address: fullAddress,
        city: newAddress.city,
        postalCode: newAddress.postalCode,
        isDefault: false,
        latitude: newAddress.latitude,
        longitude: newAddress.longitude,
      });
      setAddresses((prev) => [
        ...prev,
        { ...added.address, id: added.address._id },
      ]);
      setNewAddress({
        label: "",
        addressLine1: "",
        city: "",
        postalCode: "",
        instructions: "",
        latitude: null,
        longitude: null,
      });
      setLocationError(null);
      setShowAddAddress(false);
    } catch (err) {
      console.error("Failed to add address", err);
      alert("Failed to add address. Please try again.");
    }
  };

  const handleEditClick = (addr) => {
    setEditingAddressId(addr.id);
    // split address into components if saved as single string
    const parts = (addr.address || "").split(",").map((p) => p.trim());
    const [line1 = "", city = "", postalCode = ""] = parts;
    setEditingAddress({
      label: addr.label || "",
      addressLine1: line1,
      city,
      postalCode,
    });
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
      setAddresses(serverAddresses.map((a) => ({ ...a, id: a._id })));
      setEditingAddressId(null);
      setEditingAddress(null);
    } catch (err) {
      console.error('Failed to update address', err);
      alert('Failed to update address.');
    }
  };

  const handleClearOrderHistory = () => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    if (userInfo.email) {
      localStorage.removeItem(`orders_${userInfo.email}`);
      setOrderHistory([]);
    }
  };

  const _handleAddressChange = (id, field, value) => {
    setAddresses((prev) =>
      prev.map((addr) => (addr.id === id ? { ...addr, [field]: value } : addr))
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading profile...
      </div>
    );
  if (!isLoggedIn)
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-500 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Not signed in</h2>
          <p className="mb-6">
            Please sign in to view and manage your profile and orders.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-orange-600 rounded"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-4 py-2 border border-white rounded"
            >
              Register
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-orange-500 flex flex-col">
      <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 text-white font-sans">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl text-center font-bold mb-1">
            My Profile
          </h1>
          <p className="mb-4 sm:mb-6 text-center text-xs sm:text-sm">
            Manage your account settings and preferences
          </p>

          {/* Personal Information */}
          <div className="bg-[#3c2a1a] rounded-lg p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                <FaUser className="text-sm sm:text-base" /> Personal Information
              </h2>
              <button
                onClick={handleEditToggle}
                className="bg-orange-600 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-orange-700"
              >
                {isEditing ? "Save" : "Edit"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* First Name */}
              <div>
                <label className="text-xs font-semibold">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleProfileChange}
                    className="w-full bg-[#4a3a2a] rounded px-2 py-1 text-white text-sm min-h-[2rem]"
                    placeholder="First Name"
                  />
                ) : (
                  <p className="bg-[#4a3a2a] rounded px-2 py-1 text-sm text-white min-h-[2rem] flex items-center">
                    {profile.firstName || (
                      <span className="text-gray-400">First Name</span>
                    )}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="text-xs font-semibold">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={profile.lastName}
                    onChange={handleProfileChange}
                    className="w-full bg-[#4a3a2a] rounded px-2 py-1 text-white text-sm min-h-[2rem]"
                    placeholder="Last Name"
                  />
                ) : (
                  <p className="bg-[#4a3a2a] rounded px-2 py-1 text-sm text-white min-h-[2rem] flex items-center">
                    {profile.lastName || (
                      <span className="text-gray-400">Last Name</span>
                    )}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold flex items-center gap-1">
                  <FaEnvelope className="text-xs" /> Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    className="w-full bg-[#4a3a2a] rounded px-2 py-1 text-white text-sm min-h-[2rem]"
                    placeholder="Email"
                  />
                ) : (
                  <p className="bg-[#4a3a2a] rounded px-2 py-1 text-sm text-white min-h-[2rem] flex items-center break-all">
                    {profile.email || (
                      <span className="text-gray-400">Email</span>
                    )}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold flex items-center gap-1">
                  <FaPhone className="text-xs" /> Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    className="w-full bg-[#4a3a2a] rounded px-2 py-1 text-white min-h-[2rem] text-sm"
                    placeholder="Phone Number"
                  />
                ) : (
                  <p className="bg-[#4a3a2a] rounded px-2 py-1 text-sm text-white min-h-[2rem] flex items-center">
                    {profile.phone || (
                      <span className="text-gray-400">Phone Number</span>
                    )}
                  </p>
                )}
              </div>

              {/* Member Since */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold flex items-center gap-1">
                  <FaClock className="text-xs" /> Member Since
                </label>
                <p className="bg-[#4a3a2a] rounded px-2 py-1 text-sm text-white min-h-[2rem] flex items-center">
                  {profile.memberSince || (
                    <span className="text-gray-400">N/A</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Delivery Addresses */}
              <div className="bg-[#3c2a1a] rounded-lg p-3 sm:p-4 shadow-md">
                <div
                  className="flex justify-between items-center cursor-pointer mb-2"
                  onClick={() => setShowAddresses(!showAddresses)}
                >
                  <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                    <FaEnvelope className="text-sm sm:text-base" /> Delivery
                    Addresses ({addresses.length})
                  </h3>
                  <span className="text-sm sm:text-base">
                    {showAddresses ? "▲" : "▼"}
                  </span>
                </div>
                {showAddresses && (
                  <div>
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="border border-[#5a3f1a] rounded p-2 sm:p-3 mb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm sm:text-base font-semibold">
                              {addr.label}
                            </span>
                            {addr.isDefault && (
                              <span className="bg-red-700 text-xs px-2 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>

                          {editingAddressId === addr.id && editingAddress ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingAddress.label}
                                onChange={(e) =>
                                  setEditingAddress((prev) => ({
                                    ...prev,
                                    label: e.target.value,
                                  }))
                                }
                                className="bg-[#1a1209] rounded px-3 py-2 text-white mb-1"
                              />
                              <input
                                type="text"
                                value={editingAddress.addressLine1}
                                onChange={(e) =>
                                  setEditingAddress((prev) => ({
                                    ...prev,
                                    addressLine1: e.target.value,
                                  }))
                                }
                                className="bg-[#1a1209] rounded px-3 py-2 text-white mb-1"
                              />
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={editingAddress.city}
                                  onChange={(e) =>
                                    setEditingAddress((prev) => ({
                                      ...prev,
                                      city: e.target.value,
                                    }))
                                  }
                                  className="bg-[#1a1209] rounded px-3 py-2 text-white flex-1"
                                />
                                <input
                                  type="text"
                                  value={editingAddress.postalCode}
                                  onChange={(e) =>
                                    setEditingAddress((prev) => ({
                                      ...prev,
                                      postalCode: e.target.value,
                                    }))
                                  }
                                  className="bg-[#1a1209] rounded px-3 py-2 text-white w-32"
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm break-words">{addr.address}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 justify-end sm:justify-start">
                          {editingAddressId === addr.id ? (
                            <>
                              <button
                                onClick={() => handleSaveEditedAddress(addr.id)}
                                className="bg-orange-600 text-xs px-2 py-1 rounded hover:bg-orange-700 whitespace-nowrap"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-300 text-xs px-2 py-1 rounded"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              {!addr.isDefault && (
                                <button
                                  onClick={() => handleSetDefaultAddress(addr.id)}
                                  className="bg-orange-600 text-xs px-2 py-1 rounded hover:bg-orange-700 whitespace-nowrap"
                                >
                                  Set Default
                                </button>
                              )}
                              <button
                                onClick={() => handleEditClick(addr)}
                                className="text-white text-xs px-2 py-1 rounded border border-white"
                                title="Edit Address"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Delete Address"
                              >
                                <FaTrash className="text-sm sm:text-base" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
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
                          <div className="md:col-span-2 flex gap-2">
                            <button
                              onClick={handleUseCurrentLocation}
                              className="bg-orange-600 text-white px-3 py-2 rounded hover:bg-orange-700 flex items-center gap-2 text-sm"
                            >
                              <FaLocationArrow className="text-xs" /> Use My
                              Current Location
                            </button>
                          </div>
                          {locationError && (
                            <div className="md:col-span-2 text-red-400 text-sm">
                              {locationError}
                            </div>
                          )}
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
                          {/* Address Line 2 removed - use Address Line 1 + City + Postal Code */}
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
                          onClick={handleSaveNewAddress}
                          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                        >
                          Add Address
                        </button>
                      </div>
                    )}
                    <button
                      onClick={handleAddAddress}
                      className="w-full bg-orange-600 text-xs sm:text-sm py-2 rounded hover:bg-orange-700"
                    >
                      + Add New Address
                    </button>
                  </div>
                )}
              </div>

              {/* Order History */}
              <div className="bg-[#3c2a1a] rounded-lg p-3 sm:p-4 shadow-md">
                <div
                  className="flex justify-between items-center cursor-pointer mb-2"
                  onClick={() => setShowOrderHistory(!showOrderHistory)}
                >
                  <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                    <FaEnvelope className="text-sm sm:text-base" /> Order
                    History ({orderHistory.length})
                  </h3>
                  <span className="text-sm sm:text-base">
                    {showOrderHistory ? "▲" : "▼"}
                  </span>
                </div>
                {showOrderHistory && (
                  <div className="max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-600 scrollbar-track-[#3c2a1a]">
                    <div>
                      {isLoggedIn ? (
                        orderHistory.length > 0 ? (
                          <>
                            {/*    <button
                            onClick={handleClearOrderHistory}
                            className="w-full bg-red-600 text-white text-xs sm:text-sm py-2 rounded hover:bg-red-700 mb-3"
                          >
                            Clear All Orders
                          </button> */}
                            {orderHistory.map((order) => (
                              <div
                                key={order.orderId || order._id || order.id}
                                className="border border-[#5a3f1a] rounded p-2 sm:p-3 mb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2"
                              >
                                <div className="flex-1">
                                  <p className="text-xs sm:text-sm font-semibold">
                                    Order ID: {order.orderId}
                                  </p>
                                  <p className="text-xs sm:text-sm font-semibold">
                                    Order Date:{" "}
                                    {new Date(
                                      order.createdAt
                                    ).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs sm:text-sm break-words">
                                    Items:{" "}
                                    {order.items
                                      .map((item) => item.name)
                                      .join(", ")}
                                  </p>
                                  <p className="text-xs sm:text-sm font-semibold">
                                    Total: ${order.total.toFixed(2)}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    order.items.forEach((item) =>
                                      addToCart(item)
                                    );
                                    navigate("/user/cart");
                                  }}
                                  className="bg-orange-600 text-white text-xs sm:text-sm px-3 py-1 rounded hover:bg-orange-700 flex items-center gap-1 justify-center whitespace-nowrap"
                                >
                                  <FaRedo className="text-xs" /> Reorder
                                </button>
                              </div>
                            ))}
                          </>
                        ) : (
                          <p className="text-xs sm:text-sm text-gray-400">
                            No orders yet. Start ordering to see your history!
                          </p>
                        )
                      ) : (
                        <p className="text-xs sm:text-sm text-gray-400">
                          Please log in to view your order history.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Loyalty Points */}
              <div className="bg-[#3c2a1a] rounded-lg p-3 sm:p-4 shadow-md text-center">
                <h3 className="text-sm sm:text-base font-semibold flex items-center justify-center gap-2 mb-4">
                  <FaGift className="text-sm sm:text-base" /> Loyalty Points
                </h3>
                <div className="bg-red-900 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex flex-col justify-center items-center mx-auto mb-4">
                  <FaStar className="text-yellow-400 text-lg sm:text-xl" />
                  <span className="text-white font-bold text-base sm:text-lg">
                    {loyaltyPoints}
                  </span>
                  <span className="text-xs">Points</span>
                </div>
                <div className="bg-[#4a3a2a] rounded p-2 mb-2 text-xs">
                  <p className="font-semibold">Next Reward</p>
                  <p>100 points until $1 off your next order</p>
                  <div className="bg-gray-600 rounded h-2 mt-1">
                    <div
                      className="bg-red-900 h-2 rounded"
                      style={{
                        width: `${
                          (loyaltyPoints / (loyaltyPoints + nextRewardPoints)) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
                <ul className="text-xs text-left mb-2 space-y-1">
                  <li>• Earn 1 point per $1 spent</li>
                  <li>• 100 points = $1 discount</li>
                  <li>• Points never expire</li>
                </ul>
              </div>
              {/* Change Password */}
              <div className="bg-[#3c2a1a] rounded-lg p-3 sm:p-4 shadow-md">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
                    <FaBriefcase className="text-sm sm:text-base" /> Change
                    Password
                  </h3>
                  <button
                    onClick={() => setShowChangePassword((prev) => !prev)}
                    className="text-xs bg-orange-600 px-2 py-1 rounded hover:bg-orange-700"
                  >
                    {showChangePassword ? "Close" : "Open"}
                  </button>
                </div>
                {showChangePassword && (
                  <div className="space-y-3">
                    {passwordChangeError && (
                      <div className="text-red-400 text-xs">
                        {passwordChangeError}
                      </div>
                    )}
                    {passwordChangeSuccess && (
                      <div className="text-green-400 text-xs">
                        {passwordChangeSuccess}
                      </div>
                    )}
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-[#4a3a2a] rounded px-2 py-2 pr-10 text-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? (
                          <FiEyeOff className="h-4 w-4" />
                        ) : (
                          <FiEye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="New password"
                        value={newPassword}
                        onChange={handleNewPasswordChange}
                        className="w-full bg-[#4a3a2a] rounded px-2 py-2 pr-10 text-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? (
                          <FiEyeOff className="h-4 w-4" />
                        ) : (
                          <FiEye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.length > 0 && (
                      <div className="text-red-400 text-xs">
                        {passwordErrors.map((error, index) => (
                          <p key={index}>{error}</p>
                        ))}
                      </div>
                    )}
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#4a3a2a] rounded px-2 py-2 pr-10 text-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <FiEyeOff className="h-4 w-4" />
                        ) : (
                          <FiEye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <button
                      onClick={handleChangePassword}
                      disabled={passwordChangeLoading}
                      className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700"
                    >
                      {passwordChangeLoading
                        ? "Updating..."
                        : "Update Password"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
