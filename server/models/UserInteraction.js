const { query } = require('../database/connection');

class UserInteraction {
  // 用户关注功能
  static async follow(followerId, followedId) {
    // 检查是否已关注
    const checkSql = `SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ? AND followed_id = ?`;
    const checkResult = await query(checkSql, [followerId, followedId]);
    
    if (checkResult[0].count > 0) {
      return { success: false, message: '已经关注了该用户' };
    }
    
    // 先创建关注表（如果不存在）
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS user_follows (
        id INT PRIMARY KEY AUTO_INCREMENT,
        follower_id INT NOT NULL COMMENT '关注者ID',
        followed_id INT NOT NULL COMMENT '被关注者ID',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (followed_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_follow (follower_id, followed_id)
      )
    `;
    
    await query(createTableSql);
    
    // 添加关注记录
    const followSql = `INSERT INTO user_follows (follower_id, followed_id) VALUES (?, ?)`;
    const result = await query(followSql, [followerId, followedId]);
    
    if (result.insertId) {
      // 更新关注者的关注数
      await query(`UPDATE users SET following_count = following_count + 1 WHERE id = ?`, [followerId]);
      
      // 更新被关注者的粉丝数
      await query(`UPDATE users SET follower_count = follower_count + 1 WHERE id = ?`, [followedId]);
      
      return { success: true, id: result.insertId };
    }
    
    return { success: false, message: '关注失败' };
  }

  // 用户取消关注
  static async unfollow(followerId, followedId) {
    const sql = `DELETE FROM user_follows WHERE follower_id = ? AND followed_id = ?`;
    const result = await query(sql, [followerId, followedId]);
    
    if (result.affectedRows > 0) {
      // 更新关注者的关注数
      await query(`UPDATE users SET following_count = following_count - 1 WHERE id = ?`, [followerId]);
      
      // 更新被关注者的粉丝数
      await query(`UPDATE users SET follower_count = follower_count - 1 WHERE id = ?`, [followedId]);
      
      return { success: true };
    }
    
    return { success: false, message: '取消关注失败' };
  }

  // 检查用户是否关注了某用户
  static async isFollowing(followerId, followedId) {
    const sql = `SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ? AND followed_id = ?`;
    const result = await query(sql, [followerId, followedId]);
    return result[0].count > 0;
  }

  // 获取用户的关注列表
  static async getFollowing(userId, params = {}) {
    const { page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT u.id, u.nickname, u.avatar, u.bio, u.cooking_level, u.is_verified, 
             u.recipe_count, u.follower_count, uf.created_at as followed_at
      FROM user_follows uf
      LEFT JOIN users u ON uf.followed_id = u.id
      WHERE uf.follower_id = ?
      ORDER BY uf.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    return await query(sql, [userId, limit, offset]);
  }

  // 获取用户的粉丝列表
  static async getFollowers(userId, params = {}) {
    const { page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT u.id, u.nickname, u.avatar, u.bio, u.cooking_level, u.is_verified, 
             u.recipe_count, u.follower_count, uf.created_at as followed_at
      FROM user_follows uf
      LEFT JOIN users u ON uf.follower_id = u.id
      WHERE uf.followed_id = ?
      ORDER BY uf.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    return await query(sql, [userId, limit, offset]);
  }

  // 菜谱点赞功能
  static async likeRecipe(userId, recipeId) {
    // 先创建点赞表（如果不存在）
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS recipe_likes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL COMMENT '用户ID',
        recipe_id INT NOT NULL COMMENT '菜谱ID',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        UNIQUE KEY unique_like (user_id, recipe_id)
      )
    `;
    
    await query(createTableSql);
    
    // 检查是否已点赞
    const checkSql = `SELECT COUNT(*) as count FROM recipe_likes WHERE user_id = ? AND recipe_id = ?`;
    const checkResult = await query(checkSql, [userId, recipeId]);
    
    if (checkResult[0].count > 0) {
      return { success: false, message: '已经点赞了该菜谱' };
    }
    
    // 添加点赞记录
    const likeSql = `INSERT INTO recipe_likes (user_id, recipe_id) VALUES (?, ?)`;
    const result = await query(likeSql, [userId, recipeId]);
    
    if (result.insertId) {
      // 更新菜谱的点赞数
      await query(`UPDATE recipes SET like_count = like_count + 1 WHERE id = ?`, [recipeId]);
      
      // 更新作者的总获赞数
      await query(`
        UPDATE users SET total_likes = total_likes + 1 
        WHERE id = (SELECT creator_id FROM recipes WHERE id = ?)
      `, [recipeId]);
      
      return { success: true, id: result.insertId };
    }
    
    return { success: false, message: '点赞失败' };
  }

  // 取消菜谱点赞
  static async unlikeRecipe(userId, recipeId) {
    const sql = `DELETE FROM recipe_likes WHERE user_id = ? AND recipe_id = ?`;
    const result = await query(sql, [userId, recipeId]);
    
    if (result.affectedRows > 0) {
      // 更新菜谱的点赞数
      await query(`UPDATE recipes SET like_count = like_count - 1 WHERE id = ?`, [recipeId]);
      
      // 更新作者的总获赞数
      await query(`
        UPDATE users SET total_likes = total_likes - 1 
        WHERE id = (SELECT creator_id FROM recipes WHERE id = ?)
      `, [recipeId]);
      
      return { success: true };
    }
    
    return { success: false, message: '取消点赞失败' };
  }

  // 检查用户是否点赞了某菜谱
  static async isLikedRecipe(userId, recipeId) {
    const sql = `SELECT COUNT(*) as count FROM recipe_likes WHERE user_id = ? AND recipe_id = ?`;
    const result = await query(sql, [userId, recipeId]);
    return result[0].count > 0;
  }

  // 菜谱收藏功能
  static async collectRecipe(userId, recipeId) {
    // 先创建收藏表（如果不存在）
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS recipe_collections (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL COMMENT '用户ID',
        recipe_id INT NOT NULL COMMENT '菜谱ID',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        UNIQUE KEY unique_collection (user_id, recipe_id)
      )
    `;
    
    await query(createTableSql);
    
    // 检查是否已收藏
    const checkSql = `SELECT COUNT(*) as count FROM recipe_collections WHERE user_id = ? AND recipe_id = ?`;
    const checkResult = await query(checkSql, [userId, recipeId]);
    
    if (checkResult[0].count > 0) {
      return { success: false, message: '已经收藏了该菜谱' };
    }
    
    // 添加收藏记录
    const collectSql = `INSERT INTO recipe_collections (user_id, recipe_id) VALUES (?, ?)`;
    const result = await query(collectSql, [userId, recipeId]);
    
    if (result.insertId) {
      // 更新菜谱的收藏数
      await query(`UPDATE recipes SET collect_count = collect_count + 1 WHERE id = ?`, [recipeId]);
      
      return { success: true, id: result.insertId };
    }
    
    return { success: false, message: '收藏失败' };
  }

  // 取消菜谱收藏
  static async uncollectRecipe(userId, recipeId) {
    const sql = `DELETE FROM recipe_collections WHERE user_id = ? AND recipe_id = ?`;
    const result = await query(sql, [userId, recipeId]);
    
    if (result.affectedRows > 0) {
      // 更新菜谱的收藏数
      await query(`UPDATE recipes SET collect_count = collect_count - 1 WHERE id = ?`, [recipeId]);
      
      return { success: true };
    }
    
    return { success: false, message: '取消收藏失败' };
  }

  // 检查用户是否收藏了某菜谱
  static async isCollectedRecipe(userId, recipeId) {
    const sql = `SELECT COUNT(*) as count FROM recipe_collections WHERE user_id = ? AND recipe_id = ?`;
    const result = await query(sql, [userId, recipeId]);
    return result[0].count > 0;
  }

  // 获取用户的收藏列表
  static async getUserCollections(userId, params = {}) {
    const { page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT r.*, u.nickname as creator_name, u.avatar as creator_avatar, 
             rc.created_at as collected_at
      FROM recipe_collections rc
      LEFT JOIN recipes r ON rc.recipe_id = r.id
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE rc.user_id = ?
      ORDER BY rc.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const results = await query(sql, [userId, limit, offset]);
    
    // 解析JSON字段
    results.forEach(recipe => {
      recipe.ingredients = JSON.parse(recipe.ingredients || '[]');
      recipe.steps = JSON.parse(recipe.steps || '[]');
      recipe.step_images = JSON.parse(recipe.step_images || '[]');
      recipe.nutrition_info = JSON.parse(recipe.nutrition_info || '{}');
    });
    
    return results;
  }

  // 分享菜谱
  static async shareRecipe(userId, recipeId, shareType = 'general') {
    // 先创建分享表（如果不存在）
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS recipe_shares (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL COMMENT '分享者ID',
        recipe_id INT NOT NULL COMMENT '菜谱ID',
        share_type ENUM('general', 'wechat', 'moments', 'weibo') DEFAULT 'general' COMMENT '分享类型',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
      )
    `;
    
    await query(createTableSql);
    
    // 添加分享记录
    const shareSql = `INSERT INTO recipe_shares (user_id, recipe_id, share_type) VALUES (?, ?, ?)`;
    const result = await query(shareSql, [userId, recipeId, shareType]);
    
    if (result.insertId) {
      // 更新菜谱的分享数（如果有这个字段）
      await query(`UPDATE recipes SET share_count = share_count + 1 WHERE id = ?`, [recipeId]);
      
      return { success: true, id: result.insertId };
    }
    
    return { success: false, message: '分享失败' };
  }

  // 获取菜谱的分享统计
  static async getRecipeShareStats(recipeId) {
    const sql = `
      SELECT 
        COUNT(*) as total_shares,
        COUNT(CASE WHEN share_type = 'wechat' THEN 1 END) as wechat_shares,
        COUNT(CASE WHEN share_type = 'moments' THEN 1 END) as moments_shares,
        COUNT(CASE WHEN share_type = 'weibo' THEN 1 END) as weibo_shares
      FROM recipe_shares
      WHERE recipe_id = ?
    `;
    
    const result = await query(sql, [recipeId]);
    return result[0];
  }

  // 获取用户的互动统计
  static async getUserInteractionStats(userId) {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM user_follows WHERE follower_id = ?) as following_count,
        (SELECT COUNT(*) FROM user_follows WHERE followed_id = ?) as follower_count,
        (SELECT COUNT(*) FROM recipe_likes WHERE user_id = ?) as liked_recipes,
        (SELECT COUNT(*) FROM recipe_collections WHERE user_id = ?) as collected_recipes,
        (SELECT COUNT(*) FROM recipe_shares WHERE user_id = ?) as shared_recipes
    `;
    
    const result = await query(sql, [userId, userId, userId, userId, userId]);
    return result[0];
  }

  // 获取用户的动态时间线
  static async getUserTimeline(userId, params = {}) {
    const { page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;
    
    // 获取关注的用户的动态
    const sql = `
      SELECT 
        'recipe' as type,
        r.id as content_id,
        r.name as content_title,
        r.description as content_description,
        r.main_image as content_image,
        r.creator_id as user_id,
        u.nickname as user_name,
        u.avatar as user_avatar,
        r.created_at as action_time
      FROM recipes r
      LEFT JOIN users u ON r.creator_id = u.id
      WHERE r.creator_id IN (SELECT followed_id FROM user_follows WHERE follower_id = ?)
        AND r.status = 'active'
      
      UNION ALL
      
      SELECT 
        'recipe_plan' as type,
        p.id as content_id,
        p.name as content_title,
        p.description as content_description,
        '' as content_image,
        p.creator_id as user_id,
        u.nickname as user_name,
        u.avatar as user_avatar,
        p.created_at as action_time
      FROM recipe_plans p
      LEFT JOIN users u ON p.creator_id = u.id
      WHERE p.creator_id IN (SELECT followed_id FROM user_follows WHERE follower_id = ?)
        AND p.status = 'active'
      
      ORDER BY action_time DESC
      LIMIT ? OFFSET ?
    `;
    
    return await query(sql, [userId, userId, limit, offset]);
  }

  // 获取推荐关注的用户
  static async getRecommendedUsers(userId, limit = 10) {
    const validUserId = parseInt(userId) || 1;
    const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
    
    const sql = `
      SELECT u.id, u.nickname, u.avatar, u.bio, u.cooking_level, u.is_verified, 
             u.recipe_count, u.follower_count, u.total_likes
      FROM users u
      WHERE u.id != ? 
        AND u.id NOT IN (SELECT followed_id FROM user_follows WHERE follower_id = ?)
        AND u.recipe_count > 0
      ORDER BY u.follower_count DESC, u.total_likes DESC, u.recipe_count DESC
      LIMIT ${validLimit}
    `;
    
    return await query(sql, [validUserId, validUserId]);
  }
}

module.exports = UserInteraction; 