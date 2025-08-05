const GameificationSystem = require('../models/GameificationSystem');

class GameController {
  /**
   * 获取用户游戏化数据
   */
  static async getUserGameData(req, res) {
    try {
      const { user_id } = req.params;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const gameData = await GameificationSystem.getUserGameData(user_id);
      
      if (!gameData) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      res.json({
        success: true,
        data: gameData,
        message: '获取用户游戏化数据成功'
      });
    } catch (error) {
      console.error('Error getting user game data:', error);
      res.status(500).json({
        success: false,
        message: '获取用户游戏化数据失败',
        error: error.message
      });
    }
  }

  /**
   * 获取用户等级信息
   */
  static async getUserLevel(req, res) {
    try {
      const { user_id } = req.params;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const gameData = await GameificationSystem.getUserGameData(user_id);
      
      if (!gameData) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      
      const levelInfo = {
        level: gameData.level,
        level_name: gameData.level_name,
        level_icon: gameData.level_icon,
        level_color: gameData.level_color,
        total_points: gameData.total_points,
        current_level_points: gameData.current_level_points,
        next_level_points: gameData.next_level_points,
        progress_percentage: gameData.progress_percentage
      };
      
      res.json({
        success: true,
        data: levelInfo,
        message: '获取用户等级信息成功'
      });
    } catch (error) {
      console.error('Error getting user level:', error);
      res.status(500).json({
        success: false,
        message: '获取用户等级信息失败',
        error: error.message
      });
    }
  }

  /**
   * 获取用户徽章列表
   */
  static async getUserBadges(req, res) {
    try {
      const { user_id } = req.params;
      const { earned_only } = req.query;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const badges = await GameificationSystem.getUserBadges(user_id);
      
      let filteredBadges = badges;
      if (earned_only === 'true') {
        filteredBadges = badges.filter(badge => badge.earned);
      }
      
      res.json({
        success: true,
        data: filteredBadges,
        message: '获取用户徽章列表成功'
      });
    } catch (error) {
      console.error('Error getting user badges:', error);
      res.status(500).json({
        success: false,
        message: '获取用户徽章列表失败',
        error: error.message
      });
    }
  }

  /**
   * 获取用户成就列表
   */
  static async getUserAchievements(req, res) {
    try {
      const { user_id } = req.params;
      const { earned_only, category } = req.query;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const achievements = await GameificationSystem.getUserAchievements(user_id);
      
      let filteredAchievements = achievements;
      
      if (earned_only === 'true') {
        filteredAchievements = filteredAchievements.filter(achievement => achievement.earned);
      }
      
      if (category) {
        filteredAchievements = filteredAchievements.filter(achievement => achievement.category === category);
      }
      
      res.json({
        success: true,
        data: filteredAchievements,
        message: '获取用户成就列表成功'
      });
    } catch (error) {
      console.error('Error getting user achievements:', error);
      res.status(500).json({
        success: false,
        message: '获取用户成就列表失败',
        error: error.message
      });
    }
  }

  /**
   * 获取用户排名信息
   */
  static async getUserRanking(req, res) {
    try {
      const { user_id } = req.params;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const ranking = await GameificationSystem.getUserRanking(user_id);
      
      res.json({
        success: true,
        data: ranking,
        message: '获取用户排名信息成功'
      });
    } catch (error) {
      console.error('Error getting user ranking:', error);
      res.status(500).json({
        success: false,
        message: '获取用户排名信息失败',
        error: error.message
      });
    }
  }

  /**
   * 获取排行榜
   */
  static async getLeaderboard(req, res) {
    try {
      const { type = 'overall', limit = 50 } = req.query;
      
      if (!['overall', 'creator', 'reviewer'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: '排行榜类型不正确，支持：overall、creator、reviewer'
        });
      }
      
      const leaderboard = await GameificationSystem.getLeaderboard(type, parseInt(limit));
      
      res.json({
        success: true,
        data: leaderboard,
        message: '获取排行榜成功'
      });
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      res.status(500).json({
        success: false,
        message: '获取排行榜失败',
        error: error.message
      });
    }
  }

  /**
   * 处理用户行为并更新积分
   */
  static async handleUserAction(req, res) {
    try {
      const { user_id, action, action_data } = req.body;
      
      if (!user_id || !action) {
        return res.status(400).json({
          success: false,
          message: '用户ID和行为类型不能为空'
        });
      }
      
      const result = await GameificationSystem.handleUserAction(user_id, action, action_data);
      
      res.json({
        success: true,
        data: result,
        message: '处理用户行为成功'
      });
    } catch (error) {
      console.error('Error handling user action:', error);
      res.status(500).json({
        success: false,
        message: '处理用户行为失败',
        error: error.message
      });
    }
  }

  /**
   * 获取积分变化历史
   */
  static async getPointsHistory(req, res) {
    try {
      const { user_id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      // 这里应该从积分历史表获取数据，暂时返回模拟数据
      const history = [
        {
          id: 1,
          action: 'create_recipe',
          points: 50,
          description: '创建菜谱：宫保鸡丁',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          action: 'create_review',
          points: 10,
          description: '发布评价：红烧肉',
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      
      res.json({
        success: true,
        data: history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: history.length
        },
        message: '获取积分变化历史成功'
      });
    } catch (error) {
      console.error('Error getting points history:', error);
      res.status(500).json({
        success: false,
        message: '获取积分变化历史失败',
        error: error.message
      });
    }
  }

  /**
   * 获取成就分类
   */
  static async getAchievementCategories(req, res) {
    try {
      const categories = [
        {
          id: 'level',
          name: '等级成就',
          description: '达到特定等级的成就',
          icon: '🏆',
          color: '#FFD700'
        },
        {
          id: 'creation',
          name: '创作成就',
          description: '创建菜谱相关的成就',
          icon: '📝',
          color: '#4CAF50'
        },
        {
          id: 'review',
          name: '评价成就',
          description: '发布评价相关的成就',
          icon: '💬',
          color: '#2196F3'
        },
        {
          id: 'influence',
          name: '影响力成就',
          description: '获得关注和影响力的成就',
          icon: '🌟',
          color: '#E91E63'
        },
        {
          id: 'community',
          name: '社区成就',
          description: '参与社区活动的成就',
          icon: '👥',
          color: '#9C27B0'
        },
        {
          id: 'quality',
          name: '质量成就',
          description: '高质量内容相关的成就',
          icon: '🎯',
          color: '#FF5722'
        }
      ];
      
      res.json({
        success: true,
        data: categories,
        message: '获取成就分类成功'
      });
    } catch (error) {
      console.error('Error getting achievement categories:', error);
      res.status(500).json({
        success: false,
        message: '获取成就分类失败',
        error: error.message
      });
    }
  }

  /**
   * 获取等级详情
   */
  static async getLevelDetails(req, res) {
    try {
      const levels = [
        { level: 1, name: '新手厨师', icon: '👨‍🍳', color: '#95a5a6', minPoints: 0, maxPoints: 99 },
        { level: 2, name: '厨房助手', icon: '🥄', color: '#3498db', minPoints: 100, maxPoints: 299 },
        { level: 3, name: '家常达人', icon: '🍳', color: '#2ecc71', minPoints: 300, maxPoints: 599 },
        { level: 4, name: '烹饪专家', icon: '👨‍🍳', color: '#f39c12', minPoints: 600, maxPoints: 999 },
        { level: 5, name: '美食大师', icon: '🏆', color: '#e74c3c', minPoints: 1000, maxPoints: 1999 },
        { level: 6, name: '米其林厨师', icon: '⭐', color: '#9b59b6', minPoints: 2000, maxPoints: 3999 },
        { level: 7, name: '料理之神', icon: '🌟', color: '#e67e22', minPoints: 4000, maxPoints: 7999 },
        { level: 8, name: '传奇大厨', icon: '👑', color: '#1abc9c', minPoints: 8000, maxPoints: 15999 },
        { level: 9, name: '美食宗师', icon: '💎', color: '#34495e', minPoints: 16000, maxPoints: 31999 },
        { level: 10, name: '厨神', icon: '🔥', color: '#c0392b', minPoints: 32000, maxPoints: Infinity }
      ];
      
      res.json({
        success: true,
        data: levels,
        message: '获取等级详情成功'
      });
    } catch (error) {
      console.error('Error getting level details:', error);
      res.status(500).json({
        success: false,
        message: '获取等级详情失败',
        error: error.message
      });
    }
  }

  /**
   * 获取积分规则
   */
  static async getPointsRules(req, res) {
    try {
      const rules = [
        {
          action: 'create_recipe',
          points: 50,
          description: '创建菜谱',
          category: 'creation'
        },
        {
          action: 'create_review',
          points: 10,
          description: '发布评价',
          category: 'review'
        },
        {
          action: 'high_rating_review',
          points: 5,
          description: '高评分评价（4.5分以上）',
          category: 'review'
        },
        {
          action: 'recipe_viewed',
          points: 0.2,
          description: '菜谱被浏览（每10次浏览2分）',
          category: 'influence'
        },
        {
          action: 'recipe_liked',
          points: 3,
          description: '菜谱被点赞',
          category: 'influence'
        }
      ];
      
      res.json({
        success: true,
        data: rules,
        message: '获取积分规则成功'
      });
    } catch (error) {
      console.error('Error getting points rules:', error);
      res.status(500).json({
        success: false,
        message: '获取积分规则失败',
        error: error.message
      });
    }
  }

  /**
   * 获取用户统计概览
   */
  static async getUserStatsSummary(req, res) {
    try {
      const { user_id } = req.params;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const stats = await GameificationSystem.getUserStats(user_id);
      
      const summary = {
        total_points: stats.total_points,
        level: stats.level,
        created_recipes: stats.created_recipes,
        review_count: stats.review_count,
        high_rating_reviews: stats.high_rating_reviews,
        total_views: stats.total_views,
        total_recipe_likes: stats.total_recipe_likes,
        earned_badges: 0,
        earned_achievements: 0
      };
      
      // 计算已获得的徽章和成就数量
      const badges = await GameificationSystem.getUserBadges(user_id);
      const achievements = await GameificationSystem.getUserAchievements(user_id);
      
      summary.earned_badges = badges.filter(b => b.earned).length;
      summary.earned_achievements = achievements.filter(a => a.earned).length;
      
      res.json({
        success: true,
        data: summary,
        message: '获取用户统计概览成功'
      });
    } catch (error) {
      console.error('Error getting user stats summary:', error);
      res.status(500).json({
        success: false,
        message: '获取用户统计概览失败',
        error: error.message
      });
    }
  }

  /**
   * 获取推荐挑战
   */
  static async getRecommendedChallenges(req, res) {
    try {
      const { user_id } = req.params;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const stats = await GameificationSystem.getUserStats(user_id);
      const challenges = [];
      
      // 基于用户当前状态推荐挑战
      if (stats.created_recipes < 5) {
        challenges.push({
          id: 'first_recipes',
          title: '菜谱创作新手',
          description: '创建你的前5个菜谱',
          progress: stats.created_recipes,
          target: 5,
          reward: '获得"创作新手"徽章',
          difficulty: 'easy'
        });
      }
      
      if (stats.review_count < 10) {
        challenges.push({
          id: 'active_reviewer',
          title: '积极评论家',
          description: '发布10条评价',
          progress: stats.review_count,
          target: 10,
          reward: '获得"积极评论家"徽章',
          difficulty: 'easy'
        });
      }
      
      if (stats.level < 3) {
        challenges.push({
          id: 'level_up',
          title: '等级提升',
          description: '达到家常达人等级',
          progress: stats.level,
          target: 3,
          reward: '解锁更多功能',
          difficulty: 'medium'
        });
      }
      
      if (stats.total_views < 1000) {
        challenges.push({
          id: 'popular_creator',
          title: '人气作者',
          description: '菜谱总浏览量达到1000',
          progress: stats.total_views,
          target: 1000,
          reward: '获得"人气作者"徽章',
          difficulty: 'hard'
        });
      }
      
      res.json({
        success: true,
        data: challenges,
        message: '获取推荐挑战成功'
      });
    } catch (error) {
      console.error('Error getting recommended challenges:', error);
      res.status(500).json({
        success: false,
        message: '获取推荐挑战失败',
        error: error.message
      });
    }
  }
}

module.exports = GameController; 