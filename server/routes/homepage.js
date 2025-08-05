const express = require('express');
const router = express.Router();
const HomepageController = require('../controllers/HomepageController');
const multer = require('multer');
const path = require('path');

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'server/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 获取用户主页配置
router.get('/user/:user_id', HomepageController.getUserConfig);

// 更新用户主页配置
router.put('/user/:user_id', HomepageController.updateUserConfig);

// 重置用户主页配置为默认
router.post('/user/:user_id/reset', HomepageController.resetToDefault);

// 获取可用的主页模块
router.get('/sections', HomepageController.getAvailableSections);

// 获取布局样式选项
router.get('/layouts', HomepageController.getLayoutStyles);

// 获取主题颜色选项
router.get('/themes', HomepageController.getThemeColors);

// 获取用户个性化数据
router.get('/user/:user_id/data', HomepageController.getUserPersonalizedData);

// 更新模块显示状态
router.patch('/user/:user_id/sections/visibility', HomepageController.updateSectionVisibility);

// 更新模块排序
router.patch('/user/:user_id/sections/order', HomepageController.updateSectionOrder);

// 上传背景图片
router.post('/user/:user_id/background', upload.single('background'), HomepageController.uploadBackground);

// 上传vlog封面
router.post('/user/:user_id/vlog-cover', upload.single('vlogCover'), HomepageController.uploadVlogCover);

// 预览主页配置
router.post('/user/:user_id/preview', HomepageController.previewConfig);

// 获取主页配置模板
router.get('/templates', HomepageController.getConfigTemplates);

// 应用配置模板
router.post('/user/:user_id/apply-template', HomepageController.applyTemplate);

module.exports = router; 