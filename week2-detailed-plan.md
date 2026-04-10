# Week 2 详细学习计划：面向对象 + 高级语法

> **目标**：掌握Java面向对象编程，理解类设计，熟练使用Stream API  
> **投入时间**：15-20小时（周中10h + 周末10h）  
> **预期产出**：电商商品类体系设计 + 数据处理器（Stream练习）

---

## 一、时间分配总览

| 时间段 | 内容 | 时长 |
|--------|------|------|
| **Day 1 (周一)** | 类与对象、封装、构造方法 | 2h |
| **Day 2-3 (周二-三)** | 继承与多态 | 4h |
| **Day 4 (周四)** | 抽象类与接口 | 2h |
| **Day 5 (周五)** | 异常处理 | 2h |
| **周六** | Stream API函数式编程 | 4h |
| **周日** | 综合项目：电商商品系统 | 4h |

---

## 二、核心概念：与前端对比

`★ Insight ─────────────────────────────────────`  
**JavaScript/TypeScript也有类和继承，但Java的OOP更严格、更规范**。Java是纯面向对象语言（除了基本类型），理解好OOP对后期学Spring Boot至关重要——Spring的核心就是基于接口编程 + 依赖注入。
─────────────────────────────────────────────────

### Java vs TypeScript 类对比

```typescript
// TypeScript
class User {
    // 可以直接定义属性
    name: string;
    private age: number;
    
    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
    }
    
    // 方法
    sayHello(): void {
        console.log(`Hi, I'm ${this.name}`);
    }
}
```

```java
// Java
public class User {
    // 必须先声明字段
    private String name;
    private int age;
    
    // 构造方法
    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    // getter/setter - Java的约定
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public int getAge() {
        return age;
    }
    
    public void setAge(int age) {
        this.age = age;
    }
    
    public void sayHello() {
        System.out.println("Hi, I'm " + name);
    }
}
```

---

## 三、Day 1：类与对象、封装（2小时）

### 3.1 类的基本结构

```java
public class Product {
    // ========== 字段（成员变量）==========
    private Long id;           // 私有，符合封装原则
    private String name;
    private double price;
    private int stock;
    
    // ========== 构造方法 ==========
    // 无参构造（Spring等框架需要）
    public Product() {}
    
    // 全参构造
    public Product(Long id, String name, double price, int stock) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.stock = stock;
    }
    
    // ========== getter/setter ==========
    // IDEA快捷键：Alt+Insert → Getter and Setter
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public double getPrice() { return price; }
    public void setPrice(double price) { 
        if (price >= 0) {
            this.price = price;
        }
    }
    
    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }
    
    // ========== 业务方法 ==========
    public void reduceStock(int quantity) {
        if (quantity > stock) {
            throw new IllegalArgumentException("库存不足");
        }
        this.stock -= quantity;
    }
    
    // ========== 重写方法 ==========
    @Override
    public String toString() {
        return "Product{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", price=" + price +
                ", stock=" + stock +
                '}';
    }
}
```

### 3.2 使用类

```java
public class Main {
    public static void main(String[] args) {
        // 创建对象 - 类似 new Product()
        Product phone = new Product(1L, "iPhone 15", 5999.0, 100);
        
        // 使用getter
        System.out.println(phone.getName());  // iPhone 15
        
        // 使用setter
        phone.setPrice(5799.0);
        
        // 业务方法
        phone.reduceStock(5);
        System.out.println(phone.getStock());  // 95
        
        // 打印对象
        System.out.println(phone);  // 自动调用toString()
    }
}
```

### 3.3 练习任务

**目标**：创建`Student`类

```java
public class Student {
    private Long id;
    private String name;
    private int age;
    private double score;
    
    // TODO: 
    // 1. 无参和全参构造方法
    // 2. 所有字段的getter/setter
    // 3. 业务方法：isExcellent()判断成绩是否>=90
    // 4. toString()方法
}
```

---

## 四、Day 2-3：继承与多态（4小时）

### 4.1 继承基础

**与TypeScript对比**：

```typescript
// TypeScript
class Animal {
    protected name: string;  // protected子类可访问
    
    constructor(name: string) {
        this.name = name;
    }
    
    makeSound(): void {
        console.log("Some sound");
    }
}

class Dog extends Animal {
    constructor(name: string) {
        super(name);
    }
    
    makeSound(): void {
        console.log("Woof!");
    }
}
```

```java
// Java
public class Animal {
    protected String name;  // protected子类可访问
    
    public Animal(String name) {
        this.name = name;
    }
    
    public void makeSound() {
        System.out.println("Some sound");
    }
}

public class Dog extends Animal {
    public Dog(String name) {
        super(name);  // 调用父类构造方法
    }
    
    @Override
    public void makeSound() {  // 重写父类方法
        System.out.println("Woof!");
    }
    
    public void fetch() {
        System.out.println(name + " is fetching the ball");
    }
}
```

**关键区别**：
- Java类只能单继承（一个子类只能extends一个父类）
- 但可以实现多个接口（弥补单继承的局限）

### 4.2 多态（Polymorphism）

多态 = **父类引用指向子类对象**

```java
public class Main {
    public static void main(String[] args) {
        // 父类引用指向子类对象
        Animal myDog = new Dog("Buddy");
        Animal myCat = new Cat("Kitty");
        
        // 同样的调用，不同结果
        myDog.makeSound();  // Woof!
        myCat.makeSound();  // Meow!
        
        // 不能调用子类特有方法（编译看左边）
        // myDog.fetch();  // 编译错误！
        
        // 类型检查后再调用
        if (myDog instanceof Dog) {
            ((Dog) myDog).fetch();  // 强制类型转换
        }
    }
}
```

**与前端对照**：
```javascript
// JavaScript也支持多态，但更灵活（动态类型）
class Animal { speak() {} }
class Dog extends Animal { speak() { return "Woof"; } }

const animals = [new Dog(), new Cat()];
animals.forEach(a => console.log(a.speak()));  // 多态
```

### 4.3 访问修饰符

| 修饰符 | 同类 | 同包 | 子类 | 任何地方 |
|--------|------|------|------|----------|
| `public` | ✓ | ✓ | ✓ | ✓ |
| `protected` | ✓ | ✓ | ✓ | ✗ |
| 默认(无) | ✓ | ✓ | ✗ | ✗ |
| `private` | ✓ | ✗ | ✗ | ✗ |

### 4.4 练习任务

**设计电商商品继承体系**：

```java
// 基类
public abstract class Product {
    protected Long id;
    protected String name;
    protected double price;
    
    // TODO: 构造方法、getter、toString
    
    // 抽象方法 - 子类必须实现
    public abstract String getCategory();
}

// 电子产品
public class ElectronicProduct extends Product {
    private String brand;
    private int warrantyMonths;  // 保修月数
    
    // TODO: 构造方法、getter
    
    @Override
    public String getCategory() {
        return "电子产品";
    }
}

// 服装
public class ClothingProduct extends Product {
    private String size;
    private String color;
    
    // TODO: 实现
    
    @Override
    public String getCategory() {
        return "服装";
    }
}

// 食品
public class FoodProduct extends Product {
    private LocalDate expirationDate;  // 保质期
    
    // TODO: 实现
    
    @Override
    public String getCategory() {
        return "食品";
    }
    
    // 业务方法
    public boolean isExpired() {
        return LocalDate.now().isAfter(expirationDate);
    }
}
```

**测试代码**：
```java
public class ShopTest {
    public static void main(String[] args) {
        // 多态：用父类数组存储不同子类
        Product[] products = new Product[3];
        products[0] = new ElectronicProduct(1L, "手机", 2999, "小米", 12);
        products[1] = new ClothingProduct(2L, "T恤", 99, "L", "白色");
        products[2] = new FoodProduct(3L, "牛奶", 10, LocalDate.now().plusDays(7));
        
        // 遍历展示
        for (Product p : products) {
            System.out.println(p.getName() + " - " + p.getCategory());
        }
    }
}
```

---

## 五、Day 4：抽象类与接口（2小时）

### 5.1 抽象类（abstract class）

```java
// 抽象类 = 有抽象方法的类，不能实例化
public abstract class Payment {
    protected String orderId;
    protected double amount;
    
    public Payment(String orderId, double amount) {
        this.orderId = orderId;
        this.amount = amount;
    }
    
    // 抽象方法 - 子类必须实现
    public abstract boolean processPayment();
    
    // 普通方法 - 子类可直接使用
    public String getOrderId() {
        return orderId;
    }
    
    public void printReceipt() {
        System.out.println("订单: " + orderId + ", 金额: " + amount);
    }
}

// 具体实现
public class AlipayPayment extends Payment {
    private String alipayAccount;
    
    public AlipayPayment(String orderId, double amount, String account) {
        super(orderId, amount);
        this.alipayAccount = account;
    }
    
    @Override
    public boolean processPayment() {
        System.out.println("使用支付宝支付: " + alipayAccount);
        return true;
    }
}
```

### 5.2 接口（Interface）

`★ Insight ─────────────────────────────────────`  
**接口是Java实现多态和解耦的核心机制**。Spring Boot中大量依赖接口：`UserService`是接口，`UserServiceImpl`是实现类。这种设计让代码灵活、可测试。
─────────────────────────────────────────────────

```java
// 定义接口 - 规范行为
public interface DiscountStrategy {
    double calculateDiscount(double originalPrice);
}

// 实现类1：会员折扣
public class MemberDiscount implements DiscountStrategy {
    @Override
    public double calculateDiscount(double price) {
        return price * 0.9;  // 9折
    }
}

// 实现类2：满减折扣
public class FullReductionDiscount implements DiscountStrategy {
    private double threshold;   // 满多少
    private double reduction;   // 减多少
    
    public FullReductionDiscount(double threshold, double reduction) {
        this.threshold = threshold;
        this.reduction = reduction;
    }
    
    @Override
    public double calculateDiscount(double price) {
        if (price >= threshold) {
            return price - reduction;
        }
        return price;
    }
}

// 使用 - 策略模式
public class OrderService {
    public double checkout(double price, DiscountStrategy strategy) {
        return strategy.calculateDiscount(price);
    }
}

// 测试
public class Main {
    public static void main(String[] args) {
        OrderService service = new OrderService();
        
        // 运行时切换策略
        double price1 = service.checkout(100, new MemberDiscount());
        double price2 = service.checkout(200, new FullReductionDiscount(200, 30));
    }
}
```

**与TypeScript对比**：
```typescript
// TS的interface更灵活，可以描述对象形状
interface DiscountStrategy {
    calculateDiscount(price: number): number;
}

// Java的interface是更严格的契约
```

**Java 8+接口新特性**：
```java
public interface Logger {
    // 抽象方法
    void log(String message);
    
    // 默认方法 - 有实现
    default void logInfo(String msg) {
        log("[INFO] " + msg);
    }
    
    // 静态方法
    static Logger getDefault() {
        return new ConsoleLogger();
    }
}
```

### 5.3 抽象类 vs 接口

| 特性 | 抽象类 | 接口 |
|------|--------|------|
| 继承 | 单继承（extends） | 多实现（implements） |
| 字段 | 可以有字段 | 只能有常量（static final） |
| 构造方法 | 有 | 无 |
| 方法实现 | 可以有 | Java 8+可以有default方法 |
| 设计目的 | "是什么"（is-a） | "能做什么"（can-do） |

---

## 六、Day 5：异常处理（2小时）

### 6.1 基础语法

**与JavaScript对比**：

```javascript
// JavaScript
try {
    const result = riskyOperation();
} catch (error) {
    console.error("出错了:", error.message);
} finally {
    console.log("总会执行");
}
```

```java
// Java - 类似但有受检异常概念
try {
    int result = divide(10, 0);
} catch (ArithmeticException e) {
    System.out.println("除零错误: " + e.getMessage());
} finally {
    System.out.println("清理资源...");  // 总会执行
}
```

### 6.2 异常体系

```
Throwable
├── Error（系统级错误，不处理）
│   └── OutOfMemoryError
└── Exception（可处理）
    ├── RuntimeException（运行时异常）
    │   ├── NullPointerException
    │   ├── IllegalArgumentException
    │   └── IndexOutOfBoundsException
    └── 受检异常（必须处理或声明）
        ├── IOException
        └── SQLException
```

### 6.3 自定义异常

```java
// 业务异常
public class InsufficientStockException extends RuntimeException {
    private Long productId;
    private int available;
    private int requested;
    
    public InsufficientStockException(Long productId, int available, int requested) {
        super(String.format("商品%d库存不足，现有%d，请求%d", 
                productId, available, requested));
        this.productId = productId;
        this.available = available;
        this.requested = requested;
    }
    
    // getter...
}

// 使用
public void reduceStock(int quantity) {
    if (quantity > stock) {
        throw new InsufficientStockException(id, stock, quantity);
    }
    stock -= quantity;
}
```

### 6.4 最佳实践

1. **不要吞异常**：
```java
// 错误
} catch (Exception e) {
    // 什么都不做！
}

// 正确
} catch (Exception e) {
    logger.error("操作失败", e);
    throw new BusinessException("操作失败", e);
}
```

2. **优先使用标准异常**：
- 参数错误 → `IllegalArgumentException`
- 空指针 → `NullPointerException`
- 状态错误 → `IllegalStateException`

---

## 七、周六：Stream API（4小时）

### 7.1 什么是Stream

`★ Insight ─────────────────────────────────────`  
**Stream API = Java 8引入的函数式编程特性**，类似JavaScript的数组方法（map/filter/reduce）或Lodash的链式调用。处理集合数据时非常高效简洁。
─────────────────────────────────────────────────

### 7.2 基础操作对照

| JavaScript | Java Stream |
|------------|-------------|
| `arr.filter(x => x > 5)` | `list.stream().filter(x -> x > 5).toList()` |
| `arr.map(x => x * 2)` | `list.stream().map(x -> x * 2).toList()` |
| `arr.find(x => x.id === 1)` | `list.stream().filter(x -> x.getId() == 1).findFirst()` |
| `arr.reduce((a,b) => a+b, 0)` | `list.stream().reduce(0, (a,b) -> a+b)` |
| `arr.sort((a,b) => b-a)` | `list.stream().sorted(Comparator.reverseOrder())` |

### 7.3 实战示例

```java
public class StreamDemo {
    public static void main(String[] args) {
        List<Product> products = List.of(
            new Product(1L, "iPhone", 5999.0, 100),
            new Product(2L, "MacBook", 12999.0, 50),
            new Product(3L, "AirPods", 1299.0, 200),
            new Product(4L, "iPad", 3999.0, 80)
        );
        
        // 1. 筛选价格大于5000的商品
        List<Product> expensive = products.stream()
            .filter(p -> p.getPrice() > 5000)
            .toList();
        
        // 2. 只取商品名称
        List<String> names = products.stream()
            .map(Product::getName)  // 方法引用
            .toList();
        
        // 3. 按价格排序
        List<Product> sorted = products.stream()
            .sorted(Comparator.comparing(Product::getPrice).reversed())
            .toList();
        
        // 4. 计算总价
        double total = products.stream()
            .mapToDouble(Product::getPrice)
            .sum();
        
        // 5. 按库存分组（>100和<=100）
        Map<Boolean, List<Product>> byStock = products.stream()
            .collect(Collectors.partitioningBy(p -> p.getStock() > 100));
        
        // 6. 找出最贵的商品
        Optional<Product> maxPrice = products.stream()
            .max(Comparator.comparing(Product::getPrice));
        maxPrice.ifPresent(p -> System.out.println(p.getName()));
    }
}
```

### 7.4 Lambda表达式

```java
// 等价写法对比

// 完整写法
list.stream().filter((Product p) -> { return p.getPrice() > 5000; });

// 简写（类型推断）
list.stream().filter(p -> p.getPrice() > 5000);

// 方法引用（更简洁）
list.stream().map(p -> p.getName());     // Lambda
list.stream().map(Product::getName);      // 方法引用
```

### 7.5 练习任务

给定学生列表，完成以下操作：

```java
List<Student> students = List.of(
    new Student(1L, "张三", 18, 85),
    new Student(2L, "李四", 19, 92),
    new Student(3L, "王五", 18, 78),
    new Student(4L, "赵六", 20, 95),
    new Student(5L, "钱七", 19, 88)
);

// TODO: 
// 1. 找出所有90分以上的学生
// 2. 按成绩降序排列
// 3. 计算平均分
// 4. 按年龄分组
// 5. 找出成绩最高的学生姓名
```

---

## 八、周日：综合项目 - 电商商品管理系统（4小时）

### 项目需求

构建一个控制台版的商品管理系统，综合运用本周知识：

```
功能菜单：
=== 商品管理系统 ===
1. 添加商品（支持电子产品、服装、食品）
2. 查看所有商品
3. 按类别筛选
4. 按价格排序
5. 搜索商品（按名称模糊匹配）
6. 应用折扣（策略模式）
7. 导出库存报表
0. 退出
```

### 核心类设计

```java
// Product.java - 抽象基类
public abstract class Product {
    protected Long id;
    protected String name;
    protected double price;
    protected int stock;
    
    public abstract String getCategory();
    public abstract String getExtraInfo();
    
    // 应用折扣策略（接口）
    public double applyDiscount(DiscountStrategy strategy) {
        return strategy.calculateDiscount(price);
    }
    
    // getter/setter/toString...
}

// ElectronicProduct.java - 电子产品
// ClothingProduct.java - 服装
// FoodProduct.java - 食品

// ProductManager.java - 管理类
public class ProductManager {
    private List<Product> products = new ArrayList<>();
    
    public void addProduct(Product product) { }
    
    public List<Product> findByCategory(String category) { }
    
    public List<Product> searchByName(String keyword) { }
    
    public List<Product> sortByPrice(boolean ascending) { }
    
    public void printInventoryReport() { }
}

// Main.java - 控制台入口
public class ShopApp {
    public static void main(String[] args) {
        ProductManager manager = new ProductManager();
        Scanner scanner = new Scanner(System.in);
        
        // TODO: 实现菜单循环
    }
}
```

### 实现检查清单

- [ ] 抽象Product类设计合理
- [ ] 三种商品类型正确继承
- [ ] 使用接口DiscountStrategy实现折扣
- [ ] Stream API完成筛选/排序/搜索
- [ ] 异常处理（如库存不足）
- [ ] 控制台交互流畅

---

## 九、学习资源

### 视频课程
| 资源 | 时长 | 内容 |
|------|------|------|
| 尚硅谷Java-面向对象 | ~4h | P41-P70 |
| 尚硅谷Java-异常处理 | ~1h | P71-P80 |
| 尚硅谷Java-Stream API | ~2h | Java 8新特性部分 |

### 文档
- [廖雪峰Java-OOP](https://www.liaoxuefeng.com/wiki/1252599548343744/1260454548196880)
- [Java Stream API指南](https://www.baeldung.com/java-8-streams)

---

## 十、Week 2 里程碑

完成本周学习后，你应该能够：

- [ ] 设计合理的类结构（封装、继承、多态）
- [ ] 区分和使用抽象类与接口
- [ ] 熟练使用Stream API处理集合数据
- [ ] 正确处理异常，自定义业务异常
- [ ] 独立完成一个小型OOP项目

---

## 下一步预告

**Week 3**：Maven构建工具 + 单元测试 + Lombok
- 理解项目依赖管理（类比npm）
- 学习JUnit测试框架
- 用Lombok简化代码

*Week 2是Java的灵魂，打好OOP基础，后面学Spring Boot会事半功倍！*
