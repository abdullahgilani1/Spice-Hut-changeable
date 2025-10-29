// Utility functions for credit card input validation and formatting

// Luhn algorithm for card number validation
export const validateCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (cleaned.length !== 16 || !/^\d{16}$/.test(cleaned)) {
    return false;
  }
  let sum = 0;
  let shouldDouble = false;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

// Format card number: add spaces every 4 digits, numeric only, max 16
export const formatCardNumber = (value) => {
  const cleaned = value.replace(/\D/g, '').slice(0, 16);
  const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
  return formatted;
};

// Validate and format expiry date: MM/YY, auto-insert /, validate month 01-12, future date
export const formatExpiryDate = (value) => {
  const cleaned = value.replace(/\D/g, '').slice(0, 4);
  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
  }
  return cleaned;
};

export const validateExpiryDate = (expiry) => {
  const [month, year] = expiry.split('/');
  if (!month || !year || month.length !== 2 || year.length !== 2) {
    return false;
  }
  const m = parseInt(month, 10);
  const y = parseInt('20' + year, 10);
  if (m < 1 || m > 12) return false;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (y < currentYear || (y === currentYear && m < currentMonth)) {
    return false;
  }
  return true;
};

// Format CVV: numeric only, max 4 digits
export const formatCVV = (value) => {
  return value.replace(/\D/g, '').slice(0, 4);
};

// Validate CVV: 3 or 4 digits
export const validateCVV = (cvv) => {
  return /^\d{3,4}$/.test(cvv);
};

// Format cardholder name: uppercase, letters and spaces only, min 3 max 30
export const formatCardholderName = (value) => {
  const cleaned = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 30);
  return cleaned.toUpperCase();
};

export const validateCardholderName = (name) => {
  return name.length >= 3 && name.length <= 30 && /^[A-Z\s]+$/.test(name);
};
