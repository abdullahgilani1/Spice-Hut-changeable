import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiAlertCircle } from "react-icons/fi";
import { FaLocationArrow } from "react-icons/fa";
// background image moved to public/media
const loginImg = "/media/login.jpg";
import { authAPI } from "../services/api";
import PasswordInput from "../User-Frontend/components/PasswordInput";
import { validatePassword } from "../User-Frontend/utils/passwordUtils";
import { getCurrentLocation } from "../User-Frontend/utils/geolocation";
import OtpModal from './components/OtpModal';

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [otpMethod, setOtpMethod] = useState('email');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [modalEmail, setModalEmail] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalOtpMethod, setModalOtpMethod] = useState('email');
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
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
  const [locationError, setLocationError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Validate password in real-time
    if (name === "password") {
      const errors = validatePassword(value);
      setPasswordErrors(errors);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate password criteria
    const passwordValidationErrors = validatePassword(formData.password);
    if (passwordValidationErrors.length > 0) {
      return setError("Please ensure your password meets all requirements.");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);

    try {
      // Use shared authAPI for user registration
      await authAPI.userSignup({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        otpMethod,
        role: "user",
      });
  // After successful registration, open the inline OTP modal so user can verify immediately
  setModalEmail(formData.email);
  setModalPhone(formData.phone);
  setModalOtpMethod(otpMethod);
  setShowOtpModal(true);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to register"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const email = formData.email;
    if (!email)
      return setResendMessage(
        "Please enter your email above to resend verification."
      );
    setResendLoading(true);
    setResendMessage("");
    try {
      await authAPI.resendVerification({ email });
      setResendMessage("Verification code sent. Check your email.");
    } catch (err) {
      setResendMessage(
        err.response?.data?.message || err.message || "Failed to resend"
      );
    } finally {
      setResendLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    setLocationError("");
    getCurrentLocation(
      (addressData) => {
        setNewAddress((prev) => ({
          ...prev,
          addressLine1: addressData.addressLine1 || prev.addressLine1,
          city: addressData.city || prev.city,
          postalCode: addressData.postalCode || prev.postalCode,
          latitude: addressData.latitude,
          longitude: addressData.longitude,
        }));
      },
      (errorMessage) => {
        setLocationError(errorMessage);
      }
    );
  };

  const handleSaveNewAddress = () => {
    if (
      !newAddress.label ||
      !newAddress.addressLine1 ||
      !newAddress.city ||
      !newAddress.postalCode
    ) {
      alert("Please fill in all required fields.");
      return;
    }
    // Store in localStorage as pendingAddress
    localStorage.setItem("pendingAddress", JSON.stringify(newAddress));
    // Reset form and hide
    setNewAddress({
      label: "",
      addressLine1: "",
      city: "",
      postalCode: "",
      instructions: "",
      latitude: null,
      longitude: null,
    });
    setLocationError("");
    setShowAddAddress(false);
    alert(
      "Address saved! It will be added to your profile after registration."
    );
  };

  return (
    <div className="min-h-screen relative">
      <img
        src={loginImg}
        alt="Background"
        className="absolute inset-0 w-full h-full object-fill filter brightness-50"
      />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4">
              <FiUser className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-orange-500 mb-2">
              Create Account
            </h2>
            <p className="text-white">Create your restaurant account</p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100"
          >
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <FiAlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
              </div>

                {/* OTP Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred verification method
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="otpMethod"
                        value="email"
                        checked={otpMethod === 'email'}
                        onChange={() => setOtpMethod('email')}
                        className="form-radio"
                      />
                      <span className="text-sm">Email</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="otpMethod"
                        value="sms"
                        checked={otpMethod === 'sms'}
                        onChange={() => setOtpMethod('sms')}
                        className="form-radio"
                      />
                      <span className="text-sm">SMS (to phone)</span>
                    </label>
                  </div>
                </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <PasswordInput
                  value={formData.password}
                  onChange={(e) => handleChange(e)}
                  placeholder="Password"
                  errors={passwordErrors}
                  name="password"
                  required
                />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm Password
                </label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm Password"
                  showStrengthMeter={false}
                  required
                />
              </div>

              {/* Add Address Button */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200"
                >
                  {showAddAddress ? "Hide Address Form" : "Add Address"}
                </button>
              </div>

              {/* Address Form */}
              {showAddAddress && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Add Delivery Address
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
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
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      required
                    />

                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <FaLocationArrow className="text-sm" /> Use My Current
                      Location
                    </button>

                    {locationError && (
                      <div className="text-red-600 text-sm">
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
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      required
                    />

                    <div className="grid grid-cols-2 gap-4">
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
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        required
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
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        required
                      />
                    </div>

                    <textarea
                      placeholder="Delivery Instructions (optional)"
                      value={newAddress.instructions}
                      onChange={(e) =>
                        setNewAddress((prev) => ({
                          ...prev,
                          instructions: e.target.value,
                        }))
                      }
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      rows="2"
                    />

                    <button
                      type="button"
                      onClick={handleSaveNewAddress}
                      className="w-full bg-green-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200"
                    >
                      Save Address
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Registering...
                  </div>
                ) : (
                  "Register"
                )}
              </button>
            </div>

            {/* Links */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                className="text-sm text-orange-600 hover:text-orange-500"
              >
                {resendLoading ? "Sending..." : "Resend verification code"}
              </button>
              {resendMessage && (
                <div className="text-xs text-white mt-2">{resendMessage}</div>
              )}
            </div>
          </form>
          {showOtpModal && (
            <OtpModal
              email={modalEmail}
              phone={modalPhone}
              otpMethod={modalOtpMethod}
              onClose={() => setShowOtpModal(false)}
              onVerified={() => {
                setShowOtpModal(false);
                // after verification redirect to login
                navigate('/login');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
