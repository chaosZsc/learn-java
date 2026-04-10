# Java学习进度追踪表实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一个交互式Web页面，用于追踪16周Java后端学习计划的进度，自动解析现有的markdown周计划文件。

**Architecture:** 使用原生HTML/CSS/JS构建单页应用，Node脚本解析markdown生成数据文件，LocalStorage持久化用户进度。

**Tech Stack:** HTML5, CSS3, ES6+, Node.js, marked (markdown解析)

---

## 文件结构概览

```
tacker/
├── index.html              # 入口页面
├── css/
│   └── main.css            # 全局样式
├── js/
│   ├── app.js              # 应用初始化与事件绑定
│   ├── components.js       # UI组件渲染逻辑
│   ├── storage.js          # LocalStorage CRUD操作
│   └── data.js             # 【构建生成】学习数据
├── scripts/
│   └── build-data.js       # Node构建脚本
└── data/
    └── .gitkeep            # 空目录占位
```

---

## Task 1: 创建目录结构

**Files:**
- Create: `tracker/index.html`
- Create: `tracker/css/main.css`
- Create: `tracker/js/app.js`
- Create: `tracker/js/components.js`
- Create: `tracker/js/storage.js`
- Create: `tracker/scripts/build-data.js`
- Create: `tracker/data/.gitkeep`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p tracker/css tracker/js tracker/scripts tracker/data
touch tracker/data/.gitkeep
```

- [ ] **Step 2: 初始化 tracker/index.html 骨架**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Java后端学习追踪</title>
    <link rel="stylesheet" href="css/main.css">
</head>
<body>
    <div id="app">
        <header class="header">
            <h1>Java后端学习追踪</h1>
            <div class="overall-progress">
                <span>总体进度</span>
                <div class="progress-bar">
                    <div class="progress-fill" id="overall-progress-bar"></div>
                </div>
                <span id="overall-progress-text">0%</span>
            </div>
        </header>
        
        <div class="main-container">
            <aside class="sidebar">
                <nav class="phase-nav" id="phase-nav"></nav>
                <div class="quick-stats" id="quick-stats"></div>
            </aside>
            
            <main class="main-area">
                <div class="week-grid" id="week-grid"></div>
            </main>
            
            <aside class="detail-panel" id="detail-panel">
                <p class="placeholder">点击左侧卡片查看详情</p>
            </aside>
        </div>
    </div>

    <script src="js/data.js"></script>
    <script src="js/storage.js"></script>
    <script src="js/components.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add tracker/
git commit -m "chore: initialize tracker directory structure"
```

---

## Task 2: 实现 Markdown 解析脚本

**Files:**
- Create: `tracker/scripts/build-data.js`

**Prerequisites:**
```bash
cd /c/Users/chaos/Documents/codes/learn/learn-java
npm install marked
```

- [ ] **Step 1: 编写构建脚本**

```javascript
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT_DIR = path.resolve(__dirname, '../..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'tracker/js/data.js');

const PHASES = [
    { id: 'phase1', name: 'Java语言基础', weeks: [1, 2, 3, 4] },
    { id: 'phase2', name: 'Spring Boot核心', weeks: [5, 6, 7, 8, 9, 10] },
    { id: 'phase3', name: '进阶与全栈实战', weeks: [11, 12, 13, 14, 15, 16] }
];

function parseWeekFile(weekNum) {
    const filePath = path.join(ROOT_DIR, `week${weekNum}-detailed-plan.md`);
    
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Extract title
    let title = '';
    const titleMatch = content.match(/# Week \d+[\s:：]+(.+)/);
    if (titleMatch) {
        title = titleMatch[1].trim();
    }
    
    // Extract objectives from "目标" or "预期产出" sections
    const objectives = [];
    const objectiveSection = content.match(/##[^#]*(?:目标|预期产出|学习目标)([\s\S]*?)(?=##|$)/i);
    if (objectiveSection) {
        const objLines = objectiveSection[1].split('\n');
        for (const line of objLines) {
            const match = line.match(/^[-*]\s*(.+)$/);
            if (match && match[1].trim()) {
                objectives.push(match[1].trim());
            }
        }
    }
    
    // Extract check items from checkboxes
    const checkItems = [];
    const checkboxRegex = /^[-*]\s*\[([ x])\]\s*(.+)$/gm;
    let match;
    while ((match = checkboxRegex.exec(content)) !== null) {
        checkItems.push({
            id: `w${weekNum}c${checkItems.length + 1}`,
            text: match[2].trim(),
            done: match[1].toLowerCase() === 'x'
        });
    }
    
    // Extract estimated hours from time allocation tables
    let estimatedHours = 0;
    const hourMatch = content.match(/(\d+)\s*小时|投入时间[：:]\s*~?(\d+)/i);
    if (hourMatch) {
        estimatedHours = parseInt(hourMatch[1] || hourMatch[2], 10);
    }
    
    return {
        week: weekNum,
        title: title || `Week ${weekNum}`,
        description: '',
        objectives: objectives.slice(0, 5),
        checkItems: checkItems.slice(0, 10),
        estimatedHours: estimatedHours || 18
    };
}

function generateData() {
    const plan = {
        totalWeeks: 16,
        phases: PHASES.map(phase => ({
            ...phase,
            items: phase.weeks.map(w => parseWeekFile(w)).filter(Boolean)
        }))
    };
    
    const output = `// AUTO-GENERATED by build-data.js
// Do not edit manually

const LEARNING_PLAN = ${JSON.stringify(plan, null, 2)};

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LEARNING_PLAN };
}
`;
    
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, output, 'utf-8');
    
    console.log(`Generated ${OUTPUT_FILE}`);
    console.log(`Total weeks: ${plan.phases.reduce((sum, p) => sum + p.items.length, 0)}`);
}

generateData();
```

- [ ] **Step 2: 运行构建脚本验证**

```bash
node tracker/scripts/build-data.js
```

Expected: 
```
Generated C:\Users\chaos\Documents\codes\learn\learn-java\tracker\js\data.js
Total weeks: 16
```

- [ ] **Step 3: 验证生成的数据文件**

```bash
cat tracker/js/data.js | head -20
```

Expected: 显示包含 `LEARNING_PLAN` 常量的JS代码

- [ ] **Step 4: Commit**

```bash
git add tracker/scripts/build-data.js tracker/js/data.js
git commit -m "feat: add markdown parser script and generated data"
```

---

## Task 3: 实现 LocalStorage 存储模块

**Files:**
- Create: `tracker/js/storage.js`

- [ ] **Step 1: 编写 storage.js**

```javascript
// storage.js - LocalStorage operations for user progress

const STORAGE_KEY = 'java-learning-progress-v1';

const Storage = {
    // Get all progress data
    getAll() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return this.getDefaultData();
            return JSON.parse(data);
        } catch (e) {
            console.error('Failed to load progress:', e);
            return this.getDefaultData();
        }
    },

    // Save all progress data
    saveAll(data) {
        try {
            data.lastUpdated = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Failed to save progress:', e);
            return false;
        }
    },

    // Get default empty data structure
    getDefaultData() {
        return {
            weekProgress: {},
            checkItems: {},
            lastUpdated: null
        };
    },

    // Get week progress
    getWeekProgress(weekNum) {
        const data = this.getAll();
        return data.weekProgress[weekNum] || {
            status: 'pending',  // pending | in-progress | completed
            actualHours: null,
            completedAt: null,
            notes: ''
        };
    },

    // Update week progress
    updateWeekProgress(weekNum, updates) {
        const data = this.getAll();
        data.weekProgress[weekNum] = {
            ...this.getWeekProgress(weekNum),
            ...updates
        };
        return this.saveAll(data);
    },

    // Set check item status
    setCheckItemDone(itemId, done) {
        const data = this.getAll();
        if (done) {
            data.checkItems[itemId] = true;
        } else {
            delete data.checkItems[itemId];
        }
        return this.saveAll(data);
    },

    // Get check item status
    isCheckItemDone(itemId) {
        const data = this.getAll();
        return !!data.checkItems[itemId];
    },

    // Calculate week completion from check items
    getWeekCompletion(weekNum, checkItems) {
        if (!checkItems || checkItems.length === 0) return 0;
        const doneCount = checkItems.filter(item => 
            this.isCheckItemDone(item.id)
        ).length;
        return Math.round((doneCount / checkItems.length) * 100);
    },

    // Clear all progress
    clearAll() {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    },

    // Export data as JSON string
    exportData() {
        return JSON.stringify(this.getAll(), null, 2);
    },

    // Import data from JSON string
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.weekProgress && data.checkItems) {
                return this.saveAll(data);
            }
            return false;
        } catch (e) {
            console.error('Invalid import data:', e);
            return false;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
```

- [ ] **Step 2: Commit**

```bash
git add tracker/js/storage.js
git commit -m "feat: add LocalStorage storage module"
```

---

## Task 4: 实现 CSS 样式

**Files:**
- Create: `tracker/css/main.css`

- [ ] **Step 1: 编写基础样式**

```css
/* main.css - Java Learning Tracker Styles */

/* CSS Variables */
:root {
    --color-phase1: #4CAF50;
    --color-phase2: #2196F3;
    --color-phase3: #FF9800;
    --color-pending: #9E9E9E;
    --color-bg: #f5f5f5;
    --color-card: #ffffff;
    --color-text: #333333;
    --color-text-secondary: #666666;
    --color-border: #e0e0e0;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
    --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
    --shadow-lg: 0 10px 25px rgba(0,0,0,0.1);
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
    --sidebar-width: 200px;
    --detail-width: 320px;
}

/* Reset & Base */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: var(--color-bg);
    color: var(--color-text);
    line-height: 1.6;
}

/* Header */
.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: var(--shadow-md);
    position: sticky;
    top: 0;
    z-index: 100;
}

.header h1 {
    font-size: 1.5rem;
    font-weight: 600;
}

.overall-progress {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.progress-bar {
    width: 200px;
    height: 8px;
    background: rgba(255,255,255,0.3);
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: white;
    border-radius: 4px;
    transition: width 0.3s ease;
}

/* Main Container */
.main-container {
    display: flex;
    min-height: calc(100vh - 72px);
    max-width: 1600px;
    margin: 0 auto;
}

/* Sidebar */
.sidebar {
    width: var(--sidebar-width);
    background: var(--color-card);
    border-right: 1px solid var(--color-border);
    padding: 1.5rem 1rem;
}

.phase-nav h3 {
    font-size: 0.875rem;
    text-transform: uppercase;
    color: var(--color-text-secondary);
    margin-bottom: 1rem;
    letter-spacing: 0.5px;
}

.phase-nav ul {
    list-style: none;
}

.phase-nav li {
    margin-bottom: 0.5rem;
}

.phase-nav button {
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
    transition: all 0.2s;
}

.phase-nav button:hover {
    background: var(--color-bg);
}

.phase-nav button.active {
    background: #667eea;
    color: white;
}

.phase-nav .phase1 { border-left: 3px solid var(--color-phase1); }
.phase-nav .phase2 { border-left: 3px solid var(--color-phase2); }
.phase-nav .phase3 { border-left: 3px solid var(--color-phase3); }

.quick-stats {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);
}

.quick-stats h3 {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin-bottom: 1rem;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    font-size: 0.9rem;
}

.stat-value {
    font-weight: 600;
}

/* Main Area */
.main-area {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
}

.week-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
}

/* Week Card */
.week-card {
    background: var(--color-card);
    border-radius: var(--radius-md);
    padding: 1.25rem;
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid transparent;
    position: relative;
}

.week-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
}

.week-card.selected {
    border-color: #667eea;
    box-shadow: var(--shadow-lg);
}

.week-card.status-pending { border-top: 4px solid var(--color-pending); }
.week-card.status-in-progress { border-top: 4px solid #667eea; }
.week-card.status-completed { border-top: 4px solid #4CAF50; }

.week-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.week-number {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
}

.status-badge {
    font-size: 0.7rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-weight: 500;
}

.status-badge.pending { background: #e0e0e0; color: #666; }
.status-badge.in-progress { background: #e3f2fd; color: #1976d2; }
.status-badge.completed { background: #e8f5e9; color: #388e3c; }

.week-title {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    line-height: 1.4;
}

.week-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--color-text-secondary);
    margin-bottom: 1rem;
}

.week-progress-info {
    margin-top: 0.75rem;
}

.week-progress-bar {
    height: 6px;
    background: #e0e0e0;
    border-radius: 3px;
    overflow: hidden;
}

.week-progress-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
}

.week-progress-text {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    margin-top: 0.5rem;
}

/* Detail Panel */
.detail-panel {
    width: var(--detail-width);
    background: var(--color-card);
    border-left: 1px solid var(--color-border);
    padding: 1.5rem;
    overflow-y: auto;
}

.detail-panel .placeholder {
    color: var(--color-text-secondary);
    text-align: center;
    padding: 2rem 0;
}

.detail-header {
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border);
    margin-bottom: 1.5rem;
}

.detail-week {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    margin-bottom: 0.25rem;
}

.detail-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
}

.status-selector {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}

.status-btn {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    background: white;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
}

.status-btn:hover {
    background: var(--color-bg);
}

.status-btn.active {
    background: #667eea;
    color: white;
    border-color: #667eea;
}

.detail-section {
    margin-bottom: 1.5rem;
}

.detail-section h4 {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin-bottom: 0.75rem;
    text-transform: uppercase;
}

.checklist {
    list-style: none;
}

.checklist li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.5rem 0;
    cursor: pointer;
}

.checklist input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin-top: 2px;
    cursor: pointer;
}

.checklist label {
    flex: 1;
    font-size: 0.9rem;
    cursor: pointer;
}

.hours-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 1rem;
}

.notes-textarea {
    width: 100%;
    min-height: 100px;
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
    resize: vertical;
    font-family: inherit;
}

/* Responsive */
@media (max-width: 1200px) {
    .detail-panel {
        display: none;
    }
    
    .week-card.selected + .detail-panel,
    .detail-panel.active {
        display: block;
        position: fixed;
        right: 0;
        top: 72px;
        bottom: 0;
        z-index: 50;
        box-shadow: var(--shadow-lg);
    }
}

@media (max-width: 768px) {
    .sidebar {
        display: none;
    }
    
    .header {
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
    }
    
    .overall-progress {
        width: 100%;
    }
    
    .progress-bar {
        flex: 1;
    }
    
    .week-grid {
        grid-template-columns: 1fr;
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add tracker/css/main.css
git commit -m "feat: add tracker styles"
```

---

## Task 5: 实现 Components 渲染模块

**Files:**
- Create: `tracker/js/components.js`

- [ ] **Step 1: 编写 components.js**

```javascript
// components.js - UI component rendering

const Components = {
    // Get color for phase
    getPhaseColor(phaseId) {
        const colors = {
            'phase1': '#4CAF50',
            'phase2': '#2196F3', 
            'phase3': '#FF9800'
        };
        return colors[phaseId] || '#9E9E9E';
    },

    // Render phase navigation
    renderPhaseNav(container, phases, activePhase, onSelect) {
        const html = `
            <h3>学习阶段</h3>
            <ul>
                <li>
                    <button class="${!activePhase ? 'active' : ''}" data-phase="">
                        全部 (${LEARNING_PLAN.totalWeeks}周)
                    </button>
                </li>
                ${phases.map(phase => `
                    <li>
                        <button class="${phase.id} ${activePhase === phase.id ? 'active' : ''}" 
                                data-phase="${phase.id}">
                            ${phase.name}
                        </button>
                    </li>
                `).join('')}
            </ul>
        `;
        container.innerHTML = html;
        
        container.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                onSelect(btn.dataset.phase);
            });
        });
    },

    // Render quick stats
    renderQuickStats(container, phases) {
        const progress = Storage.getAll().weekProgress;
        const stats = { completed: 0, inProgress: 0, pending: 0 };
        
        phases.forEach(phase => {
            phase.items.forEach(week => {
                const status = (progress[week.week]?.status) || 'pending';
                stats[status === 'in-progress' ? 'inProgress' : status]++;
            });
        });
        
        container.innerHTML = `
            <h3>学习统计</h3>
            <div class="stat-item">
                <span>⏳ 待开始</span>
                <span class="stat-value">${stats.pending}</span>
            </div>
            <div class="stat-item">
                <span>🔄 进行中</span>
                <span class="stat-value">${stats.inProgress}</span>
            </div>
            <div class="stat-item">
                <span>✅ 已完成</span>
                <span class="stat-value">${stats.completed}</span>
            </div>
            <div class="stat-item" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border);">
                <span>总计进度</span>
                <span class="stat-value">${Math.round((stats.completed / LEARNING_PLAN.totalWeeks) * 100)}%</span>
            </div>
        `;
    },

    // Render week card
    renderWeekCard(week, phaseId) {
        const progress = Storage.getWeekProgress(week.week);
        const completion = Storage.getWeekCompletion(week.week, week.checkItems);
        const status = progress.status || 'pending';
        const phaseColor = this.getPhaseColor(phaseId);
        
        return `
            <div class="week-card status-${status.replace('_', '-')} ${App.selectedWeek === week.week ? 'selected' : ''}" 
                 data-week="${week.week}">
                <div class="week-card-header">
                    <span class="week-number">Week ${week.week}</span>
                    <span class="status-badge ${status}">${this.getStatusLabel(status)}</span>
                </div>
                <h3 class="week-title">${week.title}</h3>
                <div class="week-meta">
                    <span>计划: ${week.estimatedHours}h</span>
                    <span>${progress.actualHours ? `实际: ${progress.actualHours}h` : '未记录'}</span>
                </div>
                <div class="week-progress-info">
                    <div class="week-progress-bar">
                        <div class="week-progress-fill" 
                             style="width: ${completion}%; background: ${phaseColor}"></div>
                    </div>
                    <div class="week-progress-text">
                        ${week.checkItems.filter(i => Storage.isCheckItemDone(i.id)).length}/${week.checkItems.length} 检查点完成
                    </div>
                </div>
            </div>
        `;
    },

    // Render week grid
    renderWeekGrid(container, phases, filterPhase) {
        let weeks = [];
        phases.forEach(phase => {
            if (!filterPhase || phase.id === filterPhase) {
                phase.items.forEach(week => {
                    weeks.push({ ...week, phaseId: phase.id });
                });
            }
        });
        
        weeks.sort((a, b) => a.week - b.week);
        
        container.innerHTML = weeks.map(w => this.renderWeekCard(w, w.phaseId)).join('');
        
        container.querySelectorAll('.week-card').forEach(card => {
            card.addEventListener('click', () => {
                const weekNum = parseInt(card.dataset.week, 10);
                App.selectWeek(weekNum);
            });
        });
    },

    // Get status label
    getStatusLabel(status) {
        const labels = {
            'pending': '待开始',
            'in-progress': '进行中',
            'completed': '已完成'
        };
        return labels[status] || status;
    },

    // Render detail panel
    renderDetailPanel(container, week, phaseId) {
        if (!week) {
            container.innerHTML = '<p class="placeholder">点击左侧卡片查看详情</p>';
            return;
        }
        
        const progress = Storage.getWeekProgress(week.week);
        const completion = Storage.getWeekCompletion(week.week, week.checkItems);
        const phaseColor = this.getPhaseColor(phaseId);
        
        container.innerHTML = `
            <div class="detail-header">
                <div class="detail-week">Week ${week.week}</div>
                <h2 class="detail-title">${week.title}</h2>
                
                <div class="status-selector">
                    <button class="status-btn ${progress.status === 'pending' ? 'active' : ''}" 
                            data-status="pending">待开始</button>
                    <button class="status-btn ${progress.status === 'in-progress' ? 'active' : ''}" 
                            data-status="in-progress">进行中</button>
                    <button class="status-btn ${progress.status === 'completed' ? 'active' : ''}" 
                            data-status="completed">已完成</button>
                </div>
            </div>
            
            ${week.objectives.length > 0 ? `
                <div class="detail-section">
                    <h4>学习目标</h4>
                    <ul class="checklist">
                        ${week.objectives.map(obj => `<li>• ${obj}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <div class="detail-section">
                <h4>检查清单</h4>
                <ul class="checklist">
                    ${week.checkItems.map(item => `
                        <li>
                            <input type="checkbox" id="${item.id}" 
                                   ${Storage.isCheckItemDone(item.id) ? 'checked' : ''}>
                            <label for="${item.id}">${item.text}</label>
                        </li>
                    `).join('')}
                </ul>
                <div class="week-progress-text" style="margin-top: 0.5rem;">
                    完成度: ${completion}%
                </div>
            </div>
            
            <div class="detail-section">
                <h4>学习时长</h4>
                <p style="font-size: 0.85rem; color: var(--color-text-secondary); margin-bottom: 0.5rem;">
                    计划: ${week.estimatedHours} 小时
                </p>
                <input type="number" class="hours-input" placeholder="实际学习时长"
                       value="${progress.actualHours || ''}" min="0" step="0.5">
            </div>
            
            <div class="detail-section">
                <h4>学习笔记</h4>
                <textarea class="notes-textarea" placeholder="记录学习心得、遇到的问题...">${progress.notes || ''}</textarea>
            </div>
        `;
        
        // Bind status buttons
        container.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const status = btn.dataset.status;
                Storage.updateWeekProgress(week.week, { 
                    status,
                    completedAt: status === 'completed' ? new Date().toISOString().split('T')[0] : null
                });
                App.refresh();
            });
        });
        
        // Bind checkboxes
        container.querySelectorAll('.checklist input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                Storage.setCheckItemDone(cb.id, cb.checked);
                const newCompletion = Storage.getWeekCompletion(week.week, week.checkItems);
                container.querySelector('.week-progress-text').textContent = `完成度: ${newCompletion}%`;
                App.refreshWeekCard(week.week);
            });
        });
        
        // Bind hours input
        const hoursInput = container.querySelector('.hours-input');
        if (hoursInput) {
            hoursInput.addEventListener('change', () => {
                Storage.updateWeekProgress(week.week, { 
                    actualHours: parseFloat(hoursInput.value) || null 
                });
                App.refreshWeekCard(week.week);
            });
        }
        
        // Bind notes textarea
        const notesTextarea = container.querySelector('.notes-textarea');
        if (notesTextarea) {
            notesTextarea.addEventListener('blur', () => {
                Storage.updateWeekProgress(week.week, { notes: notesTextarea.value });
            });
        }
    },

    // Update overall progress bar
    renderOverallProgress() {
        const progress = Storage.getAll().weekProgress;
        let completed = 0;
        LEARNING_PLAN.phases.forEach(p => {
            p.items.forEach(w => {
                if (progress[w.week]?.status === 'completed') completed++;
            });
        });
        
        const percent = Math.round((completed / LEARNING_PLAN.totalWeeks) * 100);
        document.getElementById('overall-progress-bar').style.width = `${percent}%`;
        document.getElementById('overall-progress-text').textContent = `${percent}%`;
    }
};
```

- [ ] **Step 2: Commit**

```bash
git add tracker/js/components.js
git commit -m "feat: add UI components module"
```

---

## Task 6: 实现 App 主逻辑

**Files:**
- Create: `tracker/js/app.js`

- [ ] **Step 1: 编写 app.js**

```javascript
// app.js - Main application logic

const App = {
    selectedWeek: null,
    activePhase: '',

    // Initialize the app
    init() {
        this.cacheElements();
        this.bindEvents();
        this.render();
        console.log('Java Learning Tracker initialized');
    },

    // Cache DOM elements
    cacheElements() {
        this.elements = {
            phaseNav: document.getElementById('phase-nav'),
            quickStats: document.getElementById('quick-stats'),
            weekGrid: document.getElementById('week-grid'),
            detailPanel: document.getElementById('detail-panel')
        };
    },

    // Bind global events
    bindEvents() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.selectedWeek = null;
                this.render();
            }
        });
    },

    // Select a week
    selectWeek(weekNum) {
        this.selectedWeek = weekNum;
        this.render();
    },

    // Get week data by number
    getWeekData(weekNum) {
        for (const phase of LEARNING_PLAN.phases) {
            const week = phase.items.find(w => w.week === weekNum);
            if (week) return { ...week, phaseId: phase.id };
        }
        return null;
    },

    // Render the entire app
    render() {
        Components.renderOverallProgress();
        
        Components.renderPhaseNav(
            this.elements.phaseNav, 
            LEARNING_PLAN.phases, 
            this.activePhase,
            (phaseId) => {
                this.activePhase = phaseId;
                this.render();
            }
        );
        
        Components.renderQuickStats(
            this.elements.quickStats, 
            LEARNING_PLAN.phases
        );
        
        Components.renderWeekGrid(
            this.elements.weekGrid,
            LEARNING_PLAN.phases,
            this.activePhase
        );
        
        const selectedWeekData = this.selectedWeek ? this.getWeekData(this.selectedWeek) : null;
        Components.renderDetailPanel(
            this.elements.detailPanel,
            selectedWeekData,
            selectedWeekData?.phaseId
        );
    },

    // Refresh full view
    refresh() {
        this.render();
    },

    // Refresh single week card (optimization)
    refreshWeekCard(weekNum) {
        const card = document.querySelector(`.week-card[data-week="${weekNum}"]`);
        if (card) {
            const weekData = this.getWeekData(weekNum);
            const newCard = Components.renderWeekCard(weekData, weekData.phaseId);
            card.outerHTML = newCard;
            
            // Re-bind click event
            const newCardEl = document.querySelector(`.week-card[data-week="${weekNum}"]`);
            newCardEl.addEventListener('click', () => this.selectWeek(weekNum));
        }
        
        Components.renderOverallProgress();
        Components.renderQuickStats(this.elements.quickStats, LEARNING_PLAN.phases);
    }
};

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
```

- [ ] **Step 2: Commit**

```bash
git add tracker/js/app.js
git commit -m "feat: add main app logic"
```

---

## Task 7: 添加 package.json 和 README

**Files:**
- Create: `tracker/README.md`

- [ ] **Step 1: 创建 tracker/README.md**

```markdown
# Java学习进度追踪表

交互式Web页面，用于追踪16周Java后端学习计划。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 生成数据

```bash
node tracker/scripts/build-data.js
```

### 3. 打开页面

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
```

- [ ] **Step 2: Commit**

```bash
git add tracker/README.md
git commit -m "docs: add tracker README"
```

---

## Task 8: 最终验证

- [ ] **Step 1: 确认所有文件已创建**

```bash
ls -la tracker/
ls -la tracker/js/
ls -la tracker/css/
ls -la tracker/scripts/
```

Expected: 所有目录和文件都存在

- [ ] **Step 2: 重新生成数据**

```bash
node tracker/scripts/build-data.js
```

- [ ] **Step 3: 在浏览器中测试**

1. 打开 `tracker/index.html`
2. 确认16周卡片正确显示
3. 点击卡片，确认详情面板更新
4. 切换状态，确认保存（刷新后数据保留）
5. 勾选检查点，确认进度条更新
6. 输入学习时长，确认保存

- [ ] **Step 4: 最终 Commit**

```bash
git add .
git commit -m "feat: complete Java learning progress tracker"
```

---

## 实现完成检查清单

- [ ] 目录结构正确创建
- [ ] build-data.js 正确解析所有16周计划
- [ ] storage.js LocalStorage 操作正常
- [ ] CSS 样式美观、响应式正常
- [ ] components.js 渲染逻辑正确
- [ ] app.js 主逻辑完整
- [ ] 页面能在浏览器正常运行
- [ ] 进度数据能正确保存和恢复
