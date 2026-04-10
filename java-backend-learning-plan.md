# Java后端开发学习计划

> **适用对象**：在职前端开发工程师（React/Vue技术栈）  
> **学习目标**：具备独立全栈开发能力  
**学习时长**：16周（约4个月）  
**每周投入**：15-20小时（工作日1-2h + 周末4-6h）  
**前置经验**：Node.js + NestJS基础

---

## 一、核心策略说明

### 1.1 NestJS → Spring Boot 优势迁移

你有NestJS经验是**巨大优势**，两者设计理念高度相似：

| NestJS | Spring Boot | 概念说明 |
|--------|-------------|----------|
| `@Controller()` | `@RestController` | REST控制器 |
| `@Injectable()` | `@Service` / `@Component` | 依赖注入服务 |
| `@Module()` | `@Configuration` + `@ComponentScan` | 模块配置 |
| `Dependency Injection` | `Dependency Injection` | 完全相同思想 |
| `Guard` | `Interceptor/Filter` | 请求拦截处理 |
| `Pipe` | `Validator` | 参数校验 |

### 1.2 学习路线设计原则

- **避免重复造轮子**：快速过语法，重点在Spring生态
- **边学边做**：每个阶段都有可交付的实战项目
- **渐进式深入**：先能用，再用好，再理解原理
- **全栈视角**：保持前后端贯通，不只是孤立学后端

---

## 二、Phase 1：Java语言基础（第1-4周）

### 目标
掌握Java核心语法，能写出规范的Java代码，理解面向对象设计。

### 学习内容

#### Week 1：环境搭建 + 基础语法
| 主题 | 具体内容 | 预期产出 |
|------|----------|----------|
| 开发环境 | JDK 17安装、IntelliJ IDEA配置 | 可运行的IDE |
| 基础语法 | 数据类型、运算符、流程控制 | 控制台计算器程序 |
| 集合框架 | List/Map/Set使用、泛型基础 | 学生管理系统（命令行版） |

**练习任务**：
- 用ArrayList实现待办清单（增删改查）
- 用HashMap统计字符串中各字符出现次数

#### Week 2：面向对象 + 高级语法
| 主题 | 具体内容 | 与前端对比 |
|------|----------|------------|
| 面向对象 | 类/对象、封装继承多态 | 类比JS Class，更严格 |
| 抽象类/接口 | abstract、interface | 类似TS Interface |
| 异常处理 | try-catch-finally、自定义异常 | 类似JS try-catch |
| Stream API | 流式处理、函数式编程 | 类似Lodash + 链式调用 |

**练习任务**：
- 设计一个简单的电商商品类体系
- 用Stream实现数据筛选和排序

#### Week 3：Maven + 常用工具
| 主题 | 具体内容 | 对应前端工具 |
|------|----------|--------------|
| Maven | 依赖管理、生命周期、仓库配置 | npm/yarn |
| pom.xml | 项目配置、依赖引入 | package.json |
| 单元测试 | JUnit 5基础 | Jest/Vitest |
| Lombok | 简化样板代码 | 无直接对应但省很多代码 |

**练习任务**：
- 创建Maven项目，引入常用依赖
- 编写单元测试用例

#### Week 4：基础综合项目

**项目**：图书馆管理系统（命令行版）

功能清单：
- [ ] 图书借阅/归还
- [ ] 用户管理
- [ ] 借阅记录查询
- [ ] 数据持久化（JSON文件）

### Week 1-4 学习资源
| 资源 | 类型 | 链接/说明 |
|------|------|-----------|
| 尚硅谷Java入门 | 视频 | B站免费 |
| 廖雪峰Java教程 | 文档 | 快速查阅语法 |
| Java核心技术 卷1 | 书籍 | 经典参考，可不买 |

### Phase 1 检查清单
- [ ] 熟练使用IDEA开发Java项目
- [ ] 理解集合框架的选择和使用场景
- [ ] 能写出符合规范的面向对象代码
- [ ] 掌握Maven基本操作

---

## 三、Phase 2：Spring Boot核心（第5-10周）

### 目标
掌握Spring Boot开发REST API，能与数据库交互，实现用户认证。

### Week 5-6：Spring Boot基础

| 主题 | 具体内容 | 目标产出 |
|------|----------|----------|
| Spring Boot入门 | 自动配置原理、Starter机制 | 第一个Web项目 |
| 配置管理 | application.yml/properties | 多环境配置 |
| 日志框架 | SLF4J + Logback | 日志规范 |
| RESTful开发 | @RestController、路径映射 | 基础CRUD API |

**实战任务**：
- 搭建Hello World接口
- 实现查询参数、路径变量、请求体接收
- 统一返回结果封装

### Week 7-8：数据访问层

| 主题 | 具体内容 | 学习重点 |
|------|----------|----------|
| Spring Data JPA | Entity、Repository、关联关系 | ORM思想（对比Sequelize/TypeORM）|
| MyBatis | XML配置、注解方式、动态SQL | 复杂查询场景 |
| MySQL基础 | 建表、索引、基础优化 | SQL能力补齐 |

**实战任务**：
- 设计用户-角色-权限表结构
- 用JPA实现CRUD操作
- 用MyBatis实现复杂查询

### Week 9-10：认证与安全 + 阶段性项目

| 主题 | 具体内容 | NestJS对应 |
|------|----------|------------|
| Spring Security | 认证流程、授权控制 | Passport.js |
| JWT实现 | token生成与验证 | @nestjs/jwt |
| 拦截器/过滤器 | 日志记录、统一异常处理 | Interceptor/Middleware |
| 参数校验 | Validation + 全局异常 | class-validator |

**阶段性项目**：个人博客API系统

```
项目结构：
blog-api/
├── src/
│   ├── controller/      # 控制器层
│   │   ├── AuthController.java
│   │   ├── ArticleController.java
│   │   └── CommentController.java
│   ├── service/         # 业务层
│   ├── repository/      # 数据访问层 (JPA)
│   ├── entity/          # 实体类
│   ├── dto/             # 数据传输对象
│   ├── config/          # 配置类
│   └── exception/       # 异常处理
└── pom.xml
```

功能列表：
- [ ] 用户注册/登录（JWT认证）
- [ ] 文章发布/编辑/删除（需登录）
- [ ] 文章列表/详情（公开）
- [ ] 评论发布/列表
- [ ] 统一异常处理
- [ ] 参数校验

### Phase 2 检查清单
- [ ] 理解Spring Boot自动配置原理
- [ ] 熟练使用JPA和MyBatis
- [ ] 能设计合理的数据库表结构
- [ ] 实现JWT认证流程
- [ ] 完成博客API项目

### Phase 2 学习资源
| 资源 | 类型 | 说明 |
|------|------|------|
| 尚硅谷SpringBoot | 视频 | 项目驱动，适合入门 |
| 狂神说SpringBoot | 视频 | 节奏紧凑 |
| Spring官方Guide | 文档 | Getting Started系列 |
| SpringBoot实战 | 书籍 | 深入浅出 |

---

## 四、Phase 3：进阶与全栈实战（第11-16周）

### 目标
掌握常用中间件，具备独立部署能力，完成完整的全栈项目。

### Week 11-12：缓存与性能

| 主题 | 具体内容 | 应用场景 |
|------|----------|----------|
| Redis基础 | 5大数据结构、常用命令 | 缓存、计数器 |
| Spring Cache | 注解式缓存 | 方法结果缓存 |
| RedisTemplate | 编程式操作 | 复杂缓存需求 |

**练习**：
- 实现接口限流（验证码发送频率限制）
- 热门文章缓存
- 用户登录状态缓存

### Week 13：消息队列

| 主题 | 具体内容 | 学习程度 |
|------|----------|----------|
| RabbitMQ | 队列、交换机、路由key | 理解基本使用 |
| Spring AMQP | 消息发送与监听 | 能写代码 |
| 应用场景 | 异步任务、解耦 | 理解何时使用 |

**练习**：
- 邮件发送异步化
- 订单超时取消

### Week 14：部署与DevOps

| 主题 | 具体内容 | 产出 |
|------|----------|------|
| Docker | Dockerfile编写、镜像构建 | 容器化后端服务 |
| 部署实践 | 服务器购买、环境搭建 | 线上可访问的API |
| 基础运维 | Nginx反向代理、SSL配置 | HTTPS访问 |

### Week 15-16：综合全栈项目

**推荐项目**：任务协作平台

功能规格：
```
├── 用户模块
│   ├── 注册/登录/找回密码
│   └── 个人信息管理
├── 项目模块
│   ├── 创建项目
│   ├── 邀请成员
│   └── 项目设置
├── 任务模块
│   ├── 创建任务（标题/描述/截止日期/优先级）
│   ├── 任务看板（待办/进行中/已完成）
│   └── 任务分配
└── 通知模块
    └── 任务状态变更通知
```

**技术栈建议**：
- 前端：Vue/React（用你熟悉的）
- 后端：Spring Boot + JPA + Redis
- 数据库：MySQL
- 部署：Docker + 云服务器

---

## 五、学习资源汇总

### 视频课程
| 课程 | 讲师/平台 | 适合阶段 |
|------|-----------|----------|
| Java基础教程 | 尚硅谷/黑马 | Phase 1 |
| Spring Boot教程 | 尚硅谷 | Phase 2 |
| Spring Boot快速入门 | 狂神说 | Phase 2 |
| Redis入门 | 黑马程序员 | Phase 3 |

### 文档与网站
| 资源 | 用途 |
|------|------|
| [Spring官方文档](https://spring.io/guides) | 最权威的参考 |
| [MyBatis文档](https://mybatis.org) | 详细的使用指南 |
| [MDN Web 文档](https://developer.mozilla.org) | HTTP/REST相关 |
| [LeetCode](https://leetcode.cn) | Java算法练习 |

### 推荐书籍
| 书名 | 阶段 | 说明 |
|------|------|------|
| 《Java核心技术 卷I》 | Phase 1 | 语法参考 |
| 《Spring Boot实战》 | Phase 2 | 入门必看 |
| 《Spring实战》 | Phase 2-3 | 深入原理 |
| 《Redis设计与实现》 | Phase 3 | 深入Redis可选 |

### 开发工具
| 工具 | 用途 |
|------|------|
| IntelliJ IDEA | Java开发IDE（推荐）|
| Postman/APIFox | API测试 |
| Navicat/DBeaver | 数据库可视化工具 |
| Redis Desktop Manager | Redis可视化 |

---

## 六、避坑指南与学习建议

### 6.1 常见误区与避坑

| ❌ 错误做法 | ✅ 正确做法 |
|-------------|-------------|
| 纠结Java语法细节 | 快速过一遍，边做项目边补 |
| 一上来就深入JVM、并发 | 先能跑通项目，再深入底层 |
| 只看不写 | 每学完一个模块至少写200行代码 |
| Spring框架源码起步 | 先用熟练，有具体问题时再看源码 |
| 追求最新技术栈 | 先掌握Spring Boot 2.x/3.x稳定版 |

### 6.2 学习效率建议

1. **每天编码**：哪怕只有30分钟，保持编码手感
2. **项目驱动**：不要光看书，立即动手实现
3. **前后端对照**：遇到新概念时，想想在Node/NestJS中怎么做的
4. **记录笔记**：建立自己的"前端→后端"概念映射表
5. **加入社区**：Java技术交流群，遇到问题有人解答

### 6.3 时间管理建议

| 场景 | 学习内容 |
|------|----------|
| 工作日晚上（1-2h） | 看视频/读文档 + 小练习 |
| 周末上午（2-3h） | 集中编码，完成阶段性项目 |
| 周末下午（2-3h） | 复习 + 总结 + 下周计划 |

---

## 七、里程碑与检查点

### Week 4 检查点
- [ ] 能独立编写100行以上的Java程序
- [ ] 理解面向对象三大特性
- [ ] 会用Stream处理集合数据

### Week 8 检查点
- [ ] 能搭建Spring Boot项目
- [ ] 完成基础的CRUD接口开发
- [ ] 掌握JPA的基本使用

### Week 12 检查点（首个重要里程碑）
- [ ] 完成个人博客API
- [ ] 实现JWT认证
- [ ] 能用React/Vue调用这个API完成前端
- [ ] 理解全栈开发流程

### Week 16 检查点（最终目标）
- [ ] 完成一个完整全栈项目
- [ ] 掌握Redis、消息队列基础
- [ ] 能独立部署应用到服务器
- [ ] 具备继续深入学习的能力

---

## 八、下一步行动

现在就可以开始的步骤：

1. [ ] **今天**：安装JDK 17和IntelliJ IDEA
2. [ ] **本周**：完成Week 1的学习内容
3. [ ] **建立概念对照表**：打开你的NestJS项目，边看边记录对应Spring概念
4. [ ] **设定日程提醒**：固定每天/每周学习时间

---

## 附：NestJS vs Spring Boot 概念对照速查表

```
基础概念对照：
┌─────────────────────┬─────────────────────┬──────────────────────────┐
│ 概念                │ NestJS              │ Spring Boot              │
├─────────────────────┼─────────────────────┼──────────────────────────┤
│ 控制器              │ @Controller         │ @RestController          │
│ 路由                │ @Get/@Post/@Patch   │ @GetMapping/@PostMapping │
│ 服务                │ @Injectable         │ @Service                 │
│ 依赖注入            │ constructor注入     │ @Autowired/构造器注入    │
│ 模块                │ @Module             │ @Configuration           │
│ 中间件              │ Middleware          │ Interceptor/Filter       │
│ 参数校验            │ class-validator     │ javax.validation         │
│ 管道                │ Pipe                │ Converter/Formatter      │
│ 守卫                │ Guard               │ HandlerInterceptor       │
│ ORM                 │ TypeORM/Prisma      │ JPA/MyBatis              │
├─────────────────────┼─────────────────────┼──────────────────────────┤
│ 数据库操作          │ Repository模式      │ Repository/JpaRepository │
│ 配置管理            │ ConfigModule        │ application.yml          │
│ 环境变量            │ process.env + .env  │ @Value注解 + profile     │
│ 日志                │ built-in/Winston    │ SLF4J + Logback          │
└─────────────────────┴─────────────────────┴──────────────────────────┘
```

---

*祝学习顺利！有任何问题欢迎随时交流。*
