import React, { useState, useEffect } from 'react';
import { contentAPI } from '../../services/api';

const AboutUs = () => {
  const [aboutContent, setAboutContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await contentAPI.getContent();
        if (data && data.about) {
          setAboutContent(data.about);
        } else {
          setAboutContent(null);
        }
      } catch (err) {
        console.error('Failed to load about content from backend', err);
        setAboutContent(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!aboutContent) return <div className="min-h-screen flex items-center justify-center">About content is not available.</div>;

  return (
    <div className="min-h-screen bg-[#FF6A00] flex flex-col">
      <section className="py-16 bg-[#4B0B0B] text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">{aboutContent.title}</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            {aboutContent.content}
          </p>
        </div>
      </section>
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#3B2410] p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
            <p className="text-white opacity-90">{aboutContent.mission}</p>
          </div>
          <div className="bg-[#3B2410] p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Our Vision</h2>
            <p className="text-white opacity-90">{aboutContent.vision}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
