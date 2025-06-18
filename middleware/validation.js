const mongoose = require("mongoose");
const Category = require("../models/Category");
const Brand = require("../models/Brand");

// Middleware to validate MongoDB ObjectId
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }
  next();
};

// Middleware to validate product data
const validateProduct = async (req, res, next) => {
  const { name, description, price, categoryId, brandId } = req.body;

  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push("Product name is required");
  }

  if (!description || description.trim().length === 0) {
    errors.push("Product description is required");
  }

  if (!price || price <= 0) {
    errors.push("Product price must be greater than 0");
  }

  if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
    errors.push("Valid category ID is required");
  } else {
    // Check if category exists
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      errors.push("Category does not exist");
    }
  }

  if (!brandId || !mongoose.Types.ObjectId.isValid(brandId)) {
    errors.push("Valid brand ID is required");
  } else {
    // Check if brand exists
    const brandExists = await Brand.findById(brandId);
    if (!brandExists) {
      errors.push("Brand does not exist");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Middleware to validate user registration data
const validateUserRegistration = (req, res, next) => {
  const { firstName, lastName, email, password, phoneNumber } = req.body;

  const errors = [];

  if (!firstName || firstName.trim().length === 0) {
    errors.push("First name is required");
  }

  if (!lastName || lastName.trim().length === 0) {
    errors.push("Last name is required");
  }

  if (!email || !isValidEmail(email)) {
    errors.push("Valid email is required");
  }

  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) {
    errors.push("Valid phone number is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Middleware to validate user login data
const validateUserLogin = (req, res, next) => {
  const { email, password } = req.body;

  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push("Valid email is required");
  }

  if (!password) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
};

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate phone number format
const isValidPhoneNumber = (phoneNumber) => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phoneNumber.toString());
};

// Middleware to validate pagination parameters
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({
      success: false,
      message: "Page must be a positive number",
    });
  }

  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      success: false,
      message: "Limit must be between 1 and 100",
    });
  }

  next();
};

module.exports = {
  validateObjectId,
  validateProduct,
  validateUserRegistration,
  validateUserLogin,
  validatePagination,
  isValidEmail,
  isValidPhoneNumber
};
