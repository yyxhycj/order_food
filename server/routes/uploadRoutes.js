// routes/uploadRoutes.js - 文件上传路由
const express = require('express');
const router = express.Router();
const { uploadSingle, uploadMultiple, handleUpload } = require('../middleware/upload');

// 单文件上传
router.post('/single', uploadSingle('image'), handleUpload, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有文件被上传'
      });
    }

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        url: req.body.image
      },
      message: '文件上传成功'
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error.message
    });
  }
});

// 多文件上传
router.post('/multiple', uploadMultiple('images', 5), handleUpload, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有文件被上传'
      });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      url: `/${require('../config').upload.path}${file.filename}`
    }));

    res.json({
      success: true,
      data: {
        files: files,
        count: files.length
      },
      message: '文件上传成功'
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error.message
    });
  }
});

module.exports = router; 