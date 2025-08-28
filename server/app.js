// app.js - 主应用文件
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const db = require('./database/connection');

// 导入路由
const productRoutes = require('./routes/productRoutes');
const requestRoutes = require('./routes/orderRoutes'); // 重命名为请求路由
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const storeConfigRoutes = require('./routes/storeConfigRoutes');
const userRoutes = require('./routes/user');

// 导入新的路由
const recipeRoutes = require('./routes/recipes');
const userTagRoutes = require('./routes/user-tags');
const recipePlanRoutes = require('./routes/recipe-plans');
const userInteractionRoutes = require('./routes/user-interactions');
const userPlanFollowRoutes = require('./routes/user-plan-follows');

// 导入特色功能路由
const blindBoxRoutes = require('./routes/blind-box');
const reminderRoutes = require('./routes/reminders');
const homepageRoutes = require('./routes/homepage');
const gameRoutes = require('./routes/game');

// 导入商家功能升级路由
const inventoryRoutes = require('./routes/inventory');
const tasteAnalyticsRoutes = require('./routes/taste-analytics');
const customOrderRoutes = require('./routes/custom-orders');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, '../images')));

// API路由 - 核心功能（去商业化）
app.use('/api/dishes', productRoutes);  // 菜品路由
app.use('/api/requests', requestRoutes);  // 请求路由（原订单路由）
app.use('/api/categories', categoryRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/platform-config', storeConfigRoutes);  // 平台配置
app.use('/api/user', userRoutes);

// 新的API路由
app.use('/api/recipes', recipeRoutes);
app.use('/api/user-tags', userTagRoutes);
app.use('/api/recipe-plans', recipePlanRoutes);
app.use('/api/interactions', userInteractionRoutes);
app.use('/api/plan-follows', userPlanFollowRoutes);

// 特色功能API路由
app.use('/api/blind-box', blindBoxRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/homepage', homepageRoutes);
app.use('/api/game', gameRoutes);

// 商家功能升级API路由
app.use('/api/inventory', inventoryRoutes);
app.use('/api/taste-analytics', tasteAnalyticsRoutes);
app.use('/api/custom-orders', customOrderRoutes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '明星厨师show API服务',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      products: '/api/products',
      orders: '/api/orders',
      categories: '/api/categories',
      uploads: '/api/uploads',
      storeConfig: '/api/store-config',
      recipes: '/api/recipes',
      userTags: '/api/user-tags',
      recipePlans: '/api/recipe-plans',
      interactions: '/api/interactions',
      planFollows: '/api/plan-follows',
      blindBox: '/api/blind-box',
      reminders: '/api/reminders',
      homepage: '/api/homepage',
      game: '/api/game',
      inventory: '/api/inventory',
      tasteAnalytics: '/api/taste-analytics',
      customOrders: '/api/custom-orders'
    }
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: '服务器内部错误',
    message: err.message
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.path
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      console.error('❌ 数据库连接失败，服务器启动中止');
      process.exit(1);
    }

    // 启动服务器
    const server = app.listen(config.server.port, () => {
      console.log('🚀 服务器启动成功');
      console.log(`📍 服务地址: http://localhost:${config.server.port}`);
      console.log(`🌍 环境: ${config.server.env}`);
      console.log(`📊 API文档: http://localhost:${config.server.port}/`);
      console.log('✅ 服务器准备就绪');
    });

    // 优雅关闭
    const gracefulShutdown = () => {
      console.log('\n🛑 正在关闭服务器...');
      server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer();

module.exports = app; 