
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import OtpModal from './components/OtpModal';

export default function AdminRegister() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [otpMethod, setOtpMethod] = useState('email');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [modalEmail, setModalEmail] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalOtpMethod, setModalOtpMethod] = useState('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      // Use shared authAPI for admin registration
      await authAPI.adminSignup({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        otpMethod,
        role: 'admin',
      });
      // After successful registration, open the inline OTP modal so admin can verify immediately
      setModalEmail(formData.email);
      setModalPhone(formData.phone);
      setModalOtpMethod(otpMethod);
      setShowOtpModal(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FF6A00] flex items-center justify-center">
      <div className="bg-black bg-opacity-70 rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-white text-center mb-6">Create Admin Account</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="name" placeholder="Full Name" required onChange={handleChange} className="w-full p-3 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-[#B35B00]" />
          <input type="email" name="email" placeholder="Email Address" required onChange={handleChange} className="w-full p-3 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-[#B35B00]" />
          <input type="tel" name="phone" placeholder="Phone Number" required onChange={handleChange} className="w-full p-3 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-[#B35B00]" />
          <input type="password" name="password" placeholder="Password" required onChange={handleChange} className="w-full p-3 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-[#B35B00]" />
          <input type="password" name="confirmPassword" placeholder="Confirm Password" required onChange={handleChange} className="w-full p-3 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-[#B35B00]" />
          
          {/* OTP Method Selection */}
          <div className="bg-gray-800 rounded p-3">
            <p className="text-gray-300 text-sm mb-2">Verification Method</p>
            <div className="flex gap-4">
              <label className="flex items-center text-white">
                <input 
                  type="radio" 
                  name="otpMethod" 
                  value="email" 
                  checked={otpMethod === 'email'} 
                  onChange={(e) => setOtpMethod(e.target.value)}
                  className="mr-2"
                />
                Email OTP
              </label>
              <label className="flex items-center text-white">
                <input 
                  type="radio" 
                  name="otpMethod" 
                  value="sms" 
                  checked={otpMethod === 'sms'} 
                  onChange={(e) => setOtpMethod(e.target.value)}
                  className="mr-2"
                />
                SMS OTP
              </label>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#4B0B0B] text-white py-3 rounded hover:bg-[#FFB366] hover:text-black transition-all disabled:bg-gray-500">
            {loading ? 'Registering...' : 'Register as Admin'}
          </button>
        </form>
        <p className="text-center text-white mt-4">Already have an account? <Link to="/login" className="text-[#FFB366] hover:underline">Login</Link></p>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <OtpModal 
          email={modalEmail}
          phone={modalPhone}
          otpMethod={modalOtpMethod}
          onClose={() => setShowOtpModal(false)}
          onVerified={handleOtpVerified}
        />
      )}
    </div>
  );
}