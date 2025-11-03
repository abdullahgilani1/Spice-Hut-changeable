import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import OtpModal from './components/OtpModal';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const tokenParam = params.get('token') || '';
  const emailParam = params.get('email') || '';
  const otpMethodParam = params.get('otpMethod') || 'email';
  const phoneParam = params.get('phone') || '';

  return (
    <OtpModal
      email={emailParam}
      phone={phoneParam}
      otpMethod={otpMethodParam}
      initialToken={tokenParam}
      onClose={() => navigate('/login')}
      onVerified={() => navigate('/login')}
    />
  );
}
