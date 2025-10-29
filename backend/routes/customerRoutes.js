const express = require('express');
const { getCustomers, deleteCustomer } = require('../controllers/customerController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const router = express.Router();

// All customer routes are protected and admin-only
router.get('/', protect, adminOnly, getCustomers);
router.delete('/:id', protect, adminOnly, deleteCustomer);

module.exports = router;
