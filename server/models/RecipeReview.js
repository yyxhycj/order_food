const { query } = require('../database/connection');

class RecipeReview {
  // 创建菜谱评价
  static async create(reviewData) {
    const { recipe_id, user_id, overall_rating, taste_rating, difficulty_rating, 
            ingredients_rating, value_rating, content, images, season_tag, 
            challenge_type = 'none' } = reviewData;
    
    const sql = `
      INSERT INTO recipe_reviews (recipe_id, user_id, overall_rating, taste_rating, 
                                 difficulty_rating, ingredients_rating, value_rating, 
                                 content, images, season_tag, challenge_type, status, 
                                 created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
    `;
    
    const result = await query(sql, [
      recipe_id, user_id, overall_rating, taste_rating, difficulty_rating,
      ingredients_rating, value_rating, content, JSON.stringify(images || []),
      season_tag, challenge_type
    ]);
    
    // 更新菜谱的评价统计
    await this.updateRecipeRatingStats(recipe_id);
    
    return result.insertId;
  }

  // 获取菜谱评价列表
  static async getReviewsByRecipe(recipeId, params = {}) {
    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'DESC', rating_filter } = params;
    
    const offset = (page - 1) * limit;
    
    // 验证和清理参数
    const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const validOffset = Math.max(0, parseInt(offset) || 0);
    
    // 验证排序字段，防止SQL注入
    const allowedSortFields = ['created_at', 'updated_at', 'overall_rating', 'helpful_count'];
    const allowedSortOrders = ['ASC', 'DESC'];
    const validSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const validSortOrder = allowedSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';
    
    let whereClauses = [`rr.recipe_id = ?`, `rr.status = 'active'`];
    let queryParams = [parseInt(recipeId)];
    
    if (rating_filter) {
      whereClauses.push(`rr.overall_rating = ?`);
      queryParams.push(parseInt(rating_filter));
    }
    
    const whereClause = whereClauses.join(' AND ');
    
    const sql = `
      SELECT rr.*, u.nickname, u.avatar, u.cooking_level, u.is_verified
      FROM recipe_reviews rr
      LEFT JOIN users u ON rr.user_id = u.id
      WHERE ${whereClause}
      ORDER BY rr.${validSortBy} ${validSortOrder}
      LIMIT ${validLimit} OFFSET ${validOffset}
    `;
    
    const reviews = await query(sql, queryParams);
    
    // 解析JSON字段
    reviews.forEach(review => {
      review.images = JSON.parse(review.images || '[]');
    });
    
    return reviews;
  }

  // 获取用户评价列表
  static async getUserReviews(userId, params = {}) {
    const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'DESC' } = params;
    
    const offset = (page - 1) * limit;
    
    // 验证和清理参数
    const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const validOffset = Math.max(0, parseInt(offset) || 0);
    
    // 验证排序字段，防止SQL注入
    const allowedSortFields = ['created_at', 'updated_at', 'overall_rating'];
    const allowedSortOrders = ['ASC', 'DESC'];
    const validSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const validSortOrder = allowedSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';
    
    const sql = `
      SELECT rr.*, r.name as recipe_name, r.main_image as recipe_image
      FROM recipe_reviews rr
      LEFT JOIN recipes r ON rr.recipe_id = r.id
      WHERE rr.user_id = ? AND rr.status = 'active'
      ORDER BY rr.${validSortBy} ${validSortOrder}
      LIMIT ${validLimit} OFFSET ${validOffset}
    `;
    
    const reviews = await query(sql, [parseInt(userId)]);
    
    // 解析JSON字段
    reviews.forEach(review => {
      review.images = JSON.parse(review.images || '[]');
    });
    
    return reviews;
  }

  // 获取评价详情
  static async getById(reviewId) {
    const sql = `
      SELECT rr.*, u.nickname, u.avatar, u.cooking_level, u.is_verified,
             r.name as recipe_name, r.main_image as recipe_image
      FROM recipe_reviews rr
      LEFT JOIN users u ON rr.user_id = u.id
      LEFT JOIN recipes r ON rr.recipe_id = r.id
      WHERE rr.id = ?
    `;
    
    const results = await query(sql, [reviewId]);
    
    if (results.length === 0) {
      return null;
    }
    
    const review = results[0];
    review.images = JSON.parse(review.images || '[]');
    
    return review;
  }

  // 更新评价
  static async update(reviewId, updateData) {
    const { overall_rating, taste_rating, difficulty_rating, ingredients_rating,
            value_rating, content, images, season_tag, challenge_type } = updateData;
    
    const sql = `
      UPDATE recipe_reviews SET 
        overall_rating = ?, taste_rating = ?, difficulty_rating = ?, 
        ingredients_rating = ?, value_rating = ?, content = ?, images = ?,
        season_tag = ?, challenge_type = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    const result = await query(sql, [
      overall_rating, taste_rating, difficulty_rating, ingredients_rating,
      value_rating, content, JSON.stringify(images || []), season_tag,
      challenge_type, reviewId
    ]);
    
    // 获取菜谱ID并更新统计
    const reviewInfo = await this.getById(reviewId);
    if (reviewInfo) {
      await this.updateRecipeRatingStats(reviewInfo.recipe_id);
    }
    
    return result.affectedRows > 0;
  }

  // 删除评价
  static async delete(reviewId) {
    // 获取评价信息
    const reviewInfo = await this.getById(reviewId);
    
    const sql = `DELETE FROM recipe_reviews WHERE id = ?`;
    const result = await query(sql, [reviewId]);
    
    // 更新菜谱统计
    if (reviewInfo) {
      await this.updateRecipeRatingStats(reviewInfo.recipe_id);
    }
    
    return result.affectedRows > 0;
  }

  // 更新评价状态
  static async updateStatus(reviewId, status) {
    const sql = `UPDATE recipe_reviews SET status = ?, updated_at = NOW() WHERE id = ?`;
    const result = await query(sql, [status, reviewId]);
    return result.affectedRows > 0;
  }

  // 点赞评价
  static async toggleLike(reviewId, increment = true) {
    const sql = increment
      ? `UPDATE recipe_reviews SET likes_count = likes_count + 1 WHERE id = ?`
      : `UPDATE recipe_reviews SET likes_count = likes_count - 1 WHERE id = ? AND likes_count > 0`;
    
    const result = await query(sql, [reviewId]);
    return result.affectedRows > 0;
  }

  // 设置精选评价
  static async setFeatured(reviewId, isFeatured = true) {
    const sql = `UPDATE recipe_reviews SET is_featured = ? WHERE id = ?`;
    const result = await query(sql, [isFeatured, reviewId]);
    return result.affectedRows > 0;
  }

  // 获取精选评价
  static async getFeaturedReviews(limit = 10) {
    const sql = `
      SELECT rr.*, u.nickname, u.avatar, u.cooking_level, u.is_verified,
             r.name as recipe_name, r.main_image as recipe_image
      FROM recipe_reviews rr
      LEFT JOIN users u ON rr.user_id = u.id
      LEFT JOIN recipes r ON rr.recipe_id = r.id
      WHERE rr.is_featured = true AND rr.status = 'active'
      ORDER BY rr.likes_count DESC, rr.created_at DESC
      LIMIT ?
    `;
    
    const reviews = await query(sql, [limit]);
    
    reviews.forEach(review => {
      review.images = JSON.parse(review.images || '[]');
    });
    
    return reviews;
  }

  // 获取菜谱评价统计
  static async getRecipeRatingStats(recipeId) {
    const sql = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(overall_rating) as avg_overall_rating,
        AVG(taste_rating) as avg_taste_rating,
        AVG(difficulty_rating) as avg_difficulty_rating,
        AVG(ingredients_rating) as avg_ingredients_rating,
        AVG(value_rating) as avg_value_rating,
        COUNT(CASE WHEN overall_rating = 5 THEN 1 END) as five_star_count,
        COUNT(CASE WHEN overall_rating = 4 THEN 1 END) as four_star_count,
        COUNT(CASE WHEN overall_rating = 3 THEN 1 END) as three_star_count,
        COUNT(CASE WHEN overall_rating = 2 THEN 1 END) as two_star_count,
        COUNT(CASE WHEN overall_rating = 1 THEN 1 END) as one_star_count
      FROM recipe_reviews
      WHERE recipe_id = ? AND status = 'active'
    `;
    
    const result = await query(sql, [recipeId]);
    return result[0] || {
      total_reviews: 0,
      avg_overall_rating: 0,
      avg_taste_rating: 0,
      avg_difficulty_rating: 0,
      avg_ingredients_rating: 0,
      avg_value_rating: 0,
      five_star_count: 0,
      four_star_count: 0,
      three_star_count: 0,
      two_star_count: 0,
      one_star_count: 0
    };
  }

  // 更新菜谱评分统计
  static async updateRecipeRatingStats(recipeId) {
    const stats = await this.getRecipeRatingStats(recipeId);
    
    const sql = `
      UPDATE recipes SET 
        average_rating = ?, 
        review_count = ?
      WHERE id = ?
    `;
    
    await query(sql, [
      parseFloat(stats.avg_overall_rating).toFixed(2),
      stats.total_reviews,
      recipeId
    ]);
  }

  // 获取季节性评价统计
  static async getSeasonalStats(season) {
    const sql = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(overall_rating) as avg_rating,
        rr.recipe_id,
        r.name as recipe_name,
        r.main_image
      FROM recipe_reviews rr
      LEFT JOIN recipes r ON rr.recipe_id = r.id
      WHERE rr.season_tag = ? AND rr.status = 'active'
      GROUP BY rr.recipe_id
      ORDER BY avg_rating DESC, total_reviews DESC
      LIMIT 20
    `;
    
    return await query(sql, [season]);
  }

  // 获取挑战类型统计
  static async getChallengeStats() {
    const sql = `
      SELECT 
        challenge_type,
        COUNT(*) as review_count,
        AVG(overall_rating) as avg_rating
      FROM recipe_reviews
      WHERE status = 'active' AND challenge_type != 'none'
      GROUP BY challenge_type
      ORDER BY review_count DESC
    `;
    
    return await query(sql);
  }

  // 获取用户评价统计
  static async getUserReviewStats(userId) {
    const sql = `
      SELECT 
        COUNT(*) as total_reviews,
        AVG(overall_rating) as avg_rating,
        COUNT(CASE WHEN is_featured = true THEN 1 END) as featured_reviews,
        SUM(likes_count) as total_likes_received,
        COUNT(CASE WHEN challenge_type = 'restoration' THEN 1 END) as restoration_reviews,
        COUNT(CASE WHEN challenge_type = 'innovation' THEN 1 END) as innovation_reviews
      FROM recipe_reviews
      WHERE user_id = ? AND status = 'active'
    `;
    
    const result = await query(sql, [userId]);
    return result[0] || {
      total_reviews: 0,
      avg_rating: 0,
      featured_reviews: 0,
      total_likes_received: 0,
      restoration_reviews: 0,
      innovation_reviews: 0
    };
  }

  // 检查用户是否已评价菜谱
  static async hasUserReviewed(userId, recipeId) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM recipe_reviews 
      WHERE user_id = ? AND recipe_id = ? AND status != 'inactive'
    `;
    
    const result = await query(sql, [userId, recipeId]);
    return result[0].count > 0;
  }

  // 获取评价趋势数据
  static async getReviewTrends(recipeId, days = 30) {
    const sql = `
      SELECT 
        DATE(created_at) as review_date,
        COUNT(*) as review_count,
        AVG(overall_rating) as avg_rating
      FROM recipe_reviews
      WHERE recipe_id = ? AND status = 'active'
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY review_date DESC
    `;
    
    return await query(sql, [recipeId, days]);
  }
}

module.exports = RecipeReview; 