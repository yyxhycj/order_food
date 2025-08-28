const SmartReminder = require('../models/SmartReminder');

class ReminderController {
  /**
   * 创建新的提醒
   */
  static async createReminder(req, res) {
    try {
      const { user_id, recipe_id, plan_id, reminder_type, reminder_time, message } = req.body;
      
      if (!user_id || !reminder_type || !reminder_time || !message) {
        return res.status(400).json({
          success: false,
          message: '用户ID、提醒类型、提醒时间和提醒内容不能为空'
        });
      }
      
      const reminder = await SmartReminder.create({
        user_id,
        recipe_id,
        plan_id,
        reminder_type,
        reminder_time,
        message
      });
      
      res.json({
        success: true,
        data: reminder,
        message: '创建提醒成功'
      });
    } catch (error) {
      console.error('Error creating reminder:', error);
      res.status(500).json({
        success: false,
        message: '创建提醒失败',
        error: error.message
      });
    }
  }

  /**
   * 创建订单提醒
   */
  static async createOrderReminder(req, res) {
    try {
      const { order_id, customer_nickname, customer_id, order_items } = req.body;
      
      if (!order_id || !customer_nickname) {
        return res.status(400).json({
          success: false,
          message: '订单ID和客户昵称不能为空'
        });
      }
      
      const reminder = await SmartReminder.createOrderReminder({
        order_id,
        customer_nickname,
        customer_id,
        order_items
      });
      
      res.json({
        success: true,
        data: reminder,
        message: '创建订单提醒成功'
      });
    } catch (error) {
      console.error('Error creating order reminder:', error);
      res.status(500).json({
        success: false,
        message: '创建订单提醒失败',
        error: error.message
      });
    }
  }

  /**
   * 获取管理员提醒列表
   */
  static async getAdminReminders(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      
      const parsedLimit = parseInt(limit) || 20;
      const parsedPage = parseInt(page) || 1;
      const offset = (parsedPage - 1) * parsedLimit;
      
      const reminders = await SmartReminder.getAdminReminders(parsedLimit, offset);
      const unreadCount = await SmartReminder.getUnreadAdminCount();
      
      res.json({
        success: true,
        data: {
          reminders,
          unreadCount,
          currentPage: parsedPage,
          totalPages: Math.ceil(unreadCount / parsedLimit)
        },
        message: '获取管理员提醒列表成功'
      });
    } catch (error) {
      console.error('Error getting admin reminders:', error);
      res.status(500).json({
        success: false,
        message: '获取管理员提醒列表失败',
        error: error.message
      });
    }
  }

  /**
   * 获取未读提醒数量
   */
  static async getUnreadCount(req, res) {
    try {
      const count = await SmartReminder.getUnreadAdminCount();
      
      res.json({
        success: true,
        data: { count },
        message: '获取未读提醒数量成功'
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: '获取未读提醒数量失败',
        error: error.message
      });
    }
  }

  /**
   * 标记提醒为已读
   */
  static async markAsRead(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '无效的提醒ID'
        });
      }
      
      const success = await SmartReminder.markAsRead(parseInt(id));
      
      if (success) {
        res.json({
          success: true,
          message: '标记为已读成功'
        });
      } else {
        res.status(404).json({
          success: false,
          message: '提醒不存在'
        });
      }
    } catch (error) {
      console.error('Error marking reminder as read:', error);
      res.status(500).json({
        success: false,
        message: '标记已读失败',
        error: error.message
      });
    }
  }

  /**
   * 批量标记为已读
   */
  static async markMultipleAsRead(req, res) {
    try {
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'IDs数组不能为空'
        });
      }
      
      const count = await SmartReminder.markMultipleAsRead(ids);
      
      res.json({
        success: true,
        data: { count },
        message: `成功标记${count}条提醒为已读`
      });
    } catch (error) {
      console.error('Error marking multiple reminders as read:', error);
      res.status(500).json({
        success: false,
        message: '批量标记已读失败',
        error: error.message
      });
    }
  }

  /**
   * 获取用户提醒列表
   */
  static async getUserReminders(req, res) {
    try {
      const { user_id } = req.params;
      const { status, reminder_type, page = 1, limit = 20 } = req.query;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const offset = (page - 1) * limit;
      const reminders = await SmartReminder.findByUserId(user_id, {
        status,
        reminder_type,
        limit: parseInt(limit),
        offset
      });
      
      res.json({
        success: true,
        data: reminders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: reminders.length
        },
        message: '获取用户提醒列表成功'
      });
    } catch (error) {
      console.error('Error getting user reminders:', error);
      res.status(500).json({
        success: false,
        message: '获取用户提醒列表失败',
        error: error.message
      });
    }
  }

  /**
   * 获取即将到来的提醒
   */
  static async getUpcomingReminders(req, res) {
    try {
      const { user_id } = req.params;
      const { hours = 24 } = req.query;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const reminders = await SmartReminder.getUpcomingReminders(user_id, parseInt(hours));
      
      res.json({
        success: true,
        data: reminders,
        message: '获取即将到来的提醒成功'
      });
    } catch (error) {
      console.error('Error getting upcoming reminders:', error);
      res.status(500).json({
        success: false,
        message: '获取即将到来的提醒失败',
        error: error.message
      });
    }
  }

  /**
   * 智能生成菜谱提醒
   */
  static async generateRecipeReminders(req, res) {
    try {
      const { user_id, recipe_id, recipe_name, cooking_time, ingredients, steps } = req.body;
      
      if (!user_id || !recipe_id || !recipe_name) {
        return res.status(400).json({
          success: false,
          message: '用户ID、菜谱ID和菜谱名称不能为空'
        });
      }
      
      const recipeData = {
        recipe_id,
        name: recipe_name,
        cooking_time,
        ingredients,
        steps
      };
      
      const reminders = await SmartReminder.generateRecipeReminders(recipeData, user_id);
      
      res.json({
        success: true,
        data: reminders,
        message: '智能生成菜谱提醒成功'
      });
    } catch (error) {
      console.error('Error generating recipe reminders:', error);
      res.status(500).json({
        success: false,
        message: '生成菜谱提醒失败',
        error: error.message
      });
    }
  }

  /**
   * 标记提醒为已完成
   */
  static async markAsCompleted(req, res) {
    try {
      const { reminder_id } = req.params;
      const { user_id } = req.body;
      
      if (!reminder_id || !user_id) {
        return res.status(400).json({
          success: false,
          message: '提醒ID和用户ID不能为空'
        });
      }
      
      const success = await SmartReminder.markAsCompleted(reminder_id, user_id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '提醒不存在或无权限操作'
        });
      }
      
      res.json({
        success: true,
        message: '标记提醒为已完成成功'
      });
    } catch (error) {
      console.error('Error marking reminder as completed:', error);
      res.status(500).json({
        success: false,
        message: '标记提醒为已完成失败',
        error: error.message
      });
    }
  }

  /**
   * 取消提醒
   */
  static async cancelReminder(req, res) {
    try {
      const { reminder_id } = req.params;
      const { user_id } = req.body;
      
      if (!reminder_id || !user_id) {
        return res.status(400).json({
          success: false,
          message: '提醒ID和用户ID不能为空'
        });
      }
      
      const success = await SmartReminder.cancelReminder(reminder_id, user_id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '提醒不存在或无权限操作'
        });
      }
      
      res.json({
        success: true,
        message: '取消提醒成功'
      });
    } catch (error) {
      console.error('Error cancelling reminder:', error);
      res.status(500).json({
        success: false,
        message: '取消提醒失败',
        error: error.message
      });
    }
  }

  /**
   * 更新提醒时间
   */
  static async updateReminderTime(req, res) {
    try {
      const { reminder_id } = req.params;
      const { user_id, new_time } = req.body;
      
      if (!reminder_id || !user_id || !new_time) {
        return res.status(400).json({
          success: false,
          message: '提醒ID、用户ID和新时间不能为空'
        });
      }
      
      const success = await SmartReminder.updateReminderTime(reminder_id, user_id, new Date(new_time));
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '提醒不存在或无权限操作'
        });
      }
      
      res.json({
        success: true,
        message: '更新提醒时间成功'
      });
    } catch (error) {
      console.error('Error updating reminder time:', error);
      res.status(500).json({
        success: false,
        message: '更新提醒时间失败',
        error: error.message
      });
    }
  }

  /**
   * 获取提醒统计信息
   */
  static async getStatistics(req, res) {
    try {
      const { user_id } = req.params;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const statistics = await SmartReminder.getStatistics(user_id);
      
      res.json({
        success: true,
        data: statistics,
        message: '获取提醒统计信息成功'
      });
    } catch (error) {
      console.error('Error getting reminder statistics:', error);
      res.status(500).json({
        success: false,
        message: '获取提醒统计信息失败',
        error: error.message
      });
    }
  }

  /**
   * 获取提醒类型配置
   */
  static async getReminderTypes(req, res) {
    try {
      const types = await SmartReminder.getReminderTypes();
      
      res.json({
        success: true,
        data: types,
        message: '获取提醒类型配置成功'
      });
    } catch (error) {
      console.error('Error getting reminder types:', error);
      res.status(500).json({
        success: false,
        message: '获取提醒类型配置失败',
        error: error.message
      });
    }
  }

  /**
   * 删除提醒
   */
  static async deleteReminder(req, res) {
    try {
      const { reminder_id } = req.params;
      const { user_id } = req.body;
      
      if (!reminder_id || !user_id) {
        return res.status(400).json({
          success: false,
          message: '提醒ID和用户ID不能为空'
        });
      }
      
      const success = await SmartReminder.deleteReminder(reminder_id, user_id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '提醒不存在或无权限删除'
        });
      }
      
      res.json({
        success: true,
        message: '删除提醒成功'
      });
    } catch (error) {
      console.error('Error deleting reminder:', error);
      res.status(500).json({
        success: false,
        message: '删除提醒失败',
        error: error.message
      });
    }
  }

  /**
   * 获取待发送的提醒（系统内部使用）
   */
  static async getPendingReminders(req, res) {
    try {
      const { limit_minutes = 5 } = req.query;
      
      const reminders = await SmartReminder.getPendingReminders(parseInt(limit_minutes));
      
      res.json({
        success: true,
        data: reminders,
        message: '获取待发送提醒成功'
      });
    } catch (error) {
      console.error('Error getting pending reminders:', error);
      res.status(500).json({
        success: false,
        message: '获取待发送提醒失败',
        error: error.message
      });
    }
  }

  /**
   * 标记提醒为已发送（系统内部使用）
   */
  static async markAsSent(req, res) {
    try {
      const { reminder_id } = req.params;
      
      if (!reminder_id) {
        return res.status(400).json({
          success: false,
          message: '提醒ID不能为空'
        });
      }
      
      const success = await SmartReminder.markAsSent(reminder_id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '提醒不存在'
        });
      }
      
      res.json({
        success: true,
        message: '标记提醒为已发送成功'
      });
    } catch (error) {
      console.error('Error marking reminder as sent:', error);
      res.status(500).json({
        success: false,
        message: '标记提醒为已发送失败',
        error: error.message
      });
    }
  }

  /**
   * 批量处理提醒
   */
  static async batchProcessReminders(req, res) {
    try {
      const { user_id, action, reminder_ids } = req.body;
      
      if (!user_id || !action || !reminder_ids || !Array.isArray(reminder_ids)) {
        return res.status(400).json({
          success: false,
          message: '用户ID、操作类型和提醒ID列表不能为空'
        });
      }
      
      const results = [];
      
      for (const reminderId of reminder_ids) {
        try {
          let success = false;
          
          switch (action) {
            case 'complete':
              success = await SmartReminder.markAsCompleted(reminderId, user_id);
              break;
            case 'cancel':
              success = await SmartReminder.cancelReminder(reminderId, user_id);
              break;
            case 'delete':
              success = await SmartReminder.deleteReminder(reminderId, user_id);
              break;
            default:
              results.push({ reminder_id: reminderId, success: false, error: '不支持的操作类型' });
              continue;
          }
          
          results.push({ reminder_id: reminderId, success });
        } catch (error) {
          results.push({ reminder_id: reminderId, success: false, error: error.message });
        }
      }
      
      res.json({
        success: true,
        data: results,
        message: '批量处理提醒完成'
      });
    } catch (error) {
      console.error('Error batch processing reminders:', error);
      res.status(500).json({
        success: false,
        message: '批量处理提醒失败',
        error: error.message
      });
    }
  }

  /**
   * 清理过期提醒
   */
  static async cleanupExpiredReminders(req, res) {
    try {
      const { days = 30 } = req.query;
      
      const deletedCount = await SmartReminder.cleanupExpiredReminders(parseInt(days));
      
      res.json({
        success: true,
        data: { deleted_count: deletedCount },
        message: '清理过期提醒成功'
      });
    } catch (error) {
      console.error('Error cleaning up expired reminders:', error);
      res.status(500).json({
        success: false,
        message: '清理过期提醒失败',
        error: error.message
      });
    }
  }
}

module.exports = ReminderController; 