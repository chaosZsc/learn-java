# Week 8 详细学习计划：部署与DevOps - 项目上线

> **目标**：掌握容器化部署，能将Spring Boot应用部署到云服务器  
> **投入时间**：15-20小时（周中10h + 周末10h）  
> **预期产出**：线上可访问的完整应用 + 自动化部署流程

---

## 一、时间分配总览

| 时间段 | 内容 | 时长 |
|--------|------|------|
| **Day 1 (周一)** | Docker基础 + Dockerfile编写 | 2h |
| **Day 2 (周二)** | Docker Compose多容器编排 | 2h |
| **Day 3 (周三)** | 云服务器准备 + 环境配置 | 2h |
| **Day 4 (周四)** | Nginx反向代理 + SSL证书 | 2h |
| **Day 5 (周五)** | CI/CD基础 + 自动化部署 | 2h |
| **周六** | 完整部署实践：应用上线 | 4h |
| **周日** | 监控 + 故障排查 + 总结 | 4h |

---

## 二、核心概念：与前端部署对比

`★ Insight ─────────────────────────────────────`
**Java后端部署比前端复杂，但Docker让一切标准化**

前端部署：构建 → 静态文件 → CDN/服务器
后端部署：构建 → JAR包 → Java运行 → 数据库 → Nginx反向代理

Docker将整个运行环境打包，解决了"在我机器上能跑"的问题。
─────────────────────────────────────────────────

### 部署方式演进

| 阶段 | 方式 | 特点 |
|------|------|------|
| 1.0 | 手动部署 | 直接服务器装JDK，上传JAR，java -jar |
| 2.0 | 脚本部署 | Shell脚本半自动化 |
| 3.0 | **Docker** | 容器化，环境隔离（推荐）|
| 4.0 | **K8s** | 容器编排，大厂使用（进阶）|

---

## 三、Day 1：Docker容器化（2小时）

### 3.1 Docker基础命令

```bash
# 镜像操作
docker pull openjdk:17-jdk-alpine      # 拉取镜像
docker images                           # 查看镜像
docker rmi <image-id>                   # 删除镜像

# 容器操作
docker run -d -p 8080:8080 --name myapp myimage   # 运行容器
docker ps                               # 查看运行中的容器
docker ps -a                            # 查看所有容器
docker stop myapp                       # 停止容器
docker start myapp                      # 启动容器
docker rm myapp                         # 删除容器
docker logs myapp                       # 查看日志
docker exec -it myapp /bin/sh          # 进入容器
```

### 3.2 Dockerfile编写

在项目根目录创建`Dockerfile`：

```dockerfile
# 使用官方OpenJDK基础镜像
FROM openjdk:17-jdk-alpine

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建应用目录
WORKDIR /app

# 复制JAR包（假设已通过mvn package生成）
COPY target/myapp-1.0-SNAPSHOT.jar app.jar

# 暴露端口
EXPOSE 8080

# 健康检查（可选）
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# 启动命令
ENTRYPOINT ["java", "-jar", "app.jar"]

# JVM优化参数版本
# ENTRYPOINT ["java", "-Xms512m", "-Xmx1024m", "-jar", "app.jar"]
```

**多阶段构建（推荐，减少镜像体积）**：

```dockerfile
# 阶段1：构建
FROM maven:3.9-eclipse-temurin-17-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# 阶段2：运行
FROM openjdk:17-jdk-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 3.3 构建和运行

```bash
# 1. 编译项目
mvn clean package -DskipTests

# 2. 构建Docker镜像
docker build -t myapp:1.0 .

# 3. 查看镜像
docker images | grep myapp

# 4. 运行容器
docker run -d \
  --name myapp \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_PASSWORD=secret123 \
  myapp:1.0

# 5. 测试
curl http://localhost:8080/actuator/health

# 6. 查看日志
docker logs -f myapp
```

### 3.4 Maven Docker插件（可选）

```xml
<plugin>
    <groupId>com.spotify</groupId>
    <artifactId>dockerfile-maven-plugin</artifactId>
    <version>1.4.13</version>
    <configuration>
        <repository>${project.artifactId}</repository>
        <tag>${project.version}</tag>
        <buildArgs>
            <JAR_FILE>target/${project.build.finalName}.jar</JAR_FILE>
        </buildArgs>
    </configuration>
</plugin>

<!-- 使用：mvn clean package dockerfile:build -->
```

---

## 四、Day 2：Docker Compose编排（2小时）

### 4.1 为什么需要Compose

一个完整应用需要多个服务：
- 后端API（Spring Boot）
- 数据库（MySQL）
- 缓存（Redis）
- 反向代理（Nginx）

Compose用一个文件定义和运行多容器应用。

### 4.2 docker-compose.yml编写

```yaml
version: '3.8'

services:
  # 后端服务
  app:
    build: .
    container_name: blog-app
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/blog_db?useSSL=false
      - SPRING_DATASOURCE_USERNAME=root
      - SPRING_DATASOURCE_PASSWORD=root123
      - SPRING_DATA_REDIS_HOST=redis
    depends_on:
      - mysql
      - redis
    networks:
      - blog-network
    restart: unless-stopped

  # MySQL数据库
  mysql:
    image: mysql:8.0
    container_name: blog-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root123
      MYSQL_DATABASE: blog_db
      MYSQL_CHARSET: utf8mb4
      MYSQL_COLLATION: utf8mb4_unicode_ci
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - blog-network
    restart: unless-stopped
    command: --default-authentication-plugin=mysql_native_password

  # Redis缓存
  redis:
    image: redis:7-alpine
    container_name: blog-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - blog-network
    restart: unless-stopped

  # Nginx反向代理
  nginx:
    image: nginx:alpine
    container_name: blog-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/html:/usr/share/nginx/html
      - ./cert:/etc/nginx/cert  # SSL证书
    depends_on:
      - app
    networks:
      - blog-network
    restart: unless-stopped

volumes:
  mysql-data:
  redis-data:

networks:
  blog-network:
    driver: bridge
```

### 4.3 Docker Compose命令

```bash
# 启动所有服务（后台运行）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app

# 停止服务
docker-compose stop

# 停止并删除容器
docker-compose down

# 停止并删除容器和数据卷（⚠️ 小心）
docker-compose down -v

# 重新构建并启动
docker-compose up -d --build

# 进入容器
docker-compose exec mysql mysql -uroot -p
```

---

## 五、Day 3：云服务器部署（2小时）

### 5.1 服务器选择

| 厂商 | 学生机 | 入门配置 | 价格（月）|
|------|--------|----------|-----------|
| 阿里云 | 轻量应用服务器 | 2核2G | ~10元 |
| 腾讯云 | 轻量应用服务器 | 2核2G | ~10元 |
| AWS | EC2 t2.micro | 1核1G | 免费（12个月）|
| 华为云 | 云耀云服务器 | 2核2G | ~10元 |

**推荐配置**：2核2G，CentOS 7/8 或 Ubuntu 20/22

### 5.2 服务器环境配置

```bash
# 1. 连接服务器
ssh root@your-server-ip

# 2. 更新系统（Ubuntu）
apt update && apt upgrade -y

# 或 CentOS
yum update -y

# 3. 安装Docker
curl -fsSL https://get.docker.com | sh

# 启动Docker
systemctl start docker
systemctl enable docker

# 安装Docker Compose
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins
curl -SL https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-linux-x86_64 \
  -o $DOCKER_CONFIG/cli-plugins/docker-compose
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

# 验证安装
docker --version
docker compose version

# 4. 安装其他工具
apt install -y git vim wget
```

### 5.3 部署应用

```bash
# 1. 创建项目目录
mkdir -p /opt/blog && cd /opt/blog

# 2. 上传代码（方式1：Git克隆）
git clone https://github.com/yourname/blog.git .

# 或方式2：本地打包上传
# scp target/*.jar root@server-ip:/opt/blog/
# scp Dockerfile root@server-ip:/opt/blog/
# scp docker-compose.yml root@server-ip:/opt/blog/

# 3. 构建并启动
docker compose up -d --build

# 4. 查看状态
docker compose ps
docker compose logs -f
```

### 5.4 防火墙配置

```bash
# 开放端口（Ubuntu UFW）
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 8080/tcp  # 可选：直接暴露后端
ufw enable

# 或 CentOS Firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

---

## 六、Day 4：Nginx反向代理（2小时）

### 6.1 为什么需要Nginx

1. **反向代理**：隐藏后端服务，统一入口
2. **负载均衡**：多台后端服务器分发请求
3. **静态资源**：直接处理静态文件，减轻后端压力
4. **SSL终端**：统一处理HTTPS

### 6.2 Nginx配置文件

```nginx
# nginx/nginx.conf
user nginx;
worker_processes auto;

error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    sendfile on;
    keepalive_timeout 65;

    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # 后端API代理
    upstream backend {
        server app:8080;
        # 多台后端时可添加：server app2:8080;
    }

    server {
        listen 80;
        server_name your-domain.com;

        # 前端静态资源（Vue/React打包文件）
        location / {
            root /usr/share/nginx/html;
            index index.html;
            try_files $uri $uri/ /index.html;  # SPA支持
        }

        # API代理
        location /api/ {
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # 超时设置
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # 静态文件缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            root /usr/share/nginx/html;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### 6.3 HTTPS + SSL证书（Let's Encrypt免费证书）

```bash
# 1. 安装Certbot
apt install -y certbot python3-certbot-nginx

# 2. 申请证书
certbot --nginx -d your-domain.com

# 3. 自动续期测试
certbot renew --dry-run
```

**Nginx HTTPS配置**：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers on;
    
    # 其他配置...
    location / {
        # ...
    }
}

# HTTP自动跳转HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 七、Day 5：CI/CD基础（2小时）

### 7.1 GitHub Actions自动化部署

在项目根目录创建`.github/workflows/deploy.yml`：

```yaml
name: Deploy to Server

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    # 1. 检出代码
    - uses: actions/checkout@v3
    
    # 2. 设置JDK
    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'
    
    # 3. 编译打包
    - name: Build with Maven
      run: mvn clean package -DskipTests
    
    # 4. 部署到服务器
    - name: Deploy to Server
      uses: appleboy/scp-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        password: ${{ secrets.SERVER_PASSWORD }}
        source: "target/*.jar,Dockerfile,docker-compose.yml,nginx/"
        target: "/opt/blog"
    
    # 5. 远程执行重启
    - name: Restart Services
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        password: ${{ secrets.SERVER_PASSWORD }}
        script: |
          cd /opt/blog
          docker compose down
          docker compose up -d --build
          docker system prune -f
```

**设置Secrets**：
在GitHub仓库 → Settings → Secrets and variables → Actions 中添加：
- `SERVER_HOST`: 服务器IP
- `SERVER_USER`: root
- `SERVER_PASSWORD`: 服务器密码

### 7.2 Jenkins（企业常用）

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    tools {
        maven 'Maven-3.9'
        jdk 'JDK-17'
    }
    
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean package -DskipTests'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                sh 'docker build -t blog:${BUILD_NUMBER} .'
            }
        }
        
        stage('Deploy') {
            steps {
                sh '''
                    docker stop blog || true
                    docker rm blog || true
                    docker run -d -p 8080:8080 --name blog blog:${BUILD_NUMBER}
                '''
            }
        }
    }
}
```

---

## 八、周六：完整部署实践（4小时）

### 实战任务清单

1. **准备**（30分钟）
   - [ ] 购买/准备云服务器
   - [ ] 域名解析到服务器（可选）
   - [ ] 准备项目代码

2. **服务器配置**（1小时）
   ```bash
   # 安装Docker和Compose
   curl -fsSL https://get.docker.com | sh
   # 配置防火墙
   # 创建项目目录
   ```

3. **项目容器化**（1小时）
   - [ ] 编写Dockerfile
   - [ ] 编写docker-compose.yml
   - [ ] 本地测试：`docker compose up`

4. **部署上线**（1小时）
   - [ ] 上传代码到服务器
   - [ ] 启动服务：`docker compose up -d`
   - [ ] 配置Nginx反向代理
   - [ ] 测试访问

5. **配置HTTPS**（30分钟）
   - [ ] 申请Let's Encrypt证书
   - [ ] 配置Nginx SSL
   - [ ] 测试HTTPS访问

### 验证清单

- [ ] 访问`http://your-server-ip`看到应用
- [ ] 访问`https://your-domain.com`（如配置了域名和SSL）
- [ ] API接口正常响应
- [ ] 数据库数据持久化（重启容器数据不丢）
- [ ] 日志正常输出

---

## 九、周日：监控与运维（4小时）

### 9.1 日志收集

```yaml
# docker-compose.yml 添加日志配置
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    # 或使用日志中心
    # logging:
    #   driver: syslog
    #   options:
    #     syslog-address: "tcp://logs.papertrailapp.com:12345"
```

### 9.2 健康检查端点

```java
@Component
public class HealthIndicatorImpl implements HealthIndicator {
    
    @Autowired
    private DataSource dataSource;
    
    @Override
    public Health health() {
        try (Connection conn = dataSource.getConnection()) {
            if (conn.isValid(1)) {
                return Health.up()
                        .withDetail("database", "MySQL is reachable")
                        .build();
            }
        } catch (Exception e) {
            return Health.down()
                    .withDetail("database", "MySQL is unreachable")
                    .withException(e)
                    .build();
        }
        return Health.down().build();
    }
}
```

### 9.3 常用运维命令

```bash
# 查看资源占用
docker stats

# 查看日志
docker logs -f --tail 100 app

# 进入容器排查
docker exec -it app /bin/sh

# 备份数据库
docker exec mysql mysqldump -uroot -p blog_db > backup.sql

# 恢复数据库
docker exec -i mysql mysql -uroot -p blog_db < backup.sql

# 查看网络
docker network ls
docker network inspect blog-network
```

### 9.4 故障排查指南

| 问题 | 排查步骤 |
|------|----------|
| 服务启动失败 | `docker logs 容器名`查看错误 |
| 数据库连不上 | 检查网络、用户名密码、数据库是否存在 |
| 端口无法访问 | 检查防火墙、安全组、端口映射 |
| 502错误 | 检查后端是否启动、Nginx配置是否正确 |
| SSL证书问题 | 检查证书路径、域名匹配、证书过期 |

---

## 十、学习资源

### 视频
- [尚硅谷Docker教程](https://www.bilibili.com/video/BV1gr4y1U7CY)
- [狂神说Docker](https://www.bilibili.com/video/BV1og4y1q7M4)
- [Nginx入门到精通](https://www.bilibili.com/video/BV1yS4y1N7un)

### 文档
- [Docker官方文档](https://docs.docker.com/)
- [Docker Compose文档](https://docs.docker.com/compose/)
- [Nginx官方文档](https://nginx.org/en/docs/)

---

## Week 8 里程碑

完成本周后，你应该能够：

- [ ] 编写Dockerfile打包应用
- [ ] 使用Docker Compose编排多服务
- [ ] 在云服务器部署应用
- [ ] 配置Nginx反向代理
- [ ] 申请并配置SSL证书（HTTPS）
- [ ] 配置GitHub Actions自动部署
- [ ] 基础故障排查

---

## 学习计划总结

**8周完成，你已经掌握**：

| 阶段 | 技能 |
|------|------|
| Week 1-2 | Java语言基础、OOP编程 |
| Week 3 | Maven工程化 |
| Week 4 | Spring Boot REST API开发 |
| Week 5 | JPA数据库操作 |
| Week 6 | Spring Security + JWT认证 |
| Week 7 | Redis缓存 + 异步处理 |
| Week 8 | Docker部署 + 项目上线 |

**你现在可以**：
- 独立开发完整的Java后端项目
- 设计数据库和API
- 实现用户认证和权限控制
- 优化性能（缓存、异步）
- 部署到云服务器

---

`★ Insight ─────────────────────────────────────`
**恭喜完成整个学习计划！**

从Java基础到项目上线，你已经具备了中级Java后端工程师的核心能力。

**后续学习建议**：
1. **深入Spring源码** - 理解自动配置原理
2. **微服务架构** - Spring Cloud、Kubernetes
3. **性能调优** - JVM、GC、数据库优化
4. **消息队列** - RabbitMQ、Kafka
5. **实际项目** - 找一个感兴趣的项目持续迭代

祝你后端开发之路顺利！
─────────────────────────────────────────────────
