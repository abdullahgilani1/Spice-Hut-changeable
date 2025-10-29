import React, { useState, useEffect } from "react";
import { contentAPI } from "../../services/api";
import { FiFileText, FiPhone, FiShield, FiSave, FiEye } from "react-icons/fi";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("about");

  const [aboutContent, setAboutContent] = useState({
    title: "About Our Restaurant",
    content: "Welcome to our restaurant! We have been serving delicious food since 2010. Our mission is to provide exceptional dining experiences with fresh ingredients and outstanding service. We pride ourselves on our diverse menu that caters to all tastes and dietary preferences.",
    mission: "To create memorable dining experiences through exceptional food and service.",
    vision: "To be the premier restaurant destination in the community.",
    image: "/api/placeholder/800/400"
  });

  const [contactContent, setContactContent] = useState({
    title: "Contact Us",
    address: "123 Restaurant Street, Food City, FC 12345",
    phone: "+1 (555) 123-4567",
    email: "info@restaurant.com",
    hours: {
      monday: "11:00 AM - 10:00 PM",
      tuesday: "11:00 AM - 10:00 PM",
      wednesday: "11:00 AM - 10:00 PM",
      thursday: "11:00 AM - 10:00 PM",
      friday: "11:00 AM - 11:00 PM",
      saturday: "12:00 PM - 11:00 PM",
      sunday: "12:00 PM - 9:00 PM"
    },
    socialMedia: {
      facebook: "https://facebook.com/restaurant",
      instagram: "https://instagram.com/restaurant",
      twitter: "https://twitter.com/restaurant"
    }
  });

  const [policyContent, setPolicyContent] = useState({
    privacyPolicy: {
      title: "Privacy Policy",
      content: "We are committed to protecting your privacy. This privacy policy explains how we collect, use, and safeguard your information when you visit our website or use our services..."
    },
    termsOfService: {
      title: "Terms of Service",
      content: "By accessing and using our services, you accept and agree to be bound by the terms and provision of this agreement..."
    },
    refundPolicy: {
      title: "Refund Policy",
      content: "We want you to be completely satisfied with your dining experience. If you are not satisfied with your order, please contact us within 24 hours..."
    }
  });

  const handleAboutChange = (e) => {
    setAboutContent({ ...aboutContent, [e.target.name]: e.target.value });
  };

  const handleAboutSave = (e) => {
    e.preventDefault();
    // save to backend
    (async () => {
      try {
        await contentAPI.upsertContent({ about: aboutContent });
        alert('About Us content saved successfully!');
      } catch (err) {
        console.error('Failed to save about content', err);
        alert('Failed to save content');
      }
    })();
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setContactContent({
        ...contactContent,
        [parent]: { ...contactContent[parent], [child]: value }
      });
    } else {
      setContactContent({ ...contactContent, [name]: value });
    }
  };

  const handleContactSave = (e) => {
    e.preventDefault();
    (async () => {
      try {
        await contentAPI.upsertContent({ contact: contactContent });
        alert('Contact content saved successfully!');
      } catch (err) {
        console.error('Failed to save contact content', err);
        alert('Failed to save content');
      }
    })();
  };

  const handlePolicyChange = (policyType, e) => {
    setPolicyContent({
      ...policyContent,
      [policyType]: { ...policyContent[policyType], [e.target.name]: e.target.value }
    });
  };

  const handlePolicySave = (e) => {
    e.preventDefault();
    (async () => {
      try {
        await contentAPI.upsertContent({ policies: policyContent });
        alert('Policies saved successfully!');
      } catch (err) {
        console.error('Failed to save policies', err);
        alert('Failed to save content');
      }
    })();
  };

  // Load initial content from backend
  useEffect(() => {
    (async () => {
      try {
        const data = await contentAPI.getContent();
        if (data) {
          if (data.about) setAboutContent(prev => ({ ...prev, ...data.about }));
          if (data.contact) setContactContent(prev => ({ ...prev, ...data.contact }));
          if (data.policies) setPolicyContent(prev => ({ ...prev, ...data.policies }));
        }
      } catch (err) {
        console.error('Failed to load content', err);
      }
    })();
  }, []);

  const tabs = [
    { id: "about", label: "About Us", icon: FiFileText },
    { id: "contact", label: "Contact", icon: FiPhone },
    { id: "policies", label: "Policies", icon: FiShield },
  ];

  return (
    <main className="p-4 md:p-8 lg:p-12 font-sans min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Content Management</h1>
        <p className="text-gray-600 text-lg">Manage your website content including About, Contact, and Policy pages.</p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === "about" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">About Us Content</h2>
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Page Title</label>
                    <input
                      type="text"
                      name="title"
                      value={aboutContent.title}
                      onChange={handleAboutChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter page title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Main Content</label>
                    <textarea
                      name="content"
                      value={aboutContent.content}
                      onChange={handleAboutChange}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter main content"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mission Statement</label>
                    <textarea
                      name="mission"
                      value={aboutContent.mission}
                      onChange={handleAboutChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter mission statement"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vision Statement</label>
                    <textarea
                      name="vision"
                      value={aboutContent.vision}
                      onChange={handleAboutChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter vision statement"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleAboutSave}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 flex items-center"
                    >
                      <FiSave className="mr-2" />
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition-all duration-200 transform hover:scale-105 flex items-center"
                    >
                      <FiEye className="mr-2" />
                      Preview
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "contact" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Contact Information</h2>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Page Title</label>
                      <input
                        type="text"
                        name="title"
                        value={contactContent.title}
                        onChange={handleContactChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter page title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={contactContent.phone}
                        onChange={handleContactChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={contactContent.email}
                      onChange={handleContactChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <textarea
                      name="address"
                      value={contactContent.address}
                      onChange={handleContactChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter full address"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Business Hours</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(contactContent.hours).map(([day, hours]) => (
                        <div key={day}>
                          <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">{day}</label>
                          <input
                            type="text"
                            name={`hours.${day}`}
                            value={hours}
                            onChange={handleContactChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="e.g., 9:00 AM - 5:00 PM"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleContactSave}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 flex items-center"
                    >
                      <FiSave className="mr-2" />
                      Save Changes
                    </button>
                    <button
                      type="button"
                      className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition-all duration-200 transform hover:scale-105 flex items-center"
                    >
                      <FiEye className="mr-2" />
                      Preview
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "policies" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Policies & Terms</h2>
                <div className="space-y-8">
                  {/* Privacy Policy */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Policy</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        name="title"
                        value={policyContent.privacyPolicy.title}
                        onChange={(e) => handlePolicyChange('privacyPolicy', e)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter policy title"
                      />
                      <textarea
                        name="content"
                        value={policyContent.privacyPolicy.content}
                        onChange={(e) => handlePolicyChange('privacyPolicy', e)}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter privacy policy content"
                      />
                    </div>
                  </div>

                  {/* Terms of Service */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Terms of Service</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        name="title"
                        value={policyContent.termsOfService.title}
                        onChange={(e) => handlePolicyChange('termsOfService', e)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter terms title"
                      />
                      <textarea
                        name="content"
                        value={policyContent.termsOfService.content}
                        onChange={(e) => handlePolicyChange('termsOfService', e)}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter terms of service content"
                      />
                    </div>
                  </div>

                  {/* Refund Policy */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Refund Policy</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        name="title"
                        value={policyContent.refundPolicy.title}
                        onChange={(e) => handlePolicyChange('refundPolicy', e)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter refund policy title"
                      />
                      <textarea
                        name="content"
                        value={policyContent.refundPolicy.content}
                        onChange={(e) => handlePolicyChange('refundPolicy', e)}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter refund policy content"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handlePolicySave}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 flex items-center"
                    >
                      <FiSave className="mr-2" />
                      Save All Policies
                    </button>
                    <button
                      type="button"
                      className="bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition-all duration-200 transform hover:scale-105 flex items-center"
                    >
                      <FiEye className="mr-2" />
                      Preview All
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
