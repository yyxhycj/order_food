const express = require('express');
const router = express.Router();
const BlindBoxController = require('../controllers/BlindBoxController');

// 获取盲盒主题列表
router.get('/themes', BlindBoxController.getThemes);

// 生成智能盲盒（菜谱模式）
router.post('/generate', BlindBoxController.generateBlindBox);

// 生成基于食材的盲盒
router.post('/generate/ingredient', BlindBoxController.generateIngredientBlindBox);

// 获取常用食材列表
router.get('/ingredients', BlindBoxController.getIngredients);

// 预览盲盒生成结果（菜谱模式）
router.post('/preview', BlindBoxController.previewBlindBox);

// 预览基于食材的盲盒
router.post('/preview/ingredient', BlindBoxController.previewIngredientBlindBox);

// 获取用户盲盒列表
router.get('/user/:user_id', BlindBoxController.getUserBlindBoxes);

// 获取盲盒详情
router.get('/:box_id', BlindBoxController.getBlindBoxDetail);

// 开启盲盒中的菜谱
router.post('/:box_id/open', BlindBoxController.openRecipe);

// 获取盲盒统计信息
router.get('/user/:user_id/statistics', BlindBoxController.getStatistics);

// 获取盲盒推荐设置
router.get('/user/:user_id/recommendations', BlindBoxController.getRecommendedSettings);

// 删除盲盒
router.delete('/:box_id', BlindBoxController.deleteBlindBox);

module.exports = router; 