// routes/productRoutes.js - 商品路由
const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');

// 获取商品列表
router.get('/', ProductController.getProducts);

// 获取商品统计
router.get('/stats', ProductController.getProductStats);

// 获取单个商品详情
router.get('/:id', ProductController.getProduct);

// 创建商品
router.post('/', ProductController.createProduct);

// 更新商品
router.put('/:id', ProductController.updateProduct);

// 更新商品状态
router.patch('/:id/status', ProductController.updateProductStatus);

// 删除商品
router.delete('/:id', ProductController.deleteProduct);

module.exports = router; 