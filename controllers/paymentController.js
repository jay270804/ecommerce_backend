const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createRazorpayOrder = async (req, res) => {
    try {
        const { amount, currency } = req.body;
        const options = {
            amount: amount * 100, // amount in the smallest currency unit
            currency: currency || "INR",
        };
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
};

exports.verifyPaymentAndCreateOrder = async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderItems,
        shippingAddress
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    // 1. Verify Signature
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: "Invalid Signature" });
    }

    // 2. Signature is valid, find order details from Razorpay
    const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);

    // 3. Create YOUR Order
    const newOrder = new Order({
        user: req.user.id, // from auth middleware
        orderItems,
        shippingAddress,
        orderTotal: paymentDetails.amount / 100,
        paymentDetails: {
            razorpayPaymentId: razorpay_payment_id,
            razorpayOrderId: razorpay_order_id,
            paymentStatus: paymentDetails.status,
        }
    });

    await newOrder.save();
    // TODO: Clear user's cart, update inventory, etc.

    res.status(201).json({
        message: "Order created successfully",
        orderId: newOrder._id
    });
};