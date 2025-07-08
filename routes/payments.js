const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyPaymentAndCreateOrder } = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

router.post('/create-order', authenticateToken, createRazorpayOrder);
router.post('/verify', authenticateToken, verifyPaymentAndCreateOrder);

module.exports = router;