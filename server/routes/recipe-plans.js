const express = require('express');
const router = express.Router();
const RecipePlanController = require('../controllers/RecipePlanController');

// 计划管理相关路由
router.get('/', RecipePlanController.getPlans);                    // 获取计划列表
router.get('/trending', RecipePlanController.getTrending);         // 获取热门计划
router.get('/recommended', RecipePlanController.getRecommended);   // 获取推荐计划
router.get('/:id', RecipePlanController.getPlan);                 // 获取计划详情
router.post('/', RecipePlanController.createPlan);                // 创建计划
router.put('/:id', RecipePlanController.updatePlan);              // 更新计划
router.delete('/:id', RecipePlanController.deletePlan);           // 删除计划
router.patch('/:id/status', RecipePlanController.updateStatus);   // 更新计划状态

// 计划菜谱管理
router.post('/:id/recipes', RecipePlanController.addRecipe);      // 添加菜谱到计划
router.delete('/:id/recipes', RecipePlanController.removeRecipe); // 从计划移除菜谱

// 计划统计
router.get('/:id/stats', RecipePlanController.getStats);          // 获取计划统计
router.get('/:id/followers', RecipePlanController.getFollowers);  // 获取跟随者
router.get('/:id/follow-stats', RecipePlanController.getFollowStats); // 获取跟随统计

// 计划跟随相关路由
router.post('/:id/follow', RecipePlanController.followPlan);      // 跟随计划
router.delete('/:id/follow', RecipePlanController.unfollowPlan);  // 取消跟随计划
router.put('/:id/progress', RecipePlanController.updateProgress); // 更新计划进度
router.post('/:id/complete-recipe', RecipePlanController.markRecipeCompleted); // 标记菜谱完成
router.post('/:id/complete', RecipePlanController.completePlan);  // 完成计划

module.exports = router; 