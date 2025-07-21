const express = require('express');
const router = express.Router();
const { validateObjectId, validatePagination } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats
} = require('../controllers/categoryController');

// Public routes (read-only)
router.get('/', validatePagination, getAllCategories);
router.get('/stats', authenticateToken, requireAdmin, getCategoryStats);
router.get('/:id', validateObjectId, getCategoryById);

// Admin-only routes
router.post('/', authenticateToken, requireAdmin, createCategory);
router.put('/:id', authenticateToken, requireAdmin, validateObjectId, updateCategory);
router.delete('/:id', authenticateToken, requireAdmin, validateObjectId, deleteCategory);

module.exports = router;