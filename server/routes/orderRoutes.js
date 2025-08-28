// routes/requestRoutes.js - 请求路由
const express = require('express');
const router = express.Router();
const RequestController = require('../controllers/orderController');

// 获取请求列表
router.get('/', RequestController.getRequests);

// 获取请求统计
router.get('/stats', RequestController.getRequestStats);

// 获取今日统计
router.get('/stats/today', RequestController.getRequestStats);

// 获取状态统计
router.get('/stats/status', RequestController.getStatusStats);

// 根据请求编号获取请求详情
router.get('/request-no/:requestNo', RequestController.getRequestByRequestNo);

// 获取单个请求详情
router.get('/:id', RequestController.getRequest);

// 创建请求
router.post('/', RequestController.createRequest);

// 更新请求状态
router.patch('/:id/status', RequestController.updateRequestStatus);

// 删除请求
router.delete('/:id', RequestController.deleteRequest);

module.exports = router; 