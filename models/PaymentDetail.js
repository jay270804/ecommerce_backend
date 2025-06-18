const mongoose = require('mongoose');

const paymentDetailsSchema = new mongoose.Schema({
    orderId: {
      type: mongoose.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    provider: {
      type: String,
      required: true,
      enum: [ 'razorpay', 'cash'],
      trim: true
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
      default: 'pending'
    },
  }, {
    timestamps: true
  });

module.exports = mongoose.model("PaymentDetail", paymentDetailsSchema);