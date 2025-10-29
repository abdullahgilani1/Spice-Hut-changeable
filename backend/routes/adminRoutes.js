const express = require('express');

const { getAdmins, addAdmin, updateAdmin, deleteAdmin } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const router = express.Router();

// All admin routes are protected and admin-only
router.get('/', protect, adminOnly, getAdmins);
router.post('/', protect, adminOnly, addAdmin);
router.put('/:id', protect, adminOnly, updateAdmin);
router.delete('/:id', protect, adminOnly, deleteAdmin);

module.exports = router;
