# 朋友菜谱小程序开发说明

当前项目是微信原生小程序 + 微信云开发 CloudBase，不再使用旧的 Express/MySQL 点单系统。

## 项目定位

朋友之间私密分享菜谱、收藏菜谱、发起“想吃”请求，并由作者或管理员回应请求。

第一版主闭环：

```text
登录 -> 浏览菜谱 -> 查看详情 -> 发布菜谱 -> 收藏/想吃/留言 -> 处理想吃请求
```

## 当前结构

```text
app.js
app.json
cloudfunctions/
pages/
components/
services/
constants/
utils/
docs/
images/
```

核心目录：

- `cloudfunctions/`: 登录、菜谱、想吃请求、收藏、留言、分类、统计等云函数。
- `pages/home`: 首页菜谱浏览。
- `pages/recipe`: 菜谱详情与发布编辑。
- `pages/requests`: 我的想吃与收到的想吃。
- `pages/user`: 个人资料。
- `pages/admin`: 轻量管理。
- `services/`: 前端统一服务层，页面不要散写 `wx.cloud.callFunction`。

## 云开发环境

当前环境 ID：

```text
cloud1-d8gnehyjub2a90508
```

本地部署云函数前，需要在微信开发者工具打开：

```text
设置 -> 安全 -> 服务端口
```

部署完成后可以关闭服务端口。

## 文档入口

- [整体方案](docs/菜谱小程序整体方案.md)
- [文件架构整理](docs/菜谱小程序文件架构整理.md)
- [数据集合设计](docs/数据集合设计.md)
- [云开发迁移步骤](docs/云开发迁移步骤.md)
- [迁移记录](docs/迁移记录.md)

## 约束

- 不再引入价格、购物车、订单金额、库存、配送等商业点单语义。
- 需要权限校验或写入保护的操作走云函数。
- 页面只保留第一版主线需要的内容，不保留旧点单系统入口。
