import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiMail, FiLock, FiUser, FiAlertCircle } from "react-icons/fi";
// background image moved to public/media to avoid bundling large images
const loginImg = "/media/login.jpg";
import { useAuth } from "../contexts/AuthContext";
import PasswordInput from "../User-Frontend/components/PasswordInput";
import { authAPI } from "../services/api";

// removed unused imports: jwtDecode, authAPI (AuthContext provides login)

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Use only the AuthContext login function
      const result = await authLogin(email, password);
      if (result.success && result.user) {
        if (result.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/user/intro");
        }
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
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
              Welcome Back
            </h2>
            <p className="text-white">Sign in to your restaurant account</p>
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
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <PasswordInput
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  showStrengthMeter={false}
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>

            {/* Links */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                <Link
                  to="/forgot-password"
                  className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
                >
                  Forgot Password?
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

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
