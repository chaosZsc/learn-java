# Java 后端开发学习计划

> **从 NestJS 到 Spring Boot：前端工程师的全栈进阶之路**

[![学习计划](https://img.shields.io/badge/周期-16周-blue)](./java-backend-learning-plan.md)
[![周计划](https://img.shields.io/badge/周计划-16份-green)](./week1-detailed-plan.md)
[![检查点](https://img.shields.io/badge/检查点-175个-orange)](./tracker/)

---

## 项目简介

本项目是一套系统性的 **Java 后端学习方案**，专为有 Node.js/NestJS 经验的前端工程师设计。通过 16 周（约 4 个月）的学习，帮助你掌握 Java + Spring Boot 全栈开发能力。

### 核心特点

- **前端视角**：提供 NestJS ↔ Spring Boot 概念对照，利用已有知识快速迁移
- **实战驱动**：每个阶段都有可交付的项目成果，拒绝纸上谈兵
- **渐进深入**：先能用 → 再用好 → 再理解原理
- **可视化追踪**：配套进度追踪工具，实时掌握学习进度

---

## 目录结构

```
java-backend-learning/
├── 📚 学习计划文档
│   ├── java-backend-learning-plan.md    # 16周完整路线图
│   ├── api-design-guide.md               # RESTful API 设计指南
│   ├── testing-guide.md                  # 单元测试与集成测试指南
│   ├── week1-detailed-plan.md           # 第1周：Java基础语法
│   ├── week2-detailed-plan.md           # 第2周：面向对象
│   ├── week3-detailed-plan.md           # 第3周：Maven与工程化
│   ├── ...                              # week4 ~ week15
│   └── week16-detailed-plan.md          # 第16周：综合项目实战
│
├── 🛠️ tracker/                          # 学习进度追踪工具
│   ├── index.html                        # 可视化追踪页面
│   ├── js/
│   │   ├── data.js                       # 学习数据（自动生成）
│   │   ├── app.js                        # 应用逻辑
│   │   ├── components.js                 # UI组件
│   │   └── storage.js                    # 本地存储管理
│   ├── css/main.css                      # 样式
│   └── scripts/build-data.js             # 数据构建脚本
│
└── 📖 docs/                              # 补充文档
    └── superpowers/                      # AI辅助开发相关
```

---

## 学习路线

### Phase 1：Java 语言基础（第 1-4 周）

| 周次 | 主题 | 产出物 | 检查点 |
|------|------|--------|--------|
| Week 1 | 环境搭建 + 基础语法 | 控制台计算器 + 待办清单 | 6 个 |
| Week 2 | 面向对象 + 高级语法 | 电商商品类体系 | 11 个 |
| Week 3 | Maven + 工程化工具 | 规范 Maven 项目 | 7 个 |
| Week 4 | Spring Boot 入门 | 第一个 REST API | 14 个 |

**技术栈**：JDK 17, IntelliJ IDEA, Maven, JUnit 5, Lombok

---

### Phase 2：Spring Boot 核心（第 5-10 周）

| 周次 | 主题 | 产出物 | 检查点 |
|------|------|--------|--------|
| Week 5 | 数据访问层 | JPA + MyBatis CRUD | 8 个 |
| Week 6 | 认证与安全 | JWT 认证系统 | 15 个 |
| Week 7 | 缓存与异步 | Redis + 性能优化 | 14 个 |
| Week 8 | 部署与 DevOps | Docker 线上部署 | 25 个 |
| Week 9-10 | 认证项目深度实践 | RBAC 权限系统 | 26 个 |

**技术栈**：Spring Boot, Spring Data JPA, MyBatis, Spring Security, JWT, Redis, MySQL, Docker

---

### Phase 3：进阶与全栈实战（第 11-16 周）

| 周次 | 主题 | 产出物 | 检查点 |
|------|------|--------|--------|
| Week 11-12 | 性能优化进阶 | JVM 调优 + SQL 优化 | 12 个 |
| Week 13 | 消息队列 | RabbitMQ 异步通信 | 5 个 |
| Week 14-15 | 高级主题与工程实践 | 企业级工程能力 | 8 个 |
| Week 16 | 综合项目实战 | 任务协作平台（全栈） | 24 个 |

**技术栈**：JVM 调优, RabbitMQ, WebSocket, OSS, 分布式锁

---

## 快速开始

### 1. 阅读学习计划

从 [主学习计划](./java-backend-learning-plan.md) 开始，了解整体路线图和核心策略。

### 2. 使用进度追踪工具

```bash
# 方式1：直接打开
double-click tracker/index.html

# 方式2：本地服务器
cd tracker && npx serve

# 方式3：Python
cd tracker && python -m http.server 8080
```

### 3. 按计划学习

打开对应的周计划文档，跟随详细指导完成学习任务。

---

## NestJS vs Spring Boot 概念对照

| 概念 | NestJS | Spring Boot | 说明 |
|------|--------|-------------|------|
| 控制器 | `@Controller()` | `@RestController` | REST 控制器 |
| 服务 | `@Injectable()` | `@Service` | 依赖注入服务 |
| 模块 | `@Module()` | `@Configuration` | 模块化配置 |
| 依赖注入 | Constructor 注入 | `@Autowired` / 构造器注入 | 相同思想 |
| 中间件 | `Middleware` | `Interceptor/Filter` | 请求拦截处理 |
| ORM | TypeORM/Prisma | JPA/MyBatis | 数据持久化 |
| 配置管理 | `ConfigModule` | `application.yml` | 多环境配置 |

更多对照见 [学习计划文档](./java-backend-learning-plan.md#附nestjs-vs-spring-boot-概念对照速查表)

---

## 数据构建脚本

当修改周计划文档后，需要重新生成数据：

```bash
node tracker/scripts/build-data.js
```

**脚本功能**：
- 解析所有周计划 Markdown 文件
- 提取标题、目标、检查点、预计时长
- 生成 `tracker/js/data.js`

---

## 资源推荐

### 视频课程
- [尚硅谷 Java 基础](https://www.bilibili.com) - Phase 1
- [尚硅谷 Spring Boot](https://www.bilibili.com) - Phase 2
- [黑马程序员 Redis](https://www.bilibili.com) - Phase 3

### 文档
- [Spring 官方文档](https://spring.io/guides)
- [MyBatis 文档](https://mybatis.org)
- [廖雪峰 Java 教程](https://www.liaoxuefeng.com)

### 书籍
- 《Java 核心技术 卷 I》- 语法参考
- 《Spring Boot 实战》- 入门必看
- 《Spring 实战》- 深入原理

---

## 避坑指南

| 错误做法 | 正确做法 |
|----------|----------|
| 纠结 Java 语法细节 | 快速过一遍，边做项目边补 |
| 一上来就深入 JVM、并发 | 先能跑通项目，再深入底层 |
| 只看不写 | 每学完一个模块至少写 200 行代码 |
| Spring 框架源码起步 | 先用熟练，有具体问题时再看源码 |
| 追求最新技术栈 | 先掌握 Spring Boot 2.x/3.x 稳定版 |

---

## 里程碑检查点

### Week 4
- [ ] 能独立编写 100 行以上的 Java 程序
- [ ] 理解面向对象三大特性
- [ ] 会用 Stream 处理集合数据

### Week 8
- [ ] 能搭建 Spring Boot 项目
- [ ] 完成基础的 CRUD 接口开发
- [ ] 掌握 JPA 的基本使用

### Week 12
- [ ] 完成个人博客 API
- [ ] 实现 JWT 认证
- [ ] 能用 React/Vue 调用这个 API 完成前端

### Week 16
- [ ] 完成一个完整全栈项目
- [ ] 掌握 Redis、消息队列基础
- [ ] 能独立部署应用到服务器

---

## 贡献与反馈

如果你发现文档错误或有改进建议，欢迎提交 Issue 或 PR。

---

## License

MIT License - 自由学习和使用

---

**祝你学习顺利！有任何问题欢迎随时交流。** 🚀
