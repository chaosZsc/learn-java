# Week 7 详细学习计划：缓存与异步 - Redis + 性能优化

> **目标**：掌握Redis缓存，理解异步处理，提升系统性能  
> **投入时间**：15-20小时（周中10h + 周末10h）  
> **预期产出**：带缓存的博客系统 + 异步任务处理

---

## 一、时间分配总览

| 时间段 | 内容 | 时长 |
|--------|------|------|
| **Day 1 (周一)** | Redis基础 + Spring Data Redis | 2h |
| **Day 2 (周二)** | Spring Cache抽象 + 注解缓存 | 2h |
| **Day 3 (周三)** | 缓存实践：用户会话 + 热点数据 | 2h |
| **Day 4 (周四)** | 异步处理：@Async + 线程池 | 2h |
| **Day 5 (周五)** | 邮件服务 + 定时任务 | 2h |
| **周六** | 项目实战：缓存优化博客系统 | 4h |
| **周日** | 性能监控 + 压力测试入门 | 4h |

---

## 二、核心概念：为什么需要缓存和异步

`★ Insight ─────────────────────────────────────`
**缓存和异步是后端性能优化的两大基石**

- **缓存**：把频繁访问但不常变化的数据放到内存（Redis），减少数据库压力
- **异步**：把耗时的操作（发邮件、生成报表）放到后台执行，不阻塞用户请求

在Node.js中你可能用过：redis/ioredis、node-cron、Bull队列等，Java生态有对应的成熟方案。
─────────────────────────────────────────────────

### 与Node.js生态对照

| Node.js | Java/Spring | 说明 |
|---------|-------------|------|
| `redis` / `ioredis` | `Spring Data Redis` | Redis客户端 |
| `node-cache` | `Caffeine` / `ConcurrentHashMap` | 本地缓存 |
| `bull` / `bee-queue` | `Spring @Async` / `Scheduled` | 任务队列 |
| `node-cron` | `@Scheduled` | 定时任务 |
| `rate-limiter-flexible` | `Bucket4j` | 限流 |

---

## 三、Day 1：Redis基础（2小时）

### 3.1 Docker启动Redis

```bash
# 拉取Redis镜像
docker pull redis:7-alpine

# 启动Redis
docker run --name redis7 \
  -p 6379:6379 \
  -d redis:7-alpine

# 测试连接
docker exec -it redis7 redis-cli ping
# 返回 PONG 表示成功
```

### 3.2 添加Spring Data Redis依赖

```xml
<dependencies>
    <!-- Spring Data Redis -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
    
    <!-- 连接池（推荐） -->
    <dependency>
        <groupId>org.apache.commons</groupId>
        <artifactId>commons-pool2</artifactId>
    </dependency>
</dependencies>
```

### 3.3 配置Redis

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      # password:      # 如果有密码
      database: 0      # 默认16个数据库(0-15)
      lettuce:
        pool:
          max-active: 8
          max-idle: 8
          min-idle: 0
```

### 3.4 RedisTemplate使用

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class RedisService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    
    // ========== String类型 ==========
    public void setString(String key, String value) {
        redisTemplate.opsForValue().set(key, value);
    }
    
    public void setString(String key, String value, long timeout, TimeUnit unit) {
        redisTemplate.opsForValue().set(key, value, timeout, unit);
    }
    
    public String getString(String key) {
        return (String) redisTemplate.opsForValue().get(key);
    }
    
    // ========== Hash类型（存储对象）==========
    public void setHash(String key, String field, Object value) {
        redisTemplate.opsForHash().put(key, field, value);
    }
    
    public Object getHash(String key, String field) {
        return redisTemplate.opsForHash().get(key, field);
    }
    
    public Map<Object, Object> getHashAll(String key) {
        return redisTemplate.opsForHash().entries(key);
    }
    
    // ========== List类型（队列）==========
    public void pushList(String key, Object value) {
        redisTemplate.opsForList().rightPush(key, value);
    }
    
    public Object popList(String key) {
        return redisTemplate.opsForList().leftPop(key);
    }
    
    public List<Object> getListRange(String key, long start, long end) {
        return redisTemplate.opsForList().range(key, start, end);
    }
    
    // ========== Set类型（去重集合）==========
    public void addSet(String key, Object... members) {
        redisTemplate.opsForSet().add(key, members);
    }
    
    public Set<Object> getSet(String key) {
        return redisTemplate.opsForSet().members(key);
    }
    
    // ========== Sorted Set（排行榜）==========
    public void addZSet(String key, Object member, double score) {
        redisTemplate.opsForZSet().add(key, member, score);
    }
    
    public Set<ZSetOperations.TypedTuple<Object>> getZSetTop(String key, long count) {
        return redisTemplate.opsForZSet().reverseRangeWithScores(key, 0, count - 1);
    }
    
    // ========== 通用操作 ==========
    public void delete(String key) {
        redisTemplate.delete(key);
    }
    
    public boolean hasKey(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
    
    public void expire(String key, long timeout, TimeUnit unit) {
        redisTemplate.expire(key, timeout, unit);
    }
}
```

### 3.5 实体序列化配置

```java
@Configuration
public class RedisConfig {
    
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        
        // 使用Jackson序列化
        Jackson2JsonRedisSerializer<Object> jackson = new Jackson2JsonRedisSerializer<>(Object.class);
        ObjectMapper mapper = new ObjectMapper();
        mapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        mapper.activateDefaultTyping(LaissezFaireSubTypeValidator.instance, ObjectMapper.DefaultTyping.NON_FINAL);
        jackson.setObjectMapper(mapper);
        
        // String序列化
        StringRedisSerializer string = new StringRedisSerializer();
        
        // key用String，value用JSON
        template.setKeySerializer(string);
        template.setHashKeySerializer(string);
        template.setValueSerializer(jackson);
        template.setHashValueSerializer(jackson);
        template.afterPropertiesSet();
        
        return template;
    }
}
```

---

## 四、Day 2：Spring Cache抽象（2小时）

### 4.1 启用缓存

```java
@SpringBootApplication
@EnableCaching  // 开启缓存
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

### 4.2 配置CacheManager

```java
@Configuration
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))              // 默认过期时间
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
n                        .fromSerializer(new GenericJackson2JsonRedisSerializer()));
        	.fromSerializer(new GenericJackson2JsonRedisSerializer()));
        	        .disableCachingNullValues();                   // 不缓存null
        
        return RedisCacheManager.builder(factory)
                .cacheDefaults(config)
                .build();
    }
}
```

### 4.3 缓存注解使用

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class ArticleService {
    
    private final ArticleRepository articleRepository;
    
    /**
     * @Cacheable - 先查缓存，没有则执行方法并缓存结果
     * value = 缓存名称（前缀）
     * key = 缓存键（支持SpEL表达式）
     * unless = 条件，满足则不缓存
     */
    @Cacheable(value = "article", key = "#id", unless = "#result == null")
    public Article findById(Long id) {
        log.info("从数据库查询文章: {}", id);
        return articleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("文章不存在"));
    }
    
    /**
     * @CachePut - 执行方法并更新缓存
     * 用于更新操作后刷新缓存
     */
    @CachePut(value = "article", key = "#result.id")
    public Article updateArticle(Long id, UpdateArticleRequest request) {
        Article article = findById(id);
        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        return articleRepository.save(article);
    }
    
    /**
     * @CacheEvict - 删除缓存
     * allEntries = true 删除该value下所有缓存
     */
    @CacheEvict(value = "article", key = "#id")
    public void deleteArticle(Long id) {
        articleRepository.deleteById(id);
    }
    
    // 清除所有文章缓存
    @CacheEvict(value = "article", allEntries = true)
    public void clearArticleCache() {
        log.info("清除所有文章缓存");
    }
    
    /**
     * 缓存列表（慎用，列表数据量大时不适合）
     */
    @Cacheable(value = "articles:hot", key = "'#hot'", unless = "#result.isEmpty()")
    public List<Article> findHotArticles() {
        log.info("从数据库查询热门文章");
        return articleRepository.findTop10ByOrderByViewCountDesc();
    }
}
```

### 4.4 SpEL表达式常用变量

| 表达式 | 说明 |
|--------|------|
| `#id` | 方法参数名为id的值 |
| `#result` | 方法返回值 |
| `#root.methodName` | 当前方法名 |
| `#root.args[0]` | 第一个参数 |
| `#root.caches[0].name` | 缓存名称 |

---

## 五、Day 3：缓存实践（2小时）

### 5.1 用户会话缓存

```java
@Service
@RequiredArgsConstructor
public class UserSessionService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    private static final String USER_SESSION_PREFIX = "user:session:";
    private static final long SESSION_TIMEOUT = 30; // 30分钟
    
    // 缓存用户信息（登录时调用）
    public void cacheUserSession(Long userId, User user) {
        String key = USER_SESSION_PREFIX + userId;
        redisTemplate.opsForHash().put(key, "id", user.getId());
        redisTemplate.opsForHash().put(key, "username", user.getUsername());
        redisTemplate.opsForHash().put(key, "email", user.getEmail());
        redisTemplate.expire(key, SESSION_TIMEOUT, TimeUnit.MINUTES);
    }
    
    // 获取缓存的用户信息
    public User getCachedUser(Long userId) {
        String key = USER_SESSION_PREFIX + userId;
        Map<Object, Object> entries = redisTemplate.opsForHash().entries(key);
        if (entries.isEmpty()) {
            return null;
        }
        
        // 刷新过期时间
        redisTemplate.expire(key, SESSION_TIMEOUT, TimeUnit.MINUTES);
        
        return User.builder()
                .id(Long.valueOf(entries.get("id").toString()))
                .username((String) entries.get("username"))
                .email((String) entries.get("email"))
                .build();
    }
    
    // 删除会话（退出登录）
    public void removeUserSession(Long userId) {
        redisTemplate.delete(USER_SESSION_PREFIX + userId);
    }
}
```

### 5.2 接口限流（Rate Limiting）

```java
@Component
@RequiredArgsConstructor
public class RateLimiterService {
    
    private final RedisTemplate<String, Object> redisTemplate;
    
    /**
     * 滑动窗口限流
     * @param key 限流标识（如用户ID+接口）
     * @param limit 限制次数
     * @param window 时间窗口（秒）
     * @return true-允许访问，false-被限流
     */
    public boolean isAllowed(String key, int limit, int window) {
        String redisKey = "rate:" + key;
        long now = System.currentTimeMillis();
        long windowStart = now - window * 1000;
        
        // 移除窗口外的旧记录
        redisTemplate.opsForZSet().removeRangeByScore(redisKey, 0, windowStart);
        
        // 获取当前窗口内的请求数
        Long count = redisTemplate.opsForZSet().zCard(redisKey);
        
        if (count != null && count >= limit) {
            return false;
        }
        
        // 记录本次请求
        redisTemplate.opsForZSet().add(redisKey, String.valueOf(now), now);
        redisTemplate.expire(redisKey, window, TimeUnit.SECONDS);
        
        return true;
    }
}

// 使用 - 限制每分钟5次
@RestController
public class AuthController {
    
    @Autowired
    private RateLimiterService rateLimiter;
    
    @PostMapping("/api/auth/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, 
                                    HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        String limitKey = "login:" + clientIp;
        
        if (!rateLimiter.isAllowed(limitKey, 5, 60)) {
            return ResponseEntity.status(429).body("请求过于频繁，请稍后再试");
        }
        
        // 正常登录逻辑
    }
}
```

### 5.3 缓存常见问题

```java
/**
 * 1. 缓存穿透：查询不存在的数据，每次都打到数据库
 * 解决：缓存空值
 */
@Cacheable(value = "user", key = "#id", unless = "#result == null")
public User findById(Long id) {
    // 即使返回null也缓存（防止穿透）
    return userRepository.findById(id).orElse(null);
}

/**
 * 2. 缓存击穿：热点数据过期瞬间大量请求打到数据库
 * 解决：加互斥锁
 */
public User findByIdWithLock(Long id) {
    String key = "user:" + id;
    String lockKey = key + ":lock";
    
    // 先查缓存
    User user = (User) redisTemplate.opsForValue().get(key);
    if (user != null) {
        return user;
    }
    
    // 获取锁
    Boolean locked = redisTemplate.opsForValue()
            .setIfAbsent(lockKey, "1", 10, TimeUnit.SECONDS);
    
    if (Boolean.TRUE.equals(locked)) {
        try {
            // 双重检查
            user = (User) redisTemplate.opsForValue().get(key);
            if (user == null) {
                user = userRepository.findById(id).orElse(null);
                if (user != null) {
                    redisTemplate.opsForValue().set(key, user, 10, TimeUnit.MINUTES);
                }
            }
        } finally {
            redisTemplate.delete(lockKey);
        }
    }
    
    return user;
}

/**
 * 3. 缓存雪崩：大量缓存同时过期
 * 解决：随机过期时间
 */
public void setWithRandomExpire(String key, Object value, int baseExpireMinutes) {
    // 基础时间 + 随机0-10分钟
    int expire = baseExpireMinutes * 60 + (int) (Math.random() * 600);
    redisTemplate.opsForValue().set(key, value, expire, TimeUnit.SECONDS);
}
```

---

## 六、Day 4：异步处理（2小时）

### 6.1 启用异步

```java
@SpringBootApplication
@EnableAsync  // 开启异步
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}

@Configuration
public class AsyncConfig {
    
    @Bean("taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);          // 核心线程数
        executor.setMaxPoolSize(10);          // 最大线程数
        executor.setQueueCapacity(100);       // 队列容量
        executor.setThreadNamePrefix("async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
```

### 6.2 @Async使用

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    
    @Autowired
    private JavaMailSender mailSender;
    
    /**
     * @Async 标记异步方法
     * 方法返回void或Future类型
     */
    @Async("taskExecutor")
    public void sendEmailAsync(String to, String subject, String content) {
        log.info("发送邮件到: {}", to);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
            log.info("邮件发送成功");
        } catch (Exception e) {
            log.error("邮件发送失败", e);
        }
    }
    
    @Async
    public CompletableFuture<String> processDataAsync(List<Data> dataList) {
        log.info("异步处理数据，数量: {}", dataList.size());
        
        // 耗时操作
        for (Data data : dataList) {
            processSingleData(data);
        }
        
        return CompletableFuture.completedFuture("处理完成");
    }
}

// 使用
@RestController
@RequiredArgsConstructor
public class OrderController {
    
    private final OrderService orderService;
    private final NotificationService notificationService;
    
    @PostMapping("/api/orders")
    public ApiResponse<Order> createOrder(@RequestBody CreateOrderRequest request) {
        // 同步：创建订单（用户等待）
        Order order = orderService.createOrder(request);
        
        // 异步：发送通知（不阻塞）
        notificationService.sendEmailAsync(
            request.getEmail(),
            "订单创建成功",
            "您的订单 " + order.getId() + " 已创建"
        );
        
        return ApiResponse.success(order);
    }
}
```

### 6.3 注意事项

```java
@Service
public class MyService {
    
    /**
     * 注意：同类方法调用，@Async不生效！
     * 必须通过代理调用
     */
    public void outerMethod() {
        // 这样调innerAsync是同步的！
        innerAsync();
        
        // 解决：注入自己
        self.innerAsync();
    }
    
    @Async
    public void innerAsync() {
        // 异步逻辑
    }
    
    @Autowired
    private MyService self;
}
```

---

## 七、Day 5：定时任务与邮件（2小时）

### 7.1 @Scheduled定时任务

```java
@Configuration
@EnableScheduling  // 开启定时任务
public class SchedulingConfig {
}

@Component
@Slf4j
public class ScheduledTasks {
    
    private final ArticleService articleService;
    private final RedisTemplate<String, Object> redisTemplate;
    
    /**
     * 固定频率执行（上次开始后计时）
     */
    @Scheduled(fixedRate = 60000)  // 每分钟
    public void syncHotArticles() {
        log.info("同步热门文章缓存");
        List<Article> hotArticles = articleService.getHotArticlesFromDB();
        redisTemplate.opsForValue().set("articles:hot", hotArticles, 5, TimeUnit.MINUTES);
    }
    
    /**
     * 固定延迟执行（上次结束后计时）
     */
    @Scheduled(fixedDelay = 300000)  // 上次结束5分钟后
    public void cleanupExpiredData() {
        log.info("清理过期数据");
        // 清理逻辑
    }
    
    /**
     * Cron表达式
     * 秒 分 时 日 月 周
     */
    @Scheduled(cron = "0 0 2 * * ?")  // 每天凌晨2点
    public void dailyBackup() {
        log.info("执行每日备份");
    }
    
    @Scheduled(cron = "0 */5 * * * ?")  // 每5分钟
    public void checkSystemHealth() {
        // 健康检查
    }
}
```

### 7.2 Cron表达式速查

| 表达式 | 含义 |
|--------|------|
| `0 0 * * * ?` | 每小时整点 |
| `0 */5 * * * ?` | 每5分钟 |
| `0 0 12 * * ?` | 每天中午12点 |
| `0 0 0 * * ?` | 每天午夜 |
| `0 0 9 ? * MON` | 每周一上午9点 |
| `0 0 1 1 * ?` | 每月1号凌晨1点 |

---

## 八、周六项目：优化博客系统（4小时）

### 缓存策略设计

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class OptimizedArticleService {
    
    private final ArticleRepository articleRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    
    // ========== 文章详情 ==========
    @Cacheable(value = "article", key = "#id")
    public ArticleDTO getArticle(Long id) {
        log.info("从数据库查询文章详情: {}", id);
        Article article = articleRepository.findByIdWithAuthor(id)
                .orElseThrow(() -> new RuntimeException("文章不存在"));
        return convertToDTO(article);
    }
    
    // ========== 文章浏览量（实时+定时持久化）==========
    public void incrementViewCount(Long articleId) {
        String key = "article:view:" + articleId;
        redisTemplate.opsForValue().increment(key);
    }
    
    @Scheduled(fixedRate = 60000)  // 每分钟持久化
    public void persistViewCounts() {
        Set<String> keys = redisTemplate.keys("article:view:*");
        if (keys == null) return;
        
        for (String key : keys) {
            Long articleId = Long.valueOf(key.replace("article:view:", ""));
            Long views = (Long) redisTemplate.opsForValue().get(key);
            
            if (views != null && views > 0) {
                articleRepository.incrementViewCount(articleId, views);
                redisTemplate.delete(key);
            }
        }
    }
    
    // ========== 热门文章排行榜 ==========
    public void addToHotRank(Long articleId, double score) {
        redisTemplate.opsForZSet().add("articles:rank", articleId, score);
    }
    
    public List<ArticleDTO> getHotArticles(int topN) {
        Set<Object> articleIds = redisTemplate.opsForZSet()
                .reverseRange("articles:rank", 0, topN - 1);
        
        if (articleIds == null || articleIds.isEmpty()) {
            return Collections.emptyList();
        }
        
        // 批量查询（防N+1）
        List<Long> ids = articleIds.stream()
                .map(id -> Long.valueOf(id.toString()))
                .toList();
        
        return articleRepository.findAllById(ids).stream()
                .map(this::convertToDTO)
                .toList();
    }
}
```

---

## 九、周日：性能监控（4小时）

### 9.1 Spring Boot Actuator

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: always
```

访问 `/actuator/metrics` 查看指标

### 9.2 基础压力测试（JMeter/简单脚本）

```bash
# Apache Bench (ab)
ab -n 10000 -c 100 http://localhost:8080/api/articles

# 参数说明：
# -n: 总请求数
# -c: 并发数
```

### 9.3 本周检查清单

- [ ] Redis正确配置并连接
- [ ] 使用Spring Cache注解缓存数据
- [ ] 实现接口限流
- [ ] 使用@Async处理异步任务
- [ ] 配置定时任务
- [ ] 缓存问题解决（穿透/击穿/雪崩）
- [ ] 性能对比测试（加缓存前后）

---

## 十、学习资源

### 视频
- [尚硅谷Redis教程](https://www.bilibili.com/video/BV1Rv41177Af)
- [黑马Redis入门](https://www.bilibili.com/video/BV1cr4y1671t)

### 文档
- [Spring Data Redis](https://spring.io/projects/spring-data-redis)
- [Redis命令参考](http://redisdoc.com/)

### 工具
| 工具 | 用途 |
|------|------|
| RedisInsight | Redis图形客户端 |
| Another Redis Desktop Manager | 开源Redis客户端 |

---

## Week 7 里程碑

完成本周后，你应该能够：

- [ ] 配置Redis并Spring Boot连接
- [ ] 使用Redis五种数据类型
- [ ] 使用Spring Cache注解
- [ ] 实现接口限流
- [ ] 使用@Async处理异步任务
- [ ] 配置定时任务
- [ ] 处理缓存三穿问题

---

## 下一步预告

**Week 8：项目部署与DevOps**

- Docker容器化打包
- 云服务器部署
- Nginx反向代理
- CI/CD流水线基础

---

`★ Insight ─────────────────────────────────────`
**缓存和异步是后端开发的高级技能**

掌握这两项后，你的应用可以：
1. **支撑高并发** - 缓存减少数据库压力
2. **响应更快** - 异步不阻塞主线程
3. **更省资源** - 合理限流防止雪崩

这些技能在Node.js中同样适用，只是工具和框架不同。
─────────────────────────────────────────────────

有任何Redis操作、缓存策略设计，或者异步处理的问题吗？
