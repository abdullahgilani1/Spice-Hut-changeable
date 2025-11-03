import React, { useEffect, useRef, useState } from 'react';
import { authAPI } from '../../services/api';

const OTP_LEN = 6;

export default function OtpModal({ email: initialEmail = '', phone = '', otpMethod: initialOtpMethod = 'email', initialToken = '', onClose, onVerified }) {
  const [email, setEmail] = useState(initialEmail);
  const [otpMethod, setOtpMethod] = useState(initialOtpMethod);
  const [digits, setDigits] = useState(() => Array(OTP_LEN).fill(''));
  const inputsRef = useRef([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    // If an initial token is provided (e.g., from query param), prefill and auto-submit.
    if (initialToken && initialToken.toString().length) {
      const tokenDigits = initialToken.toString().split('').slice(0, OTP_LEN);
      const fill = Array(OTP_LEN).fill('');
      tokenDigits.forEach((d, i) => (fill[i] = d));
      setDigits(fill);
      setTimeout(() => submitOtp(fill.join('')), 200);
      return;
    }

    setTimeout(() => inputsRef.current[0]?.focus(), 60);
  }, []);

  const maskPhone = (p) => {
    if (!p) return '';
    const s = p.replace(/\D/g, '');
    if (s.length <= 4) return '••••' + s;
    return '••••' + s.slice(-4);
  };

  const submitOtp = async (code) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await authAPI.verifyEmail({ token: code, email });
      setMessage('Verified successfully. Redirecting to login...');
      if (onVerified) onVerified();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
    if (val) {
      const nextIdx = idx + 1;
      if (nextIdx < OTP_LEN) inputsRef.current[nextIdx]?.focus();
      else {
        const code = digits.map((d, i) => (i === idx ? val : d)).join('');
        if (code.replace(/\D/g, '').length === OTP_LEN) submitOtp(code);
      }
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        setDigits((prev) => {
          const next = [...prev];
          next[idx] = '';
          return next;
        });
      } else if (idx > 0) {
        inputsRef.current[idx - 1]?.focus();
        setDigits((prev) => {
          const next = [...prev];
          next[idx - 1] = '';
          return next;
        });
      }
    }
    if (e.key === 'ArrowLeft' && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < OTP_LEN - 1) inputsRef.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    const nums = paste.replace(/\D/g, '').slice(0, OTP_LEN).split('');
    if (nums.length) {
      const fill = Array(OTP_LEN).fill('');
      nums.forEach((d, i) => (fill[i] = d));
      setDigits(fill);
      if (nums.length === OTP_LEN) submitOtp(nums.join(''));
    }
    e.preventDefault();
  };

  const handleResend = async () => {
    if (!email) return setResendMessage('Missing email');
    setResendLoading(true);
    setResendMessage('');
    try {
      await authAPI.resendVerification({ email, phone, otpMethod });
      setResendMessage(`Verification code sent via ${otpMethod.toUpperCase()}.`);
    } catch (err) {
      setResendMessage(err.response?.data?.message || err.message || 'Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.5)]">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-lg text-white">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">Enter verification code</h3>
          <button onClick={onClose} className="text-white/70">✕</button>
        </div>
        <p className="text-sm text-gray-200 mt-2 mb-4">We sent a {otpMethod.toUpperCase()} code to {otpMethod === 'sms' ? maskPhone(phone) || email : email}.</p>
        {message && <div className="bg-green-800 p-2 rounded mb-3">{message}</div>}
        {error && <div className="bg-red-800 p-2 rounded mb-3">{error}</div>}

        <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              value={d}
              onChange={(e) => handleChange(e, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className="w-12 h-12 text-center rounded bg-[#2a1f0f] border border-white/20 text-white text-xl"
              inputMode="numeric"
            />
          ))}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => submitOtp(digits.join(''))} disabled={loading} className="bg-orange-600 py-2 rounded">
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button onClick={handleResend} disabled={resendLoading} className="bg-transparent border border-white py-2 rounded">
              {resendLoading ? 'Sending...' : 'Resend code'}
            </button>
          </div>
          {resendMessage && <div className="text-xs mt-1">{resendMessage}</div>}
        </div>
      </div>
    </div>
  );
}
