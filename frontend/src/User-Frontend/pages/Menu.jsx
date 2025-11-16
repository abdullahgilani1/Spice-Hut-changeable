import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { categoryAPI, menuAPI } from "../../services/api";
import { useCart } from "../context.cart";
import { FaSearch } from 'react-icons/fa';

const tagColors = {
  GF: "bg-green-600",
  LF: "bg-blue-600",
};

const Menu = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [itemQuantities, setItemQuantities] = useState({});
  const searchInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const cats = await categoryAPI.getCategories();
        if (Array.isArray(cats) && cats.length) {
          const API_BASE = "http://localhost:5000//api";
          // map to the same shape as static menuCategories where possible
          const mapped = cats.map((c) => {
            let img = c.image || "/home.jpg";
            // If image is stored as an uploads path like '/uploads/...' prepend API base so browser can load it
            if (typeof img === "string" && img.startsWith("/uploads"))
              img = `${API_BASE}${img}`;
            return {
              name: c.name,
              image: img,
              desc: c.description || "",
              slug: c.slug,
              subCategory: c.subCategory || "",
              _id: c._id,
            };
          });
          setCategories(mapped);
        }
      } catch (err) {
        console.warn("Failed to load categories from server", err);
      }
    })();
  }, []);

  // Handle search
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults(null);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await menuAPI.searchMenu(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.warn("Search failed", err);
        setSearchResults({ categories: [], items: [] });
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300); // Debounce search
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  // Handle quantity changes for items
  const handleQuantityChange = (itemId, delta) => {
    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: Math.max(1, (prev[itemId] || 1) + delta),
    }));
  };

  // Determine what to display
  const displayCategories = searchResults
    ? searchResults.categories
    : categories;
  // Filter items to show only "Available" status
  const displayItems = searchResults
    ? searchResults.items.filter((item) => item.status === "Available")
    : [];

  // Helper to get item image
  const getItemImage = (item) => {
    const API_BASE = "http://localhost:5000/api";
    if (item.image && item.image.startsWith("/uploads")) {
      return `${API_BASE}${item.image}`;
    }
    return "/home.jpg"; // fallback
  };

  return (
    <div className="min-h-screen bg-[#FF6A00] flex flex-col">
      <main className="flex-1 py-6 sm:py-8 md:py-12 px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-white mb-2">
          Explore Our Menu
        </h1>
        <p className="text-center text-white text-sm sm:text-base md:text-lg mb-6 sm:mb-8 md:mb-10 px-2">
          Select a category to discover our delicious offerings
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8 relative">
          <button
            type="button"
            onClick={() => searchInputRef.current?.focus()}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            aria-label="Focus search input"
          >
            <FaSearch />
          </button>
          <input
            type="text"
            placeholder="Search categories or items..."
            ref={searchInputRef}
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-12 py-3 rounded-lg bg-white/90 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFB366] text-lg"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          )}
          {isSearching && (
            <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#FF6A00]"></div>
            </div>
          )}
        </div>

        {/* Display Results */}
        {searchResults && searchQuery.trim() ? (
          <div>
            {/* Categories */}
            {displayCategories.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Categories
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 max-w-7xl mx-auto">
                  {displayCategories.map((cat) => (
                    <div
                      key={cat._id || cat.name}
                      className="bg-black bg-opacity-70 rounded-2xl p-4 sm:p-6 md:p-8 w-full mx-auto flex flex-col items-center justify-between cursor-pointer transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                      onClick={() =>
                        navigate(
                          `/user/menu/${encodeURIComponent(
                            cat.slug || cat.name
                          )}`
                        )
                      }
                    >
                      <img
                        src={cat.image || "/home.jpg"}
                        alt={cat.name}
                        className="rounded-2xl mb-3 sm:mb-4 object-cover w-full h-40 sm:h-48 md:h-56"
                      />
                      <div className="w-full">
                        <h3 className="font-bold text-xl sm:text-2xl mb-2 text-white text-center">
                          {cat.name}
                        </h3>
                        {cat.subCategory && (
                          <div className="flex gap-1 mb-2 justify-center">
                            {cat.subCategory
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter((tag) => tagColors[tag])
                              .map((tag) => (
                                <span
                                  key={tag}
                                  className={`text-xs text-white px-2 py-1 rounded font-medium ${tagColors[tag]}`}
                                >
                                  {tag}
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                      {cat.description && (
                        <p className="text-sm sm:text-base mb-3 sm:mb-4 text-white/80 font-normal text-center">
                          {cat.description}
                        </p>
                      )}
                      <div className="flex-1 flex flex-col justify-end w-full">
                        <button className="mx-auto w-full sm:w-3/4 block bg-[#4B0B0B] text-white text-base sm:text-lg px-4 sm:px-6 py-2 rounded hover:bg-[#FFB366] hover:text-black transition-all">
                          View Category
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items */}
            {displayItems.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Items</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
                  {displayItems.map((item) => (
                    <div
                      key={item._id}
                      className="bg-black bg-opacity-70 rounded-2xl p-8 w-full max-w-[480px] min-h-[520px] mx-auto flex flex-col items-center justify-between cursor-pointer transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                      onClick={() =>
                        navigate(
                          `/user/menu/${encodeURIComponent(item.category)}`
                        )
                      }
                    >
                      <img
                        src={getItemImage(item)}
                        alt={item.name}
                        className="rounded-2xl mb-4 object-contain w-full h-56"
                      />
                      <h3 className="font-bold text-2xl mb-2 text-white text-center">
                        {item.name}
                      </h3>
                      <span className="text-[#FFB366] font-bold text-lg mb-2">
                        ${item.price.toFixed(2)}
                      </span>
                      {item.description && (
                        <p className="text-base mb-4 text-white/80 font-normal text-center">
                          {item.description}
                        </p>
                      )}
                      <div className="flex-1 flex flex-col justify-end w-full">
                        {/* Quantity Selector */}
                        <div className="flex items-center justify-center mb-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(item._id, -1);
                            }}
                            className="bg-[#4B0B0B] text-white font-bold px-3 py-1 rounded-l hover:bg-[#FFB366] hover:text-black transition-all"
                          >
                            -
                          </button>
                          <span className="text-white px-4 py-1 font-bold">
                            {itemQuantities[item._id] || 1}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuantityChange(item._id, 1);
                            }}
                            className="bg-[#4B0B0B] text-white font-bold px-3 py-1 rounded-r hover:bg-[#FFB366] hover:text-black transition-all"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(item, itemQuantities[item._id] || 1);
                          }}
                          className="mx-auto w-3/4 block bg-[#4B0B0B] text-white text-lg px-6 py-2 rounded hover:bg-[#FFB366] hover:text-black transition-all"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {displayCategories.length === 0 &&
              displayItems.length === 0 &&
              !isSearching && (
                <p className="text-center text-white text-lg">
                  No results found for "{searchQuery}"
                </p>
              )}
          </div>
        ) : (
          /* Default Categories View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 max-w-7xl mx-auto">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="bg-black bg-opacity-70 rounded-2xl p-4 sm:p-6 md:p-8 w-full mx-auto flex flex-col items-center justify-between cursor-pointer transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                onClick={() =>
                  navigate(
                    `/user/menu/${encodeURIComponent(cat.slug || cat.name)}`
                  )
                }
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="rounded-2xl mb-3 sm:mb-4 object-cover w-full h-40 sm:h-48 md:h-56"
                />
                <div className="w-full">
                  <h3 className="font-bold text-xl sm:text-2xl mb-2 text-white text-center">
                    {cat.name}
                  </h3>
                  {cat.subCategory && (
                    <div className="flex gap-1 mb-2 justify-center">
                      {cat.subCategory
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tagColors[tag])
                        .map((tag) => (
                          <span
                            key={tag}
                            className={`text-xs text-white px-2 py-1 rounded font-medium ${tagColors[tag]}`}
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
                {cat.desc && (
                  <p className="text-sm sm:text-base mb-3 sm:mb-4 text-white/80 font-normal text-center">
                    {cat.desc}
                  </p>
                )}
                <div className="flex-1 flex flex-col justify-end w-full">
                  <button className="mx-auto w-full sm:w-3/4 block bg-[#4B0B0B] text-white text-base sm:text-lg px-4 sm:px-6 py-2 rounded hover:bg-[#FFB366] hover:text-black transition-all">
                    Explore Menu
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Menu;
