const Inventory = require('../models/Inventory');
const Joi = require('joi');

class InventoryController {
  // 获取所有库存信息
  static async getAllInventory(req, res) {
    try {
      const { status } = req.query;
      const inventory = await Inventory.findAll(status);
      
      res.json({
        success: true,
        data: inventory,
        message: '获取库存信息成功'
      });
    } catch (error) {
      console.error('获取库存信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取库存信息失败'
      });
    }
  }

  // 根据商品ID获取库存信息
  static async getInventoryByProductId(req, res) {
    try {
      const { productId } = req.params;
      const inventory = await Inventory.findByProductId(productId);
      
      if (!inventory) {
        return res.status(404).json({
          success: false,
          message: '库存信息不存在'
        });
      }
      
      res.json({
        success: true,
        data: inventory,
        message: '获取库存信息成功'
      });
    } catch (error) {
      console.error('获取库存信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取库存信息失败'
      });
    }
  }

  // 创建库存记录
  static async createInventory(req, res) {
    try {
      const schema = Joi.object({
        product_id: Joi.number().integer().positive().required(),
        stock_quantity: Joi.number().integer().min(0).required(),
        min_stock: Joi.number().integer().min(0).default(10),
        max_stock: Joi.number().integer().min(0).default(1000),
        unit: Joi.string().default('份'),
        supplier_info: Joi.object().default({})
      });
      
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const inventoryId = await Inventory.create(value);
      
      res.json({
        success: true,
        data: { id: inventoryId },
        message: '创建库存记录成功'
      });
    } catch (error) {
      console.error('创建库存记录失败:', error);
      res.status(500).json({
        success: false,
        message: '创建库存记录失败'
      });
    }
  }

  // 更新库存数量
  static async updateStock(req, res) {
    try {
      const { productId } = req.params;
      const schema = Joi.object({
        quantity: Joi.number().integer().min(0).required(),
        operation: Joi.string().valid('set', 'add', 'subtract').default('set')
      });
      
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const success = await Inventory.updateStock(productId, value.quantity, value.operation);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '库存记录不存在'
        });
      }
      
      // 返回更新后的库存信息
      const updatedInventory = await Inventory.findByProductId(productId);
      
      res.json({
        success: true,
        data: updatedInventory,
        message: '更新库存成功'
      });
    } catch (error) {
      console.error('更新库存失败:', error);
      res.status(500).json({
        success: false,
        message: '更新库存失败'
      });
    }
  }

  // 获取库存统计
  static async getInventoryStats(req, res) {
    try {
      const stats = await Inventory.getStats();
      
      res.json({
        success: true,
        data: stats,
        message: '获取库存统计成功'
      });
    } catch (error) {
      console.error('获取库存统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取库存统计失败'
      });
    }
  }

  // 获取库存预警列表
  static async getInventoryAlerts(req, res) {
    try {
      const alerts = await Inventory.getAlerts();
      
      res.json({
        success: true,
        data: alerts,
        message: '获取库存预警成功'
      });
    } catch (error) {
      console.error('获取库存预警失败:', error);
      res.status(500).json({
        success: false,
        message: '获取库存预警失败'
      });
    }
  }
}

module.exports = InventoryController; 