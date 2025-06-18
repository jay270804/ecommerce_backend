const express = require('express');
const router = express.Router();
const { validateObjectId, validatePagination } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  getBrandStats
} = require('../controllers/brandController');

// Public routes (read-only)
router.get('/', validatePagination, getAllBrands);
router.get('/:id', validateObjectId, getBrandById);

// Admin-only routes
router.get('/stats', authenticateToken, requireAdmin, getBrandStats);
router.post('/', authenticateToken, requireAdmin, createBrand);
router.put('/:id', authenticateToken, requireAdmin, validateObjectId, updateBrand);
router.delete('/:id', authenticateToken, requireAdmin, validateObjectId, deleteBrand);

module.exports = router;