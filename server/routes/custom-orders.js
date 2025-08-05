const express = require('express');
const router = express.Router();
const CustomOrderController = require('../controllers/CustomOrderController');

// 获取商品的定制化选项
router.get('/products/:productId/customization-options', CustomOrderController.getCustomizationOptions);

// 验证定制化选项
router.post('/products/:productId/validate-customization', CustomOrderController.validateCustomizationOptions);

// 计算定制化价格调整
router.post('/products/:productId/calculate-price', CustomOrderController.calculateCustomPrice);

// 创建定制化订单
router.post('/', CustomOrderController.createCustomOrder);

// 获取定制化订单详情
router.get('/:orderId', CustomOrderController.getCustomOrderDetails);

// 获取定制化订单统计
router.get('/stats/overview', CustomOrderController.getCustomOrderStats);

// 获取热门定制化选项
router.get('/stats/popular-customizations', CustomOrderController.getPopularCustomizations);

// 创建定制化选项
router.post('/customization-options', CustomOrderController.createCustomizationOption);

// 更新定制化选项
router.put('/customization-options/:optionId', CustomOrderController.updateCustomizationOption);

// 删除定制化选项
router.delete('/customization-options/:optionId', CustomOrderController.deleteCustomizationOption);

module.exports = router; 