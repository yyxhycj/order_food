const RecipePlan = require('../models/RecipePlan');
const UserPlanFollow = require('../models/UserPlanFollow');
const Joi = require('joi');

class RecipePlanController {
  // 获取菜谱计划列表
  static async getPlans(req, res) {
    try {
      const { page = 1, limit = 10, creator_id, difficulty_level, search, 
              sort_by = 'created_at', sort_order = 'DESC' } = req.query;
      
      const plans = await RecipePlan.getList({
        page: parseInt(page),
        limit: parseInt(limit),
        creator_id: creator_id ? parseInt(creator_id) : undefined,
        difficulty_level,
        search,
        sort_by,
        sort_order
      });
      
      res.json({
        success: true,
        data: plans,
        message: '获取菜谱计划列表成功'
      });
    } catch (error) {
      console.error('获取菜谱计划列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取菜谱计划列表失败'
      });
    }
  }

  // 获取菜谱计划详情
  static async getPlan(req, res) {
    try {
      const { id } = req.params;
      
      const plan = await RecipePlan.getById(id);
      
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: '菜谱计划不存在'
        });
      }
      
      res.json({
        success: true,
        data: plan,
        message: '获取菜谱计划详情成功'
      });
    } catch (error) {
      console.error('获取菜谱计划详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取菜谱计划详情失败'
      });
    }
  }

  // 创建菜谱计划
  static async createPlan(req, res) {
    try {
      const schema = Joi.object({
        name: Joi.string().required().max(100),
        description: Joi.string().allow(''),
        duration_days: Joi.number().integer().min(1).max(365).required(),
        target_goal: Joi.string().max(100),
        difficulty_level: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
        recipes_per_day: Joi.number().integer().min(1).max(10).default(3)
      });
      
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const planId = await RecipePlan.create({
        ...value,
        creator_id: req.user?.id || 1 // 临时使用默认用户ID
      });
      
      res.json({
        success: true,
        data: { id: planId },
        message: '菜谱计划创建成功'
      });
    } catch (error) {
      console.error('创建菜谱计划失败:', error);
      res.status(500).json({
        success: false,
        message: '创建菜谱计划失败'
      });
    }
  }

  // 更新菜谱计划
  static async updatePlan(req, res) {
    try {
      const { id } = req.params;
      
      const schema = Joi.object({
        name: Joi.string().max(100),
        description: Joi.string().allow(''),
        duration_days: Joi.number().integer().min(1).max(365),
        target_goal: Joi.string().max(100),
        difficulty_level: Joi.string().valid('easy', 'medium', 'hard'),
        recipes_per_day: Joi.number().integer().min(1).max(10)
      });
      
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const updated = await RecipePlan.update(id, value);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: '菜谱计划不存在'
        });
      }
      
      res.json({
        success: true,
        message: '菜谱计划更新成功'
      });
    } catch (error) {
      console.error('更新菜谱计划失败:', error);
      res.status(500).json({
        success: false,
        message: '更新菜谱计划失败'
      });
    }
  }

  // 删除菜谱计划
  static async deletePlan(req, res) {
    try {
      const { id } = req.params;
      
      const deleted = await RecipePlan.delete(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: '菜谱计划不存在'
        });
      }
      
      res.json({
        success: true,
        message: '菜谱计划删除成功'
      });
    } catch (error) {
      console.error('删除菜谱计划失败:', error);
      res.status(500).json({
        success: false,
        message: '删除菜谱计划失败'
      });
    }
  }

  // 更新计划状态
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const schema = Joi.object({
        status: Joi.string().valid('active', 'inactive', 'draft').required()
      });
      
      const { error } = schema.validate({ status });
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const updated = await RecipePlan.updateStatus(id, status);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: '菜谱计划不存在'
        });
      }
      
      res.json({
        success: true,
        message: '计划状态更新成功'
      });
    } catch (error) {
      console.error('更新计划状态失败:', error);
      res.status(500).json({
        success: false,
        message: '更新计划状态失败'
      });
    }
  }

  // 向计划添加菜谱
  static async addRecipe(req, res) {
    try {
      const { id } = req.params;
      
      const schema = Joi.object({
        recipe_id: Joi.number().integer().required(),
        day_number: Joi.number().integer().min(1).required(),
        meal_type: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').required(),
        sort_order: Joi.number().integer().min(0).default(0)
      });
      
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const recipeId = await RecipePlan.addRecipe(id, value);
      
      res.json({
        success: true,
        data: { id: recipeId },
        message: '菜谱添加成功'
      });
    } catch (error) {
      console.error('添加菜谱失败:', error);
      res.status(500).json({
        success: false,
        message: '添加菜谱失败'
      });
    }
  }

  // 从计划移除菜谱
  static async removeRecipe(req, res) {
    try {
      const { id } = req.params;
      const { recipe_id, day_number, meal_type } = req.body;
      
      const schema = Joi.object({
        recipe_id: Joi.number().integer().required(),
        day_number: Joi.number().integer().min(1).required(),
        meal_type: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').required()
      });
      
      const { error } = schema.validate({ recipe_id, day_number, meal_type });
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const removed = await RecipePlan.removeRecipe(id, recipe_id, day_number, meal_type);
      
      if (!removed) {
        return res.status(404).json({
          success: false,
          message: '菜谱不存在或已移除'
        });
      }
      
      res.json({
        success: true,
        message: '菜谱移除成功'
      });
    } catch (error) {
      console.error('移除菜谱失败:', error);
      res.status(500).json({
        success: false,
        message: '移除菜谱失败'
      });
    }
  }

  // 获取计划统计信息
  static async getStats(req, res) {
    try {
      const { id } = req.params;
      
      const stats = await RecipePlan.getStats(id);
      
      res.json({
        success: true,
        data: stats,
        message: '获取计划统计成功'
      });
    } catch (error) {
      console.error('获取计划统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取计划统计失败'
      });
    }
  }

  // 获取热门计划
  static async getTrending(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      const plans = await RecipePlan.getTrending(parseInt(limit));
      
      res.json({
        success: true,
        data: plans,
        message: '获取热门计划成功'
      });
    } catch (error) {
      console.error('获取热门计划失败:', error);
      res.status(500).json({
        success: false,
        message: '获取热门计划失败'
      });
    }
  }

  // 获取推荐计划
  static async getRecommended(req, res) {
    try {
      const { limit = 10 } = req.query;
      const userId = req.user?.id || 1; // 临时使用默认用户ID
      
      const plans = await RecipePlan.getRecommended(userId, parseInt(limit));
      
      res.json({
        success: true,
        data: plans,
        message: '获取推荐计划成功'
      });
    } catch (error) {
      console.error('获取推荐计划失败:', error);
      res.status(500).json({
        success: false,
        message: '获取推荐计划失败'
      });
    }
  }

  // 跟随计划
  static async followPlan(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 1; // 临时使用默认用户ID
      
      const result = await UserPlanFollow.follow(userId, id);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
      
      res.json({
        success: true,
        data: { id: result.id },
        message: '跟随计划成功'
      });
    } catch (error) {
      console.error('跟随计划失败:', error);
      res.status(500).json({
        success: false,
        message: '跟随计划失败'
      });
    }
  }

  // 取消跟随计划
  static async unfollowPlan(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 1; // 临时使用默认用户ID
      
      const result = await UserPlanFollow.unfollow(userId, id);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
      
      res.json({
        success: true,
        message: '取消跟随成功'
      });
    } catch (error) {
      console.error('取消跟随失败:', error);
      res.status(500).json({
        success: false,
        message: '取消跟随失败'
      });
    }
  }

  // 获取计划跟随者
  static async getFollowers(req, res) {
    try {
      const { id } = req.params;
      const { limit = 10 } = req.query;
      
      const followers = await RecipePlan.getFollowers(id, parseInt(limit));
      
      res.json({
        success: true,
        data: followers,
        message: '获取跟随者成功'
      });
    } catch (error) {
      console.error('获取跟随者失败:', error);
      res.status(500).json({
        success: false,
        message: '获取跟随者失败'
      });
    }
  }

  // 获取计划跟随统计
  static async getFollowStats(req, res) {
    try {
      const { id } = req.params;
      
      const stats = await UserPlanFollow.getPlanFollowStats(id);
      
      res.json({
        success: true,
        data: stats,
        message: '获取跟随统计成功'
      });
    } catch (error) {
      console.error('获取跟随统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取跟随统计失败'
      });
    }
  }

  // 更新计划进度
  static async updateProgress(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 1; // 临时使用默认用户ID
      
      const schema = Joi.object({
        current_day: Joi.number().integer().min(1).required(),
        completed_recipes: Joi.array().items(Joi.object({
          recipe_id: Joi.number().integer().required(),
          day_number: Joi.number().integer().required(),
          meal_type: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').required(),
          completed_at: Joi.string().isoDate().required()
        })).default([]),
        notes: Joi.string().allow('')
      });
      
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const updated = await UserPlanFollow.updateProgress(userId, id, value);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: '计划跟随记录不存在'
        });
      }
      
      res.json({
        success: true,
        message: '进度更新成功'
      });
    } catch (error) {
      console.error('更新进度失败:', error);
      res.status(500).json({
        success: false,
        message: '更新进度失败'
      });
    }
  }

  // 标记菜谱完成
  static async markRecipeCompleted(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 1; // 临时使用默认用户ID
      
      const schema = Joi.object({
        recipe_id: Joi.number().integer().required(),
        day_number: Joi.number().integer().min(1).required(),
        meal_type: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').required()
      });
      
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const { recipe_id, day_number, meal_type } = value;
      
      const updated = await UserPlanFollow.markRecipeCompleted(userId, id, recipe_id, day_number, meal_type);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: '更新失败'
        });
      }
      
      res.json({
        success: true,
        message: '菜谱标记完成成功'
      });
    } catch (error) {
      console.error('标记菜谱完成失败:', error);
      res.status(500).json({
        success: false,
        message: '标记菜谱完成失败'
      });
    }
  }

  // 完成计划
  static async completePlan(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id || 1; // 临时使用默认用户ID
      const { rating } = req.body;
      
      const schema = Joi.object({
        rating: Joi.number().min(1).max(5).allow(null)
      });
      
      const { error } = schema.validate({ rating });
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const updated = await UserPlanFollow.completePlan(userId, id, rating);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: '计划跟随记录不存在'
        });
      }
      
      res.json({
        success: true,
        message: '计划完成成功'
      });
    } catch (error) {
      console.error('完成计划失败:', error);
      res.status(500).json({
        success: false,
        message: '完成计划失败'
      });
    }
  }
}

module.exports = RecipePlanController; 