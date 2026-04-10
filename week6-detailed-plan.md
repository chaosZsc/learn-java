# Week 6 详细学习计划：认证与安全 - Spring Security + JWT

> **目标**：掌握Spring Security框架，实现JWT认证，保护API安全  
> **投入时间**：15-20小时（周中10h + 周末10h）  
> **预期产出**：带JWT认证的完整用户系统 + 权限控制

---

## 一、时间分配总览

| 时间段 | 内容 | 时长 |
|--------|------|------|
| **Day 1 (周一)** | Spring Security基础 + 过滤器链 | 2h |
| **Day 2 (周二)** | JWT原理 + jjwt库使用 | 2h |
| **Day 3 (周三)** | 用户注册/登录实现 | 2h |
| **Day 4 (周四)** | JWT过滤器 + 认证流程 | 2h |
| **Day 5 (周五)** | 授权与权限控制 | 2h |
| **周六** | 项目实战：完整认证系统 | 4h |
| **周日** | 前后端对接 + 安全最佳实践 | 4h |

---

## 二、核心概念：与NestJS对比

`★ Insight ─────────────────────────────────────`  
**Spring Security ≈ NestJS Passport + Guards + 拦截器的组合**

安全核心概念是通用的：
- **认证（Authentication）**：验证用户是谁（登录）
- **授权（Authorization）**：验证用户能做什么（权限）
- **过滤器/中间件**：请求预处理

Spring Security功能更强大但配置更复杂，理解核心原理后可以快速上手。
─────────────────────────────────────────────────

### 安全概念对照

| NestJS | Spring Boot | 说明 |
|--------|-------------|------|
| `Passport` | `Spring Security` | 认证框架 |
| `JwtStrategy` | `OncePerRequestFilter` | JWT验证 |
| `AuthGuard` | `@PreAuthorize` | 权限控制 |
| `@UseGuards()` | `SecurityFilterChain` | 防护配置 |
| `bcrypt` | `BCryptPasswordEncoder` | 密码加密 |

---

## 三、Day 1：Spring Security基础（2小时）

### 3.1 添加依赖

```xml
<dependencies>
    <!-- Spring Security -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    
    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.3</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.12.3</version>
        <scope>runtime</scope>
    </dependency>
</dependencies>
```

### 3.2 Spring Security过滤器链

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // CSRF配置（前后端分离可禁用）
            .csrf(csrf -> csrf.disable())
            
            // 会话管理（JWT无状态，不使用session）
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            
            // 请求授权
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()  // 公开接口
                .requestMatchers("/api/admin/**").hasRole("ADMIN")  // 管理员接口
                .anyRequest().authenticated()  // 其他需要认证
            )
            
            // 添加JWT过滤器
            .addFilterBefore(jwtAuthFilter(), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

**与NestJS对比**：
```typescript
// NestJS
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '24h' },
    }),
  ],
})
export class AuthModule {}
```

### 3.3 密码加密

```java
@Configuration
public class SecurityBeans {
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

// 使用
@Service
@RequiredArgsConstructor
public class AuthService {
    private final PasswordEncoder passwordEncoder;
    
    public User register(RegisterRequest request) {
        // 加密密码
        String encodedPassword = passwordEncoder.encode(request.getPassword());
        // ...
    }
    
    public boolean verifyPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }
}
```

**与NestJS对比**：
```typescript
// NestJS
import * as bcrypt from 'bcrypt';

const hashed = await bcrypt.hash(password, 10);
const isMatch = await bcrypt.compare(password, hashed);
```

---

## 四、Day 2：JWT原理与实现（2小时）

### 4.1 JWT结构

```
JWT Token = header.payload.signature

header: {"alg":"HS256","typ":"JWT"}
payload: {"sub":"123","username":"zhangsan","roles":["USER"],"iat":1705312800}
signature: HMACSHA256(header + "." + payload, secret)
```

### 4.2 JWT工具类

```java
@Component
@Slf4j
public class JwtUtil {
    
    @Value("${jwt.secret}")
    private String secret;
    
    @Value("${jwt.expiration:86400000}")  // 默认24小时
    private long expiration;
    
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
    
    // 生成Token
    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiration);
        
        return Jwts.builder()
                .subject(user.getId().toString())                    // 用户ID
                .claim("username", user.getUsername())               // 自定义声明
                .claim("roles", user.getRoles().stream()
                        .map(Role::getName)
                        .toList())
                .issuedAt(now)                                       // 签发时间
                .expiration(expiryDate)                              // 过期时间
                .signWith(getSigningKey())                           // 签名
                .compact();
    }
    
    // 从Token提取用户ID
    public Long getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        return Long.parseLong(claims.getSubject());
    }
    
    // 从Token提取用户名
    public String getUsernameFromToken(String token) {
        Claims claims = parseToken(token);
        return claims.get("username", String.class);
    }
    
    // 解析Token
    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    
    // 验证Token是否有效
    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.error("Token已过期");
        } catch (UnsupportedJwtException e) {
            log.error("Token格式不支持");
        } catch (MalformedJwtException e) {
            log.error("Token格式错误");
        } catch (SignatureException e) {
            log.error("Token签名验证失败");
        } catch (IllegalArgumentException e) {
            log.error("Token为空或非法");
        }
        return false;
    }
}
```

**配置**：
```yaml
jwt:
  secret: mySecretKey12345678901234567890  # 至少32字符
  expiration: 86400000  # 24小时 = 24 * 60 * 60 * 1000
```

---

## 五、Day 3：注册与登录实现（2小时）

### 5.1 用户实体

```java
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String username;
    
    @Column(nullable = false)
    private String password;  // 存储加密后的密码
    
    @Column(nullable = false, unique = true)
    private String email;
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

// 角色实体
@Entity
@Table(name = "roles")
@Data
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String name;  // ROLE_USER, ROLE_ADMIN
}
```

### 5.2 登录注册DTO

```java
// 注册请求
@Data
public class RegisterRequest {
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 20, message = "用户名长度3-20")
    private String username;
    
    @NotBlank(message = "密码不能为空")
    @Size(min = 6, message = "密码至少6位")
    private String password;
    
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;
}

// 登录请求
@Data
public class LoginRequest {
    @NotBlank(message = "用户名不能为空")
    private String username;
    
    @NotBlank(message = "密码不能为空")
    private String password;
}

// 登录响应
@Data
@Builder
public class LoginResponse {
    private String token;
    private String type;  // Bearer
    private Long expiresIn;
    private UserInfo user;
    
    @Data
    @Builder
    public static class UserInfo {
        private Long id;
        private String username;
        private String email;
        private List<String> roles;
    }
}
```

### 5.3 认证服务

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    
    @Transactional
    public User register(RegisterRequest request) {
        // 检查用户名
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException(409, "用户名已存在");
        }
        
        // 检查邮箱
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(409, "邮箱已被注册");
        }
        
        // 创建用户
        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .roles(new HashSet<>())
                .build();
        
        // 分配默认角色
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("默认角色不存在"));
        user.getRoles().add(userRole);
        
        return userRepository.save(user);
    }
    
    public LoginResponse login(LoginRequest request) {
        // 查找用户
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException(401, "用户名或密码错误"));
        
        // 验证密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(401, "用户名或密码错误");
        }
        
        // 生成JWT
        String token = jwtUtil.generateToken(user);
        
        return LoginResponse.builder()
                .token(token)
                .type("Bearer")
                .expiresIn(86400L)
                .user(LoginResponse.UserInfo.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .roles(user.getRoles().stream()
                                .map(Role::getName)
                                .toList())
                        .build())
                .build();
    }
}
```

### 5.4 认证控制器

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/register")
    public ApiResponse<User> register(@RequestBody @Valid RegisterRequest request) {
        User user = authService.register(request);
        return ApiResponse.success(user);
    }
    
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ApiResponse.success(response);
    }
}
```

---

## 六、Day 4：JWT过滤器（2小时）

### 6.1 自定义UserDetails

```java
@Data
@AllArgsConstructor
public class UserDetailsImpl implements UserDetails {
    
    private Long id;
    private String username;
    private String email;
    private String password;
    private Collection<? extends GrantedAuthority> authorities;
    
    public static UserDetailsImpl build(User user) {
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName()))
                .collect(Collectors.toList());
        
        return new UserDetailsImpl(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPassword(),
                authorities
        );
    }
    
    @Override
    public boolean isAccountNonExpired() { return true; }
    
    @Override
    public boolean isAccountNonLocked() { return true; }
    
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    
    @Override
    public boolean isEnabled() { return true; }
}
```

### 6.2 JWT认证过滤器

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {
    
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            // 1. 从请求头获取JWT
            String jwt = getJwtFromRequest(request);
            
            // 2. 验证JWT
            if (StringUtils.hasText(jwt) && jwtUtil.validateToken(jwt)) {
                // 3. 从JWT获取用户ID
                Long userId = jwtUtil.getUserIdFromToken(jwt);
                
                // 4. 加载用户信息
                UserDetails userDetails = userDetailsService.loadUserByUsername(userId.toString());
                
                // 5. 创建认证对象
                UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                
                // 6. 设置安全上下文
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            log.error("无法设置用户认证", e);
        }
        
        // 继续过滤器链
        filterChain.doFilter(request, response);
    }
    
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

### 6.3 UserDetailsService实现

```java
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
    
    private final UserRepository userRepository;
    
    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + username));
        
        return UserDetailsImpl.build(user);
    }
}
```

---

## 七、Day 5：授权与权限控制（2小时）

### 7.1 方法级别权限

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // 开启方法级权限注解
public class SecurityConfig {
    // ...
}

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;
    
    // 任何认证用户可访问
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<User> getCurrentUser(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        User user = userService.findById(userDetails.getId());
        return ApiResponse.success(user);
    }
    
    // 仅管理员可访问
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<User>> getAllUsers() {
        return ApiResponse.success(userService.findAll());
    }
    
    // 管理员或用户本人
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @userSecurity.checkUserId(authentication, #id)")
    public ApiResponse<User> getUser(@PathVariable Long id) {
        return ApiResponse.success(userService.findById(id));
    }
}

// 自定义权限检查
@Component("userSecurity")
public class UserSecurity {
    public boolean checkUserId(Authentication authentication, Long userId) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        return userDetails.getId().equals(userId);
    }
}
```

### 7.2 常用权限注解

| 注解 | 说明 |
|------|------|
| `@PreAuthorize("hasRole('ADMIN')")` | 执行前检查角色 |
| `@PreAuthorize("hasAuthority('USER_READ')")` | 执行前检查权限 |
| `@PostAuthorize` | 执行后检查 |
| `@Secured("ROLE_ADMIN")` | 简化版角色检查 |
| `@RolesAllowed("ADMIN")` | JSR-250标准注解 |

### 7.3 获取当前用户

```java
@Service
@RequiredArgsConstructor
public class ArticleService {
    
    public Article createArticle(CreateArticleRequest request, UserDetailsImpl currentUser) {
        // 使用当前用户ID作为作者
        Article article = Article.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .authorId(currentUser.getId())
                .build();
        return articleRepository.save(article);
    }
}

// 控制器中传递
@PostMapping
public ApiResponse<Article> create(
        @RequestBody @Valid CreateArticleRequest request,
        @AuthenticationPrincipal UserDetailsImpl currentUser) {
    return ApiResponse.success(articleService.createArticle(request, currentUser));
}
```

---

## 八、周六项目：完整认证系统（4小时）

### 需求规格

实现一个带认证的博客系统：

```
公开接口（无需登录）：
├── POST /api/auth/register    # 注册
├── POST /api/auth/login       # 登录
├── GET  /api/articles         # 文章列表
└── GET  /api/articles/{id}    # 文章详情

认证接口（需要JWT）：
├── GET    /api/users/me       # 当前用户信息
├── POST   /api/articles       # 发布文章（作者）
├── PUT    /api/articles/{id}  # 修改文章（本人或管理员）
├── DELETE /api/articles/{id}  # 删除文章（本人或管理员）
└── POST   /api/comments       # 发表评论

管理员接口（需要ROLE_ADMIN）：
├── GET    /api/users          # 用户列表
└── DELETE /api/users/{id}     # 删除用户
```

### 数据库初始化

```sql
-- 角色数据
INSERT INTO roles (name) VALUES ('ROLE_USER'), ('ROLE_ADMIN');

-- 管理员账号（密码：admin123）
-- 密码使用BCrypt加密
INSERT INTO users (username, password, email, created_at) 
VALUES ('admin', '$2a$10$...encrypted...', 'admin@example.com', NOW());

-- 关联管理员角色
INSERT INTO user_roles (user_id, role_id) 
SELECT u.id, r.id FROM users u, roles r WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN';
```

### 项目结构

```
src/main/java/com/example/blog/
├── config/
│   └── SecurityConfig.java           # 安全配置
├── controller/
│   ├── AuthController.java           # 认证接口
│   └── ArticleController.java        # 文章接口
├── service/
│   ├── AuthService.java
│   └── ArticleService.java
├── security/
│   ├── JwtAuthFilter.java            # JWT过滤器
│   ├── JwtUtil.java                  # JWT工具
│   ├── UserDetailsImpl.java          # 用户详情实现
│   └── UserDetailsServiceImpl.java   # 用户详情服务
├── entity/
│   ├── User.java
│   ├── Role.java
│   └── Article.java
└── dto/
    ├── RegisterRequest.java
    ├── LoginRequest.java
    └── ...
```

---

## 九、周日：前后端对接 + 安全最佳实践（4小时）

### 9.1 前端对接指南

**Vue/React 请求拦截器**：

```typescript
// Vue Axios拦截器
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api'
});

// 请求拦截器：添加Token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理401
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 9.2 安全最佳实践

**1. JWT安全**：
```yaml
jwt:
  # 使用强密钥（至少256位）
  secret: ${JWT_SECRET:your-256-bit-secret-key-here-must-be-long-enough}
  
  # 合理设置过期时间
  expiration: 3600000  # 1小时（生产环境）
  # expiration: 86400000  # 24小时（开发环境）
```

**2. CORS配置**：
```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));  // 前端地址
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
```

**3. 安全配置检查清单**：
- [ ] 使用HTTPS（生产环境）
- [ ] 密码BCrypt加密（强度10+）
- [ ] JWT密钥足够长且安全存储
- [ ] Token设置合理过期时间
- [ ] 敏感接口添加权限控制
- [ ] SQL注入防护（使用JPA/参数化查询）
- [ ] XSS防护（前端转义输出）

---

## 十、学习资源

### 视频
- [尚硅谷SpringSecurity](https://www.bilibili.com/video/BV15a411A7kT)
- [江南一点雨SpringSecurity](https://www.bilibili.com/video/BV1KN41187jK)

### 文档
- [Spring Security官方文档](https://docs.spring.io/spring-security/reference/)
- [JWT.io](https://jwt.io/) - JWT调试工具

### 工具
| 工具 | 用途 |
|------|------|
| Postman | API测试（设置Authorization头）|
| JWT.io | 在线解码JWT |

---

## 十一、Week 6 里程碑

完成本周后，你应该能够：

- [ ] 配置Spring Security安全框架
- [ ] 理解过滤器链工作原理
- [ ] 使用BCrypt加密密码
- [ ] 实现JWT生成与验证
- [ ] 完成用户注册/登录功能
- [ ] 实现JWT认证过滤器
- [ ] 使用方法注解控制权限
- [ ] 前后端JWT对接

---

## 下一步预告

**Week 7-8：综合项目实战**

整合前几周知识，完成一个完整的全栈项目（如任务管理系统、个人博客等），包含：
- 用户认证
- 数据库操作
- 文件上传
- 部署上线

---

`★ Insight ─────────────────────────────────────`
**Week 6标志着你的后端能力已趋完整！**

掌握了数据库 + REST API + 安全认证，你已经可以构建大多数Web应用的后端了。剩下的Spring生态（Redis、消息队列等）是”锦上添花"，而非必需品。

**与NestJS的对比总结**：
- Spring Security配置更繁琐，但功能更强大
- JWT实现原理完全相同，只是库不同
- 权限控制注解非常相似

恭喜你，核心后端技能已掌握！
─────────────────────────────────────────────────

有任何关于Spring Security配置、JWT最佳实践、或者前后端对接的问题吗？
