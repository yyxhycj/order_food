const express = require('express');
const router = express.Router();
const TasteAnalyticsController = require('../controllers/TasteAnalyticsController');

// 获取口味数据概览
router.get('/overview', TasteAnalyticsController.getTasteOverview);

// 获取口味趋势分析
router.get('/trends', TasteAnalyticsController.getTasteTrends);

// 获取用户偏好分析
router.get('/user-preferences', TasteAnalyticsController.getUserPreferenceAnalysis);

// 获取热门口味统计
router.get('/popular-tastes', TasteAnalyticsController.getPopularTastes);

// 获取菜谱评价分析
router.get('/recipe-ratings', TasteAnalyticsController.getRecipeRatingAnalysis);

// 获取季节性口味分析
router.get('/seasonal-analysis', TasteAnalyticsController.getSeasonalTasteAnalysis);

// 获取用户口味匹配度分析
router.get('/user-matching/:userId', TasteAnalyticsController.getUserTasteMatching);

// 获取商家推荐菜品
router.get('/merchant-recommendations', TasteAnalyticsController.getMerchantRecommendations);

module.exports = router; 