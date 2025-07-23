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

// Get all orders (Admin only)
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
    }
};

// Update order (Admin only)
exports.updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;
        if (!orderStatus) {
            return res.status(400).json({ message: 'orderStatus field is required' });
        }
        const order = await Order.findByIdAndUpdate(id, { orderStatus }, { new: true });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update order', error: error.message });
    }
};

// Delete order (Admin only)
exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findByIdAndDelete(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete order', error: error.message });
    }
};

// Get order by ID (Admin only)
exports.getOrderByIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id).populate('orderItems.product', 'name coverImage')
        .populate('shippingAddress');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch order', error: error.message });
    }
};