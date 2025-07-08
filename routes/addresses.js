const express = require('express');
const router = express.Router();
const { createAddress, getAddresses, getAddressById, updateAddress, deleteAddress } = require('../controllers/addressController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, createAddress);
router.get('/', authenticateToken, getAddresses);
router.get('/:id', authenticateToken, getAddressById);
router.put('/:id', authenticateToken, updateAddress);
router.delete('/:id', authenticateToken, deleteAddress);

module.exports = router;