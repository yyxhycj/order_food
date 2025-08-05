const { query } = require('../database/connection');

class CustomOrder {
  // 获取商品的定制化选项
  static async getCustomizationOptions(productId) {
    const sql = `
      SELECT 
        co.id,
        co.option_name,
        co.option_type,
        co.option_values,
        co.price_adjustment,
        co.is_required,
        co.max_selections,
        co.description
      FROM customization_options co
      WHERE co.product_id = ?
        AND co.status = 'active'
      ORDER BY co.sort_order ASC
    `;
    
    const options = await query(sql, [productId]);
    
    // 解析JSON格式的选项值
    return options.map(option => ({
      ...option,
      option_values: JSON.parse(option.option_values || '[]')
    }));
  }

  // 创建定制化订单
  static async createCustomOrder(orderData) {
    const connection = await query.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 创建基础订单
      const orderSql = `
        INSERT INTO orders (order_no, user_id, user_name, user_phone, status, pickup_time, 
                          remark, customization_info, dietary_notes, estimated_prep_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const orderParams = [
        orderData.order_no,
        orderData.user_id || '',
        orderData.user_name,
        orderData.user_phone,
        'pending',
        orderData.pickup_time || null,
        orderData.remark || '',
        JSON.stringify(orderData.customization_info || {}),
        orderData.dietary_notes || '',
        orderData.estimated_prep_time || null
      ];
      
      const [orderResult] = await connection.execute(orderSql, orderParams);
      const orderId = orderResult.insertId;
      
      // 创建定制化订单项
      if (orderData.items && orderData.items.length > 0) {
        for (const item of orderData.items) {
          const itemSql = `
            INSERT INTO order_items (order_id, product_id, product_name, quantity, 
                                   customization_details, custom_price)
            VALUES (?, ?, ?, ?, ?, ?)
          `;
          
          const itemParams = [
            orderId,
            item.product_id,
            item.product_name,
            item.quantity,
            JSON.stringify(item.customization_details || {}),
            item.custom_price || 0
          ];
          
          await connection.execute(itemSql, itemParams);
        }
      }
      
      await connection.commit();
      return orderId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 获取定制化订单详情
  static async getCustomOrderDetails(orderId) {
    const orderSql = `
      SELECT o.*, 
             JSON_EXTRACT(o.customization_info, '$') as customization_info
      FROM orders o
      WHERE o.id = ?
    `;
    
    const orderResult = await query(orderSql, [orderId]);
    
    if (orderResult.length === 0) {
      return null;
    }
    
    const order = orderResult[0];
    
    // 获取定制化订单项
    const itemsSql = `
      SELECT oi.*, 
             JSON_EXTRACT(oi.customization_details, '$') as customization_details,
             p.image as product_image
      FROM order_items oi
      LEFT JOIN menu_items p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;
    
    const items = await query(itemsSql, [orderId]);
    
    return {
      ...order,
      items: items
    };
  }

  // 验证定制化选项
  static async validateCustomizationOptions(productId, selections) {
    const options = await this.getCustomizationOptions(productId);
    const errors = [];
    
    for (const option of options) {
      const selection = selections.find(s => s.option_id === option.id);
      
      // 检查必填项
      if (option.is_required && (!selection || !selection.values.length)) {
        errors.push(`选项 "${option.option_name}" 是必填项`);
        continue;
      }
      
      // 检查选择数量限制
      if (selection && option.max_selections > 0 && selection.values.length > option.max_selections) {
        errors.push(`选项 "${option.option_name}" 最多只能选择 ${option.max_selections} 项`);
      }
      
      // 检查选项值是否有效
      if (selection && selection.values.length > 0) {
        const validValues = option.option_values.map(v => v.value);
        for (const value of selection.values) {
          if (!validValues.includes(value)) {
            errors.push(`选项 "${option.option_name}" 包含无效值: ${value}`);
          }
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // 计算定制化价格调整
  static async calculateCustomPrice(productId, selections) {
    const options = await this.getCustomizationOptions(productId);
    let totalAdjustment = 0;
    
    for (const selection of selections) {
      const option = options.find(o => o.id === selection.option_id);
      if (!option) continue;
      
      for (const value of selection.values) {
        const optionValue = option.option_values.find(v => v.value === value);
        if (optionValue && optionValue.price_adjustment) {
          totalAdjustment += parseFloat(optionValue.price_adjustment);
        }
      }
    }
    
    return totalAdjustment;
  }

  // 获取定制化订单统计
  static async getCustomOrderStats(timeRange = '30') {
    const sql = `
      SELECT 
        COUNT(*) as total_custom_orders,
        COUNT(CASE WHEN o.customization_info != '{}' THEN 1 END) as orders_with_customization,
        AVG(o.estimated_prep_time) as avg_prep_time,
        AVG(o.actual_prep_time) as avg_actual_prep_time
      FROM orders o
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `;
    
    const result = await query(sql, [timeRange]);
    return result[0];
  }

  // 获取热门定制化选项
  static async getPopularCustomizations(limit = 10) {
    const sql = `
      SELECT 
        co.option_name,
        co.option_type,
        COUNT(*) as usage_count,
        p.name as product_name
      FROM customization_options co
      LEFT JOIN menu_items p ON co.product_id = p.id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND co.status = 'active'
      GROUP BY co.id
      ORDER BY usage_count DESC
      LIMIT ?
    `;
    
    return await query(sql, [limit]);
  }

  // 创建定制化选项
  static async createCustomizationOption(optionData) {
    const sql = `
      INSERT INTO customization_options (product_id, option_name, option_type, option_values, 
                                       price_adjustment, is_required, max_selections, description, 
                                       sort_order, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `;
    
    const result = await query(sql, [
      optionData.product_id,
      optionData.option_name,
      optionData.option_type,
      JSON.stringify(optionData.option_values || []),
      optionData.price_adjustment || 0,
      optionData.is_required || false,
      optionData.max_selections || 0,
      optionData.description || '',
      optionData.sort_order || 0
    ]);
    
    return result.insertId;
  }

  // 更新定制化选项
  static async updateCustomizationOption(optionId, optionData) {
    const sql = `
      UPDATE customization_options 
      SET option_name = ?, option_type = ?, option_values = ?, price_adjustment = ?,
          is_required = ?, max_selections = ?, description = ?, sort_order = ?
      WHERE id = ?
    `;
    
    const result = await query(sql, [
      optionData.option_name,
      optionData.option_type,
      JSON.stringify(optionData.option_values),
      optionData.price_adjustment,
      optionData.is_required,
      optionData.max_selections,
      optionData.description,
      optionData.sort_order,
      optionId
    ]);
    
    return result.affectedRows > 0;
  }

  // 删除定制化选项
  static async deleteCustomizationOption(optionId) {
    const sql = `
      UPDATE customization_options 
      SET status = 'inactive' 
      WHERE id = ?
    `;
    
    const result = await query(sql, [optionId]);
    return result.affectedRows > 0;
  }
}

module.exports = CustomOrder; 