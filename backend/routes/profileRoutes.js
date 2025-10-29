const express = require('express');
const { getProfile, updateProfile, getAddresses, addAddress, updateAddress, deleteAddress, changePassword } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', protect, getProfile);
router.put('/', protect, updateProfile);

// Change password - requires current password verification
router.put('/password', protect, changePassword);

// Address routes
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:id', protect, updateAddress);
router.delete('/addresses/:id', protect, deleteAddress);

module.exports = router;
