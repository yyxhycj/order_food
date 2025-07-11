// models/Order.js - 订单模型
const db = require('../database/connection');
const moment = require('moment');

class Order {
  // 获取所有订单
  static async findAll(status = null, limit = null, offset = null) {
    let sql = `
      SELECT o.*, 
             COUNT(oi.id) as item_count,
             SUM(oi.quantity) as total_quantity
      FROM orders o 
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND o.status = ?';
      params.push(status);
    }

    sql += ' GROUP BY o.id ORDER BY o.created_at DESC';

    if (limit !== null && limit !== undefined) {
      sql += ' LIMIT ?';
      params.push(limit);
      if (offset !== null && offset !== undefined) {
        sql += ' OFFSET ?';
        params.push(offset);
      }
    }

    return await db.query(sql, params);
  }

  // 根据ID获取订单详情
  static async findById(id) {
    const orderSql = 'SELECT * FROM orders WHERE id = ?';
    const orderResult = await db.query(orderSql, [id]);
    
    if (orderResult.length === 0) {
      return null;
    }

    const order = orderResult[0];
    
    // 获取订单项
    const itemsSql = `
      SELECT oi.*, p.image as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;
    const items = await db.query(itemsSql, [id]);
    
    return {
      ...order,
      items
    };
  }

  // 根据订单号获取订单详情
  static async findByOrderNo(orderNo) {
    const orderSql = 'SELECT * FROM orders WHERE order_no = ?';
    const orderResult = await db.query(orderSql, [orderNo]);
    
    if (orderResult.length === 0) {
      return null;
    }

    const order = orderResult[0];
    
    // 获取订单项
    const itemsSql = `
      SELECT oi.*, p.image as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `;
    const items = await db.query(itemsSql, [order.id]);
    
    return {
      ...order,
      items
    };
  }

  // 创建订单
  static async create(orderData) {
    const connection = await db.beginTransaction();
    
    try {
      // 创建订单
      const orderSql = `
        INSERT INTO orders (order_no, user_id, user_name, user_phone, status, pickup_time, remark) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      const orderParams = [
        orderData.order_no,
        orderData.user_id || '',
        orderData.user_name,
        orderData.user_phone,
        orderData.status || 'pending',
        orderData.pickup_time || null,
        orderData.remark || ''
      ];

      const [orderResult] = await connection.execute(orderSql, orderParams);
      const orderId = orderResult.insertId;

      // 创建订单项
      if (orderData.items && orderData.items.length > 0) {
        const itemSql = `
          INSERT INTO order_items (order_id, product_id, product_name, quantity) 
          VALUES (?, ?, ?, ?)
        `;
        
        for (const item of orderData.items) {
          const itemParams = [
            orderId,
            item.product_id,
            item.product_name,
            item.quantity
          ];
          await connection.execute(itemSql, itemParams);
        }
      }

      await db.commitTransaction(connection);
      return orderId;
    } catch (error) {
      await db.rollbackTransaction(connection);
      throw error;
    }
  }

  // 更新订单状态
  static async updateStatus(id, status) {
    const sql = 'UPDATE orders SET status = ? WHERE id = ?';
    const result = await db.query(sql, [status, id]);
    return result.affectedRows > 0;
  }

  // 删除订单
  static async delete(id) {
    const connection = await db.beginTransaction();
    
    try {
      // 删除订单项
      await connection.execute('DELETE FROM order_items WHERE order_id = ?', [id]);
      
      // 删除订单
      const result = await connection.execute('DELETE FROM orders WHERE id = ?', [id]);
      
      await db.commitTransaction(connection);
      return result[0].affectedRows > 0;
    } catch (error) {
      await db.rollbackTransaction(connection);
      throw error;
    }
  }

  // 获取订单统计
  static async getStats(date = null) {
    let sql = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
      FROM orders
    `;
    const params = [];

    if (date) {
      sql += ' WHERE DATE(created_at) = ?';
      params.push(date);
    }

    const result = await db.query(sql, params);
    return result[0];
  }

  // 获取今日统计
  static async getTodayStats() {
    const today = moment().format('YYYY-MM-DD');
    return await this.getStats(today);
  }

  // 获取状态统计
  static async getStatusStats() {
    const sql = `
      SELECT 
        status,
        COUNT(*) as count
      FROM orders
      GROUP BY status
    `;
    return await db.query(sql);
  }

  // 生成订单号
  static generateOrderNo() {
    const now = moment();
    const dateStr = now.format('YYYYMMDD');
    const timeStr = now.format('HHmmss');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${dateStr}${timeStr}${random}`;
  }
}

module.exports = Order; 