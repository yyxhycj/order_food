const TasteAnalytics = require('../models/TasteAnalytics');
const Joi = require('joi');

class TasteAnalyticsController {
  // 获取口味趋势分析
  static async getTasteTrends(req, res) {
    try {
      const { timeRange } = req.query;
      const schema = Joi.object({
        timeRange: Joi.string().valid('7', '30', '90', '365').default('30')
      });
      
      const { error, value } = schema.validate({ timeRange });
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const trends = await TasteAnalytics.getTasteTrends(value.timeRange);
      
      res.json({
        success: true,
        data: trends,
        message: '获取口味趋势分析成功'
      });
    } catch (error) {
      console.error('获取口味趋势分析失败:', error);
      res.status(500).json({
        success: false,
        message: '获取口味趋势分析失败'
      });
    }
  }

  // 获取用户偏好分析
  static async getUserPreferenceAnalysis(req, res) {
    try {
      const analysis = await TasteAnalytics.getUserPreferenceAnalysis();
      
      res.json({
        success: true,
        data: analysis,
        message: '获取用户偏好分析成功'
      });
    } catch (error) {
      console.error('获取用户偏好分析失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户偏好分析失败'
      });
    }
  }

  // 获取热门口味统计
  static async getPopularTastes(req, res) {
    try {
      const { limit } = req.query;
      const schema = Joi.object({
        limit: Joi.number().integer().min(1).max(50).default(10)
      });
      
      const { error, value } = schema.validate({ limit });
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const popularTastes = await TasteAnalytics.getPopularTastes(value.limit);
      
      res.json({
        success: true,
        data: popularTastes,
        message: '获取热门口味统计成功'
      });
    } catch (error) {
      console.error('获取热门口味统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取热门口味统计失败'
      });
    }
  }

  // 获取菜谱评价分析
  static async getRecipeRatingAnalysis(req, res) {
    try {
      const { recipeId } = req.query;
      const schema = Joi.object({
        recipeId: Joi.number().integer().positive().optional()
      });
      
      const { error, value } = schema.validate({ recipeId });
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const analysis = await TasteAnalytics.getRecipeRatingAnalysis(value.recipeId);
      
      res.json({
        success: true,
        data: analysis,
        message: '获取菜谱评价分析成功'
      });
    } catch (error) {
      console.error('获取菜谱评价分析失败:', error);
      res.status(500).json({
        success: false,
        message: '获取菜谱评价分析失败'
      });
    }
  }

  // 获取季节性口味分析
  static async getSeasonalTasteAnalysis(req, res) {
    try {
      const analysis = await TasteAnalytics.getSeasonalTasteAnalysis();
      
      res.json({
        success: true,
        data: analysis,
        message: '获取季节性口味分析成功'
      });
    } catch (error) {
      console.error('获取季节性口味分析失败:', error);
      res.status(500).json({
        success: false,
        message: '获取季节性口味分析失败'
      });
    }
  }

  // 获取用户口味匹配度分析
  static async getUserTasteMatching(req, res) {
    try {
      const { userId } = req.params;
      const matching = await TasteAnalytics.getUserTasteMatching(userId);
      
      if (!matching) {
        return res.status(404).json({
          success: false,
          message: '用户口味档案不存在'
        });
      }
      
      res.json({
        success: true,
        data: matching,
        message: '获取用户口味匹配度分析成功'
      });
    } catch (error) {
      console.error('获取用户口味匹配度分析失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户口味匹配度分析失败'
      });
    }
  }

  // 获取口味数据概览
  static async getTasteOverview(req, res) {
    try {
      const overview = await TasteAnalytics.getTasteOverview();
      
      res.json({
        success: true,
        data: overview,
        message: '获取口味数据概览成功'
      });
    } catch (error) {
      console.error('获取口味数据概览失败:', error);
      res.status(500).json({
        success: false,
        message: '获取口味数据概览失败'
      });
    }
  }

  // 获取商家推荐菜品
  static async getMerchantRecommendations(req, res) {
    try {
      const recommendations = await TasteAnalytics.getMerchantRecommendations();
      
      res.json({
        success: true,
        data: recommendations,
        message: '获取商家推荐菜品成功'
      });
    } catch (error) {
      console.error('获取商家推荐菜品失败:', error);
      res.status(500).json({
        success: false,
        message: '获取商家推荐菜品失败'
      });
    }
  }
}

module.exports = TasteAnalyticsController; 