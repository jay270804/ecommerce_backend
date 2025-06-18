const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isValidEmail, isValidPhoneNumber } = require('../middleware/validation');

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
    // { expiresIn: '' }
  );
};
// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify JWT token
const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};
// Generate random string
const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format price with currency
const formatPrice = (price, currency = '₹') => {
  return `${currency}${price.toFixed(2)}`;
};

// Calculate discount price
const calculateDiscountedPrice = (originalPrice, discountPercentage) => {
  if (discountPercentage <= 0) return originalPrice;
  return originalPrice - (originalPrice * discountPercentage / 100);
};

// Pagination helper
const getPaginationData = (page = 1, limit = 10) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  return { skip, limit: parseInt(limit) };
};

// Sanitize string
const sanitizeString = (str) => {
  if (!str) return '';
  return str.trim().replace(/[<>]/g, '');
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  generateRandomString,
  formatPrice,
  calculateDiscountedPrice,
  getPaginationData,
  sanitizeString,
  isValidEmail,
  isValidPhoneNumber
};
