const express = require('express');
const router = express.Router();
const UserPlanFollow = require('../models/UserPlanFollow');
const Joi = require('joi');

class UserPlanFollowController {
  // 获取用户跟随的计划列表
  static async getUserFollowedPlans(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, status } = req.query;
      
      const plans = await UserPlanFollow.getUserFollowedPlans(id, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      });
      
      res.json({
        success: true,
        data: plans,
        message: '获取用户跟随计划成功'
      });
    } catch (error) {
      console.error('获取用户跟随计划失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户跟随计划失败'
      });
    }
  }

  // 获取用户跟随的计划详情
  static async getUserPlanFollow(req, res) {
    try {
      const { userId, planId } = req.params;
      
      const followDetail = await UserPlanFollow.getUserPlanFollow(userId, planId);
      
      if (!followDetail) {
        return res.status(404).json({
          success: false,
          message: '用户未跟随此计划'
        });
      }
      
      res.json({
        success: true,
        data: followDetail,
        message: '获取用户计划跟随详情成功'
      });
    } catch (error) {
      console.error('获取用户计划跟随详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户计划跟随详情失败'
      });
    }
  }

  // 获取用户今日计划任务
  static async getTodayTasks(req, res) {
    try {
      const { id } = req.params;
      
      const tasks = await UserPlanFollow.getUserTodayTasks(id);
      
      res.json({
        success: true,
        data: tasks,
        message: '获取今日计划任务成功'
      });
    } catch (error) {
      console.error('获取今日计划任务失败:', error);
      res.status(500).json({
        success: false,
        message: '获取今日计划任务失败'
      });
    }
  }

  // 获取用户跟随统计
  static async getUserFollowStats(req, res) {
    try {
      const { id } = req.params;
      
      const stats = await UserPlanFollow.getUserFollowStats(id);
      
      res.json({
        success: true,
        data: stats,
        message: '获取用户跟随统计成功'
      });
    } catch (error) {
      console.error('获取用户跟随统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户跟随统计失败'
      });
    }
  }

  // 暂停计划
  static async pausePlan(req, res) {
    try {
      const { userId, planId } = req.params;
      
      const result = await UserPlanFollow.pausePlan(userId, planId);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: '计划跟随记录不存在'
        });
      }
      
      res.json({
        success: true,
        message: '计划暂停成功'
      });
    } catch (error) {
      console.error('暂停计划失败:', error);
      res.status(500).json({
        success: false,
        message: '暂停计划失败'
      });
    }
  }

  // 恢复计划
  static async resumePlan(req, res) {
    try {
      const { userId, planId } = req.params;
      
      const result = await UserPlanFollow.resumePlan(userId, planId);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: '计划跟随记录不存在'
        });
      }
      
      res.json({
        success: true,
        message: '计划恢复成功'
      });
    } catch (error) {
      console.error('恢复计划失败:', error);
      res.status(500).json({
        success: false,
        message: '恢复计划失败'
      });
    }
  }

  // 取消计划
  static async cancelPlan(req, res) {
    try {
      const { userId, planId } = req.params;
      
      const result = await UserPlanFollow.cancelPlan(userId, planId);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: '计划跟随记录不存在'
        });
      }
      
      res.json({
        success: true,
        message: '计划取消成功'
      });
    } catch (error) {
      console.error('取消计划失败:', error);
      res.status(500).json({
        success: false,
        message: '取消计划失败'
      });
    }
  }

  // 检查是否跟随计划
  static async checkFollowStatus(req, res) {
    try {
      const { userId, planId } = req.params;
      
      const isFollowing = await UserPlanFollow.isFollowing(userId, planId);
      
      res.json({
        success: true,
        data: { is_following: isFollowing },
        message: '获取跟随状态成功'
      });
    } catch (error) {
      console.error('检查跟随状态失败:', error);
      res.status(500).json({
        success: false,
        message: '检查跟随状态失败'
      });
    }
  }
}

// 用户计划跟随路由
router.get('/users/:id/followed-plans', UserPlanFollowController.getUserFollowedPlans);    // 获取用户跟随的计划
router.get('/users/:userId/plans/:planId', UserPlanFollowController.getUserPlanFollow);    // 获取用户计划跟随详情
router.get('/users/:id/today-tasks', UserPlanFollowController.getTodayTasks);              // 获取今日计划任务
router.get('/users/:id/follow-stats', UserPlanFollowController.getUserFollowStats);        // 获取用户跟随统计
router.get('/users/:userId/plans/:planId/status', UserPlanFollowController.checkFollowStatus); // 检查跟随状态

// 计划状态管理
router.patch('/users/:userId/plans/:planId/pause', UserPlanFollowController.pausePlan);    // 暂停计划
router.patch('/users/:userId/plans/:planId/resume', UserPlanFollowController.resumePlan);  // 恢复计划
router.patch('/users/:userId/plans/:planId/cancel', UserPlanFollowController.cancelPlan);  // 取消计划

module.exports = router; 