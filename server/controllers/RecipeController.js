const Recipe = require('../models/Recipe');
const RecipeReview = require('../models/RecipeReview');
const Joi = require('joi');

class RecipeController {
  // 获取菜谱列表
  static async getRecipes(req, res) {
    try {
      const { page = 1, limit = 10, category_id, difficulty, creator_id, 
              search, sort_by = 'created_at', sort_order = 'DESC' } = req.query;
      
      const recipes = await Recipe.getList({
        page: parseInt(page),
        limit: parseInt(limit),
        category_id: category_id ? parseInt(category_id) : null,
        difficulty,
        creator_id: creator_id ? parseInt(creator_id) : null,
        search,
        sort_by,
        sort_order
      });
      
      res.json({
        success: true,
        data: recipes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: recipes.length === parseInt(limit)
        }
      });
    } catch (error) {
      console.error('获取菜谱列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取菜谱列表失败'
      });
    }
  }

  // 获取菜谱详情
  static async getRecipeById(req, res) {
    try {
      const { id } = req.params;
      
      const recipe = await Recipe.getById(id);
      
      if (!recipe) {
        return res.status(404).json({
          success: false,
          message: '菜谱不存在'
        });
      }
      
      // 记录浏览量
      await Recipe.incrementView(id);
      
      // 获取评价统计
      const reviewStats = await RecipeReview.getRecipeRatingStats(id);
      
      res.json({
        success: true,
        data: {
          ...recipe,
          review_stats: reviewStats
        }
      });
    } catch (error) {
      console.error('获取菜谱详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取菜谱详情失败'
      });
    }
  }

  // 创建菜谱
  static async createRecipe(req, res) {
    try {
      // 验证数据
      const schema = Joi.object({
        name: Joi.string().required().max(100),
        description: Joi.string().allow(''),
        ingredients: Joi.array().items(Joi.string()).required(),
        steps: Joi.array().items(Joi.object({
          step: Joi.number().required(),
          description: Joi.string().required()
        })).required(),
        cooking_time: Joi.number().integer().min(1),
        difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
        category_id: Joi.number().integer().required(),
        main_image: Joi.string().allow(''),
        step_images: Joi.array().items(Joi.string()).default([]),
        video_url: Joi.string().allow(''),
        nutrition_info: Joi.object().default({}),
        seasonal_tags: Joi.string().allow('')
      });
      
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const recipeId = await Recipe.create({
        ...value,
        creator_id: req.user?.id || 1 // 临时使用默认用户ID
      });
      
      res.json({
        success: true,
        data: { id: recipeId },
        message: '菜谱创建成功'
      });
    } catch (error) {
      console.error('创建菜谱失败:', error);
      res.status(500).json({
        success: false,
        message: '创建菜谱失败'
      });
    }
  }

  // 更新菜谱
  static async updateRecipe(req, res) {
    try {
      const { id } = req.params;
      
      // 验证数据
      const schema = Joi.object({
        name: Joi.string().max(100),
        description: Joi.string().allow(''),
        ingredients: Joi.array().items(Joi.string()),
        steps: Joi.array().items(Joi.object({
          step: Joi.number().required(),
          description: Joi.string().required()
        })),
        cooking_time: Joi.number().integer().min(1),
        difficulty: Joi.string().valid('easy', 'medium', 'hard'),
        category_id: Joi.number().integer(),
        main_image: Joi.string().allow(''),
        step_images: Joi.array().items(Joi.string()),
        video_url: Joi.string().allow(''),
        nutrition_info: Joi.object(),
        seasonal_tags: Joi.string().allow('')
      });
      
      const { error, value } = schema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      const updated = await Recipe.update(id, value);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: '菜谱不存在'
        });
      }
      
      res.json({
        success: true,
        message: '菜谱更新成功'
      });
    } catch (error) {
      console.error('更新菜谱失败:', error);
      res.status(500).json({
        success: false,
        message: '更新菜谱失败'
      });
    }
  }

  // 删除菜谱
  static async deleteRecipe(req, res) {
    try {
      const { id } = req.params;
      
      const deleted = await Recipe.delete(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: '菜谱不存在'
        });
      }
      
      res.json({
        success: true,
        message: '菜谱删除成功'
      });
    } catch (error) {
      console.error('删除菜谱失败:', error);
      res.status(500).json({
        success: false,
        message: '删除菜谱失败'
      });
    }
  }

  // 更新菜谱状态
  static async updateRecipeStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['active', 'inactive', 'draft'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '状态参数无效'
        });
      }
      
      const updated = await Recipe.updateStatus(id, status);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          message: '菜谱不存在'
        });
      }
      
      res.json({
        success: true,
        message: '状态更新成功'
      });
    } catch (error) {
      console.error('更新菜谱状态失败:', error);
      res.status(500).json({
        success: false,
        message: '更新菜谱状态失败'
      });
    }
  }

  // 菜谱点赞
  static async likeRecipe(req, res) {
    try {
      const { id } = req.params;
      const { action = 'like' } = req.body; // like 或 unlike
      
      const increment = action === 'like';
      await Recipe.updateLikeCount(id, increment);
      
      res.json({
        success: true,
        message: increment ? '点赞成功' : '取消点赞'
      });
    } catch (error) {
      console.error('菜谱点赞失败:', error);
      res.status(500).json({
        success: false,
        message: '操作失败'
      });
    }
  }

  // 菜谱收藏
  static async collectRecipe(req, res) {
    try {
      const { id } = req.params;
      const { action = 'collect' } = req.body; // collect 或 uncollect
      
      const increment = action === 'collect';
      await Recipe.updateCollectCount(id, increment);
      
      res.json({
        success: true,
        message: increment ? '收藏成功' : '取消收藏'
      });
    } catch (error) {
      console.error('菜谱收藏失败:', error);
      res.status(500).json({
        success: false,
        message: '操作失败'
      });
    }
  }

  // 获取热门菜谱
  static async getPopularRecipes(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      const recipes = await Recipe.getPopular(parseInt(limit));
      
      res.json({
        success: true,
        data: recipes
      });
    } catch (error) {
      console.error('获取热门菜谱失败:', error);
      res.status(500).json({
        success: false,
        message: '获取热门菜谱失败'
      });
    }
  }

  // 获取推荐菜谱
  static async getRecommendedRecipes(req, res) {
    try {
      const { user_id, limit = 10 } = req.query;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const recipes = await Recipe.getRecommended(user_id, parseInt(limit));
      
      res.json({
        success: true,
        data: recipes,
        message: '获取推荐菜谱成功'
      });
    } catch (error) {
      console.error('获取推荐菜谱失败:', error);
      res.status(500).json({
        success: false,
        message: '获取推荐菜谱失败'
      });
    }
  }

  // 获取相似菜谱
  static async getSimilarRecipes(req, res) {
    try {
      const { id } = req.params;
      const { limit = 5 } = req.query;
      
      const similarRecipes = await Recipe.getSimilarRecipes(id, parseInt(limit));
      
      res.json({
        success: true,
        data: similarRecipes,
        message: '获取相似菜谱成功'
      });
    } catch (error) {
      console.error('获取相似菜谱失败:', error);
      res.status(500).json({
        success: false,
        message: '获取相似菜谱失败'
      });
    }
  }

  // 实时推荐引擎
  static async getRealtimeRecommendations(req, res) {
    try {
      const { user_id, context = {} } = req.body;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const recommendations = await this.generateRealtimeRecommendations(user_id, context);
      
      res.json({
        success: true,
        data: recommendations,
        message: '获取实时推荐成功'
      });
    } catch (error) {
      console.error('获取实时推荐失败:', error);
      res.status(500).json({
        success: false,
        message: '获取实时推荐失败'
      });
    }
  }

  // 个性化菜谱生成
  static async generatePersonalizedRecipe(req, res) {
    try {
      const { user_id, preferences = {}, requirements = {} } = req.body;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      const personalizedRecipe = await this.createPersonalizedRecipe(user_id, preferences, requirements);
      
      res.json({
        success: true,
        data: personalizedRecipe,
        message: '个性化菜谱生成成功'
      });
    } catch (error) {
      console.error('个性化菜谱生成失败:', error);
      res.status(500).json({
        success: false,
        message: '个性化菜谱生成失败'
      });
    }
  }

  // 推荐食材接口
  static async getRecommendedIngredients(req, res) {
    try {
      const { user_id, existing_ingredients = [] } = req.query;
      
      const recommendedIngredients = await this.generateIngredientsRecommendations(user_id, existing_ingredients);
      
      res.json({
        success: true,
        data: recommendedIngredients,
        message: '获取推荐食材成功'
      });
    } catch (error) {
      console.error('获取推荐食材失败:', error);
      res.status(500).json({
        success: false,
        message: '获取推荐食材失败'
      });
    }
  }

  // 获取菜谱统计
  static async getRecipeStats(req, res) {
    try {
      const stats = await Recipe.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取菜谱统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取菜谱统计失败'
      });
    }
  }

  // 智能菜谱生成
  static async generateRecipe(req, res) {
    try {
      const { ingredients = [], preferences = {}, difficulty = 'medium' } = req.body;
      
      if (!ingredients.length) {
        return res.status(400).json({
          success: false,
          message: '请提供至少一个食材'
        });
      }
      
      // 基于规则的菜谱生成逻辑
      const generatedRecipe = await this.generateRecipeByRules(ingredients, preferences, difficulty);
      
      res.json({
        success: true,
        data: generatedRecipe,
        message: '菜谱生成成功'
      });
    } catch (error) {
      console.error('智能菜谱生成失败:', error);
      res.status(500).json({
        success: false,
        message: '菜谱生成失败'
      });
    }
  }

  // 基于规则的菜谱生成
  static async generateRecipeByRules(ingredients, preferences, difficulty) {
    // 食材搭配规则
    const ingredientRules = {
      protein: ['鸡肉', '牛肉', '猪肉', '鱼肉', '豆腐', '鸡蛋'],
      vegetables: ['西兰花', '胡萝卜', '土豆', '洋葱', '青菜', '番茄'],
      seasonings: ['盐', '胡椒', '生抽', '老抽', '料酒', '蒜', '姜'],
      compatibility: {
        '鸡肉': ['西兰花', '胡萝卜', '土豆', '洋葱'],
        '牛肉': ['洋葱', '土豆', '胡萝卜', '青菜'],
        '猪肉': ['青菜', '土豆', '洋葱', '胡萝卜'],
        '豆腐': ['青菜', '番茄', '洋葱'],
        '鸡蛋': ['番茄', '青菜', '洋葱']
      }
    };
    
    // 基于主食材生成菜谱
    const mainIngredient = ingredients[0];
    const compatibleIngredients = ingredientRules.compatibility[mainIngredient] || [];
    
    // 生成菜谱名称
    const recipeName = `${mainIngredient}${compatibleIngredients[0] || ''}`;
    
    // 生成制作步骤
    const steps = this.generateCookingSteps(mainIngredient, compatibleIngredients, difficulty);
    
    // 生成营养信息
    const nutritionInfo = this.generateNutritionInfo(ingredients);
    
    // 估算烹饪时间
    const cookingTime = this.estimateCookingTime(ingredients, difficulty);
    
    return {
      name: recipeName,
      description: `美味的${recipeName}，营养丰富，制作简单`,
      ingredients: [...ingredients, ...ingredientRules.seasonings.slice(0, 3)],
      steps,
      cooking_time: cookingTime,
      difficulty,
      nutrition_info: nutritionInfo,
      generated: true
    };
  }

  // 生成制作步骤
  static generateCookingSteps(mainIngredient, compatibleIngredients, difficulty) {
    const basicSteps = [
      { step: 1, description: `准备${mainIngredient}，清洗干净` },
      { step: 2, description: `${compatibleIngredients[0] || '配菜'}洗净切好` },
      { step: 3, description: '热锅下油，爆香蒜姜' },
      { step: 4, description: `下${mainIngredient}炒制` },
      { step: 5, description: `加入${compatibleIngredients[0] || '配菜'}一起炒` },
      { step: 6, description: '调味后即可出锅' }
    ];
    
    if (difficulty === 'hard') {
      basicSteps.splice(3, 0, { step: 4, description: '腌制入味15分钟' });
      basicSteps.splice(6, 0, { step: 7, description: '小火焖煮10分钟' });
    }
    
    return basicSteps;
  }

  // 生成营养信息
  static generateNutritionInfo(ingredients) {
    const nutritionMap = {
      '鸡肉': { protein: 20, fat: 8, carbs: 0, calories: 140 },
      '牛肉': { protein: 22, fat: 10, carbs: 0, calories: 160 },
      '猪肉': { protein: 18, fat: 15, carbs: 0, calories: 200 },
      '豆腐': { protein: 8, fat: 4, carbs: 2, calories: 70 },
      '鸡蛋': { protein: 12, fat: 10, carbs: 1, calories: 140 },
      '西兰花': { protein: 3, fat: 0, carbs: 7, calories: 25 },
      '胡萝卜': { protein: 1, fat: 0, carbs: 10, calories: 40 },
      '土豆': { protein: 2, fat: 0, carbs: 17, calories: 77 }
    };
    
    let totalNutrition = { protein: 0, fat: 0, carbs: 0, calories: 0 };
    
    ingredients.forEach(ingredient => {
      const nutrition = nutritionMap[ingredient];
      if (nutrition) {
        totalNutrition.protein += nutrition.protein;
        totalNutrition.fat += nutrition.fat;
        totalNutrition.carbs += nutrition.carbs;
        totalNutrition.calories += nutrition.calories;
      }
    });
    
    return totalNutrition;
  }

  // 估算烹饪时间
  static estimateCookingTime(ingredients, difficulty) {
    const baseTime = 15; // 基础时间15分钟
    const ingredientTime = ingredients.length * 2; // 每个食材增加2分钟
    const difficultyMultiplier = { easy: 1, medium: 1.2, hard: 1.5 };
    
    return Math.round(baseTime + ingredientTime * difficultyMultiplier[difficulty]);
  }

  // 生成实时推荐
  static async generateRealtimeRecommendations(userId, context) {
    try {
      // 获取用户当前行为上下文
      const userContext = await this.getUserContext(userId, context);
      
      // 基于上下文调整推荐权重
      const contextualRecommendations = await Recipe.getContextualRecommendations(userId, userContext);
      
      // 多样性控制
      const diversifiedRecommendations = this.ensureRecommendationDiversity(contextualRecommendations);
      
      return diversifiedRecommendations;
    } catch (error) {
      console.error('生成实时推荐失败:', error);
      throw error;
    }
  }

  // 创建个性化菜谱
  static async createPersonalizedRecipe(userId, preferences, requirements) {
    try {
      // 获取用户档案
      const userProfile = await Recipe.getUserTasteProfile(userId);
      
      // 合并用户偏好和要求
      const mergedPreferences = {
        ...userProfile,
        ...preferences,
        requirements
      };
      
      // 智能食材选择
      const selectedIngredients = await this.selectIngredientsForUser(userProfile, requirements);
      
      // 生成个性化菜谱
      const personalizedRecipe = await this.generateRecipeByRules(
        selectedIngredients,
        mergedPreferences,
        userProfile.cooking_skill_level
      );
      
      // 添加个性化标记
      personalizedRecipe.is_personalized = true;
      personalizedRecipe.user_id = userId;
      personalizedRecipe.generation_context = {
        user_preferences: mergedPreferences,
        generation_time: new Date().toISOString()
      };
      
      return personalizedRecipe;
    } catch (error) {
      console.error('创建个性化菜谱失败:', error);
      throw error;
    }
  }

  // 为用户选择食材
  static async selectIngredientsForUser(userProfile, requirements) {
    const ingredientCategories = {
      protein: ['鸡肉', '牛肉', '猪肉', '鱼肉', '豆腐', '鸡蛋', '虾'],
      vegetables: ['西兰花', '胡萝卜', '土豆', '洋葱', '青菜', '番茄', '黄瓜', '茄子'],
      carbs: ['米饭', '面条', '土豆', '红薯', '面包'],
      seasonings: ['盐', '胡椒', '生抽', '老抽', '料酒', '蒜', '姜', '葱']
    };
    
    const selectedIngredients = [];
    
    // 基于用户口味偏好选择主食材
    if (userProfile.cuisine_preferences.includes('chinese')) {
      selectedIngredients.push('鸡肉', '青菜');
    }
    
    // 基于辣度偏好选择调料
    if (userProfile.spice_level === 'spicy') {
      selectedIngredients.push('辣椒', '花椒');
    }
    
    // 基于饮食限制过滤
    const filteredIngredients = selectedIngredients.filter(ingredient => {
      return !userProfile.allergies.includes(ingredient) &&
             !userProfile.dietary_restrictions.includes(ingredient);
    });
    
    // 补充基础食材
    if (filteredIngredients.length < 3) {
      filteredIngredients.push(...ingredientCategories.vegetables.slice(0, 2));
      filteredIngredients.push(...ingredientCategories.seasonings.slice(0, 3));
    }
    
    return [...new Set(filteredIngredients)]; // 去重
  }

  // 生成食材推荐
  static async generateIngredientsRecommendations(userId, existingIngredients) {
    try {
      // 获取用户档案
      const userProfile = await Recipe.getUserTasteProfile(userId);
      
      // 食材搭配规则
      const ingredientPairings = {
        '鸡肉': ['蘑菇', '土豆', '胡萝卜', '洋葱', '青椒'],
        '牛肉': ['洋葱', '土豆', '胡萝卜', '西兰花', '芹菜'],
        '猪肉': ['白菜', '土豆', '茄子', '豆角', '青椒'],
        '鱼肉': ['番茄', '豆腐', '冬瓜', '萝卜', '葱'],
        '豆腐': ['青菜', '蘑菇', '番茄', '韭菜', '葱'],
        '鸡蛋': ['番茄', '韭菜', '黄瓜', '青椒', '洋葱']
      };
      
      const recommendations = [];
      
      // 基于现有食材推荐搭配
      for (const ingredient of existingIngredients) {
        const pairings = ingredientPairings[ingredient];
        if (pairings) {
          recommendations.push(...pairings);
        }
      }
      
      // 基于用户偏好推荐
      if (userProfile.spice_level === 'spicy') {
        recommendations.push('辣椒', '花椒', '生姜');
      }
      
      // 基于季节推荐
      const currentSeason = Recipe.getCurrentSeason();
      const seasonalIngredients = {
        spring: ['春笋', '豌豆', '菠菜', '韭菜'],
        summer: ['番茄', '黄瓜', '茄子', '丝瓜'],
        autumn: ['南瓜', '冬瓜', '萝卜', '白菜'],
        winter: ['大白菜', '萝卜', '土豆', '洋葱']
      };
      
      recommendations.push(...seasonalIngredients[currentSeason]);
      
      // 去重并过滤已有食材
      const uniqueRecommendations = [...new Set(recommendations)]
        .filter(ingredient => !existingIngredients.includes(ingredient))
        .filter(ingredient => !userProfile.allergies.includes(ingredient));
      
      return uniqueRecommendations.slice(0, 10);
    } catch (error) {
      console.error('生成食材推荐失败:', error);
      throw error;
    }
  }

  // 获取用户上下文
  static async getUserContext(userId, context) {
    return {
      current_time: new Date().getHours(),
      day_of_week: new Date().getDay(),
      season: Recipe.getCurrentSeason(),
      recent_views: context.recent_views || [],
      current_location: context.location || null,
      weather: context.weather || null,
      meal_time: this.getCurrentMealTime()
    };
  }

  // 获取当前餐次
  static getCurrentMealTime() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) return 'breakfast';
    if (hour >= 11 && hour < 14) return 'lunch';
    if (hour >= 17 && hour < 20) return 'dinner';
    return 'snack';
  }

  // 确保推荐多样性
  static ensureRecommendationDiversity(recommendations) {
    const categories = {};
    const diversifiedRecommendations = [];
    
    for (const recipe of recommendations) {
      const category = recipe.category_name || 'other';
      if (!categories[category]) {
        categories[category] = 0;
      }
      
      // 每个类别最多推荐2个
      if (categories[category] < 2) {
        categories[category]++;
        diversifiedRecommendations.push(recipe);
      }
    }
    
    return diversifiedRecommendations;
  }

  // 获取趋势菜谱
  static async getTrendingRecipes(req, res) {
    try {
      const { limit = 10 } = req.query;
      
      const trendingRecipes = await Recipe.getTrendingRecipes(parseInt(limit));
      
      res.json({
        success: true,
        data: trendingRecipes,
        message: '获取趋势菜谱成功'
      });
    } catch (error) {
      console.error('获取趋势菜谱失败:', error);
      res.status(500).json({
        success: false,
        message: '获取趋势菜谱失败'
      });
    }
  }

  // 获取流行度排名
  static async getPopularityRanking(req, res) {
    try {
      const { limit = 20 } = req.query;
      
      const popularityRanking = await Recipe.getPopularityRanking(parseInt(limit));
      
      res.json({
        success: true,
        data: popularityRanking,
        message: '获取流行度排名成功'
      });
    } catch (error) {
      console.error('获取流行度排名失败:', error);
      res.status(500).json({
        success: false,
        message: '获取流行度排名失败'
      });
    }
  }

  // 记录菜谱浏览
  static async viewRecipe(req, res) {
    try {
      const { id } = req.params;
      
      const success = await Recipe.incrementViewCount(id);
      
      if (success) {
        res.json({
          success: true,
          message: '浏览记录成功'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '浏览记录失败'
        });
      }
    } catch (error) {
      console.error('记录浏览失败:', error);
      res.status(500).json({
        success: false,
        message: '记录浏览失败'
      });
    }
  }

  // 菜谱点赞
  static async likeRecipe(req, res) {
    try {
      const { id } = req.params;
      
      const success = await Recipe.incrementLikeCount(id);
      
      if (success) {
        res.json({
          success: true,
          message: '点赞成功'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '点赞失败'
        });
      }
    } catch (error) {
      console.error('点赞失败:', error);
      res.status(500).json({
        success: false,
        message: '点赞失败'
      });
    }
  }

  // 菜谱收藏
  static async collectRecipe(req, res) {
    try {
      const { id } = req.params;
      
      const success = await Recipe.incrementCollectCount(id);
      
      if (success) {
        res.json({
          success: true,
          message: '收藏成功'
        });
      } else {
        res.status(500).json({
          success: false,
          message: '收藏失败'
        });
      }
    } catch (error) {
      console.error('收藏失败:', error);
      res.status(500).json({
        success: false,
        message: '收藏失败'
      });
    }
  }

  // 获取菜谱推荐摘要
  static async getRecommendationSummary(req, res) {
    try {
      const { user_id } = req.query;
      
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: '用户ID不能为空'
        });
      }
      
      // 并行获取多种推荐
      const [
        personalizedRecommendations,
        trendingRecipes,
        popularRecipes
      ] = await Promise.all([
        Recipe.getRecommended(user_id, 5),
        Recipe.getTrendingRecipes(5),
        Recipe.getPopularityRanking(5)
      ]);
      
      res.json({
        success: true,
        data: {
          personalized: personalizedRecommendations,
          trending: trendingRecipes,
          popular: popularRecipes
        },
        message: '获取推荐摘要成功'
      });
    } catch (error) {
      console.error('获取推荐摘要失败:', error);
      res.status(500).json({
        success: false,
        message: '获取推荐摘要失败'
      });
    }
  }
}

module.exports = RecipeController; 