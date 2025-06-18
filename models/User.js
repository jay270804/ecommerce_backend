const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    DOB: {
      type: Date,
      validate: {
        validator: function(value) {
          if (!value) return true; // Allow empty
          return value <= new Date(); // Must be in the past
        },
        message: 'Date of birth must be in the past'
      }
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    profileImage: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);