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
