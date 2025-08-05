// routes/storeConfigRoutes.js - 店铺配置路由
const express = require('express');
const router = express.Router();
const StoreConfigController = require('../controllers/storeConfigController');

// 获取店铺配置
router.get('/', StoreConfigController.getStoreConfig);

// 更新店铺配置
router.put('/', StoreConfigController.updateStoreConfig);

module.exports = router; 