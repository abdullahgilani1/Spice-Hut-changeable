const express = require('express');
const router = express.Router();
const { reverseGeocode } = require('../controllers/utilsController');

// POST /api/utils/reverse-geocode
router.post('/reverse-geocode', reverseGeocode);

// Also allow GET /api/utils/reverse-geocode?latitude=..&longitude=.. for quick browser testing
router.get('/reverse-geocode', reverseGeocode);

// Simple ping for quick health check from frontend
router.get('/ping', (req, res) => {
	res.json({ ok: true, route: '/api/utils' });
});

module.exports = router;
