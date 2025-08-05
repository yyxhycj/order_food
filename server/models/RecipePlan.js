const { query } = require('../database/connection');

class RecipePlan {
  // 创建菜谱计划
  static async create(planData) {
    const { name, description, creator_id, duration_days, target_goal, 
            difficulty_level, recipes_per_day } = planData;
    
    const sql = `
      INSERT INTO recipe_plans (name, description, creator_id, duration_days, target_goal, 
                               difficulty_level, recipes_per_day, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', NOW(), NOW())
    `;
    
    const result = await query(sql, [
      name, description, creator_id, duration_days, target_goal, 
      difficulty_level, recipes_per_day
    ]);
    
    return result.insertId;
  }

  // 获取菜谱计划列表
  static async getList(params = {}) {
    const { page = 1, limit = 10, creator_id, difficulty_level, status = 'active', 
            search, sort_by = 'created_at', sort_order = 'DESC' } = params;
    
    const offset = (page - 1) * limit;
    
    // 验证和清理参数
    const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const validOffset = Math.max(0, parseInt(offset) || 0);
    
    // 验证排序字段，防止SQL注入
    const allowedSortFields = ['created_at', 'updated_at', 'name', 'follower_count', 'average_rating'];
    const allowedSortOrders = ['ASC', 'DESC'];
    const validSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const validSortOrder = allowedSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';
    
    let whereClauses = [`p.status = ?`];
    let queryParams = [status];
    
    if (creator_id) {
      whereClauses.push(`p.creator_id = ?`);
      queryParams.push(parseInt(creator_id));
    }
    
    if (difficulty_level) {
      whereClauses.push(`p.difficulty_level = ?`);
      queryParams.push(difficulty_level);
    }
    
    if (search) {
      whereClauses.push(`(p.name LIKE ? OR p.description LIKE ?)`);
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    const whereClause = whereClauses.join(' AND ');
    
    // 使用字符串拼接处理 ORDER BY 和 LIMIT，因为 MySQL 不支持这些子句中的占位符
    const sql = `
      SELECT p.*, u.nickname as creator_name, u.avatar as creator_avatar
      FROM recipe_plans p
      LEFT JOIN users u ON p.creator_id = u.id
      WHERE ${whereClause}
      ORDER BY p.${validSortBy} ${validSortOrder}
      LIMIT ${validLimit} OFFSET ${validOffset}
    `;
    
    const plans = await query(sql, queryParams);
    
    // 获取每个计划的菜谱数量
    for (let plan of plans) {
      const countSql = `SELECT COUNT(*) as count FROM plan_recipes WHERE plan_id = ?`;
      const countResult = await query(countSql, [plan.id]);
      plan.current_recipe_count = countResult[0].count;
    }
    
    return plans;
  }

  // 获取菜谱计划详情
  static async getById(id) {
    const sql = `
      SELECT p.*, u.nickname as creator_name, u.avatar as creator_avatar, 
             u.cooking_level as creator_level, u.is_verified as creator_verified
      FROM recipe_plans p
      LEFT JOIN users u ON p.creator_id = u.id
      WHERE p.id = ?
    `;
    
    const results = await query(sql, [id]);
    
    if (results.length === 0) {
      return null;
    }
    
    const plan = results[0];
    
    // 获取计划关联的菜谱
    const recipesSql = `
      SELECT pr.*, r.name as recipe_name, r.main_image as recipe_image, 
             r.cooking_time, r.difficulty, r.average_rating,
             c.name as category_name
      FROM plan_recipes pr
      LEFT JOIN recipes r ON pr.recipe_id = r.id
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE pr.plan_id = ?
      ORDER BY pr.day_number, pr.sort_order
    `;
    
    const recipes = await query(recipesSql, [id]);
    
    // 按天分组菜谱
    const recipesByDay = {};
    recipes.forEach(recipe => {
      if (!recipesByDay[recipe.day_number]) {
        recipesByDay[recipe.day_number] = {};
      }
      if (!recipesByDay[recipe.day_number][recipe.meal_type]) {
        recipesByDay[recipe.day_number][recipe.meal_type] = [];
      }
      recipesByDay[recipe.day_number][recipe.meal_type].push(recipe);
    });
    
    plan.recipes_by_day = recipesByDay;
    plan.total_recipes = recipes.length;
    
    return plan;
  }

  // 更新菜谱计划
  static async update(id, updateData) {
    const { name, description, duration_days, target_goal, difficulty_level, 
            recipes_per_day } = updateData;
    
    const sql = `
      UPDATE recipe_plans SET 
        name = ?, description = ?, duration_days = ?, target_goal = ?, 
        difficulty_level = ?, recipes_per_day = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    const result = await query(sql, [
      name, description, duration_days, target_goal, difficulty_level, 
      recipes_per_day, id
    ]);
    
    return result.affectedRows > 0;
  }

  // 删除菜谱计划
  static async delete(id) {
    const sql = `DELETE FROM recipe_plans WHERE id = ?`;
    const result = await query(sql, [id]);
    return result.affectedRows > 0;
  }

  // 更新计划状态
  static async updateStatus(id, status) {
    const sql = `UPDATE recipe_plans SET status = ?, updated_at = NOW() WHERE id = ?`;
    const result = await query(sql, [status, id]);
    return result.affectedRows > 0;
  }

  // 添加菜谱到计划
  static async addRecipe(planId, recipeData) {
    const { recipe_id, day_number, meal_type, sort_order = 0 } = recipeData;
    
    const sql = `
      INSERT INTO plan_recipes (plan_id, recipe_id, day_number, meal_type, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    const result = await query(sql, [planId, recipe_id, day_number, meal_type, sort_order]);
    
    // 更新计划的总菜谱数量
    await this.updateTotalRecipes(planId);
    
    return result.insertId;
  }

  // 从计划中移除菜谱
  static async removeRecipe(planId, recipeId, dayNumber, mealType) {
    const sql = `DELETE FROM plan_recipes WHERE plan_id = ? AND recipe_id = ? AND day_number = ? AND meal_type = ?`;
    const result = await query(sql, [planId, recipeId, dayNumber, mealType]);
    
    // 更新计划的总菜谱数量
    await this.updateTotalRecipes(planId);
    
    return result.affectedRows > 0;
  }

  // 更新计划的总菜谱数量
  static async updateTotalRecipes(planId) {
    const countSql = `SELECT COUNT(*) as count FROM plan_recipes WHERE plan_id = ?`;
    const countResult = await query(countSql, [planId]);
    const totalRecipes = countResult[0].count;
    
    const updateSql = `UPDATE recipe_plans SET total_recipes = ?, updated_at = NOW() WHERE id = ?`;
    await query(updateSql, [totalRecipes, planId]);
  }

  // 获取计划统计信息
  static async getStats(planId) {
    const sql = `
      SELECT 
        COUNT(*) as total_recipes,
        AVG(r.cooking_time) as avg_cooking_time,
        AVG(r.average_rating) as avg_rating,
        COUNT(DISTINCT pr.day_number) as total_days
      FROM plan_recipes pr
      LEFT JOIN recipes r ON pr.recipe_id = r.id
      WHERE pr.plan_id = ?
    `;
    
    const result = await query(sql, [planId]);
    return result[0];
  }

  // 获取热门计划
  static async getTrending(limit = 10) {
    const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
    
    const sql = `
      SELECT p.*, u.nickname as creator_name, u.avatar as creator_avatar
      FROM recipe_plans p
      LEFT JOIN users u ON p.creator_id = u.id
      WHERE p.status = ?
      ORDER BY p.follower_count DESC, p.average_rating DESC, p.created_at DESC
      LIMIT ${validLimit}
    `;
    
    const plans = await query(sql, ['active']);
    
    // 获取每个计划的菜谱数量
    for (let plan of plans) {
      const countSql = `SELECT COUNT(*) as count FROM plan_recipes WHERE plan_id = ?`;
      const countResult = await query(countSql, [plan.id]);
      plan.current_recipe_count = countResult[0].count;
    }
    
    return plans;
  }

  // 获取推荐计划
  static async getRecommended(userId, limit = 10) {
    const validUserId = parseInt(userId) || 1;
    const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
    
    // 基于用户口味档案和标签推荐计划
    const sql = `
      SELECT p.*, u.nickname as creator_name, u.avatar as creator_avatar,
             COUNT(DISTINCT pr.recipe_id) as recipe_count
      FROM recipe_plans p
      LEFT JOIN users u ON p.creator_id = u.id
      LEFT JOIN plan_recipes pr ON p.id = pr.plan_id
      WHERE p.status = ? AND p.creator_id != ?
      GROUP BY p.id
      ORDER BY p.average_rating DESC, p.follower_count DESC
      LIMIT ${validLimit}
    `;
    
    return await query(sql, ['active', validUserId]);
  }

  // 更新计划评分
  static async updateRating(planId) {
    const sql = `
      UPDATE recipe_plans SET 
        average_rating = (
          SELECT AVG(upf.rating) 
          FROM user_plan_follows upf 
          WHERE upf.plan_id = ? AND upf.rating IS NOT NULL
        ),
        updated_at = NOW()
      WHERE id = ?
    `;
    
    await query(sql, [planId, planId]);
  }

  // 增加跟随者数量
  static async incrementFollowerCount(planId) {
    const sql = `UPDATE recipe_plans SET follower_count = follower_count + 1, updated_at = NOW() WHERE id = ?`;
    await query(sql, [planId]);
  }

  // 减少跟随者数量
  static async decrementFollowerCount(planId) {
    const sql = `UPDATE recipe_plans SET follower_count = follower_count - 1, updated_at = NOW() WHERE id = ?`;
    await query(sql, [planId]);
  }

  // 获取计划的跟随者列表
  static async getFollowers(planId, limit = 10) {
    const sql = `
      SELECT u.id, u.nickname, u.avatar, upf.start_date, upf.current_day, upf.completion_status
      FROM user_plan_follows upf
      LEFT JOIN users u ON upf.user_id = u.id
      WHERE upf.plan_id = ?
      ORDER BY upf.created_at DESC
      LIMIT ?
    `;
    
    return await query(sql, [planId, limit]);
  }
}

module.exports = RecipePlan; 