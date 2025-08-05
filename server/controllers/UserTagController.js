const UserTag = require('../models/UserTag');
const Joi = require('joi');

class UserTagController {
  // 获取用户标签
  static async getUserTags(req, res) {
    try {
      const { id } = req.params;
      const { category } = req.query;
      
      const tags = await UserTag.getUserTags(id, category);
      
      res.json({
        success: true,
        data: tags
      });
    } catch (error) {
      console.error('获取用户标签失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户标签失败'
      });
    }
  }

  // 添加用户标签
  static async addUserTag(req, res) {
    try {
      const { id } = req.params;
      
      const schema = Joi.object({
        tag_name: Joi.string().required().max(50),
        tag_type: Joi.string().valid('auto', 'manual').default('manual'),
        tag_category: Joi.string().valid('cuisine', 'taste', 'style', 'skill').required(),
        confidence_score: Joi.number().min(0).max(1).default(1.0)
      });
      
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const result = await UserTag.create({
        user_id: id,
        ...value
      });
      
      res.json({
        success: true,
        data: result,
        message: '标签添加成功'
      });
    } catch (error) {
      console.error('添加用户标签失败:', error);
      res.status(500).json({
        success: false,
        message: '添加用户标签失败'
      });
    }
  }

  // 删除用户标签
  static async deleteUserTag(req, res) {
    try {
      const { id, tagName } = req.params;
      
      const deleted = await UserTag.delete(id, tagName);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: '标签不存在'
        });
      }
      
      res.json({
        success: true,
        message: '标签删除成功'
      });
    } catch (error) {
      console.error('删除用户标签失败:', error);
      res.status(500).json({
        success: false,
        message: '删除用户标签失败'
      });
    }
  }

  // 更新标签置信度
  static async updateTagConfidence(req, res) {
    try {
      const { id, tagName } = req.params;
      const { confidence_score } = req.body;
      
      if (confidence_score < 0 || confidence_score > 1) {
        return res.status(400).json({
          success: false,
          message: '置信度必须在0-1之间'
        });
      }
      
      const updated = await UserTag.updateConfidence(id, tagName, confidence_score);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: '标签不存在'
        });
      }
      
      res.json({
        success: true,
        message: '置信度更新成功'
      });
    } catch (error) {
      console.error('更新标签置信度失败:', error);
      res.status(500).json({
        success: false,
        message: '更新标签置信度失败'
      });
    }
  }

  // 自动生成用户标签
  static async generateUserTags(req, res) {
    try {
      const { id } = req.params;
      
      const generatedTags = await UserTag.generateAutoTags(id);
      
      res.json({
        success: true,
        data: generatedTags,
        message: `成功生成${generatedTags.length}个标签`
      });
    } catch (error) {
      console.error('自动生成用户标签失败:', error);
      res.status(500).json({
        success: false,
        message: '自动生成用户标签失败'
      });
    }
  }

  // 获取相似用户
  static async getSimilarUsers(req, res) {
    try {
      const { id } = req.params;
      const { limit = 10 } = req.query;
      
      const similarUsers = await UserTag.getSimilarUsers(id, parseInt(limit));
      
      res.json({
        success: true,
        data: similarUsers
      });
    } catch (error) {
      console.error('获取相似用户失败:', error);
      res.status(500).json({
        success: false,
        message: '获取相似用户失败'
      });
    }
  }

  // 获取热门标签
  static async getPopularTags(req, res) {
    try {
      const { category, limit = 20 } = req.query;
      
      const popularTags = await UserTag.getPopularTags(category, parseInt(limit));
      
      res.json({
        success: true,
        data: popularTags
      });
    } catch (error) {
      console.error('获取热门标签失败:', error);
      res.status(500).json({
        success: false,
        message: '获取热门标签失败'
      });
    }
  }

  // 清理低置信度标签
  static async cleanupUserTags(req, res) {
    try {
      const { id } = req.params;
      const { min_confidence = 0.3 } = req.query;
      
      const deletedCount = await UserTag.cleanupAutoTags(id, parseFloat(min_confidence));
      
      res.json({
        success: true,
        data: { deleted_count: deletedCount },
        message: `清理了${deletedCount}个低置信度标签`
      });
    } catch (error) {
      console.error('清理用户标签失败:', error);
      res.status(500).json({
        success: false,
        message: '清理用户标签失败'
      });
    }
  }

  // 获取用户标签统计
  static async getUserTagStats(req, res) {
    try {
      const { id } = req.params;
      
      const stats = await UserTag.getUserTagStats(id);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取用户标签统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取用户标签统计失败'
      });
    }
  }

  // 批量添加标签
  static async batchAddTags(req, res) {
    try {
      const { id } = req.params;
      const { tags } = req.body;
      
      const schema = Joi.array().items(Joi.object({
        tag_name: Joi.string().required().max(50),
        tag_type: Joi.string().valid('auto', 'manual').default('manual'),
        tag_category: Joi.string().valid('cuisine', 'taste', 'style', 'skill').required(),
        confidence_score: Joi.number().min(0).max(1).default(1.0)
      }));
      
      const { error, value } = schema.validate(tags);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const results = [];
      
      for (const tag of value) {
        const result = await UserTag.create({
          user_id: id,
          ...tag
        });
        results.push(result);
      }
      
      res.json({
        success: true,
        data: results,
        message: `成功添加${results.length}个标签`
      });
    } catch (error) {
      console.error('批量添加标签失败:', error);
      res.status(500).json({
        success: false,
        message: '批量添加标签失败'
      });
    }
  }

  // 根据标签推荐用户
  static async recommendUsersByTags(req, res) {
    try {
      const { tag_names } = req.query;
      
      if (!tag_names) {
        return res.status(400).json({
          success: false,
          message: '请提供标签名称'
        });
      }
      
      const tagArray = tag_names.split(',');
      const recommendations = [];
      
      for (const tagName of tagArray) {
        const users = await UserTag.getUsersByTag(tagName);
        recommendations.push({
          tag_name: tagName,
          users: users.slice(0, 10) // 限制每个标签返回10个用户
        });
      }
      
      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      console.error('根据标签推荐用户失败:', error);
      res.status(500).json({
        success: false,
        message: '根据标签推荐用户失败'
      });
    }
  }

  // 获取标签趋势
  static async getTagTrends(req, res) {
    try {
      const { days = 30 } = req.query;
      
      // 这里可以实现标签的时间趋势分析
      // 由于数据库结构限制，这里返回简化的数据
      
      const popularTags = await UserTag.getPopularTags(null, 20);
      
      res.json({
        success: true,
        data: {
          period: `${days}天`,
          trending_tags: popularTags
        }
      });
    } catch (error) {
      console.error('获取标签趋势失败:', error);
      res.status(500).json({
        success: false,
        message: '获取标签趋势失败'
      });
    }
  }
}

module.exports = UserTagController; 