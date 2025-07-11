// routes/categoryRoutes.js - 分类路由
const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');

// 获取分类列表
router.get('/', CategoryController.getCategories);

// 获取分类统计
router.get('/stats', CategoryController.getCategoryStats);

// 获取单个分类详情
router.get('/:id', CategoryController.getCategory);

// 创建分类
router.post('/', CategoryController.createCategory);

// 更新分类
router.put('/:id', CategoryController.updateCategory);

// 更新分类状态
router.patch('/:id/status', CategoryController.updateCategoryStatus);

// 更新分类排序
router.patch('/:id/sort', CategoryController.updateCategorySort);

// 删除分类
router.delete('/:id', CategoryController.deleteCategory);

module.exports = router; 