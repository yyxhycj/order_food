const CustomOrder = require('../models/CustomOrder');
const Joi = require('joi');

class CustomOrderController {
  // 获取商品的定制化选项
  static async getCustomizationOptions(req, res) {
    try {
      const { productId } = req.params;
      const options = await CustomOrder.getCustomizationOptions(productId);
      
      res.json({
        success: true,
        data: options,
        message: '获取定制化选项成功'
      });
    } catch (error) {
      console.error('获取定制化选项失败:', error);
      res.status(500).json({
        success: false,
        message: '获取定制化选项失败'
      });
    }
  }

  // 创建定制化订单
  static async createCustomOrder(req, res) {
    try {
      const schema = Joi.object({
        order_no: Joi.string().required(),
        user_name: Joi.string().required(),
        user_phone: Joi.string().required(),
        user_id: Joi.string().optional(),
        pickup_time: Joi.date().optional(),
        remark: Joi.string().allow(''),
        customization_info: Joi.object().optional(),
        dietary_notes: Joi.string().allow(''),
        estimated_prep_time: Joi.number().integer().min(0).optional(),
        items: Joi.array().items(
          Joi.object({
            product_id: Joi.number().integer().positive().required(),
            product_name: Joi.string().required(),
            quantity: Joi.number().integer().min(1).required(),
            customization_details: Joi.object().optional(),
            custom_price: Joi.number().min(0).optional()
          })
        ).min(1).required()
      });
      
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      // 验证每个商品的定制化选项
      for (const item of value.items) {
        if (item.customization_details && item.customization_details.selections) {
          const validation = await CustomOrder.validateCustomizationOptions(
            item.product_id,
            item.customization_details.selections
          );
          
          if (!validation.isValid) {
            return res.status(400).json({
              success: false,
              message: `商品 ${item.product_name} 的定制化选项验证失败: ${validation.errors.join(', ')}`
            });
          }
        }
      }
      
      const orderId = await CustomOrder.createCustomOrder(value);
      
      res.json({
        success: true,
        data: { id: orderId },
        message: '创建定制化订单成功'
      });
    } catch (error) {
      console.error('创建定制化订单失败:', error);
      res.status(500).json({
        success: false,
        message: '创建定制化订单失败'
      });
    }
  }

  // 获取定制化订单详情
  static async getCustomOrderDetails(req, res) {
    try {
      const { orderId } = req.params;
      const orderDetails = await CustomOrder.getCustomOrderDetails(orderId);
      
      if (!orderDetails) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }
      
      res.json({
        success: true,
        data: orderDetails,
        message: '获取定制化订单详情成功'
      });
    } catch (error) {
      console.error('获取定制化订单详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取定制化订单详情失败'
      });
    }
  }

  // 验证定制化选项
  static async validateCustomizationOptions(req, res) {
    try {
      const { productId } = req.params;
      const { selections } = req.body;
      
      const schema = Joi.object({
        selections: Joi.array().items(
          Joi.object({
            option_id: Joi.number().integer().positive().required(),
            values: Joi.array().items(Joi.string()).required()
          })
        ).required()
      });
      
      const { error, value } = schema.validate({ selections });
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const validation = await CustomOrder.validateCustomizationOptions(productId, value.selections);
      
      res.json({
        success: validation.isValid,
        data: validation,
        message: validation.isValid ? '定制化选项验证通过' : '定制化选项验证失败'
      });
    } catch (error) {
      console.error('验证定制化选项失败:', error);
      res.status(500).json({
        success: false,
        message: '验证定制化选项失败'
      });
    }
  }

  // 计算定制化价格调整
  static async calculateCustomPrice(req, res) {
    try {
      const { productId } = req.params;
      const { selections } = req.body;
      
      const schema = Joi.object({
        selections: Joi.array().items(
          Joi.object({
            option_id: Joi.number().integer().positive().required(),
            values: Joi.array().items(Joi.string()).required()
          })
        ).required()
      });
      
      const { error, value } = schema.validate({ selections });
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const priceAdjustment = await CustomOrder.calculateCustomPrice(productId, value.selections);
      
      res.json({
        success: true,
        data: { priceAdjustment },
        message: '计算定制化价格调整成功'
      });
    } catch (error) {
      console.error('计算定制化价格调整失败:', error);
      res.status(500).json({
        success: false,
        message: '计算定制化价格调整失败'
      });
    }
  }

  // 获取定制化订单统计
  static async getCustomOrderStats(req, res) {
    try {
      const { timeRange } = req.query;
      const schema = Joi.object({
        timeRange: Joi.string().valid('7', '30', '90').default('30')
      });
      
      const { error, value } = schema.validate({ timeRange });
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const stats = await CustomOrder.getCustomOrderStats(value.timeRange);
      
      res.json({
        success: true,
        data: stats,
        message: '获取定制化订单统计成功'
      });
    } catch (error) {
      console.error('获取定制化订单统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取定制化订单统计失败'
      });
    }
  }

  // 获取热门定制化选项
  static async getPopularCustomizations(req, res) {
    try {
      const { limit } = req.query;
      const schema = Joi.object({
        limit: Joi.number().integer().min(1).max(50).default(10)
      });
      
      const { error, value } = schema.validate({ limit });
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const popular = await CustomOrder.getPopularCustomizations(value.limit);
      
      res.json({
        success: true,
        data: popular,
        message: '获取热门定制化选项成功'
      });
    } catch (error) {
      console.error('获取热门定制化选项失败:', error);
      res.status(500).json({
        success: false,
        message: '获取热门定制化选项失败'
      });
    }
  }

  // 创建定制化选项
  static async createCustomizationOption(req, res) {
    try {
      const schema = Joi.object({
        product_id: Joi.number().integer().positive().required(),
        option_name: Joi.string().required(),
        option_type: Joi.string().valid('single', 'multiple', 'text').required(),
        option_values: Joi.array().items(
          Joi.object({
            value: Joi.string().required(),
            label: Joi.string().required(),
            price_adjustment: Joi.number().default(0)
          })
        ).default([]),
        price_adjustment: Joi.number().default(0),
        is_required: Joi.boolean().default(false),
        max_selections: Joi.number().integer().min(0).default(0),
        description: Joi.string().allow(''),
        sort_order: Joi.number().integer().min(0).default(0)
      });
      
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const optionId = await CustomOrder.createCustomizationOption(value);
      
      res.json({
        success: true,
        data: { id: optionId },
        message: '创建定制化选项成功'
      });
    } catch (error) {
      console.error('创建定制化选项失败:', error);
      res.status(500).json({
        success: false,
        message: '创建定制化选项失败'
      });
    }
  }

  // 更新定制化选项
  static async updateCustomizationOption(req, res) {
    try {
      const { optionId } = req.params;
      const schema = Joi.object({
        option_name: Joi.string().required(),
        option_type: Joi.string().valid('single', 'multiple', 'text').required(),
        option_values: Joi.array().items(
          Joi.object({
            value: Joi.string().required(),
            label: Joi.string().required(),
            price_adjustment: Joi.number().default(0)
          })
        ).default([]),
        price_adjustment: Joi.number().default(0),
        is_required: Joi.boolean().default(false),
        max_selections: Joi.number().integer().min(0).default(0),
        description: Joi.string().allow(''),
        sort_order: Joi.number().integer().min(0).default(0)
      });
      
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const success = await CustomOrder.updateCustomizationOption(optionId, value);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '定制化选项不存在'
        });
      }
      
      res.json({
        success: true,
        message: '更新定制化选项成功'
      });
    } catch (error) {
      console.error('更新定制化选项失败:', error);
      res.status(500).json({
        success: false,
        message: '更新定制化选项失败'
      });
    }
  }

  // 删除定制化选项
  static async deleteCustomizationOption(req, res) {
    try {
      const { optionId } = req.params;
      const success = await CustomOrder.deleteCustomizationOption(optionId);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '定制化选项不存在'
        });
      }
      
      res.json({
        success: true,
        message: '删除定制化选项成功'
      });
    } catch (error) {
      console.error('删除定制化选项失败:', error);
      res.status(500).json({
        success: false,
        message: '删除定制化选项失败'
      });
    }
  }
}

module.exports = CustomOrderController; 