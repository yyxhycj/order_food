const { query } = require('../database/connection');

class TasteAnalytics {
  // 获取口味趋势分析
  static async getTasteTrends(timeRange = '30') {
    const sql = `
      SELECT 
        utp.spice_level,
        utp.sweetness_level,
        COUNT(*) as user_count,
        AVG(rr.overall_rating) as avg_rating
      FROM user_taste_profiles utp
      LEFT JOIN users u ON utp.user_id = u.id
      LEFT JOIN recipe_reviews rr ON u.id = rr.user_id
      WHERE utp.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY utp.spice_level, utp.sweetness_level
      ORDER BY user_count DESC
    `;
    
    return await query(sql, [timeRange]);
  }

  // 获取用户偏好分析
  static async getUserPreferenceAnalysis() {
    const sql = `
      SELECT 
        JSON_EXTRACT(flavor_preferences, '$') as flavor_prefs,
        COUNT(*) as user_count,
        cooking_skill_level,
        AVG(CASE WHEN spice_level = 'mild' THEN 1 
                 WHEN spice_level = 'medium' THEN 2 
                 WHEN spice_level = 'spicy' THEN 3 
                 WHEN spice_level = 'extra_spicy' THEN 4 
                 ELSE 2 END) as avg_spice_level
      FROM user_taste_profiles
      GROUP BY cooking_skill_level
      ORDER BY user_count DESC
    `;
    
    return await query(sql);
  }

  // 获取热门口味统计
  static async getPopularTastes(limit = 10) {
    const sql = `
      SELECT 
        mi.spice_level,
        mi.cooking_method,
        COUNT(oi.id) as order_count,
        AVG(mi.rating) as avg_rating,
        SUM(oi.quantity) as total_quantity
      FROM menu_items mi
      LEFT JOIN order_items oi ON mi.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND mi.spice_level IS NOT NULL
      GROUP BY mi.spice_level, mi.cooking_method
      ORDER BY order_count DESC
      LIMIT ?
    `;
    
    return await query(sql, [limit]);
  }

  // 获取菜谱评价分析
  static async getRecipeRatingAnalysis(recipeId = null) {
    let sql = `
      SELECT 
        r.name as recipe_name,
        AVG(rr.taste_rating) as avg_taste_rating,
        AVG(rr.difficulty_rating) as avg_difficulty_rating,
        AVG(rr.ingredients_rating) as avg_ingredients_rating,
        AVG(rr.value_rating) as avg_value_rating,
        AVG(rr.overall_rating) as avg_overall_rating,
        COUNT(rr.id) as review_count,
        rr.season_tag
      FROM recipe_reviews rr
      LEFT JOIN recipes r ON rr.recipe_id = r.id
      WHERE rr.status = 'active'
    `;
    
    const params = [];
    
    if (recipeId) {
      sql += ' AND rr.recipe_id = ?';
      params.push(recipeId);
    }
    
    sql += ' GROUP BY rr.recipe_id, rr.season_tag ORDER BY avg_overall_rating DESC';
    
    return await query(sql, params);
  }

  // 获取季节性口味分析
  static async getSeasonalTasteAnalysis() {
    const sql = `
      SELECT 
        season_tag,
        COUNT(*) as review_count,
        AVG(taste_rating) as avg_taste_rating,
        AVG(overall_rating) as avg_overall_rating,
        GROUP_CONCAT(DISTINCT challenge_type) as challenge_types
      FROM recipe_reviews
      WHERE season_tag IS NOT NULL
        AND status = 'active'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 365 DAY)
      GROUP BY season_tag
      ORDER BY review_count DESC
    `;
    
    return await query(sql);
  }

  // 获取用户口味匹配度分析
  static async getUserTasteMatching(userId) {
    const sql = `
      SELECT 
        utp.spice_level,
        utp.sweetness_level,
        utp.cooking_skill_level,
        AVG(rr.overall_rating) as avg_rating,
        COUNT(rr.id) as review_count,
        GROUP_CONCAT(DISTINCT rr.challenge_type) as preferred_challenges
      FROM user_taste_profiles utp
      LEFT JOIN recipe_reviews rr ON utp.user_id = rr.user_id
      WHERE utp.user_id = ?
        AND rr.status = 'active'
      GROUP BY utp.spice_level, utp.sweetness_level, utp.cooking_skill_level
    `;
    
    const result = await query(sql, [userId]);
    return result[0] || null;
  }

  // 获取口味数据概览
  static async getTasteOverview() {
    const totalUsers = await query('SELECT COUNT(*) as count FROM user_taste_profiles');
    const totalReviews = await query('SELECT COUNT(*) as count FROM recipe_reviews WHERE status = "active"');
    const avgRating = await query('SELECT AVG(overall_rating) as avg FROM recipe_reviews WHERE status = "active"');
    
    const spiceLevelDistribution = await query(`
      SELECT spice_level, COUNT(*) as count 
      FROM user_taste_profiles 
      GROUP BY spice_level 
      ORDER BY count DESC
    `);
    
    const skillLevelDistribution = await query(`
      SELECT cooking_skill_level, COUNT(*) as count 
      FROM user_taste_profiles 
      GROUP BY cooking_skill_level 
      ORDER BY count DESC
    `);
    
    return {
      totalUsers: totalUsers[0].count,
      totalReviews: totalReviews[0].count,
      avgRating: parseFloat(avgRating[0].avg || 0).toFixed(2),
      spiceLevelDistribution,
      skillLevelDistribution
    };
  }

  // 获取商家推荐菜品
  static async getMerchantRecommendations() {
    const sql = `
      SELECT 
        mi.id,
        mi.name,
        mi.spice_level,
        mi.cooking_method,
        mi.rating,
        COUNT(oi.id) as order_count,
        AVG(rr.overall_rating) as recipe_rating,
        (COUNT(oi.id) * 0.4 + mi.rating * 0.3 + COALESCE(AVG(rr.overall_rating), 0) * 0.3) as recommend_score
      FROM menu_items mi
      LEFT JOIN order_items oi ON mi.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      LEFT JOIN recipes r ON mi.recipe_id = r.id
      LEFT JOIN recipe_reviews rr ON r.id = rr.recipe_id
      WHERE mi.status = 'available'
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY mi.id
      ORDER BY recommend_score DESC
      LIMIT 10
    `;
    
    return await query(sql);
  }
}

module.exports = TasteAnalytics; 