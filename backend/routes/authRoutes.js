const express = require('express');
const { registerUser, loginUser, verifyUser, resetPassword, verifyEmail, resendVerification } = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-user', verifyUser);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/reset-password', resetPassword);

module.exports = router;