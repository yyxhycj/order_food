const db = require('../database/connection');

class UserHomepageConfig {
  /**
   * 获取用户主页配置
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 主页配置
   */
  static async getUserConfig(userId) {
    try {
      const query = `
        SELECT uhc.*, u.nickname, u.avatar
        FROM user_homepage_configs uhc
        LEFT JOIN users u ON uhc.user_id = u.id
        WHERE uhc.user_id = ?
      `;
      
      const rows = await db.query(query, [userId]);
      
      if (rows.length === 0) {
        // 如果没有配置，创建默认配置
        return await this.createDefaultConfig(userId);
      }
      
      const config = rows[0];
      
      // 解析JSON字段
      if (config.featured_sections) {
        config.featured_sections = JSON.parse(config.featured_sections);
      }
      if (config.section_priorities) {
        config.section_priorities = JSON.parse(config.section_priorities);
      }
      
      return config;
    } catch (error) {
      console.error('Error getting user homepage config:', error);
      throw error;
    }
  }

  /**
   * 创建默认主页配置
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 默认配置
   */
  static async createDefaultConfig(userId) {
    try {
      const defaultConfig = {
        user_id: userId,
        background_color: '#f8f9fa',
        layout_style: 'card',
        featured_sections: JSON.stringify([
          { id: 'recent_recipes', enabled: true, order: 1 },
          { id: 'popular_recipes', enabled: true, order: 2 },
          { id: 'recommendations', enabled: true, order: 3 },
          { id: 'cooking_plans', enabled: true, order: 4 },
          { id: 'achievements', enabled: true, order: 5 }
        ]),
        section_priorities: JSON.stringify({
          recent_recipes: 5,
          popular_recipes: 4,
          recommendations: 5,
          cooking_plans: 3,
          achievements: 2,
          blind_boxes: 3,
          reminders: 4
        }),
        show_cooking_vlog: false
      };
      
      const query = `
        INSERT INTO user_homepage_configs (user_id, background_color, layout_style, featured_sections, section_priorities, show_cooking_vlog)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.query(query, [
        defaultConfig.user_id,
        defaultConfig.background_color,
        defaultConfig.layout_style,
        defaultConfig.featured_sections,
        defaultConfig.section_priorities,
        defaultConfig.show_cooking_vlog
      ]);
      
      return await this.getUserConfig(userId);
    } catch (error) {
      console.error('Error creating default homepage config:', error);
      throw error;
    }
  }

  /**
   * 更新主页配置
   * @param {number} userId - 用户ID
   * @param {Object} configData - 配置数据
   * @returns {Promise<Object>} 更新后的配置
   */
  static async updateConfig(userId, configData) {
    try {
      const {
        background_image,
        background_color,
        layout_style,
        featured_sections,
        section_priorities,
        show_cooking_vlog,
        vlog_cover_url
      } = configData;
      
      const query = `
        UPDATE user_homepage_configs
        SET 
          background_image = COALESCE(?, background_image),
          background_color = COALESCE(?, background_color),
          layout_style = COALESCE(?, layout_style),
          featured_sections = COALESCE(?, featured_sections),
          section_priorities = COALESCE(?, section_priorities),
          show_cooking_vlog = COALESCE(?, show_cooking_vlog),
          vlog_cover_url = COALESCE(?, vlog_cover_url),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `;
      
      const [result] = await db.query(query, [
        background_image,
        background_color,
        layout_style,
        featured_sections ? JSON.stringify(featured_sections) : null,
        section_priorities ? JSON.stringify(section_priorities) : null,
        show_cooking_vlog,
        vlog_cover_url,
        userId
      ]);
      
      if (result.affectedRows === 0) {
        throw new Error('Config not found or no changes made');
      }
      
      return await this.getUserConfig(userId);
    } catch (error) {
      console.error('Error updating homepage config:', error);
      throw error;
    }
  }

  /**
   * 重置为默认配置
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 重置后的配置
   */
  static async resetToDefault(userId) {
    try {
      // 删除现有配置
      const deleteQuery = `DELETE FROM user_homepage_configs WHERE user_id = ?`;
      await db.query(deleteQuery, [userId]);
      
      // 创建默认配置
      return await this.createDefaultConfig(userId);
    } catch (error) {
      console.error('Error resetting homepage config to default:', error);
      throw error;
    }
  }

  /**
   * 获取可用的主页模块
   * @returns {Promise<Array>} 模块列表
   */
  static async getAvailableSections() {
    try {
      const sections = [
        {
          id: 'recent_recipes',
          name: '最近浏览',
          description: '显示最近浏览的菜谱',
          icon: '📖',
          color: '#2196F3',
          default_enabled: true,
          customizable: true
        },
        {
          id: 'popular_recipes',
          name: '热门菜谱',
          description: '显示热门和推荐菜谱',
          icon: '🔥',
          color: '#FF5722',
          default_enabled: true,
          customizable: true
        },
        {
          id: 'recommendations',
          name: '个性化推荐',
          description: '基于用户喜好的智能推荐',
          icon: '✨',
          color: '#9C27B0',
          default_enabled: true,
          customizable: true
        },
        {
          id: 'cooking_plans',
          name: '烹饪计划',
          description: '显示用户的烹饪计划和进度',
          icon: '📅',
          color: '#4CAF50',
          default_enabled: true,
          customizable: true
        },
        {
          id: 'achievements',
          name: '成就徽章',
          description: '显示用户获得的成就和等级',
          icon: '🏆',
          color: '#FFC107',
          default_enabled: true,
          customizable: true
        },
        {
          id: 'blind_boxes',
          name: '盲盒惊喜',
          description: '显示盲盒历史和新的盲盒推荐',
          icon: '🎁',
          color: '#E91E63',
          default_enabled: false,
          customizable: true
        },
        {
          id: 'reminders',
          name: '智能提醒',
          description: '显示即将到来的烹饪提醒',
          icon: '⏰',
          color: '#FF9800',
          default_enabled: true,
          customizable: true
        },
        {
          id: 'social_feed',
          name: '社交动态',
          description: '显示关注用户的最新动态',
          icon: '👥',
          color: '#795548',
          default_enabled: false,
          customizable: true
        },
        {
          id: 'seasonal_special',
          name: '时令特色',
          description: '显示季节性菜谱和活动',
          icon: '🌸',
          color: '#607D8B',
          default_enabled: false,
          customizable: true
        },
        {
          id: 'cooking_vlog',
          name: '烹饪Vlog',
          description: '显示用户的烹饪视频记录',
          icon: '📹',
          color: '#3F51B5',
          default_enabled: false,
          customizable: true
        }
      ];
      
      return sections;
    } catch (error) {
      console.error('Error getting available sections:', error);
      throw error;
    }
  }

  /**
   * 获取布局样式选项
   * @returns {Promise<Array>} 布局样式列表
   */
  static async getLayoutStyles() {
    try {
      const styles = [
        {
          id: 'card',
          name: '卡片式',
          description: '经典的卡片式布局，适合大多数用户',
          preview_image: '/images/layouts/card.png',
          features: ['响应式', '简洁', '易读'],
          default: true
        },
        {
          id: 'grid',
          name: '网格式',
          description: '网格式布局，信息密度高',
          preview_image: '/images/layouts/grid.png',
          features: ['紧凑', '高效', '信息丰富'],
          default: false
        },
        {
          id: 'list',
          name: '列表式',
          description: '简单的列表布局，适合快速浏览',
          preview_image: '/images/layouts/list.png',
          features: ['简洁', '快速', '直观'],
          default: false
        }
      ];
      
      return styles;
    } catch (error) {
      console.error('Error getting layout styles:', error);
      throw error;
    }
  }

  /**
   * 获取主题颜色选项
   * @returns {Promise<Array>} 主题颜色列表
   */
  static async getThemeColors() {
    try {
      const colors = [
        {
          id: 'default',
          name: '默认',
          primary: '#f8f9fa',
          secondary: '#e9ecef',
          accent: '#007bff',
          text: '#333333'
        },
        {
          id: 'warm',
          name: '暖色调',
          primary: '#fff5f5',
          secondary: '#fed7d7',
          accent: '#e53e3e',
          text: '#2d3748'
        },
        {
          id: 'cool',
          name: '冷色调',
          primary: '#f0f8ff',
          secondary: '#bee3f8',
          accent: '#3182ce',
          text: '#2d3748'
        },
        {
          id: 'nature',
          name: '自然',
          primary: '#f0fff4',
          secondary: '#c6f6d5',
          accent: '#38a169',
          text: '#2d3748'
        },
        {
          id: 'sunset',
          name: '日落',
          primary: '#fffaf0',
          secondary: '#feebc8',
          accent: '#dd6b20',
          text: '#2d3748'
        },
        {
          id: 'ocean',
          name: '海洋',
          primary: '#f0fdff',
          secondary: '#c4f1f9',
          accent: '#00a3c4',
          text: '#2d3748'
        },
        {
          id: 'dark',
          name: '深色',
          primary: '#2d3748',
          secondary: '#4a5568',
          accent: '#63b3ed',
          text: '#f7fafc'
        }
      ];
      
      return colors;
    } catch (error) {
      console.error('Error getting theme colors:', error);
      throw error;
    }
  }

  /**
   * 获取用户个性化数据
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 个性化数据
   */
  static async getUserPersonalizedData(userId) {
    try {
      const config = await this.getUserConfig(userId);
      
      // 根据配置获取相应的数据
      const personalizedData = {
        config: config,
        sections: {}
      };
      
      if (config.featured_sections) {
        const enabledSections = config.featured_sections.filter(s => s.enabled);
        
        for (const section of enabledSections) {
          switch (section.id) {
            case 'recent_recipes':
              personalizedData.sections.recent_recipes = await this.getRecentRecipes(userId, 5);
              break;
            case 'popular_recipes':
              personalizedData.sections.popular_recipes = await this.getPopularRecipes(5);
              break;
            case 'recommendations':
              personalizedData.sections.recommendations = await this.getRecommendations(userId, 5);
              break;
            case 'cooking_plans':
              personalizedData.sections.cooking_plans = await this.getCookingPlans(userId, 3);
              break;
            case 'achievements':
              personalizedData.sections.achievements = await this.getAchievements(userId);
              break;
            case 'blind_boxes':
              personalizedData.sections.blind_boxes = await this.getBlindBoxes(userId, 3);
              break;
            case 'reminders':
              personalizedData.sections.reminders = await this.getUpcomingReminders(userId, 5);
              break;
            default:
              break;
          }
        }
      }
      
      return personalizedData;
    } catch (error) {
      console.error('Error getting user personalized data:', error);
      throw error;
    }
  }

  /**
   * 获取用户最近浏览的菜谱
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 最近浏览的菜谱
   */
  static async getRecentRecipes(userId, limit = 5) {
    try {
      // 这里应该从浏览历史表获取，暂时使用模拟数据
      const query = `
        SELECT r.id, r.name, r.main_image, r.cooking_time, r.difficulty, r.average_rating
        FROM recipes r
        WHERE r.status = 'active'
        ORDER BY r.created_at DESC
        LIMIT ?
      `;
      
      const [rows] = await db.query(query, [limit]);
      return rows;
    } catch (error) {
      console.error('Error getting recent recipes:', error);
      return [];
    }
  }

  /**
   * 获取热门菜谱
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 热门菜谱
   */
  static async getPopularRecipes(limit = 5) {
    try {
      const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 5));
      
      const query = `
        SELECT r.id, r.name, r.main_image, r.cooking_time, r.difficulty, r.average_rating, r.view_count
        FROM recipes r
        WHERE r.status = ?
        ORDER BY r.view_count DESC, r.like_count DESC
        LIMIT ${validLimit}
      `;
      
      const [rows] = await db.query(query, ['active']);
      return rows;
    } catch (error) {
      console.error('Error getting popular recipes:', error);
      return [];
    }
  }

  /**
   * 获取个性化推荐
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 推荐菜谱
   */
  static async getRecommendations(userId, limit = 5) {
    try {
      const validLimit = Math.max(1, Math.min(100, parseInt(limit) || 5));
      
      // 这里应该调用推荐算法，暂时使用模拟数据
      const query = `
        SELECT r.id, r.name, r.main_image, r.cooking_time, r.difficulty, r.average_rating
        FROM recipes r
        WHERE r.status = ?
        ORDER BY RAND()
        LIMIT ${validLimit}
      `;
      
      const [rows] = await db.query(query, ['active']);
      return rows;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  /**
   * 获取烹饪计划
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 烹饪计划
   */
  static async getCookingPlans(userId, limit = 3) {
    try {
      // 这里应该从计划表获取，暂时返回空数组
      return [];
    } catch (error) {
      console.error('Error getting cooking plans:', error);
      return [];
    }
  }

  /**
   * 获取用户成就
   * @param {number} userId - 用户ID
   * @returns {Promise<Array>} 成就列表
   */
  static async getAchievements(userId) {
    try {
      // 这里应该从成就表获取，暂时使用模拟数据
      const achievements = [
        { id: 1, name: '初级厨师', description: '创建第一个菜谱', icon: '👨‍🍳', earned: true },
        { id: 2, name: '美食家', description: '收藏10个菜谱', icon: '😋', earned: false },
        { id: 3, name: '分享达人', description: '分享5个菜谱', icon: '📤', earned: false }
      ];
      
      return achievements;
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  }

  /**
   * 获取盲盒信息
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 盲盒列表
   */
  static async getBlindBoxes(userId, limit = 3) {
    try {
      const query = `
        SELECT bb.id, bb.theme, bb.status, bb.created_at
        FROM recipe_blind_boxes bb
        WHERE bb.user_id = ?
        ORDER BY bb.created_at DESC
        LIMIT ?
      `;
      
      const [rows] = await db.query(query, [userId, limit]);
      return rows;
    } catch (error) {
      console.error('Error getting blind boxes:', error);
      return [];
    }
  }

  /**
   * 获取即将到来的提醒
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制数量
   * @returns {Promise<Array>} 提醒列表
   */
  static async getUpcomingReminders(userId, limit = 5) {
    try {
      const query = `
        SELECT sr.id, sr.reminder_type, sr.reminder_time, sr.message, r.name as recipe_name
        FROM smart_reminders sr
        LEFT JOIN recipes r ON sr.recipe_id = r.id
        WHERE sr.user_id = ? AND sr.status = 'pending'
          AND sr.reminder_time > NOW()
        ORDER BY sr.reminder_time ASC
        LIMIT ?
      `;
      
      const [rows] = await db.query(query, [userId, limit]);
      return rows;
    } catch (error) {
      console.error('Error getting upcoming reminders:', error);
      return [];
    }
  }
}

module.exports = UserHomepageConfig; 