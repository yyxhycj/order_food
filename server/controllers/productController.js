// controllers/productController.js - 商品控制器
const Product = require('../models/Product');
const Joi = require('joi');

// 验证规则
const productSchema = Joi.object({
  name: Joi.string().required().min(1).max(100).messages({
    'string.empty': '商品名称不能为空',
    'string.min': '商品名称至少1个字符',
    'string.max': '商品名称最多100个字符',
    'any.required': '商品名称是必填项'
  }),
  description: Joi.string().allow('').max(500).messages({
    'string.max': '商品描述最多500个字符'
  }),
  category_id: Joi.number().integer().positive().required().messages({
    'number.integer': '分类ID必须是整数',
    'number.positive': '分类ID必须大于0',
    'any.required': '商品分类是必填项'
  }),
  image: Joi.string().allow('').max(255).messages({
    'string.max': '图片路径最多255个字符'
  }),
  status: Joi.string().valid('available', 'unavailable').default('available'),
  sort: Joi.number().integer().min(0).default(0)
});

class ProductController {
  // 获取商品列表
  static async getProducts(req, res) {
    try {
      const { category_id, status } = req.query;
      
      const products = await Product.findAll(category_id, status);
      
      res.json({
        success: true,
        data: products,
        message: '获取商品列表成功'
      });
    } catch (error) {
      console.error('获取商品列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取商品列表失败',
        error: error.message
      });
    }
  }

  // 获取单个商品详情
  static async getProduct(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '商品ID无效'
        });
      }

      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: '商品不存在'
        });
      }

      res.json({
        success: true,
        data: product,
        message: '获取商品详情成功'
      });
    } catch (error) {
      console.error('获取商品详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取商品详情失败',
        error: error.message
      });
    }
  }

  // 创建商品
  static async createProduct(req, res) {
    try {
      // 验证请求数据
      const { error, value } = productSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '数据验证失败',
          error: error.details[0].message
        });
      }

      const productId = await Product.create(value);
      
      res.status(201).json({
        success: true,
        data: { id: productId },
        message: '创建商品成功'
      });
    } catch (error) {
      console.error('创建商品失败:', error);
      res.status(500).json({
        success: false,
        message: '创建商品失败',
        error: error.message
      });
    }
  }

  // 更新商品
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '商品ID无效'
        });
      }

      // 验证请求数据
      const { error, value } = productSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '数据验证失败',
          error: error.details[0].message
        });
      }

      // 检查商品是否存在
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: '商品不存在'
        });
      }

      const success = await Product.update(id, value);
      
      if (success) {
        res.json({
          success: true,
          message: '更新商品成功'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '更新商品失败'
        });
      }
    } catch (error) {
      console.error('更新商品失败:', error);
      res.status(500).json({
        success: false,
        message: '更新商品失败',
        error: error.message
      });
    }
  }

  // 删除商品
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '商品ID无效'
        });
      }

      // 检查商品是否存在
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: '商品不存在'
        });
      }

      const success = await Product.delete(id);
      
      if (success) {
        res.json({
          success: true,
          message: '删除商品成功'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '删除商品失败'
        });
      }
    } catch (error) {
      console.error('删除商品失败:', error);
      res.status(500).json({
        success: false,
        message: '删除商品失败',
        error: error.message
      });
    }
  }

  // 更新商品状态
  static async updateProductStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '商品ID无效'
        });
      }

      if (!['available', 'unavailable'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '状态值无效'
        });
      }

      // 检查商品是否存在
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: '商品不存在'
        });
      }

      const success = await Product.updateStatus(id, status);
      
      if (success) {
        res.json({
          success: true,
          message: `商品已${status === 'available' ? '上架' : '下架'}`
        });
      } else {
        res.status(500).json({
          success: false,
          message: '更新商品状态失败'
        });
      }
    } catch (error) {
      console.error('更新商品状态失败:', error);
      res.status(500).json({
        success: false,
        message: '更新商品状态失败',
        error: error.message
      });
    }
  }

  // 获取商品统计
  static async getProductStats(req, res) {
    try {
      const stats = await Product.getStats();
      
      res.json({
        success: true,
        data: stats,
        message: '获取商品统计成功'
      });
    } catch (error) {
      console.error('获取商品统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取商品统计失败',
        error: error.message
      });
    }
  }
}

module.exports = ProductController; 