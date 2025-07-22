const express = require('express');
const router = express.Router();
const { getMyOrders, getOrderById, getAllOrders } = require('../controllers/orderController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, getMyOrders);
router.get('/:id', authenticateToken, getOrderById);
router.get('/admin/all', authenticateToken, requireAdmin, getAllOrders);
// Admin: Update any order
router.put('/admin/:id', authenticateToken, requireAdmin, require('../controllers/orderController').updateOrder);
// Admin: Delete any order
router.delete('/admin/:id', authenticateToken, requireAdmin, require('../controllers/orderController').deleteOrder);

module.exports = router;