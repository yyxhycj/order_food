-- 去商业化数据库迁移脚本
-- 版本: 2.0
-- 说明: 将商业化点餐系统转换为免费菜谱请求系统

USE little_order;

-- 开始事务
START TRANSACTION;

-- ========== 第一部分：修改表结构 ==========

-- 1. 修改菜品表 (menu_items)
-- 重命名 name 字段为 dish_name
ALTER TABLE menu_items CHANGE COLUMN name dish_name VARCHAR(100) NOT NULL COMMENT '菜品名称';

-- 2. 修改请求表 (orders)
-- 重命名 order_no 为 request_no
ALTER TABLE orders CHANGE COLUMN order_no request_no VARCHAR(50) UNIQUE NOT NULL COMMENT '请求编号';

-- 重命名 status 为 request_status 并更新枚举值
ALTER TABLE orders CHANGE COLUMN status request_status ENUM('pending', 'accepted', 'preparing', 'ready', 'declined') DEFAULT 'pending' COMMENT '请求状态';

-- 重命名 pickup_time 为 preferred_time
ALTER TABLE orders CHANGE COLUMN pickup_time preferred_time DATETIME COMMENT '希望用餐时间';

-- 添加新的请求相关字段
ALTER TABLE orders ADD COLUMN request_reason TEXT COMMENT '请求原因' AFTER remark;
ALTER TABLE orders ADD COLUMN urgency ENUM('low', 'medium', 'high') DEFAULT 'medium' COMMENT '紧急程度' AFTER request_reason;
ALTER TABLE orders ADD COLUMN occasion VARCHAR(100) COMMENT '用餐场合' AFTER urgency;

-- 更新重复相关字段命名
ALTER TABLE orders CHANGE COLUMN is_repeat_order is_repeat_request BOOLEAN DEFAULT FALSE COMMENT '是否重复请求';
ALTER TABLE orders CHANGE COLUMN original_order_id original_request_id INT COMMENT '原始请求ID';

-- 3. 修改请求项目表 (order_items)
-- 删除价格相关字段
ALTER TABLE order_items DROP COLUMN IF EXISTS custom_price;

-- 更新注释
ALTER TABLE order_items MODIFY COLUMN order_id INT NOT NULL COMMENT '请求ID';
ALTER TABLE order_items MODIFY COLUMN product_id INT NOT NULL COMMENT '菜品ID';
ALTER TABLE order_items MODIFY COLUMN product_name VARCHAR(100) NOT NULL COMMENT '菜品名称';

-- 4. 修改平台配置表 (store_config)
-- 重命名字段
ALTER TABLE store_config CHANGE COLUMN store_name platform_name VARCHAR(100) NOT NULL DEFAULT '菜谱分享平台' COMMENT '平台名称';
ALTER TABLE store_config CHANGE COLUMN store_subtitle platform_subtitle VARCHAR(100) DEFAULT '(分享美食，传递心意)' COMMENT '平台副标题';
ALTER TABLE store_config CHANGE COLUMN store_rating platform_rating DECIMAL(2,1) DEFAULT 4.6 COMMENT '平台评分';

-- 删除商业化字段并添加新字段
ALTER TABLE store_config DROP COLUMN IF EXISTS month_sales;
ALTER TABLE store_config DROP COLUMN IF EXISTS rating_percent;
ALTER TABLE store_config ADD COLUMN total_requests INT DEFAULT 0 COMMENT '总请求数' AFTER platform_rating;
ALTER TABLE store_config ADD COLUMN active_users INT DEFAULT 0 COMMENT '活跃用户数' AFTER total_requests;

-- ========== 第二部分：更新现有数据 ==========

-- 更新请求状态映射
-- pending -> pending (保持不变)
-- processing -> preparing 
-- completed -> ready
-- cancelled -> declined
UPDATE orders SET request_status = 'preparing' WHERE request_status = 'processing';
UPDATE orders SET request_status = 'ready' WHERE request_status = 'completed';
UPDATE orders SET request_status = 'declined' WHERE request_status = 'cancelled';

-- 为现有请求添加默认值
UPDATE orders SET request_reason = '希望品尝这道菜' WHERE request_reason IS NULL;
UPDATE orders SET urgency = 'medium' WHERE urgency IS NULL;
UPDATE orders SET occasion = '日常用餐' WHERE occasion IS NULL;

-- 更新平台配置默认值
UPDATE store_config SET 
  platform_name = '菜谱分享平台',
  platform_subtitle = '(分享美食，传递心意)',
  total_requests = (SELECT COUNT(*) FROM orders),
  active_users = (SELECT COUNT(DISTINCT user_id) FROM orders WHERE user_id IS NOT NULL AND user_id != '')
WHERE id = 1;

-- ========== 第三部分：创建索引优化 ==========

-- 为新字段创建索引
CREATE INDEX idx_requests_status ON orders(request_status);
CREATE INDEX idx_requests_urgency ON orders(urgency);
CREATE INDEX idx_requests_preferred_time ON orders(preferred_time);

-- ========== 第四部分：验证数据完整性 ==========

-- 检查是否有数据不一致
SELECT 'orders validation' as check_type, COUNT(*) as total_records FROM orders;
SELECT 'menu_items validation' as check_type, COUNT(*) as total_records FROM menu_items;
SELECT 'order_items validation' as check_type, COUNT(*) as total_records FROM order_items;

-- 提交事务
COMMIT;

-- 输出完成信息
SELECT 'Migration completed successfully!' as status;