# Week 14-15 详细学习计划：高级主题与工程实践

> **目标**：掌握高级开发技能，准备生产环境  
> **投入时间**：30-40小时（两周）  
> **预期产出**：企业级工程能力

---

## 一、Week 14：文件存储与搜索引擎

### 14.1 文件上传与存储

**本地存储**：
```java
@Service
public class FileStorageService {
    
    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;
    
    public String store(MultipartFile file) throws IOException {
        // 生成唯一文件名
        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path targetPath = Paths.get(uploadDir, filename);
        
        // 创建目录
        Files.createDirectories(targetPath.getParent());
        
        // 保存文件
        Files.copy(file.getInputStream(), targetPath);
        
        return filename;
    }
}

// Controller
@RestController
@RequestMapping("/api/files")
public class FileController {
    
    @PostMapping("/upload")
    public ApiResponse<String> upload(@RequestParam("file") MultipartFile file) {
        // 校验
        if (file.isEmpty()) {
            return ApiResponse.error(400, "文件为空");
        }
        
        // 大小限制
        if (file.getSize() > 10 * 1024 * 1024) {  // 10MB
            return ApiResponse.error(400, "文件太大");
        }
        
        // 类型校验
        String contentType = file.getContentType();
        if (!Arrays.asList("image/jpeg", "image/png", "application/pdf")
                .contains(contentType)) {
            return ApiResponse.error(400, "不支持的文件类型");
        }
        
        String filename = fileStorageService.store(file);
        return ApiResponse.success("/api/files/" + filename);
    }
}
```

**云存储（OSS）**：
```java
@Service
public class OssService {
    
    @Autowired
    private OSS ossClient;
    
    @Value("${aliyun.oss.bucket}")
    private String bucket;
    
    public String upload(MultipartFile file) throws IOException {
        String filename = "uploads/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        
        PutObjectRequest request = new PutObjectRequest(bucket, filename, 
                file.getInputStream());
        ossClient.putObject(request);
        
        // 返回URL
        return "https://" + bucket + ".oss-cn-beijing.aliyuncs.com/" + filename;
    }
}
```

### 14.2 Elasticsearch全文搜索

**Docker启动ES**：
```bash
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
  elasticsearch:8.11.0
```

**Spring Boot集成**：
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-elasticsearch</artifactId>
</dependency>
```

```yaml
spring:
  elasticsearch:
    uris: http://localhost:9200
```

**实体与Repository**：
```java
@Document(indexName = "articles")
@Data
public class ArticleDocument {
    @Id
    private Long id;
    
    @Field(type = FieldType.Text, analyzer = "ik_max_word")
    private String title;
    
    @Field(type = FieldType.Text, analyzer = "ik_max_word")
    private String content;
    
    @Field(type = FieldType.Keyword)
    private String authorName;
    
    @Field(type = FieldType.Date)
    private LocalDateTime createdAt;
}

@Repository
public interface ArticleSearchRepository extends ElasticsearchRepository<ArticleDocument, Long> {
    
    // 全文搜索
    List<ArticleDocument> findByTitleContainingOrContentContaining(String title, String content);
    
    // 分页搜索
    Page<ArticleDocument> findByTitleContaining(String keyword, Pageable pageable);
}

// 搜索服务
@Service
@RequiredArgsConstructor
public class SearchService {
    
    private final ElasticsearchOperations elasticsearchOperations;
    
    public List<ArticleDocument> search(String keyword) {
        // 构建查询
        Query query = NativeQuery.builder()
                .withQuery(q -> q.multiMatch(m -> m
                        .fields("title", "content")
                        .query(keyword)
                ))
                .withSort(Sort.by(Sort.Direction.DESC, "_score"))
                .build();
        
        SearchHits<ArticleDocument> hits = elasticsearchOperations
                .search(query, ArticleDocument.class);
        
        return hits.getSearchHits().stream()
                .map(SearchHit::getContent)
                .collect(Collectors.toList());
    }
}
```

---

## 二、Week 15：分布式基础

### 15.1 分布式ID生成

```java
@Component
public class SnowflakeIdWorker {
    
    // 起始时间戳（2024-01-01）
    private final long twepoch = 1704067200000L;
    
    // 各部分位数
    private final long workerIdBits = 5L;
    private final long datacenterIdBits = 5L;
    private final long sequenceBits = 12L;
    
    // 最大值
    private final long maxWorkerId = -1L ^ (-1L << workerIdBits);
    private final long maxDatacenterId = -1L ^ (-1L << datacenterIdBits);
    
    // 位移
    private final long workerIdShift = sequenceBits;
    private final long datacenterIdShift = sequenceBits + workerIdBits;
    private final long timestampLeftShift = sequenceBits + workerIdBits + datacenterIdBits;
    
    // 序号掩码
    private final long sequenceMask = -1L ^ (-1L << sequenceBits);
    
    private long workerId;
    private long datacenterId;
    private long sequence = 0L;
    private long lastTimestamp = -1L;
    
    public synchronized long nextId() {
        long timestamp = timeGen();
        
        if (timestamp < lastTimestamp) {
            throw new RuntimeException("时钟回拨");
        }
        
        if (lastTimestamp == timestamp) {
            sequence = (sequence + 1) & sequenceMask;
            if (sequence == 0) {
                timestamp = tilNextMillis(lastTimestamp);
            }
        } else {
            sequence = 0L;
        }
        
        lastTimestamp = timestamp;
        
        return ((timestamp - twepoch) << timestampLeftShift)
                | (datacenterId << datacenterIdShift)
                | (workerId << workerIdShift)
                | sequence;
    }
    
    private long tilNextMillis(long lastTimestamp) {
        long timestamp = timeGen();
        while (timestamp <= lastTimestamp) {
            timestamp = timeGen();
        }
        return timestamp;
    }
    
    private long timeGen() {
        return System.currentTimeMillis();
    }
}
```

### 15.2 分布式锁（Redis实现）

```java
@Component
@RequiredArgsConstructor
public class DistributedLock {
    
    private final StringRedisTemplate redisTemplate;
    
    /**
     * 获取锁
     */
    public boolean tryLock(String lockKey, String requestId, int expireSeconds) {
        Boolean result = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, requestId, expireSeconds, TimeUnit.SECONDS);
        return Boolean.TRUE.equals(result);
    }
    
    /**
     * 释放锁（Lua脚本保证原子性）
     */
    public void unlock(String lockKey, String requestId) {
        String script = 
            "if redis.call('get', KEYS[1]) == ARGV[1] then " +
            "    return redis.call('del', KEYS[1]) " +
            "else " +
            "    return 0 " +
            "end";
        
        redisTemplate.execute(
            new DefaultRedisScript<>(script, Long.class),
            Collections.singletonList(lockKey),
            requestId
        );
    }
    
    // 使用示例：库存扣减
    public void deductStock(Long productId, int quantity) {
        String lockKey = "stock:lock:" + productId;
        String requestId = UUID.randomUUID().toString();
        
        try {
            boolean locked = tryLock(lockKey, requestId, 10);
            if (!locked) {
                throw new RuntimeException("获取锁失败");
            }
            
            // 扣减库存
            stockService.deduct(productId, quantity);
        } finally {
            unlock(lockKey, requestId);
        }
    }
}
```

### 15.3 接口幂等设计

```java
@Component
@RequiredArgsConstructor
public class IdempotencyService {
    
    private final StringRedisTemplate redisTemplate;
    
    /**
     * 检查幂等性
     * @param idempotencyKey 幂等键（如订单号）
     * @param expireSeconds 过期时间
     * @return true-首次请求，false-重复请求
     */
    public boolean check(String idempotencyKey, int expireSeconds) {
        String key = "idempotent:" + idempotencyKey;
        Boolean result = redisTemplate.opsForValue()
                .setIfAbsent(key, "1", expireSeconds, TimeUnit.SECONDS);
        return Boolean.TRUE.equals(result);
    }
}

// 使用：防止重复提交订单
@RestController
public class OrderController {
    
    @PostMapping("/api/orders")
    public ApiResponse<Order> createOrder(
            @RequestHeader("Idempotency-Key") String idempotencyKey,
            @RequestBody CreateOrderRequest request) {
        
        // 检查幂等
        if (!idempotencyService.check(idempotencyKey, 3600)) {
            return ApiResponse.error(409, "重复请求");
        }
        
        Order order = orderService.create(request);
        return ApiResponse.success(order);
    }
}
```

---

## 三、学习资源

### Elastic Stack
- [Elasticsearch官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [IK分词器](https://github.com/medcl/elasticsearch-analysis-ik)

### 分布式系统
- [DDIA《设计数据密集型应用》](https://book.douban.com/subject/26197294/)

---

## Week 14-15 里程碑

- [ ] 实现文件上传与云存储
- [ ] 集成Elasticsearch实现全文搜索
- [ ] 理解分布式ID和分布式锁
- [ ] 设计幂等接口
