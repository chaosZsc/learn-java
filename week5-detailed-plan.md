# Week 5 详细学习计划：数据访问层 - JPA + MySQL

> **目标**：掌握数据库连接与持久化，能使用JPA和MyBatis操作数据  
> **投入时间**：15-20小时（周中10h + 周末10h）  
> **预期产出**：连接MySQL的完整CRUD项目 + 理解ORM思想

---

## 一、时间分配总览

| 时间段 | 内容 | 时长 |
|--------|------|------|
| **Day 1 (周一)** | 数据库准备 + JPA基础 + 项目配置 | 2h |
| **Day 2 (周二)** | 实体映射 + Repository接口 | 2h |
| **Day 3 (周三)** | 关联关系（一对一、一对多）| 2h |
| **Day 4 (周四)** | 查询方法 + JPQL + 分页排序 | 2h |
| **Day 5 (周五)** | MyBatis基础（对比学习）| 2h |
| **周六** | 项目实战：博客系统数据库设计 | 4h |
| **周日** | 完善 + 事务 + 性能基础 | 4h |

---

## 二、核心概念：与前端/Node生态对比

`★ Insight ─────────────────────────────────────`  
**Spring Data JPA ≈ TypeORM + NestJS Repository模式**

有TypeORM经验的你会觉得JPA非常亲切：
- 都是装饰器/注解定义实体
- 都是Repository模式操作数据
- 都支持Active Record和Data Mapper
- 都自动生成SQL

区别：JPA基于JDBC，性能更高，功能更丰富
─────────────────────────────────────────────────

### ORM工具对照

| Node.js/TypeScript | Java | 对比 |
|-------------------|------|------|
| TypeORM | Spring Data JPA | 非常相似 |
| Prisma | MyBatis | 不同设计理念 |
| Sequelize | Hibernate | Hibernate是JPA实现 |
| Mongoose | Spring Data MongoDB | 概念类似 |

---

## 三、Day 1：环境准备与JPA入门（2小时）

### 3.1 安装MySQL

**方式1：本地安装**
- 下载：https://dev.mysql.com/downloads/mysql/
- 或使用MySQL Workbench（带图形界面）

**方式2：Docker（推荐）**
```bash
docker run --name mysql8 \
  -e MYSQL_ROOT_PASSWORD=123456 \
  -e MYSQL_DATABASE=demo_db \
  -p 3306:3306 \
  -d mysql:8.0
```

**验证连接**：
```bash
docker exec -it mysql8 mysql -uroot -p123456
```

### 3.2 创建Spring Boot项目

**添加依赖**：
```xml
<dependencies>
    <!-- Spring Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- Spring Data JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    
    <!-- MySQL驱动 -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <scope>runtime</scope>
    </dependency>
    
    <!-- 连接池（自动引入HikariCP） -->
    <!-- Lombok等... -->
</dependencies>
```

### 3.3 数据库配置

**application.yml**：
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/demo_db?useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: 123456
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000
  
  jpa:
    hibernate:
      ddl-auto: update  # 自动更新表结构（开发用）
    show-sql: true      # 打印SQL语句
    properties:
      hibernate:
        format_sql: true  # 格式化SQL
        dialect: org.hibernate.dialect.MySQL8Dialect
```

**配置说明**：
- `ddl-auto: update`：根据实体自动创建/更新表（开发方便）
- `ddl-auto: none`：不操作表结构（生产环境）
- `ddl-auto: create-drop`：每次启动创建，关闭删除（测试用）

**与TypeORM对比**：
```typescript
// TypeORM ormconfig.json
{
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "root",
  "password": "123456",
  "database": "demo_db",
  "synchronize": true,  // 类似 ddl-auto: update
  "logging": true
}
```

### 3.4 第一个JPA实体

```java
// entity/User.java
package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity  // 标记为JPA实体
@Table(name = "users")  // 指定表名（可选）
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id  // 主键
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // 自增
    private Long id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String username;
    
    @Column(nullable = false)
    private String email;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist  // 插入前回调
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
```

**常用注解对比**：

| TypeORM | JPA | 说明 |
|---------|-----|------|
| `@Entity()` | `@Entity` | 实体标记 |
| `@PrimaryGeneratedColumn()` | `@Id @GeneratedValue` | 自增主键 |
| `@Column()` | `@Column` | 字段映射 |
| `@CreateDateColumn()` | `@CreationTimestamp` | 自动填充创建时间 |
| `@UpdateDateColumn()` | `@UpdateTimestamp` | 自动填充更新时间 |

---

## 四、Day 2：Repository接口（2小时）

### 4.1 基础CRUD

```java
// repository/UserRepository.java
package com.example.demo.repository;

import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // 继承即拥有基础CRUD方法
}
```

**继承JpaRepository获得的默认方法**：
```java
// 查询
Optional<User> findById(Long id);
List<User> findAll();
boolean existsById(Long id);
long count();

// 新增/更新
User save(User entity);
List<User> saveAll(List<User> entities);

// 删除
void deleteById(Long id);
void delete(User entity);
void deleteAll();
```

**与TypeORM对比**：
```typescript
// TypeORM Repository
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}
  
  async findOne(id: number) {
    return this.userRepo.findOne({ where: { id } });
  }
}
```

### 4.2 使用方法

```java
@Service
@RequiredArgsConstructor  // 为final字段生成构造器
public class UserService {
    
    private final UserRepository userRepository;
    
    // 查询所有
    public List<User> findAll() {
        return userRepository.findAll();
    }
    
    // 根据ID查询
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
    }
    
    // 创建/更新
    public User save(User user) {
        return userRepository.save(user);
    }
    
    // 删除
    public void delete(Long id) {
        userRepository.deleteById(id);
    }
}
```

**与NestJS对比**：
```typescript
// NestJS
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}
  
  findAll() {
    return this.userRepo.find();
  }
}
```

### 4.3 派生查询方法

Spring Data JPA的强大之处：**方法名即查询**

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // 根据用户名查询
    Optional<User> findByUsername(String username);
    
    // 根据邮箱查询
    User findByEmail(String email);
    
    // 模糊查询
    List<User> findByUsernameContaining(String keyword);
    
    // 多条件查询
    User findByUsernameAndEmail(String username, String email);
    
    // 列表查询 + 排序
    List<User> findByUsernameContainingOrderByCreatedAtDesc(String keyword);
    
    // 判断是否存在
    boolean existsByEmail(String email);
    
    // 计数
    long countByUsernameContaining(String keyword);
}
```

**命名规则**：
- `findBy` / `getBy` / `queryBy`：查询
- `countBy`：计数
- `existsBy`：判断存在
- `deleteBy` / `removeBy`：删除
- `And` / `Or`：连接条件
- `Containing` / `Like`：模糊匹配
- `OrderByXxxDesc` / `OrderByXxxAsc`：排序

---

## 五、Day 3：关联关系（2小时）

### 5.1 一对多关系（One-to-Many）

**场景**：一个用户有多篇文章

```java
// entity/User.java
@Entity
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String username;
    
    // 一对多：一个用户有多篇文章
    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Article> articles = new ArrayList<>();
}

// entity/Article.java
@Entity
@Data
public class Article {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private String content;
    
    // 多对一：多篇文章属于一个用户
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")  // 外键列
    private User author;
}
```

**关键属性**：
- `mappedBy`：关系的拥有方（在多方配置）
- `cascade`：级联操作（ALL/PERSIST/REMOVE等）
- `fetch`：加载策略（LAZY懒加载 / EAGER急加载）

**与TypeORM对比**：
```typescript
// TypeORM
@Entity()
export class User {
  @OneToMany(() => Article, article => article.author)
  articles: Article[];
}

@Entity()
export class Article {
  @ManyToOne(() => User, user => user.articles)
  author: User;
}
```

### 5.2 多对多关系（Many-to-Many）

**场景**：一篇文章有多个标签，一个标签有多篇文章

```java
// entity/Article.java
@Entity
@Data
public class Article {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    
    @ManyToMany
    @JoinTable(
        name = "article_tag",  // 中间表名
        joinColumns = @JoinColumn(name = "article_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();
}

// entity/Tag.java
@Entity
@Data
public class Tag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    
    @ManyToMany(mappedBy = "tags")
    private Set<Article> articles = new HashSet<>();
}
```

### 5.3 级联与孤儿删除

```java
@OneToMany(mappedBy = "author", 
           cascade = CascadeType.ALL,      // 级联所有操作
           orphanRemoval = true)            // 删除孤儿对象
private List<Article> articles;

// CascadeType枚举：
// ALL - 所有操作
// PERSIST - 保存
// MERGE - 合并/更新
// REMOVE - 删除
// REFRESH - 刷新
// DETACH - 分离
```

---

## 六、Day 4：高级查询（2小时）

### 6.1 JPQL查询

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // 原生JPQL（类似SQL，但操作的是实体）
    @Query("SELECT u FROM User u WHERE u.username = ?1")
    User findByUsernameJPQL(String username);
    
    // 命名参数（推荐！避免顺序错误）
    @Query("SELECT u FROM User u WHERE u.username = :name AND u.email = :email")
    User findByUsernameAndEmailJPQL(@Param("name") String username, 
                                     @Param("email") String email);
    
    // 查询指定字段
    @Query("SELECT u.username, u.email FROM User u WHERE u.id = :id")
    Object[] findUsernameAndEmailById(@Param("id") Long id);
    
    // 更新操作（需要加@Modifying）
    @Modifying
    @Query("UPDATE User u SET u.email = :email WHERE u.id = :id")
    int updateEmail(@Param("id") Long id, @Param("email") String email);
}
```

### 6.2 原生SQL

```java
@Query(value = "SELECT * FROM users WHERE username LIKE %:keyword%", 
       nativeQuery = true)
List<User> searchByKeywordNative(@Param("keyword") String keyword);
```

### 6.3 分页和排序

**方法1：Sort参数**
```java
// 查询排序
List<User> findByUsernameContaining(String keyword, Sort sort);

// 使用
Sort sort = Sort.by("createdAt").descending();
List<User> users = userRepository.findByUsernameContaining("zhang", sort);
```

**方法2：Pageable分页（推荐）**
```java
// Repository方法
Page<User> findByUsernameContaining(String keyword, Pageable pageable);

// 使用
Pageable pageable = PageRequest.of(
    0,           // 第0页（第一页）
    10,          // 每页10条
    Sort.by("createdAt").descending()
);

Page<User> page = userRepository.findByUsernameContaining("zhang", pageable);

// 获取结果
List<User> content = page.getContent();      // 当前页数据
int totalPages = page.getTotalPages();        // 总页数
long totalElements = page.getTotalElements(); // 总条数
int currentPage = page.getNumber();           // 当前页码
boolean hasNext = page.hasNext();             // 是否有下一页
```

**与NestJS对比**：
```typescript
// TypeORM
const [users, total] = await this.userRepo.findAndCount({
  where: { username: Like('%zhang%') },
  order: { createdAt: 'DESC' },
  skip: 0,
  take: 10,
});
```

---

## 七、Day 5：MyBatis基础（2小时）

### 7.1 JPA vs MyBatis对比

| 特性 | JPA | MyBatis |
|------|-----|---------|
| SQL控制 | 自动生成，可控性弱 | 手写SQL，完全可控 |
| 学习成本 | 低（约定多） | 中（需写XML/SQL） |
| 复杂查询 | 较麻烦 | 灵活方便 |
| 性能优化 | 一般 | 好（可精细优化） |
| 适用场景 | 常规CRUD | 复杂SQL、遗留系统 |

**建议**：先用JPA入门，复杂场景用MyBatis/原生SQL

### 7.2 MyBatis基础配置

**添加依赖**：
```xml
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>3.0.3</version>
</dependency>
```

**配置**：
```yaml
mybatis:
  mapper-locations: classpath:mapper/*.xml  # XML映射文件位置
  type-aliases-package: com.example.demo.entity  # 实体别名
  configuration:
    map-underscore-to-camel-case: true  # 下划线转驼峰
```

### 7.3 Mapper接口 + XML

```java
// mapper/UserMapper.java
@Mapper
public interface UserMapper {
    
    @Select("SELECT * FROM users WHERE id = #{id}")
    User findById(Long id);
    
    @Insert("INSERT INTO users(username, email) VALUES(#{username}, #{email})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(User user);
    
    @Update("UPDATE users SET email = #{email} WHERE id = #{id}")
    int update(User user);
    
    @Delete("DELETE FROM users WHERE id = #{id}")
    int deleteById(Long id);
}
```

**或XML方式**（推荐复杂SQL）：
```xml
<!-- resources/mapper/UserMapper.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" 
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.example.demo.mapper.UserMapper">
    
    <select id="findById" resultType="com.example.demo.entity.User">
        SELECT * FROM users WHERE id = #{id}
    </select>
    
    <insert id="insert" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO users(username, email, created_at)
        VALUES(#{username}, #{email}, NOW())
    </insert>
    
    <select id="searchUsers" resultType="com.example.demo.entity.User">
        SELECT * FROM users
        <where>
            <if test="keyword != null">
                AND username LIKE CONCAT('%', #{keyword}, '%')
            </if>
            <if test="minAge != null">
                AND age >= #{minAge}
            </if>
        </where>
        ORDER BY created_at DESC
    </select>
    
</mapper>
```

---

## 八、周六项目：博客系统数据库（4小时）

### 需求

设计一个博客系统的数据库和API：

```
实体关系：
├── User（用户）
│   └── 有关联：Article
│
├── Article（文章）
│   ├── 属于：User（多对一）
│   └── 有关联：Comment、Tag
│
├── Comment（评论）
│   ├── 属于：Article（多对一）
│   └── 属于：User（多对一）
│
└── Tag（标签）
    └── 有关联：Article（多对多）
```

### 数据库DDL

```sql
CREATE DATABASE blog_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE blog_db;

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE articles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    user_id BIGINT,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE comments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    content TEXT NOT NULL,
    article_id BIGINT,
    user_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE article_tag (
    article_id BIGINT,
    tag_id BIGINT,
    PRIMARY KEY (article_id, tag_id),
    FOREIGN KEY (article_id) REFERENCES articles(id),
    FOREIGN KEY (tag_id) REFERENCES tags(id)
);
```

### API实现

```java
@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
public class ArticleController {
    
    private final ArticleService articleService;
    
    @GetMapping
    public ApiResponse<Page<Article>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.success(articleService.findAll(PageRequest.of(page, size)));
    }
    
    @GetMapping("/{id}")
    public ApiResponse<Article> getById(@PathVariable Long id) {
        return ApiResponse.success(articleService.findById(id));
    }
    
    @PostMapping
    public ApiResponse<Article> create(@RequestBody @Valid CreateArticleRequest request) {
        return ApiResponse.success(articleService.create(request));
    }
    
    @GetMapping("/{id}/comments")
    public ApiResponse<List<Comment>> getComments(@PathVariable Long id) {
        return ApiResponse.success(articleService.getComments(id));
    }
}
```

---

## 九、周日：事务与优化（4小时）

### 9.1 事务管理

```java
@Service
@RequiredArgsConstructor
public class OrderService {
    
    private final OrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;
    
    @Transactional  // 声明式事务
    public Order createOrder(CreateOrderRequest request) {
        // 1. 检查库存
        Inventory inventory = inventoryRepository.findByProductId(request.getProductId());
        if (inventory.getStock() < request.getQuantity()) {
            throw new InsufficientStockException("库存不足");
        }
        
        // 2. 扣减库存
        inventory.setStock(inventory.getStock() - request.getQuantity());
        inventoryRepository.save(inventory);
        
        // 3. 创建订单
        Order order = Order.builder()
                .userId(request.getUserId())
                .productId(request.getProductId())
                .quantity(request.getQuantity())
                .status(OrderStatus.CREATED)
                .build();
        
        return orderRepository.save(order);
        // 任一操作失败，全部回滚
    }
}
```

**事务属性**：
```java
@Transactional(
    readOnly = true,              // 只读事务
    propagation = Propagation.REQUIRED,  // 传播行为
    isolation = Isolation.READ_COMMITTED, // 隔离级别
    timeout = 30,                 // 超时时间（秒）
    rollbackFor = Exception.class // 回滚异常类型
)
```

### 9.2 性能优化入门

**1. 索引优化**
```java
// 在实体上添加索引
@Entity
@Table(name = "articles", 
       indexes = @Index(columnList = "user_id"))
public class Article {
    // ...
}
```

**2. 懒加载优化**
```java
// @EntityGraph避免N+1问题
@EntityGraph(attributePaths = {"author", "tags"})
@Query("SELECT a FROM Article a WHERE a.id = :id")
Optional<Article> findByIdWithDetails(@Param("id") Long id);
```

**3. 批量操作**
```java
// 批量插入优化
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true
```

---

## 十、学习资源

### 视频
- [尚硅谷SpringData JPA](https://www.bilibili.com/video/BV1hW411g7jy)
- [尚硅谷MyBatis](https://www.bilibili.com/video/BV1Kb411M7b7)

### 文档
- [Spring Data JPA官方文档](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/)
- [MyBatis官方文档](https://mybatis.org/mybatis-3/)

### 工具
| 工具 | 用途 |
|------|------|
| Navicat | MySQL可视化工具 |
| DataGrip | IDEA数据库插件 |
| MySQL Workbench | 官方工具 |

---

## 十一、Week 5 里程碑

完成本周后，你应该能够：

- [ ] 配置Spring Boot连接MySQL
- [ ] 使用JPA定义实体和关系
- [ ] 使用Repository接口进行CRUD
- [ ] 实现一对多、多对多关系
- [ ] 使用JPQL和原生SQL查询
- [ ] 实现分页和排序
- [ ] 了解MyBatis基本用法
- [ ] 使用@Transactional管理事务

---

## 下一步预告

**Week 6：认证与安全 - Spring Security + JWT**

你将：
1. 实现用户注册/登录
2. 使用JWT进行认证
3. 接口权限控制
4. 理解Spring Security过滤器链

---

`★ Insight ─────────────────────────────────────`
**Week 5是从"玩具应用"到"真实应用"的关键！**

之前用内存存储数据，重启就丢失。从Week 5开始，你掌握了数据持久化，这是任何生产系统的基础。

**JPA vs MyBatis选择建议**：
- 快速开发、常规CRUD → JPA
- 复杂SQL、遗留系统、极致性能 → MyBatis
- 实际项目中两者可以共存！
─────────────────────────────────────────────────

有任何JPA、数据库设计或事务相关的问题吗？比如关联关系的最佳实践、N+1问题、或者乐观锁实现？
