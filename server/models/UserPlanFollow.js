const { query } = require('../database/connection');

class UserPlanFollow {
  // 用户跟随计划
  static async follow(userId, planId) {
    // 检查是否已经跟随
    const checkSql = `SELECT id FROM user_plan_follows WHERE user_id = ? AND plan_id = ?`;
    const existing = await query(checkSql, [userId, planId]);
    
    if (existing.length > 0) {
      return { success: false, message: '已经在跟随此计划' };
    }
    
    const sql = `
      INSERT INTO user_plan_follows (user_id, plan_id, start_date, current_day, 
                                   completion_status, created_at, updated_at)
      VALUES (?, ?, CURDATE(), 1, 'active', NOW(), NOW())
    `;
    
    const result = await query(sql, [userId, planId]);
    
    if (result.insertId) {
      // 更新计划的跟随者数量
      const updateSql = `UPDATE recipe_plans SET follower_count = follower_count + 1 WHERE id = ?`;
      await query(updateSql, [planId]);
      
      return { success: true, id: result.insertId };
    }
    
    return { success: false, message: '跟随失败' };
  }

  // 用户取消跟随计划
  static async unfollow(userId, planId) {
    const sql = `DELETE FROM user_plan_follows WHERE user_id = ? AND plan_id = ?`;
    const result = await query(sql, [userId, planId]);
    
    if (result.affectedRows > 0) {
      // 更新计划的跟随者数量
      const updateSql = `UPDATE recipe_plans SET follower_count = follower_count - 1 WHERE id = ?`;
      await query(updateSql, [planId]);
      
      return { success: true };
    }
    
    return { success: false, message: '取消跟随失败' };
  }

  // 获取用户跟随的计划列表
  static async getUserFollowedPlans(userId, params = {}) {
    const { page = 1, limit = 10, status } = params;
    const offset = (page - 1) * limit;
    
    // 验证和清理参数
    const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
    const validOffset = Math.max(0, parseInt(offset) || 0);
    
    let whereClauses = [`upf.user_id = ?`];
    let queryParams = [parseInt(userId)];
    
    if (status) {
      whereClauses.push(`upf.completion_status = ?`);
      queryParams.push(status);
    }
    
    const whereClause = whereClauses.join(' AND ');
    
    const sql = `
      SELECT upf.*, p.name as plan_name, p.description as plan_description, 
             p.duration_days, p.target_goal, p.difficulty_level, p.recipes_per_day,
             u.nickname as creator_name, u.avatar as creator_avatar,
             DATEDIFF(NOW(), upf.start_date) as days_since_start
      FROM user_plan_follows upf
      LEFT JOIN recipe_plans p ON upf.plan_id = p.id
      LEFT JOIN users u ON p.creator_id = u.id
      WHERE ${whereClause}
      ORDER BY upf.created_at DESC
      LIMIT ${validLimit} OFFSET ${validOffset}
    `;
    
    const follows = await query(sql, queryParams);
    
    // 解析已完成菜谱记录
    follows.forEach(follow => {
      follow.completed_recipes = JSON.parse(follow.completed_recipes || '[]');
    });
    
    return follows;
  }

  // 获取用户跟随的计划详情
  static async getUserPlanFollow(userId, planId) {
    const sql = `
      SELECT upf.*, p.name as plan_name, p.description as plan_description, 
             p.duration_days, p.target_goal, p.difficulty_level, p.recipes_per_day,
             u.nickname as creator_name, u.avatar as creator_avatar,
             DATEDIFF(NOW(), upf.start_date) as days_since_start
      FROM user_plan_follows upf
      LEFT JOIN recipe_plans p ON upf.plan_id = p.id
      LEFT JOIN users u ON p.creator_id = u.id
      WHERE upf.user_id = ? AND upf.plan_id = ?
    `;
    
    const results = await query(sql, [userId, planId]);
    
    if (results.length === 0) {
      return null;
    }
    
    const follow = results[0];
    follow.completed_recipes = JSON.parse(follow.completed_recipes || '[]');
    
    return follow;
  }

  // 更新用户计划进度
  static async updateProgress(userId, planId, progressData) {
    const { current_day, completed_recipes, notes } = progressData;
    
    const sql = `
      UPDATE user_plan_follows SET 
        current_day = ?, 
        completed_recipes = ?, 
        notes = ?, 
        updated_at = NOW()
      WHERE user_id = ? AND plan_id = ?
    `;
    
    const result = await query(sql, [
      current_day, 
      JSON.stringify(completed_recipes || []), 
      notes, 
      userId, 
      planId
    ]);
    
    return result.affectedRows > 0;
  }

  // 标记菜谱为已完成
  static async markRecipeCompleted(userId, planId, recipeId, dayNumber, mealType) {
    // 获取当前已完成的菜谱记录
    const getCurrentSql = `SELECT completed_recipes FROM user_plan_follows WHERE user_id = ? AND plan_id = ?`;
    const currentResult = await query(getCurrentSql, [userId, planId]);
    
    if (currentResult.length === 0) {
      return false;
    }
    
    const completedRecipes = JSON.parse(currentResult[0].completed_recipes || '[]');
    
    // 添加新完成的菜谱
    const completedEntry = {
      recipe_id: recipeId,
      day_number: dayNumber,
      meal_type: mealType,
      completed_at: new Date().toISOString()
    };
    
    // 检查是否已经完成
    const alreadyCompleted = completedRecipes.find(entry => 
      entry.recipe_id === recipeId && 
      entry.day_number === dayNumber && 
      entry.meal_type === mealType
    );
    
    if (!alreadyCompleted) {
      completedRecipes.push(completedEntry);
    }
    
    // 更新数据库
    const updateSql = `
      UPDATE user_plan_follows SET 
        completed_recipes = ?, 
        updated_at = NOW()
      WHERE user_id = ? AND plan_id = ?
    `;
    
    const result = await query(updateSql, [JSON.stringify(completedRecipes), userId, planId]);
    return result.affectedRows > 0;
  }

  // 更新计划完成状态
  static async updateStatus(userId, planId, status, rating = null) {
    const sql = `
      UPDATE user_plan_follows SET 
        completion_status = ?, 
        rating = ?, 
        updated_at = NOW()
      WHERE user_id = ? AND plan_id = ?
    `;
    
    const result = await query(sql, [status, rating, userId, planId]);
    
    // 如果完成计划，更新计划的完成率
    if (status === 'completed' && result.affectedRows > 0) {
      await this.updatePlanCompletionRate(planId);
    }
    
    return result.affectedRows > 0;
  }

  // 更新计划的完成率
  static async updatePlanCompletionRate(planId) {
    const sql = `
      UPDATE recipe_plans SET 
        completion_rate = (
          SELECT (COUNT(CASE WHEN completion_status = 'completed' THEN 1 END) * 100.0 / COUNT(*))
          FROM user_plan_follows 
          WHERE plan_id = ?
        ),
        updated_at = NOW()
      WHERE id = ?
    `;
    
    await query(sql, [planId, planId]);
  }

  // 获取计划的跟随统计
  static async getPlanFollowStats(planId) {
    const sql = `
      SELECT 
        COUNT(*) as total_followers,
        COUNT(CASE WHEN completion_status = 'active' THEN 1 END) as active_followers,
        COUNT(CASE WHEN completion_status = 'completed' THEN 1 END) as completed_followers,
        COUNT(CASE WHEN completion_status = 'paused' THEN 1 END) as paused_followers,
        COUNT(CASE WHEN completion_status = 'cancelled' THEN 1 END) as cancelled_followers,
        AVG(current_day) as avg_progress,
        AVG(rating) as avg_rating
      FROM user_plan_follows
      WHERE plan_id = ?
    `;
    
    const result = await query(sql, [planId]);
    return result[0];
  }

  // 获取用户今日的计划任务
  static async getUserTodayTasks(userId) {
    const sql = `
      SELECT upf.*, p.name as plan_name, p.target_goal,
             pr.recipe_id, pr.meal_type, pr.sort_order,
             r.name as recipe_name, r.main_image as recipe_image,
             r.cooking_time, r.difficulty
      FROM user_plan_follows upf
      LEFT JOIN recipe_plans p ON upf.plan_id = p.id
      LEFT JOIN plan_recipes pr ON p.id = pr.plan_id AND pr.day_number = upf.current_day
      LEFT JOIN recipes r ON pr.recipe_id = r.id
      WHERE upf.user_id = ? AND upf.completion_status = 'active'
      ORDER BY upf.created_at, pr.sort_order
    `;
    
    const results = await query(sql, [userId]);
    
    // 按计划分组
    const tasksByPlan = {};
    results.forEach(result => {
      if (!tasksByPlan[result.plan_id]) {
        tasksByPlan[result.plan_id] = {
          plan_id: result.plan_id,
          plan_name: result.plan_name,
          target_goal: result.target_goal,
          current_day: result.current_day,
          start_date: result.start_date,
          recipes: []
        };
      }
      
      if (result.recipe_id) {
        tasksByPlan[result.plan_id].recipes.push({
          recipe_id: result.recipe_id,
          recipe_name: result.recipe_name,
          recipe_image: result.recipe_image,
          cooking_time: result.cooking_time,
          difficulty: result.difficulty,
          meal_type: result.meal_type,
          sort_order: result.sort_order
        });
      }
    });
    
    return Object.values(tasksByPlan);
  }

  // 检查用户是否已跟随计划
  static async isFollowing(userId, planId) {
    const sql = `SELECT id FROM user_plan_follows WHERE user_id = ? AND plan_id = ?`;
    const result = await query(sql, [userId, planId]);
    return result.length > 0;
  }

  // 获取用户的跟随统计
  static async getUserFollowStats(userId) {
    const sql = `
      SELECT 
        COUNT(*) as total_plans,
        COUNT(CASE WHEN completion_status = 'active' THEN 1 END) as active_plans,
        COUNT(CASE WHEN completion_status = 'completed' THEN 1 END) as completed_plans,
        COUNT(CASE WHEN completion_status = 'paused' THEN 1 END) as paused_plans,
        AVG(current_day) as avg_progress,
        AVG(DATEDIFF(NOW(), start_date)) as avg_duration_days
      FROM user_plan_follows
      WHERE user_id = ?
    `;
    
    const result = await query(sql, [userId]);
    return result[0];
  }

  // 暂停计划
  static async pausePlan(userId, planId) {
    return await this.updateStatus(userId, planId, 'paused');
  }

  // 恢复计划
  static async resumePlan(userId, planId) {
    return await this.updateStatus(userId, planId, 'active');
  }

  // 取消计划
  static async cancelPlan(userId, planId) {
    return await this.updateStatus(userId, planId, 'cancelled');
  }

  // 完成计划
  static async completePlan(userId, planId, rating = null) {
    return await this.updateStatus(userId, planId, 'completed', rating);
  }
}

module.exports = UserPlanFollow; 