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
                <span>待开始</span>
                <span class="stat-value">${stats.pending}</span>
            </div>
            <div class="stat-item">
                <span>进行中</span>
                <span class="stat-value">${stats.inProgress}</span>
            </div>
            <div class="stat-item">
                <span>已完成</span>
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
                        ${week.objectives.map(obj => `<li>${obj}</li>`).join('')}
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
        const bar = document.getElementById('overall-progress-bar');
        const text = document.getElementById('overall-progress-text');
        if (bar) bar.style.width = `${percent}%`;
        if (text) text.textContent = `${percent}%`;
    }
};
