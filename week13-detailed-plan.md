# Week 13 详细学习计划：消息队列 - RabbitMQ

> **目标**：掌握消息队列核心概念，能使用RabbitMQ实现异步通信  
> **投入时间**：15-20小时  
> **预期产出**：可靠的消息投递系统

---

## 一、为什么需要消息队列

`★ Insight ─────────────────────────────────────`
**消息队列 = 异步解耦 + 削峰填谷 + 可靠投递**

典型场景：
- 用户注册后发邮件/短信（不用等待）
- 订单超时取消（延迟消息）
- 秒杀系统削峰（队列缓冲）

在Node.js中你可能用过Bull/Bee-Queue，RabbitMQ功能更强大。
─────────────────────────────────────────────────

### MQ对比

| 特性 | RabbitMQ | Kafka | RocketMQ |
|------|----------|-------|----------|
| 开发语言 | Erlang | Scala | Java |
| 消息模型 | 队列 | 发布订阅 | 两者都支持 |
| 延迟消息 | 支持 | 需外部实现 | 支持 |
| 死信队列 | 原生支持 | 手动实现 | 原生支持 |
| 适用场景 | 可靠消息、延迟任务 | 大数据流处理 | 金融高可靠 |
| 学习曲线 | 低 | 中 | 中 |

**入门推荐RabbitMQ**，功能完善，社区活跃。

---

## 二、RabbitMQ基础

### 2.1 核心概念

```
┌─────────────────────────────────────────────┐
│                 Exchange（交换机）            │
│     ┌─────────┬─────────┬─────────┐         │
│     │ direct  │ topic   │ fanout  │         │
│     └────┬────┴────┬────┴────┬────┘         │
│          │         │         │              │
└──────────┼─────────┼─────────┼──────────────┘
           │         │         │
           ▼         ▼         ▼
      ┌────────┐ ┌────────┐ ┌────────┐
      │ Queue  │ │ Queue  │ │ Queue  │
      │ order  │ │ email  │ │ sms    │
      └───┬────┘ └────┬───┘ └───┬────┘
          │           │         │
          ▼           ▼         ▼
      ┌────────┐ ┌────────┐ ┌────────┐
      │Consumer│ │Consumer│ │Consumer│
      └────────┘ └────────┘ └────────┘
```

**核心组件**：
- **Exchange**：接收消息，路由到队列
- **Queue**：存储消息
- **Binding**：Exchange和Queue的绑定规则
- **Routing Key**：路由键

### 2.2 Docker启动RabbitMQ

```bash
docker run -d \
  --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=admin123 \
  rabbitmq:3-management

# 管理界面: http://localhost:15672
```

### 2.3 Spring Boot集成

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

```yaml
spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: admin
    password: admin123
    virtual-host: /
    # 连接池
    listener:
      simple:
        concurrency: 5
        max-concurrency: 10
        acknowledge-mode: manual  # 手动确认
```

---

## 三、交换机类型详解

### 3.1 Direct（精确匹配）

```java
@Configuration
public class DirectConfig {
    
    public static final String QUEUE_ORDER = "order.queue";
    public static final String EXCHANGE_ORDER = "order.exchange";
    public static final String ROUTING_KEY_ORDER = "order.created";
    
    @Bean
    public Queue orderQueue() {
        // 队列持久化
        return QueueBuilder.durable(QUEUE_ORDER)
                .withArgument("x-dead-letter-exchange", "order.dlx.exchange")
                .withArgument("x-dead-letter-routing-key", "order.dlx")
                .build();
    }
    
    @Bean
    public DirectExchange orderExchange() {
        return new DirectExchange(EXCHANGE_ORDER, true, false);
    }
    
    @Bean
    public Binding orderBinding() {
        return BindingBuilder.bind(orderQueue())
                .to(orderExchange())
                .with(ROUTING_KEY_ORDER);
    }
}

// 发送
@Service
@RequiredArgsConstructor
public class OrderProducer {
    private final RabbitTemplate rabbitTemplate;
    
    public void sendOrderCreated(Order order) {
        rabbitTemplate.convertAndSend(
            DirectConfig.EXCHANGE_ORDER,
            DirectConfig.ROUTING_KEY_ORDER,
            order,
            message -> {
                message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                return message;
            }
        );
    }
}

// 接收
@Component
@Slf4j
public class OrderConsumer {
    
    @RabbitListener(queues = DirectConfig.QUEUE_ORDER)
    public void handleOrder(Order order, Channel channel, Message message) throws IOException {
        try {
            log.info("收到订单: {}", order.getId());
            // 处理订单...
            
            // 手动确认
            channel.basicAck(message.getMessageProperties().getDeliveryTag(), false);
        } catch (Exception e) {
            log.error("处理订单失败", e);
            // 拒绝消息，重新入队
            channel.basicNack(message.getMessageProperties().getDeliveryTag(), false, true);
        }
    }
}
```

### 3.2 Topic（模式匹配）

```java
@Configuration
public class TopicConfig {
    
    public static final String EXCHANGE_LOGS = "logs.topic";
    
    // 路由键格式: facility.severity (如 kern.error, auth.warning)
    
    @Bean
    public TopicExchange logsExchange() {
        return new TopicExchange(EXCHANGE_LOGS);
    }
    
    @Bean
    public Queue errorQueue() {
        return QueueBuilder.durable("logs.error").build();
    }
    
    @Bean
    public Queue allQueue() {
        return QueueBuilder.durable("logs.all").build();
    }
    
    // 只接收error级别
    @Bean
    public Binding errorBinding() {
        return BindingBuilder.bind(errorQueue())
                .to(logsExchange())
                .with("*.error");  // 匹配所有模块的error
    }
    
    // 接收所有日志
    @Bean
    public Binding allBinding() {
        return BindingBuilder.bind(allQueue())
                .to(logsExchange())
                .with("logs.#");  // 匹配logs.开头的所有
    }
}
```

### 3.3 Fanout（广播）

```java
@Configuration
public class FanoutConfig {
    
    public static final String EXCHANGE_NOTIFICATION = "notification.fanout";
    
    @Bean
    public FanoutExchange notificationExchange() {
        return new FanoutExchange(EXCHANGE_NOTIFICATION);
    }
    
    @Bean
    public Queue emailQueue() {
        return QueueBuilder.durable("notification.email").build();
    }
    
    @Bean
    public Queue smsQueue() {
        return QueueBuilder.durable("notification.sms").build();
    }
    
    @Bean
    public Queue pushQueue() {
        return QueueBuilder.durable("notification.push").build();
    }
    
    @Bean
    public Binding emailBinding() {
        return BindingBuilder.bind(emailQueue()).to(notificationExchange());
    }
    
    @Bean
    public Binding smsBinding() {
        return BindingBuilder.bind(smsQueue()).to(notificationExchange());
    }
    
    @Bean
    public Binding pushBinding() {
        return BindingBuilder.bind(pushQueue()).to(notificationExchange());
    }
}
```

---

## 四、高级特性

### 4.1 延迟队列（Delay Queue）

```java
@Configuration
public class DelayConfig {
    
    public static final String DELAY_EXCHANGE = "delay.exchange";
    public static final String DELAY_QUEUE = "delay.queue";
    public static final String DELAY_ROUTING_KEY = "delay.routing";
    
    public static final String DEAD_LETTER_EXCHANGE = "dlx.exchange";
    public static final String DEAD_LETTER_QUEUE = "dlx.queue";
    
    // 死信队列（最终消费）
    @Bean
    public Queue dlxQueue() {
        return QueueBuilder.durable(DEAD_LETTER_QUEUE).build();
    }
    
    @Bean
    public DirectExchange dlxExchange() {
        return new DirectExchange(DEAD_LETTER_EXCHANGE);
    }
    
    @Bean
    public Binding dlxBinding() {
        return BindingBuilder.bind(dlxQueue())
                .to(dlxExchange())
                .with("dlx.routing");
    }
    
    // 延迟队列（不设置消费者，消息过期后进入死信队列）
    @Bean
    public Queue delayQueue() {
        return QueueBuilder.durable(DELAY_QUEUE)
                .withArgument("x-dead-letter-exchange", DEAD_LETTER_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", "dlx.routing")
                .build();
    }
    
    @Bean
    public DirectExchange delayExchange() {
        return new DirectExchange(DELAY_EXCHANGE);
    }
    
    @Bean
    public Binding delayBinding() {
        return BindingBuilder.bind(delayQueue())
                .to(delayExchange())
                .with(DELAY_ROUTING_KEY);
    }
}

// 使用：发送延迟消息
@Service
public class DelayProducer {
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    public void sendDelayMessage(Order order, int delayMillis) {
        rabbitTemplate.convertAndSend(
            DelayConfig.DELAY_EXCHANGE,
            DelayConfig.DELAY_ROUTING_KEY,
            order,
            message -> {
                message.getMessageProperties().setExpiration(String.valueOf(delayMillis));
                return message;
            }
        );
    }
}

// 场景：订单超时取消
@Service
public class OrderTimeoutService {
    
    private static final int ORDER_TIMEOUT = 30 * 60 * 1000;  // 30分钟
    
    public void createOrder(Order order) {
        // 1. 创建订单
        orderService.save(order);
        
        // 2. 发送延迟消息
        delayProducer.sendDelayMessage(order, ORDER_TIMEOUT);
    }
}

// 死信队列消费者（处理超时）
@Component
public class DlxConsumer {
    
    @RabbitListener(queues = DelayConfig.DEAD_LETTER_QUEUE)
    public void handleTimeoutOrder(Order order) {
        // 检查订单状态
        Order dbOrder = orderService.findById(order.getId());
        if (dbOrder.getStatus() == OrderStatus.PENDING_PAYMENT) {
            // 超时未支付，取消订单
            orderService.cancel(order.getId());
            log.info("订单 {} 超时已取消", order.getId());
        }
    }
}
```

### 4.2 消息可靠性保证

```java
@Configuration
public class ReliableConfig {
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    @PostConstruct
    public void init() {
        // 开启Confirm（消息到达Exchange）
        rabbitTemplate.setConfirmCallback((correlationData, ack, cause) -> {
            if (!ack) {
                log.error("消息发送到Exchange失败: {}", cause);
                // 补偿机制：重试或记录数据库
            }
        });
        
        // 开启Return（消息到达Queue失败）
        rabbitTemplate.setReturnsCallback(returned -> {
            log.error("消息路由到Queue失败: exchange={}, routingKey={}, message={}",
                    returned.getExchange(),
                    returned.getRoutingKey(),
                    new String(returned.getMessage().getBody()));
        });
        
        // 强制消息发送（无匹配队列时触发Return）
        rabbitTemplate.setMandatory(true);
    }
}

// 数据库记录消息状态（最终一致性保障）
@Entity
@Table(name = "mq_messages")
@Data
public class MqMessage {
    @Id
    private String messageId;
    private String exchange;
    private String routingKey;
    private String payload;
    private String status;  // PENDING, SENT, CONSUMED, FAILED
    private Integer retryCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

@Service
public class ReliableProducer {
    
    @Transactional
    public void sendReliable(String exchange, String routingKey, Object message) {
        // 1. 先存数据库
        MqMessage msgRecord = new MqMessage();
        msgRecord.setMessageId(UUID.randomUUID().toString());
        msgRecord.setExchange(exchange);
        msgRecord.setRoutingKey(routingKey);
        msgRecord.setPayload(JsonUtils.toJson(message));
        msgRecord.setStatus("PENDING");
        msgRecord.setRetryCount(0);
        mqMessageRepository.save(msgRecord);
        
        // 2. 发消息
        try {
            rabbitTemplate.convertAndSend(exchange, routingKey, message,
                msg -> {
                    msg.getMessageProperties().setMessageId(msgRecord.getMessageId());
                    return msg;
                }
            );
        } catch (Exception e) {
            log.error("发送失败，等待定时任务重试", e);
        }
    }
}

// 定时任务：重试未确认消息
@Component
public class MessageRetryJob {
    
    @Scheduled(fixedDelay = 60000)  // 每分钟
    public void retry() {
        List<MqMessage> pendingMessages = mqMessageRepository
                .findByStatusAndRetryCountLessThan("PENDING", 3);
        
        for (MqMessage msg : pendingMessages) {
            try {
                rabbitTemplate.convertAndSend(
                    msg.getExchange(),
                    msg.getRoutingKey(),
                    JsonUtils.fromJson(msg.getPayload())
                );
                msg.setRetryCount(msg.getRetryCount() + 1);
                mqMessageRepository.save(msg);
            } catch (Exception e) {
                log.error("重试失败: {}", msg.getMessageId(), e);
            }
        }
    }
}
```

---

## 五、实战场景

### 5.1 秒杀系统削峰

```java
@Service
public class SeckillService {
    
    @Autowired
    private RabbitTemplate rabbitTemplate;
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    public ApiResponse<String> seckill(Long userId, Long productId) {
        // 1. 预减库存（Redis）
        Long stock = redisTemplate.opsForValue().decrement("seckill:stock:" + productId);
        if (stock == null || stock < 0) {
            redisTemplate.opsForValue().increment("seckill:stock:" + productId);
            return ApiResponse.error(500, "库存不足");
        }
        
        // 2. 排队（异步处理）
        SeckillMessage message = new SeckillMessage(userId, productId);
        rabbitTemplate.convertAndSend("seckill.exchange", "seckill", message);
        
        return ApiResponse.success("排队中，请稍后查看订单");
    }
}

// 异步处理订单
@Component
public class SeckillConsumer {
    
    @RabbitListener(queues = "seckill.queue", concurrency = "10")
    public void handleSeckill(SeckillMessage message) {
        // 创建订单（数据库操作）
        orderService.createSeckillOrder(message.getUserId(), message.getProductId());
    }
}
```

---

## 六、学习资源

### 文档
- [RabbitMQ官方教程](https://www.rabbitmq.com/getstarted.html)
- [Spring AMQP文档](https://docs.spring.io/spring-amqp/docs/current/reference/html/)

### 视频
- [尚硅谷RabbitMQ](https://www.bilibili.com/video/BV1cb4y1o7zz)

---

## Week 13 里程碑

- [ ] 理解AMQP核心概念
- [ ] 掌握三种交换机类型使用
- [ ] 实现延迟消息（超时取消）
- [ ] 实现可靠消息投递
- [ ] 使用消息队列实现削峰
