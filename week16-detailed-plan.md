# Week 16 详细学习计划：综合项目实战

> **目标**：整合所学知识，完成企业级全栈项目  
> **投入时间**：20-30小时（毕业周）  
> **预期产出**：可写入简历的生产级项目

---

## 一、项目选题建议

`★ Insight ─────────────────────────────────────`
**项目选择原则**：能展示完整技术栈，有实际业务价值

推荐选题（按复杂度排序）：

| 项目 | 技术点覆盖 | 难度 | 适合人群 |
|------|-----------|------|---------|
| 个人博客 | 基础CRUD+认证+文件上传 | ⭐⭐ | 快速完成 |
| 任务协作平台 | 全栈+实时通知+权限 | ⭐⭐⭐ | 推荐 |
| 电商系统 | 秒杀+订单+支付 | ⭐⭐⭐⭐ | 进阶挑战 |
| 知识付费平台 | 内容+支付+订阅 | ⭐⭐⭐⭐ | 面试亮点 |

---

## 二、任务协作平台详细设计

### 2.1 需求规格

```
系统模块：
├── 用户中心
│   ├── 注册/登录（JWT）
│   ├── 个人资料
│   └── 通知设置
│
├── 项目管理
│   ├── 创建/编辑项目
│   ├── 成员管理（邀请/角色）
│   └── 项目设置
│
├── 任务管理
│   ├── 任务CRUD
│   ├── 看板视图（待办/进行中/完成）
│   ├── 任务分配
│   ├── 优先级/截止日期
│   └── 评论/附件
│
├── 团队协作
│   ├── 实时通知（WebSocket）
│   ├── @提及功能
│   └── 操作日志
│
└── 数据统计
    ├── 个人看板
    └── 项目统计
```

### 2.2 数据库设计

```sql
-- 核心表结构

-- 1. 用户表
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    status TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 项目表
CREATE TABLE projects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, archived
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- 3. 项目成员表
CREATE TABLE project_members (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(20) DEFAULT 'member', -- owner, admin, member
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_project_user (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 4. 任务表
CREATE TABLE tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'todo', -- todo, in_progress, done
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    assignee_id BIGINT,
    creator_id BIGINT NOT NULL,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (assignee_id) REFERENCES users(id),
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- 5. 任务评论表
CREATE TABLE task_comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 6. 附件表
CREATE TABLE attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    uploaded_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 7. 通知表
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL, -- task_assigned, comment_added, etc.
    title VARCHAR(200) NOT NULL,
    content TEXT,
    related_id BIGINT, -- 关联的任务/项目ID
    is_read TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 8. 操作日志表
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT,
    operation VARCHAR(100) NOT NULL,
    target_type VARCHAR(50), -- project, task
    target_id BIGINT,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 2.3 技术栈选型

**后端（Java）**：
```
├── Spring Boot 3.x
├── Spring Security + JWT
├── Spring Data JPA
├── MySQL 8.0
├── Redis 7.x
├── RabbitMQ（可选，通知队列）
└── Elasticsearch（可选，任务搜索）
```

**前端（Vue3/React）**：
```
├── Vue 3 + TypeScript（或 React 18）
├── Pinia / Redux（状态管理）
├── Element Plus / Ant Design
├── Axios（HTTP客户端）
└── Socket.io-client（实时通信，可选）
```

**部署**：
```
├── Docker
├── Docker Compose
├── Nginx
└── 云服务器（阿里云/腾讯云）
```

### 2.4 API设计规范

```
RESTful API 设计：

用户相关：
POST   /api/auth/register       # 注册
POST   /api/auth/login          # 登录
POST   /api/auth/refresh        # 刷新Token
GET    /api/users/me            # 当前用户信息
PUT    /api/users/me            # 更新个人信息
POST   /api/users/me/avatar     # 上传头像

项目相关：
GET    /api/projects            # 我的项目列表
POST   /api/projects            # 创建项目
GET    /api/projects/{id}       # 项目详情
PUT    /api/projects/{id}       # 更新项目
DELETE /api/projects/{id}       # 删除项目
POST   /api/projects/{id}/members           # 添加成员
DELETE /api/projects/{id}/members/{userId}  # 移除成员

任务相关：
GET    /api/projects/{projectId}/tasks      # 任务列表
POST   /api/projects/{projectId}/tasks      # 创建任务
GET    /api/tasks/{id}          # 任务详情
PUT    /api/tasks/{id}          # 更新任务
DELETE /api/tasks/{id}          # 删除任务
PUT    /api/tasks/{id}/status   # 更新状态
POST   /api/tasks/{id}/comments # 添加评论

通知相关：
GET    /api/notifications       # 通知列表
PUT    /api/notifications/{id}/read  # 标记已读
PUT    /api/notifications/read-all   # 全部已读
```

### 2.5 实现检查清单

**基础功能（必须）**：
- [ ] 用户注册/登录/登出
- [ ] JWT认证与刷新Token
- [ ] 个人资料管理
- [ ] 项目CRUD（创建者权限）
- [ ] 项目成员管理（邀请/移除）
- [ ] 任务CRUD（项目内）
- [ ] 任务状态流转
- [ ] 任务分配与优先级
- [ ] 任务评论

**进阶功能（推荐）**：
- [ ] 文件附件上传（本地或OSS）
- [ ] 通知系统（任务分配提醒、评论提醒）
- [ ] 操作日志（任务变更记录）
- [ ] 看板视图API（按状态分组）
- [ ] 全局搜索（任务/项目模糊搜索）

**高级功能（加分）**：
- [ ] Redis缓存（热门项目、用户会话）
- [ ] 接口限流防刷
- [ ] 统计报表（个人/项目维度）
- [ ] WebSocket实时通知
- [ ] Docker容器化部署

---

## 三、开发计划（7天冲刺）

### Day 1-2：基础搭建
- 初始化Spring Boot项目
- 配置数据库、Redis
- 实现用户认证（JWT）
- 实现基础CRUD

### Day 3-4：核心业务
- 项目管理API
- 任务管理API
- 权限控制（项目成员可见性）

### Day 5-6：增强功能
- 文件上传
- 通知系统
- 搜索功能

### Day 7：优化与文档
- 接口文档（Swagger）
- 代码优化
- 部署准备（Dockerfile）

---

## 四、项目亮点总结

完成此项目后，简历上可以写：

```
任务协作平台（独立开发）
- 后端采用Spring Boot + JPA + MySQL，实现RBAC权限管理
- 使用JWT实现无状态认证，支持Token自动刷新
- 集成Redis缓存热点数据，接口响应时间降低70%
- 实现文件上传与云存储对接，支持断点续传
- 使用Docker容器化部署，配合Nginx实现负载均衡
- 项目地址：https://github.com/xxx/task-platform
```

---

## 五、Week 16 里程碑

- [ ] 完成项目基础功能
- [ ] 实现认证与权限
- [ ] 编写API文档
- [ ] 部署到服务器
- [ ] 准备项目演示

---

## 六、16周学习总结

```
16周完整技能栈：

基础层
├── Java语法与OOP
├── Maven工程化
└── 单元测试

框架层
├── Spring Boot核心
├── Spring Security + JWT
├── Spring Data JPA
└── 缓存与异步

数据层
├── MySQL设计与优化
├── Redis缓存
├── RabbitMQ消息队列
└── Elasticsearch搜索

工程层
├── Docker容器化
├── CI/CD部署
├── 性能监控
└── 分布式基础

项目实战
└── 企业级全栈项目
```

**恭喜完成16周学习计划！你现在是一名合格的Java后端工程师！**
