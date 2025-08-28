// models/Request.js - 请求模型
const db = require('../database/connection');
const moment = require('moment');

class Request {
  // 获取所有请求
  static async findAll(status = null, limit = null, offset = null) {
    let sql = `
      SELECT o.id, o.request_no, o.user_id, o.user_name, o.user_phone, 
             o.request_status, o.request_reason, o.urgency, o.occasion, 
             o.preferred_time, o.remark, o.created_at, o.updated_at
      FROM orders o 
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND o.request_status = ?';
      params.push(status);
    }

    sql += ' ORDER BY o.created_at DESC';

    if (limit !== null && limit !== undefined && Number.isInteger(limit) && limit > 0) {
      if (offset !== null && offset !== undefined && Number.isInteger(offset) && offset >= 0) {
        sql += ` LIMIT ${offset}, ${limit}`;
      } else {
        sql += ` LIMIT ${limit}`;
      }
    }

    return await db.query(sql, params);
  }

  // 根据ID获取请求详情
  static async findById(id) {
    const requestSql = 'SELECT * FROM orders WHERE id = ?';
    const requestResult = await db.query(requestSql, [id]);
    
    if (requestResult.length === 0) {
      return null;
    }

    const request = requestResult[0];
    
    // 获取请求项
    const itemsSql = `
      SELECT oi.*, p.image as dish_image, p.dish_name
      FROM order_items oi
      LEFT JOIN menu_items p ON oi.dish_id = p.id
      WHERE oi.order_id = ?
    `;
    const items = await db.query(itemsSql, [id]);
    
    return {
      ...request,
      items
    };
  }

  // 根据请求号获取请求详情
  static async findByRequestNo(requestNo) {
    const requestSql = 'SELECT * FROM orders WHERE request_no = ?';
    const requestResult = await db.query(requestSql, [requestNo]);
    
    if (requestResult.length === 0) {
      return null;
    }

    const request = requestResult[0];
    
    // 获取请求项
    const itemsSql = `
      SELECT oi.*, p.image as dish_image, p.dish_name
      FROM order_items oi
      LEFT JOIN menu_items p ON oi.dish_id = p.id
      WHERE oi.order_id = ?
    `;
    const items = await db.query(itemsSql, [request.id]);
    
    return {
      ...request,
      items
    };
  }

  // 创建请求
  static async create(requestData) {
    const connection = await db.beginTransaction();
    
    try {
      // 创建请求
      const requestSql = `
        INSERT INTO orders (request_no, user_id, user_name, user_phone, request_status, 
                           request_reason, urgency, occasion, preferred_time, remark) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const requestParams = [
        requestData.request_no,
        requestData.user_id || '',
        requestData.user_name || '匿名用户',
        requestData.user_phone || '',
        requestData.request_status || 'pending',
        requestData.request_reason || '',
        requestData.urgency || 'normal',
        requestData.occasion || '',
        requestData.preferred_time || null,
        requestData.remark || ''
      ];

      const [requestResult] = await connection.execute(requestSql, requestParams);
      const requestId = requestResult.insertId;

      // 创建请求项
      if (requestData.items && requestData.items.length > 0) {
        const itemSql = `
          INSERT INTO order_items (order_id, dish_id, dish_name, quantity) 
          VALUES (?, ?, ?, ?)
        `;
        
        for (const item of requestData.items) {
          const itemParams = [
            requestId,
            item.dish_id || item.product_id,
            item.dish_name || item.product_name,
            item.quantity
          ];
          await connection.execute(itemSql, itemParams);
        }
      }

      await db.commitTransaction(connection);
      return requestId;
    } catch (error) {
      await db.rollbackTransaction(connection);
      throw error;
    }
  }

  // 更新请求状态
  static async updateStatus(id, status) {
    const sql = 'UPDATE orders SET request_status = ? WHERE id = ?';
    const result = await db.query(sql, [status, id]);
    return result.affectedRows > 0;
  }

  // 删除请求
  static async delete(id) {
    const connection = await db.beginTransaction();
    
    try {
      // 删除请求项
      await connection.execute('DELETE FROM order_items WHERE order_id = ?', [id]);
      
      // 删除请求
      const result = await connection.execute('DELETE FROM orders WHERE id = ?', [id]);
      
      await db.commitTransaction(connection);
      return result[0].affectedRows > 0;
    } catch (error) {
      await db.rollbackTransaction(connection);
      throw error;
    }
  }

  // 获取今日统计
  static async getTodayStats() {
    const today = moment().format('YYYY-MM-DD');
    const sql = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN request_status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN request_status = 'accepted' THEN 1 END) as accepted_count,
        COUNT(CASE WHEN request_status = 'preparing' THEN 1 END) as preparing_count,
        COUNT(CASE WHEN request_status = 'ready' THEN 1 END) as ready_count,
        COUNT(CASE WHEN request_status = 'declined' THEN 1 END) as declined_count
      FROM orders 
      WHERE DATE(created_at) = ?
    `;
    
    const result = await db.query(sql, [today]);
    return result[0] || {};
  }

  // 获取指定日期统计
  static async getStats(date) {
    const sql = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN request_status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN request_status = 'accepted' THEN 1 END) as accepted_count,
        COUNT(CASE WHEN request_status = 'preparing' THEN 1 END) as preparing_count,
        COUNT(CASE WHEN request_status = 'ready' THEN 1 END) as ready_count,
        COUNT(CASE WHEN request_status = 'declined' THEN 1 END) as declined_count
      FROM orders 
      WHERE DATE(created_at) = ?
    `;
    
    const result = await db.query(sql, [date]);
    return result[0] || {};
  }

  // 获取状态统计
  static async getStatusStats() {
    const sql = `
      SELECT 
        request_status,
        COUNT(*) as count
      FROM orders 
      GROUP BY request_status
    `;
    
    const results = await db.query(sql);
    
    // 转换为对象格式
    const stats = {};
    results.forEach(row => {
      stats[row.request_status] = row.count;
    });
    
    return stats;
  }
}

module.exports = Request;