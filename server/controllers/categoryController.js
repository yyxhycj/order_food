// controllers/categoryController.js - 分类控制器
const Category = require('../models/Category');
const Joi = require('joi');

// 验证规则
const categorySchema = Joi.object({
  name: Joi.string().required().min(1).max(50).messages({
    'string.empty': '分类名称不能为空',
    'string.min': '分类名称至少1个字符',
    'string.max': '分类名称最多50个字符',
    'any.required': '分类名称是必填项'
  }),
  description: Joi.string().allow('').max(500).messages({
    'string.max': '分类描述最多500个字符'
  }),
  icon: Joi.string().allow('').max(255).messages({
    'string.max': '图标路径最多255个字符'
  }),
  sort: Joi.number().integer().min(0).default(0),
  status: Joi.string().valid('active', 'inactive').default('active')
});

class CategoryController {
  // 获取分类列表
  static async getCategories(req, res) {
    try {
      const { status } = req.query;
      
      const categories = await Category.findAll(status);
      
      res.json({
        success: true,
        data: categories,
        message: '获取分类列表成功'
      });
    } catch (error) {
      console.error('获取分类列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取分类列表失败',
        error: error.message
      });
    }
  }

  // 获取单个分类详情
  static async getCategory(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '分类ID无效'
        });
      }

      const category = await Category.findById(id);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: '分类不存在'
        });
      }

      res.json({
        success: true,
        data: category,
        message: '获取分类详情成功'
      });
    } catch (error) {
      console.error('获取分类详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取分类详情失败',
        error: error.message
      });
    }
  }

  // 创建分类
  static async createCategory(req, res) {
    try {
      // 验证请求数据
      const { error, value } = categorySchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '数据验证失败',
          error: error.details[0].message
        });
      }

      // 检查分类名称是否已存在
      const nameExists = await Category.checkNameExists(value.name);
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: '分类名称已存在'
        });
      }

      // 如果没有设置排序，使用最大排序值+1
      if (!value.sort) {
        const maxSort = await Category.getMaxSort();
        value.sort = maxSort + 1;
      }

      const categoryId = await Category.create(value);
      
      res.status(201).json({
        success: true,
        data: { id: categoryId },
        message: '创建分类成功'
      });
    } catch (error) {
      console.error('创建分类失败:', error);
      res.status(500).json({
        success: false,
        message: '创建分类失败',
        error: error.message
      });
    }
  }

  // 更新分类
  static async updateCategory(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '分类ID无效'
        });
      }

      // 验证请求数据
      const { error, value } = categorySchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '数据验证失败',
          error: error.details[0].message
        });
      }

      // 检查分类是否存在
      const existingCategory = await Category.findById(id);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: '分类不存在'
        });
      }

      // 检查分类名称是否已存在（排除当前分类）
      const nameExists = await Category.checkNameExists(value.name, id);
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: '分类名称已存在'
        });
      }

      const success = await Category.update(id, value);
      
      if (success) {
        res.json({
          success: true,
          message: '更新分类成功'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '更新分类失败'
        });
      }
    } catch (error) {
      console.error('更新分类失败:', error);
      res.status(500).json({
        success: false,
        message: '更新分类失败',
        error: error.message
      });
    }
  }

  // 删除分类
  static async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '分类ID无效'
        });
      }

      // 检查分类是否存在
      const existingCategory = await Category.findById(id);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: '分类不存在'
        });
      }

      const success = await Category.delete(id);
      
      if (success) {
        res.json({
          success: true,
          message: '删除分类成功'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '删除分类失败'
        });
      }
    } catch (error) {
      console.error('删除分类失败:', error);
      
      if (error.message === '该分类下还有商品，无法删除') {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        message: '删除分类失败',
        error: error.message
      });
    }
  }

  // 更新分类状态
  static async updateCategoryStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '分类ID无效'
        });
      }

      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '状态值无效'
        });
      }

      // 检查分类是否存在
      const existingCategory = await Category.findById(id);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: '分类不存在'
        });
      }

      const success = await Category.updateStatus(id, status);
      
      if (success) {
        res.json({
          success: true,
          message: `分类已${status === 'active' ? '启用' : '禁用'}`
        });
      } else {
        res.status(500).json({
          success: false,
          message: '更新分类状态失败'
        });
      }
    } catch (error) {
      console.error('更新分类状态失败:', error);
      res.status(500).json({
        success: false,
        message: '更新分类状态失败',
        error: error.message
      });
    }
  }

  // 更新分类排序
  static async updateCategorySort(req, res) {
    try {
      const { id } = req.params;
      const { sort } = req.body;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '分类ID无效'
        });
      }

      if (sort === undefined || sort < 0) {
        return res.status(400).json({
          success: false,
          message: '排序值无效'
        });
      }

      // 检查分类是否存在
      const existingCategory = await Category.findById(id);
      if (!existingCategory) {
        return res.status(404).json({
          success: false,
          message: '分类不存在'
        });
      }

      const success = await Category.updateSort(id, sort);
      
      if (success) {
        res.json({
          success: true,
          message: '更新分类排序成功'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '更新分类排序失败'
        });
      }
    } catch (error) {
      console.error('更新分类排序失败:', error);
      res.status(500).json({
        success: false,
        message: '更新分类排序失败',
        error: error.message
      });
    }
  }

  // 获取分类统计
  static async getCategoryStats(req, res) {
    try {
      const stats = await Category.getStats();
      
      res.json({
        success: true,
        data: stats,
        message: '获取分类统计成功'
      });
    } catch (error) {
      console.error('获取分类统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取分类统计失败',
        error: error.message
      });
    }
  }
}

module.exports = CategoryController; 