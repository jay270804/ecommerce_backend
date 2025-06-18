const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // figure out how to store array of products in Order
    totalAmount: {
      type: Number,
      min: 0,
      required: true,
    },
    paymentId: {
      type: mongoose.Types.ObjectId,
      ref: "PaymentDetail",
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      required: true,
    },
    shippingAddress: {
      type: mongoose.Types.ObjectId,
      ref: "Address",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
