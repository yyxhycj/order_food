const UserHomepageConfig = require('../models/UserHomepageConfig');

class HomepageController {
  /**
   * 获取用户主页配置
   */
  static async getUserConfig(req, res) {
    try {
      const { user_id } = req.params;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const config = await UserHomepageConfig.getUserConfig(user_id);
      
      res.json({
        success: true,
        data: config,
        message: '获取用户主页配置成功'
      });
    } catch (error) {
      console.error('Error getting user homepage config:', error);
      res.status(500).json({
        success: false,
        message: '获取用户主页配置失败',
        error: error.message
      });
    }
  }

  /**
   * 更新用户主页配置
   */
  static async updateUserConfig(req, res) {
    try {
      const { user_id } = req.params;
      const configData = req.body;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const updatedConfig = await UserHomepageConfig.updateConfig(user_id, configData);
      
      res.json({
        success: true,
        data: updatedConfig,
        message: '更新用户主页配置成功'
      });
    } catch (error) {
      console.error('Error updating user homepage config:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: '用户配置不存在'
        });
      }
      
      res.status(500).json({
        success: false,
        message: '更新用户主页配置失败',
        error: error.message
      });
    }
  }

  /**
   * 重置用户主页配置为默认
   */
  static async resetToDefault(req, res) {
    try {
      const { user_id } = req.params;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const defaultConfig = await UserHomepageConfig.resetToDefault(user_id);
      
      res.json({
        success: true,
        data: defaultConfig,
        message: '重置用户主页配置为默认成功'
      });
    } catch (error) {
      console.error('Error resetting user homepage config to default:', error);
      res.status(500).json({
        success: false,
        message: '重置用户主页配置失败',
        error: error.message
      });
    }
  }

  /**
   * 获取可用的主页模块
   */
  static async getAvailableSections(req, res) {
    try {
      const sections = await UserHomepageConfig.getAvailableSections();
      
      res.json({
        success: true,
        data: sections,
        message: '获取可用主页模块成功'
      });
    } catch (error) {
      console.error('Error getting available sections:', error);
      res.status(500).json({
        success: false,
        message: '获取可用主页模块失败',
        error: error.message
      });
    }
  }

  /**
   * 获取布局样式选项
   */
  static async getLayoutStyles(req, res) {
    try {
      const styles = await UserHomepageConfig.getLayoutStyles();
      
      res.json({
        success: true,
        data: styles,
        message: '获取布局样式选项成功'
      });
    } catch (error) {
      console.error('Error getting layout styles:', error);
      res.status(500).json({
        success: false,
        message: '获取布局样式选项失败',
        error: error.message
      });
    }
  }

  /**
   * 获取主题颜色选项
   */
  static async getThemeColors(req, res) {
    try {
      const colors = await UserHomepageConfig.getThemeColors();
      
      res.json({
        success: true,
        data: colors,
        message: '获取主题颜色选项成功'
      });
    } catch (error) {
      console.error('Error getting theme colors:', error);
      res.status(500).json({
        success: false,
        message: '获取主题颜色选项失败',
        error: error.message
      });
    }
  }

  /**
   * 获取用户个性化数据
   */
  static async getUserPersonalizedData(req, res) {
    try {
      const { user_id } = req.params;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const personalizedData = await UserHomepageConfig.getUserPersonalizedData(user_id);
      
      res.json({
        success: true,
        data: personalizedData,
        message: '获取用户个性化数据成功'
      });
    } catch (error) {
      console.error('Error getting user personalized data:', error);
      res.status(500).json({
        success: false,
        message: '获取用户个性化数据失败',
        error: error.message
      });
    }
  }

  /**
   * 更新模块显示状态
   */
  static async updateSectionVisibility(req, res) {
    try {
      const { user_id } = req.params;
      const { section_id, enabled } = req.body;
      
      if (!user_id || !section_id || typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: '用户ID、模块ID和显示状态不能为空'
        });
      }
      
      // 获取当前配置
      const currentConfig = await UserHomepageConfig.getUserConfig(user_id);
      const featuredSections = currentConfig.featured_sections || [];
      
      // 更新指定模块的显示状态
      const updatedSections = featuredSections.map(section => {
        if (section.id === section_id) {
          return { ...section, enabled };
        }
        return section;
      });
      
      // 如果模块不存在，添加新模块
      if (!featuredSections.find(s => s.id === section_id)) {
        updatedSections.push({
          id: section_id,
          enabled,
          order: featuredSections.length + 1
        });
      }
      
      const updatedConfig = await UserHomepageConfig.updateConfig(user_id, {
        featured_sections: updatedSections
      });
      
      res.json({
        success: true,
        data: updatedConfig,
        message: '更新模块显示状态成功'
      });
    } catch (error) {
      console.error('Error updating section visibility:', error);
      res.status(500).json({
        success: false,
        message: '更新模块显示状态失败',
        error: error.message
      });
    }
  }

  /**
   * 更新模块排序
   */
  static async updateSectionOrder(req, res) {
    try {
      const { user_id } = req.params;
      const { section_orders } = req.body;
      
      if (!user_id || !Array.isArray(section_orders)) {
        return res.status(400).json({
          success: false,
          message: '用户ID和模块排序数组不能为空'
        });
      }
      
      // 获取当前配置
      const currentConfig = await UserHomepageConfig.getUserConfig(user_id);
      const featuredSections = currentConfig.featured_sections || [];
      
      // 更新排序
      const updatedSections = featuredSections.map(section => {
        const orderInfo = section_orders.find(o => o.section_id === section.id);
        if (orderInfo) {
          return { ...section, order: orderInfo.order };
        }
        return section;
      });
      
      // 按order排序
      updatedSections.sort((a, b) => a.order - b.order);
      
      const updatedConfig = await UserHomepageConfig.updateConfig(user_id, {
        featured_sections: updatedSections
      });
      
      res.json({
        success: true,
        data: updatedConfig,
        message: '更新模块排序成功'
      });
    } catch (error) {
      console.error('Error updating section order:', error);
      res.status(500).json({
        success: false,
        message: '更新模块排序失败',
        error: error.message
      });
    }
  }

  /**
   * 上传背景图片
   */
  static async uploadBackground(req, res) {
    try {
      const { user_id } = req.params;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的背景图片'
        });
      }
      
      const backgroundImagePath = `/uploads/${req.file.filename}`;
      
      const updatedConfig = await UserHomepageConfig.updateConfig(user_id, {
        background_image: backgroundImagePath
      });
      
      res.json({
        success: true,
        data: {
          background_image: backgroundImagePath,
          config: updatedConfig
        },
        message: '上传背景图片成功'
      });
    } catch (error) {
      console.error('Error uploading background image:', error);
      res.status(500).json({
        success: false,
        message: '上传背景图片失败',
        error: error.message
      });
    }
  }

  /**
   * 上传vlog封面
   */
  static async uploadVlogCover(req, res) {
    try {
      const { user_id } = req.params;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '请选择要上传的vlog封面'
        });
      }
      
      const vlogCoverPath = `/uploads/${req.file.filename}`;
      
      const updatedConfig = await UserHomepageConfig.updateConfig(user_id, {
        vlog_cover_url: vlogCoverPath
      });
      
      res.json({
        success: true,
        data: {
          vlog_cover_url: vlogCoverPath,
          config: updatedConfig
        },
        message: '上传vlog封面成功'
      });
    } catch (error) {
      console.error('Error uploading vlog cover:', error);
      res.status(500).json({
        success: false,
        message: '上传vlog封面失败',
        error: error.message
      });
    }
  }

  /**
   * 预览主页配置
   */
  static async previewConfig(req, res) {
    try {
      const { user_id } = req.params;
      const previewData = req.body;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      // 基于预览数据生成预览效果
      const preview = {
        background_color: previewData.background_color || '#f8f9fa',
        layout_style: previewData.layout_style || 'card',
        featured_sections: previewData.featured_sections || [],
        theme_name: previewData.theme_name || '默认主题',
        preview_sections: {}
      };
      
      // 获取各个模块的预览数据
      if (previewData.featured_sections) {
        const enabledSections = previewData.featured_sections.filter(s => s.enabled);
        
        for (const section of enabledSections) {
          switch (section.id) {
            case 'recent_recipes':
              preview.preview_sections.recent_recipes = await UserHomepageConfig.getRecentRecipes(user_id, 3);
              break;
            case 'popular_recipes':
              preview.preview_sections.popular_recipes = await UserHomepageConfig.getPopularRecipes(3);
              break;
            case 'recommendations':
              preview.preview_sections.recommendations = await UserHomepageConfig.getRecommendations(user_id, 3);
              break;
            case 'reminders':
              preview.preview_sections.reminders = await UserHomepageConfig.getUpcomingReminders(user_id, 3);
              break;
            default:
              break;
          }
        }
      }
      
      res.json({
        success: true,
        data: preview,
        message: '生成主页配置预览成功'
      });
    } catch (error) {
      console.error('Error previewing config:', error);
      res.status(500).json({
        success: false,
        message: '生成主页配置预览失败',
        error: error.message
      });
    }
  }

  /**
   * 获取主页配置模板
   */
  static async getConfigTemplates(req, res) {
    try {
      const templates = [
        {
          id: 'minimal',
          name: '简约风格',
          description: '简洁明了的布局，突出重点内容',
          preview_image: '/images/templates/minimal.png',
          config: {
            background_color: '#ffffff',
            layout_style: 'list',
            featured_sections: [
              { id: 'recent_recipes', enabled: true, order: 1 },
              { id: 'recommendations', enabled: true, order: 2 },
              { id: 'reminders', enabled: true, order: 3 }
            ]
          }
        },
        {
          id: 'colorful',
          name: '多彩风格',
          description: '丰富多彩的设计，展示更多内容',
          preview_image: '/images/templates/colorful.png',
          config: {
            background_color: '#f0f8ff',
            layout_style: 'card',
            featured_sections: [
              { id: 'recent_recipes', enabled: true, order: 1 },
              { id: 'popular_recipes', enabled: true, order: 2 },
              { id: 'recommendations', enabled: true, order: 3 },
              { id: 'achievements', enabled: true, order: 4 },
              { id: 'blind_boxes', enabled: true, order: 5 }
            ]
          }
        },
        {
          id: 'professional',
          name: '专业风格',
          description: '适合专业厨师和美食博主',
          preview_image: '/images/templates/professional.png',
          config: {
            background_color: '#2d3748',
            layout_style: 'grid',
            featured_sections: [
              { id: 'cooking_vlog', enabled: true, order: 1 },
              { id: 'recent_recipes', enabled: true, order: 2 },
              { id: 'achievements', enabled: true, order: 3 },
              { id: 'social_feed', enabled: true, order: 4 }
            ]
          }
        }
      ];
      
      res.json({
        success: true,
        data: templates,
        message: '获取主页配置模板成功'
      });
    } catch (error) {
      console.error('Error getting config templates:', error);
      res.status(500).json({
        success: false,
        message: '获取主页配置模板失败',
        error: error.message
      });
    }
  }

  /**
   * 应用配置模板
   */
  static async applyTemplate(req, res) {
    try {
      const { user_id } = req.params;
      const { template_id } = req.body;
      
      if (!user_id || !template_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID和模板ID不能为空'
        });
      }
      
      // 获取模板配置
      const templates = await this.getConfigTemplates({ query: {} }, { json: () => {} });
      const template = templates.data?.find(t => t.id === template_id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: '配置模板不存在'
        });
      }
      
      const updatedConfig = await UserHomepageConfig.updateConfig(user_id, template.config);
      
      res.json({
        success: true,
        data: updatedConfig,
        message: '应用配置模板成功'
      });
    } catch (error) {
      console.error('Error applying template:', error);
      res.status(500).json({
        success: false,
        message: '应用配置模板失败',
        error: error.message
      });
    }
  }
}

module.exports = HomepageController; 