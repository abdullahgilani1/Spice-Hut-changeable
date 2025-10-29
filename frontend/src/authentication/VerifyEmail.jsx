import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const tokenParam = params.get('token') || '';
  const emailParam = params.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState(tokenParam);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    // If token is provided via query param, auto-submit
    if (tokenParam && emailParam) {
      handleVerify(tokenParam, emailParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (tokenToUse, emailToUse) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await authAPI.verifyEmail({ token: tokenToUse, email: emailToUse });
      setMessage('Email verified successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code || !email) return setError('Please provide both email and verification code');
    handleVerify(code, email);
  };

  const handleResend = async () => {
    if (!email) return setResendMessage('Please provide an email address');
    setResendLoading(true);
    setResendMessage('');
    try {
      await authAPI.resendVerification({ email });
      setResendMessage('Verification code sent. Check your email.');
    } catch (err) {
      setResendMessage(err.response?.data?.message || err.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FF6A00] text-white">
      <div className="max-w-md w-full bg-[#3c2a1a] p-6 rounded">
        <h2 className="text-xl font-semibold mb-4">Verify Email</h2>
        {message ? (
          <div className="bg-green-800 p-3 rounded mb-3">{message}</div>
        ) : null}
        {error ? (
          <div className="bg-red-800 p-3 rounded mb-3">{error}</div>
        ) : null}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="text-sm">Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-[#2a1f0f] rounded px-3 py-2 text-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 px-4 py-2 rounded"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
        <div className="mt-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="w-full bg-transparent border border-white px-4 py-2 rounded text-sm"
          >
            {resendLoading ? 'Sending...' : 'Resend verification code'}
          </button>
          {resendMessage && <div className="text-xs mt-2">{resendMessage}</div>}
        </div>
      </div>
    </div>
  );
}
