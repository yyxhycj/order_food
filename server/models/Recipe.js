const { query } = require('../database/connection');

class Recipe {
  // 创建菜谱
  static async create(recipeData) {
    const { name, description, ingredients, steps, cooking_time, difficulty, creator_id, category_id, main_image, 
            step_images, video_url, nutrition_info, seasonal_tags } = recipeData;
    
    const sql = `
      INSERT INTO recipes (name, description, ingredients, steps, cooking_time, difficulty, creator_id, 
                          category_id, main_image, step_images, video_url, nutrition_info, seasonal_tags, 
                          status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', NOW(), NOW())
    `;
    
    const result = await query(sql, [
      name, description, JSON.stringify(ingredients), JSON.stringify(steps), cooking_time, difficulty,
      creator_id, category_id, main_image, JSON.stringify(step_images), video_url, 
      JSON.stringify(nutrition_info), seasonal_tags
    ]);
    
    return result.insertId;
  }

  // 获取菜谱列表
  static async getList(params = {}) {
    const { page = 1, limit = 10, category_id, difficulty, creator_id, status = 'active', 
            search, sort_by = 'created_at', sort_order = 'DESC' } = params;
    
    const offset = (page - 1) * limit;
    
    // 验证排序字段和排序方向，防止SQL注入
    const allowedSortFields = ['created_at', 'updated_at', 'name', 'cooking_time', 'difficulty'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    const validSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const validSortOrder = allowedSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';
    
    // 验证分页参数，防止SQL注入
    const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const validOffset = Math.max(0, parseInt(offset) || 0);
    
    // 构建基础SQL语句
    let sql = `
      SELECT r.*, c.name as category_name, u.nickname as creator_name, u.avatar as creator_avatar
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE r.status = ?
    `;
    
    let queryParams = [status];
    
    // 添加额外的WHERE条件
    if (category_id) {
      sql += ` AND r.category_id = ?`;
      queryParams.push(category_id);
    }
    
    if (difficulty) {
      sql += ` AND r.difficulty = ?`;
      queryParams.push(difficulty);
    }
    
    if (creator_id) {
      sql += ` AND r.creator_id = ?`;
      queryParams.push(creator_id);
    }
    
    if (search) {
      sql += ` AND (r.name LIKE ? OR r.description LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    // 添加ORDER BY和LIMIT（使用字符串拼接，因为MySQL不支持LIMIT和OFFSET中的占位符）
    sql += ` ORDER BY r.${validSortBy} ${validSortOrder} LIMIT ${validLimit} OFFSET ${validOffset}`;
    
    const recipes = await query(sql, queryParams);
    
    // 解析JSON字段
    recipes.forEach(recipe => {
      recipe.ingredients = JSON.parse(recipe.ingredients || '[]');
      recipe.steps = JSON.parse(recipe.steps || '[]');
      recipe.step_images = JSON.parse(recipe.step_images || '[]');
      recipe.nutrition_info = JSON.parse(recipe.nutrition_info || '{}');
    });
    
    return recipes;
  }

  // 获取菜谱详情
  static async getById(id) {
    const sql = `
      SELECT r.*, c.name as category_name, u.nickname as creator_name, u.avatar as creator_avatar,
             u.cooking_level as creator_level, u.is_verified as creator_verified
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE r.id = ?
    `;
    
    const results = await query(sql, [id]);
    
    if (results.length === 0) {
      return null;
    }
    
    const recipe = results[0];
    
    // 解析JSON字段
    recipe.ingredients = JSON.parse(recipe.ingredients || '[]');
    recipe.steps = JSON.parse(recipe.steps || '[]');
    recipe.step_images = JSON.parse(recipe.step_images || '[]');
    recipe.nutrition_info = JSON.parse(recipe.nutrition_info || '{}');
    
    return recipe;
  }

  // 更新菜谱
  static async update(id, updateData) {
    const { name, description, ingredients, steps, cooking_time, difficulty, category_id, 
            main_image, step_images, video_url, nutrition_info, seasonal_tags } = updateData;
    
    const sql = `
      UPDATE recipes SET 
        name = ?, description = ?, ingredients = ?, steps = ?, cooking_time = ?, difficulty = ?,
        category_id = ?, main_image = ?, step_images = ?, video_url = ?, nutrition_info = ?,
        seasonal_tags = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    const result = await query(sql, [
      name, description, JSON.stringify(ingredients), JSON.stringify(steps), cooking_time, difficulty,
      category_id, main_image, JSON.stringify(step_images), video_url, 
      JSON.stringify(nutrition_info), seasonal_tags, id
    ]);
    
    return result.affectedRows > 0;
  }

  // 删除菜谱
  static async delete(id) {
    const sql = `DELETE FROM recipes WHERE id = ?`;
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  }

  // 更新菜谱状态
  static async updateStatus(id, status) {
    const sql = `UPDATE recipes SET status = ?, updated_at = NOW() WHERE id = ?`;
    const result = await query(sql, [status, id]);
    return result.affectedRows > 0;
  }

  // 增加浏览数
  static async incrementView(id) {
    const sql = `UPDATE recipes SET view_count = view_count + 1 WHERE id = ?`;
    await query(sql, [id]);
  }

  // 更新点赞数
  static async updateLikeCount(id, increment = true) {
    const sql = increment 
      ? `UPDATE recipes SET like_count = like_count + 1 WHERE id = ?`
      : `UPDATE recipes SET like_count = like_count - 1 WHERE id = ? AND like_count > 0`;
    await query(sql, [id]);
  }

  // 更新收藏数
  static async updateCollectCount(id, increment = true) {
    const sql = increment
      ? `UPDATE recipes SET collect_count = collect_count + 1 WHERE id = ?`
      : `UPDATE recipes SET collect_count = collect_count - 1 WHERE id = ? AND collect_count > 0`;
    await query(sql, [id]);
  }

  // 获取热门菜谱
  static async getPopular(limit = 10) {
    const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
    
    const sql = `
      SELECT r.*, c.name as category_name, u.nickname as creator_name
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE r.status = ?
      ORDER BY (r.view_count * 0.3 + r.like_count * 0.4 + r.collect_count * 0.3) DESC
      LIMIT ${validLimit}
    `;
    
    const recipes = await query(sql, ['active']);
    
    recipes.forEach(recipe => {
      recipe.ingredients = JSON.parse(recipe.ingredients || '[]');
      recipe.steps = JSON.parse(recipe.steps || '[]');
      recipe.step_images = JSON.parse(recipe.step_images || '[]');
      recipe.nutrition_info = JSON.parse(recipe.nutrition_info || '{}');
    });
    
    return recipes;
  }

  // 获取推荐菜谱
  static async getRecommended(userId, limit = 10) {
    try {
      // 1. 获取用户口味档案
      const userProfile = await this.getUserTasteProfile(userId);
      
      // 2. 基于内容的推荐
      const contentBasedRecipes = await this.getContentBasedRecommendations(userId, userProfile, Math.ceil(limit * 0.4));
      
      // 3. 协同过滤推荐
      const collaborativeRecipes = await this.getCollaborativeRecommendations(userId, Math.ceil(limit * 0.4));
      
      // 4. 热门推荐（填充不足的部分）
      const popularRecipes = await this.getPopularRecommendations(userId, Math.ceil(limit * 0.2));
      
      // 5. 混合推荐结果
      const allRecommendations = [...contentBasedRecipes, ...collaborativeRecipes, ...popularRecipes];
      
      // 6. 去重并排序
      const uniqueRecommendations = this.removeDuplicatesAndRank(allRecommendations, userProfile);
      
      return uniqueRecommendations.slice(0, limit);
    } catch (error) {
      console.error('获取推荐菜谱失败:', error);
      // 降级到简单推荐
      return await this.getSimpleRecommendations(userId, limit);
    }
  }

  // 获取用户口味档案
  static async getUserTasteProfile(userId) {
    const sql = `
      SELECT 
        utp.*,
        GROUP_CONCAT(DISTINCT ut.tag_name) as user_tags,
        GROUP_CONCAT(DISTINCT ut.tag_category) as tag_categories
      FROM user_taste_profiles utp
      LEFT JOIN user_tags ut ON ut.user_id = utp.user_id
      WHERE utp.user_id = ?
      GROUP BY utp.user_id
    `;
    
    const result = await query(sql, [userId]);
    if (result.length === 0) {
      return this.getDefaultTasteProfile();
    }
    
    const profile = result[0];
    profile.flavor_preferences = JSON.parse(profile.flavor_preferences || '[]');
    profile.allergies = JSON.parse(profile.allergies || '[]');
    profile.dietary_restrictions = JSON.parse(profile.dietary_restrictions || '[]');
    profile.cuisine_preferences = JSON.parse(profile.cuisine_preferences || '[]');
    profile.user_tags = profile.user_tags ? profile.user_tags.split(',') : [];
    profile.tag_categories = profile.tag_categories ? profile.tag_categories.split(',') : [];
    
    return profile;
  }

  // 基于内容的推荐
  static async getContentBasedRecommendations(userId, userProfile, limit) {
    const sql = `
      SELECT DISTINCT r.*, c.name as category_name, u.nickname as creator_name,
             (
               CASE 
                 WHEN r.difficulty = ? THEN 3
                 WHEN r.difficulty IN ('easy', 'medium') AND ? = 'hard' THEN 2
                 WHEN r.difficulty IN ('medium', 'hard') AND ? = 'easy' THEN 1
                 ELSE 1
               END +
               CASE 
                 WHEN r.seasonal_tags LIKE CONCAT('%', ?, '%') THEN 2
                 ELSE 0
               END +
               CASE 
                 WHEN r.spice_level = ? THEN 2
                 ELSE 0
               END
             ) as content_score
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE r.status = 'active' 
        AND r.creator_id != ?
        AND r.allergies NOT LIKE CONCAT('%', ?, '%')
      ORDER BY content_score DESC, r.average_rating DESC, r.view_count DESC
      LIMIT ?
    `;
    
    const currentSeason = this.getCurrentSeason();
    const spiceLevel = userProfile.spice_level || 'medium';
    const allergens = userProfile.allergies.join('|');
    
    const recipes = await query(sql, [
      userProfile.cooking_skill_level, 
      userProfile.cooking_skill_level,
      userProfile.cooking_skill_level,
      currentSeason,
      spiceLevel,
      userId,
      allergens,
      limit
    ]);
    
    return this.processRecipeData(recipes);
  }

  // 协同过滤推荐
  static async getCollaborativeRecommendations(userId, limit) {
    // 1. 找到相似用户
    const similarUsers = await this.findSimilarUsers(userId, 20);
    
    if (similarUsers.length === 0) {
      return [];
    }
    
    // 2. 获取相似用户喜欢的菜谱
    const similarUserIds = similarUsers.map(u => u.user_id).join(',');
    const sql = `
      SELECT r.*, c.name as category_name, u.nickname as creator_name,
             AVG(rr.overall_rating) as avg_similar_rating,
             COUNT(rr.id) as similar_user_count
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN users u ON r.creator_id = u.id
      LEFT JOIN recipe_reviews rr ON rr.recipe_id = r.id
      WHERE r.status = 'active' 
        AND r.creator_id != ?
        AND rr.user_id IN (${similarUserIds})
        AND rr.overall_rating >= 4.0
        AND r.id NOT IN (
          SELECT recipe_id FROM recipe_reviews WHERE user_id = ? AND recipe_id IS NOT NULL
        )
      GROUP BY r.id
      HAVING similar_user_count >= 2
      ORDER BY avg_similar_rating DESC, similar_user_count DESC
      LIMIT ?
    `;
    
    const recipes = await query(sql, [userId, userId, limit]);
    return this.processRecipeData(recipes);
  }

  // 找到相似用户
  static async findSimilarUsers(userId, limit) {
    const sql = `
      SELECT 
        u2.id as user_id,
        u2.nickname,
        (
          -- 基于标签相似度
          (
            SELECT COUNT(*) 
            FROM user_tags ut1 
            JOIN user_tags ut2 ON ut1.tag_name = ut2.tag_name
            WHERE ut1.user_id = ? AND ut2.user_id = u2.id
          ) * 2 +
          -- 基于口味档案相似度
          (
            SELECT COUNT(*)
            FROM user_taste_profiles utp1
            JOIN user_taste_profiles utp2 ON utp1.spice_level = utp2.spice_level
            WHERE utp1.user_id = ? AND utp2.user_id = u2.id
          ) * 1.5 +
          -- 基于评分相似度
          (
            SELECT COUNT(*)
            FROM recipe_reviews rr1
            JOIN recipe_reviews rr2 ON rr1.recipe_id = rr2.recipe_id
            WHERE rr1.user_id = ? AND rr2.user_id = u2.id
              AND ABS(rr1.overall_rating - rr2.overall_rating) <= 1
          ) * 1
        ) as similarity_score
      FROM users u2
      WHERE u2.id != ?
      HAVING similarity_score > 0
      ORDER BY similarity_score DESC
      LIMIT ?
    `;
    
    return await query(sql, [userId, userId, userId, userId, limit]);
  }

  // 热门推荐
  static async getPopularRecommendations(userId, limit) {
    const sql = `
      SELECT r.*, c.name as category_name, u.nickname as creator_name,
             (r.view_count * 0.3 + r.like_count * 0.5 + r.collect_count * 0.2) as popularity_score
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE r.status = 'active' 
        AND r.creator_id != ?
        AND r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ORDER BY popularity_score DESC, r.average_rating DESC
      LIMIT ?
    `;
    
    const recipes = await query(sql, [userId, limit]);
    return this.processRecipeData(recipes);
  }

  // 去重并排序
  static removeDuplicatesAndRank(recipes, userProfile) {
    const seen = new Set();
    const uniqueRecipes = [];
    
    for (const recipe of recipes) {
      if (!seen.has(recipe.id)) {
        seen.add(recipe.id);
        
        // 计算综合评分
        recipe.recommendation_score = this.calculateRecommendationScore(recipe, userProfile);
        uniqueRecipes.push(recipe);
      }
    }
    
    // 按推荐分数排序
    return uniqueRecipes.sort((a, b) => b.recommendation_score - a.recommendation_score);
  }

  // 计算推荐分数
  static calculateRecommendationScore(recipe, userProfile) {
    let score = 0;
    
    // 基础分数
    score += recipe.average_rating * 10;
    
    // 难度匹配
    if (recipe.difficulty === userProfile.cooking_skill_level) {
      score += 15;
    }
    
    // 季节性匹配
    const currentSeason = this.getCurrentSeason();
    if (recipe.seasonal_tags && recipe.seasonal_tags.includes(currentSeason)) {
      score += 10;
    }
    
    // 口味匹配
    if (recipe.spice_level === userProfile.spice_level) {
      score += 8;
    }
    
    // 流行度
    score += Math.log(recipe.view_count + 1) * 2;
    score += recipe.like_count * 0.5;
    score += recipe.collect_count * 0.3;
    
    // 协同过滤分数
    if (recipe.avg_similar_rating) {
      score += recipe.avg_similar_rating * 5;
    }
    
    // 内容分数
    if (recipe.content_score) {
      score += recipe.content_score * 3;
    }
    
    return score;
  }

  // 简单推荐（降级方案）
  static async getSimpleRecommendations(userId, limit) {
    const sql = `
      SELECT r.*, c.name as category_name, u.nickname as creator_name
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE r.status = 'active' AND r.creator_id != ?
      ORDER BY r.average_rating DESC, r.view_count DESC
      LIMIT ?
    `;
    
    const recipes = await query(sql, [userId, limit]);
    return this.processRecipeData(recipes);
  }

  // 处理菜谱数据
  static processRecipeData(recipes) {
    recipes.forEach(recipe => {
      recipe.ingredients = JSON.parse(recipe.ingredients || '[]');
      recipe.steps = JSON.parse(recipe.steps || '[]');
      recipe.step_images = JSON.parse(recipe.step_images || '[]');
      recipe.nutrition_info = JSON.parse(recipe.nutrition_info || '{}');
    });
    return recipes;
  }

  // 获取当前季节
  static getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  // 获取默认口味档案
  static getDefaultTasteProfile() {
    return {
      spice_level: 'medium',
      sweetness_level: 'medium',
      flavor_preferences: [],
      allergies: [],
      dietary_restrictions: [],
      cuisine_preferences: [],
      cooking_skill_level: 'beginner',
      user_tags: [],
      tag_categories: []
    };
  }

  // 获取菜谱统计信息
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_recipes,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_recipes,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_recipes,
        AVG(view_count) as avg_views,
        AVG(like_count) as avg_likes,
        AVG(collect_count) as avg_collects,
        MAX(view_count) as max_views
      FROM recipes
    `;
    
    const result = await query(sql);
    return result[0];
  }

  // 获取相似菜谱
  static async getSimilarRecipes(recipeId, limit = 5) {
    try {
      // 获取目标菜谱信息
      const targetRecipe = await this.getById(recipeId);
      if (!targetRecipe) {
        return [];
      }
      
      const sql = `
        SELECT r.*, c.name as category_name, u.nickname as creator_name,
               (
                 CASE 
                   WHEN r.category_id = ? THEN 3
                   ELSE 0
                 END +
                 CASE 
                   WHEN r.difficulty = ? THEN 2
                   ELSE 0
                 END +
                 CASE 
                   WHEN r.spice_level = ? THEN 2
                   ELSE 0
                 END +
                 CASE 
                   WHEN r.cooking_time BETWEEN ? - 10 AND ? + 10 THEN 1
                   ELSE 0
                 END +
                 CASE 
                   WHEN r.seasonal_tags = ? THEN 1
                   ELSE 0
                 END
               ) as similarity_score
        FROM recipes r
        LEFT JOIN categories c ON r.category_id = c.id
        LEFT JOIN users u ON r.creator_id = u.id
        WHERE r.status = 'active' 
          AND r.id != ?
        ORDER BY similarity_score DESC, r.average_rating DESC
        LIMIT ?
      `;
      
      const recipes = await query(sql, [
        targetRecipe.category_id,
        targetRecipe.difficulty,
        targetRecipe.spice_level,
        targetRecipe.cooking_time,
        targetRecipe.cooking_time,
        targetRecipe.seasonal_tags,
        recipeId,
        limit
      ]);
      
      return this.processRecipeData(recipes);
    } catch (error) {
      console.error('获取相似菜谱失败:', error);
      return [];
    }
  }

  // 获取上下文推荐
  static async getContextualRecommendations(userId, context, limit = 10) {
    try {
      // 根据餐次时间调整推荐
      const mealTimeFilter = this.getMealTimeFilter(context.meal_time);
      
      // 根据季节调整推荐
      const seasonalBonus = context.season;
      
      const sql = `
        SELECT r.*, c.name as category_name, u.nickname as creator_name,
               (
                 r.average_rating * 10 +
                 CASE 
                   WHEN r.seasonal_tags LIKE CONCAT('%', ?, '%') THEN 15
                   ELSE 0
                 END +
                 CASE 
                   WHEN r.cooking_time <= ? THEN 10
                   ELSE 0
                 END +
                 CASE 
                   WHEN r.category_id IN (${mealTimeFilter}) THEN 12
                   ELSE 0
                 END +
                 LOG(r.view_count + 1) * 2
               ) as context_score
        FROM recipes r
        LEFT JOIN categories c ON r.category_id = c.id
        LEFT JOIN users u ON r.creator_id = u.id
        WHERE r.status = 'active' 
          AND r.creator_id != ?
        ORDER BY context_score DESC
        LIMIT ?
      `;
      
      // 根据时间判断推荐时长（早餐需要快速，晚餐可以复杂）
      const timeLimit = this.getTimeLimit(context.meal_time);
      
      const recipes = await query(sql, [
        seasonalBonus,
        timeLimit,
        userId,
        limit
      ]);
      
      return this.processRecipeData(recipes);
    } catch (error) {
      console.error('获取上下文推荐失败:', error);
      // 降级到普通推荐
      return await this.getRecommended(userId, limit);
    }
  }

  // 获取餐次时间过滤器
  static getMealTimeFilter(mealTime) {
    const mealCategories = {
      breakfast: '1,2,3', // 早餐相关分类ID
      lunch: '4,5,6,7',   // 午餐相关分类ID
      dinner: '4,5,6,7,8', // 晚餐相关分类ID
      snack: '2,9,10'     // 小食相关分类ID
    };
    
    return mealCategories[mealTime] || '1,2,3,4,5,6,7,8,9,10';
  }

  // 获取时间限制
  static getTimeLimit(mealTime) {
    const timeLimits = {
      breakfast: 20, // 早餐20分钟内
      lunch: 40,     // 午餐40分钟内
      dinner: 60,    // 晚餐60分钟内
      snack: 15      // 小食15分钟内
    };
    
    return timeLimits[mealTime] || 30;
  }

  // 更新菜谱浏览量
  static async incrementViewCount(recipeId) {
    try {
      const sql = `
        UPDATE recipes 
        SET view_count = view_count + 1 
        WHERE id = ?
      `;
      
      await query(sql, [recipeId]);
      return true;
    } catch (error) {
      console.error('更新浏览量失败:', error);
      return false;
    }
  }

  // 更新菜谱点赞数
  static async incrementLikeCount(recipeId) {
    try {
      const sql = `
        UPDATE recipes 
        SET like_count = like_count + 1 
        WHERE id = ?
      `;
      
      await query(sql, [recipeId]);
      return true;
    } catch (error) {
      console.error('更新点赞数失败:', error);
      return false;
    }
  }

  // 更新菜谱收藏数
  static async incrementCollectCount(recipeId) {
    try {
      const sql = `
        UPDATE recipes 
        SET collect_count = collect_count + 1 
        WHERE id = ?
      `;
      
      await query(sql, [recipeId]);
      return true;
    } catch (error) {
      console.error('更新收藏数失败:', error);
      return false;
    }
  }

  // 获取菜谱流行度排名
  static async getPopularityRanking(limit = 20) {
    try {
      const sql = `
        SELECT r.*, c.name as category_name, u.nickname as creator_name,
               (r.view_count * 0.3 + r.like_count * 0.5 + r.collect_count * 0.2) as popularity_score
        FROM recipes r
        LEFT JOIN categories c ON r.category_id = c.id
        LEFT JOIN users u ON r.creator_id = u.id
        WHERE r.status = 'active'
        ORDER BY popularity_score DESC
        LIMIT ?
      `;
      
      const recipes = await query(sql, [limit]);
      return this.processRecipeData(recipes);
    } catch (error) {
      console.error('获取流行度排名失败:', error);
      return [];
    }
  }

  // 获取趋势菜谱
  static async getTrendingRecipes(limit = 10) {
    try {
      const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
      
      const sql = `
        SELECT r.*, c.name as category_name, u.nickname as creator_name,
               (
                 (r.view_count * 0.4 + r.like_count * 0.6) * 
                 CASE 
                   WHEN r.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 2
                   WHEN r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1.5
                   ELSE 1
                 END
               ) as trend_score
        FROM recipes r
        LEFT JOIN categories c ON r.category_id = c.id
        LEFT JOIN users u ON r.creator_id = u.id
        WHERE r.status = ? AND r.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        ORDER BY trend_score DESC
        LIMIT ${validLimit}
      `;
      
      const recipes = await query(sql, ['active']);
      return this.processRecipeData(recipes);
    } catch (error) {
      console.error('获取趋势菜谱失败:', error);
      return [];
    }
  }
}

module.exports = Recipe; 