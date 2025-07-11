// models/Product.js - 商品模型
const db = require('../database/connection');

class Product {
  // 获取所有商品
  static async findAll(categoryId = null, status = null) {
    let sql = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE 1=1
    `;
    const params = [];

    if (categoryId) {
      sql += ' AND p.category_id = ?';
      params.push(categoryId);
    }

    if (status) {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY p.sort ASC, p.created_at DESC';

    return await db.query(sql, params);
  }

  // 根据ID获取商品
  static async findById(id) {
    const sql = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `;
    const result = await db.query(sql, [id]);
    return result[0] || null;
  }

  // 创建商品
  static async create(productData) {
    const sql = `
      INSERT INTO products (name, description, image, category_id, status, sort) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      productData.name,
      productData.description || '',
      productData.image || '',
      productData.category_id,
      productData.status || 'available',
      productData.sort || 0
    ];

    const result = await db.query(sql, params);
    return result.insertId;
  }

  // 更新商品
  static async update(id, productData) {
    const sql = `
      UPDATE products 
      SET name = ?, description = ?, image = ?, category_id = ?, status = ?, sort = ?
      WHERE id = ?
    `;
    const params = [
      productData.name,
      productData.description || '',
      productData.image || '',
      productData.category_id,
      productData.status || 'available',
      productData.sort || 0,
      id
    ];

    const result = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  // 删除商品
  static async delete(id) {
    const sql = 'DELETE FROM products WHERE id = ?';
    const result = await db.query(sql, [id]);
    return result.affectedRows > 0;
  }

  // 更新商品状态
  static async updateStatus(id, status) {
    const sql = 'UPDATE products SET status = ? WHERE id = ?';
    const result = await db.query(sql, [status, id]);
    return result.affectedRows > 0;
  }

  // 获取商品统计
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'unavailable' THEN 1 ELSE 0 END) as unavailable
      FROM products
    `;
    const result = await db.query(sql);
    return result[0];
  }

  // 按分类统计商品数量
  static async getCountByCategory() {
    const sql = `
      SELECT 
        c.id,
        c.name,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name
      ORDER BY c.sort ASC
    `;
    return await db.query(sql);
  }
}

module.exports = Product; 