# Week 1 详细学习计划：环境搭建 + Java基础语法

> **目标**：搭建Java开发环境，掌握基础语法，能独立编写控制台程序  
> **投入时间**：15-20小时（周中10h + 周末10h）  
> **预期产出**：两个可运行的控制台程序（计算器 + 待办清单）

---

## 一、时间分配总览

| 时间段 | 内容 | 时长 |
|--------|------|------|
| **Day 1 (周一)** | 环境安装与配置 | 2h |
| **Day 2-3 (周二-三)** | 基础语法学习（变量、类型、控制流）| 4h |
| **Day 4-5 (周四-五)** | 数组与集合框架 | 4h |
| **周六** | 项目实战（待办清单）| 4h |
| **周日** | 复习整理 + HashMap练习 | 4h |

---

## 二、Day 1：环境搭建（2小时）

### 2.1 安装JDK 17

**下载地址**：https://www.oracle.com/java/technologies/downloads/#java17

**验证安装**：
```bash
java -version
javac -version
```

**环境变量配置**（如需要）：
```bash
JAVA_HOME = C:\Program Files\Java\jdk-17
Path = %JAVA_HOME%\bin
```

### 2.2 安装IntelliJ IDEA

**下载**：https://www.jetbrains.com/idea/download/  
**选择**：Community Edition（免费版足够）

**必做配置**：
1. 设置字体和主题（File → Settings → Appearance）
2. 配置编码为UTF-8（Settings → Editor → File Encodings）
3. 安装插件：
   - Chinese (Simplified) Language Pack（如需中文）
   - Rainbow Brackets（括号配对高亮）

### 2.3 第一个Java程序

创建项目 → New Project → Java → 选择JDK 17 → Create

```java
// src/Main.java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
        System.out.println("从NestJS到Spring Boot的旅程开始！");
    }
}
```

**与Node.js对比**：
```javascript
// Node.js
console.log("Hello, Node!");
```

```java
// Java
System.out.println("Hello, Java!");
```

**运行方式对比**：
| Node.js | Java |
|---------|------|
| `node app.js` | `javac Main.java && java Main` |
| 解释执行 | 编译后执行 |
| 不需要显式编译 | 需要javac编译成.class文件 |

---

## 三、Day 2-3：基础语法（4小时）

### 3.1 变量与数据类型（1.5h）

**与TypeScript对比**：

```typescript
// TypeScript
let name: string = "John";
let age: number = 25;
let isActive: boolean = true;
let score: number | null = null;
```

```java
// Java
String name = "John";
int age = 25;
boolean isActive = true;
Integer score = null;  // 包装类才能为null

// 注意：Java是强类型
var message = "Hello";  // 类型推断（Java 10+）
```

**Java基本数据类型**：

| 类型 | 大小 | 默认值 | TS对应 |
|------|------|--------|--------|
| byte | 1字节 | 0 | number |
| short | 2字节 | 0 | number |
| int | 4字节 | 0 | number |
| long | 8字节 | 0L | number |
| float | 4字节 | 0.0f | number |
| double | 8字节 | 0.0 | number |
| char | 2字节 | '\u0000' | string(单字符) |
| boolean | 1位 | false | boolean |

**重要区别**：
```java
// Java中基本类型 vs 包装类
int a = 10;           // 基本类型，不能为null
Integer b = 10;       // 包装类，可以为null
Integer c = null;     // 合法
// int d = null;      // 编译错误！
```

### 3.2 运算符与流程控制（2h）

**与JavaScript基本相同**，略过详细语法。重点讲差异：

```java
// switch语法增强（Java 12+）
int day = 3;
String dayName = switch (day) {
    case 1 -> "Monday";
    case 2 -> "Tuesday";
    case 3 -> "Wednesday";
    default -> "Unknown";
};
// 类似JavaScript的 switch + 返回值
```

### 3.3 方法（函数）定义

**对比**：
```typescript
// TypeScript
function add(a: number, b: number): number {
    return a + b;
}

const multiply = (a: number, b: number): number => a * b;
```

```java
// Java
public static int add(int a, int b) {
    return a + b;
}

// Java没有箭头函数的简写语法
// 但可以用Lambda表达式（后面讲）
```

**练习任务**：
- 实现一个控制台计算器（加减乘除）
- 用Scanner读取用户输入

```java
import java.util.Scanner;

public class Calculator {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.print("输入第一个数字: ");
        double num1 = scanner.nextDouble();
        
        System.out.print("输入运算符 (+ - * /): ");
        char operator = scanner.next().charAt(0);
        
        System.out.print("输入第二个数字: ");
        double num2 = scanner.nextDouble();
        
        double result = calculate(num1, num2, operator);
        System.out.println("结果: " + result);
    }
    
    public static double calculate(double a, double b, char op) {
        return switch (op) {
            case '+' -> a + b;
            case '-' -> a - b;
            case '*' -> a * b;
            case '/' -> a / b;
            default -> throw new IllegalArgumentException("无效运算符");
        };
    }
}
```

---

## 四、Day 4-5：数组与集合框架（4小时）

### 4.1 数组（0.5h，快速带过）
```java
// 与JS数组类似但不完全相同
int[] numbers = new int[5];        // 定长
int[] values = {1, 2, 3, 4, 5};    // 初始化

// 遍历 - 类似 for...of
for (int num : values) {
    System.out.println(num);
}
```

### 4.2 集合框架 - 重点！

**与JavaScript对比**：
```javascript
// JavaScript 数组/Map/Set
const list = [1, 2, 3];
const map = new Map();
const set = new Set();
```

```java
// Java 集合
ArrayList<Integer> list = new ArrayList<>();  // = JS Array
HashMap<String, Integer> map = new HashMap<>(); // = JS Map
HashSet<String> set = new HashSet<>();          // = JS Set
```

**List 常用操作对照**：

| JavaScript | Java |
|------------|------|
| `arr.push(item)` | `list.add(item)` |
| `arr.pop()` | `list.remove(list.size()-1)` |
| `arr.length` | `list.size()` |
| `arr[index]` | `list.get(index)` |
| `arr.includes(item)` | `list.contains(item)` |
| `arr.find(x => x.id === 1)` | `list.stream().filter(x -> x.getId() == 1).findFirst()` |

**核心概念：泛型（Generic）**
```java
// 泛型 = TypeScript的泛型
ArrayList<String> names = new ArrayList<>();  // <String>表示只能存字符串
// names.add(123);  // 编译错误！

// 对比TypeScript
// const names: Array<string> = [];
```

### 4.3 练习：待办清单（核心任务）

**需求**：
- 添加待办事项
- 查看所有事项
- 标记完成
- 删除事项

**代码框架**（自己动手补全）：

```java
import java.util.ArrayList;
import java.util.Scanner;

class TodoItem {
    private int id;
    private String title;
    private boolean completed;
    
    // TODO: 构造方法
    // TODO: getter/setter方法（IDEA可自动生成：Alt+Insert）
}

public class TodoApp {
    private static ArrayList<TodoItem> todos = new ArrayList<>();
    private static int nextId = 1;
    private static Scanner scanner = new Scanner(System.in);
    
    public static void main(String[] args) {
        while (true) {
            showMenu();
            int choice = scanner.nextInt();
            scanner.nextLine();  // 消费换行符
            
            switch (choice) {
                case 1 -> addTodo();
                case 2 -> listTodos();
                case 3 -> completeTodo();
                case 4 -> deleteTodo();
                case 0 -> {
                    System.out.println("再见！");
                    return;
                }
                default -> System.out.println("无效选择");
            }
        }
    }
    
    private static void showMenu() {
        System.out.println("\n=== 待办清单 ===");
        System.out.println("1. 添加待办");
        System.out.println("2. 查看列表");
        System.out.println("3. 标记完成");
        System.out.println("4. 删除待办");
        System.out.println("0. 退出");
        System.out.print("请选择: ");
    }
    
    private static void addTodo() {
        // TODO: 实现添加逻辑
    }
    
    private static void listTodos() {
        // TODO: 实现列表展示
    }
    
    private static void completeTodo() {
        // TODO: 实现标记完成
    }
    
    private static void deleteTodo() {
        // TODO: 实现删除逻辑
    }
}
```

**提示**：
- 用 `Alt+Insert`（Windows）或 `Cmd+N`（Mac）在IDEA中自动生成getter/setter
- 用 `for-each` 循环遍历列表
- 用 `list.removeIf(item -> item.getId() == id)` 删除指定项

---

## 五、周六：完整实现待办清单（4小时）

**目标**：完成上述代码框架的所有TODO

**进阶要求**（可选）：
- 添加优先级字段（高/中/低）
- 按优先级排序显示
- 筛选已完成/未完成

**学习重点**：
1. **getter/setter**：理解JavaBean规范（Spring会大量使用）
2. **toString()**：自定义对象输出格式
3. **private/public**：理解访问修饰符

---

## 六、周日：HashMap练习 + 复习（4小时）

### 6.1 HashMap基础

**与JavaScript对照**：
```javascript
// JS Map
const map = new Map();
map.set('apple', 5);
map.set('banana', 3);
console.log(map.get('apple'));  // 5
console.log(map.has('orange')); // false
```

```java
// Java HashMap
HashMap<String, Integer> map = new HashMap<>();
map.put("apple", 5);
map.put("banana", 3);
System.out.println(map.get("apple"));     // 5
System.out.println(map.containsKey("orange"));  // false

// 遍历 - 类似 Object.entries()
for (Map.Entry<String, Integer> entry : map.entrySet()) {
    System.out.println(entry.getKey() + ": " + entry.getValue());
}
```

### 6.2 练习：字符频率统计

```java
public class CharCounter {
    public static void main(String[] args) {
        String text = "hello world hello java";
        
        HashMap<Character, Integer> freq = new HashMap<>();
        
        // TODO: 统计每个字符出现次数
        // TODO: 找出出现最多的字符
        // TODO: 按频率排序输出
    }
}
```

### 6.3 复习清单

- [ ] 能独立创建Java项目并运行
- [ ] 理解8种基本数据类型与包装类区别
- [ ] 熟练使用ArrayList的增删改查
- [ ] 理解HashMap的基本用法
- [ ] 完成待办清单控制台程序
- [ ] 完成字符统计程序

---

## 七、本周学习资源推荐

### 视频（选看）
| 资源 | 时长 | 说明 |
|------|------|------|
| 尚硅谷Java基础-P1~P20 | ~3h | 环境到基础语法 |
| 尚硅谷Java基础-P21~P40 | ~3h | 集合框架重点 |

### 文档速查
- [廖雪峰Java教程-基础](https://www.liaoxuefeng.com/wiki/1252599548343744/1255883729079552)

### 练习平台
- [LeetCode Java简单题](https://leetcode.cn/problemset/all/) - 选标签"数组"、"哈希表"

---

## 八、常见问题FAQ

**Q1: Java版本选哪个？**  
A: 选JDK 17（LTS长期支持版），JDK 8/11也可以但17有更多语法糖。

**Q2: 为什么要有基本类型和包装类之分？**  
A: 基本类型效率高，包装类支持null和集合存储。Java后面引入了自动装箱拆箱，大部分时候可以混用。

**Q3: 为什么要写那么多getter/setter？**  
A: 这是JavaBean规范，Spring框架依赖这个约定。IDEA可以自动生成，实际开发不费事。

**Q4: Java能和Node.js一样写异步代码吗？**  
A: 可以，但方式不同。Java 8有CompletableFuture，但Spring Boot里更多是同步代码+线程池。这个后面深入学习时讲。

---

## 九、下一步预告

**Week 2 将学习**：
- 面向对象三大特性（封装/继承/多态）
- 抽象类与接口
- Stream API（类似Lodash的链式操作）
- 异常处理

**本周重点是**：适应Java语法，建立"写Java代码的感觉"，不要太纠结细节。

---

*完成本周学习后，你应该能自信地说："我会写Java基础代码了！"*
