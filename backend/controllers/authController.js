const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Use SendGrid for email delivery when SENDGRID_API_KEY is provided
let sgMail = null;
if (process.env.SENDGRID_API_KEY) {
  try {
    sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  } catch (e) {
    sgMail = null;
    console.warn('SendGrid module not available; falling back to console logging for emails.');
  }
}

const sendEmail = async (to, subject, text, html) => {
  if (sgMail && process.env.SENDER_EMAIL) {
    // SendGrid expects either a single msg object or an array; we send single
    return sgMail.send({ to, from: process.env.SENDER_EMAIL, subject, text, html });
  }
  // Fallback: log the message so developers can copy the link during dev
  console.info('[EMAIL] SendGrid not configured - email content:', { to, subject, text, html });
  return null;
};

// Helper function to generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new user or admin
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: role || 'user', // Default to 'user' if role is not provided
    });

    if (user) {
      // Generate numeric verification code (6 digits) and expiry
      const token = Math.floor(100000 + Math.random() * 900000).toString(); // e.g., '345901'
      user.verifyToken = token;
      user.verifyTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      user.isVerified = false;
      await user.save();

      // Send verification email containing only the numeric code (no links)
      const emailBody = `Hi ${user.name || ''},\n\nYour verification code is: ${token}\n\nThis code will expire in 24 hours.`;
      try {
        await sendEmail(
          user.email,
          'Your verification code',
          emailBody,
          `<p>Hi ${user.name || ''},</p><p>Your verification code is: <strong>${token}</strong></p><p>This code will expire in 24 hours.</p>`
        );
      } catch (emailErr) {
        console.warn('Failed to send verification email', emailErr);
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
        message: 'Registered successfully. Please check your email for a verification link.'
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Verify email token (called from frontend or directly via link)
 * POST /api/auth/verify-email  { token }
 */
const verifyEmail = async (req, res) => {
  const token = req.body.token || req.query.token;
  if (!token) return res.status(400).json({ message: 'Missing token' });
  try {
    const user = await User.findOne({ verifyToken: token, verifyTokenExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.isVerified = true;
    user.verifyToken = '';
    user.verifyTokenExpires = undefined;
    await user.save();
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Resend verification email
 * POST /api/auth/resend-verification { email }
 */
const resendVerification = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

  const token = Math.floor(100000 + Math.random() * 900000).toString();
  user.verifyToken = token;
  user.verifyTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    try {
      await sendEmail(
        user.email,
        'Your verification code',
        `Your verification code is: ${token}`,
        `<p>Your verification code is: <strong>${token}</strong></p>`
      );
    } catch (err) {
      console.warn('Failed to send verification email', err);
    }

    res.json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  // Minimal logging: avoid printing passwords, full user objects, emails or IDs
  console.log('Auth: login attempt');

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    console.log(`Auth: user lookup ${user ? 'found' : 'not found'}`);

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if password matches (do not log the boolean in production if you prefer silence)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Auth: failed login attempt');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Auth: successful login');

    // User is authenticated, return token
    res.status(200).json({
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


/**
 * @desc    Verify user for password reset
 * @route   POST /api/auth/verify-user
 * @access  Public
 */
const verifyUser = async (req, res) => {
  const { email, phone } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.phone !== phone) {
      return res.status(400).json({ message: 'Phone number does not match' });
    }

    res.status(200).json({ message: 'User verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Reset user password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = newPassword; // plain text
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password error:", error); // 👈 ADD THIS LINE
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



module.exports = {
  registerUser,
  loginUser,
  verifyUser,
  resetPassword,
  verifyEmail,
  resendVerification,
};