const express = require('express');
const router = express.Router();
const UserTagController = require('../controllers/UserTagController');

// 用户标签管理
router.get('/users/:id/tags', UserTagController.getUserTags);           // 获取用户标签
router.post('/users/:id/tags', UserTagController.addUserTag);           // 添加用户标签
router.delete('/users/:id/tags/:tagName', UserTagController.deleteUserTag); // 删除用户标签
router.put('/users/:id/tags/:tagName', UserTagController.updateTagConfidence); // 更新标签置信度

// 自动标签生成
router.post('/users/:id/tags/generate', UserTagController.generateUserTags); // 自动生成用户标签

// 用户推荐和相似度
router.get('/users/:id/similar-users', UserTagController.getSimilarUsers); // 获取相似用户

// 标签统计和分析
router.get('/tags/popular', UserTagController.getPopularTags);           // 获取热门标签
router.get('/tags/trends', UserTagController.getTagTrends);             // 获取标签趋势
router.get('/users/:id/tags/stats', UserTagController.getUserTagStats);  // 获取用户标签统计

// 批量操作
router.post('/users/:id/tags/batch', UserTagController.batchAddTags);    // 批量添加标签
router.delete('/users/:id/tags/cleanup', UserTagController.cleanupUserTags); // 清理低置信度标签

// 标签推荐
router.get('/tags/recommend-users', UserTagController.recommendUsersByTags); // 根据标签推荐用户

module.exports = router; 