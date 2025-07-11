// controllers/orderController.js - 订单控制器
const Order = require('../models/Order');
const Joi = require('joi');

// 验证规则
const orderSchema = Joi.object({
  user_id: Joi.string().allow('').max(50),
  user_name: Joi.string().required().min(1).max(50).messages({
    'string.empty': '用户姓名不能为空',
    'string.min': '用户姓名至少1个字符',
    'string.max': '用户姓名最多50个字符',
    'any.required': '用户姓名是必填项'
  }),
  user_phone: Joi.string().required().pattern(/^1[3-9]\d{9}$/).messages({
    'string.empty': '用户电话不能为空',
    'string.pattern.base': '请输入正确的手机号码',
    'any.required': '用户电话是必填项'
  }),
  pickup_time: Joi.string().allow('').max(50),
  remark: Joi.string().allow('').max(500),
  items: Joi.array().items(
    Joi.object({
      product_id: Joi.number().integer().positive().required(),
      product_name: Joi.string().required().max(100),
      quantity: Joi.number().integer().positive().required()
    })
  ).min(1).required().messages({
    'array.min': '订单必须包含至少一个商品',
    'any.required': '订单商品是必填项'
  })
});

class OrderController {
  // 获取订单列表
  static async getOrders(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      
      // 确保参数是有效数字
      const parsedLimit = parseInt(limit) || 20;
      const parsedPage = parseInt(page) || 1;
      const offset = (parsedPage - 1) * parsedLimit;
      
      // 调试输出
      console.log('获取订单列表参数:', { status, parsedLimit, offset });
      
      const orders = await Order.findAll(status, parsedLimit, offset);
      
      res.json({
        success: true,
        data: orders,
        message: '获取订单列表成功'
      });
    } catch (error) {
      console.error('获取订单列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取订单列表失败',
        error: error.message
      });
    }
  }

  // 获取单个订单详情
  static async getOrder(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '订单ID无效'
        });
      }

      const order = await Order.findById(id);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      res.json({
        success: true,
        data: order,
        message: '获取订单详情成功'
      });
    } catch (error) {
      console.error('获取订单详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取订单详情失败',
        error: error.message
      });
    }
  }

  // 根据订单号获取订单详情
  static async getOrderByOrderNo(req, res) {
    try {
      const { orderNo } = req.params;
      
      if (!orderNo) {
        return res.status(400).json({
          success: false,
          message: '订单号不能为空'
        });
      }

      const order = await Order.findByOrderNo(orderNo);
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      res.json({
        success: true,
        data: order,
        message: '获取订单详情成功'
      });
    } catch (error) {
      console.error('获取订单详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取订单详情失败',
        error: error.message
      });
    }
  }

  // 创建订单
  static async createOrder(req, res) {
    try {
      // 验证请求数据
      const { error, value } = orderSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '数据验证失败',
          error: error.details[0].message
        });
      }

      // 生成订单号
      const orderNo = Order.generateOrderNo();

      const orderData = {
        ...value,
        order_no: orderNo,
        status: 'pending'
      };

      const orderId = await Order.create(orderData);
      
      res.status(201).json({
        success: true,
        data: { 
          id: orderId,
          order_no: orderNo
        },
        message: '创建订单成功'
      });
    } catch (error) {
      console.error('创建订单失败:', error);
      res.status(500).json({
        success: false,
        message: '创建订单失败',
        error: error.message
      });
    }
  }

  // 更新订单状态
  static async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '订单ID无效'
        });
      }

      if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '状态值无效'
        });
      }

      // 检查订单是否存在
      const existingOrder = await Order.findById(id);
      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      const success = await Order.updateStatus(id, status);
      
      if (success) {
        const statusText = {
          'pending': '待处理',
          'processing': '制作中',
          'completed': '已完成',
          'cancelled': '已取消'
        };
        
        res.json({
          success: true,
          message: `订单状态已更新为${statusText[status]}`
        });
      } else {
        res.status(500).json({
          success: false,
          message: '更新订单状态失败'
        });
      }
    } catch (error) {
      console.error('更新订单状态失败:', error);
      res.status(500).json({
        success: false,
        message: '更新订单状态失败',
        error: error.message
      });
    }
  }

  // 删除订单
  static async deleteOrder(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '订单ID无效'
        });
      }

      // 检查订单是否存在
      const existingOrder = await Order.findById(id);
      if (!existingOrder) {
        return res.status(404).json({
          success: false,
          message: '订单不存在'
        });
      }

      const success = await Order.delete(id);
      
      if (success) {
        res.json({
          success: true,
          message: '删除订单成功'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '删除订单失败'
        });
      }
    } catch (error) {
      console.error('删除订单失败:', error);
      res.status(500).json({
        success: false,
        message: '删除订单失败',
        error: error.message
      });
    }
  }

  // 获取订单统计
  static async getOrderStats(req, res) {
    try {
      const { date } = req.query;
      
      const stats = date ? await Order.getStats(date) : await Order.getTodayStats();
      
      res.json({
        success: true,
        data: stats,
        message: '获取订单统计成功'
      });
    } catch (error) {
      console.error('获取订单统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取订单统计失败',
        error: error.message
      });
    }
  }

  // 获取状态统计
  static async getStatusStats(req, res) {
    try {
      const stats = await Order.getStatusStats();
      
      res.json({
        success: true,
        data: stats,
        message: '获取状态统计成功'
      });
    } catch (error) {
      console.error('获取状态统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取状态统计失败',
        error: error.message
      });
    }
  }
}

module.exports = OrderController; 