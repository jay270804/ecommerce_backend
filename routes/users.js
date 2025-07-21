const express = require('express');
const router = express.Router();
const { validateObjectId, validatePagination } = require('../middleware/validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats
} = require('../controllers/userController');

// All routes require admin access
router.use(authenticateToken, requireAdmin);

// Get all users with pagination and filtering
router.get('/', validatePagination, getAllUsers);
// Get user statistics
router.get('/stats', getUserStats);
// Get user by ID
router.get('/:id', validateObjectId, getUserById);
// Update user
// TODO: below api and PUT /profile Api both carry same function ?
router.put('/:id', validateObjectId, updateUser);

// Delete user (soft delete)
router.delete('/:id', validateObjectId, deleteUser);

module.exports = router;