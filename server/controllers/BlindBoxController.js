const RecipeBlindBox = require('../models/RecipeBlindBox');

class BlindBoxController {
  /**
   * 获取盲盒主题列表
   */
  static async getThemes(req, res) {
    try {
      const themes = await RecipeBlindBox.getAvailableThemes();
      
      res.json({
        success: true,
        data: themes,
        message: '获取盲盒主题列表成功'
      });
    } catch (error) {
      console.error('Error getting blind box themes:', error);
      res.status(500).json({
        success: false,
        message: '获取盲盒主题列表失败',
        error: error.message
      });
    }
  }

  /**
   * 生成智能盲盒
   */
  static async generateBlindBox(req, res) {
    try {
      const { user_id, theme, dietary_restrictions, budget_range, box_size } = req.body;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      // 生成智能盲盒
      const recipeIds = await RecipeBlindBox.generateSmartBlindBox({
        user_id,
        theme,
        dietary_restrictions,
        budget_range,
        box_size: box_size || 5
      });
      
      if (recipeIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: '根据您的条件没有找到合适的菜谱，请调整筛选条件'
        });
      }
      
      // 创建盲盒记录
      const blindBox = await RecipeBlindBox.create({
        user_id,
        theme,
        dietary_restrictions,
        budget_range,
        recipe_ids: recipeIds
      });
      
      res.json({
        success: true,
        data: blindBox,
        message: '盲盒生成成功'
      });
    } catch (error) {
      console.error('Error generating blind box:', error);
      res.status(500).json({
        success: false,
        message: '生成盲盒失败',
        error: error.message
      });
    }
  }

  /**
   * 获取用户盲盒列表
   */
  static async getUserBlindBoxes(req, res) {
    try {
      const { user_id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const offset = (page - 1) * limit;
      const blindBoxes = await RecipeBlindBox.findByUserId(user_id, limit, offset);
      
      res.json({
        success: true,
        data: blindBoxes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: blindBoxes.length
        },
        message: '获取用户盲盒列表成功'
      });
    } catch (error) {
      console.error('Error getting user blind boxes:', error);
      res.status(500).json({
        success: false,
        message: '获取用户盲盒列表失败',
        error: error.message
      });
    }
  }

  /**
   * 获取盲盒详情
   */
  static async getBlindBoxDetail(req, res) {
    try {
      const { box_id } = req.params;
      
      if (!box_id) {
        return res.status(400).json({
          success: false,
          message: '盲盒ID不能为空'
        });
      }
      
      const blindBox = await RecipeBlindBox.findById(box_id);
      
      if (!blindBox) {
        return res.status(404).json({
          success: false,
          message: '盲盒不存在'
        });
      }
      
      res.json({
        success: true,
        data: blindBox,
        message: '获取盲盒详情成功'
      });
    } catch (error) {
      console.error('Error getting blind box detail:', error);
      res.status(500).json({
        success: false,
        message: '获取盲盒详情失败',
        error: error.message
      });
    }
  }

  /**
   * 开启盲盒中的菜谱
   */
  static async openRecipe(req, res) {
    try {
      const { box_id } = req.params;
      const { recipe_id } = req.body;
      
      if (!box_id || !recipe_id) {
        return res.status(400).json({
          success: false,
          message: '盲盒ID和菜谱ID不能为空'
        });
      }
      
      const result = await RecipeBlindBox.openRecipe(box_id, recipe_id);
      
      res.json({
        success: true,
        data: result,
        message: '开启菜谱成功'
      });
    } catch (error) {
      console.error('Error opening recipe:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: '盲盒不存在'
        });
      }
      
      if (error.message.includes('not in this blind box')) {
        return res.status(400).json({
          success: false,
          message: '菜谱不在此盲盒中'
        });
      }
      
      if (error.message.includes('already opened')) {
        return res.status(400).json({
          success: false,
          message: '菜谱已经开启过了'
        });
      }
      
      res.status(500).json({
        success: false,
        message: '开启菜谱失败',
        error: error.message
      });
    }
  }

  /**
   * 获取盲盒统计信息
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
      
      const statistics = await RecipeBlindBox.getStatistics(user_id);
      
      res.json({
        success: true,
        data: statistics,
        message: '获取盲盒统计信息成功'
      });
    } catch (error) {
      console.error('Error getting blind box statistics:', error);
      res.status(500).json({
        success: false,
        message: '获取盲盒统计信息失败',
        error: error.message
      });
    }
  }

  /**
   * 删除盲盒
   */
  static async deleteBlindBox(req, res) {
    try {
      const { box_id } = req.params;
      const { user_id } = req.body;
      
      if (!box_id || !user_id) {
        return res.status(400).json({
          success: false,
          message: '盲盒ID和用户ID不能为空'
        });
      }
      
      const success = await RecipeBlindBox.deleteBox(box_id, user_id);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '盲盒不存在或无权限删除'
        });
      }
      
      res.json({
        success: true,
        message: '删除盲盒成功'
      });
    } catch (error) {
      console.error('Error deleting blind box:', error);
      res.status(500).json({
        success: false,
        message: '删除盲盒失败',
        error: error.message
      });
    }
  }

  /**
   * 预览盲盒生成结果
   */
  static async previewBlindBox(req, res) {
    try {
      const { user_id, theme, dietary_restrictions, budget_range, box_size } = req.body;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      // 生成预览结果，但不保存
      const recipeIds = await RecipeBlindBox.generateSmartBlindBox({
        user_id,
        theme,
        dietary_restrictions,
        budget_range,
        box_size: box_size || 5
      });
      
      if (recipeIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: '根据您的条件没有找到合适的菜谱，请调整筛选条件'
        });
      }
      
      // 获取菜谱基本信息用于预览
      const db = require('../database/connection');
      const query = `
        SELECT id, name, main_image, difficulty, cooking_time, average_rating
        FROM recipes
        WHERE id IN (${recipeIds.map(() => '?').join(', ')})
      `;
      
      const recipes = await db.query(query, recipeIds);
      
      res.json({
        success: true,
        data: {
          theme,
          dietary_restrictions,
          budget_range,
          box_size: recipeIds.length,
          recipe_preview: recipes.map(recipe => ({
            id: recipe.id,
            name: recipe.name,
            image: recipe.main_image,
            difficulty: recipe.difficulty,
            cooking_time: recipe.cooking_time,
            rating: recipe.average_rating
          }))
        },
        message: '盲盒预览生成成功'
      });
    } catch (error) {
      console.error('Error previewing blind box:', error);
      res.status(500).json({
        success: false,
        message: '预览盲盒失败',
        error: error.message
      });
    }
  }

  /**
   * 获取盲盒推荐设置
   */
  static async getRecommendedSettings(req, res) {
    try {
      const { user_id } = req.params;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      // 基于用户历史生成推荐设置
      const db = require('../database/connection');
      
      // 获取用户最常选择的主题
      const themeQuery = `
        SELECT theme, COUNT(*) as count
        FROM recipe_blind_boxes
        WHERE user_id = ?
        GROUP BY theme
        ORDER BY count DESC
        LIMIT 1
      `;
      
      const themeRows = await db.query(themeQuery, [user_id]);
      const preferredTheme = themeRows.length > 0 ? themeRows[0].theme : 'seasonal';
      
      // 获取用户的口味偏好
      const profileQuery = `
        SELECT dietary_restrictions, spice_level, flavor_preferences
        FROM user_taste_profiles
        WHERE user_id = ?
      `;
      
      const profileRows = await db.query(profileQuery, [user_id]);
      const tasteProfile = profileRows.length > 0 ? profileRows[0] : null;
      
      const recommendations = {
        theme: preferredTheme,
        dietary_restrictions: tasteProfile ? JSON.parse(tasteProfile.dietary_restrictions || '[]') : [],
        budget_range: 'medium',
        box_size: 5,
        spice_level: tasteProfile ? tasteProfile.spice_level : 'medium'
      };
      
      res.json({
        success: true,
        data: recommendations,
        message: '获取推荐设置成功'
      });
    } catch (error) {
      console.error('Error getting recommended settings:', error);
      res.status(500).json({
        success: false,
        message: '获取推荐设置失败',
        error: error.message
      });
    }
  }
}

module.exports = BlindBoxController; 