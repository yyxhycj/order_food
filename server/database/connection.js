// database/connection.js - 数据库连接
const mysql = require('mysql2/promise');
const config = require('../config');

// 创建数据库连接池
const pool = mysql.createPool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  waitForConnections: config.database.waitForConnections,
  connectionLimit: config.database.connectionLimit,
  queueLimit: config.database.queueLimit
});

// 测试数据库连接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 执行SQL查询
async function query(sql, params = []) {
  try {
    // 验证参数，确保没有无效值
    const validParams = params.map(param => {
      if (param === null || param === undefined) {
        return null;
      }
      if (typeof param === 'number' && isNaN(param)) {
        throw new Error(`Invalid parameter: NaN value detected`);
      }
      return param;
    });
    
    const [rows] = await pool.execute(sql, validParams);
    return rows;
  } catch (error) {
    console.error('数据库查询错误:', error);
    console.error('SQL:', sql);
    console.error('参数:', params);
    throw error;
  }
}

// 获取连接
async function getConnection() {
  return await pool.getConnection();
}

// 开始事务
async function beginTransaction() {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  return connection;
}

// 提交事务
async function commitTransaction(connection) {
  await connection.commit();
  connection.release();
}

// 回滚事务
async function rollbackTransaction(connection) {
  await connection.rollback();
  connection.release();
}

module.exports = {
  pool,
  testConnection,
  query,
  getConnection,
  beginTransaction,
  commitTransaction,
  rollbackTransaction
}; 