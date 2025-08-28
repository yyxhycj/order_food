// controllers/requestController.js - 请求控制器
const Order = require('../models/Order');
const Joi = require('joi');

// 验证规则
const requestSchema = Joi.object({
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
  preferred_time: Joi.string().allow('').max(50),
  request_reason: Joi.string().allow('').max(500),
  urgency: Joi.string().valid('low', 'medium', 'high').default('medium'),
  occasion: Joi.string().allow('').max(100),
  remark: Joi.string().allow('').max(500),
  items: Joi.array().items(
    Joi.object({
      product_id: Joi.number().integer().positive().required(),
      product_name: Joi.string().required().max(100),
      quantity: Joi.number().integer().positive().required()
    })
  ).min(1).required().messages({
    'array.min': '请求必须包含至少一个菜品',
    'any.required': '请求菜品是必填项'
  })
});

class RequestController {
  // 获取请求列表
  static async getRequests(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      
      // 确保参数是有效数字
      const parsedLimit = parseInt(limit) || 20;
      const parsedPage = parseInt(page) || 1;
      const offset = (parsedPage - 1) * parsedLimit;
      
      const requests = await Order.findAll(status, parsedLimit, offset);
      
      res.json({
        success: true,
        data: requests,
        message: '获取请求列表成功'
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

  // 获取单个请求详情
  static async getRequest(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '请求ID无效'
        });
      }

      const request = await Order.findById(id);
      
      if (!request) {
        return res.status(404).json({
          success: false,
          message: '请求不存在'
        });
      }

      res.json({
        success: true,
        data: request,
        message: '获取请求详情成功'
      });
    } catch (error) {
      console.error('获取请求详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取请求详情失败',
        error: error.message
      });
    }
  }

  // 根据请求编号获取请求详情
  static async getRequestByRequestNo(req, res) {
    try {
      const { requestNo } = req.params;
      
      if (!requestNo) {
        return res.status(400).json({
          success: false,
          message: '请求编号不能为空'
        });
      }

      const request = await Order.findByOrderNo(requestNo);
      
      if (!request) {
        return res.status(404).json({
          success: false,
          message: '请求不存在'
        });
      }

      res.json({
        success: true,
        data: request,
        message: '获取请求详情成功'
      });
    } catch (error) {
      console.error('获取请求详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取请求详情失败',
        error: error.message
      });
    }
  }

  // 创建请求
  static async createRequest(req, res) {
    try {
      // 验证请求数据
      const { error, value } = requestSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '数据验证失败',
          error: error.details[0].message
        });
      }

      // 生成请求编号
      const requestNo = 'REQ' + Date.now() + Math.floor(Math.random() * 1000);

      const requestData = {
        ...value,
        request_no: requestNo,
        request_status: 'pending'
      };

      const requestId = await Order.create(requestData);
      
      res.status(201).json({
        success: true,
        data: { 
          id: requestId,
          request_no: requestNo
        },
        message: '提交请求成功'
      });
    } catch (error) {
      console.error('创建请求失败:', error);
      res.status(500).json({
        success: false,
        message: '提交请求失败',
        error: error.message
      });
    }
  }

  // 更新请求状态
  static async updateRequestStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!id || isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: '请求ID无效'
        });
      }

      if (!['pending', 'accepted', 'preparing', 'ready', 'declined'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '状态值无效'
        });
      }

      // 检查请求是否存在
      const existingRequest = await Order.findById(id);
      if (!existingRequest) {
        return res.status(404).json({
          success: false,
          message: '请求不存在'
        });
      }

      const success = await Order.updateStatus(id, status);
      
      if (success) {
        const statusText = {
          'pending': '等待响应',
          'accepted': '已接受',
          'preparing': '准备中',
          'ready': '可以享用',
          'declined': '已拒绝'
        };
        
        res.json({
          success: true,
          message: `请求状态已更新为${statusText[status]}`
        });
      } else {
        res.status(500).json({
          success: false,
          message: '更新请求状态失败'
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

module.exports = RequestController; 