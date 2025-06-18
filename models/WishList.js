const mongoose = require("mongoose");

const wishListSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // figure out how to store array of products in wishlist
    productId: [
      {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Product",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("WishList", wishListSchema);