const Address = require('../models/Address');

// Create a new address
exports.createAddress = async (req, res) => {
    try {
        const address = new Address({ ...req.body, userId: req.user.id });
        await address.save();
        res.status(201).json(address);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all addresses for the authenticated user
exports.getAddresses = async (req, res) => {
    const addresses = await Address.find({ userId: req.user.id });
    res.json(addresses);
};

// Get a single address by ID (must belong to user)
exports.getAddressById = async (req, res) => {
    const address = await Address.findOne({ _id: req.params.id, userId: req.user.id });
    if (!address) return res.status(404).json({ message: 'Address not found' });
    res.json(address);
};

// Update an address (must belong to user)
exports.updateAddress = async (req, res) => {
    const address = await Address.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id },
        req.body,
        { new: true, runValidators: true }
    );
    if (!address) return res.status(404).json({ message: 'Address not found' });
    res.json(address);
};

// Delete an address (must belong to user)
exports.deleteAddress = async (req, res) => {
    const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!address) return res.status(404).json({ message: 'Address not found' });
    res.json({ message: 'Address deleted' });
};