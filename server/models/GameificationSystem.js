const db = require('../database/connection');

class GameificationSystem {
  /**
   * 获取用户游戏化数据
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 游戏化数据
   */
  static async getUserGameData(userId) {
    try {
      const query = `
        SELECT 
          u.id,
          u.nickname,
          u.avatar,
          u.cooking_level,
          u.recipe_count,
          u.total_likes,
          COUNT(DISTINCT rr.id) as review_count,
          SUM(CASE WHEN rr.overall_rating >= 4.5 THEN 1 ELSE 0 END) as high_rating_reviews,
          COUNT(DISTINCT r.id) as created_recipes,
          SUM(r.view_count) as total_views,
          SUM(r.like_count) as total_recipe_likes
        FROM users u
        LEFT JOIN recipe_reviews rr ON u.id = rr.user_id
        LEFT JOIN recipes r ON u.id = r.creator_id
        WHERE u.id = ?
        GROUP BY u.id
      `;
      
      const rows = await db.query(query, [userId]);
      
      if (rows.length === 0) {
        return null;
      }
      
      const userData = rows[0];
      
      // 计算用户等级和积分
      const gameData = await this.calculateUserLevel(userData);
      
      // 获取用户徽章
      gameData.badges = await this.getUserBadges(userId);
      
      // 获取用户成就
      gameData.achievements = await this.getUserAchievements(userId);
      
      // 获取用户排名
      gameData.ranking = await this.getUserRanking(userId);
      
      return gameData;
    } catch (error) {
      console.error('Error getting user game data:', error);
      throw error;
    }
  }

  /**
   * 计算用户等级和积分
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} 等级和积分信息
   */
  static async calculateUserLevel(userData) {
    try {
      const {
        id,
        nickname,
        avatar,
        cooking_level,
        review_count,
        high_rating_reviews,
        created_recipes,
        total_views,
        total_recipe_likes
      } = userData;
      
      // 计算总积分
      let totalPoints = 0;
      
      // 评价相关积分
      totalPoints += (review_count || 0) * 10; // 每条评价10分
      totalPoints += (high_rating_reviews || 0) * 5; // 高评分评价额外5分
      
      // 创作相关积分
      totalPoints += (created_recipes || 0) * 50; // 每个菜谱50分
      totalPoints += Math.floor((total_views || 0) / 10) * 2; // 每10次浏览2分
      totalPoints += (total_recipe_likes || 0) * 3; // 每个点赞3分
      
      // 根据积分计算等级
      const level = this.calculateLevel(totalPoints);
      
      return {
        user_id: id,
        nickname,
        avatar,
        cooking_level,
        total_points: totalPoints,
        level: level.level,
        level_name: level.name,
        level_icon: level.icon,
        level_color: level.color,
        current_level_points: level.currentLevelPoints,
        next_level_points: level.nextLevelPoints,
        progress_percentage: level.progressPercentage,
        review_count: review_count || 0,
        high_rating_reviews: high_rating_reviews || 0,
        created_recipes: created_recipes || 0,
        total_views: total_views || 0,
        total_recipe_likes: total_recipe_likes || 0
      };
    } catch (error) {
      console.error('Error calculating user level:', error);
      throw error;
    }
  }

  /**
   * 根据积分计算等级
   * @param {number} points - 积分
   * @returns {Object} 等级信息
   */
  static calculateLevel(points) {
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
    
    const currentLevel = levels.find(l => points >= l.minPoints && points <= l.maxPoints) || levels[0];
    const nextLevel = levels.find(l => l.level === currentLevel.level + 1);
    
    const currentLevelPoints = points - currentLevel.minPoints;
    const nextLevelPoints = nextLevel ? nextLevel.minPoints - currentLevel.minPoints : 0;
    const progressPercentage = nextLevel ? Math.round((currentLevelPoints / nextLevelPoints) * 100) : 100;
    
    return {
      level: currentLevel.level,
      name: currentLevel.name,
      icon: currentLevel.icon,
      color: currentLevel.color,
      currentLevelPoints,
      nextLevelPoints,
      progressPercentage,
      totalPoints: points
    };
  }

  /**
   * 获取用户徽章
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 徽章列表
   */
  static async getUserBadges(userId) {
    try {
      // 获取用户统计数据
      const stats = await this.getUserStats(userId);
      
      const badges = [
        {
          id: 'first_recipe',
          name: '初出茅庐',
          description: '创建第一个菜谱',
          icon: '🥚',
          color: '#95a5a6',
          earned: stats.created_recipes > 0,
          progress: Math.min(stats.created_recipes, 1),
          target: 1
        },
        {
          id: 'recipe_creator',
          name: '创作达人',
          description: '创建10个菜谱',
          icon: '📝',
          color: '#3498db',
          earned: stats.created_recipes >= 10,
          progress: Math.min(stats.created_recipes, 10),
          target: 10
        },
        {
          id: 'prolific_creator',
          name: '高产作者',
          description: '创建50个菜谱',
          icon: '📚',
          color: '#e74c3c',
          earned: stats.created_recipes >= 50,
          progress: Math.min(stats.created_recipes, 50),
          target: 50
        },
        {
          id: 'first_review',
          name: '点评新人',
          description: '发布第一条评价',
          icon: '💬',
          color: '#f39c12',
          earned: stats.review_count > 0,
          progress: Math.min(stats.review_count, 1),
          target: 1
        },
        {
          id: 'active_reviewer',
          name: '活跃评论家',
          description: '发布100条评价',
          icon: '📢',
          color: '#9b59b6',
          earned: stats.review_count >= 100,
          progress: Math.min(stats.review_count, 100),
          target: 100
        },
        {
          id: 'quality_reviewer',
          name: '优质评论家',
          description: '发布50条高质量评价',
          icon: '⭐',
          color: '#e67e22',
          earned: stats.high_rating_reviews >= 50,
          progress: Math.min(stats.high_rating_reviews, 50),
          target: 50
        },
        {
          id: 'popular_creator',
          name: '人气作者',
          description: '菜谱总浏览量超过10000',
          icon: '🔥',
          color: '#c0392b',
          earned: stats.total_views >= 10000,
          progress: Math.min(stats.total_views, 10000),
          target: 10000
        },
        {
          id: 'liked_creator',
          name: '受欢迎作者',
          description: '菜谱总点赞数超过1000',
          icon: '❤️',
          color: '#e91e63',
          earned: stats.total_recipe_likes >= 1000,
          progress: Math.min(stats.total_recipe_likes, 1000),
          target: 1000
        },
        {
          id: 'consistent_creator',
          name: '坚持不懈',
          description: '连续7天创建菜谱',
          icon: '📅',
          color: '#4CAF50',
          earned: await this.checkConsistentCreation(userId, 7),
          progress: await this.getConsistentCreationProgress(userId, 7),
          target: 7
        },
        {
          id: 'early_adopter',
          name: '早期用户',
          description: '平台前100名用户',
          icon: '🏅',
          color: '#FF9800',
          earned: await this.checkEarlyAdopter(userId, 100),
          progress: 1,
          target: 1
        }
      ];
      
      return badges;
    } catch (error) {
      console.error('Error getting user badges:', error);
      throw error;
    }
  }

  /**
   * 获取用户成就
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 成就列表
   */
  static async getUserAchievements(userId) {
    try {
      const stats = await this.getUserStats(userId);
      
      const achievements = [
        {
          id: 'master_chef',
          name: '大厨之路',
          description: '达到美食大师等级',
          icon: '🏆',
          color: '#FFD700',
          category: 'level',
          earned: stats.level >= 5,
          progress: Math.min(stats.level, 5),
          target: 5,
          reward: '专属头像框'
        },
        {
          id: 'recipe_master',
          name: '菜谱大师',
          description: '创建100个菜谱',
          icon: '📖',
          color: '#4CAF50',
          category: 'creation',
          earned: stats.created_recipes >= 100,
          progress: Math.min(stats.created_recipes, 100),
          target: 100,
          reward: '创作者标识'
        },
        {
          id: 'review_expert',
          name: '评价专家',
          description: '发布500条评价',
          icon: '💎',
          color: '#2196F3',
          category: 'review',
          earned: stats.review_count >= 500,
          progress: Math.min(stats.review_count, 500),
          target: 500,
          reward: '评价师徽章'
        },
        {
          id: 'influencer',
          name: '美食网红',
          description: '菜谱总浏览量超过100000',
          icon: '🌟',
          color: '#E91E63',
          category: 'influence',
          earned: stats.total_views >= 100000,
          progress: Math.min(stats.total_views, 100000),
          target: 100000,
          reward: '网红认证'
        },
        {
          id: 'community_leader',
          name: '社区领袖',
          description: '获得10000个点赞',
          icon: '👑',
          color: '#9C27B0',
          category: 'community',
          earned: stats.total_recipe_likes >= 10000,
          progress: Math.min(stats.total_recipe_likes, 10000),
          target: 10000,
          reward: '社区领袖称号'
        },
        {
          id: 'perfect_reviewer',
          name: '完美评论家',
          description: '连续100条评价都是高质量',
          icon: '🎯',
          color: '#FF5722',
          category: 'quality',
          earned: await this.checkPerfectReviewer(userId, 100),
          progress: await this.getPerfectReviewerProgress(userId, 100),
          target: 100,
          reward: '完美评论家称号'
        }
      ];
      
      return achievements;
    } catch (error) {
      console.error('Error getting user achievements:', error);
      throw error;
    }
  }

  /**
   * 获取用户排名
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 排名信息
   */
  static async getUserRanking(userId) {
    try {
      // 获取总积分排名
      const pointsRankingQuery = `
        SELECT 
          u.id,
          u.nickname,
          u.avatar,
          (COUNT(DISTINCT rr.id) * 10 + 
           SUM(CASE WHEN rr.overall_rating >= 4.5 THEN 1 ELSE 0 END) * 5 +
           COUNT(DISTINCT r.id) * 50 +
           FLOOR(IFNULL(SUM(r.view_count), 0) / 10) * 2 +
           IFNULL(SUM(r.like_count), 0) * 3) as total_points,
          ROW_NUMBER() OVER (ORDER BY (COUNT(DISTINCT rr.id) * 10 + 
                                       SUM(CASE WHEN rr.overall_rating >= 4.5 THEN 1 ELSE 0 END) * 5 +
                                       COUNT(DISTINCT r.id) * 50 +
                                       FLOOR(IFNULL(SUM(r.view_count), 0) / 10) * 2 +
                                       IFNULL(SUM(r.like_count), 0) * 3) DESC) as rank
        FROM users u
        LEFT JOIN recipe_reviews rr ON u.id = rr.user_id
        LEFT JOIN recipes r ON u.id = r.creator_id
        GROUP BY u.id
        ORDER BY total_points DESC
      `;
      
      const rows = await db.query(pointsRankingQuery);
      const userPointsRank = rows.find(r => r.id === userId);
      
      // 获取创作者排名
      const creatorRankingQuery = `
        SELECT 
          u.id,
          u.nickname,
          u.avatar,
          COUNT(DISTINCT r.id) as recipe_count,
          SUM(r.view_count) as total_views,
          SUM(r.like_count) as total_likes,
          ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT r.id) DESC, SUM(r.view_count) DESC) as rank
        FROM users u
        LEFT JOIN recipes r ON u.id = r.creator_id
        GROUP BY u.id
        HAVING recipe_count > 0
        ORDER BY recipe_count DESC, total_views DESC
      `;
      
      const rowsCreator = await db.query(creatorRankingQuery);
      const userCreatorRank = rowsCreator.find(r => r.id === userId);
      
      // 获取评价者排名
      const reviewerRankingQuery = `
        SELECT 
          u.id,
          u.nickname,
          u.avatar,
          COUNT(DISTINCT rr.id) as review_count,
          SUM(CASE WHEN rr.overall_rating >= 4.5 THEN 1 ELSE 0 END) as high_rating_reviews,
          ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT rr.id) DESC, SUM(CASE WHEN rr.overall_rating >= 4.5 THEN 1 ELSE 0 END) DESC) as rank
        FROM users u
        LEFT JOIN recipe_reviews rr ON u.id = rr.user_id
        GROUP BY u.id
        HAVING review_count > 0
        ORDER BY review_count DESC, high_rating_reviews DESC
      `;
      
      const rowsReviewer = await db.query(reviewerRankingQuery);
      const userReviewerRank = rowsReviewer.find(r => r.id === userId);
      
      return {
        overall: {
          rank: userPointsRank ? userPointsRank.rank : null,
          total_users: rows.length,
          points: userPointsRank ? userPointsRank.total_points : 0,
          top_users: rows.slice(0, 10)
        },
        creator: {
          rank: userCreatorRank ? userCreatorRank.rank : null,
          total_creators: rowsCreator.length,
          recipe_count: userCreatorRank ? userCreatorRank.recipe_count : 0,
          top_creators: rowsCreator.slice(0, 10)
        },
        reviewer: {
          rank: userReviewerRank ? userReviewerRank.rank : null,
          total_reviewers: rowsReviewer.length,
          review_count: userReviewerRank ? userReviewerRank.review_count : 0,
          top_reviewers: rowsReviewer.slice(0, 10)
        }
      };
    } catch (error) {
      console.error('Error getting user ranking:', error);
      throw error;
    }
  }

  /**
   * 获取用户统计数据
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 统计数据
   */
  static async getUserStats(userId) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT rr.id) as review_count,
          SUM(CASE WHEN rr.overall_rating >= 4.5 THEN 1 ELSE 0 END) as high_rating_reviews,
          COUNT(DISTINCT r.id) as created_recipes,
          SUM(r.view_count) as total_views,
          SUM(r.like_count) as total_recipe_likes
        FROM users u
        LEFT JOIN recipe_reviews rr ON u.id = rr.user_id
        LEFT JOIN recipes r ON u.id = r.creator_id
        WHERE u.id = ?
        GROUP BY u.id
      `;
      
      const rows = await db.query(query, [userId]);
      
      const stats = rows[0] || {
        review_count: 0,
        high_rating_reviews: 0,
        created_recipes: 0,
        total_views: 0,
        total_recipe_likes: 0
      };
      
      // 计算等级
      const totalPoints = stats.review_count * 10 + 
                         stats.high_rating_reviews * 5 + 
                         stats.created_recipes * 50 + 
                         Math.floor(stats.total_views / 10) * 2 + 
                         stats.total_recipe_likes * 3;
      
      const level = this.calculateLevel(totalPoints);
      stats.level = level.level;
      stats.total_points = totalPoints;
      
      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * 检查用户是否连续创建菜谱
   * @param {number} userId - 用户ID
   * @param {number} days - 连续天数
   * @returns {Promise<boolean>} 是否达成
   */
  static async checkConsistentCreation(userId, days) {
    try {
      const query = `
        SELECT DATE(created_at) as creation_date
        FROM recipes
        WHERE creator_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY creation_date DESC
      `;
      
      const rows = await db.query(query, [userId, days]);
      
      if (rows.length < days) {
        return false;
      }
      
      // 检查是否连续
      for (let i = 1; i < days; i++) {
        const prevDate = new Date(rows[i-1].creation_date);
        const currentDate = new Date(rows[i].creation_date);
        const diffDays = Math.floor((prevDate - currentDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays !== 1) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking consistent creation:', error);
      return false;
    }
  }

  /**
   * 获取连续创建进度
   * @param {number} userId - 用户ID
   * @param {number} target - 目标天数
   * @returns {Promise<number>} 进度
   */
  static async getConsistentCreationProgress(userId, target) {
    try {
      const query = `
        SELECT DATE(created_at) as creation_date
        FROM recipes
        WHERE creator_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY creation_date DESC
      `;
      
      const rows = await db.query(query, [userId, target]);
      
      let consecutiveDays = 0;
      for (let i = 1; i < Math.min(rows.length, target); i++) {
        const prevDate = new Date(rows[i-1].creation_date);
        const currentDate = new Date(rows[i].creation_date);
        const diffDays = Math.floor((prevDate - currentDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          consecutiveDays++;
        } else {
          break;
        }
      }
      
      return Math.min(consecutiveDays + 1, target);
    } catch (error) {
      console.error('Error getting consistent creation progress:', error);
      return 0;
    }
  }

  /**
   * 检查是否为早期用户
   * @param {number} userId - 用户ID
   * @param {number} topN - 前N名用户
   * @returns {Promise<boolean>} 是否为早期用户
   */
  static async checkEarlyAdopter(userId, topN) {
    try {
      const query = `
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as user_rank
        FROM users
        ORDER BY created_at ASC
        LIMIT ?
      `;
      
      const rows = await db.query(query, [topN]);
      
      return rows.some(row => row.id === userId);
    } catch (error) {
      console.error('Error checking early adopter:', error);
      return false;
    }
  }

  /**
   * 检查是否为完美评论家
   * @param {number} userId - 用户ID
   * @param {number} count - 连续评价数量
   * @returns {Promise<boolean>} 是否达成
   */
  static async checkPerfectReviewer(userId, count) {
    try {
      const query = `
        SELECT overall_rating
        FROM recipe_reviews
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `;
      
      const rows = await db.query(query, [userId, count]);
      
      if (rows.length < count) {
        return false;
      }
      
      return rows.every(row => row.overall_rating >= 4.5);
    } catch (error) {
      console.error('Error checking perfect reviewer:', error);
      return false;
    }
  }

  /**
   * 获取完美评论家进度
   * @param {number} userId - 用户ID
   * @param {number} target - 目标数量
   * @returns {Promise<number>} 进度
   */
  static async getPerfectReviewerProgress(userId, target) {
    try {
      const query = `
        SELECT overall_rating
        FROM recipe_reviews
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `;
      
      const rows = await db.query(query, [userId, target]);
      
      let consecutiveHighRatings = 0;
      for (const row of rows) {
        if (row.overall_rating >= 4.5) {
          consecutiveHighRatings++;
        } else {
          break;
        }
      }
      
      return Math.min(consecutiveHighRatings, target);
    } catch (error) {
      console.error('Error getting perfect reviewer progress:', error);
      return 0;
    }
  }

  /**
   * 处理用户行为，更新积分和解锁成就
   * @param {number} userId - 用户ID
   * @param {string} action - 行为类型
   * @param {Object} actionData - 行为数据
   * @returns {Promise<Object>} 更新结果
   */
  static async handleUserAction(userId, action, actionData = {}) {
    try {
      const result = {
        points_earned: 0,
        level_up: false,
        new_badges: [],
        new_achievements: []
      };
      
      // 根据行为类型给予积分
      switch (action) {
        case 'create_recipe':
          result.points_earned = 50;
          break;
        case 'create_review':
          result.points_earned = 10;
          if (actionData.rating >= 4.5) {
            result.points_earned += 5;
          }
          break;
        case 'recipe_viewed':
          result.points_earned = 0.2;
          break;
        case 'recipe_liked':
          result.points_earned = 3;
          break;
        default:
          break;
      }
      
      // 检查是否有新的徽章和成就
      const oldGameData = await this.getUserGameData(userId);
      const newGameData = await this.getUserGameData(userId);
      
      // 检查等级是否提升
      if (newGameData.level > oldGameData.level) {
        result.level_up = true;
        result.new_level = newGameData.level;
        result.new_level_name = newGameData.level_name;
      }
      
      // 检查新解锁的徽章
      const oldBadges = oldGameData.badges.filter(b => b.earned);
      const newBadges = newGameData.badges.filter(b => b.earned);
      result.new_badges = newBadges.filter(nb => !oldBadges.find(ob => ob.id === nb.id));
      
      // 检查新解锁的成就
      const oldAchievements = oldGameData.achievements.filter(a => a.earned);
      const newAchievements = newGameData.achievements.filter(a => a.earned);
      result.new_achievements = newAchievements.filter(na => !oldAchievements.find(oa => oa.id === na.id));
      
      return result;
    } catch (error) {
      console.error('Error handling user action:', error);
      throw error;
    }
  }

  /**
   * 获取排行榜
   * @param {string} type - 排行榜类型
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 排行榜数据
   */
  static async getLeaderboard(type = 'overall', limit = 50) {
    try {
      let query = '';
      
      switch (type) {
        case 'overall':
          query = `
            SELECT 
              u.id,
              u.nickname,
              u.avatar,
              u.cooking_level,
              (COUNT(DISTINCT rr.id) * 10 + 
               SUM(CASE WHEN rr.overall_rating >= 4.5 THEN 1 ELSE 0 END) * 5 +
               COUNT(DISTINCT r.id) * 50 +
               FLOOR(IFNULL(SUM(r.view_count), 0) / 10) * 2 +
               IFNULL(SUM(r.like_count), 0) * 3) as total_points,
              COUNT(DISTINCT r.id) as recipe_count,
              COUNT(DISTINCT rr.id) as review_count,
              ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank
            FROM users u
            LEFT JOIN recipe_reviews rr ON u.id = rr.user_id
            LEFT JOIN recipes r ON u.id = r.creator_id
            GROUP BY u.id
            ORDER BY total_points DESC
            LIMIT ?
          `;
          break;
        case 'creator':
          query = `
            SELECT 
              u.id,
              u.nickname,
              u.avatar,
              u.cooking_level,
              COUNT(DISTINCT r.id) as recipe_count,
              SUM(r.view_count) as total_views,
              SUM(r.like_count) as total_likes,
              ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT r.id) DESC, SUM(r.view_count) DESC) as rank
            FROM users u
            LEFT JOIN recipes r ON u.id = r.creator_id
            GROUP BY u.id
            HAVING recipe_count > 0
            ORDER BY recipe_count DESC, total_views DESC
            LIMIT ?
          `;
          break;
        case 'reviewer':
          query = `
            SELECT 
              u.id,
              u.nickname,
              u.avatar,
              u.cooking_level,
              COUNT(DISTINCT rr.id) as review_count,
              SUM(CASE WHEN rr.overall_rating >= 4.5 THEN 1 ELSE 0 END) as high_rating_reviews,
              ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT rr.id) DESC) as rank
            FROM users u
            LEFT JOIN recipe_reviews rr ON u.id = rr.user_id
            GROUP BY u.id
            HAVING review_count > 0
            ORDER BY review_count DESC
            LIMIT ?
          `;
          break;
        default:
          throw new Error('Invalid leaderboard type');
      }
      
      const rows = await db.query(query, [limit]);
      
      return rows.map(row => {
        if (type === 'overall') {
          const level = this.calculateLevel(row.total_points);
          return {
            ...row,
            level: level.level,
            level_name: level.name,
            level_icon: level.icon,
            level_color: level.color
          };
        }
        return row;
      });
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }
}

module.exports = GameificationSystem; 