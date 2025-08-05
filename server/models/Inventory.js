const { query } = require('../database/connection');

class Inventory {
  // 获取所有库存信息
  static async findAll(status = null) {
    let sql = `
      SELECT i.*, m.name as product_name, m.image as product_image, 
             c.name as category_name
      FROM inventory i
      LEFT JOIN menu_items m ON i.product_id = m.id
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND i.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY i.last_updated DESC';
    return await query(sql, params);
  }

  // 根据商品ID获取库存信息
  static async findByProductId(productId) {
    const sql = `
      SELECT i.*, m.name as product_name, m.image as product_image
      FROM inventory i
      LEFT JOIN menu_items m ON i.product_id = m.id
      WHERE i.product_id = ?
    `;
    const result = await query(sql, [productId]);
    return result[0] || null;
  }

  // 创建库存记录
  static async create(inventoryData) {
    const { product_id, stock_quantity, min_stock, max_stock, unit, supplier_info } = inventoryData;
    
    const sql = `
      INSERT INTO inventory (product_id, stock_quantity, min_stock, max_stock, unit, supplier_info, 
                           status, created_at, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, 'in_stock', NOW(), NOW())
    `;
    
    const result = await query(sql, [
      product_id, stock_quantity, min_stock || 10, max_stock || 1000, unit || '份',
      JSON.stringify(supplier_info || {})
    ]);
    
    return result.insertId;
  }

  // 更新库存数量
  static async updateStock(productId, quantity, operation = 'set') {
    let sql;
    let params;
    
    if (operation === 'add') {
      sql = `
        UPDATE inventory 
        SET stock_quantity = stock_quantity + ?, last_updated = NOW()
        WHERE product_id = ?
      `;
      params = [quantity, productId];
    } else if (operation === 'subtract') {
      sql = `
        UPDATE inventory 
        SET stock_quantity = GREATEST(stock_quantity - ?, 0), last_updated = NOW()
        WHERE product_id = ?
      `;
      params = [quantity, productId];
    } else {
      sql = `
        UPDATE inventory 
        SET stock_quantity = ?, last_updated = NOW()
        WHERE product_id = ?
      `;
      params = [quantity, productId];
    }
    
    const result = await query(sql, params);
    
    // 检查库存状态并更新
    await this.updateStockStatus(productId);
    
    return result.affectedRows > 0;
  }

  // 更新库存状态
  static async updateStockStatus(productId) {
    const inventory = await this.findByProductId(productId);
    if (!inventory) return false;
    
    let status = 'in_stock';
    if (inventory.stock_quantity === 0) {
      status = 'out_of_stock';
    } else if (inventory.stock_quantity <= inventory.min_stock) {
      status = 'low_stock';
    }
    
    const sql = `
      UPDATE inventory 
      SET status = ?, last_updated = NOW()
      WHERE product_id = ?
    `;
    
    const result = await query(sql, [status, productId]);
    return result.affectedRows > 0;
  }

  // 获取库存统计
  static async getStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN status = 'in_stock' THEN 1 ELSE 0 END) as in_stock_count,
        SUM(CASE WHEN status = 'low_stock' THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN status = 'out_of_stock' THEN 1 ELSE 0 END) as out_of_stock_count,
        SUM(stock_quantity) as total_stock_quantity
      FROM inventory
    `;
    
    const result = await query(sql);
    return result[0];
  }

  // 获取库存预警列表
  static async getAlerts() {
    const sql = `
      SELECT i.*, m.name as product_name, m.image as product_image
      FROM inventory i
      LEFT JOIN menu_items m ON i.product_id = m.id
      WHERE i.status IN ('low_stock', 'out_of_stock')
      ORDER BY 
        CASE 
          WHEN i.status = 'out_of_stock' THEN 1
          WHEN i.status = 'low_stock' THEN 2
          ELSE 3
        END,
        i.last_updated DESC
    `;
    
    return await query(sql);
  }
}

module.exports = Inventory; 