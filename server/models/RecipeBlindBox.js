const db = require('../database/connection');

class RecipeBlindBox {
  /**
   * 创建新的食谱盲盒
   * @param {Object} boxData - 盲盒数据
   * @returns {Promise<Object>} 创建的盲盒信息
   */
  static async create(boxData) {
    try {
      const { user_id, theme, recipe_ids, status = 'pending' } = boxData;
      
      const query = `
        INSERT INTO recipe_blind_boxes (user_id, theme, recipe_ids, status)
        VALUES (?, ?, ?, ?)
      `;
      
      const result = await db.query(query, [
        user_id,
        theme,
        JSON.stringify(recipe_ids),
        status
      ]);
      
      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error creating recipe blind box:', error);
      throw error;
    }
  }

  /**
   * 根据ID查找盲盒
   * @param {number} id - 盲盒ID
   * @returns {Promise<Object|null>} 盲盒信息
   */
  static async findById(id) {
    try {
      const query = `
        SELECT rbb.*, u.nickname as user_nickname
        FROM recipe_blind_boxes rbb
        LEFT JOIN users u ON rbb.user_id = u.id
        WHERE rbb.id = ?
      `;
      
      const rows = await db.query(query, [id]);
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding recipe blind box:', error);
      throw error;
    }
  }

  /**
   * 获取用户的盲盒历史
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制数量
   * @param {number} offset - 偏移量
   * @returns {Promise<Array>} 盲盒列表
   */
  static async findByUserId(userId, limit = 10, offset = 0) {
    try {
      const query = `
        SELECT bb.*, COUNT(DISTINCT r.id) as recipe_count
        FROM recipe_blind_boxes bb
        LEFT JOIN recipes r ON JSON_CONTAINS(bb.recipe_ids, CAST(r.id AS JSON), '$')
        WHERE bb.user_id = ?
        GROUP BY bb.id
        ORDER BY bb.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const rows = await db.query(query, [userId, limit, offset]);
      
      return rows.map(box => {
        if (box.dietary_restrictions) {
          box.dietary_restrictions = JSON.parse(box.dietary_restrictions);
        }
        if (box.recipe_ids) {
          box.recipe_ids = JSON.parse(box.recipe_ids);
        }
        if (box.opened_recipes) {
          box.opened_recipes = JSON.parse(box.opened_recipes);
        }
        return box;
      });
    } catch (error) {
      console.error('Error finding user blind boxes:', error);
      throw error;
    }
  }

  /**
   * 生成智能盲盒
   * @param {Object} preferences - 用户偏好
   * @returns {Promise<Array>} 推荐菜谱ID列表
   */
  static async generateSmartBlindBox(preferences) {
    try {
      const { user_id, theme, dietary_restrictions, budget_range, box_size = 5 } = preferences;
      
      let query = `
        SELECT DISTINCT r.id, r.name, r.difficulty, r.cooking_time, r.average_rating,
               r.seasonal_tags, r.ingredients, r.view_count, r.like_count
        FROM recipes r
        WHERE r.status = 'active'
      `;
      
      const queryParams = [];
      
      // 应用饮食限制
      if (dietary_restrictions && dietary_restrictions.length > 0) {
        const restrictions = dietary_restrictions.map(() => '?').join(', ');
        query += ` AND r.id NOT IN (
          SELECT DISTINCT r2.id FROM recipes r2
          WHERE JSON_EXTRACT(r2.ingredients, '$') REGEXP (${restrictions})
        )`;
        queryParams.push(...dietary_restrictions);
      }
      
      // 应用主题过滤
      if (theme && theme !== '随机') {
        query += ` AND (r.name LIKE ? OR r.description LIKE ? OR r.seasonal_tags LIKE ?)`;
        queryParams.push(`%${theme}%`, `%${theme}%`, `%${theme}%`);
      }
      
      // 应用预算范围（根据食材成本估算）
      if (budget_range) {
        const budgetCondition = this.getBudgetCondition(budget_range);
        if (budgetCondition) {
          query += ` AND ${budgetCondition}`;
        }
      }
      
      // 添加随机性和多样性
      query += ` ORDER BY RAND() LIMIT ?`;
      queryParams.push(box_size * 2); // 获取更多候选，然后筛选
      
      const recipes = await db.query(query, queryParams);
      
      // 应用多样性算法
      const diversifiedRecipes = this.applyDiversityAlgorithm(recipes, box_size);
      
      return diversifiedRecipes.map(recipe => recipe.id);
    } catch (error) {
      console.error('Error generating smart blind box:', error);
      throw error;
    }
  }

  /**
   * 根据预算范围获取条件
   * @param {string} budgetRange - 预算范围
   * @returns {string} SQL条件
   */
  static getBudgetCondition(budgetRange) {
    const budgetMap = {
      'low': 'r.cooking_time <= 30',
      'medium': 'r.cooking_time BETWEEN 30 AND 60',
      'high': 'r.cooking_time > 60'
    };
    
    return budgetMap[budgetRange] || null;
  }

  /**
   * 应用多样性算法
   * @param {Array} recipes - 候选菜谱
   * @param {number} targetSize - 目标数量
   * @returns {Array} 多样化菜谱列表
   */
  static applyDiversityAlgorithm(recipes, targetSize) {
    if (recipes.length <= targetSize) {
      return recipes;
    }
    
    const selected = [];
    const remaining = [...recipes];
    
    // 确保难度多样性
    const difficultyGroups = {
      'easy': remaining.filter(r => r.difficulty === 'easy'),
      'medium': remaining.filter(r => r.difficulty === 'medium'),
      'hard': remaining.filter(r => r.difficulty === 'hard')
    };
    
    // 从每个难度组选择至少一个
    Object.values(difficultyGroups).forEach(group => {
      if (group.length > 0 && selected.length < targetSize) {
        const randomIndex = Math.floor(Math.random() * group.length);
        selected.push(group[randomIndex]);
      }
    });
    
    // 填充剩余位置
    while (selected.length < targetSize && remaining.length > 0) {
      const randomIndex = Math.floor(Math.random() * remaining.length);
      const candidate = remaining[randomIndex];
      
      if (!selected.find(s => s.id === candidate.id)) {
        selected.push(candidate);
      }
      
      remaining.splice(randomIndex, 1);
    }
    
    return selected;
  }

  /**
   * 开启盲盒中的菜谱
   * @param {number} boxId - 盲盒ID
   * @param {number} recipeId - 菜谱ID
   * @returns {Promise<Object>} 开启结果
   */
  static async openRecipe(boxId, recipeId) {
    try {
      const box = await this.findById(boxId);
      if (!box) {
        throw new Error('Blind box not found');
      }
      
      const recipeIds = box.recipe_ids || [];
      if (!recipeIds.includes(recipeId)) {
        throw new Error('Recipe not in this blind box');
      }
      
      const openedRecipes = box.opened_recipes || [];
      if (openedRecipes.includes(recipeId)) {
        throw new Error('Recipe already opened');
      }
      
      openedRecipes.push(recipeId);
      
      // 更新状态
      let newStatus = 'partially_opened';
      if (openedRecipes.length === recipeIds.length) {
        newStatus = 'fully_opened';
      }
      
      const query = `
        UPDATE recipe_blind_boxes
        SET opened_recipes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await db.query(query, [JSON.stringify(openedRecipes), newStatus, boxId]);
      
      // 获取打开的菜谱详情
      const recipeQuery = `
        SELECT r.*, u.nickname as creator_name
        FROM recipes r
        LEFT JOIN users u ON r.creator_id = u.id
        WHERE r.id = ?
      `;
      
      const recipeRows = await db.query(recipeQuery, [recipeId]);
      
      return {
        box_id: boxId,
        opened_recipe: recipeRows[0] || null,
        total_recipes: recipeIds.length,
        opened_count: openedRecipes.length,
        status: newStatus
      };
    } catch (error) {
      console.error('Error opening recipe:', error);
      throw error;
    }
  }

  /**
   * 获取可用的盲盒主题
   * @returns {Promise<Array>} 主题列表
   */
  static async getAvailableThemes() {
    try {
      const themes = [
        {
          id: 'seasonal',
          name: '时令美食',
          description: '根据当前季节推荐应季菜谱',
          icon: '🍃',
          color: '#4CAF50'
        },
        {
          id: 'quick',
          name: '快手菜',
          description: '30分钟内完成的简单菜谱',
          icon: '⚡',
          color: '#FF9800'
        },
        {
          id: 'comfort',
          name: '暖心菜',
          description: '温暖治愈的家常菜谱',
          icon: '❤️',
          color: '#E91E63'
        },
        {
          id: 'healthy',
          name: '健康轻食',
          description: '低卡路里的健康菜谱',
          icon: '🥗',
          color: '#8BC34A'
        },
        {
          id: 'exotic',
          name: '异域风情',
          description: '来自世界各地的特色菜谱',
          icon: '🌍',
          color: '#3F51B5'
        },
        {
          id: 'dessert',
          name: '甜蜜时光',
          description: '各种甜品和小食',
          icon: '🍰',
          color: '#E91E63'
        },
        {
          id: 'random',
          name: '随机惊喜',
          description: '完全随机的菜谱组合',
          icon: '🎲',
          color: '#9C27B0'
        }
      ];
      
      return themes;
    } catch (error) {
      console.error('Error getting available themes:', error);
      throw error;
    }
  }

  /**
   * 获取盲盒统计信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 统计信息
   */
  static async getStatistics(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_boxes,
          SUM(CASE WHEN status = 'fully_opened' THEN 1 ELSE 0 END) as fully_opened_boxes,
          SUM(CASE WHEN status = 'partially_opened' THEN 1 ELSE 0 END) as partially_opened_boxes,
          SUM(CASE WHEN status = 'generated' THEN 1 ELSE 0 END) as unopened_boxes,
          COUNT(DISTINCT theme) as unique_themes
        FROM recipe_blind_boxes
        WHERE user_id = ?
      `;
      
      const rows = await db.query(query, [userId]);
      
      return rows[0] || {
        total_boxes: 0,
        fully_opened_boxes: 0,
        partially_opened_boxes: 0,
        unopened_boxes: 0,
        unique_themes: 0
      };
    } catch (error) {
      console.error('Error getting blind box statistics:', error);
      throw error;
    }
  }

  /**
   * 删除盲盒
   * @param {number} boxId - 盲盒ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 删除结果
   */
  static async deleteBox(boxId, userId) {
    try {
      const query = `
        DELETE FROM recipe_blind_boxes
        WHERE id = ? AND user_id = ?
      `;
      
      const result = await db.query(query, [boxId, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting blind box:', error);
      throw error;
    }
  }
}

module.exports = RecipeBlindBox; 