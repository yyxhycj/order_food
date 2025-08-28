-- 去商业化数据库迁移脚本（兼容版本）
-- 版本: 2.1
-- 说明: 将商业化点餐系统转换为免费菜谱请求系统

USE little_order;

-- 开始事务
START TRANSACTION;

-- ========== 第一部分：检查并修改表结构 ==========

-- 1. 修改菜品表 (menu_items)
-- 检查并重命名 name 字段为 dish_name
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'name');

SET @sql = IF(@column_exists > 0, 
    'ALTER TABLE menu_items CHANGE COLUMN name dish_name VARCHAR(100) NOT NULL COMMENT ''菜品名称''',
    'SELECT "Column name already renamed or does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 修改请求表 (orders)
-- 检查并重命名 order_no 为 request_no
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'order_no');

SET @sql = IF(@column_exists > 0,
    'ALTER TABLE orders CHANGE COLUMN order_no request_no VARCHAR(50) UNIQUE NOT NULL COMMENT ''请求编号''',
    'SELECT "Column order_no already renamed or does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并重命名 status 为 request_status
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'status');

SET @sql = IF(@column_exists > 0,
    'ALTER TABLE orders CHANGE COLUMN status request_status ENUM(''pending'', ''accepted'', ''preparing'', ''ready'', ''declined'') DEFAULT ''pending'' COMMENT ''请求状态''',
    'SELECT "Column status already renamed or does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并重命名 pickup_time 为 preferred_time
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'pickup_time');

SET @sql = IF(@column_exists > 0,
    'ALTER TABLE orders CHANGE COLUMN pickup_time preferred_time DATETIME COMMENT ''希望用餐时间''',
    'SELECT "Column pickup_time already renamed or does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加新的请求相关字段（如果不存在）
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'request_reason');

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE orders ADD COLUMN request_reason TEXT COMMENT ''请求原因'' AFTER remark',
    'SELECT "Column request_reason already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'urgency');

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE orders ADD COLUMN urgency ENUM(''low'', ''medium'', ''high'') DEFAULT ''medium'' COMMENT ''紧急程度'' AFTER request_reason',
    'SELECT "Column urgency already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'occasion');

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE orders ADD COLUMN occasion VARCHAR(100) COMMENT ''用餐场合'' AFTER urgency',
    'SELECT "Column occasion already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并重命名重复相关字段
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'is_repeat_order');

SET @sql = IF(@column_exists > 0,
    'ALTER TABLE orders CHANGE COLUMN is_repeat_order is_repeat_request BOOLEAN DEFAULT FALSE COMMENT ''是否重复请求''',
    'SELECT "Column is_repeat_order already renamed or does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'original_order_id');

SET @sql = IF(@column_exists > 0,
    'ALTER TABLE orders CHANGE COLUMN original_order_id original_request_id INT COMMENT ''原始请求ID''',
    'SELECT "Column original_order_id already renamed or does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. 修改请求项目表 (order_items)
-- 检查并删除 custom_price 字段
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'custom_price');

SET @sql = IF(@column_exists > 0,
    'ALTER TABLE order_items DROP COLUMN custom_price',
    'SELECT "Column custom_price already removed or does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 重命名 product_id 为 dish_id
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'product_id');

SET @sql = IF(@column_exists > 0,
    'ALTER TABLE order_items CHANGE COLUMN product_id dish_id INT NOT NULL COMMENT ''菜品ID''',
    'SELECT "Column product_id already renamed or does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 重命名 product_name 为 dish_name
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'order_items' AND COLUMN_NAME = 'product_name');

SET @sql = IF(@column_exists > 0,
    'ALTER TABLE order_items CHANGE COLUMN product_name dish_name VARCHAR(100) NOT NULL COMMENT ''菜品名称''',
    'SELECT "Column product_name already renamed or does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 更新注释
ALTER TABLE order_items MODIFY COLUMN order_id INT NOT NULL COMMENT '请求ID';

-- 4. 修改平台配置表 (store_config)
-- 检查并重命名字段
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'store_config' AND COLUMN_NAME = 'store_name');

SET @sql = IF(@column_exists > 0,
    'ALTER TABLE store_config CHANGE COLUMN store_name platform_name VARCHAR(100) NOT NULL DEFAULT ''菜谱分享平台'' COMMENT ''平台名称''',
    'SELECT "Column store_name already renamed or does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'store_config' AND COLUMN_NAME = 'store_subtitle');

SET @sql = IF(@column_exists > 0,
    'ALTER TABLE store_config CHANGE COLUMN store_subtitle platform_subtitle VARCHAR(100) DEFAULT ''(分享美食，传递心意)'' COMMENT ''平台副标题''',
    'SELECT "Column store_subtitle already renamed or does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'store_config' AND COLUMN_NAME = 'store_rating');

SET @sql = IF(@column_exists > 0,
    'ALTER TABLE store_config CHANGE COLUMN store_rating platform_rating DECIMAL(2,1) DEFAULT 4.6 COMMENT ''平台评分''',
    'SELECT "Column store_rating already renamed or does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并删除商业化字段
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'store_config' AND COLUMN_NAME = 'month_sales');

SET @sql = IF(@column_exists > 0,
    'ALTER TABLE store_config DROP COLUMN month_sales',
    'SELECT "Column month_sales already removed or does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'store_config' AND COLUMN_NAME = 'rating_percent');

SET @sql = IF(@column_exists > 0,
    'ALTER TABLE store_config DROP COLUMN rating_percent',
    'SELECT "Column rating_percent already removed or does not exist" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加新字段
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'store_config' AND COLUMN_NAME = 'total_requests');

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE store_config ADD COLUMN total_requests INT DEFAULT 0 COMMENT ''总请求数'' AFTER platform_rating',
    'SELECT "Column total_requests already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'store_config' AND COLUMN_NAME = 'active_users');

SET @sql = IF(@column_exists = 0,
    'ALTER TABLE store_config ADD COLUMN active_users INT DEFAULT 0 COMMENT ''活跃用户数'' AFTER total_requests',
    'SELECT "Column active_users already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== 第二部分：更新现有数据 ==========

-- 更新请求状态映射（使用安全的方式）
UPDATE orders SET request_status = 'preparing' WHERE request_status = 'processing';
UPDATE orders SET request_status = 'ready' WHERE request_status = 'completed';
UPDATE orders SET request_status = 'declined' WHERE request_status = 'cancelled';

-- 为现有请求添加默认值（只更新NULL值）
UPDATE orders SET request_reason = '希望品尝这道菜' WHERE request_reason IS NULL OR request_reason = '';
UPDATE orders SET urgency = 'medium' WHERE urgency IS NULL OR urgency = '';
UPDATE orders SET occasion = '日常用餐' WHERE occasion IS NULL OR occasion = '';

-- 更新平台配置默认值
UPDATE store_config SET 
  platform_name = '菜谱分享平台',
  platform_subtitle = '(分享美食，传递心意)',
  total_requests = (SELECT COUNT(*) FROM orders),
  active_users = (SELECT COUNT(DISTINCT user_id) FROM orders WHERE user_id IS NOT NULL AND user_id != '')
WHERE id = 1;

-- ========== 第三部分：创建索引优化 ==========

-- 为新字段创建索引（如果不存在）
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_requests_status');

SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_requests_status ON orders(request_status)',
    'SELECT "Index idx_requests_status already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_requests_urgency');

SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_requests_urgency ON orders(urgency)',
    'SELECT "Index idx_requests_urgency already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = 'little_order' AND TABLE_NAME = 'orders' AND INDEX_NAME = 'idx_requests_preferred_time');

SET @sql = IF(@index_exists = 0,
    'CREATE INDEX idx_requests_preferred_time ON orders(preferred_time)',
    'SELECT "Index idx_requests_preferred_time already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ========== 第四部分：验证数据完整性 ==========

-- 检查迁移结果
SELECT 'Migration validation results:' as status;
SELECT 'orders table:' as check_type, COUNT(*) as total_records FROM orders;
SELECT 'menu_items table:' as check_type, COUNT(*) as total_records FROM menu_items;
SELECT 'order_items table:' as check_type, COUNT(*) as total_records FROM order_items;

-- 显示修改后的表结构
SELECT 'Table structure after migration:' as info;
SHOW COLUMNS FROM menu_items;
SHOW COLUMNS FROM orders;

-- 提交事务
COMMIT;

-- 输出完成信息
SELECT 'Migration completed successfully!' as status, NOW() as completed_at;