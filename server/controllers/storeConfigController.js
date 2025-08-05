// controllers/storeConfigController.js - 店铺配置控制器
const db = require('../database/connection');
const Joi = require('joi');

// 验证规则
const storeConfigSchema = Joi.object({
  store_name: Joi.string().required().min(1).max(100).messages({
    'string.empty': '店铺名称不能为空',
    'string.min': '店铺名称至少1个字符',
    'string.max': '店铺名称最多100个字符',
    'any.required': '店铺名称是必填项'
  }),
  store_subtitle: Joi.string().allow('').max(100).messages({
    'string.max': '店铺副标题最多100个字符'
  }),
  store_rating: Joi.number().min(0).max(5).precision(1).messages({
    'number.min': '店铺评分最少0分',
    'number.max': '店铺评分最多5分'
  }),
  month_sales: Joi.number().integer().min(0).messages({
    'number.min': '月销量不能为负数'
  }),
  rating_percent: Joi.number().integer().min(0).max(100).messages({
    'number.min': '好评率不能小于0%',
    'number.max': '好评率不能大于100%'
  }),
  banner_image: Joi.string().allow('').max(255).messages({
    'string.max': '横幅图片路径最多255个字符'
  }),
  banner_color: Joi.string().allow('').max(20).messages({
    'string.max': '横幅背景色最多20个字符'
  })
});

class StoreConfigController {
  // 获取店铺配置
  static async getStoreConfig(req, res) {
    try {
      const sql = 'SELECT * FROM store_config WHERE status = "active" ORDER BY id DESC LIMIT 1';
      const rows = await db.query(sql);
      
      if (rows.length === 0) {
        // 如果没有配置，返回默认配置
        return res.json({
          success: true,
          data: {
            store_name: '点单小程序',
            store_subtitle: '(示例店铺)',
            store_rating: 4.6,
            month_sales: 2123,
            rating_percent: 94,
            banner_image: '',
            banner_color: '#ff6b6b'
          },
          message: '获取店铺配置成功（默认配置）'
        });
      }
      
      const config = rows[0];
      res.json({
        success: true,
        data: {
          store_name: config.store_name,
          store_subtitle: config.store_subtitle,
          store_rating: config.store_rating,
          month_sales: config.month_sales,
          rating_percent: config.rating_percent,
          banner_image: config.banner_image,
          banner_color: config.banner_color
        },
        message: '获取店铺配置成功'
      });
    } catch (error) {
      console.error('获取店铺配置失败:', error);
      res.status(500).json({
        success: false,
        message: '获取店铺配置失败',
        error: error.message
      });
    }
  }

  // 更新店铺配置
  static async updateStoreConfig(req, res) {
    try {
      // 验证数据
      const { error, value } = storeConfigSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '数据验证失败',
          error: error.details[0].message
        });
      }

      const {
        store_name,
        store_subtitle,
        store_rating,
        month_sales,
        rating_percent,
        banner_image,
        banner_color
      } = value;

      // 检查是否已有配置
      const checkSql = 'SELECT id FROM store_config WHERE status = "active" LIMIT 1';
      const checkRows = await db.query(checkSql);
      
      if (checkRows.length === 0) {
        // 插入新配置
        const insertSql = `
          INSERT INTO store_config 
          (store_name, store_subtitle, store_rating, month_sales, rating_percent, banner_image, banner_color, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
        `;
        await db.query(insertSql, [
          store_name,
          store_subtitle,
          store_rating,
          month_sales,
          rating_percent,
          banner_image,
          banner_color
        ]);
      } else {
        // 更新现有配置
        const updateSql = `
          UPDATE store_config 
          SET store_name = ?, store_subtitle = ?, store_rating = ?, month_sales = ?, 
              rating_percent = ?, banner_image = ?, banner_color = ?, updated_at = CURRENT_TIMESTAMP
          WHERE status = 'active'
        `;
        await db.query(updateSql, [
          store_name,
          store_subtitle,
          store_rating,
          month_sales,
          rating_percent,
          banner_image,
          banner_color
        ]);
      }

      res.json({
        success: true,
        data: {
          store_name,
          store_subtitle,
          store_rating,
          month_sales,
          rating_percent,
          banner_image,
          banner_color
        },
        message: '更新店铺配置成功'
      });
    } catch (error) {
      console.error('更新店铺配置失败:', error);
      res.status(500).json({
        success: false,
        message: '更新店铺配置失败',
        error: error.message
      });
    }
  }
}

module.exports = StoreConfigController; 