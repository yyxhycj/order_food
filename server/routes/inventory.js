const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/InventoryController');

// 获取所有库存信息
router.get('/', InventoryController.getAllInventory);

// 获取库存统计
router.get('/stats', InventoryController.getInventoryStats);

// 获取库存预警列表
router.get('/alerts', InventoryController.getInventoryAlerts);

// 根据商品ID获取库存信息
router.get('/product/:productId', InventoryController.getInventoryByProductId);

// 创建库存记录
router.post('/', InventoryController.createInventory);

// 更新库存数量
router.put('/product/:productId/stock', InventoryController.updateStock);

module.exports = router; 