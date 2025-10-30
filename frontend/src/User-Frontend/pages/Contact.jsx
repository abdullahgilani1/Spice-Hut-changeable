import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { contentAPI, branchAPI } from '../../services/api';

const Contact = () => {
  const [contactContent, setContactContent] = useState(null);
  const [branchInfo, setBranchInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        const data = await contentAPI.getContent();
        if (data && data.contact) {
          setContactContent(data.contact);
        } else {
          setContactContent(null);
        }
      } catch (err) {
        console.error('Failed to load contact content from backend', err);
        setContactContent(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // If a branchId query param is present (from Support -> Contact), fetch branch info by id
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const branchId = params.get('branchId');
    if (!branchId) return;

    (async () => {
      try {
        const branch = await branchAPI.getBranch(branchId);
        if (branch) setBranchInfo(branch);
      } catch (err) {
        // no branch found or error - keep branchInfo null and fall back to contact content
        console.warn('No branch found for id', branchId, err?.response?.data || err.message || err);
      }
    })();
  }, [location.search]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!contactContent) return <div className="min-h-screen flex items-center justify-center">Contact information is not available.</div>;

  const params = new URLSearchParams(location.search);
  const branchIdParam = params.get('branchId');

  return (
    <div className="min-h-screen bg-[#FF6A00] flex flex-col">
      <section className="py-16 bg-[#4B0B0B] text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">{contactContent.title}</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Get in touch with us! We're here to serve you the best culinary experience.
          </p>
        </div>
      </section>
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#3B2410] p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
            <div className="space-y-4 text-white">
              {/* Address: If branchId param present show only branch address (if available). Otherwise show site static address. */}
              {branchIdParam ? (
                branchInfo?.fullAddress ? (
                  <div>
                    <h3 className="font-semibold mb-2">Address</h3>
                    <p className="opacity-90">{branchInfo.fullAddress}</p>
                  </div>
                ) : null
              ) : (
                <div>
                  <h3 className="font-semibold mb-2">Address</h3>
                  <p className="opacity-90">{contactContent.address}</p>
                </div>
              )}

              {/* Phone: If branchId param present show only branch phone (if available). Otherwise show site static phone. */}
              {branchIdParam ? (
                branchInfo?.phone ? (
                  <div>
                    <h3 className="font-semibold mb-2">Phone</h3>
                    <p className="opacity-90">{branchInfo.phone}</p>
                  </div>
                ) : null
              ) : (
                <div>
                  <h3 className="font-semibold mb-2">Phone</h3>
                  <p className="opacity-90">{contactContent.phone}</p>
                </div>
              )}
              <div>
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="opacity-90">{contactContent.email}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Business Hours</h3>
                <div className="space-y-1 text-sm">
                  {Object.entries(contactContent.hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between">
                      <span className="capitalize">{day}:</span>
                      <span>{hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#3B2410] p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Send us a Message</h2>
            <form className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:outline-none"
                />
              </div>
              <div>
                <textarea
                  rows="4"
                  placeholder="Your Message"
                  className="w-full px-4 py-3 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-[#FF6A00] focus:outline-none"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-[#FF6A00] text-white py-3 rounded-lg hover:bg-[#e55a00] transition-colors font-semibold"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
