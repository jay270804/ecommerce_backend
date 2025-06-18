const express = require('express');
const router = express.Router();
const { validateUserRegistration, validateUserLogin, validateObjectId } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  getProfile,
  updateProfile
} = require('../controllers/authController');

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.get('/verify-email/:userId/:token', verifyEmail);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, getProfile);
// TODO: below api and PUT /user/:id Api both carry same function ?
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;