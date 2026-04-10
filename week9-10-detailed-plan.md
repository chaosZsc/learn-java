# Week 9-10 详细学习计划：认证项目深度实践

> **目标**：构建完整的权限管理系统，深入理解RBAC和OAuth2  
> **投入时间**：30-40小时（两周）  
> **预期产出**：带角色权限的企业级权限管理系统

---

## 一、为什么需要这两周

`★ Insight ─────────────────────────────────────`
**Week 6只是Security入门，实际企业项目远比基础JWT复杂**

真实企业需要：
- 多角色权限管理（RBAC）
- 按钮级权限控制
- 数据权限（只能看自己部门数据）
- 刷新Token机制
- 单点登录（SSO）基础

这两周将构建一个接近生产级的权限系统。
─────────────────────────────────────────────────

---

## 二、Week 9：RBAC权限模型 + 刷新Token

### 9.1 RBAC模型设计

**数据库表结构**：
```sql
-- 用户表
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    department_id BIGINT,  -- 所属部门
    status TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,  -- ROLE_ADMIN, ROLE_MANAGER
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 权限表（资源+操作）
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,        -- user:create, user:delete
    resource VARCHAR(50) NOT NULL,     -- user, order, article
    action VARCHAR(50) NOT NULL,       -- create, read, update, delete
    description VARCHAR(255)
);

-- 用户-角色关联
CREATE TABLE user_roles (
    user_id BIGINT,
    role_id BIGINT,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- 角色-权限关联
CREATE TABLE role_permissions (
    role_id BIGINT,
    permission_id BIGINT,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

-- 部门表（数据权限用）
CREATE TABLE departments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    parent_id BIGINT,  -- 上级部门
    FOREIGN KEY (parent_id) REFERENCES departments(id)
);
```

### 9.2 实体关系实现

```java
@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String username;
    private String password;
    private String email;
    
    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();
    
    // 获取所有权限（扁平化）
    public Set<Permission> getAllPermissions() {
        return roles.stream()
                .flatMap(role -> role.getPermissions().stream())
                .collect(Collectors.toSet());
    }
}

@Entity
@Table(name = "roles")
@Data
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String description;
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "role_permissions",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<Permission> permissions = new HashSet<>();
}

@Entity
@Table(name = "permissions")
@Data
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;     // user:create
    private String resource; // user
    private String action;   // create
    private String description;
}
```

### 9.3 刷新Token机制

**问题**：Access Token有效期短（30分钟），频繁登录体验差
**解决**：使用Refresh Token（7天）无感刷新

```java
@Service
@RequiredArgsConstructor
public class TokenService {
    
    private final JwtUtil jwtUtil;
    private final RedisTemplate<String, Object> redisTemplate;
    private final UserRepository userRepository;
    
    // Token配置
    private static final long ACCESS_TOKEN_EXPIRE = 30 * 60 * 1000;      // 30分钟
    private static final long REFRESH_TOKEN_EXPIRE = 7 * 24 * 60 * 60 * 1000;  // 7天
    
    /**
     * 生成Token对
     */
    public TokenPair createTokenPair(User user) {
        // Access Token
        String accessToken = jwtUtil.generateToken(user, ACCESS_TOKEN_EXPIRE);
        
        // Refresh Token（随机UUID）
        String refreshToken = UUID.randomUUID().toString();
        
        // Refresh Token存入Redis（绑定用户）
        String redisKey = "refresh_token:" + refreshToken;
        redisTemplate.opsForValue().set(redisKey, user.getId(), 
                REFRESH_TOKEN_EXPIRE, TimeUnit.MILLISECONDS);
        
        return TokenPair.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .accessTokenExpire(ACCESS_TOKEN_EXPIRE)
                .refreshTokenExpire(REFRESH_TOKEN_EXPIRE)
                .build();
    }
    
    /**
     * 刷新Access Token
     */
    public TokenPair refreshAccessToken(String refreshToken) {
        // 验证Refresh Token
        String redisKey = "refresh_token:" + refreshToken;
        Long userId = (Long) redisTemplate.opsForValue().get(redisKey);
        
        if (userId == null) {
            throw new BusinessException(401, "Refresh Token已过期或无效");
        }
        
        // 删除旧Refresh Token（轮换机制）
        redisTemplate.delete(redisKey);
        
        // 生成新Token对
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(401, "用户不存在"));
        
        return createTokenPair(user);
    }
    
    /**
     * 退出登录 - 清除Refresh Token
     */
    public void logout(String refreshToken) {
        String redisKey = "refresh_token:" + refreshToken;
        redisTemplate.delete(redisKey);
    }
}

@Data
@Builder
public class TokenPair {
    private String accessToken;
    private String refreshToken;
    private Long accessTokenExpire;
    private Long refreshTokenExpire;
}
```

### 9.4 权限检查实现

```java
@Component("permissionService")
@Slf4j
@RequiredArgsConstructor
public class PermissionService {
    
    /**
     * 检查用户是否有指定权限
     */
    public boolean hasPermission(Long userId, String permission) {
        // 从缓存获取用户权限
        String cacheKey = "user:permissions:" + userId;
        Set<String> permissions = (Set<String>) redisTemplate.opsForValue().get(cacheKey);
        
        if (permissions == null) {
            // 缓存未命中，从数据库加载
            User user = userRepository.findByIdWithPermissions(userId)
                    .orElseThrow(() -> new RuntimeException("用户不存在"));
            
            permissions = user.getAllPermissions().stream()
                    .map(Permission::getName)
                    .collect(Collectors.toSet());
            
            // 缓存权限（1小时）
            redisTemplate.opsForValue().set(cacheKey, permissions, 1, TimeUnit.HOURS);
        }
        
        // 超级管理员拥有所有权限
        if (permissions.contains("*:*")) {
            return true;
        }
        
        return permissions.contains(permission);
    }
    
    /**
     * 数据权限检查：用户只能访问自己部门及子部门的数据
     */
    public boolean hasDataPermission(Long userId, Long dataDepartmentId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
        
        Long userDeptId = user.getDepartment().getId();
        
        // 获取用户部门的所有子部门
        Set<Long> accessibleDeptIds = getChildDepartmentIds(userDeptId);
        accessibleDeptIds.add(userDeptId);
        
        return accessibleDeptIds.contains(dataDepartmentId);
    }
    
    /**
     * 清除权限缓存（角色变更时调用）
     */
    public void clearPermissionCache(Long userId) {
        redisTemplate.delete("user:permissions:" + userId);
    }
}
```

---

## 三、Week 10：按钮级权限 + 数据权限 + 审计日志

### 10.1 前端权限控制（Vue/React配合）

**权限指令（Vue3示例）**：
```typescript
// directives/permission.ts
import { Directive } from 'vue';

export const permission: Directive = {
  mounted(el, binding) {
    const { value } = binding;
    const permissions = useUserStore().permissions;
    
    if (!permissions.includes(value)) {
      el.parentNode?.removeChild(el);
    }
  }
};

// 使用
<template>
  <button v-permission="'user:create'">新增用户</button>
  <button v-permission="'user:delete'">删除用户</button>
</template>
```

**权限路由守卫**：
```typescript
// router/guard.ts
router.beforeEach((to, from, next) => {
  const requiredPermission = to.meta.permission;
  const userPermissions = useUserStore().permissions;
  
  if (requiredPermission && !userPermissions.includes(requiredPermission)) {
    next('/403');
  } else {
    next();
  }
});
```

### 10.2 后端权限注解增强

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequirePermission {
    String value();  // 权限标识
    String logical() default "AND";  // AND或OR（多个权限时）
}

// 切面实现
@Aspect
@Component
@RequiredArgsConstructor
public class PermissionAspect {
    
    private final PermissionService permissionService;
    
    @Around("@annotation(requirePermission)")
    public Object around(ProceedingJoinPoint point, RequirePermission requirePermission) 
            throws Throwable {
        
        // 获取当前用户
        Long userId = SecurityUtils.getCurrentUserId();
        
        // 检查权限
        String permission = requirePermission.value();
        if (!permissionService.hasPermission(userId, permission)) {
            throw new AccessDeniedException("没有权限: " + permission);
        }
        
        return point.proceed();
    }
}

// 使用
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @PostMapping
    @RequirePermission("user:create")
    public ApiResponse<User> createUser(@RequestBody CreateUserRequest request) {
        // 只有有user:create权限的用户才能访问
    }
    
    @DeleteMapping("/{id}")
    @RequirePermission("user:delete")
    public ApiResponse<Void> deleteUser(@PathVariable Long id) {
        // 删除权限
    }
}
```

### 10.3 审计日志（操作记录）

```java
@Entity
@Table(name = "audit_logs")
@Data
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long userId;           // 操作人
    private String username;       // 操作人姓名
    private String operation;      // 操作类型
    private String method;         // 请求方法
    private String params;         // 请求参数
    private String ip;             // IP地址
    private Long duration;         // 执行时长
    private String userAgent;      // 浏览器信息
    private Boolean success;       // 是否成功
    private String errorMsg;       // 错误信息
    private LocalDateTime createdAt;
}

// 切面记录日志
@Aspect
@Component
@RequiredArgsConstructor
public class AuditLogAspect {
    
    private final AuditLogRepository auditLogRepository;
    
    @Around("@annotation(auditLog)")
    public Object around(ProceedingJoinPoint point, AuditLogAnnotation auditLog) 
            throws Throwable {
        
        AuditLog log = new AuditLog();
        log.setOperation(auditLog.value());
        log.setMethod(point.getSignature().getName());
        log.setCreatedAt(LocalDateTime.now());
        
        // 获取当前用户
        try {
            UserDetails user = SecurityUtils.getCurrentUser();
            log.setUserId(user.getId());
            log.setUsername(user.getUsername());
        } catch (Exception e) {
            log.setUsername("anonymous");
        }
        
        // 记录参数
        log.setParams(Arrays.toString(point.getArgs()));
        
        // 获取IP和用户代理
        HttpServletRequest request = getCurrentRequest();
        log.setIp(getClientIp(request));
        log.setUserAgent(request.getHeader("User-Agent"));
        
        // 执行方法
        long start = System.currentTimeMillis();
        try {
            Object result = point.proceed();
            log.setSuccess(true);
            return result;
        } catch (Exception e) {
            log.setSuccess(false);
            log.setErrorMsg(e.getMessage());
            throw e;
        } finally {
            log.setDuration(System.currentTimeMillis() - start);
            auditLogRepository.save(log);
        }
    }
}

// 使用
@PostMapping
@RequirePermission("user:create")
@AuditLog("创建用户")
public ApiResponse<User> createUser(@RequestBody CreateUserRequest request) {
    // 会自动记录操作日志
}
```

### 10.4 项目实战：权限管理系统

**功能需求**：
```
系统管理
├── 用户管理
│   ├── 用户CRUD
│   ├── 分配角色
│   └── 数据权限范围设置
├── 角色管理
│   ├── 角色CRUD
│   └── 分配权限
├── 菜单管理
│   └── 前端路由/按钮权限配置
├── 部门管理
│   └── 树形部门结构
└── 操作日志
    └── 审计日志查询
```

**项目检查清单**：
- [ ] RBAC五表结构设计
- [ ] JWT + Refresh Token双Token机制
- [ ] 按钮级权限控制（前后端）
- [ ] 数据权限（部门范围）
- [ ] 操作审计日志
- [ ] 权限缓存（Redis）
- [ ] 角色变更实时生效

---

## 四、学习资源

### 视频
- [尚硅谷RBAC权限实战](https://www.bilibili.com/video/BV1pp4y1x7ZJ)
- [江南一点雨Spring Security高级](https://www.bilibili.com/video/BV1WK41177R8)

### 文档
- [Spring Security官方文档-授权](https://docs.spring.io/spring-security/reference/servlet/authorization/index.html)
- [RBAC模型详解](https://www.ruanyifeng.com/blog/2019/09/rbac.html)

---

## Week 9-10 里程碑

完成这两周后，你应该能够：

- [ ] 设计RBAC五表权限模型
- [ ] 实现JWT双Token刷新机制
- [ ] 按钮级权限控制
- [ ] 数据权限范围控制
- [ ] 操作审计日志
- [ ] 权限缓存与实时刷新

**至此，你的权限管理知识已达到生产环境要求！**
