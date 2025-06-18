const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Types.ObjectId,
      ref: "Cart",
      required: true,
    },
    productId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    quantity: {
      type: Number,
      min: 1,
      default: 1,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CartItem", cartItemSchema);
