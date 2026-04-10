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
