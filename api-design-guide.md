# API设计规范与最佳实践

> **适用阶段**：Week 3-4 学习期间配合阅读  
> **目标**：掌握RESTful API设计规范，能写出标准、易维护的接口

---

## 一、为什么需要API设计规范

`★ Insight ─────────────────────────────────────`
**好的API设计 = 前后端协作效率 + 系统可维护性**

- 前端开发者能快速理解接口用法
- 后端代码结构清晰，易于扩展
- 团队新人能快速上手项目
- 减少前后端沟通成本
─────────────────────────────────────────────────

---

## 二、RESTful API设计原则

### 2.1 URL设计规范

**资源命名（使用名词，复数形式）**：

```
✅ 正确：
GET    /api/users              # 获取用户列表
GET    /api/users/123          # 获取用户详情
POST   /api/users              # 创建用户
PUT    /api/users/123          # 更新用户
DELETE /api/users/123          # 删除用户

❌ 错误：
GET    /api/getUsers           # 动词开头
GET    /api/user/getById       # 多级动词
POST   /api/user/create        # 冗余动词
GET    /api/userList           # 驼峰命名
```

**嵌套资源**：
```
GET    /api/users/123/orders           # 获取用户123的所有订单
GET    /api/users/123/orders/456       # 获取用户123的订单456
POST   /api/users/123/orders           # 为用户123创建订单
```

**过滤、排序、分页（使用Query参数）**：
```
GET /api/users?status=active                    # 过滤
GET /api/users?page=1&size=20                   # 分页
GET /api/users?sort=createdAt,desc              # 排序
GET /api/users?status=active&sort=age,asc       # 组合
```

### 2.2 HTTP方法使用

| 方法 | 用途 | 幂等性 | Body |
|------|------|--------|------|
| GET | 获取资源 | ✅ 是 | ❌ 无 |
| POST | 创建资源 | ❌ 否 | ✅ 有 |
| PUT | 全量更新 | ✅ 是 | ✅ 有 |
| PATCH | 部分更新 | ❌ 否 | ✅ 有 |
| DELETE | 删除资源 | ✅ 是 | ❌ 无/可选 |

**POST vs PUT vs PATCH对比**：
```
POST   /api/users              # 创建新用户（服务器分配ID）
PUT    /api/users/123          # 全量替换用户123（含所有字段）
PATCH  /api/users/123          # 部分更新（只传需要改的字段）
```

```json
// PUT请求体 - 必须包含所有字段
{
  "id": 123,
  "username": "zhangsan",
  "email": "zhang@example.com",
  "age": 25
}

// PATCH请求体 - 只传要改的字段
{
  "email": "newemail@example.com"
}
```

### 2.3 HTTP状态码规范

** success (2xx)**：

| 状态码 | 使用场景 | 示例 |
|--------|----------|------|
| 200 | 通用成功 | GET、PUT、DELETE成功 |
| 201 | 创建成功 | POST创建资源成功 |
| 204 | 成功但无返回 | DELETE成功，不返回内容 |

**客户端错误 (4xx)**：

| 状态码 | 使用场景 | 示例 |
|--------|----------|------|
| 400 | 请求参数错误 | 缺少必填字段、格式错误 |
| 401 | 未认证 | Token缺失或过期 |
| 403 | 无权限 | 已登录但无权访问 |
| 404 | 资源不存在 | 用户ID不存在 |
| 409 | 资源冲突 | 重复创建已存在资源 |
| 422 | 业务校验失败 | 余额不足、库存不足 |
| 429 | 请求频繁 | 限流触发 |

**服务端错误 (5xx)**：

| 状态码 | 使用场景 |
|--------|----------|
| 500 | 服务器内部错误 |
| 502 | 网关错误 |
| 503 | 服务不可用 |

---

## 三、统一响应格式

### 3.1 标准响应结构

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "timestamp": 1705312800000,
  "requestId": "req_abc123"
}
```

**字段说明**：
- `code`: 业务状态码（200成功，非200失败）
- `message`: 提示信息（错误时显示给用户）
- `data`: 响应数据（失败时为null或省略）
- `timestamp`: 服务器时间戳
- `requestId`: 请求唯一标识（便于日志追踪）

### 3.2 成功响应示例

```json
// 单条数据
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "zhangsan",
    "email": "zhang@example.com"
  },
  "timestamp": 1705312800000
}

// 列表数据
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {"id": 1, "username": "zhangsan"},
      {"id": 2, "username": "lisi"}
    ],
    "pagination": {
      "page": 1,
      "size": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "timestamp": 1705312800000
}

// 创建成功
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "id": 3,
    "username": "wangwu"
  },
  "timestamp": 1705312800000
}
```

### 3.3 错误响应示例

```json
// 参数错误
{
  "code": 400,
  "message": "请求参数错误",
  "data": {
    "errors": [
      {"field": "email", "message": "邮箱格式不正确"},
      {"field": "password", "message": "密码不能为空"}
    ]
  },
  "timestamp": 1705312800000,
  "requestId": "req_def456"
}

// 认证失败
{
  "code": 401,
  "message": "登录已过期，请重新登录",
  "data": null,
  "timestamp": 1705312800000
}

// 权限不足
{
  "code": 403,
  "message": "您没有权限执行此操作",
  "data": null,
  "timestamp": 1705312800000
}
```

### 3.4 Java实现代码

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    
    private Integer code;
    private String message;
    private T data;
    private Long timestamp;
    private String requestId;
    
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .code(200)
                .message("success")
                .data(data)
                .timestamp(System.currentTimeMillis())
                .requestId(generateRequestId())
                .build();
    }
    
    public static <T> ApiResponse<T> created(T data) {
        return ApiResponse.<T>builder()
                .code(201)
                .message("创建成功")
                .data(data)
                .timestamp(System.currentTimeMillis())
                .requestId(generateRequestId())
                .build();
    }
    
    public static <T> ApiResponse<T> error(int code, String message) {
        return ApiResponse.<T>builder()
                .code(code)
                .message(message)
                .timestamp(System.currentTimeMillis())
                .requestId(generateRequestId())
                .build();
    }
    
    public static <T> ApiResponse<T> error(int code, String message, T data) {
        return ApiResponse.<T>builder()
                .code(code)
                .message(message)
                .data(data)
                .timestamp(System.currentTimeMillis())
                .requestId(generateRequestId())
                .build();
    }
    
    private static String generateRequestId() {
        return "req_" + UUID.randomUUID().toString().substring(0, 8);
    }
}

// 分页数据封装
@Data
@Builder
public class PageResult<T> {
    private List<T> list;
    private Pagination pagination;
    
    @Data
    @Builder
    public static class Pagination {
        private int page;        // 当前页（从1开始）
        private int size;        // 每页条数
        private long total;      // 总条数
        private int totalPages;  // 总页数
    }
    
    public static <T> PageResult<T> of(Page<T> page) {
        return PageResult.<T>builder()
                .list(page.getContent())
                .pagination(Pagination.builder()
                        .page(page.getNumber() + 1)
                        .size(page.getSize())
                        .size(page.getSize())
                        .total(page.getTotalElements())
                        .totalPages(page.getTotalPages())
                        .build())
                .build();
    }
}
```

---

## 四、API版本管理

### 4.1 版本命名策略

**方案1：URL路径（推荐）**
```
/api/v1/users
/api/v2/users
```

**方案2：Header**
```
GET /api/users
Accept-Version: v1
```

**方案3：Query参数**
```
/api/users?version=2
```

### 4.2 版本控制原则

- **向后兼容**：v2发布后，v1至少保留6个月
- **增量更新**：只修改需要变更的接口，不变的不动
- **弃用提示**：旧版本API返回`Deprecation`头

---

## 五、API文档规范（OpenAPI/Swagger）

### 5.1 集成Swagger

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.3.0</version>
</dependency>
```

```java
@Configuration
public class OpenApiConfig {
    
    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("任务协作平台 API")
                        .description("任务协作平台后端接口文档")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("开发团队")
                                .email("dev@example.com")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer认证"))
                .components(new Components()
                        .addSecuritySchemes("Bearer认证",
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }
}

// 在Controller中使用注解
@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "用户管理", description = "用户相关接口")
public class UserController {
    
    @GetMapping("/{id}")
    @Operation(summary = "获取用户详情", description = "根据用户ID获取详细信息")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "成功"),
        @ApiResponse(responseCode = "404", description = "用户不存在")
    })
    public ApiResponse<User> getUser(
            @Parameter(description = "用户ID") @PathVariable Long id) {
        // ...
    }
    
    @PostMapping
    @Operation(summary = "创建用户", description = "注册新用户")
    public ApiResponse<User> createUser(
            @RequestBody @Valid CreateUserRequest request) {
        // ...
    }
}
```

访问 `/swagger-ui.html` 查看文档。

---

## 六、前后端协作规范

### 6.1 接口约定清单

开发前必须确认：
- [ ] URL路径和方法
- [ ] 请求参数（必填/选填、类型、示例）
- [ ] 请求Body结构
- [ ] 成功响应结构和示例
- [ ] 错误响应结构
- [ ] 状态码定义
- [ ] 接口鉴权方式

### 6.2 Mock数据

前端开发时，后端应提供Mock服务：
```java
@RestController
@Profile("dev")  // 只在开发环境启用
public class MockController {
    
    @GetMapping("/mock/users")
    public ApiResponse<List<User>> mockUsers() {
        // 返回假数据
        return ApiResponse.success(Arrays.asList(
            User.builder().id(1L).username("mock1").build(),
            User.builder().id(2L).username("mock2").build()
        ));
    }
}
```

---

## 七、前端对接最佳实践

### 7.1 Axios封装示例

```typescript
// api/http.ts
import axios from 'axios';
import { message } from 'antd';

const http = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
http.interceptors.response.use(
  (response) => {
    const { code, data, message: msg } = response.data;
    
    if (code === 200 || code === 201) {
      return data;  // 直接返回data
    }
    
    message.error(msg || '请求失败');
    return Promise.reject(new Error(msg));
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default http;
```

### 7.2 类型定义

```typescript
// types/api.ts
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface PageResult<T> {
  list: T[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
}

// api/user.ts
import http from './http';
import type { User, PageResult, ApiResponse } from '@/types/api';

export const userApi = {
  getUser(id: number): Promise<User> {
    return http.get(`/users/${id}`);
  },
  
  getUsers(params: { page?: number; size?: number }): Promise<PageResult<User>> {
    return http.get('/users', { params });
  },
  
  createUser(data: Partial<User>): Promise<User> {
    return http.post('/users', data);
  },
  
  updateUser(id: number, data: Partial<User>): Promise<User> {
    return http.put(`/users/${id}`, data);
  },
  
  deleteUser(id: number): Promise<void> {
    return http.delete(`/users/${id}`);
  },
};
```

---

## 八、检查清单

设计API时检查：

- [ ] URL使用名词复数，不使用动词
- [ ] HTTP方法使用正确
- [ ] 状态码符合语义
- [ ] 响应格式统一
- [ ] 错误信息友好
- [ ] 有分页参数
- [ ] 有过滤/排序支持
- [ ] 接口文档完整
- [ ] 有请求ID便于追踪

---

**配合Week 3-4学习，在写第一个Spring Boot项目时参考本规范！**
