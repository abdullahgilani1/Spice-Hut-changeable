/**
 * Validates a password against common security criteria
 * @param {string} password - The password to validate
 * @returns {string[]} Array of error messages, empty if valid
 */
export const validatePassword = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // At least one non-alphanumeric character
  if (/[^A-Za-z0-9]/.test(password) === false) {
    errors.push('Password must contain at least one special character');
  }

  return errors;
};

/**
 * Calculates password strength based on criteria
 * @param {string} password - The password to evaluate
 * @returns {object} Object with percentage, label, and color class
 */
export const calculateStrength = (password) => {
  if (!password) {
    return { percentage: 0, label: 'Very Weak', color: 'bg-red-500' };
  }

  let score = 0;
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
  /[^A-Za-z0-9]/.test(password),
    password.length >= 12,
  ];

  checks.forEach(check => {
    if (check) score++;
  });

  const percentage = Math.min((score / checks.length) * 100, 100);

  let label, color;
  if (percentage < 20) {
    label = 'Very Weak';
    color = 'bg-red-500';
  } else if (percentage < 40) {
    label = 'Weak';
    color = 'bg-orange-500';
  } else if (percentage < 60) {
    label = 'Fair';
    color = 'bg-yellow-500';
  } else if (percentage < 80) {
    label = 'Good';
    color = 'bg-blue-500';
  } else {
    label = 'Strong';
    color = 'bg-green-500';
  }

  return { percentage, label, color };
};
