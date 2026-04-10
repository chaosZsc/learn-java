# Week 4 详细学习计划：Spring Boot入门

> **目标**：掌握Spring Boot基础，能搭建Web项目并开发REST API  
> **投入时间**：15-20小时（周中10h + 周末10h）  
> **预期产出**：第一个Spring Boot项目 + 完整的CRUD REST API

---

## 一、时间分配总览

| 时间段 | 内容 | 时长 |
|--------|------|------|
| **Day 1 (周一)** | Spring Boot项目创建 + 自动配置原理 | 2h |
| **Day 2 (周二)** | RESTful API开发：Controller + 路由 | 2h |
| **Day 3 (周三)** | 请求处理：参数绑定 + 响应封装 | 2h |
| **Day 4 (周四)** | 配置管理：properties/yml + Profile | 2h |
| **Day 5 (周五)** | 拦截器 + 全局异常处理 | 2h |
| **周六** | 项目实战：用户管理系统API | 4h |
| **周日** | 完善 + 测试API + 总结 | 4h |

---

## 二、核心概念：Spring Boot vs NestJS

`★ Insight ─────────────────────────────────────`  
**Spring Boot和NestJS设计哲学几乎一模一样！**

两者都是：
- 基于**依赖注入**的架构
- 使用**装饰器**（注解）定义路由和依赖
- **约定优于配置**的理念
- 分层架构：Controller → Service → Repository

你的NestJS经验可以直接迁移，只需要学习语法差异。
─────────────────────────────────────────────────

### 核心概念对照表

| NestJS | Spring Boot | 说明 |
|--------|-------------|------|
| `@Controller()` | `@RestController` / `@Controller` | 定义控制器 |
| `@Injectable()` | `@Service` / `@Component` | 可被注入的服务 |
| `@Module()` | `@Configuration` + `@ComponentScan` | 模块配置 |
| `@Get()` / `@Post()` | `@GetMapping` / `@PostMapping` | 路由映射 |
| `@Param()` / `@Body()` | `@PathVariable` / `@RequestBody` | 参数绑定 |
| `Guard` | `HandlerInterceptor` | 请求拦截 |
| `Pipe` | `Converter` / `Formatter` | 数据转换 |
| `Middleware` | `Filter` / `Interceptor` | 中间件处理 |
| `ConfigModule` | `application.yml` + `@Value` | 配置管理 |

---

## 三、Day 1：项目创建与自动配置（2小时）

### 3.1 创建Spring Boot项目

#### 方式1：Spring Initializr网站
访问 https://start.spring.io/ 填写：
- **Project**: Maven
- **Language**: Java
- **Spring Boot**: 3.2.x
- **Project Metadata**:
  - Group: `com.example`
  - Artifact: `demo`
  - Name: `demo`
  - Package name: `com.example.demo`
- **Packaging**: Jar
- **Java**: 17
- **Dependencies**: Spring Web

#### 方式2：IDEA直接创建（推荐）
File → New → Project → Spring Initializr

### 3.2 项目结构解析

```
demo/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/com/example/demo/
│   │   │   └── DemoApplication.java     # 启动类
│   │   └── resources/
│   │       ├── application.properties   # 配置文件
│   │       ├── application.yml          # YAML格式（推荐）
│   │       └── static/                  # 静态资源
│   └── test/
│       └── java/com/example/demo/
│           └── DemoApplicationTests.java
└── target/
```

### 3.3 启动类详解

```java
// src/main/java/com/example/demo/DemoApplication.java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication  // = @Configuration + @EnableAutoConfiguration + @ComponentScan
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

**与NestJS对比**：
```typescript
// NestJS main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

### 3.4 自动配置原理简介

`★ Insight ─────────────────────────────────────`
**Spring Boot的"魔法"**：它通过classpath检测依赖，自动配置组件。

比如加入`spring-boot-starter-web`依赖，它就自动：
1. 内嵌Tomcat服务器
2. 配置Spring MVC
3. 设置JSON序列化（Jackson）
4. 自动处理HTTP请求

你只需写业务代码，其他都自动搞定——这就是"约定优于配置"。
─────────────────────────────────────────────────

### 3.5 第一个REST接口

```java
// src/main/java/com/example/demo/HelloController.java
package com.example.demo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController  // = @Controller + @ResponseBody
public class HelloController {
    
    @GetMapping("/hello")
    public String hello() {
        return "Hello, Spring Boot!";
    }
}
```

**运行应用**：
```bash
# 方式1：IDEA点击运行按钮
# 方式2：命令行
mvn spring-boot:run

# 测试
 curl http://localhost:8080/hello
```

**与NestJS对比**：
```typescript
// NestJS
@Controller()
export class AppController {
  @Get('hello')
  getHello(): string {
    return 'Hello, NestJS!';
  }
}
```

### 3.6 练习任务

1. 创建Spring Boot项目（选择Spring Web依赖）
2. 编写HelloController，访问`/hello`返回字符串
3. 修改端口为8081（在application.yml中配置）
4. 运行并测试

---

## 四、Day 2：RESTful API开发（2小时）

### 4.1 常用注解一览

```java
@RestController
@RequestMapping("/api/users")  // 类级别路径前缀
public class UserController {
    
    // GET /api/users
    @GetMapping
    public List<User> getAllUsers() { }
    
    // GET /api/users/{id}
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) { }
    
    // POST /api/users
    @PostMapping
    public User createUser(@RequestBody UserDTO user) { }
    
    // PUT /api/users/{id}
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody UserDTO user) { }
    
    // DELETE /api/users/{id}
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) { }
    
    // GET /api/users/search?keyword=xxx
    @GetMapping("/search")
    public List<User> search(@RequestParam String keyword) { }
}
```

**与NestJS对比**：

| NestJS | Spring Boot |
|--------|-------------|
| `@Get()` | `@GetMapping` |
| `@Param('id')` | `@PathVariable` |
| `@Body()` | `@RequestBody` |
| `@Query('keyword')` | `@RequestParam` |

### 4.2 请求参数绑定详解

```java
@RestController
@RequestMapping("/demo")
public class DemoController {
    
    // 1. 路径参数 @PathVariable
    @GetMapping("/users/{id}")
    public String getUser(@PathVariable Long id) {
        return "User: " + id;
    }
    
    // 多个路径参数
    @GetMapping("/users/{userId}/orders/{orderId}")
    public String getOrder(
            @PathVariable Long userId,
            @PathVariable Long orderId) {
        return "User: " + userId + ", Order: " + orderId;
    }
    
    // 2. 查询参数 @RequestParam
    @GetMapping("/search")
    public String search(
            @RequestParam String keyword,           // 必填
            @RequestParam(defaultValue = "1") int page,  // 有默认值
            @RequestParam(required = false) String sort) {  // 可选
        return "Search: " + keyword + ", page: " + page;
    }
    
    // 3. 请求体 @RequestBody（JSON自动转对象）
    @PostMapping("/users")
    public String createUser(@RequestBody User user) {
        return "Created: " + user.getName();
    }
    
    // 4. 请求头 @RequestHeader
    @GetMapping("/header")
    public String getHeader(@RequestHeader("User-Agent") String userAgent) {
        return "User-Agent: " + userAgent;
    }
}
```

### 4.3 DTO设计

```java
// 请求DTO
@Data
public class CreateUserRequest {
    @NotBlank(message = "用户名不能为空")
    private String username;
    
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @Min(value = 18, message = "年龄必须大于18")
    private Integer age;
}

// 响应DTO
@Data
@Builder
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private LocalDateTime createdAt;
}
```

**与NestJS对比**：
```typescript
// NestJS DTO
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;
  
  @IsEmail()
  email: string;
}
```

---

## 五、Day 3：请求处理进阶（2小时）

### 5.1 统一响应封装

```java
// 统一响应结构
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private int code;
    private String message;
    private T data;
    private Long timestamp;
    
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .code(200)
                .message("success")
                .data(data)
                .timestamp(System.currentTimeMillis())
                .build();
    }
    
    public static <T> ApiResponse<T> error(int code, String message) {
        return ApiResponse.<T>builder()
                .code(code)
                .message(message)
                .timestamp(System.currentTimeMillis())
                .build();
    }
}
```

使用示例：
```java
@GetMapping("/{id}")
public ApiResponse<User> getUser(@PathVariable Long id) {
    User user = userService.findById(id);
    return ApiResponse.success(user);
}
```

响应结果：
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "zhangsan"
  },
  "timestamp": 1705312800000
}
```

### 5.2 参数校验

**添加依赖**：
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

**使用校验**：
```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @PostMapping
    public ApiResponse<User> createUser(
            @RequestBody @Valid CreateUserRequest request) {
        // @Valid触发校验
        User user = userService.create(request);
        return ApiResponse.success(user);
    }
}
```

**常用校验注解**：

| 注解 | 说明 |
|------|------|
| `@NotNull` | 不能为null |
| `@NotBlank` | 字符串不能为null且trim后不为空 |
| `@NotEmpty` | 字符串/集合/数组不能为空 |
| `@Min(value)` | 数字最小值 |
| `@Max(value)` | 数字最大值 |
| `@Size(min, max)` | 长度范围 |
| `@Email` | 邮箱格式 |
| `@Pattern(regexp)` | 正则表达式 |

**与NestJS对比**：
NestJS用`class-validator`，Spring Boot用`javax.validation`，注解名称几乎一样！

---

## 六、Day 4：配置管理（2小时）

### 6.1 application.yml（推荐）

```yaml
# src/main/resources/application.yml

# 服务器配置
server:
  port: 8080
  servlet:
    context-path: /api  # 全局前缀

# 自定义配置
app:
  name: MyApplication
  version: 1.0.0
  jwt:
    secret: mySecretKey
    expiration: 86400000  # 24小时

# 日志配置
logging:
  level:
    root: INFO
    com.example: DEBUG
```

### 6.2 读取配置

**方式1：@Value（简单值）**
```java
@Service
public class AppService {
    
    @Value("${app.name}")
    private String appName;
    
    @Value("${app.jwt.expiration:86400000}")  // 有默认值
    private Long jwtExpiration;
}
```

**方式2：@ConfigurationProperties（配置类）**
```java
@Data
@Component
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {
    private String secret;
    private Long expiration;
}

// 使用
@Service
public class JwtService {
    @Autowired
    private JwtProperties jwtProperties;
}
```

**与NestJS对比**：
```typescript
// NestJS
@Injectable()
export class ConfigService {
  constructor(private configService: ConfigService) {}
  
  getJwtSecret() {
    return this.configService.get<string>('JWT_SECRET');
  }
}
```

### 6.3 多环境配置（Profile）

```yaml
# application.yml - 主配置
spring:
  profiles:
    active: dev  # 激活开发环境

---
# application-dev.yml - 开发环境
server:
  port: 8080
logging:
  level:
    root: DEBUG

---
# application-prod.yml - 生产环境
server:
  port: 80
logging:
  level:
    root: WARN
```

**与NestJS对比**：
NestJS用`.env`文件 + `ConfigModule`，Spring Boot用`application-{profile}.yml`。

---

## 七、Day 5：拦截器与异常处理（2小时）

### 7.1 全局异常处理

```java
@RestControllerAdvice  // 全局异常处理
@Slf4j
public class GlobalExceptionHandler {
    
    // 处理参数校验异常
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResponse<Void> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        
        return ApiResponse.error(400, message);
    }
    
    // 处理业务异常
    @ExceptionHandler(BusinessException.class)
    public ApiResponse<Void> handleBusinessException(BusinessException e) {
        log.error("业务异常: {}", e.getMessage());
        return ApiResponse.error(e.getCode(), e.getMessage());
    }
    
    // 处理其他所有异常
    @ExceptionHandler(Exception.class)
    public ApiResponse<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return ApiResponse.error(500, "系统繁忙，请稍后重试");
    }
}
```

**与NestJS对比**：
```typescript
// NestJS异常过滤器
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    // 处理异常...
  }
}
```

### 7.2 拦截器（Interceptor）

```java
@Component
@Slf4j
public class LoggingInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                             HttpServletResponse response, 
                             Object handler) {
        log.info("请求开始: {} {}", request.getMethod(), request.getRequestURI());
        request.setAttribute("startTime", System.currentTimeMillis());
        return true;  // 返回true继续执行，false中断
    }
    
    @Override
    public void postHandle(HttpServletRequest request,
                           HttpServletResponse response,
                           Object handler,
                           ModelAndView modelAndView) {
        long startTime = (Long) request.getAttribute("startTime");
        long duration = System.currentTimeMillis() - startTime;
        log.info("请求结束: {} {}, 耗时: {}ms", 
                request.getMethod(), 
                request.getRequestURI(),
                duration);
    }
}

// 注册拦截器
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Autowired
    private LoggingInterceptor loggingInterceptor;
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(loggingInterceptor)
                .addPathPatterns("/**")           // 拦截所有路径
                .excludePathPatterns("/login");   // 排除登录接口
    }
}
```

**与NestJS对比**：
```typescript
// NestJS拦截器
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    console.log('Before...');
    return next.handle().pipe(tap(() => console.log('After...')));
  }
}
```

---

## 八、周六项目：用户管理系统API（4小时）

### 需求规格

开发一个完整的用户管理REST API：

```
GET    /api/users          # 查询所有用户（支持分页）
GET    /api/users/{id}     # 查询单个用户
POST   /api/users          # 创建用户
PUT    /api/users/{id}     # 更新用户
DELETE /api/users/{id}     # 删除用户
GET    /api/users/search   # 搜索用户（按用户名）
```

### 项目结构

```
user-management/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/com/example/user/
│   │   │   ├── UserManagementApplication.java
│   │   │   ├── config/
│   │   │   │   └── WebConfig.java
│   │   │   ├── controller/
│   │   │   │   └── UserController.java
│   │   │   ├── service/
│   │   │   │   ├── UserService.java
│   │   │   │   └── UserServiceImpl.java
│   │   │   ├── dto/
│   │   │   │   ├── CreateUserRequest.java
│   │   │   │   ├── UpdateUserRequest.java
│   │   │   │   └── UserResponse.java
│   │   │   ├── entity/
│   │   │   │   └── User.java
│   │   │   ├── exception/
│   │   │   │   ├── BusinessException.java
│   │   │   │   └── GlobalExceptionHandler.java
│   │   │   └── interceptor/
│   │   │       └── LoggingInterceptor.java
│   │   └── resources/
│   │       └── application.yml
│   └── test/
│       └── java/com/example/user/
└── target/
```

### 核心代码

```java
// entity/User.java - 模拟数据库实体
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private Long id;
    private String username;
    private String email;
    private Integer age;
    private LocalDateTime createdAt;
}

// service/UserService.java
public interface UserService {
    List<User> findAll();
    User findById(Long id);
    User create(CreateUserRequest request);
    User update(Long id, UpdateUserRequest request);
    void delete(Long id);
    List<User> search(String keyword);
}

// service/UserServiceImpl.java - 先用内存存储
@Service
@Slf4j
public class UserServiceImpl implements UserService {
    private final Map<Long, User> userStore = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);
    
    @PostConstruct
    public void init() {
        // 初始化一些数据
        create(new CreateUserRequest("admin", "admin@example.com", 25));
        create(new CreateUserRequest("user1", "user1@example.com", 30));
    }
    
    @Override
    public User create(CreateUserRequest request) {
        User user = User.builder()
                .id(idGenerator.getAndIncrement())
                .username(request.getUsername())
                .email(request.getEmail())
                .age(request.getAge())
                .createdAt(LocalDateTime.now())
                .build();
        userStore.put(user.getId(), user);
        log.info("创建用户: {}", user);
        return user;
    }
    
    // ... 其他方法实现
}
```

### 功能检查清单

- [ ] 统一响应格式（ApiResponse）
- [ ] 参数校验（@Valid）
- [ ] 全局异常处理
- [ ] 请求日志拦截器
- [ ] 配置文件（端口、应用名）
- [ ] 完整的CRUD接口
- [ ] 使用Postman/APIFox测试通过

---

## 九、周日：完善与测试（4小时）

### 9.1 API测试

使用Postman或APIFox创建测试集合：

```
用户管理API测试
├── 创建用户
│   POST http://localhost:8080/api/users
│   Body: { "username": "test", "email": "test@example.com", "age": 20 }
│
├── 查询所有用户
│   GET http://localhost:8080/api/users
│
├── 查询单个用户
│   GET http://localhost:8080/api/users/1
│
├── 更新用户
│   PUT http://localhost:8080/api/users/1
│   Body: { "username": "updated", "email": "updated@example.com", "age": 25 }
│
├── 删除用户
│   DELETE http://localhost:8080/api/users/1
│
└── 搜索用户
    GET http://localhost:8080/api/users/search?keyword=test
```

### 9.2 知识点总结

**与NestJS的异同总结**：

| 方面 | NestJS | Spring Boot | 学习建议 |
|------|--------|-------------|----------|
| 上手曲线 | 平 | 稍陡 | Spring概念多但不难 |
| 配置方式 | 代码为主 | 配置为主 | 习惯YAML配置 |
| 生态丰富度 | 中等 | 极丰富 | 善用Spring官方文档 |
| 企业应用 | 较少 | 主流 | 学会Spring = 更多机会 |

---

## 十、学习资源

### 视频
- [尚硅谷SpringBoot入门](https://www.bilibili.com/video/BV15b4y1a7yG) - P1-P30
- [狂神说SpringBoot](https://www.bilibili.com/video/BV1PE411i7CV) - 基础部分

### 文档
- [Spring官方Guide](https://spring.io/guides/gs/rest-service/)
- [Spring Boot文档](https://docs.spring.io/spring-boot/docs/current/reference/html/)

---

## 十一、Week 4 里程碑

完成本周后，你应该能够：

- [ ] 创建Spring Boot项目（通过Initializr或IDEA）
- [ ] 理解自动配置原理
- [ ] 开发完整的RESTful API（CRUD）
- [ ] 统一响应格式和异常处理
- [ ] 使用配置文件管理配置
- [ ] 添加拦截器记录请求日志
- [ ] 使用Postman测试API

---

## 下一步预告

**Week 5：数据访问层 - JPA + MySQL**

你将：
1. 连接MySQL数据库
2. 使用Spring Data JPA进行CRUD
3. 理解ORM思想
4. 实现真正的数据持久化

---

`★ Insight ─────────────────────────────────────`
**Week 4是转变的关键周！**

前3周你在学"Java语言+工具"，从Week 4开始，你正式成为"后端开发者"——编写API、处理HTTP请求、设计接口。

好消息是：**你的NestJS 80%的经验可以直接用**。控制器、服务、依赖注入这些概念几乎一模一样，你只需要适应Java的语法和Spring的注解。
─────────────────────────────────────────────────

有任何Spring Boot或REST API设计的问题吗？比如Controller怎么分层、异常处理的细节、或者与NestJS的对比？
