const express = require('express');
const router = express.Router();
const RecipeController = require('../controllers/RecipeController');

// 菜谱基本CRUD操作
router.get('/', RecipeController.getRecipes);                    // 获取菜谱列表
router.get('/popular', RecipeController.getPopularRecipes);      // 获取热门菜谱
router.get('/recommended', RecipeController.getRecommendedRecipes); // 获取推荐菜谱
router.get('/stats', RecipeController.getRecipeStats);           // 获取菜谱统计
router.post('/', RecipeController.createRecipe);                 // 创建菜谱
router.get('/:id', RecipeController.getRecipeById);             // 获取菜谱详情
router.put('/:id', RecipeController.updateRecipe);              // 更新菜谱
router.delete('/:id', RecipeController.deleteRecipe);           // 删除菜谱

// 菜谱状态管理
router.patch('/:id/status', RecipeController.updateRecipeStatus); // 更新菜谱状态

// 菜谱互动操作
router.post('/:id/like', RecipeController.likeRecipe);          // 点赞菜谱
router.post('/:id/collect', RecipeController.collectRecipe);    // 收藏菜谱
router.post('/:id/view', RecipeController.viewRecipe);          // 记录浏览

// 智能菜谱生成
router.post('/generate', RecipeController.generateRecipe);      // 智能菜谱生成
router.post('/generate/preview', RecipeController.generateRecipe); // 预览生成结果

// 新增推荐相关接口
router.get('/:id/similar', RecipeController.getSimilarRecipes); // 获取相似菜谱
router.post('/realtime-recommendations', RecipeController.getRealtimeRecommendations); // 实时推荐引擎
router.post('/personalized-generate', RecipeController.generatePersonalizedRecipe); // 个性化菜谱生成
router.get('/recommend-ingredients', RecipeController.getRecommendedIngredients); // 获取推荐食材
router.get('/trending', RecipeController.getTrendingRecipes);    // 获取趋势菜谱
router.get('/popularity-ranking', RecipeController.getPopularityRanking); // 获取流行度排名
router.get('/recommendation-summary', RecipeController.getRecommendationSummary); // 获取推荐摘要

module.exports = router; 