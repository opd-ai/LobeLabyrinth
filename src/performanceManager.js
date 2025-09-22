/**
 * PerformanceManager - Comprehensive performance optimization system
 * Provides object pooling, lazy loading, DOM batching, and performance monitoring
 * using only browser-native APIs for LobeLabyrinth game
 */
class PerformanceManager {
    constructor() {
        this.objectPools = new Map();
        this.domBatchQueue = [];
        this.batchScheduled = false;
        this.metrics = {
            frameRate: 0,
            memoryUsage: 0,
            domUpdates: 0,
            poolHits: 0,
            poolMisses: 0
        };
        
        // Lazy loading cache
        this.questionCache = new Map();
        this.loadingPromises = new Map();
        
        // Performance monitoring
        this.frameRateHistory = [];
        this.lastFrameTime = performance.now();
        this.isMonitoring = false;
        
        console.log('🚀 PerformanceManager initialized');
        this.startPerformanceMonitoring();
    }

    /**
     * Object Pooling System
     * Reduces garbage collection by reusing objects
     */

    /**
     * Create or get an object pool for a specific type
     * @param {string} poolName - Name of the pool
     * @param {Function} factory - Factory function to create new objects
     * @param {number} initialSize - Initial pool size
     * @returns {Object} Pool configuration
     */
    createPool(poolName, factory, initialSize = 10) {
        if (this.objectPools.has(poolName)) {
            return this.objectPools.get(poolName);
        }

        const pool = {
            available: [],
            inUse: new Set(),
            factory: factory,
            created: 0,
            hits: 0,
            misses: 0
        };

        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            pool.available.push(factory());
            pool.created++;
        }

        this.objectPools.set(poolName, pool);
        console.log(`📦 Created object pool '${poolName}' with ${initialSize} objects`);
        return pool;
    }

    /**
     * Get an object from the pool
     * @param {string} poolName - Name of the pool
     * @returns {*} Object from pool or new object if pool empty
     */
    acquireFromPool(poolName) {
        const pool = this.objectPools.get(poolName);
        if (!pool) {
            throw new Error(`Pool '${poolName}' does not exist`);
        }

        let obj;
        if (pool.available.length > 0) {
            obj = pool.available.pop();
            pool.hits++;
            this.metrics.poolHits++;
        } else {
            obj = pool.factory();
            pool.created++;
            pool.misses++;
            this.metrics.poolMisses++;
        }

        pool.inUse.add(obj);
        return obj;
    }

    /**
     * Return an object to the pool
     * @param {string} poolName - Name of the pool
     * @param {*} obj - Object to return
     */
    releaseToPool(poolName, obj) {
        const pool = this.objectPools.get(poolName);
        if (!pool || !pool.inUse.has(obj)) {
            return false;
        }

        pool.inUse.delete(obj);
        
        // Reset object state if it has a reset method
        if (typeof obj.reset === 'function') {
            obj.reset();
        }
        
        pool.available.push(obj);
        return true;
    }

    /**
     * Get pool statistics
     * @param {string} poolName - Name of the pool
     * @returns {Object} Pool statistics
     */
    getPoolStats(poolName) {
        const pool = this.objectPools.get(poolName);
        if (!pool) return null;

        return {
            name: poolName,
            available: pool.available.length,
            inUse: pool.inUse.size,
            created: pool.created,
            hits: pool.hits,
            misses: pool.misses,
            hitRate: pool.hits / (pool.hits + pool.misses) * 100
        };
    }

    /**
     * Lazy Loading System
     * Loads data on-demand to reduce initial load time
     */

    /**
     * Lazy load questions by category
     * @param {string} category - Question category to load
     * @param {Array} allQuestions - All available questions
     * @returns {Promise<Array>} Filtered questions for category
     */
    async lazyLoadQuestions(category, allQuestions) {
        // Return cached data if available
        if (this.questionCache.has(category)) {
            return this.questionCache.get(category);
        }

        // Return existing promise if already loading
        if (this.loadingPromises.has(category)) {
            return this.loadingPromises.get(category);
        }

        // Create loading promise
        const loadPromise = new Promise((resolve) => {
            // Simulate processing time for large datasets
            requestIdleCallback(() => {
                const filteredQuestions = allQuestions.filter(q => 
                    q.category === category || q.category === 'general'
                );
                
                this.questionCache.set(category, filteredQuestions);
                this.loadingPromises.delete(category);
                
                console.log(`📚 Lazy loaded ${filteredQuestions.length} questions for category: ${category}`);
                resolve(filteredQuestions);
            });
        });

        this.loadingPromises.set(category, loadPromise);
        return loadPromise;
    }

    /**
     * Clear question cache to free memory
     * @param {string} category - Category to clear (optional)
     */
    clearQuestionCache(category = null) {
        if (category) {
            this.questionCache.delete(category);
            console.log(`🗑️ Cleared question cache for category: ${category}`);
        } else {
            this.questionCache.clear();
            console.log('🗑️ Cleared all question caches');
        }
    }

    /**
     * DOM Batching System
     * Batches DOM updates to minimize reflows and repaints
     */

    /**
     * Schedule a DOM update to be batched
     * @param {Function} updateFunction - Function that performs DOM updates
     * @param {number} priority - Priority level (1-3, 1 = highest)
     */
    batchDOMUpdate(updateFunction, priority = 2) {
        this.domBatchQueue.push({
            update: updateFunction,
            priority: priority,
            timestamp: performance.now()
        });

        if (!this.batchScheduled) {
            this.scheduleBatch();
        }
    }

    /**
     * Schedule batch execution using requestAnimationFrame
     * @private
     */
    scheduleBatch() {
        this.batchScheduled = true;
        requestAnimationFrame(() => {
            this.executeBatch();
        });
    }

    /**
     * Execute all queued DOM updates in priority order
     * @private
     */
    executeBatch() {
        if (this.domBatchQueue.length === 0) {
            this.batchScheduled = false;
            return;
        }

        // Sort by priority (1 = highest priority first)
        this.domBatchQueue.sort((a, b) => a.priority - b.priority);

        const batchStartTime = performance.now();
        let updatesExecuted = 0;

        // Execute updates in a single frame
        while (this.domBatchQueue.length > 0) {
            const { update } = this.domBatchQueue.shift();
            
            try {
                update();
                updatesExecuted++;
            } catch (error) {
                console.error('🚨 Error in batched DOM update:', error);
            }

            // Prevent frame drops by limiting batch size
            if (performance.now() - batchStartTime > 8) { // 8ms budget
                break;
            }
        }

        this.metrics.domUpdates += updatesExecuted;
        this.batchScheduled = false;

        // Schedule remaining updates if any
        if (this.domBatchQueue.length > 0) {
            this.scheduleBatch();
        }

        console.log(`⚡ Executed ${updatesExecuted} DOM updates in ${Math.round(performance.now() - batchStartTime)}ms`);
    }

    /**
     * Create efficient DOM update functions
     * @param {HTMLElement} element - Target element
     * @param {Object} properties - Properties to update
     * @returns {Function} Optimized update function
     */
    createDOMUpdate(element, properties) {
        return () => {
            for (const [prop, value] of Object.entries(properties)) {
                if (prop === 'textContent') {
                    element.textContent = value;
                } else if (prop === 'innerHTML') {
                    element.innerHTML = value;
                } else if (prop === 'className') {
                    element.className = value;
                } else if (prop.startsWith('data-')) {
                    element.setAttribute(prop, value);
                } else if (prop === 'style') {
                    Object.assign(element.style, value);
                } else {
                    element[prop] = value;
                }
            }
        };
    }

    /**
     * Performance Monitoring System
     * Tracks frame rate, memory usage, and other metrics
     */

    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.monitorFrameRate();
        this.monitorMemoryUsage();
        
        console.log('📊 Performance monitoring started');
    }

    /**
     * Stop performance monitoring
     */
    stopPerformanceMonitoring() {
        this.isMonitoring = false;
        console.log('📊 Performance monitoring stopped');
    }

    /**
     * Monitor frame rate using requestAnimationFrame
     * @private
     */
    monitorFrameRate() {
        if (!this.isMonitoring) return;

        const frameCallback = (currentTime) => {
            const deltaTime = currentTime - this.lastFrameTime;
            const fps = 1000 / deltaTime;
            
            this.frameRateHistory.push(fps);
            
            // Keep only last 60 frames for averaging
            if (this.frameRateHistory.length > 60) {
                this.frameRateHistory.shift();
            }
            
            // Calculate average FPS
            this.metrics.frameRate = this.frameRateHistory.reduce((a, b) => a + b, 0) / this.frameRateHistory.length;
            this.lastFrameTime = currentTime;
            
            // Continue monitoring
            if (this.isMonitoring) {
                requestAnimationFrame(frameCallback);
            }
        };

        requestAnimationFrame(frameCallback);
    }

    /**
     * Monitor memory usage (if available)
     * @private
     */
    monitorMemoryUsage() {
        if (!this.isMonitoring) return;

        const updateMemory = () => {
            if (performance.memory) {
                this.metrics.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
            }
            
            if (this.isMonitoring) {
                setTimeout(updateMemory, 1000); // Update every second
            }
        };

        updateMemory();
    }

    /**
     * Get current performance metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            frameRate: Math.round(this.metrics.frameRate * 100) / 100,
            memoryUsage: Math.round(this.metrics.memoryUsage * 100) / 100,
            poolStats: Array.from(this.objectPools.keys()).map(name => this.getPoolStats(name)),
            queuedDOMUpdates: this.domBatchQueue.length,
            questionCacheSize: this.questionCache.size
        };
    }

    /**
     * Optimization Utilities
     */

    /**
     * Debounce function to limit function execution frequency
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function to limit function execution rate
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Check if reduced motion is preferred
     * @returns {boolean} True if reduced motion is preferred
     */
    prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Cleanup and resource management
     */

    /**
     * Clean up all resources and stop monitoring
     */
    cleanup() {
        this.stopPerformanceMonitoring();
        this.clearQuestionCache();
        
        // Clear all object pools
        this.objectPools.clear();
        
        // Clear DOM batch queue
        this.domBatchQueue.length = 0;
        this.batchScheduled = false;
        
        console.log('🧹 PerformanceManager cleanup completed');
    }

    /**
     * Get performance recommendations based on current metrics
     * @returns {Array<string>} Array of performance recommendations
     */
    getRecommendations() {
        const recommendations = [];
        const metrics = this.getMetrics();

        if (metrics.frameRate < 30) {
            recommendations.push('Frame rate is low. Consider reducing visual effects or DOM updates.');
        }

        if (metrics.memoryUsage > 100) {
            recommendations.push('Memory usage is high. Consider clearing caches or reducing object creation.');
        }

        if (metrics.poolMisses > metrics.poolHits) {
            recommendations.push('Object pool miss rate is high. Consider increasing pool sizes.');
        }

        if (metrics.queuedDOMUpdates > 50) {
            recommendations.push('DOM update queue is large. Consider batching updates more aggressively.');
        }

        if (recommendations.length === 0) {
            recommendations.push('Performance metrics look good! 🎉');
        }

        return recommendations;
    }
}

// Make PerformanceManager available globally for debugging
if (typeof window !== 'undefined') {
    window.PerformanceManager = PerformanceManager;
}