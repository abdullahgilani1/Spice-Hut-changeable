import React from "react";
import { useParams } from "react-router-dom";
import { useCart } from "../context.cart.jsx";
import { menuAPI, categoryAPI } from "../../services/api";
import { useState, useEffect } from "react";

const tagColors = {
  GF: "bg-green-600",
  LF: "bg-blue-600",
};

const CategoryPage = () => {
  const { category } = useParams();
  const { addToCart } = useCart();
  const decodedCategory = decodeURIComponent(category);
  const [resolvedCategoryName, setResolvedCategoryName] =
    useState(decodedCategory);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = (
    'https://spicehut-8mqx.onrender.com/api'
  ).replace(/\/api$/, "");

  useEffect(() => {
    (async () => {
      try {
        // Determine whether the param is a slug; try to fetch categories and match slug
        const cats = await categoryAPI.getCategories();
        let match = null;
        if (Array.isArray(cats)) {
          match = cats.find(
            (c) =>
              (c.slug && c.slug === decodedCategory) ||
              (c.name && c.name.toLowerCase() === decodedCategory.toLowerCase())
          );
        }
        const finalName = match ? match.name : decodedCategory;
        setResolvedCategoryName(finalName);

        // Try to fetch menu items by category from backend
        try {
          const serverItems = await menuAPI.getMenuByCategory(finalName);
          if (Array.isArray(serverItems)) {
            setItems(serverItems);
          } else {
            setItems([]);
          }
        } catch (err) {
          // don't fall back to static content; show empty list
          console.warn("menuAPI.getMenuByCategory failed", err);
          setItems([]);
        }
        setLoading(false);
      } catch (err) {
        console.error("Failed to resolve category or load items", err);
        setItems([]);
        setLoading(false);
      }
    })();
  }, [category]);

  // Find category image from Menu.jsx mapping
  const categoryImages = {
    Appetizers: "Samosa .jpg",
    "Butter Dishes": "butter chicken.jpg",
    "Korma Dishes": "korma.jpg",
    "Curry Dishes": "Curry..jpg",
    "Masala Dishes": "Chana Masala.jpg",
    "Coconut Curry Dishes": "Cocnut Curry.jpg",
    "Tandoori Dishes": "Tandoori Chicken Tikka .jpg",
    "Biryani Dishes": "Biryani.jpg",
    "Karahi Dishes": "Clay Oven (Tandoor).jpg",
    "Vindaloo Dishes": "Curry..jpg",
    "Jalfrezi Dishes": "Jalfrezi.jpg",
    "Palak Dishes": "Palak Paneer.jpg",
    "Mango Curry Dishes": "Curry..jpg",
    "Vegetable Dishes": "Aalo Gobi (Cauliflower).jpg",
    "Indian Naan Bread": "Garlic Naan..jpg",
    "Salads & Sides": "SALAD.jpg",
    "Spice Hut Combo Specials": "Spice hut.jpg",
    "Indian Desserts": "Gulab Jamun..jpg",
  };

  // Helper to get dish image --- prefer category image or a site placeholder
  function getDishImage(dishName, categoryName) {
    // Fallback to category image
    if (categoryImages[categoryName]) return `/${categoryImages[categoryName]}`;
    // Site-level placeholder
    return "/home.jpg";
  }

  // Resolve image string from DB or static fallback
  function resolveImageString(img, dishName, categoryName) {
    if (!img) return getDishImage(dishName, categoryName);
    if (typeof img !== "string") return getDishImage(dishName, categoryName);
    const trimmed = img.trim();
    // Absolute URL
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    // Protocol-relative
    if (/^\/\//.test(trimmed)) return window.location.protocol + trimmed;
    // Starts with /uploads -> prepend API_BASE
    if (trimmed.startsWith("/uploads")) return `${API_BASE}${trimmed}`;
    // Starts with uploads (no leading slash)
    if (trimmed.startsWith("uploads/")) return `${API_BASE}/${trimmed}`;
    // If it contains uploads anywhere, prefix API_BASE
    if (trimmed.includes("uploads/"))
      return `${API_BASE}/${trimmed.replace(/^\//, "")}`;
    // If it's a filename like 'abc.jpg', assume it's in uploads
    if (/^[^\s/]+\.[a-z]{2,4}$/i.test(trimmed))
      return `${API_BASE}/uploads/${trimmed}`;
    // If it's an absolute path on the frontend (starts with /), return as-is
    if (trimmed.startsWith("/")) return trimmed;
    // Fallback to the generated dish image
    return getDishImage(dishName, categoryName);
  }

  return (
    <div className="min-h-screen bg-[#FF6A00] flex flex-col">
      <main className="flex-1 py-12 px-4">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          {resolvedCategoryName}
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {items.length === 0 && !loading && (
            <div className="col-span-full text-center text-white">
              No menu items found for this category.
            </div>
          )}
          {items.map((dish) => (
            <div
              key={dish.name}
              className="bg-black bg-opacity-70 rounded-2xl p-8 w-full max-w-[480px] min-h-[520px] mx-auto flex flex-col items-center justify-between cursor-pointer transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
            >
              <img
                src={resolveImageString(dish.image, dish.name, decodedCategory)}
                alt={dish.name}
                className="rounded-2xl mb-4 object-contain w-full h-56"
              />
              <h3 className="font-bold text-2xl mb-2 text-white text-center">
                {dish.name}
              </h3>
              <span className="text-[#FFB366] font-bold text-lg mb-2">
                ${dish.price.toFixed(2)}
              </span>
              <div className="flex gap-2 mb-2">
                {dish.subCategory &&
                  dish.subCategory
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter((tag) => tagColors[tag])
                    .map((tag) => (
                      <span
                        key={tag}
                        className={`text-xs text-white px-2 py-1 rounded ${tagColors[tag]}`}
                      >
                        {tag}
                      </span>
                    ))}
              </div>
              {dish.description && (
                <p className="text-base mb-4 text-white/80 font-normal text-center">
                  {dish.description}
                </p>
              )}
              <div className="flex-1 flex flex-col justify-end w-full">
                <button
                  className="mx-auto w-3/4 block bg-[#4B0B0B] text-white text-lg px-6 py-2 rounded hover:bg-[#FFB366] hover:text-black transition-all"
                  onClick={() =>
                    addToCart({
                      name: dish.name,
                      price: dish.price,
                      category: decodedCategory,
                      tags: dish.subCategory
                        ? dish.subCategory.split(",").map((tag) => tag.trim())
                        : [],
                      description: dish.description,
                    })
                  }
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CategoryPage;
