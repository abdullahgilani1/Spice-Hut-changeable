import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUtensils, FaTruck, FaStar } from "react-icons/fa";
// large image moved to public/media to avoid bundling
const butterChickenImg = "/media/butter-chicken.jpg";
import kormaImg from "../../assets/Korma @ Spice Hut. .jpg";
import tandooriImg from "../../assets/Tandoori Chicken Tikka .jpg";
import biryaniImg from "../../assets/Biryani.jpg";
import vegetableImg from "../../assets/Aalo Gobi (Cauliflower).jpg";
import naanImg from "../../assets/Qeema Naan.jpg";
import { categoryAPI } from "../../services/api";
import { resolveImageSrc } from '../../services/image';

const tagColors = {
  GF: "bg-green-600",
  LF: "bg-blue-600",
};

const Home = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE = "http://localhost:5000/api";

  useEffect(() => {
    (async () => {
      try {
        const data = await categoryAPI.getCategories();
        if (Array.isArray(data))
          setCategories(
            data.map((c) => ({
              name: c.name,
              image: c.image,
              slug: c.slug,
              description: c.description,
              subCategory: c.subCategory || "",
              _id: c._id,
            }))
          );
      } catch (err) {
        console.error("Failed to load categories for Home", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  return (
    <div className="min-h-screen bg-[#FF6A00] flex flex-col">
      <main className="flex flex-col flex-1">
        {/* Picture section with overlaid text */}
        <div className="relative">
          <img
            src="/media/home.jpg"
            alt="Spice Hut"
            className="w-full h-190 object-cover brightness-70"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-opacity-50 text-white">
            <div className="text-center">
              <h1 className="text-6xl font-bold mb-4">Spice Hut</h1>
              <p className="text-lg">
                Most of our dishes are gluten free & lactose free
              </p>
            </div>
          </div>
        </div>

        {/* Expert chefs, fast delivery, premium quality section */}
        <section className="bg-[#B35B00] text-white py-14 flex justify-around text-center">
          <div>
            <FaUtensils className="text-4xl mx-auto mb-2" />
            <h3 className="font-bold mb-1">Expert Chefs</h3>
            <p className="text-sm">
              Authentic recipes prepared by master chefs
            </p>
          </div>
          <div>
            <FaTruck className="text-4xl mx-auto mb-2" />
            <h3 className="font-bold mb-1">Fast Delivery</h3>
            <p className="text-sm">
              Hot and fresh meals delivered in 30 minutes
            </p>
          </div>
          <div>
            <FaStar className="text-4xl mx-auto mb-2" />
            <h3 className="font-bold mb-1">Premium Quality</h3>
            <p className="text-sm">Only the finest ingredients in every dish</p>
          </div>
        </section>

        {/* Our Menu Categories */}
        <section className="bg-[#FF6A00] text-white py-14 px-1">
          <h2 className="text-6xl font-bold mb-4 text-center">
            Our Menu Categories
          </h2>
          <p className="text-center text-xl mb-16">
            Discover our carefully curated selection of authentic dishes, each
            prepared with passion and tradition
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/** Render up to 6 categories fetched from backend; fall back to defaults if none */}
            {(() => {
              const imgMap = {
                "butter dishes": butterChickenImg,
                "korma dishes": kormaImg,
                "tandoori dishes": tandooriImg,
                "biryani dishes": biryaniImg,
                "vegetable dishes": vegetableImg,
                "indian naan bread": naanImg,
              };
              if (loading) {
                return (
                  <div
                    key="loading"
                    className="col-span-full text-center text-white"
                  >
                    Loading categories...
                  </div>
                );
              }

              const cats =
                categories && categories.length ? categories.slice(0, 6) : [];

              if (cats.length === 0) {
                return (
                  <div
                    key="empty"
                    className="col-span-full text-center text-white"
                  >
                    No categories available.
                  </div>
                );
              }

              return cats.map((cat, idx) => {
                const title = cat.name || cat;
                const key = `cat-${idx}-${title}`;
                // prefer uploaded category.image if present, otherwise fall back to mapped images
                const defaultImg = imgMap[(title || "").toLowerCase()] || "/home.jpg";
                const img = cat.image ? resolveImageSrc(cat.image, defaultImg) : defaultImg;
                const link = cat.slug
                  ? `/user/menu/${encodeURIComponent(cat.slug)}`
                  : `/user/menu/${encodeURIComponent(title)}`;
                return (
                  <div
                    key={key}
                    className="bg-black bg-opacity-70 rounded-2xl p-8 w-full max-w-[500px] min-h-[520px] mx-auto flex flex-col items-center justify-between cursor-pointer transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
                    onClick={() => navigate(link)}
                  >
                    <img
                      src={img}
                      alt={title}
                      className="rounded-2xl mb-4 object-contain w-full h-56"
                    />
                    <div className="w-full">
                      <h3 className="font-bold text-2xl mb-2 text-white text-center">
                        {title}
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
                      <p className="text-sm text-white/80 font-normal text-center mb-4">
                        {cat.description}
                      </p>
                    )}
                    <div className="flex-1 flex flex-col justify-end w-full">
                      <button className="mx-auto w-3/4 block bg-[#4B0B0B] text-white text-lg px-6 py-2 rounded hover:bg-[#FFB366] hover:text-black transition-all">
                        Explore Menu
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </section>

        {/* Ready to Order Section */}
        <section className="bg-[#4B0B0B] text-white py-8 text-center">
          <h2 className="text-3xl font-bold mb-2">Ready to Order?</h2>
          <p className="mb-4">
            Join thousands of satisfied customers who trust us for their dining
            experience
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/user/menu')}
              className="border border-white px-6 py-2 rounded text-white font-semibold cursor-pointer hover:bg-white hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
              aria-label="Start Ordering - go to Menu"
            >
              Start Ordering
            </button>
            <button
              onClick={() => navigate('/user/menu')}
              className="border border-white px-6 py-2 rounded text-white font-semibold cursor-pointer hover:bg-white hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
              aria-label="View Full Menu - go to Menu"
            >
              View Full Menu
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
