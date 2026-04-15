# Java学习进度追踪表

交互式Web页面，用于追踪16周Java后端学习计划。

## 快速开始

### 1. 生成数据

```bash
node tracker/scripts/build-data.js
```

### 2. 打开页面

```bash
# 方式1：直接打开文件
double-click tracker/index.html

# 方式2：使用本地服务器
cd tracker && npx serve
```

## 功能说明

- **阶段导航**: 按学习阶段筛选周计划
- **周卡片**: 显示标题、状态、进度
- **详情面板**: 编辑进度、勾选检查点、记录时长和笔记
- **自动保存**: 进度数据自动保存到浏览器 LocalStorage
- **总体进度**: 顶部显示整体完成百分比

## 数据结构

用户进度存储在浏览器 LocalStorage 中，键名为 `java-learning-progress-v1`。

## 重建数据

如果修改了周计划 markdown 文件，需要重新运行：

```bash
node tracker/scripts/build-data.js
```

然后刷新页面即可看到更新内容。

## 部署到 GitHub Pages

本项目使用 `git subtree` 将 tracker 目录推送到 gh-pages 分支进行部署。

### 首次设置（已完成）

```bash
# 从 main 分支推送 tracker 目录到 gh-pages 分支
git subtree push --prefix=tracker origin gh-pages
```

### 更新部署

当 tracker 目录有更新时，执行以下命令：

```bash
# 方式1：直接使用 subtree 推送
git subtree push --prefix=tracker origin gh-pages

# 方式2：如果 subtree 推送失败，可以先 split 再 push
git subtree split --prefix=tracker --branch gh-pages-temp
git push origin gh-pages-temp:gh-pages
```

### 查看部署状态

```bash
# 查看 gh-pages 分支最新提交
git log origin/gh-pages --oneline -5

# 查看 gh-pages 分支文件列表
git ls-tree --name-only origin/gh-pages
```

### 部署原理

- `main` 分支：完整项目（学习计划 + tracker 源码）
- `gh-pages` 分支：只包含 `tracker/` 目录内容
- GitHub Pages 自动部署 gh-pages 分支到 `https://chaoszsc.github.io/learn-java/`

### 注意事项

- 更新 tracker 后，先提交到 main 分支
- 再执行 `git subtree push` 更新 gh-pages
- 部署可能需要 1-2 分钟生效
