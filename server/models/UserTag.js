const { query } = require('../database/connection');

class UserTag {
  // 创建用户标签
  static async create(tagData) {
    const { user_id, tag_name, tag_type = 'manual', tag_category, confidence_score = 1.00 } = tagData;
    
    const sql = `
      INSERT INTO user_tags (user_id, tag_name, tag_type, tag_category, confidence_score, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        tag_type = VALUES(tag_type),
        tag_category = VALUES(tag_category),
        confidence_score = VALUES(confidence_score)
    `;
    
    const result = await query(sql, [user_id, tag_name, tag_type, tag_category, confidence_score]);
    return result.insertId || result.info;
  }

  // 获取用户标签列表
  static async getUserTags(userId, category = null) {
    let sql = `
      SELECT * FROM user_tags 
      WHERE user_id = ?
    `;
    const params = [userId];
    
    if (category) {
      sql += ` AND tag_category = ?`;
      params.push(category);
    }
    
    sql += ` ORDER BY confidence_score DESC, created_at DESC`;
    
    return await query(sql, params);
  }

  // 删除用户标签
  static async delete(userId, tagName) {
    const sql = `DELETE FROM user_tags WHERE user_id = ? AND tag_name = ?`;
    const result = await query(sql, [userId, tagName]);
    return result.affectedRows > 0;
  }

  // 更新标签置信度
  static async updateConfidence(userId, tagName, confidenceScore) {
    const sql = `
      UPDATE user_tags SET confidence_score = ? 
      WHERE user_id = ? AND tag_name = ?
    `;
    const result = await query(sql, [confidenceScore, userId, tagName]);
    return result.affectedRows > 0;
  }

  // 基于用户行为自动生成标签
  static async generateAutoTags(userId) {
    const generatedTags = [];
    
    // 1. 基于菜谱创建行为生成标签
    const recipeStats = await this.analyzeRecipeCreation(userId);
    if (recipeStats.length > 0) {
      for (const stat of recipeStats) {
        if (stat.recipe_count >= 3) {
          const tagName = `${stat.cuisine_type}菜达人`;
          const confidence = Math.min(stat.recipe_count / 10, 1.0);
          
          await this.create({
            user_id: userId,
            tag_name: tagName,
            tag_type: 'auto',
            tag_category: 'cuisine',
            confidence_score: confidence
          });
          
          generatedTags.push(tagName);
        }
      }
    }
    
    // 2. 基于订单行为生成标签
    const orderStats = await this.analyzeOrderBehavior(userId);
    if (orderStats.total_orders >= 10) {
      if (orderStats.sweet_ratio > 0.6) {
        await this.create({
          user_id: userId,
          tag_name: '甜品爱好者',
          tag_type: 'auto',
          tag_category: 'taste',
          confidence_score: orderStats.sweet_ratio
        });
        generatedTags.push('甜品爱好者');
      }
      
      if (orderStats.spicy_ratio > 0.5) {
        await this.create({
          user_id: userId,
          tag_name: '辣味达人',
          tag_type: 'auto',
          tag_category: 'taste',
          confidence_score: orderStats.spicy_ratio
        });
        generatedTags.push('辣味达人');
      }
    }
    
    // 3. 基于评价行为生成标签
    const reviewStats = await this.analyzeReviewBehavior(userId);
    if (reviewStats.total_reviews >= 5) {
      if (reviewStats.avg_rating <= 3.0) {
        await this.create({
          user_id: userId,
          tag_name: '犀利点评家',
          tag_type: 'auto',
          tag_category: 'style',
          confidence_score: Math.min(reviewStats.total_reviews / 20, 1.0)
        });
        generatedTags.push('犀利点评家');
      }
    }
    
    // 4. 基于烹饪技能生成标签
    const skillLevel = await this.analyzeCookingSkill(userId);
    if (skillLevel.level === 'advanced') {
      await this.create({
        user_id: userId,
        tag_name: '烹饪高手',
        tag_type: 'auto',
        tag_category: 'skill',
        confidence_score: skillLevel.confidence
      });
      generatedTags.push('烹饪高手');
    }
    
    return generatedTags;
  }

  // 分析用户菜谱创建行为
  static async analyzeRecipeCreation(userId) {
    const sql = `
      SELECT 
        CASE 
          WHEN name LIKE '%川菜%' OR name LIKE '%麻辣%' OR name LIKE '%四川%' THEN '川菜'
          WHEN name LIKE '%粤菜%' OR name LIKE '%广东%' OR name LIKE '%港式%' THEN '粤菜'
          WHEN name LIKE '%湘菜%' OR name LIKE '%湖南%' THEN '湘菜'
          WHEN name LIKE '%鲁菜%' OR name LIKE '%山东%' THEN '鲁菜'
          WHEN name LIKE '%苏菜%' OR name LIKE '%江苏%' THEN '苏菜'
          WHEN name LIKE '%浙菜%' OR name LIKE '%杭州%' THEN '浙菜'
          WHEN name LIKE '%闽菜%' OR name LIKE '%福建%' THEN '闽菜'
          WHEN name LIKE '%徽菜%' OR name LIKE '%安徽%' THEN '徽菜'
          ELSE '家常菜'
        END as cuisine_type,
        COUNT(*) as recipe_count
      FROM recipes 
      WHERE creator_id = ? AND status = 'active'
      GROUP BY cuisine_type
      HAVING recipe_count >= 3
    `;
    
    return await query(sql, [userId]);
  }

  // 分析用户订单行为
  static async analyzeOrderBehavior(userId) {
    const sql = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN mi.category_id = 3 THEN 1 ELSE 0 END) / COUNT(*) as sweet_ratio,
        SUM(CASE WHEN mi.spice_level = 'spicy' THEN 1 ELSE 0 END) / COUNT(*) as spicy_ratio
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN menu_items mi ON oi.product_id = mi.id
      WHERE o.user_id = ?
    `;
    
    const result = await query(sql, [userId]);
    return result[0] || { total_orders: 0, sweet_ratio: 0, spicy_ratio: 0 };
  }

  // 分析用户评价行为
  static async analyzeReviewBehavior(userId) {
    const sql = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(overall_rating) as avg_rating,
        COUNT(CASE WHEN overall_rating <= 3 THEN 1 END) as low_ratings
      FROM recipe_reviews 
      WHERE user_id = ? AND status = 'active'
    `;
    
    const result = await query(sql, [userId]);
    return result[0] || { total_reviews: 0, avg_rating: 5.0, low_ratings: 0 };
  }

  // 分析用户烹饪技能
  static async analyzeCookingSkill(userId) {
    const sql = `
      SELECT 
        COUNT(CASE WHEN difficulty = 'hard' THEN 1 END) as hard_recipes,
        COUNT(*) as total_recipes,
        AVG(average_rating) as avg_recipe_rating
      FROM recipes 
      WHERE creator_id = ? AND status = 'active'
    `;
    
    const result = await query(sql, [userId]);
    const stats = result[0] || { hard_recipes: 0, total_recipes: 0, avg_recipe_rating: 0 };
    
    let level = 'beginner';
    let confidence = 0.5;
    
    if (stats.total_recipes >= 20 && stats.hard_recipes >= 5 && stats.avg_recipe_rating >= 4.0) {
      level = 'advanced';
      confidence = 0.9;
    } else if (stats.total_recipes >= 10 && stats.hard_recipes >= 2) {
      level = 'intermediate';
      confidence = 0.7;
    }
    
    return { level, confidence };
  }

  // 获取相似标签的用户
  static async getSimilarUsers(userId, limit = 10) {
    const sql = `
      SELECT 
        ut2.user_id,
        COUNT(DISTINCT ut2.tag_name) as common_tags,
        u.nickname,
        u.avatar
      FROM user_tags ut1
      JOIN user_tags ut2 ON ut1.tag_name = ut2.tag_name AND ut1.user_id != ut2.user_id
      JOIN users u ON ut2.user_id = u.id
      WHERE ut1.user_id = ?
      GROUP BY ut2.user_id
      ORDER BY common_tags DESC
      LIMIT ?
    `;
    
    return await query(sql, [userId, limit]);
  }

  // 获取热门标签
  static async getPopularTags(category = null, limit = 20) {
    let sql = `
      SELECT 
        tag_name,
        tag_category,
        COUNT(*) as user_count,
        AVG(confidence_score) as avg_confidence
      FROM user_tags
    `;
    
    const params = [];
    
    if (category) {
      sql += ` WHERE tag_category = ?`;
      params.push(category);
    }
    
    sql += `
      GROUP BY tag_name, tag_category
      ORDER BY user_count DESC, avg_confidence DESC
      LIMIT ?
    `;
    
    params.push(limit);
    
    return await query(sql, params);
  }

  // 清理低置信度的自动标签
  static async cleanupAutoTags(userId, minConfidence = 0.3) {
    const sql = `
      DELETE FROM user_tags 
      WHERE user_id = ? AND tag_type = 'auto' AND confidence_score < ?
    `;
    
    const result = await query(sql, [userId, minConfidence]);
    return result.affectedRows;
  }

  // 获取用户标签统计
  static async getUserTagStats(userId) {
    const sql = `
      SELECT 
        tag_category,
        COUNT(*) as tag_count,
        AVG(confidence_score) as avg_confidence
      FROM user_tags 
      WHERE user_id = ?
      GROUP BY tag_category
    `;
    
    return await query(sql, [userId]);
  }
}

module.exports = UserTag; 