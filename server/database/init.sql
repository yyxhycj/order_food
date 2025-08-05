-- 菜谱共享点餐小程序数据库初始化脚本
-- 版本: 2.0
-- 创建日期: 2025年

-- 创建数据库
CREATE DATABASE IF NOT EXISTS little_order CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE little_order;

-- ========== 基础表结构 ==========

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '分类名称',
  description TEXT COMMENT '分类描述',
  icon VARCHAR(255) COMMENT '分类图标',
  sort INT DEFAULT 0 COMMENT '排序',
  status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 用户表（扩展后）
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(100) UNIQUE COMMENT '微信openid',
  nickname VARCHAR(100) COMMENT '用户昵称',
  avatar VARCHAR(255) COMMENT '用户头像',
  phone VARCHAR(20) COMMENT '用户电话',
  bio TEXT COMMENT '个人简介',
  cooking_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner' COMMENT '烹饪等级',
  recipe_count INT DEFAULT 0 COMMENT '菜谱数量',
  follower_count INT DEFAULT 0 COMMENT '关注者数量',
  following_count INT DEFAULT 0 COMMENT '关注数量',
  total_likes INT DEFAULT 0 COMMENT '总获赞数',
  is_verified BOOLEAN DEFAULT FALSE COMMENT '是否认证',
  verification_type ENUM('chef', 'nutritionist', 'blogger') COMMENT '认证类型',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 商品表改为菜单项目表（扩展后）
CREATE TABLE IF NOT EXISTS menu_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '商品名称',
  description TEXT COMMENT '商品描述',
  image VARCHAR(255) COMMENT '商品图片',
  category_id INT NOT NULL COMMENT '分类ID',
  recipe_id INT COMMENT '关联菜谱ID',
  ingredients TEXT COMMENT '食材列表',
  nutrition_info TEXT COMMENT '营养信息',
  cooking_method VARCHAR(50) COMMENT '烹饪方法',
  spice_level ENUM('mild', 'medium', 'spicy') COMMENT '辣度等级',
  allergen_info TEXT COMMENT '过敏原信息',
  customizable BOOLEAN DEFAULT FALSE COMMENT '是否可定制',
  prep_time INT COMMENT '准备时间（分钟）',
  rating DECIMAL(3,2) DEFAULT 0.00 COMMENT '评分',
  review_count INT DEFAULT 0 COMMENT '评价数量',
  status ENUM('available', 'unavailable') DEFAULT 'available' COMMENT '状态',
  sort INT DEFAULT 0 COMMENT '排序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 订单表（扩展后）
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(50) UNIQUE NOT NULL COMMENT '订单编号',
  user_id VARCHAR(50) COMMENT '用户ID',
  user_name VARCHAR(50) NOT NULL COMMENT '用户姓名',
  user_phone VARCHAR(20) NOT NULL COMMENT '用户电话',
  status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '订单状态',
  pickup_time DATETIME COMMENT '取餐时间',
  remark TEXT COMMENT '备注',
  customization_info TEXT COMMENT '定制信息（JSON格式）',
  dietary_notes TEXT COMMENT '饮食备注',
  estimated_prep_time INT COMMENT '预估准备时间',
  actual_prep_time INT COMMENT '实际准备时间',
  customer_rating DECIMAL(3,2) COMMENT '客户评分',
  customer_review TEXT COMMENT '客户评价',
  is_repeat_order BOOLEAN DEFAULT FALSE COMMENT '是否重复订单',
  original_order_id INT COMMENT '原始订单ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 订单详情表（扩展后）
CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL COMMENT '订单ID',
  product_id INT NOT NULL COMMENT '商品ID',
  product_name VARCHAR(100) NOT NULL COMMENT '商品名称',
  quantity INT NOT NULL COMMENT '数量',
  customization_details TEXT COMMENT '定制化详情（JSON格式）',
  custom_price DECIMAL(10,2) DEFAULT 0.00 COMMENT '定制价格',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '管理员用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码',
  name VARCHAR(50) NOT NULL COMMENT '管理员姓名',
  status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 店铺配置表
CREATE TABLE IF NOT EXISTS store_config (
  id INT PRIMARY KEY AUTO_INCREMENT,
  store_name VARCHAR(100) NOT NULL DEFAULT '明星厨师show' COMMENT '店铺名称',
  store_subtitle VARCHAR(100) DEFAULT '(菜谱共享点餐)' COMMENT '店铺副标题',
  store_rating DECIMAL(2,1) DEFAULT 4.6 COMMENT '店铺评分',
  month_sales INT DEFAULT 2123 COMMENT '月销量',
  rating_percent INT DEFAULT 94 COMMENT '好评率',
  banner_image VARCHAR(255) COMMENT '横幅图片',
  banner_color VARCHAR(20) DEFAULT '#ff6b6b' COMMENT '横幅背景色',
  status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========== 新增菜谱功能表 ==========

-- 1. 菜谱表
CREATE TABLE IF NOT EXISTS recipes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '菜谱名称',
  description TEXT COMMENT '菜谱描述',
  ingredients TEXT COMMENT '食材清单（JSON格式）',
  steps TEXT COMMENT '制作步骤（JSON格式）',
  cooking_time INT COMMENT '烹饪时间（分钟）',
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium' COMMENT '难度等级',
  creator_id INT COMMENT '创建者ID',
  category_id INT COMMENT '分类ID',
  main_image VARCHAR(255) COMMENT '主图片',
  step_images TEXT COMMENT '步骤图片（JSON格式）',
  video_url VARCHAR(255) COMMENT '制作视频',
  nutrition_info TEXT COMMENT '营养信息（JSON格式）',
  version VARCHAR(10) DEFAULT '1.0' COMMENT '版本号',
  view_count INT DEFAULT 0 COMMENT '浏览次数',
  like_count INT DEFAULT 0 COMMENT '点赞次数',
  collect_count INT DEFAULT 0 COMMENT '收藏次数',
  average_rating DECIMAL(3,2) DEFAULT 0.00 COMMENT '平均评分',
  review_count INT DEFAULT 0 COMMENT '评价数量',
  seasonal_tags VARCHAR(100) COMMENT '季节标签',
  status ENUM('active', 'inactive', 'draft') DEFAULT 'draft' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 2. 用户标签表
CREATE TABLE IF NOT EXISTS user_tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  tag_name VARCHAR(50) NOT NULL COMMENT '标签名称',
  tag_type ENUM('auto', 'manual') DEFAULT 'auto' COMMENT '标签类型（自动生成/手动添加）',
  tag_category ENUM('cuisine', 'taste', 'style', 'skill') COMMENT '标签分类',
  confidence_score DECIMAL(3,2) DEFAULT 1.00 COMMENT '置信度分数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_tag (user_id, tag_name)
);

-- 3. 菜谱评价表
CREATE TABLE IF NOT EXISTS recipe_reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recipe_id INT NOT NULL COMMENT '菜谱ID',
  user_id INT NOT NULL COMMENT '用户ID',
  overall_rating DECIMAL(3,2) NOT NULL COMMENT '总体评分',
  taste_rating INT DEFAULT 5 COMMENT '口味评分（1-5）',
  difficulty_rating INT DEFAULT 5 COMMENT '难度评分（1-5）',
  ingredients_rating INT DEFAULT 5 COMMENT '食材易得性评分（1-5）',
  value_rating INT DEFAULT 5 COMMENT '性价比评分（1-5）',
  content TEXT COMMENT '评价内容',
  images TEXT COMMENT '评价图片（JSON格式）',
  season_tag VARCHAR(20) COMMENT '季节标签',
  challenge_type ENUM('restoration', 'innovation', 'none') DEFAULT 'none' COMMENT '挑战类型',
  likes_count INT DEFAULT 0 COMMENT '点赞数',
  is_featured BOOLEAN DEFAULT FALSE COMMENT '是否精选',
  status ENUM('active', 'inactive', 'pending') DEFAULT 'pending' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. 菜谱版本历史表
CREATE TABLE IF NOT EXISTS recipe_versions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recipe_id INT NOT NULL COMMENT '菜谱ID',
  version VARCHAR(10) NOT NULL COMMENT '版本号',
  change_log TEXT COMMENT '变更记录',
  ingredients TEXT COMMENT '食材清单',
  steps TEXT COMMENT '制作步骤',
  images TEXT COMMENT '图片信息',
  created_by INT COMMENT '创建者ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. 用户口味档案表
CREATE TABLE IF NOT EXISTS user_taste_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  spice_level ENUM('mild', 'medium', 'spicy', 'extra_spicy') DEFAULT 'medium' COMMENT '辣度偏好',
  sweetness_level ENUM('low', 'medium', 'high') DEFAULT 'medium' COMMENT '甜度偏好',
  flavor_preferences TEXT COMMENT '口味偏好（JSON格式）',
  allergies TEXT COMMENT '过敏信息（JSON格式）',
  dietary_restrictions TEXT COMMENT '饮食限制（JSON格式）',
  cuisine_preferences TEXT COMMENT '菜系偏好（JSON格式）',
  cooking_skill_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner' COMMENT '烹饪技能等级',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_profile (user_id)
);

-- 6. 动态菜谱计划表
CREATE TABLE IF NOT EXISTS recipe_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '计划名称',
  description TEXT COMMENT '计划描述',
  creator_id INT COMMENT '创建者ID',
  duration_days INT NOT NULL COMMENT '计划天数',
  target_goal VARCHAR(100) COMMENT '目标（如减脂、增肌等）',
  difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium' COMMENT '难度等级',
  recipes_per_day INT DEFAULT 3 COMMENT '每日菜谱数量',
  total_recipes INT DEFAULT 0 COMMENT '总菜谱数量',
  follower_count INT DEFAULT 0 COMMENT '跟随者数量',
  completion_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '完成率',
  average_rating DECIMAL(3,2) DEFAULT 0.00 COMMENT '平均评分',
  status ENUM('active', 'inactive', 'draft') DEFAULT 'draft' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 7. 计划菜谱关联表
CREATE TABLE IF NOT EXISTS plan_recipes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  plan_id INT NOT NULL COMMENT '计划ID',
  recipe_id INT NOT NULL COMMENT '菜谱ID',
  day_number INT NOT NULL COMMENT '第几天',
  meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL COMMENT '餐次类型',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES recipe_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_plan_recipe (plan_id, day_number, meal_type, recipe_id)
);

-- 8. 用户计划跟随表
CREATE TABLE IF NOT EXISTS user_plan_follows (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  plan_id INT NOT NULL COMMENT '计划ID',
  start_date DATE NOT NULL COMMENT '开始日期',
  current_day INT DEFAULT 1 COMMENT '当前进度（天）',
  completion_status ENUM('active', 'completed', 'paused', 'cancelled') DEFAULT 'active' COMMENT '完成状态',
  completed_recipes TEXT COMMENT '已完成菜谱记录（JSON格式）',
  notes TEXT COMMENT '用户备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES recipe_plans(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_plan (user_id, plan_id)
);

-- 9. 菜谱盲盒记录表
CREATE TABLE IF NOT EXISTS recipe_blind_boxes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  theme VARCHAR(50) COMMENT '主题',
  dietary_restrictions TEXT COMMENT '饮食限制（JSON格式）',
  budget_range VARCHAR(20) COMMENT '预算范围',
  recipe_ids TEXT COMMENT '菜谱ID列表（JSON格式）',
  opened_recipes TEXT COMMENT '已打开菜谱（JSON格式）',
  status ENUM('generated', 'partially_opened', 'fully_opened') DEFAULT 'generated' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. 智能提醒记录表
CREATE TABLE IF NOT EXISTS smart_reminders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  recipe_id INT COMMENT '菜谱ID',
  plan_id INT COMMENT '计划ID',
  reminder_type ENUM('prep', 'cook', 'buy', 'defrost', 'marinate') COMMENT '提醒类型',
  reminder_time DATETIME COMMENT '提醒时间',
  message TEXT COMMENT '提醒内容',
  is_sent BOOLEAN DEFAULT FALSE COMMENT '是否已发送',
  status ENUM('pending', 'sent', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES recipe_plans(id) ON DELETE CASCADE
);

-- 11. 用户个性化主页配置表
CREATE TABLE IF NOT EXISTS user_homepage_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  background_image VARCHAR(255) COMMENT '背景图片',
  background_color VARCHAR(20) DEFAULT '#ffffff' COMMENT '背景颜色',
  layout_style ENUM('grid', 'list', 'card') DEFAULT 'card' COMMENT '布局风格',
  featured_sections TEXT COMMENT '特色模块配置（JSON格式）',
  section_priorities TEXT COMMENT '模块优先级（JSON格式）',
  show_cooking_vlog BOOLEAN DEFAULT FALSE COMMENT '是否显示烹饪vlog',
  vlog_cover_url VARCHAR(255) COMMENT 'vlog封面URL',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_config (user_id)
);

-- ========== 商家功能表 ==========

-- 12. 库存管理表
CREATE TABLE IF NOT EXISTS inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL COMMENT '商品ID',
  stock_quantity INT NOT NULL DEFAULT 0 COMMENT '库存数量',
  min_stock INT DEFAULT 10 COMMENT '最小库存预警',
  max_stock INT DEFAULT 1000 COMMENT '最大库存',
  unit VARCHAR(20) DEFAULT '份' COMMENT '单位',
  supplier_info TEXT COMMENT '供应商信息（JSON格式）',
  status ENUM('in_stock', 'low_stock', 'out_of_stock') DEFAULT 'in_stock' COMMENT '库存状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES menu_items(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_inventory (product_id)
);

-- 13. 定制化选项表
CREATE TABLE IF NOT EXISTS customization_options (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL COMMENT '商品ID',
  option_name VARCHAR(100) NOT NULL COMMENT '选项名称',
  option_type ENUM('single', 'multiple', 'text') NOT NULL COMMENT '选项类型',
  option_values TEXT COMMENT '选项值（JSON格式）',
  price_adjustment DECIMAL(10,2) DEFAULT 0.00 COMMENT '价格调整',
  is_required BOOLEAN DEFAULT FALSE COMMENT '是否必填',
  max_selections INT DEFAULT 0 COMMENT '最大选择数量（0表示无限制）',
  description TEXT COMMENT '选项描述',
  sort_order INT DEFAULT 0 COMMENT '排序',
  status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- 14. 库存变动记录表
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL COMMENT '商品ID',
  transaction_type ENUM('in', 'out', 'adjustment') NOT NULL COMMENT '交易类型',
  quantity INT NOT NULL COMMENT '数量',
  before_quantity INT NOT NULL COMMENT '变动前数量',
  after_quantity INT NOT NULL COMMENT '变动后数量',
  reason VARCHAR(255) COMMENT '变动原因',
  reference_id INT COMMENT '关联ID（如订单ID）',
  reference_type VARCHAR(50) COMMENT '关联类型',
  created_by INT COMMENT '操作人ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- 15. 商家配置表
CREATE TABLE IF NOT EXISTS merchant_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL COMMENT '设置键',
  setting_value TEXT COMMENT '设置值',
  setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string' COMMENT '设置类型',
  category VARCHAR(50) DEFAULT 'general' COMMENT '设置分类',
  description TEXT COMMENT '设置描述',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_setting (setting_key)
);

-- ========== 创建索引优化查询性能 ==========

-- 基础表索引
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_recipe ON menu_items(recipe_id);
CREATE INDEX idx_menu_items_status ON menu_items(status);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- 菜谱相关索引
CREATE INDEX idx_recipes_creator ON recipes(creator_id);
CREATE INDEX idx_recipes_category ON recipes(category_id);
CREATE INDEX idx_recipes_status ON recipes(status);
CREATE INDEX idx_recipes_created_at ON recipes(created_at);
CREATE INDEX idx_user_tags_user ON user_tags(user_id);
CREATE INDEX idx_user_tags_name ON user_tags(tag_name);
CREATE INDEX idx_recipe_reviews_recipe ON recipe_reviews(recipe_id);
CREATE INDEX idx_recipe_reviews_user ON recipe_reviews(user_id);
CREATE INDEX idx_recipe_reviews_rating ON recipe_reviews(overall_rating);
CREATE INDEX idx_recipe_plans_creator ON recipe_plans(creator_id);
CREATE INDEX idx_recipe_plans_status ON recipe_plans(status);
CREATE INDEX idx_plan_recipes_plan ON plan_recipes(plan_id);
CREATE INDEX idx_plan_recipes_recipe ON plan_recipes(recipe_id);
CREATE INDEX idx_user_plan_follows_user ON user_plan_follows(user_id);
CREATE INDEX idx_user_plan_follows_plan ON user_plan_follows(plan_id);
CREATE INDEX idx_smart_reminders_user ON smart_reminders(user_id);
CREATE INDEX idx_smart_reminders_time ON smart_reminders(reminder_time);
CREATE INDEX idx_blind_boxes_user ON recipe_blind_boxes(user_id);

-- 商家功能索引
CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_last_updated ON inventory(last_updated);
CREATE INDEX idx_customization_product ON customization_options(product_id);
CREATE INDEX idx_customization_status ON customization_options(status);
CREATE INDEX idx_customization_sort ON customization_options(sort_order);
CREATE INDEX idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_transactions_created ON inventory_transactions(created_at);

-- 为 menu_items 添加与 recipes 的外键约束
ALTER TABLE menu_items ADD FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE SET NULL;

-- ========== 插入默认数据 ==========

-- 插入默认分类数据
INSERT INTO categories (name, description, icon, sort) VALUES
('饮品', '各种饮品类商品', '/images/category-drink.png', 1),
('小食', '小食类商品', '/images/category-food.png', 2),
('甜品', '甜品类商品', '/images/category-dessert.png', 3),
('川菜', '川菜系菜谱', '/images/category-sichuan.png', 4),
('粤菜', '粤菜系菜谱', '/images/category-cantonese.png', 5),
('家常菜', '家常菜谱', '/images/category-homecook.png', 6);

-- 插入默认菜单商品数据
INSERT INTO menu_items (name, description, image, category_id, sort) VALUES
('珍珠奶茶', '香浓奶茶配Q弹珍珠，经典口味', '/images/product1.jpg', 1, 1),
('芝士蛋糕', '浓郁芝士香味，入口即化', '/images/product2.jpg', 3, 1),
('鸡肉汉堡', '新鲜鸡肉配生菜，营养美味', '/images/product3.jpg', 2, 1),
('柠檬汽水', '清爽柠檬味，消暑解腻', '/images/product4.jpg', 1, 2),
('抹茶拿铁', '日式抹茶配香浓牛奶', '/images/product5.jpg', 1, 3),
('薯条', '金黄酥脆，外焦内嫩', '/images/product6.jpg', 2, 2);

-- 插入默认管理员账户（密码：admin123）
INSERT INTO admins (username, password, name) VALUES
('admin', '$2a$10$9XqzWyGqrQNJJYjQJrJJKuEVQbUJYHJLGqJVJLGqJVJLGqJVJLGqJV', '管理员');

-- 插入默认店铺配置
INSERT INTO store_config (store_name, store_subtitle, store_rating, month_sales, rating_percent, banner_color) VALUES
('明星厨师show', '(菜谱共享点餐)', 4.6, 2123, 94, '#ff6b6b');

-- 插入示例用户数据
INSERT INTO users (id, nickname, avatar, bio, cooking_level) VALUES
(1, '系统管理员', '/images/avatar-admin.jpg', '官方菜谱创建者', 'advanced'),
(2, '美食达人', '/images/avatar-user1.jpg', '热爱烹饪的美食爱好者', 'intermediate');

-- 插入示例菜谱数据
INSERT INTO recipes (name, description, ingredients, steps, cooking_time, difficulty, creator_id, category_id, main_image, status) VALUES
('家常番茄鸡蛋', '经典家常菜，营养丰富，老少皆宜', 
 '["鸡蛋 3个","番茄 2个","葱花 适量","盐 适量","糖 少许","料酒 1勺"]',
 '[{"step": 1, "description": "鸡蛋打散，加少许盐和料酒"}, {"step": 2, "description": "番茄切块，去皮备用"}, {"step": 3, "description": "热锅下油，倒入蛋液快速翻炒"}, {"step": 4, "description": "盛起鸡蛋，下番茄块炒出汁水"}, {"step": 5, "description": "倒入鸡蛋翻炒均匀，调味即可"}]',
 15, 'easy', 1, 6, '/images/recipe1.jpg', 'active'),
('蒜蓉西兰花', '清淡营养的蔬菜料理，富含维生素', 
 '["西兰花 500g","大蒜 5瓣","生抽 2勺","盐 适量","鸡精 少许","油 适量"]',
 '[{"step": 1, "description": "西兰花洗净切小朵，焯水备用"}, {"step": 2, "description": "大蒜切末，热锅下油爆香"}, {"step": 3, "description": "下西兰花大火快炒"}, {"step": 4, "description": "调入生抽、盐、鸡精炒匀即可"}]',
 10, 'easy', 1, 6, '/images/recipe2.jpg', 'active'),
('宫保鸡丁', '四川经典菜品，麻辣鲜香', 
 '["鸡胸肉 300g","花生米 50g","干辣椒 10个","花椒 适量","葱 2根","姜 1块","蒜 3瓣","料酒 2勺","生抽 2勺","老抽 1勺","白糖 1勺","醋 1勺","水淀粉 适量"]',
 '[{"step": 1, "description": "鸡胸肉切丁，用料酒、生抽、水淀粉腌制15分钟"}, {"step": 2, "description": "热锅下油，爆炒花生米盛起"}, {"step": 3, "description": "下鸡丁炒至变色盛起"}, {"step": 4, "description": "爆香干辣椒、花椒、葱姜蒜"}, {"step": 5, "description": "下鸡丁炒匀，调入调料汁"}, {"step": 6, "description": "最后加入花生米炒匀即可"}]',
 25, 'medium', 1, 4, '/images/recipe3.jpg', 'active');

-- 插入默认库存数据
INSERT INTO inventory (product_id, stock_quantity, min_stock, max_stock, unit, status) 
SELECT id, 100, 10, 1000, '份', 'in_stock' 
FROM menu_items;

-- 插入默认商家设置
INSERT INTO merchant_settings (setting_key, setting_value, setting_type, category, description) VALUES
('auto_inventory_alert', 'true', 'boolean', 'inventory', '自动库存预警'),
('min_stock_alert_threshold', '10', 'number', 'inventory', '最小库存预警阈值'),
('enable_customization', 'true', 'boolean', 'orders', '启用定制化订单'),
('max_customization_options', '10', 'number', 'orders', '最大定制化选项数量'),
('prep_time_buffer', '5', 'number', 'orders', '准备时间缓冲（分钟）'),
('enable_taste_analytics', 'true', 'boolean', 'analytics', '启用口味数据分析'),
('analytics_retention_days', '90', 'number', 'analytics', '分析数据保留天数');

-- 插入示例定制化选项
INSERT INTO customization_options (product_id, option_name, option_type, option_values, is_required, max_selections, sort_order) VALUES
(1, '甜度选择', 'single', '[{"value":"normal","label":"正常甜度","price_adjustment":0},{"value":"less","label":"少甜","price_adjustment":0},{"value":"more","label":"多甜","price_adjustment":0}]', true, 1, 1),
(1, '温度选择', 'single', '[{"value":"hot","label":"热","price_adjustment":0},{"value":"cold","label":"冰","price_adjustment":0},{"value":"normal","label":"常温","price_adjustment":0}]', true, 1, 2),
(1, '加料选择', 'multiple', '[{"value":"pearl","label":"珍珠","price_adjustment":2},{"value":"coconut","label":"椰果","price_adjustment":1.5},{"value":"pudding","label":"布丁","price_adjustment":2.5}]', false, 3, 3);

-- 输出初始化完成信息
SELECT '数据库初始化完成！包含基础表、菜谱功能表和商家功能表，已创建索引并插入示例数据。' AS init_status; 