const express = require('express');
const router = express.Router();
const ReminderController = require('../controllers/ReminderController');

// 创建新的提醒
router.post('/', ReminderController.createReminder);

// 获取用户提醒列表
router.get('/user/:user_id', ReminderController.getUserReminders);

// 获取即将到来的提醒
router.get('/user/:user_id/upcoming', ReminderController.getUpcomingReminders);

// 智能生成菜谱提醒
router.post('/generate', ReminderController.generateRecipeReminders);

// 标记提醒为已完成
router.patch('/:reminder_id/complete', ReminderController.markAsCompleted);

// 取消提醒
router.patch('/:reminder_id/cancel', ReminderController.cancelReminder);

// 更新提醒时间
router.patch('/:reminder_id/time', ReminderController.updateReminderTime);

// 获取提醒统计信息
router.get('/user/:user_id/statistics', ReminderController.getStatistics);

// 获取提醒类型配置
router.get('/types', ReminderController.getReminderTypes);

// 删除提醒
router.delete('/:reminder_id', ReminderController.deleteReminder);

// 获取待发送的提醒（系统内部使用）
router.get('/system/pending', ReminderController.getPendingReminders);

// 标记提醒为已发送（系统内部使用）
router.patch('/:reminder_id/sent', ReminderController.markAsSent);

// 批量处理提醒
router.post('/batch', ReminderController.batchProcessReminders);

// 清理过期提醒
router.delete('/system/cleanup', ReminderController.cleanupExpiredReminders);

module.exports = router; 