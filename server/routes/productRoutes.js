// routes/dishRoutes.js - 菜品路由
const express = require('express');
const router = express.Router();
const DishController = require('../controllers/productController');

// 获取菜品列表
router.get('/', DishController.getDishes);

// 获取菜品统计
router.get('/stats', DishController.getProductStats);

// 获取单个菜品详情
router.get('/:id', DishController.getProduct);

// 创建菜品
router.post('/', DishController.createProduct);

// 更新菜品
router.put('/:id', DishController.updateProduct);

// 更新菜品状态
router.patch('/:id/status', DishController.updateProductStatus);

// 删除菜品
router.delete('/:id', DishController.deleteProduct);

module.exports = router; 