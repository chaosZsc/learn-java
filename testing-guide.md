# 测试专题：从单元测试到集成测试

> **适用阶段**：贯穿Week 3-16，重点在Week 3、Week 5、Week 16  
> **目标**：掌握分层测试策略，能写出可维护的测试代码

---

## 一、测试金字塔

```
        /
       /  E2E测试（少而精）
      /   - 模拟用户操作
     /    - 慢、成本高
    /_____________________
   /   集成测试（适中）
  /    - 数据库/外部服务交互
 /     - 验证组件协作
/_______________________
   单元测试（多而快）
   - 单个方法/类
   - 快、成本低
```

**原则**：单元测试为主，集成测试为辅，E2E点睛

---

## 二、单元测试（JUnit 5 + Mockito）

### 2.1 基础结构

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    
    @Mock
    private UserRepository userRepository;
    
    @InjectMocks
    private UserService userService;
    
    @Test
    @DisplayName("根据ID查询用户-成功")
    void findById_Success() {
        // Given
        Long userId = 1L;
        User mockUser = User.builder()
                .id(userId)
                .username("zhangsan")
                .email("zhang@example.com")
                .build();
        
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        
        // When
        User result = userService.findById(userId);
        
        // Then
        assertThat(result).isNotNull();
        assertThat(result.getUsername()).isEqualTo("zhangsan");
        verify(userRepository).findById(userId);
    }
    
    @Test
    @DisplayName("根据ID查询用户-不存在")
    void findById_NotFound() {
        // Given
        Long userId = 999L;
        when(userRepository.findById(userId)).thenReturn(Optional.empty());
        
        // When & Then
        assertThrows(UserNotFoundException.class, () -> {
            userService.findById(userId);
        });
    }
}
```

### 2.2 常用Mockito方法

```java
// 基本存根
when(mock.method()).thenReturn(value);
when(mock.method()).thenThrow(exception);
when(mock.method(any())).thenAnswer(invocation -> {
    String arg = invocation.getArgument(0);
    return arg + "_processed";
});

// 多次调用不同返回
when(mock.method())
    .thenReturn(firstValue)
    .thenReturn(secondValue);

// 验证调用
verify(mock).method();                    // 调用1次
verify(mock, times(2)).method();          // 调用2次
verify(mock, never()).method();           // 从未调用
verify(mock, atLeastOnce()).method();     // 至少1次
verifyNoInteractions(mock);               // 无交互

// 参数匹配
verify(mock).method(anyString());
verify(mock).method(eq("exact"));
verify(mock).method(argThat(s -> s.length() > 5));
```

### 2.3 参数化测试

```java
@ParameterizedTest
@CsvSource({
    "zhangsan, true",   // 用户名，预期结果
    "zhang, true",
    "zh, false",        // 太短
    "zhangsan12345678901234567890, false"  // 太长
})
@DisplayName("验证用户名长度")
void validateUsername(String username, boolean expected) {
    boolean result = userValidator.isValid(username);
    assertThat(result).isEqualTo(expected);
}
```

### 2.4 测试私有方法？

**原则**：不测私有方法，通过公有方法间接测

```java
// 如果必须测，用反射（不推荐）
@Test
void testPrivateMethod() throws Exception {
    Method method = UserService.class.getDeclaredMethod("privateMethod", String.class);
    method.setAccessible(true);
    Object result = method.invoke(userService, "arg");
    assertThat(result).isEqualTo("expected");
}
```

---

## 三、集成测试

### 3.1 @SpringBootTest

```java
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class UserIntegrationTest {
    
    @Container
    static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("test_db")
            .withUsername("test")
            .withPassword("test");
    
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", mysql::getJdbcUrl);
        registry.add("spring.datasource.username", mysql::getUsername);
        registry.add("spring.datasource.password", mysql::getPassword);
    }
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private UserRepository userRepository;
    
    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }
    
    @Test
    @DisplayName("创建用户-完整流程")
    void createUser_FullFlow() throws Exception {
        // Given
        CreateUserRequest request = new CreateUserRequest();
        request.setUsername("zhangsan");
        request.setEmail("zhang@example.com");
        
        // When & Then
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(201))
                .andExpect(jsonPath("$.data.username").value("zhangsan"));
        
        // 验证数据库
        assertThat(userRepository.findByUsername("zhangsan")).isPresent();
    }
}
```

### 3.2 切片测试（@WebMvcTest / @DataJpaTest）

```java
// 只测试Controller层
@WebMvcTest(UserController.class)
class UserControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private UserService userService;
    
    @Test
    void getUser() throws Exception {
        when(userService.findById(1L)).thenReturn(mockUser);
        
        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username").value("zhangsan"));
    }
}

// 只测试Repository层
@DataJpaTest
class UserRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private UserRepository userRepository;
    
    @Test
    void findByUsername() {
        // Given
        User user = User.builder()
                .username("test")
                .email("test@example.com")
                .build();
        entityManager.persist(user);
        entityManager.flush();
        
        // When
        Optional<User> found = userRepository.findByUsername("test");
        
        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getEmail()).isEqualTo("test@example.com");
    }
}
```

---

## 四、测试数据管理

### 4.1 @Sql注解

```java
@Test
@Sql({"/schema.sql", "/data.sql"})  // 执行SQL脚本
void testWithData() {
    // 测试使用data.sql中的数据
}

@Test
@Sql(scripts = "/cleanup.sql", executionPhase = Sql.ExecutionPhase.AFTER_TEST_METHOD)
void testWithCleanup() {
    // 测试后清理数据
}
```

### 4.2 Test Fixtures（推荐）

```java
public class UserFixtures {
    
    public static User aUser() {
        return User.builder()
                .id(1L)
                .username("zhangsan")
                .email("zhang@example.com")
                .build();
    }
    
    public static User aUserWithName(String name) {
        return User.builder()
                .id(1L)
                .username(name)
                .email(name + "@example.com")
                .build();
    }
    
    public static List<User> manyUsers(int count) {
        return IntStream.range(0, count)
                .mapToObj(i -> User.builder()
                        .id((long) i)
                        .username("user" + i)
                        .build())
                .collect(Collectors.toList());
    }
}

// 使用
@Test
void test() {
    User user = UserFixtures.aUser();
    List<User> users = UserFixtures.manyUsers(10);
}
```

---

## 五、测试覆盖率

### 5.1 JaCoCo配置

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

```bash
mvn clean test
# 查看 target/site/jacoco/index.html
```

### 5.2 合理的覆盖目标

| 层级 | 目标覆盖率 | 说明 |
|------|-----------|------|
| 单元测试 | 70-80% | 核心业务逻辑必须覆盖 |
| 集成测试 | 40-50% | 主流程覆盖 |
| 整体 | 60-70% | 合理的平衡 |

**注意**：覆盖率只是指标，测试质量更重要。

---

## 六、测试最佳实践

### 6.1 FIRST原则

- **F**ast：测试要快（毫秒级）
- **I**ndependent：测试相互独立
- **R**epeatable：可重复执行
- **S**elf-validating：自动验证（布尔结果）
- **T**imely：及时编写（TDD）

### 6.2 命名规范

```java
// 方法名描述行为
void shouldDecreaseBalanceWhenWithdraw() { }

// 或 Given-When-Then 风格
void givenEnoughBalance_whenWithdraw_thenBalanceDecreased() { }
```

### 6.3 禁用测试

```java
@Disabled("暂跳过，等待需求确认")  // 整个类或方法
void test() { }

@DisabledOnOs(OS.WINDOWS)  // 特定系统禁用
@DisabledIfSystemProperty(named = "env", matches = "ci")
```

### 6.4 常用断言

```java
import static org.assertj.core.api.Assertions.*;

// 基本断言
assertThat(actual).isEqualTo(expected);
assertThat(actual).isNotNull();
assertThat(actual).isTrue();

// 集合断言
assertThat(list).hasSize(3);
assertThat(list).containsExactly("a", "b", "c");
assertThat(list).containsOnlyOnce("a");

// 异常断言
assertThatThrownBy(() -> { throw new RuntimeException("boom!"); })
        .isInstanceOf(RuntimeException.class)
        .hasMessageContaining("boom");

// 异步断言
assertThat(future).succeedsWithin(Duration.ofSeconds(1));
```

---

## 七、测试驱动开发（TDD）

### 7.1 TDD循环

```
Red    → 写一个失败的测试
Green  → 写最少代码让测试通过
Refactor → 重构，保持测试通过
        ↓
      重复
```

### 7.2 TDD示例

```java
// Step 1: 写失败的测试
@Test
void shouldCalculateTotalPrice() {
    ShoppingCart cart = new ShoppingCart();
    cart.add(new Item("Book", 100));
    cart.add(new Item("Pen", 20));
    
    assertThat(cart.getTotal()).isEqualTo(120);
}

// Step 2: 最简单的实现
class ShoppingCart {
    private List<Item> items = new ArrayList<>();
    
    void add(Item item) {
        items.add(item);
    }
    
    int getTotal() {
        return items.stream().mapToInt(Item::getPrice).sum();
    }
}

// Step 3: 重构和更多测试...
```

---

## 八、项目中测试策略

### 8.1 测试目录结构

```
src/
├── main/
│   └── java/
└── test/
    ├── java/
    │   ├── unit/              # 单元测试
    │   │   └── service/
    │   ├── integration/       # 集成测试
    │   │   └── repository/
    │   └── e2e/               # E2E测试
    └── resources/
        ├── application-test.yml
        ├── schema.sql
        └── data.sql
```

### 8.2 CI/CD中的测试

```yaml
# GitHub Actions
- name: Run Tests
  run: mvn clean test

- name: Generate Coverage Report
  run: mvn jacoco:report

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

---

## 九、Week 3、5、16的测试重点

| 阶段 | 重点 | 产出 |
|------|------|------|
| **Week 3** | JUnit基础、Mockito入门 | 会写单元测试 |
| **Week 5** | Repository集成测试、@DataJpaTest | 会测试数据库层 |
| **Week 16** | 完整的测试金字塔、测试覆盖率 | 项目有60%+测试覆盖 |

---

## 十、检查清单

写测试时检查：

- [ ] 测试名称描述行为
- [ ] 一个测试只验证一个概念
- [ ] 使用Given-When-Then结构
- [ ] 测试之间相互独立
- [ ] 使用AssertJ流式断言
- [ ] Mock外部依赖
- [ ] 清理测试数据
- [ ] 测试运行速度快

---

**配合各周学习，边学边写测试，养成好习惯！**
