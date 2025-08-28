const db = require('../database/connection');

class SmartReminder {
  /**
   * 创建新的智能提醒
   * @param {Object} reminderData - 提醒数据
   * @returns {Promise<Object>} 创建的提醒信息
   */
  static async create(reminderData) {
    try {
      const { user_id, recipe_id, plan_id, reminder_type, reminder_time, message } = reminderData;
      
      const query = `
        INSERT INTO smart_reminders (user_id, recipe_id, plan_id, reminder_type, reminder_time, message)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const result = await db.query(query, [
        user_id,
        recipe_id || null,
        plan_id || null,
        reminder_type,
        reminder_time,
        message
      ]);
      
      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error creating smart reminder:', error);
      throw error;
    }
  }

  /**
   * 创建订单提醒
   * @param {Object} orderData - 订单数据
   * @returns {Promise<Object>} 创建的提醒信息
   */
  static async createOrderReminder(orderData) {
    try {
      const { order_id, customer_nickname, customer_id, order_items } = orderData;
      
      // 创建给管理员的新订单提醒
      const reminderData = {
        user_id: null, // 管理员提醒，不关联特定用户
        recipe_id: null,
        plan_id: null,
        reminder_type: 'new_order',
        reminder_time: new Date(),
        message: `收到新的请求！客户：${customer_nickname}，订单号：${order_id}`
      };
      
      const query = `
        INSERT INTO smart_reminders (user_id, recipe_id, plan_id, reminder_type, reminder_time, message, order_id, is_admin_reminder)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const result = await db.query(query, [
        reminderData.user_id,
        reminderData.recipe_id,
        reminderData.plan_id,
        reminderData.reminder_type,
        reminderData.reminder_time,
        reminderData.message,
        order_id,
        true
      ]);
      
      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error creating order reminder:', error);
      throw error;
    }
  }

  /**
   * 根据ID查找提醒
   * @param {number} id - 提醒ID
   * @returns {Promise<Object|null>} 提醒信息
   */
  static async findById(id) {
    try {
      const query = `
        SELECT sr.*, r.name as recipe_name, rp.name as plan_name, u.nickname
        FROM smart_reminders sr
        LEFT JOIN recipes r ON sr.recipe_id = r.id
        LEFT JOIN recipe_plans rp ON sr.plan_id = rp.id
        LEFT JOIN users u ON sr.user_id = u.id
        WHERE sr.id = ?
      `;
      
      const rows = await db.query(query, [id]);
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding smart reminder:', error);
      throw error;
    }
  }

  /**
   * 获取用户的提醒列表
   * @param {number} userId - 用户ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 提醒列表
   */
  static async findByUserId(userId, options = {}) {
    try {
      const { status, reminder_type, limit = 20, offset = 0 } = options;
      
      let query = `
        SELECT sr.*, r.name as recipe_name, rp.name as plan_name
        FROM smart_reminders sr
        LEFT JOIN recipes r ON sr.recipe_id = r.id
        LEFT JOIN recipe_plans rp ON sr.plan_id = rp.id
        WHERE sr.user_id = ?
      `;
      
      const queryParams = [userId];
      
      if (status) {
        query += ` AND sr.status = ?`;
        queryParams.push(status);
      }
      
      if (reminder_type) {
        query += ` AND sr.reminder_type = ?`;
        queryParams.push(reminder_type);
      }
      
      query += ` ORDER BY sr.reminder_time ASC LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);
      
      const rows = await db.query(query, queryParams);
      
      return rows;
    } catch (error) {
      console.error('Error finding user reminders:', error);
      throw error;
    }
  }

  /**
   * 获取即将到来的提醒
   * @param {number} userId - 用户ID
   * @param {number} hours - 未来几小时内
   * @returns {Promise<Array>} 即将到来的提醒
   */
  static async getUpcomingReminders(userId, hours = 24) {
    try {
      const query = `
        SELECT sr.*, r.name as recipe_name, rp.name as plan_name
        FROM smart_reminders sr
        LEFT JOIN recipes r ON sr.recipe_id = r.id
        LEFT JOIN recipe_plans rp ON sr.plan_id = rp.id
        WHERE sr.user_id = ? 
          AND sr.status = 'pending'
          AND sr.reminder_time BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? HOUR)
        ORDER BY sr.reminder_time ASC
      `;
      
      const rows = await db.query(query, [userId, hours]);
      
      return rows;
    } catch (error) {
      console.error('Error getting upcoming reminders:', error);
      throw error;
    }
  }

  /**
   * 获取待发送的提醒
   * @param {number} limitMinutes - 限制时间范围（分钟）
   * @returns {Promise<Array>} 待发送的提醒列表
   */
  static async getPendingReminders(limitMinutes = 5) {
    try {
      const query = `
        SELECT sr.*, r.name as recipe_name, rp.name as plan_name, u.nickname, u.openid
        FROM smart_reminders sr
        LEFT JOIN recipes r ON sr.recipe_id = r.id
        LEFT JOIN recipe_plans rp ON sr.plan_id = rp.id
        LEFT JOIN users u ON sr.user_id = u.id
        WHERE sr.status = 'pending' 
          AND sr.reminder_time <= DATE_ADD(NOW(), INTERVAL ? MINUTE)
          AND sr.reminder_time >= NOW()
        ORDER BY sr.reminder_time ASC
      `;
      
      const rows = await db.query(query, [limitMinutes]);
      
      return rows;
    } catch (error) {
      console.error('Error getting pending reminders:', error);
      throw error;
    }
  }

  /**
   * 智能生成菜谱相关提醒
   * @param {Object} recipeData - 菜谱数据
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 生成的提醒列表
   */
  static async generateRecipeReminders(recipeData, userId) {
    try {
      const { recipe_id, cooking_time, ingredients, steps } = recipeData;
      const reminders = [];
      
      // 解析食材信息
      let ingredientsList = [];
      if (typeof ingredients === 'string') {
        try {
          ingredientsList = JSON.parse(ingredients);
        } catch (e) {
          ingredientsList = ingredients.split(',').map(i => i.trim());
        }
      } else if (Array.isArray(ingredients)) {
        ingredientsList = ingredients;
      }
      
      // 生成购买提醒 (制作前1天)
      const buyReminder = {
        user_id: userId,
        recipe_id,
        reminder_type: 'buy',
        reminder_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后
        message: `别忘了购买制作"${recipeData.name}"的食材：${ingredientsList.slice(0, 3).join('、')}${ingredientsList.length > 3 ? '等' : ''}`
      };
      
      // 生成准备提醒 (制作前30分钟)
      const prepReminder = {
        user_id: userId,
        recipe_id,
        reminder_type: 'prep',
        reminder_time: new Date(Date.now() + 23.5 * 60 * 60 * 1000), // 23.5小时后
        message: `准备制作"${recipeData.name}"，预计需要${cooking_time}分钟，请提前准备食材`
      };
      
      // 生成烹饪提醒 (制作时间)
      const cookReminder = {
        user_id: userId,
        recipe_id,
        reminder_type: 'cook',
        reminder_time: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后
        message: `开始制作"${recipeData.name}"啦！按照步骤慢慢来，享受烹饪的乐趣`
      };
      
      // 检查是否需要解冻提醒
      const needsDefrost = ingredientsList.some(ingredient => 
        ingredient.includes('冻') || ingredient.includes('肉') || ingredient.includes('鱼')
      );
      
      if (needsDefrost) {
        const defrostReminder = {
          user_id: userId,
          recipe_id,
          reminder_type: 'defrost',
          reminder_time: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12小时后
          message: `记得提前解冻"${recipeData.name}"所需的冷冻食材哦`
        };
        reminders.push(defrostReminder);
      }
      
      // 检查是否需要腌制提醒
      let stepsList = [];
      if (typeof steps === 'string') {
        try {
          stepsList = JSON.parse(steps);
        } catch (e) {
          stepsList = steps.split('\n').filter(s => s.trim());
        }
      } else if (Array.isArray(steps)) {
        stepsList = steps;
      }
      
      const needsMarinate = stepsList.some(step => 
        step.includes('腌') || step.includes('拌') || step.includes('浸')
      );
      
      if (needsMarinate) {
        const marinateReminder = {
          user_id: userId,
          recipe_id,
          reminder_type: 'marinate',
          reminder_time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2小时后
          message: `别忘了腌制"${recipeData.name}"的食材，这样口感会更好`
        };
        reminders.push(marinateReminder);
      }
      
      reminders.push(buyReminder, prepReminder, cookReminder);
      
      // 批量创建提醒
      const createdReminders = [];
      for (const reminder of reminders) {
        const created = await this.create(reminder);
        createdReminders.push(created);
      }
      
      return createdReminders;
    } catch (error) {
      console.error('Error generating recipe reminders:', error);
      throw error;
    }
  }

  /**
   * 标记提醒为已发送
   * @param {number} reminderId - 提醒ID
   * @returns {Promise<boolean>} 更新结果
   */
  static async markAsSent(reminderId) {
    try {
      const query = `
        UPDATE smart_reminders
        SET status = 'sent', is_sent = TRUE, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const result = await db.query(query, [reminderId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error marking reminder as sent:', error);
      throw error;
    }
  }

  /**
   * 标记提醒为已完成
   * @param {number} reminderId - 提醒ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 更新结果
   */
  static async markAsCompleted(reminderId, userId) {
    try {
      const query = `
        UPDATE smart_reminders
        SET status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `;
      
      const result = await db.query(query, [reminderId, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error marking reminder as completed:', error);
      throw error;
    }
  }

  /**
   * 取消提醒
   * @param {number} reminderId - 提醒ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 更新结果
   */
  static async cancelReminder(reminderId, userId) {
    try {
      const query = `
        UPDATE smart_reminders
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `;
      
      const result = await db.query(query, [reminderId, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error cancelling reminder:', error);
      throw error;
    }
  }

  /**
   * 更新提醒时间
   * @param {number} reminderId - 提醒ID
   * @param {number} userId - 用户ID
   * @param {Date} newTime - 新的提醒时间
   * @returns {Promise<boolean>} 更新结果
   */
  static async updateReminderTime(reminderId, userId, newTime) {
    try {
      const query = `
        UPDATE smart_reminders
        SET reminder_time = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ? AND status = 'pending'
      `;
      
      const result = await db.query(query, [newTime, reminderId, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating reminder time:', error);
      throw error;
    }
  }

  /**
   * 获取提醒统计信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 统计信息
   */
  static async getStatistics(userId) {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_reminders,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reminders,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_reminders,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_reminders,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_reminders,
          COUNT(DISTINCT reminder_type) as reminder_types,
          COUNT(DISTINCT DATE(reminder_time)) as reminder_days
        FROM smart_reminders
        WHERE user_id = ?
      `;
      
      const rows = await db.query(query, [userId]);
      
      return rows.length > 0 ? rows[0] : {
        total_reminders: 0,
        pending_reminders: 0,
        sent_reminders: 0,
        completed_reminders: 0,
        cancelled_reminders: 0,
        reminder_types: 0,
        reminder_days: 0
      };
    } catch (error) {
      console.error('Error getting reminder statistics:', error);
      throw error;
    }
  }

  /**
   * 获取提醒类型配置
   * @returns {Promise<Array>} 提醒类型列表
   */
  static async getReminderTypes() {
    try {
      const types = [
        {
          id: 'prep',
          name: '准备提醒',
          description: '制作前的准备工作提醒',
          icon: '🧑‍🍳',
          color: '#FF9800'
        },
        {
          id: 'cook',
          name: '烹饪提醒',
          description: '开始烹饪的时间提醒',
          icon: '🍳',
          color: '#F44336'
        },
        {
          id: 'buy',
          name: '购买提醒',
          description: '购买食材的提醒',
          icon: '🛒',
          color: '#4CAF50'
        },
        {
          id: 'defrost',
          name: '解冻提醒',
          description: '解冻食材的提醒',
          icon: '🧊',
          color: '#2196F3'
        },
        {
          id: 'marinate',
          name: '腌制提醒',
          description: '腌制食材的提醒',
          icon: '🥄',
          color: '#9C27B0'
        }
      ];
      
      return types;
    } catch (error) {
      console.error('Error getting reminder types:', error);
      throw error;
    }
  }

  /**
   * 删除提醒
   * @param {number} reminderId - 提醒ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 删除结果
   */
  static async deleteReminder(reminderId, userId) {
    try {
      const query = `
        DELETE FROM smart_reminders
        WHERE id = ? AND user_id = ?
      `;
      
      const result = await db.query(query, [reminderId, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }

  /**
   * 批量删除过期提醒
   * @param {number} days - 多少天前的提醒
   * @returns {Promise<number>} 删除数量
   */
  static async cleanupExpiredReminders(days = 30) {
    try {
      const query = `
        DELETE FROM smart_reminders
        WHERE status IN ('completed', 'cancelled') 
          AND updated_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      `;
      
      const result = await db.query(query, [days]);
      return result.affectedRows;
    } catch (error) {
      console.error('Error cleaning up expired reminders:', error);
      throw error;
    }
  }
  /**
   * 获取管理员待处理提醒
   * @param {number} limit - 限制数量
   * @param {number} offset - 偏移量
   * @returns {Promise<Array>} 提醒列表
   */
  static async getAdminReminders(limit = 20, offset = 0) {
    try {
      const query = `
        SELECT sr.*, o.request_no, o.user_name, o.user_phone, o.preferred_time
        FROM smart_reminders sr
        LEFT JOIN orders o ON sr.order_id = o.id
        WHERE sr.is_admin_reminder = 1 AND sr.status != 'read'
        ORDER BY sr.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const rows = await db.query(query, [limit, offset]);
      
      return rows;
    } catch (error) {
      console.error('Error getting admin reminders:', error);
      throw error;
    }
  }

  /**
   * 获取未读管理员提醒数量
   * @returns {Promise<number>} 未读数量
   */
  static async getUnreadAdminCount() {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM smart_reminders
        WHERE is_admin_reminder = 1 AND status != 'read'
      `;
      
      const rows = await db.query(query);
      
      return rows.length > 0 ? rows[0].count : 0;
    } catch (error) {
      console.error('Error getting unread admin count:', error);
      throw error;
    }
  }

  /**
   * 标记提醒为已读
   * @param {number} id - 提醒ID
   * @returns {Promise<boolean>} 是否成功
   */
  static async markAsRead(id) {
    try {
      const query = `
        UPDATE smart_reminders 
        SET status = 'read', updated_at = NOW()
        WHERE id = ?
      `;
      
      const result = await db.query(query, [id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error marking reminder as read:', error);
      throw error;
    }
  }

  /**
   * 批量标记多个提醒为已读
   * @param {Array} ids - 提醒ID数组
   * @returns {Promise<number>} 成功数量
   */
  static async markMultipleAsRead(ids) {
    try {
      if (!ids || ids.length === 0) {
        return 0;
      }

      const placeholders = ids.map(() => '?').join(',');
      const query = `
        UPDATE smart_reminders 
        SET status = 'read', updated_at = NOW()
        WHERE id IN (${placeholders})
      `;
      
      const result = await db.query(query, ids);
      
      return result.affectedRows;
    } catch (error) {
      console.error('Error marking multiple reminders as read:', error);
      throw error;
    }
  }
}

module.exports = SmartReminder; 