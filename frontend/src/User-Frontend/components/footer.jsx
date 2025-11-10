import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-black text-white text-center py-6">
      <div className="container mx-auto px-4">
        <p className="text-sm md:text-base">
          &copy; 2025 Spice Hut. All rights reserved.
        </p>
        <div className="flex sm:flex-row justify-center items-center gap-4 sm:gap-6 md:gap-8 mt-4">
          <Link
            to="/user/about-us"
            className="hover:text-[#FF6A00] transition-colors text-sm md:text-base"
          >
            About Us
          </Link>
          <Link
            to="/user/contact"
            className="hover:text-[#FF6A00] transition-colors text-sm md:text-base"
          >
            Contact
          </Link>
          <Link
            to="/user/policies"
            className="hover:text-[#FF6A00] transition-colors text-sm md:text-base"
          >
            Policies
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
