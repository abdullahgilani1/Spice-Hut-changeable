const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require("nodemailer");

const { sendOtpToPhone } = require('../utils/sms');

// Use SendGrid for email delivery when SENDGRID_API_KEY is provided
const sendOtpMail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: "innovatehubofc@gmail.com",
      to: email,
      subject: "Account Registration OTP",
      html: `<p>Your OTP for Account Registration is: <b>${otp}</b>.</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    
  } catch (error) {
    console.error("❌ Failed to send OTP Email:", error);
  }
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

        // Send verification code via requested method if provided (keep email as default)
        try {
          const otp = token;
          const otpMethod = req.body.otpMethod || 'email';
          if (otpMethod === 'sms' && user.phone) {
            // attempt SMS send; non-fatal if it fails
            const smsRes = await sendOtpToPhone(user.phone, otp, 'registration');
            if (!smsRes || !smsRes.success) {
              console.warn('[registerUser] SMS send failed, falling back to email');
              await sendOtpMail(email, otp);
            }
          } else {
            await sendOtpMail(email, otp);
          }
        } catch (emailErr) {
          console.warn('Failed to send verification (email or sms)', emailErr);
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

    try {
      const otp = user.verifyToken;
      const { otpMethod, phone } = req.body;
      // prefer explicit otpMethod in body, otherwise default to email
      const method = otpMethod || 'email';
      if (method === 'sms') {
        const targetPhone = phone || user.phone;
        if (targetPhone) {
          const smsRes = await sendOtpToPhone(targetPhone, otp, 'verification');
          if (!smsRes || !smsRes.success) {
            console.warn('[resendVerification] SMS failed, falling back to email');
            await sendOtpMail(user.email, otp);
          }
        } else {
          // no phone provided - fall back to email
          await sendOtpMail(user.email, otp);
        }
      } else {
        await sendOtpMail(user.email, otp);
      }
    } catch (err) {
      console.warn('Failed to send verification (email or sms)', err);
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


  try {
    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if password matches (do not log the boolean in production if you prefer silence)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    

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


/**
 * @desc    Get current user's profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' });
    res.json({ success: true, data: { user: req.user } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};



module.exports = {
  registerUser,
  loginUser,
  verifyUser,
  resetPassword,
  verifyEmail,
  resendVerification,
  getProfile,
};