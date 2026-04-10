# Week 3 详细学习计划：Maven + 工程化工具

> **目标**：掌握Java项目构建，能使用工程化工具提高开发效率  
> **投入时间**：15-20小时（周中10h + 周末10h）  
> **预期产出**：规范的Maven项目 + 完整的单元测试覆盖 + 使用Lombok重构代码

---

## 一、时间分配总览

| 时间段 | 内容 | 时长 |
|--------|------|------|
| **Day 1 (周一)** | Maven基础：安装、生命周期、依赖管理 | 2h |
| **Day 2-3 (周二-三)** | Maven进阶：多模块、依赖传递、冲突解决 | 4h |
| **Day 4 (周四)** | JUnit 5单元测试 | 2h |
| **Day 5 (周五)** | Lombok简化开发 + SLF4J日志 | 2h |
| **周六** | 项目实战：重构Week 2的项目为Maven项目 | 4h |
| **周日** | 完善测试 + 总结 | 4h |

---

## 二、核心概念：与前端工具链对比

`★ Insight ─────────────────────────────────────`  
**Maven之于Java，就像 npm/yarn/pnpm 之于 Node.js**。但Maven比npm更"重"，它不仅管理依赖，还定义了完整构建生命周期（编译→测试→打包→部署）。理解Maven = 理解Java项目的标准结构。
─────────────────────────────────────────────────

### 工具对照表

| Node.js生态 | Java生态 | 作用 |
|-------------|----------|------|
| `package.json` | `pom.xml` | 项目配置 + 依赖声明 |
| `node_modules` | `~/.m2/repository` | 依赖存储目录 |
| `npm install` | `mvn clean install` | 下载依赖 + 构建项目 |
| `npm run build` | `mvn package` | 打包项目 |
| `npm test` | `mvn test` | 运行测试 |
| Jest | JUnit 5 | 单元测试框架 |
| - | Lombok | 编译时代码生成（减少样板代码）|
| winston | SLF4J + Logback | 日志框架 |

---

## 三、Day 1：Maven基础（2小时）

### 3.1 安装与配置

**检查安装**：
```bash
mvn -version
```

**配置镜像（加速下载）**：
编辑 `~/.m2/settings.xml`（没有则创建）：

```xml
<settings>
  <mirrors>
    <!-- 阿里云镜像，国内必配 -->
    <mirror>
      <id>aliyun</id>
      <name>Aliyun Maven</name>
      <url>https://maven.aliyun.com/repository/public</url>
      <mirrorOf>central</mirrorOf>
    </mirror>
  </mirrors>
</settings>
```

### 3.2 第一个Maven项目

#### 方式1：命令行创建
```bash
mvn archetype:generate \
  -DgroupId=com.example \
  -DartifactId=my-app \
  -DarchetypeArtifactId=maven-archetype-quickstart \
  -DinteractiveMode=false
```

#### 方式2：IDEA创建（推荐）
File → New → Project → Maven → 选择JDK → Finish

### 3.3 目录结构详解

```
my-app/                          # 项目根目录
├── pom.xml                      # 项目配置（= package.json）
├── src/
│   ├── main/
│   │   ├── java/               # 源代码
│   │   │   └── com/example/
│   │   │       └── App.java
│   │   └── resources/          # 配置文件
│   └── test/
│       ├── java/               # 测试代码
│       │   └── com/example/
│       │       └── AppTest.java
│       └── resources/          # 测试配置
└── target/                     # 构建输出（= dist/）
```

**与Node.js项目对比**：
```
node-project/               java-project/
├── package.json            ├── pom.xml
├── src/                    ├── src/main/java/
├── node_modules/           ├── src/test/java/
└── dist/                   └── target/
```

### 3.4 pom.xml核心配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <!-- 项目坐标 -->
    <groupId>com.example</groupId>      <!-- 组织/公司域名倒写 -->
    <artifactId>shop-system</artifactId> <!-- 项目名 -->
    <version>1.0-SNAPSHOT</version>     <!-- 版本 -->
    <packaging>jar</packaging>          <!-- 打包类型：jar/war -->
    
    <properties>
        <!-- 编码和JDK版本 -->
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
    </properties>
    
    <dependencies>
        <!-- 依赖声明 -->
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.13.2</version>
            <scope>test</scope>          <!-- 只在测试时使用 -->
        </dependency>
    </dependencies>
</project>
```

**与package.json对比**：
```json
// package.json
{
  "name": "shop-system",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
```

```xml
<!-- pom.xml -->
<dependencies>
    <!-- 相当于 dependencies -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
        <version>3.2.0</version>
    </dependency>
    
    <!-- 相当于 devDependencies -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <version>5.10.0</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### 3.5 Maven生命周期

```bash
# 常用命令
mvn clean           # 清理target目录
mvn compile         # 编译src/main/java → target/classes
mvn test            # 运行测试
mvn package         # 打包为jar/war
mvn install         # 安装到本地仓库（~/.m2/repository）
mvn deploy          # 部署到远程仓库

# 组合命令
mvn clean install   # 最常用！清理 + 编译 + 测试 + 打包 + 安装
```

**与npm命令对照**：

| npm | Maven | 说明 |
|-----|-------|------|
| `npm install` | `mvn dependency:resolve` | 下载依赖 |
| `npm run build` | `mvn package` | 构建项目 |
| `npm test` | `mvn test` | 运行测试 |
| `npm run clean` | `mvn clean` | 清理构建目录 |

### 3.6 练习任务

**创建Maven项目并运行**：

1. IDEA中创建Maven项目（选择quickstart模板）
2. 编写简单的Hello World类
3. 运行 `mvn clean compile`
4. 运行 `mvn exec:java -Dexec.mainClass="com.example.App"`

---

## 四、Day 2-3：Maven进阶（4小时）

### 4.1 依赖作用域（Scope）

```xml
<dependencies>
    <!-- compile: 默认，编译、测试、运行都需要 -->
    <dependency>
        <groupId>com.google.guava</groupId>
        <artifactId>guava</artifactId>
        <version>32.1.0</version>
        <!-- scope不写默认是compile -->
    </dependency>
    
    <!-- provided: 编译需要，但运行容器提供（如Servlet API） -->
    <dependency>
        <groupId>javax.servlet</groupId>
        <artifactId>javax.servlet-api</artifactId>
        <version>4.0.1</version>
        <scope>provided</scope>
    </dependency>
    
    <!-- runtime: 运行时需要，编译不需要（如数据库驱动） -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <version>8.0.33</version>
        <scope>runtime</scope>
    </dependency>
    
    <!-- test: 仅测试需要（如JUnit） -->
    <dependency>
        <groupId>org.junit.jupiter</groupId>
        <artifactId>junit-jupiter</artifactId>
        <scope>test</scope>
    </dependency>
    
    <!-- system: 本地jar包（不推荐） -->
</dependencies>
```

### 4.2 依赖传递与冲突

**依赖传递示例**：
```
你的项目
├── A依赖 (v1.0)
│   └── C依赖 (v1.0)
└── B依赖 (v1.0)
    └── C依赖 (v2.0)

问题：C有v1.0和v2.0两个版本，用哪个？
```

**解决冲突 - 排除依赖**：
```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>A</artifactId>
    <version>1.0</version>
    <exclusions>
        <!-- 排除A传递的C依赖 -->
        <exclusion>
            <groupId>com.example</groupId>
            <artifactId>C</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

**依赖仲裁原则**：
1. 路径最短优先
2. 路径相同，先声明优先（pom.xml中靠前的优先）

**查看依赖树**：
```bash
mvn dependency:tree
```

### 4.3 Maven仓库

```
仓库类型：
├── 本地仓库：~/.m2/repository/
├── 远程仓库：
│   ├── 中央仓库（Maven Central）
│   ├── 私服（Nexus/Artifactory）
│   └── 阿里云等镜像仓库
└── 远程仓库配置在pom.xml或settings.xml中
```

**配置公司私服（实际工作中常见）**：
```xml
<repositories>
    <repository>
        <id>company-repo</id>
        <url>http://nexus.company.com/repository/maven-public/</url>
    </repository>
</repositories>
```

### 4.4 实际项目依赖配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project>
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.example</groupId>
    <artifactId>shop-system</artifactId>
    <version>1.0-SNAPSHOT</version>
    
    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <junit.version>5.10.0</junit.version>
    </properties>
    
    <dependencies>
        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.30</version>
            <scope>provided</scope>
        </dependency>
        
        <!-- SLF4J + Logback -->
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>2.0.9</version>
        </dependency>
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-classic</artifactId>
            <version>1.4.11</version>
        </dependency>
        
        <!-- JUnit 5 -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>${junit.version}</version>
            <scope>test</scope>
        </dependency>
        
        <!-- AssertJ - 更友好的断言 -->
        <dependency>
            <groupId>org.assertj</groupId>
            <artifactId>assertj-core</artifactId>
            <version>3.24.2</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <!-- 编译插件 -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>17</source>
                    <target>17</target>
                </configuration>
            </plugin>
            
            <!-- 打包插件 -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <version>3.5.0</version>
                <executions>
                    <execution>
                        <phase>package</phase>
                        <goals>
                            <goal>shade</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

---

## 五、Day 4：JUnit 5单元测试（2小时）

### 5.1 测试类基本结构

```java
// src/test/java/com/example/ProductTest.java
package com.example;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;

class ProductTest {
    
    private Product product;
    
    @BeforeEach
    void setUp() {
        // 每个测试方法前执行
        product = new Product(1L, "iPhone", 5999.0, 100);
    }
    
    @Test
    void shouldGetCorrectName() {
        // given (准备)
        
        // when (执行)
        String name = product.getName();
        
        // then (断言)
        assertEquals("iPhone", name);
    }
    
    @Test
    void shouldReduceStockCorrectly() {
        // when
        product.reduceStock(10);
        
        // then
        assertEquals(90, product.getStock());
    }
    
    @Test
    void shouldThrowExceptionWhenStockInsufficient() {
        // when & then
        assertThrows(InsufficientStockException.class, () -> {
            product.reduceStock(200);
        });
    }
    
    @Test
    void shouldCalculateDiscountCorrectly() {
        // given
        DiscountStrategy strategy = price -> price * 0.9;
        
        // when
        double discounted = product.applyDiscount(strategy);
        
        // then
        assertEquals(5399.1, discounted, 0.01);  // 允许误差
    }
}
```

### 5.2 常用注解

| 注解 | 作用 | Jest对应 |
|------|------|----------|
| `@Test` | 标记测试方法 | `test()` |
| `@BeforeEach` | 每个测试前执行 | `beforeEach()` |
| `@AfterEach` | 每个测试后执行 | `afterEach()` |
| `@BeforeAll` | 所有测试前执行一次 | `beforeAll()` |
| `@AfterAll` | 所有测试后执行一次 | `afterAll()` |
| `@Disabled` | 跳过测试 | `test.skip()` |
| `@ParameterizedTest` | 参数化测试 | `test.each()` |

### 5.3 AssertJ流式断言（推荐）

```java
import static org.assertj.core.api.Assertions.*;

@Test
void shouldHaveCorrectProperties() {
    Product product = new Product(1L, "iPhone", 5999.0, 100);
    
    // AssertJ的流式断言，更易读
    assertThat(product.getName())
        .isEqualTo("iPhone")
        .startsWith("i")          // 链式断言
        .hasSize(6);
    
    assertThat(product.getPrice())
        .isGreaterThan(5000)
        .isLessThan(10000)
        .isPositive();
    
    assertThat(product)
        .extracting(Product::getName, Product::getStock)
        .containsExactly("iPhone", 100);
}

@Test
void shouldThrowException() {
    assertThatThrownBy(() -> product.reduceStock(200))
        .isInstanceOf(InsufficientStockException.class)
        .hasMessageContaining("库存不足");
}
```

**与Jest对比**：
```javascript
// Jest
test('should have correct properties', () => {
  const product = { name: 'iPhone', price: 5999 };
  
  expect(product.name).toBe('iPhone');
  expect(product.price).toBeGreaterThan(5000);
  expect(() => riskyOp()).toThrow('error');
});
```

### 5.4 参数化测试

```java
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

@ParameterizedTest
@CsvSource({
    "1, 1, 2",     // a, b, expected
    "2, 3, 5",
    "10, 20, 30",
    "-1, 1, 0"
})
void shouldAddCorrectly(int a, int b, int expected) {
    Calculator calc = new Calculator();
    assertEquals(expected, calc.add(a, b));
}
```

---

## 六、Day 5：Lombok + 日志（2小时）

### 6.1 Lombok - 告别样板代码

**安装**：IDEA插件市场搜索"Lombok Plugin"安装

**常用注解**：

```java
// 原始Java代码：
public class Product {
    private Long id;
    private String name;
    private double price;
    
    public Product() {}
    
    public Product(Long id, String name, double price) {
        this.id = id;
        this.name = name;
        this.price = price;
    }
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    // ... 十几个getter/setter
    
    @Override
    public String toString() {
        return "Product{id=" + id + ", name='" + name + "'}";
    }
    
    @Override
    public boolean equals(Object o) { /* ... */ }
    
    @Override
    public int hashCode() { /* ... */ }
}
```

```java
// Lombok简化后：
import lombok.*;

@Data                    // = @Getter + @Setter + @ToString + @EqualsAndHashCode
@NoArgsConstructor       // 无参构造
@AllArgsConstructor      // 全参构造
@Builder                 // 建造者模式
public class Product {
    private Long id;
    private String name;
    private double price;
}
```

**注解对照表**：

| 注解 | 作用 |
|------|------|
| `@Getter` / `@Setter` | 为所有字段生成getter/setter |
| `@ToString` | 生成toString() |
| `@EqualsAndHashCode` | 生成equals()和hashCode() |
| `@Data` | 上述全部 |
| `@NoArgsConstructor` | 无参构造 |
| `@AllArgsConstructor` | 全参构造 |
| `@RequiredArgsConstructor` | 为final字段生成构造方法 |
| `@Builder` | 建造者模式 |

**使用示例**：
```java
// 1. 简单创建
Product p1 = new Product();
p1.setName("iPhone");
p1.setPrice(5999.0);

// 2. 全参构造
Product p2 = new Product(1L, "iPhone", 5999.0);

// 3. Builder模式（推荐！）
Product p3 = Product.builder()
    .id(1L)
    .name("iPhone")
    .price(5999.0)
    .build();
```

### 6.2 SLF4J + Logback日志

**为什么不用System.out.println？**
- 无法控制输出级别
- 无法输出到文件/远程
- 影响性能

**配置`src/main/resources/logback.xml`**：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <!-- 控制台输出 -->
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <!-- 文件输出 -->
    <appender name="FILE" class="ch.qos.logback.core.FileAppender">
        <file>logs/app.log</file>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <!-- 日志级别：ERROR > WARN > INFO > DEBUG > TRACE -->
    <root level="INFO">
        <appender-ref ref="STDOUT" />
        <appender-ref ref="FILE" />
    </root>
</configuration>
```

**代码中使用**：
```java
import lombok.extern.slf4j.Slf4j;

@Slf4j  // Lombok自动生成日志对象
public class ProductService {
    
    public void createProduct(Product product) {
        log.debug("开始创建商品: {}", product.getName());
        
        if (product.getPrice() < 0) {
            log.error("商品价格不能为负数: {}", product.getPrice());
            throw new IllegalArgumentException("价格无效");
        }
        
        // 保存逻辑...
        log.info("商品创建成功: id={}", product.getId());
    }
    
    public Product getProduct(Long id) {
        log.warn("查询商品可能存在延迟: id={}", id);
        // ...
    }
}
```

**输出示例**：
```
2024-01-15 10:30:25 [main] INFO  com.example.ProductService - 商品创建成功: id=1
2024-01-15 10:30:25 [main] ERROR com.example.ProductService - 商品价格不能为负数: -100.0
```

---

## 七、周六：项目实战（4小时）

### 任务：将Week 2的项目重构为Maven项目

**步骤1：创建Maven项目结构**
```
shop-system/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/com/example/shop/
│   │   │   ├── ShopApp.java
│   │   │   ├── model/
│   │   │   │   ├── Product.java
│   │   │   │   ├── ElectronicProduct.java
│   │   │   │   ├── ClothingProduct.java
│   │   │   │   └── FoodProduct.java
│   │   │   ├── service/
│   │   │   │   ├── ProductManager.java
│   │   │   │   └── DiscountStrategy.java
│   │   │   └── exception/
│   │   │       └── InsufficientStockException.java
│   │   └── resources/
│   │       └── logback.xml
│   └── test/
│       └── java/com/example/shop/
│           ├── model/ProductTest.java
│           └── service/ProductManagerTest.java
```

**步骤2：用Lombok重构所有实体类**
- 删除所有getter/setter
- 添加`@Data`、`@NoArgsConstructor`、`@AllArgsConstructor`

**步骤3：添加日志**
- 在ProductManager关键方法中添加日志
- 配置logback.xml

**步骤4：编写单元测试**
- 为Product类编写测试
- 为ProductManager编写测试（至少80%覆盖率）

**步骤5：验证构建**
```bash
mvn clean test        # 运行测试
mvn clean package     # 打包
java -jar target/shop-system-1.0-SNAPSHOT.jar  # 运行
```

---

## 八、周日：完善与总结（4小时）

### 8.1 代码覆盖率检查（可选）

添加JaCoCo插件：
```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.11</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

运行：
```bash
mvn clean test
# 查看 target/site/jacoco/index.html
```

### 8.2 Maven最佳实践总结

1. **使用属性版本管理**：
```xml
<properties>
    <spring.version>3.2.0</spring.version>
</properties>

<dependency>
    <artifactId>spring-boot</artifactId>
    <version>${spring.version}</version>
</dependency>
```

2. **依赖就近声明**：直接使用的依赖一定要在pom.xml声明，不要依赖传递依赖

3. **版本统一管理**：公司项目通常有parent pom统一管理版本

4. **镜像加速**：国内必配阿里云镜像

---

## 九、学习资源

### 视频
- [尚硅谷Maven教程](https://www.bilibili.com/video/BV1TW411g7hP) - 1-20集
- [JUnit 5教程](https://www.bilibili.com/video/BV1jE411t7oA)

### 文档
- [Maven官方文档](https://maven.apache.org/guides/)
- [JUnit 5用户指南](https://junit.org/junit5/docs/current/user-guide/)
- [Lombok特性](https://projectlombok.org/features/)

---

## 十、Week 3 里程碑

完成本周后，你应该能够：

- [ ] 创建标准的Maven项目结构
- [ ] 理解pom.xml核心配置
- [ ] 熟练使用Maven命令（clean、compile、test、package）
- [ ] 为项目编写JUnit 5单元测试
- [ ] 使用Lombok简化实体类代码
- [ ] 配置和使用SLF4J日志框架
- [ ] 理解依赖作用域和传递机制

---

`★ Insight ─────────────────────────────────────`
**为什么Week 3专门学Maven而不是继续语法？**

因为Week 4开始就要进入Spring Boot了，而Spring Boot项目本质上就是Maven项目（也可以用Gradle）。提前掌握Maven：
1. 理解Spring Boot的依赖管理（starter机制）
2. 能看懂和调试依赖问题
3. 具备完整的工程化思维（不只是写代码）

另外，**Lombok在Spring Boot开发中是标配**，不学它你后期会写大量无聊的getter/setter。
─────────────────────────────────────────────────

---

**下一步预告**：Week 4 进入 **Spring Boot 基础**！你将编写第一个REST API。
