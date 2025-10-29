const express = require('express');
const router = express.Router();
const { createOrder, getOrders, getOrderById, updateOrderStatus, getUserOrders, updateOrder } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public: create an order
router.post('/', createOrder);

// Update an order (owner or admin) - protected
router.put('/:id', protect, updateOrder);

// Admin-only: list orders
router.get('/', protect, adminOnly, getOrders);

// Get current user's orders
router.get('/my', protect, getUserOrders);

// Get a single order (protected)
router.get('/:id', protect, getOrderById);

// Update status (admin only)
router.patch('/:id/status', protect, adminOnly, updateOrderStatus);

module.exports = router;
