const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    coverImage: {
      type: String,
      required: true,
    },
    images: [{
      type: String,
    }],
    stockUnit: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    discountedPrice: {
      type: Number,
      min: 0,
    },
    categoryId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
);

// Calculate discounted price before saving
productSchema.pre("save", function (next) {
  if (this.discountPercentage > 0) {
    this.discountedPrice =
      this.price - (this.price * this.discountPercentage) / 100;
  } else {
    this.discountedPrice = this.price;
  }
  next();
});

// Calculate discounted price before updating
productSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.discountPercentage > 0) {
    update.discountedPrice =
      update.price - (update.price * update.discountPercentage) / 100;
  } else if (update.discountPercentage === 0) {
    update.discountedPrice = update.price;
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
