const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    AddrLine1: {
      type: String,
      required: true,
      trim: true,
    },
    AddrLine2: {
      type: String,
      trim: true,
    },
    landmark: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim:true
    },
    state: {
      type: String,
      required: true,
      trim:true
    },
    PIN: {
      type: String,
      required: true,
      trim:true
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", addressSchema);
