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
