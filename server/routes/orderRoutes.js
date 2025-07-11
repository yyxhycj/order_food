// routes/orderRoutes.js - 订单路由
const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');

// 获取订单列表
router.get('/', OrderController.getOrders);

// 获取订单统计
router.get('/stats', OrderController.getOrderStats);

// 获取今日统计
router.get('/stats/today', OrderController.getOrderStats);

// 获取状态统计
router.get('/stats/status', OrderController.getStatusStats);

// 根据订单号获取订单详情
router.get('/order-no/:orderNo', OrderController.getOrderByOrderNo);

// 获取单个订单详情
router.get('/:id', OrderController.getOrder);

// 创建订单
router.post('/', OrderController.createOrder);

// 更新订单状态
router.patch('/:id/status', OrderController.updateOrderStatus);

// 删除订单
router.delete('/:id', OrderController.deleteOrder);

module.exports = router; 