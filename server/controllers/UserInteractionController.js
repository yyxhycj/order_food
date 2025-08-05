const UserInteraction = require('../models/UserInteraction');
const Joi = require('joi');

class UserInteractionController {
  // 关注用户
  static async followUser(req, res) {
    try {
      const { id } = req.params;
      const followerId = req.user?.id || 1; // 临时使用默认用户ID
      
      if (followerId == id) {
        return res.status(400).json({
          success: false,
          message: '不能关注自己'
        });
      }
      
      const result = await UserInteraction.follow(followerId, id);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
      
      res.json({
        success: true,
        data: { id: result.id },
        message: '关注成功'
      });
    } catch (error) {
      console.error('关注用户失败:', error);
      res.status(500).json({
        success: false,
        message: '关注用户失败'
      });
    }
  }

  // 取消关注用户
  static async unfollowUser(req, res) {
    try {
      const { id } = req.params;
      const followerId = req.user?.id || 1; // 临时使用默认用户ID
      
      const result = await UserInteraction.unfollow(followerId, id);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
      
      res.json({
        success: true,
        message: '取消关注成功'
      });
    } catch (error) {
      console.error('取消关注失败:', error);
      res.status(500).json({
        success: false,
        message: '取消关注失败'
      });
    }
  }

  // 检查是否关注某用户
  static async checkFollowStatus(req, res) {
    try {
      const { id } = req.params;
      const followerId = req.user?.id || 1; // 临时使用默认用户ID
      
      const isFollowing = await UserInteraction.isFollowing(followerId, id);
      
      res.json({
        success: true,
        data: { is_following: isFollowing },
        message: '获取关注状态成功'
      });
    } catch (error) {
      console.error('检查关注状态失败:', error);
      res.status(500).json({
        success: false,
        message: '检查关注状态失败'
      });
    }
  }

  // 获取用户关注列表
  static async getFollowing(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const following = await UserInteraction.getFollowing(id, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: following,
        message: '获取关注列表成功'
      });
    } catch (error) {
      console.error('获取关注列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取关注列表失败'
      });
    }
  }

  // 获取用户粉丝列表
  static async getFollowers(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const followers = await UserInteraction.getFollowers(id, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: followers,
        message: '获取粉丝列表成功'
      });
    } catch (error) {
      console.error('获取粉丝列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取粉丝列表失败'
      });
    }
  }

  // 点赞菜谱
  static async likeRecipe(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 1; // 临时使用默认用户ID
      
      const result = await UserInteraction.likeRecipe(userId, id);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
      
      res.json({
        success: true,
        data: { id: result.id },
        message: '点赞成功'
      });
    } catch (error) {
      console.error('点赞菜谱失败:', error);
      res.status(500).json({
        success: false,
        message: '点赞菜谱失败'
      });
    }
  }

  // 取消点赞菜谱
  static async unlikeRecipe(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 1; // 临时使用默认用户ID
      
      const result = await UserInteraction.unlikeRecipe(userId, id);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
      
      res.json({
        success: true,
        message: '取消点赞成功'
      });
    } catch (error) {
      console.error('取消点赞失败:', error);
      res.status(500).json({
        success: false,
        message: '取消点赞失败'
      });
    }
  }

  // 检查是否点赞某菜谱
  static async checkLikeStatus(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 1; // 临时使用默认用户ID
      
      const isLiked = await UserInteraction.isLikedRecipe(userId, id);
      
      res.json({
        success: true,
        data: { is_liked: isLiked },
        message: '获取点赞状态成功'
      });
    } catch (error) {
      console.error('检查点赞状态失败:', error);
      res.status(500).json({
        success: false,
        message: '检查点赞状态失败'
      });
    }
  }

  // 收藏菜谱
  static async collectRecipe(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 1; // 临时使用默认用户ID
      
      const result = await UserInteraction.collectRecipe(userId, id);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
      
      res.json({
        success: true,
        data: { id: result.id },
        message: '收藏成功'
      });
    } catch (error) {
      console.error('收藏菜谱失败:', error);
      res.status(500).json({
        success: false,
        message: '收藏菜谱失败'
      });
    }
  }

  // 取消收藏菜谱
  static async uncollectRecipe(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 1; // 临时使用默认用户ID
      
      const result = await UserInteraction.uncollectRecipe(userId, id);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
      
      res.json({
        success: true,
        message: '取消收藏成功'
      });
    } catch (error) {
      console.error('取消收藏失败:', error);
      res.status(500).json({
        success: false,
        message: '取消收藏失败'
      });
    }
  }

  // 检查是否收藏某菜谱
  static async checkCollectionStatus(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 1; // 临时使用默认用户ID
      
      const isCollected = await UserInteraction.isCollectedRecipe(userId, id);
      
      res.json({
        success: true,
        data: { is_collected: isCollected },
        message: '获取收藏状态成功'
      });
    } catch (error) {
      console.error('检查收藏状态失败:', error);
      res.status(500).json({
        success: false,
        message: '检查收藏状态失败'
      });
    }
  }

  // 获取用户收藏列表
  static async getCollections(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const collections = await UserInteraction.getUserCollections(id, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: collections,
        message: '获取收藏列表成功'
      });
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取收藏列表失败'
      });
    }
  }

  // 分享菜谱
  static async shareRecipe(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 1; // 临时使用默认用户ID
      const { share_type = 'general' } = req.body;
      
      const schema = Joi.object({
        share_type: Joi.string().valid('general', 'wechat', 'moments', 'weibo').default('general')
      });
      
      const { error } = schema.validate({ share_type });
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const result = await UserInteraction.shareRecipe(userId, id, share_type);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
      
      res.json({
        success: true,
        data: { id: result.id },
        message: '分享成功'
      });
    } catch (error) {
      console.error('分享菜谱失败:', error);
      res.status(500).json({
        success: false,
        message: '分享菜谱失败'
      });
    }
  }

  // 获取菜谱分享统计
  static async getShareStats(req, res) {
    try {
      const { id } = req.params;
      
      const stats = await UserInteraction.getRecipeShareStats(id);
      
      res.json({
        success: true,
        data: stats,
        message: '获取分享统计成功'
      });
    } catch (error) {
      console.error('获取分享统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取分享统计失败'
      });
    }
  }

  // 获取用户互动统计
  static async getInteractionStats(req, res) {
    try {
      const { id } = req.params;
      
      const stats = await UserInteraction.getUserInteractionStats(id);
      
      res.json({
        success: true,
        data: stats,
        message: '获取互动统计成功'
      });
    } catch (error) {
      console.error('获取互动统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取互动统计失败'
      });
    }
  }

  // 获取用户动态时间线
  static async getTimeline(req, res) {
    try {
      const userId = req.user?.id || 1; // 临时使用默认用户ID
      const { page = 1, limit = 10 } = req.query;
      
      const timeline = await UserInteraction.getUserTimeline(userId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.json({
        success: true,
        data: timeline,
        message: '获取动态时间线成功'
      });
    } catch (error) {
      console.error('获取动态时间线失败:', error);
      res.status(500).json({
        success: false,
        message: '获取动态时间线失败'
      });
    }
  }

  // 获取推荐关注用户
  static async getRecommendedUsers(req, res) {
    try {
      const userId = req.user?.id || 1; // 临时使用默认用户ID
      const { limit = 10 } = req.query;
      
      const users = await UserInteraction.getRecommendedUsers(userId, parseInt(limit));
      
      res.json({
        success: true,
        data: users,
        message: '获取推荐用户成功'
      });
    } catch (error) {
      console.error('获取推荐用户失败:', error);
      res.status(500).json({
        success: false,
        message: '获取推荐用户失败'
      });
    }
  }

  // 批量检查交互状态
  static async checkBatchInteractionStatus(req, res) {
    try {
      const userId = req.user?.id || 1; // 临时使用默认用户ID
      const { recipe_ids = [], user_ids = [] } = req.body;
      
      const schema = Joi.object({
        recipe_ids: Joi.array().items(Joi.number().integer()).default([]),
        user_ids: Joi.array().items(Joi.number().integer()).default([])
      });
      
      const { error, value } = schema.validate({ recipe_ids, user_ids });
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const result = {
        recipes: {},
        users: {}
      };
      
      // 检查菜谱点赞和收藏状态
      for (const recipeId of value.recipe_ids) {
        const [isLiked, isCollected] = await Promise.all([
          UserInteraction.isLikedRecipe(userId, recipeId),
          UserInteraction.isCollectedRecipe(userId, recipeId)
        ]);
        
        result.recipes[recipeId] = {
          is_liked: isLiked,
          is_collected: isCollected
        };
      }
      
      // 检查用户关注状态
      for (const targetUserId of value.user_ids) {
        const isFollowing = await UserInteraction.isFollowing(userId, targetUserId);
        result.users[targetUserId] = {
          is_following: isFollowing
        };
      }
      
      res.json({
        success: true,
        data: result,
        message: '批量检查交互状态成功'
      });
    } catch (error) {
      console.error('批量检查交互状态失败:', error);
      res.status(500).json({
        success: false,
        message: '批量检查交互状态失败'
      });
    }
  }
}

module.exports = UserInteractionController; 