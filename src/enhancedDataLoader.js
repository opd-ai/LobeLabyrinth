/**
 * Enhanced DataLoader with Performance Optimization
 * Extends the existing DataLoader with lazy loading capabilities
 */
class EnhancedDataLoader {
    constructor(originalDataLoader, performanceManager) {
        this.originalLoader = originalDataLoader;
        this.performanceManager = performanceManager;
        this.categoryCache = new Map();
        this.loadingStates = new Map();
        
        // Track question usage patterns for intelligent caching
        this.usageStats = {
            categoryRequests: new Map(),
            difficultyRequests: new Map(),
            lastAccessed: new Map()
        };
        
        console.log('🚀 Enhanced DataLoader initialized with performance optimizations');
    }

    /**
     * Get questions by category with lazy loading and caching
     * @param {string} category - Question category
     * @param {boolean} forceReload - Force reload from original data
     * @returns {Promise<Array>} Array of questions
     */
    async getQuestionsByCategory(category, forceReload = false) {
        // Track usage statistics
        this.trackCategoryUsage(category);

        // Return cached data if available and not forcing reload
        if (!forceReload && this.categoryCache.has(category)) {
            console.log(`📚 Retrieved ${this.categoryCache.get(category).length} questions from cache: ${category}`);
            return this.categoryCache.get(category);
        }

        // Check if already loading
        if (this.loadingStates.has(category)) {
            return this.loadingStates.get(category);
        }

        // Create loading promise
        const loadingPromise = this.loadCategoryQuestions(category);
        this.loadingStates.set(category, loadingPromise);

        try {
            const questions = await loadingPromise;
            this.loadingStates.delete(category);
            return questions;
        } catch (error) {
            this.loadingStates.delete(category);
            throw error;
        }
    }

    /**
     * Load questions for a specific category
     * @param {string} category - Question category
     * @returns {Promise<Array>} Array of questions
     */
    async loadCategoryQuestions(category) {
        return new Promise((resolve) => {
            // Use requestIdleCallback for non-blocking processing
            const processQuestions = (deadline) => {
                const startTime = performance.now();
                
                try {
                    // Get all questions from original loader
                    const allQuestions = this.originalLoader.getQuestions();
                    
                    // Filter questions by category (include general questions for all categories)
                    const filteredQuestions = allQuestions.filter(q => {
                        return q.category === category || q.category === 'general';
                    });

                    // Sort by difficulty and ID for consistent ordering
                    filteredQuestions.sort((a, b) => {
                        if (a.difficulty !== b.difficulty) {
                            const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
                            return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
                        }
                        return a.id.localeCompare(b.id);
                    });

                    // Cache the results
                    this.categoryCache.set(category, filteredQuestions);
                    this.usageStats.lastAccessed.set(category, Date.now());

                    const processingTime = performance.now() - startTime;
                    console.log(`📚 Loaded ${filteredQuestions.length} questions for category '${category}' in ${processingTime.toFixed(2)}ms`);

                    resolve(filteredQuestions);
                } catch (error) {
                    console.error(`❌ Error loading questions for category ${category}:`, error);
                    resolve([]); // Return empty array on error
                }
            };

            // Use requestIdleCallback if available, otherwise use setTimeout
            if (window.requestIdleCallback) {
                requestIdleCallback(processQuestions);
            } else {
                setTimeout(() => processQuestions({}), 0);
            }
        });
    }

    /**
     * Get questions by difficulty with optimization
     * @param {string} difficulty - Question difficulty level
     * @returns {Array} Array of questions
     */
    getQuestionsByDifficulty(difficulty) {
        this.trackDifficultyUsage(difficulty);

        const cacheKey = `difficulty_${difficulty}`;
        
        if (this.categoryCache.has(cacheKey)) {
            return this.categoryCache.get(cacheKey);
        }

        const allQuestions = this.originalLoader.getQuestions();
        const filteredQuestions = allQuestions.filter(q => q.difficulty === difficulty);
        
        this.categoryCache.set(cacheKey, filteredQuestions);
        this.usageStats.lastAccessed.set(cacheKey, Date.now());

        console.log(`🎯 Loaded ${filteredQuestions.length} questions for difficulty: ${difficulty}`);
        return filteredQuestions;
    }

    /**
     * Intelligent cache management based on usage patterns
     */
    optimizeCache() {
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes
        const maxCacheSize = 10; // Maximum number of cached categories

        // Remove old entries
        for (const [key, lastAccessed] of this.usageStats.lastAccessed.entries()) {
            if (now - lastAccessed > maxAge) {
                this.categoryCache.delete(key);
                this.usageStats.lastAccessed.delete(key);
                console.log(`🗑️ Removed expired cache entry: ${key}`);
            }
        }

        // If cache is still too large, remove least recently used entries
        if (this.categoryCache.size > maxCacheSize) {
            const sortedEntries = Array.from(this.usageStats.lastAccessed.entries())
                .sort((a, b) => a[1] - b[1]); // Sort by last accessed time

            const entriesToRemove = sortedEntries.slice(0, this.categoryCache.size - maxCacheSize);
            
            for (const [key] of entriesToRemove) {
                this.categoryCache.delete(key);
                this.usageStats.lastAccessed.delete(key);
                console.log(`🗑️ Removed LRU cache entry: ${key}`);
            }
        }
    }

    /**
     * Preload popular categories based on usage patterns
     */
    async preloadPopularCategories() {
        // Get most frequently requested categories
        const popularCategories = Array.from(this.usageStats.categoryRequests.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([category]) => category);

        console.log('🔄 Preloading popular categories:', popularCategories);

        // Preload in parallel
        const preloadPromises = popularCategories.map(category => 
            this.getQuestionsByCategory(category)
        );

        try {
            await Promise.all(preloadPromises);
            console.log('✅ Popular categories preloaded successfully');
        } catch (error) {
            console.warn('⚠️ Error preloading categories:', error);
        }
    }

    /**
     * Track category usage for analytics
     * @param {string} category - Category being accessed
     */
    trackCategoryUsage(category) {
        const currentCount = this.usageStats.categoryRequests.get(category) || 0;
        this.usageStats.categoryRequests.set(category, currentCount + 1);
    }

    /**
     * Track difficulty usage for analytics
     * @param {string} difficulty - Difficulty being accessed
     */
    trackDifficultyUsage(difficulty) {
        const currentCount = this.usageStats.difficultyRequests.get(difficulty) || 0;
        this.usageStats.difficultyRequests.set(difficulty, currentCount + 1);
    }

    /**
     * Get cache statistics and performance metrics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            cacheSize: this.categoryCache.size,
            loadingStates: this.loadingStates.size,
            categoryUsage: Object.fromEntries(this.usageStats.categoryRequests),
            difficultyUsage: Object.fromEntries(this.usageStats.difficultyRequests),
            lastAccessTimes: Object.fromEntries(this.usageStats.lastAccessed),
            memoryUsage: this.estimateMemoryUsage()
        };
    }

    /**
     * Estimate memory usage of cached data
     * @returns {number} Estimated memory usage in bytes
     */
    estimateMemoryUsage() {
        let totalSize = 0;
        
        for (const questions of this.categoryCache.values()) {
            // Rough estimation: each question is approximately 200-500 bytes
            totalSize += questions.length * 350;
        }
        
        return totalSize;
    }

    /**
     * Delegate all other methods to the original loader
     */
    async loadGameData() {
        const result = await this.originalLoader.loadGameData();
        
        // Start background optimization after data loads
        setTimeout(() => {
            this.preloadPopularCategories();
        }, 1000);
        
        return result;
    }

    getAllData() {
        return this.originalLoader.getAllData();
    }

    getRooms() {
        return this.originalLoader.getRooms();
    }

    getQuestions() {
        return this.originalLoader.getQuestions();
    }

    getAchievements() {
        return this.originalLoader.getAchievements();
    }

    getStartingRoom() {
        return this.originalLoader.getStartingRoom();
    }

    getRoomById(roomId) {
        return this.originalLoader.getRoomById(roomId);
    }

    getQuestionById(questionId) {
        return this.originalLoader.getQuestionById(questionId);
    }

    getRandomQuestion(category = null, excludeIds = []) {
        if (category) {
            // Use cached questions if available
            if (this.categoryCache.has(category)) {
                const categoryQuestions = this.categoryCache.get(category);
                const availableQuestions = categoryQuestions.filter(q => !excludeIds.includes(q.id));
                
                if (availableQuestions.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
                    return availableQuestions[randomIndex];
                }
            }
        }
        
        // Fallback to original implementation
        return this.originalLoader.getRandomQuestion(category, excludeIds);
    }

    /**
     * Clear all caches and reset usage statistics
     */
    clearCache() {
        this.categoryCache.clear();
        this.loadingStates.clear();
        this.usageStats.categoryRequests.clear();
        this.usageStats.difficultyRequests.clear();
        this.usageStats.lastAccessed.clear();
        
        console.log('🧹 Enhanced DataLoader cache cleared');
    }

    /**
     * Clean up resources and optimize cache
     */
    cleanup() {
        this.optimizeCache();
        
        // Clear any pending loading states
        this.loadingStates.clear();
        
        console.log('🧹 Enhanced DataLoader cleanup completed');
    }
}

// Export for use with existing codebase
if (typeof window !== 'undefined') {
    window.EnhancedDataLoader = EnhancedDataLoader;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedDataLoader;
}