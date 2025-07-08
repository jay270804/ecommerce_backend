const Order = require('../models/Order');

exports.getMyOrders = async (req, res) => {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
};

exports.getOrderById = async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id })
                             .populate('orderItems.product', 'name coverImage');
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
};