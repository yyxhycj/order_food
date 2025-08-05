const express = require('express');
const router = express.Router();
const GameController = require('../controllers/GameController');

// 获取用户游戏化数据
router.get('/user/:user_id', GameController.getUserGameData);

// 获取用户等级信息
router.get('/user/:user_id/level', GameController.getUserLevel);

// 获取用户徽章列表
router.get('/user/:user_id/badges', GameController.getUserBadges);

// 获取用户成就列表
router.get('/user/:user_id/achievements', GameController.getUserAchievements);

// 获取用户排名信息
router.get('/user/:user_id/ranking', GameController.getUserRanking);

// 获取排行榜
router.get('/leaderboard', GameController.getLeaderboard);

// 处理用户行为并更新积分
router.post('/action', GameController.handleUserAction);

// 获取积分变化历史
router.get('/user/:user_id/points-history', GameController.getPointsHistory);

// 获取成就分类
router.get('/achievement-categories', GameController.getAchievementCategories);

// 获取等级详情
router.get('/levels', GameController.getLevelDetails);

// 获取积分规则
router.get('/points-rules', GameController.getPointsRules);

// 获取用户统计概览
router.get('/user/:user_id/stats', GameController.getUserStatsSummary);

// 获取推荐挑战
router.get('/user/:user_id/challenges', GameController.getRecommendedChallenges);

module.exports = router; 