import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiAlertCircle } from "react-icons/fi";
// background image moved to public/media
const loginImg = '/media/login.jpg';
import { authAPI } from "../services/api";
import PasswordInput from "../User-Frontend/components/PasswordInput";
import { validatePassword } from "../User-Frontend/utils/passwordUtils";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

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
        role: "user",
      });
      // After successful registration, redirect user to verification page (prefill email)
      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
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
    if (!email) return setResendMessage('Please enter your email above to resend verification.');
    setResendLoading(true);
    setResendMessage('');
    try {
      await authAPI.resendVerification({ email });
      setResendMessage('Verification code sent. Check your email.');
    } catch (err) {
      setResendMessage(err.response?.data?.message || err.message || 'Failed to resend');
    } finally {
      setResendLoading(false);
    }
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
                {resendLoading ? 'Sending...' : 'Resend verification code'}
              </button>
              {resendMessage && <div className="text-xs text-white mt-2">{resendMessage}</div>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
