const express = require('express');
const router = express.Router();
const UserInteractionController = require('../controllers/UserInteractionController');

// 用户关注相关路由
router.post('/users/:id/follow', UserInteractionController.followUser);         // 关注用户
router.delete('/users/:id/follow', UserInteractionController.unfollowUser);     // 取消关注用户
router.get('/users/:id/follow-status', UserInteractionController.checkFollowStatus); // 检查关注状态
router.get('/users/:id/following', UserInteractionController.getFollowing);     // 获取关注列表
router.get('/users/:id/followers', UserInteractionController.getFollowers);     // 获取粉丝列表
router.get('/users/recommended', UserInteractionController.getRecommendedUsers); // 获取推荐用户

// 菜谱点赞相关路由
router.post('/recipes/:id/like', UserInteractionController.likeRecipe);         // 点赞菜谱
router.delete('/recipes/:id/like', UserInteractionController.unlikeRecipe);     // 取消点赞菜谱
router.get('/recipes/:id/like-status', UserInteractionController.checkLikeStatus); // 检查点赞状态

// 菜谱收藏相关路由
router.post('/recipes/:id/collect', UserInteractionController.collectRecipe);   // 收藏菜谱
router.delete('/recipes/:id/collect', UserInteractionController.uncollectRecipe); // 取消收藏菜谱
router.get('/recipes/:id/collect-status', UserInteractionController.checkCollectionStatus); // 检查收藏状态
router.get('/users/:id/collections', UserInteractionController.getCollections); // 获取收藏列表

// 菜谱分享相关路由
router.post('/recipes/:id/share', UserInteractionController.shareRecipe);       // 分享菜谱
router.get('/recipes/:id/share-stats', UserInteractionController.getShareStats); // 获取分享统计

// 用户统计和动态
router.get('/users/:id/interaction-stats', UserInteractionController.getInteractionStats); // 获取用户互动统计
router.get('/timeline', UserInteractionController.getTimeline);                 // 获取用户动态时间线

// 批量操作
router.post('/batch-check', UserInteractionController.checkBatchInteractionStatus); // 批量检查交互状态

module.exports = router; 