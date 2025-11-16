import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiMail,
  FiPhone,
  FiLock,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
// large background image moved to public/media
const loginImg = '/media/logo.jpg';
import { authAPI } from "../services/api";
import PasswordInput from "../User-Frontend/components/PasswordInput";
import { validatePassword } from "../User-Frontend/utils/passwordUtils";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [otpMethod, setOtpMethod] = useState('email');
  const [sendingOtp, setSendingOtp] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await authAPI.verifyUser({ email, phone });
      setIsVerified(true);
      setSuccess("Verification successful. You can now reset your password.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Verification failed. Please check your email and phone number."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email) return setError('Please provide your email to send verification code');
    setSendingOtp(true);
    setError('');
    setSuccess('');
    try {
      await authAPI.resendVerification({ email, phone, otpMethod });
      setSuccess(`Verification code sent via ${otpMethod.toUpperCase()}.`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send verification code');
    } finally {
      setSendingOtp(false);
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    const errors = validatePassword(value);
    setPasswordErrors(errors);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    // Validate password criteria
    const passwordValidationErrors = validatePassword(password);
    if (passwordValidationErrors.length > 0) {
      setError("Please ensure your password meets all requirements.");
      return;
    }
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await authAPI.resetPassword({ email, phone, newPassword: password });
      setSuccess(
        "Password has been reset successfully! You can now log in with your new password."
      );
      // Optionally, redirect to login after a delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed.");
    } finally {
      setIsLoading(false);
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
          <div className="text-center">
            <h2 className="text-3xl font-bold text-orange-500 mb-2">
              Forgot Password
            </h2>
            <p className="text-white">Reset your password</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                <FiAlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                <FiCheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-700 text-sm">{success}</span>
              </div>
            )}

            {!isVerified ? (
              <form onSubmit={handleVerify} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>
                {/* OTP method selection and send button */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verification method</label>
                  <div className="flex items-center gap-4 mb-2">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="otpMethod" value="email" checked={otpMethod === 'email'} onChange={() => setOtpMethod('email')} />
                      <span className="text-sm">Email</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="otpMethod" value="sms" checked={otpMethod === 'sms'} onChange={() => setOtpMethod('sms')} />
                      <span className="text-sm">SMS</span>
                    </label>
                  </div>
                  <div>
                    <button type="button" onClick={handleSendOtp} disabled={sendingOtp} className="w-full bg-orange-500 text-white py-2 rounded">
                      {sendingOtp ? 'Sending...' : 'Send verification code'}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                >
                  {isLoading ? "Verifying..." : "Verify"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    New Password
                  </label>
                  <PasswordInput
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    errors={passwordErrors}
                    name="password"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      id="confirmNewPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                >
                  {isLoading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Remember your password?{" "}
                <Link
                  to="/login"
                  className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
                >
                  Back to Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
