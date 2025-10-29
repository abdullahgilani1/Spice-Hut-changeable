import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdChat,
  MdSend,
  MdCheckCircle,
  MdHelp,
  MdRestaurant,
  MdCreditCard,
  MdLocalShipping,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";

const faqCategories = [
  {
    icon: MdRestaurant,
    title: "Menu & Orders",
    questions: [
      {
        question: "How do I modify my order after placing it?",
        answer:
          "You can modify your order within 5 minutes of placing it by calling our support line or using live chat.",
      },
      {
        question: "Do you have vegetarian and vegan options?",
        answer:
          "Yes! We have a wide variety of vegetarian and vegan dishes clearly marked on our menu with dietary badges.",
      },
      {
        question: "Can I customize the spice level of my dishes?",
        answer:
          "You can request mild, medium, or spicy when placing your order. Just add a note in the special instructions.",
      },
    ],
  },
  {
    icon: MdLocalShipping,
    title: "Delivery & Pickup",
    questions: [
      {
        question: "What are your delivery hours?",
        answer:
          "We deliver Monday through Sunday from 11AM to 11PM. Orders placed after 10:30PM will be delivered the next day.",
      },
      {
        question: "How much is delivery?",
        answer: "Delivery is always free!",
      },
      {
        question: "How long does delivery take?",
        answer:
          "Most deliveries arrive within 25-35 minutes. During peak hours, it may take up to 45 minutes.",
      },
    ],
  },
  {
    icon: MdCreditCard,
    title: "Payment & Loyalty",
    questions: [
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit cards, debit cards, digital wallets (Apple Pay, Google Pay), and cash on delivery.",
      },
      {
        question: "How do loyalty points work?",
        answer:
          "Earn 1 point for every $1 spent. 100 points = $1 discount. Points never expire and can be used on any order.",
      },
      {
        question: "Can I get a refund if I'm not satisfied?",
        answer:
          "Yes! If you're not completely satisfied with your order, contact us within 2 hours and we'll make it right.",
      },
    ],
  },
];

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [isVisitUsExpanded, setIsVisitUsExpanded] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        category: "",
        subject: "",
        message: "",
      });
    }, 3000);
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="min-h-screen bg-[#FF6A00] flex flex-col">
      {/* Hero Section */}
      <section className="py-16 bg-[#4B0B0B] text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            Support Center
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            We're here to help! Get answers to your questions or reach out to
            our friendly support team.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Methods */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
            </div>

            {/* Visit Us Dropdown */}
            <div className="bg-[#3B2410] rounded-lg shadow-md border border-[#4B0B0B]">
              <button
                className="w-full p-6 border-b border-[#4B0B0B] text-left flex items-center justify-between hover:bg-[#4B0B0B] transition-colors duration-200"
                onClick={() => setIsVisitUsExpanded(!isVisitUsExpanded)}
              >
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <MdLocationOn className="h-5 w-5 text-[#FF6A00]" />
                  Visit Us
                </h3>
                {isVisitUsExpanded ? (
                  <MdExpandLess className="h-5 w-5 text-[#FF6A00]" />
                ) : (
                  <MdExpandMore className="h-5 w-5 text-[#FF6A00]" />
                )}
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isVisitUsExpanded ? "opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-6 space-y-2">
                  {[
                    "Campbell River",
                    "Cannoore",
                    "Comox",
                    "Cranbrook",
                    "Fort Saskatchewan",
                    "Invermere",
                    "Lady Smith",
                    "Lloydminster",
                    "Port Alberni",
                    "Tofino",
                  ].map((location) => (
                    <Link
                      key={location}
                      to="/user/contact"
                      className="block py-2 px-3 text-[#FFB366] hover:text-white hover:bg-[#4B0B0B] rounded-md transition-colors duration-200"
                    >
                      {location}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                {faqCategories.map((category) => (
                  <div
                    key={category.title}
                    className="bg-[#3B2410] rounded-lg shadow-md border border-[#4B0B0B]"
                  >
                    <div className="p-6 border-b border-[#4B0B0B]">
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                        <category.icon className="h-5 w-5 text-[#FF6A00]" />
                        {category.title}
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      {category.questions.map((faq, index) => (
                        <div
                          key={index}
                          className="border-b border-[#4B0B0B] last:border-b-0 pb-4 last:pb-0"
                        >
                          <button
                            className="flex items-center justify-between w-full text-left py-2 hover:text-[#FF6A00] transition-colors text-white"
                            onClick={() =>
                              setExpandedFaq(
                                expandedFaq === `${category.title}-${index}`
                                  ? null
                                  : `${category.title}-${index}`
                              )
                            }
                          >
                            <span className="font-medium text-white">
                              {faq.question}
                            </span>
                            <MdHelp className="h-4 w-4 text-[#FFB366] flex-shrink-0 ml-2" />
                          </button>
                          {expandedFaq === `${category.title}-${index}` && (
                            <div className="mt-2 text-[#FFB366] animate-slide-up">
                              <p className="text-[#FFB366]">{faq.answer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <div className="bg-[#3B2410] rounded-lg shadow-md sticky top-8 border border-[#4B0B0B]">
              <div className="p-6 border-b border-[#4B0B0B]">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <MdChat className="h-5 w-5 text-[#FF6A00]" />
                  Send us a Message
                </h3>
              </div>
              <div className="p-6">
                {isSubmitted ? (
                  <div className="text-center py-8 animate-fade-in">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MdCheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Thank you for contacting us. We'll get back to you within
                      24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-white"
                      >
                        Full Name
                      </label>
                      <input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        required
                        className="w-full px-3 py-2 border border-[#FF6A00] bg-[#2a1810] text-white rounded-md focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition-all duration-200 placeholder-[#FFB366]"
                        placeholder="Enter your name"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-white"
                      >
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        required
                        className="w-full px-3 py-2 border border-[#FF6A00] bg-[#2a1810] text-white rounded-md focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition-all duration-200 placeholder-[#FFB366]"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-white"
                      >
                        Phone Number (Optional)
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-[#FF6A00] bg-[#2a1810] text-white rounded-md focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition-all duration-200 placeholder-[#FFB366]"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="category"
                        className="block text-sm font-medium text-white"
                      >
                        Category
                      </label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) =>
                          handleInputChange("category", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-[#FF6A00] bg-[#2a1810] text-white rounded-md focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition-all duration-200"
                      >
                        <option value="" className="text-[#FFB366]">
                          Select a category
                        </option>
                        <option value="order" className="text-black">
                          Order Issue
                        </option>
                        <option value="delivery" className="text-black">
                          Delivery Problem
                        </option>
                        <option value="payment" className="text-black">
                          Payment Question
                        </option>
                        <option value="menu" className="text-black">
                          Menu Inquiry
                        </option>
                        <option value="feedback" className="text-black">
                          Feedback
                        </option>
                        <option value="other" className="text-black">
                          Other
                        </option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="subject"
                        className="block text-sm font-medium text-white"
                      >
                        Subject
                      </label>
                      <input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) =>
                          handleInputChange("subject", e.target.value)
                        }
                        required
                        className="w-full px-3 py-2 border border-[#FF6A00] bg-[#2a1810] text-white rounded-md focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition-all duration-200 placeholder-[#FFB366]"
                        placeholder="Enter subject"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-white"
                      >
                        Message
                      </label>
                      <textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) =>
                          handleInputChange("message", e.target.value)
                        }
                        required
                        rows={4}
                        className="w-full px-3 py-2 border border-[#FF6A00] bg-[#2a1810] text-white rounded-md focus:ring-2 focus:ring-[#FF6A00]/20 focus:border-[#FF6A00] transition-all duration-200 placeholder-[#FFB366]"
                        placeholder="Please describe your question or concern in detail..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#4B0B0B] hover:bg-[#FF6A00] text-[#FFB366] hover:text-white py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2 font-semibold border border-[#FF6A00]"
                    >
                      {isSubmitting ? (
                        "Sending..."
                      ) : (
                        <>
                          <MdSend className="h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </button>

                    <p className="text-xs text-[#FFB366] text-center">
                      We typically respond within 24 hours during business days.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
