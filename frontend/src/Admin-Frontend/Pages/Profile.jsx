
import React, { useState, useEffect } from "react";
import { FiSave, FiUser, FiMail, FiLock, FiEdit3, FiCamera, FiPhone } from "react-icons/fi";
import { profileAPI } from "../../services/api";

export default function AdminProfile() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [_loading, setLoading] = useState(false);
  const [_error, setError] = useState("");

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
  const data = await profileAPI.getProfile();
  setFormData((prev) => ({ ...prev, name: data.name, email: data.email, phone: data.phone || '' }));
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    setLoading(true);
    setError("");
      try {
      await profileAPI.updateProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password || undefined,
      });
      alert("Profile updated successfully!");
      setIsEditing(false);
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch {
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4 md:p-8 lg:p-12 font-sans min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Admin Profile
          </h1>
          <p className="text-gray-600 text-lg">Manage your account settings and personal information</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 flex items-center shadow-lg"
        >
          <FiEdit3 className="mr-2" />
          {isEditing ? 'Cancel Edit' : 'Edit Profile'}
        </button>
      </div>

      {/* Profile Card */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-8 text-white relative">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative flex items-center">
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-gray-800 shadow-lg">
                  {formData.name.charAt(0)}
                </div>
                <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors">
                  <FiCamera className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="ml-6">
                <h2 className="text-2xl font-bold">{formData.name}</h2>
                <p className="text-blue-100 flex items-center">
                  <FiMail className="mr-2" />
                  {formData.email}
                </p>
                <p className="text-sm text-blue-100 mt-1">Administrator</p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Personal Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FiUser className="mr-2 text-gray-500" />
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                          isEditing
                            ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FiMail className="mr-2 text-gray-500" />
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                          isEditing
                            ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                        }`}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FiPhone className="mr-2 text-gray-500" />
                        Phone Number
                      </label>
                      <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                          isEditing
                            ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    Security Settings
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FiLock className="mr-2 text-gray-500" />
                        New Password
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Enter new password" : "••••••••"}
                        className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                          isEditing
                            ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'
                            : 'border-gray-200 bg-gray-50 text-gray-400'
                        }`}
                      />
                      {!isEditing && (
                        <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FiLock className="mr-2 text-gray-500" />
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder={isEditing ? "Confirm new password" : "••••••••"}
                        className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                          isEditing
                            ? 'border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'
                            : 'border-gray-200 bg-gray-50 text-gray-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center shadow-lg font-semibold"
                  >
                    <FiSave className="mr-2" />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-8 py-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
