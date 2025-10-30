const express = require('express');
const router = express.Router();
const { getBranches, getBranchById, getBranchByCity, createBranch, updateBranch, deleteBranch } = require('../controllers/branchController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public: list all branches
router.get('/', getBranches);

// Public: get branch by city (query param: ?city=CityName)
router.get('/by-city', getBranchByCity);

// Public: get branch by id
router.get('/:id', getBranchById);

// Admin: create branch
router.post('/', protect, adminOnly, createBranch);

// Admin: update branch
router.put('/:id', protect, adminOnly, updateBranch);

// Admin: delete branch
router.delete('/:id', protect, adminOnly, deleteBranch);

module.exports = router;
