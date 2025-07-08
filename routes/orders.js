const express = require('express');
const router = express.Router();
const { getMyOrders, getOrderById } = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getMyOrders);
router.get('/:id', authenticateToken, getOrderById);

module.exports = router;