# Week 11-12 详细学习计划：性能优化进阶

> **目标**：掌握JVM调优、SQL优化、接口性能优化  
> **投入时间**：30-40小时（两周）  
> **预期产出**：能独立进行性能诊断和优化

---

## 一、为什么需要性能优化

`★ Insight ─────────────────────────────────────`
**功能实现只是60分，性能优化才能到90分**

实际生产环境常见问题：
- 接口响应慢（>3秒）
- 内存溢出（OOM）
- 数据库CPU 100%
- 应用启动慢

这两周学习定位和解决这些问题。
─────────────────────────────────────────────────

---

## 二、Week 11：JVM基础与调优

### 11.1 JVM内存模型

```
┌─────────────────────────────────────────┐
│              堆内存 (Heap)               │
│  ┌─────────────┐  ┌───────────────────┐ │
│  │  年轻代      │  │      老年代        │ │
│  │  ├─ Eden    │  │                   │ │
│  │  ├─ S0      │  │  存放长期存活对象   │ │
│  │  └─ S1      │  │                   │ │
│  └─────────────┘  └───────────────────┘ │
├─────────────────────────────────────────┤
│  元空间 (Metaspace) - 类信息、常量池      │
├─────────────────────────────────────────┤
│  虚拟机栈 (Stack) - 方法调用、局部变量    │
├─────────────────────────────────────────┤
│  本地方法栈 - Native方法                 │
├─────────────────────────────────────────┤
│  程序计数器 - 当前执行位置                │
└─────────────────────────────────────────┘
```

### 11.2 常用JVM参数

```bash
# 基础配置
java -Xms512m -Xmx1024m -jar app.jar

# 详细配置
java \
  -Xms1g \                          # 初始堆大小
  -Xmx1g \                          # 最大堆大小（通常和初始一致，避免动态扩缩）
  -Xmn512m \                        # 年轻代大小
  -XX:MetaspaceSize=128m \          # 元空间初始
  -XX:MaxMetaspaceSize=256m \       # 元空间最大
  -XX:+UseG1GC \                    # 使用G1垃圾回收器（JDK9+默认）
  -XX:MaxGCPauseMillis=200 \        # GC最大停顿时间
  -XX:+HeapDumpOnOutOfMemoryError \ # OOM时生成堆转储
  -XX:HeapDumpPath=/logs/heapdump.hprof \
  -Xlog:gc*:file=/logs/gc.log:time,uptime,level,tags \
  -jar app.jar
```

### 11.3 Spring Boot应用JVM配置

```dockerfile
# Dockerfile - 添加JVM参数
FROM openjdk:17-jdk-alpine
WORKDIR /app
COPY target/*.jar app.jar

# 生产环境JVM参数
ENV JAVA_OPTS="-Xms512m -Xmx512m \
  -XX:+UseG1GC \
  -XX:MaxGCPauseMillis=200 \
  -XX:+HeapDumpOnOutOfMemoryError \
  -XX:HeapDumpPath=/app/logs/heapdump.hprof"

ENTRYPOINT exec java $JAVA_OPTS -jar app.jar
```

```yaml
# docker-compose.yml
services:
  app:
    environment:
      - JAVA_OPTS=-Xms512m -Xmx512m -XX:+UseG1GC
```

### 11.4 监控与诊断工具

**1. Spring Boot Actuator + Prometheus**

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-registry-prometheus</artifactId>
    </dependency>
</dependencies>
```

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
```

**关键指标**：
```
# JVM内存
jvm_memory_used_bytes{area="heap"}
jvm_memory_max_bytes{area="heap"}

# GC
jvm_gc_pause_seconds_count
jvm_gc_pause_seconds_sum

# 线程
jvm_threads_live_threads

# HTTP接口
http_server_requests_seconds_count{uri="/api/users"}
http_server_requests_seconds_max{uri="/api/users"}
```

**2. 使用jconsole/jvisualvm**
```bash
# 远程连接（启动时添加参数）
java -Dcom.sun.management.jmxremote \
     -Dcom.sun.management.jmxremote.port=9090 \
     -Dcom.sun.management.jmxremote.ssl=false \
     -Dcom.sun.management.jmxremote.authenticate=false \
     -jar app.jar
```

---

## 三、Week 12：SQL优化与接口性能

### 12.1 SQL优化基础

**慢查询配置**：
```ini
# MySQL my.cnf
slow_query_log = 1
slow_query_log_file = /var/lib/mysql/slow.log
long_query_time = 1  # 超过1秒记录
log_queries_not_using_indexes = 1
```

**EXPLAIN分析**：
```sql
EXPLAIN SELECT * FROM articles 
WHERE author_id = 5 
ORDER BY created_at DESC 
LIMIT 10;

-- 关注字段：
-- type: ALL(全表扫描) -> index -> range -> ref -> eq_ref -> const
-- key: 使用的索引
-- rows: 扫描行数
-- Extra: Using filesort(需要优化), Using index(覆盖索引)
```

**索引优化原则**：
```sql
-- 1. 最左前缀原则
CREATE INDEX idx_user_name_age ON users(name, age);
-- 查询条件必须是 name 或 name+age，单独age不走索引

-- 2. 覆盖索引
SELECT id, name FROM users WHERE name = 'zhang';
-- 如果索引是 (name)，还需要回表查id
-- 改为索引 (name, id) 则不需要回表

-- 3. 避免索引失效
WHERE name LIKE '%zhang%'  -- %开头不走索引
WHERE CAST(age AS CHAR) = '20'  -- 函数操作失效
WHERE age + 10 = 30  -- 计算失效
```

### 12.2 JPA性能优化

**1. N+1问题解决**
```java
// 问题：查询N个用户，每个用户发送一次SQL查订单
List<User> users = userRepository.findAll();  // 1次查询
for (User user : users) {
    List<Order> orders = user.getOrders();    // N次查询
}

// 解决1：Fetch Join
@Query("SELECT u FROM User u LEFT JOIN FETCH u.orders")
List<User> findAllWithOrders();

// 解决2：Entity Graph
@EntityGraph(attributePaths = {"orders"})
List<User> findAll();

// 解决3：批量初始化
List<User> users = userRepository.findAll();
userRepository.initializeOrders(users);  // 1次批量查询
```

**2. 分页优化**
```java
// 问题：深分页性能差
Page<User> page = userRepository.findAll(PageRequest.of(10000, 10)); 
// OFFSET 100000 会越来越慢

// 解决：游标分页（基于最后ID）
@Query(value = "SELECT * FROM users WHERE id > :lastId ORDER BY id LIMIT 10", 
       nativeQuery = true)
List<User> findNextPage(@Param("lastId") Long lastId);
```

**3. 批量操作**
```java
// 批量插入
@Service
@Transactional
public class BatchService {
    
    @PersistenceContext
    private EntityManager entityManager;
    
    public void batchInsert(List<User> users) {
        int batchSize = 50;
        for (int i = 0; i < users.size(); i++) {
            entityManager.persist(users.get(i));
            if (i % batchSize == 0) {
                entityManager.flush();
                entityManager.clear();  // 防止内存溢出
            }
        }
    }
}

// 或JDBC批量
@Autowired
private JdbcTemplate jdbcTemplate;

public void batchInsert(List<User> users) {
    String sql = "INSERT INTO users (username, email) VALUES (?, ?)";
    jdbcTemplate.batchUpdate(sql, users, 100, (ps, user) -> {
        ps.setString(1, user.getUsername());
        ps.setString(2, user.getEmail());
    });
}
```

### 12.3 接口性能优化

**1. 异步接口**
```java
@RestController
@RequiredArgsConstructor
public class ReportController {
    
    private final ReportService reportService;
    
    // 同步接口 - 用户等待
    @GetMapping("/api/reports/sync")
    public Report generateSync() {
        return reportService.generate();  // 可能耗时30秒
    }
    
    // 异步接口 - 立即返回任务ID
    @PostMapping("/api/reports/async")
    public ApiResponse<String> generateAsync() {
        String taskId = reportService.submitTask();
        return ApiResponse.success(taskId);
    }
    
    @GetMapping("/api/reports/{taskId}/status")
    public ApiResponse<TaskStatus> getStatus(@PathVariable String taskId) {
        return ApiResponse.success(reportService.getStatus(taskId));
    }
}
```

**2. 接口超时设置**
```yaml
# application.yml
server:
  tomcat:
    connection-timeout: 2s      # 连接超时
    keep-alive-timeout: 30s     # 长连接超时

spring:
  mvc:
    async:
      request-timeout: 30s      # 异步请求超时

# Feign客户端超时（微服务）
feign:
  client:
    config:
      default:
        connectTimeout: 5000
        readTimeout: 10000
```

**3. 接口限流降级**
```java
@Component
public class RateLimiter {
    
    private final LoadingCache<String, RateLimiter> limiters;
    
    // 基于Guava的令牌桶
    public boolean tryAcquire(String key, int qps) {
        RateLimiter limiter = limiters.get(key, () -> RateLimiter.create(qps));
        return limiter.tryAcquire();
    }
}

// 使用
@GetMapping("/api/limited")
public ApiResponse<String> limitedEndpoint(HttpServletRequest request) {
    String clientIp = getClientIp(request);
    if (!rateLimiter.tryAcquire(clientIp, 10)) {  // 10 QPS
        return ApiResponse.error(429, "请求过于频繁");
    }
    return ApiResponse.success("success");
}
```

### 12.4 压力测试实践

**JMeter基础测试计划**：
```
Test Plan
└── Thread Group (线程组)
    ├── Number of Threads: 100    # 并发用户数
    ├── Ramp-up period: 10s       # 启动时间
    └── Loop Count: 10            # 每个用户请求次数
    
    ├── HTTP Request (接口请求)
    │   ├── Protocol: http
    │   ├── Server Name: localhost
    │   ├── Port: 8080
    │   └── Path: /api/users
    │
    ├── HTTP Header Manager
    │   └── Authorization: Bearer xxx
    │
    └── Listener (结果收集)
        ├── View Results Tree      # 查看响应详情
        ├── Summary Report         # 汇总报告
        └── Graph Results          # 图形结果
```

**关键指标解读**：
| 指标 | 说明 | 目标值 |
|------|------|--------|
| Throughput | 吞吐量 (req/s) | 越高越好 |
| Average | 平均响应时间 | < 500ms |
| 95% Line | 95%请求响应时间 | < 1s |
| Error % | 错误率 | < 0.1% |

---

## 四、实战任务

### 任务1：慢接口优化

**场景**：查询用户列表接口很慢
```java
// 原代码（问题）
@GetMapping("/users")
public List<User> list() {
    return userRepository.findAll();  // 全表扫描 + 加载所有关联
}

// 优化后
@GetMapping("/users")
public Page<UserDTO> list(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
    return userRepository.findAll(PageRequest.of(page, size))
            .map(this::toDTO);
}
```

### 任务2：内存泄漏排查

**使用MAT工具分析heapdump.hprof**：
1. 启动应用，制造OOM
2. 分析堆转储文件
3. 找到泄漏源头（大对象、未释放集合等）
4. 修复代码

---

## 五、学习资源

### 视频
- [尚硅谷JVM精讲](https://www.bilibili.com/video/BV1PJ411n7xZ)
- [MySQL性能优化](https://www.bilibili.com/video/BV1zJ411m7My)

### 工具
| 工具 | 用途 |
|------|------|
| JMeter | 压力测试 |
| Prometheus + Grafana | 监控可视化 |
| MAT (Eclipse Memory Analyzer) | 内存分析 |
| Arthas | Java诊断神器 |

---

## Week 11-12 里程碑

- [ ] 理解JVM内存结构和GC原理
- [ ] 配置JVM参数进行基础调优
- [ ] 使用EXPLAIN分析SQL性能
- [ ] 解决N+1查询问题
- [ ] 实施接口优化（异步、缓存、限流）
- [ ] 使用JMeter进行压力测试

**优化能力 = 高级工程师的分水岭！**
