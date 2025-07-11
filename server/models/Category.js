// models/Category.js - 分类模型
const db = require('../database/connection');

class Category {
  // 获取所有分类
  static async findAll(status = null) {
    let sql = `
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    sql += ' GROUP BY c.id ORDER BY c.sort ASC, c.created_at DESC';

    return await db.query(sql, params);
  }

  // 根据ID获取分类
  static async findById(id) {
    const sql = `
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      WHERE c.id = ?
      GROUP BY c.id
    `;
    const result = await db.query(sql, [id]);
    return result[0] || null;
  }

  // 创建分类
  static async create(categoryData) {
    const sql = `
      INSERT INTO categories (name, description, icon, sort, status) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const params = [
      categoryData.name,
      categoryData.description || '',
      categoryData.icon || '',
      categoryData.sort || 0,
      categoryData.status || 'active'
    ];

    const result = await db.query(sql, params);
    return result.insertId;
  }

  // 更新分类
  static async update(id, categoryData) {
    const sql = `
      UPDATE categories 
      SET name = ?, description = ?, icon = ?, sort = ?, status = ?
      WHERE id = ?
    `;
    const params = [
      categoryData.name,
      categoryData.description || '',
      categoryData.icon || '',
      categoryData.sort || 0,
      categoryData.status || 'active',
      id
    ];

    const result = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  // 删除分类
  static async delete(id) {
    // 检查是否有关联的商品
    const checkSql = 'SELECT COUNT(*) as count FROM products WHERE category_id = ?';
    const checkResult = await db.query(checkSql, [id]);
    
    if (checkResult[0].count > 0) {
      throw new Error('该分类下还有商品，无法删除');
    }

    const sql = 'DELETE FROM categories WHERE id = ?';
    const result = await db.query(sql, [id]);
    return result.affectedRows > 0;
  }

  // 更新分类状态
  static async updateStatus(id, status) {
    const sql = 'UPDATE categories SET status = ? WHERE id = ?';
    const result = await db.query(sql, [status, id]);
    return result.affectedRows > 0;
  }

  // 获取分类统计
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
      FROM categories
    `;
    const result = await db.query(sql);
    return result[0];
  }

  // 检查分类名称是否存在
  static async checkNameExists(name, excludeId = null) {
    let sql = 'SELECT COUNT(*) as count FROM categories WHERE name = ?';
    const params = [name];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    const result = await db.query(sql, params);
    return result[0].count > 0;
  }

  // 获取最大排序值
  static async getMaxSort() {
    const sql = 'SELECT MAX(sort) as max_sort FROM categories';
    const result = await db.query(sql);
    return result[0].max_sort || 0;
  }

  // 更新排序
  static async updateSort(id, sort) {
    const sql = 'UPDATE categories SET sort = ? WHERE id = ?';
    const result = await db.query(sql, [sort, id]);
    return result.affectedRows > 0;
  }
}

module.exports = Category; 