import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showSearch, _setShowSearch] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleProfilePage = () => {
    setShowDropdown(false);
    navigate("/user/profile");
  };

  const handleNavClick = () => {
    setShowMobileMenu(false);
  };

  const handleCartClick = () => {
    navigate("/user/cart");
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
    setShowDropdown(false);
  };

  return (
    <header className="bg-black shadow-md">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        {/* Main Header Row */}
        <div className="flex items-center justify-between">
          {/* Left: Restaurant Name and Mobile Menu Button */}
          <div className="flex items-center space-x-2">
            {/* Mobile Menu Button - Mobile Only */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden text-white hover:text-[#FF6A00] transition p-1"
              aria-label="Menu"
            >
              {showMobileMenu ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
            <div className="text-xl sm:text-2xl font-bold text-white whitespace-nowrap">
              Spice Hut
            </div>
          </div>

          {/* Center: Navigation Links - Desktop Only */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-10">
            <button
              onClick={() => navigate("intro")}
              className="text-white hover:text-[#FF6A00] transition text-sm xl:text-base"
            >
              Intro
            </button>
            <button
              onClick={() => navigate("home")}
              className="text-white hover:text-[#FF6A00] transition text-sm xl:text-base"
            >
              Home
            </button>
            <button
              onClick={() => navigate("menu")}
              className="text-white hover:text-[#FF6A00] transition text-sm xl:text-base"
            >
              Menu
            </button>
            <button
              onClick={() => navigate("support")}
              className="text-white hover:text-[#FF6A00] transition text-sm xl:text-base"
            >
              Support
            </button>
          </nav>

          {/* Right: Icons */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={handleCartClick}
              className="text-white hover:text-[#FF6A00] transition p-1"
              aria-label="Cart"
            >
              <svg
                className="w-5 h-5 sm:w-[22px] sm:h-[22px]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleProfileClick}
                className="text-white hover:text-[#FF6A00] focus:outline-none transition p-1"
                aria-label="Profile"
              >
                <svg
                  className="w-5 h-5 sm:w-[22px] sm:h-[22px]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
                  {/*<div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>*/}
                  <button
                    onClick={handleProfilePage}
                    className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
                  >
                    Profile
                  </button>
                  <div className="px-4 py-2 border-t border-gray-200">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left text-sm text-gray-800 hover:text-red-600 transition"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="mt-3 w-full">
            <input
              type="text"
              placeholder="Search..."
              className="w-full sm:max-w-md lg:max-w-sm px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
            />
          </div>
        )}

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <nav className="lg:hidden mt-4 pb-2 border-t border-gray-700 pt-4">
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  navigate("intro");
                  handleNavClick();
                }}
                className="text-white hover:text-[#FF6A00] transition py-2 text-left"
              >
                Intro
              </button>
              <button
                onClick={() => {
                  navigate("home");
                  handleNavClick();
                }}
                className="text-white hover:text-[#FF6A00] transition py-2 text-left"
              >
                Home
              </button>
              <button
                onClick={() => {
                  navigate("menu");
                  handleNavClick();
                }}
                className="text-white hover:text-[#FF6A00] transition py-2 text-left"
              >
                Menu
              </button>
              <button
                onClick={() => {
                  navigate("support");
                  handleNavClick();
                }}
                className="text-white hover:text-[#FF6A00] transition py-2 text-left"
              >
                Support
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
