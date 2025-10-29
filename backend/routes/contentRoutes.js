const express = require('express');
const router = express.Router();
const { getContent, upsertContent } = require('../controllers/contentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public: read content
router.get('/', getContent);

// Admin: create or update content
router.post('/', protect, adminOnly, upsertContent);

module.exports = router;
