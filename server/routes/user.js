const express = require('express');
const router = express.Router();

// 简单的用户配置文件API
router.get('/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 1,
      nickname: "美食爱好者",
      avatar: "/images/default-avatar.png",
      bio: "热爱美食，享受生活",
      cooking_level: "intermediate",
      recipe_count: 12,
      follower_count: 48,
      following_count: 32,
      total_likes: 156,
      is_verified: false,
      verification_type: null
    },
    message: "获取用户配置文件成功"
  });
});

// 用户统计API
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      tagCount: 8,
      collectionCount: 24,
      recipeCount: 12,
      reviewCount: 15
    },
    message: "获取用户统计成功"
  });
});

// 用户活动API
router.get('/activities', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        icon: "/images/recipe.png",
        description: "创建了新菜谱《宫保鸡丁》",
        time: "2小时前"
      },
      {
        id: 2,
        icon: "/images/like.png",
        description: "收到了5个新赞",
        time: "1天前"
      },
      {
        id: 3,
        icon: "/images/follow.png",
        description: "有3个新粉丝关注了你",
        time: "2天前"
      }
    ],
    message: "获取用户活动成功"
  });
});

// 更新用户配置文件API
router.put('/profile', (req, res) => {
  const { nickname, bio, cooking_level } = req.body;
  
  res.json({
    success: true,
    data: {
      id: 1,
      nickname: nickname || "美食爱好者",
      avatar: "/images/default-avatar.png",
      bio: bio || "热爱美食，享受生活",
      cooking_level: cooking_level || "intermediate",
      recipe_count: 12,
      follower_count: 48,
      following_count: 32,
      total_likes: 156,
      is_verified: false,
      verification_type: null
    },
    message: "更新用户配置文件成功"
  });
});

// 通知设置API
router.put('/notification-settings', (req, res) => {
  const { enabled } = req.body;
  
  res.json({
    success: true,
    data: {
      notificationEnabled: enabled
    },
    message: "更新通知设置成功"
  });
});

// 用户标签API
router.get('/tags', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        tag_name: "川菜",
        tag_category: "cuisine",
        tag_type: "manual",
        confidence_score: 0.8,
        fontSize: 32,
        opacity: 0.9
      },
      {
        id: 2,
        tag_name: "辣味",
        tag_category: "taste",
        tag_type: "auto",
        confidence_score: 0.9,
        fontSize: 36,
        opacity: 1.0
      },
      {
        id: 3,
        tag_name: "家常菜",
        tag_category: "style",
        tag_type: "manual",
        confidence_score: 1.0,
        fontSize: 40,
        opacity: 1.0
      }
    ],
    message: "获取用户标签成功"
  });
});

// 添加用户标签API
router.post('/tags', (req, res) => {
  const { tag_name, tag_type, tag_category, confidence_score } = req.body;
  
  if (!tag_name) {
    return res.status(400).json({
      success: false,
      message: "标签名称不能为空"
    });
  }
  
  res.status(201).json({
    success: true,
    data: {
      id: Date.now(), // 简单的ID生成
      tag_name,
      tag_type: tag_type || 'manual',
      tag_category: tag_category || 'custom',
      confidence_score: confidence_score || 1.0,
      created_at: new Date().toISOString()
    },
    message: "添加标签成功"
  });
});

// 删除用户标签API
router.delete('/tags/:id', (req, res) => {
  const tagId = req.params.id;
  
  res.json({
    success: true,
    data: {
      id: tagId,
      deleted: true
    },
    message: "删除标签成功"
  });
});

// 更新用户标签API
router.put('/tags/:id', (req, res) => {
  const tagId = req.params.id;
  const updateData = req.body;
  
  res.json({
    success: true,
    data: {
      id: tagId,
      ...updateData,
      updated_at: new Date().toISOString()
    },
    message: "更新标签成功"
  });
});

// 生成用户标签API
router.post('/tags/generate', (req, res) => {
  const { source } = req.body;
  
  // 模拟生成的标签数据
  const generatedTags = [
    {
      id: Date.now() + 1,
      tag_name: "蒸菜",
      tag_category: "skill",
      tag_type: "auto",
      confidence_score: 0.75,
      source: source
    },
    {
      id: Date.now() + 2,
      tag_name: "清淡",
      tag_category: "taste",
      tag_type: "auto",
      confidence_score: 0.85,
      source: source
    }
  ];
  
  res.json({
    success: true,
    data: generatedTags,
    message: `从${source}生成标签成功`
  });
});

// 一键生成所有标签API
router.post('/tags/generate-all', (req, res) => {
  // 模拟批量生成标签
  const allGeneratedTags = [
    { tag_name: "蒸菜", tag_category: "skill", source: "recipes" },
    { tag_name: "清淡", tag_category: "taste", source: "orders" },
    { tag_name: "营养", tag_category: "style", source: "reviews" },
    { tag_name: "煲汤", tag_category: "skill", source: "recipes" }
  ];
  
  res.json({
    success: true,
    data: {
      totalGenerated: allGeneratedTags.length,
      tags: allGeneratedTags,
      sources: {
        recipes: 2,
        orders: 1,
        reviews: 1
      }
    },
    message: "批量生成标签成功"
  });
});

// 用户标签推荐API
router.get('/tags/recommendations', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 101,
        tag_name: "粤菜",
        tag_category: "cuisine",
        confidence_score: 0.85,
        reason: "基于您的订餐历史"
      },
      {
        id: 102,
        tag_name: "甜味",
        tag_category: "taste",
        confidence_score: 0.75,
        reason: "基于您的菜谱偏好"
      },
      {
        id: 103,
        tag_name: "快手菜",
        tag_category: "style",
        confidence_score: 0.90,
        reason: "基于您的浏览习惯"
      },
      {
        id: 104,
        tag_name: "炒菜",
        tag_category: "skill",
        confidence_score: 0.80,
        reason: "基于您的制作记录"
      }
    ],
    message: "获取推荐标签成功"
  });
});

// 用户标签历史API
router.get('/tags/history', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        action: "add",
        tag_name: "川菜",
        tag_category: "cuisine",
        timestamp: "2024-01-15T10:30:00Z",
        source: "manual"
      },
      {
        id: 2,
        action: "generate",
        tag_name: "辣味",
        tag_category: "taste",
        timestamp: "2024-01-14T16:20:00Z",
        source: "order_analysis"
      },
      {
        id: 3,
        action: "update",
        tag_name: "家常菜",
        tag_category: "style",
        timestamp: "2024-01-13T09:15:00Z",
        source: "recipe_analysis"
      },
      {
        id: 4,
        action: "delete",
        tag_name: "烘焙",
        tag_category: "skill",
        timestamp: "2024-01-12T14:45:00Z",
        source: "manual"
      }
    ],
    message: "获取标签历史成功"
  });
});

// 用户标签统计API
router.get('/tags/statistics', (req, res) => {
  res.json({
    success: true,
    data: {
      cuisine: {
        count: 3,
        tags: ["川菜", "粤菜", "湘菜"],
        distribution: {
          "川菜": 45,
          "粤菜": 30,
          "湘菜": 25
        }
      },
      taste: {
        count: 4,
        tags: ["辣味", "甜味", "清淡", "酸辣"],
        distribution: {
          "辣味": 40,
          "甜味": 25,
          "清淡": 20,
          "酸辣": 15
        }
      },
      style: {
        count: 2,
        tags: ["家常菜", "快手菜"],
        distribution: {
          "家常菜": 60,
          "快手菜": 40
        }
      },
      skill: {
        count: 3,
        tags: ["炒菜", "蒸菜", "煲汤"],
        distribution: {
          "炒菜": 50,
          "蒸菜": 30,
          "煲汤": 20
        }
      },
      total_tags: 12,
      auto_generated: 8,
      manual_added: 4,
      last_updated: "2024-01-15T10:30:00Z"
    },
    message: "获取标签统计成功"
  });
});

// 上传头像API
router.post('/avatar', (req, res) => {
  // 这里应该处理文件上传，暂时返回模拟数据
  res.json({
    success: true,
    data: {
      avatar_url: "/images/default-avatar.png"
    },
    message: "头像上传成功"
  });
});

module.exports = router; 