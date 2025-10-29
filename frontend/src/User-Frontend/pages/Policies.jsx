import React, { useState, useEffect } from 'react';
import { contentAPI } from '../../services/api';

const Policies = () => {
  const [policies, setPolicies] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await contentAPI.getContent();
        if (data && data.policies) {
          setPolicies(data.policies);
        } else {
          setPolicies(null);
        }
      } catch (err) {
        console.error('Failed to load policies from backend', err);
        setPolicies(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!policies) return <div className="min-h-screen flex items-center justify-center">Policies are not available.</div>;

  return (
    <div className="min-h-screen bg-[#FF6A00] flex flex-col">
      <section className="py-16 bg-[#4B0B0B] text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Policies</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Our policies ensure a safe and enjoyable experience for all our customers.
          </p>
        </div>
      </section>
      <div className="container mx-auto px-4 py-16">
        <div className="space-y-8">
          <div className="bg-[#3B2410] p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">{policies.privacyPolicy.title}</h2>
            <p className="text-gray-300 leading-relaxed">{policies.privacyPolicy.content}</p>
          </div>
          <div className="bg-[#3B2410] p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">{policies.termsOfService.title}</h2>
            <p className="text-gray-300 leading-relaxed">{policies.termsOfService.content}</p>
          </div>
          <div className="bg-[#3B2410] p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">{policies.refundPolicy.title}</h2>
            <p className="text-gray-300 leading-relaxed">{policies.refundPolicy.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Policies;
