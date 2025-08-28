const express = require('express');
const router = express.Router();
const ReminderController = require('../controllers/ReminderController');

// 订单提醒相关路由
router.post('/order', ReminderController.createOrderReminder);
router.get('/admin', ReminderController.getAdminReminders);
router.get('/admin/unread', ReminderController.getUnreadCount);
router.patch('/:id/read', ReminderController.markAsRead);
router.post('/batch/read', ReminderController.markMultipleAsRead);

// 原有提醒功能路由
router.post('/', ReminderController.createReminder);
router.get('/user/:user_id', ReminderController.getUserReminders);
router.get('/user/:user_id/upcoming', ReminderController.getUpcomingReminders);
router.post('/generate', ReminderController.generateRecipeReminders);
router.patch('/:reminder_id/complete', ReminderController.markAsCompleted);
router.patch('/:reminder_id/cancel', ReminderController.cancelReminder);
router.patch('/:reminder_id/time', ReminderController.updateReminderTime);
router.get('/user/:user_id/statistics', ReminderController.getStatistics);
router.get('/types', ReminderController.getReminderTypes);
router.delete('/:reminder_id', ReminderController.deleteReminder);

// 系统内部使用路由
router.get('/system/pending', ReminderController.getPendingReminders);
router.patch('/:reminder_id/sent', ReminderController.markAsSent);
router.post('/batch', ReminderController.batchProcessReminders);
router.delete('/system/cleanup', ReminderController.cleanupExpiredReminders);

module.exports = router; 