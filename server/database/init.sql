-- 创建数据库
CREATE DATABASE IF NOT EXISTS little_order CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE little_order;

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

-- 商品表
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '商品名称',
  description TEXT COMMENT '商品描述',
  image VARCHAR(255) COMMENT '商品图片',
  category_id INT NOT NULL COMMENT '分类ID',
  status ENUM('available', 'unavailable') DEFAULT 'available' COMMENT '状态',
  sort INT DEFAULT 0 COMMENT '排序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(50) UNIQUE NOT NULL COMMENT '订单编号',
  user_id VARCHAR(50) COMMENT '用户ID',
  user_name VARCHAR(50) NOT NULL COMMENT '用户姓名',
  user_phone VARCHAR(20) NOT NULL COMMENT '用户电话',
  status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '订单状态',
  pickup_time DATETIME COMMENT '取餐时间',
  remark TEXT COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 订单详情表
CREATE TABLE IF NOT EXISTS order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL COMMENT '订单ID',
  product_id INT NOT NULL COMMENT '商品ID',
  product_name VARCHAR(100) NOT NULL COMMENT '商品名称',
  quantity INT NOT NULL COMMENT '数量',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- 用户表（可选，用于记录用户信息）
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(100) UNIQUE COMMENT '微信openid',
  nickname VARCHAR(100) COMMENT '用户昵称',
  avatar VARCHAR(255) COMMENT '用户头像',
  phone VARCHAR(20) COMMENT '用户电话',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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

-- 插入默认分类数据
INSERT INTO categories (name, description, icon, sort) VALUES
('饮品', '各种饮品类商品', '/images/category-drink.png', 1),
('小食', '小食类商品', '/images/category-food.png', 2),
('甜品', '甜品类商品', '/images/category-dessert.png', 3);

-- 插入默认商品数据
INSERT INTO products (name, description, image, category_id, sort) VALUES
('珍珠奶茶', '香浓奶茶配Q弹珍珠，经典口味', '/images/product1.jpg', 1, 1),
('芝士蛋糕', '浓郁芝士香味，入口即化', '/images/product2.jpg', 3, 1),
('鸡肉汉堡', '新鲜鸡肉配生菜，营养美味', '/images/product3.jpg', 2, 1),
('柠檬汽水', '清爽柠檬味，消暑解腻', '/images/product4.jpg', 1, 2),
('抹茶拿铁', '日式抹茶配香浓牛奶', '/images/product5.jpg', 1, 3),
('薯条', '金黄酥脆，外焦内嫩', '/images/product6.jpg', 2, 2);

-- 插入默认管理员账户（密码：admin123）
INSERT INTO admins (username, password, name) VALUES
('admin', '$2a$10$9XqzWyGqrQNJJYjQJrJJKuEVQbUJYHJLGqJVJLGqJVJLGqJVJLGqJV', '管理员');

-- 创建索引
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id); 