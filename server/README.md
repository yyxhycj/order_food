# 微信小程序点单系统 - 后端服务

## 项目简介

这是一个基于 Node.js + Express + MySQL 的后端 API 服务，为微信小程序点单系统提供数据支持。

## 技术栈

- **Node.js** - 运行环境
- **Express** - Web 框架
- **MySQL** - 数据库
- **mysql2** - MySQL 驱动
- **Multer** - 文件上传处理
- **Joi** - 数据验证
- **CORS** - 跨域处理
- **Moment** - 时间处理

## 功能特性

### 🍽️ 商品管理
- 商品增删改查
- 商品分类筛选
- 商品状态管理（上架/下架）
- 商品图片上传

### 📋 订单管理
- 订单创建和查询
- 订单状态管理
- 订单统计分析
- 订单详情查看

### 📂 分类管理
- 分类增删改查
- 分类排序功能
- 分类状态管理
- 分类商品统计

### 📁 文件上传
- 单文件上传
- 多文件上传
- 文件类型验证
- 文件大小限制

## 快速开始

### 1. 环境要求

- Node.js >= 14.0.0
- MySQL >= 5.7
- npm >= 6.0.0

### 2. 安装依赖

```bash
cd server
npm install
```

### 3. 数据库配置

1. 创建 MySQL 数据库
2. 修改 `config.js` 中的数据库配置
3. 运行初始化 SQL 脚本

```bash
mysql -u root -p < database/init.sql
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务默认运行在 `http://localhost:3000`

## API 接口文档

### 商品接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/products` | 获取商品列表 |
| GET | `/api/products/:id` | 获取商品详情 |
| POST | `/api/products` | 创建商品 |
| PUT | `/api/products/:id` | 更新商品 |
| PATCH | `/api/products/:id/status` | 更新商品状态 |
| DELETE | `/api/products/:id` | 删除商品 |
| GET | `/api/products/stats` | 获取商品统计 |

### 订单接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/orders` | 获取订单列表 |
| GET | `/api/orders/:id` | 获取订单详情 |
| GET | `/api/orders/order-no/:orderNo` | 根据订单号获取详情 |
| POST | `/api/orders` | 创建订单 |
| PATCH | `/api/orders/:id/status` | 更新订单状态 |
| DELETE | `/api/orders/:id` | 删除订单 |
| GET | `/api/orders/stats` | 获取订单统计 |

### 分类接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/categories` | 获取分类列表 |
| GET | `/api/categories/:id` | 获取分类详情 |
| POST | `/api/categories` | 创建分类 |
| PUT | `/api/categories/:id` | 更新分类 |
| PATCH | `/api/categories/:id/status` | 更新分类状态 |
| PATCH | `/api/categories/:id/sort` | 更新分类排序 |
| DELETE | `/api/categories/:id` | 删除分类 |
| GET | `/api/categories/stats` | 获取分类统计 |

### 文件上传接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/upload/single` | 单文件上传 |
| POST | `/api/upload/multiple` | 多文件上传 |

## 数据库设计

### 主要数据表

1. **categories** - 分类表
2. **products** - 商品表
3. **orders** - 订单表
4. **order_items** - 订单详情表
5. **users** - 用户表（可选）
6. **admins** - 管理员表

### 表关系

- 商品属于分类（多对一）
- 订单包含多个商品（一对多）
- 订单详情关联商品（多对一）

## 配置说明

### 服务器配置

```javascript
server: {
  port: 3000,           // 服务端口
  env: 'development'    // 环境模式
}
```

### 数据库配置

```javascript
database: {
  host: 'localhost',    // 数据库主机
  port: 3306,          // 数据库端口
  database: 'little_order', // 数据库名
  user: 'root',        // 用户名
  password: '',        // 密码
  connectionLimit: 10  // 连接池大小
}
```

### 文件上传配置

```javascript
upload: {
  path: 'uploads/',           // 上传目录
  maxFileSize: 5242880,       // 最大文件大小 (5MB)
  allowedTypes: [             // 允许的文件类型
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
}
```

## 开发指南

### 目录结构

```
server/
├── app.js                 # 主应用文件
├── config.js             # 配置文件
├── package.json          # 依赖管理
├── database/             # 数据库相关
│   ├── connection.js     # 数据库连接
│   └── init.sql         # 初始化脚本
├── models/              # 数据模型
│   ├── Product.js       # 商品模型
│   ├── Order.js         # 订单模型
│   └── Category.js      # 分类模型
├── controllers/         # 控制器
│   ├── productController.js
│   ├── orderController.js
│   └── categoryController.js
├── routes/              # 路由
│   ├── productRoutes.js
│   ├── orderRoutes.js
│   ├── categoryRoutes.js
│   └── uploadRoutes.js
├── middleware/          # 中间件
│   └── upload.js        # 文件上传中间件
└── uploads/             # 上传文件目录
```

### 添加新功能

1. 在 `models/` 中创建数据模型
2. 在 `controllers/` 中创建控制器
3. 在 `routes/` 中创建路由
4. 在 `app.js` 中注册路由

### 数据验证

使用 Joi 进行数据验证：

```javascript
const schema = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().positive().required()
});

const { error, value } = schema.validate(req.body);
```

## 部署说明

### 生产环境部署

1. 设置环境变量
2. 配置 MySQL 数据库
3. 安装 PM2 进程管理器
4. 启动服务

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start app.js --name "order-api"

# 查看状态
pm2 status

# 查看日志
pm2 logs order-api
```

### Docker 部署

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 常见问题

### 1. 数据库连接失败

检查数据库配置和网络连接：

```bash
# 测试 MySQL 连接
mysql -h localhost -u root -p
```

### 2. 文件上传失败

检查上传目录权限：

```bash
# 创建上传目录
mkdir uploads
chmod 755 uploads
```

### 3. 跨域问题

已配置 CORS 中间件，如需特定配置：

```javascript
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true
}));
```

## 许可证

MIT License

## 联系方式

如有问题或建议，请联系开发团队。 