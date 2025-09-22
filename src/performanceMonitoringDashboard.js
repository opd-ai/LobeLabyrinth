/**
 * Performance Monitoring Dashboard
 * Real-time performance metrics visualization for LobeLabyrinth
 */
class PerformanceMonitoringDashboard {
    constructor(performanceManager) {
        this.performanceManager = performanceManager;
        this.isVisible = false;
        this.updateInterval = null;
        this.metricsHistory = {
            frameRate: [],
            memoryUsage: [],
            domUpdates: [],
            poolHits: [],
            poolMisses: []
        };
        
        this.maxHistoryLength = 60; // Keep 60 data points
        this.dashboardElement = null;
        
        this.createDashboard();
        this.setupKeyboardShortcuts();
        
        console.log('📊 Performance Monitoring Dashboard initialized');
    }

    /**
     * Create the dashboard UI
     */
    createDashboard() {
        this.dashboardElement = document.createElement('div');
        this.dashboardElement.id = 'performance-dashboard';
        this.dashboardElement.className = 'performance-dashboard hidden';
        
        this.dashboardElement.innerHTML = `
            <div class="dashboard-header">
                <h3>🚀 Performance Monitor</h3>
                <button class="dashboard-close" aria-label="Close Dashboard">×</button>
            </div>
            
            <div class="dashboard-content">
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h4>Frame Rate</h4>
                        <div class="metric-value" id="fps-value">--</div>
                        <div class="metric-unit">FPS</div>
                        <div class="metric-chart" id="fps-chart"></div>
                    </div>
                    
                    <div class="metric-card">
                        <h4>Memory Usage</h4>
                        <div class="metric-value" id="memory-value">--</div>
                        <div class="metric-unit">MB</div>
                        <div class="metric-chart" id="memory-chart"></div>
                    </div>
                    
                    <div class="metric-card">
                        <h4>DOM Updates</h4>
                        <div class="metric-value" id="dom-value">--</div>
                        <div class="metric-unit">Total</div>
                    </div>
                    
                    <div class="metric-card">
                        <h4>Pool Efficiency</h4>
                        <div class="metric-value" id="pool-value">--</div>
                        <div class="metric-unit">% Hit Rate</div>
                    </div>
                </div>
                
                <div class="pool-stats">
                    <h4>Object Pool Statistics</h4>
                    <div id="pool-stats-content"></div>
                </div>
                
                <div class="recommendations">
                    <h4>Performance Recommendations</h4>
                    <div id="recommendations-content"></div>
                </div>
                
                <div class="dashboard-controls">
                    <button id="clear-metrics">Clear Metrics</button>
                    <button id="export-metrics">Export Data</button>
                    <label>
                        <input type="checkbox" id="auto-optimize" checked>
                        Auto-optimize
                    </label>
                </div>
            </div>
        `;
        
        // Add styles
        this.addDashboardStyles();
        
        // Setup event listeners
        this.setupDashboardEvents();
        
        document.body.appendChild(this.dashboardElement);
    }

    /**
     * Add CSS styles for the dashboard
     */
    addDashboardStyles() {
        if (document.getElementById('performance-dashboard-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'performance-dashboard-styles';
        styles.textContent = `
            .performance-dashboard {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 400px;
                max-height: 80vh;
                background: rgba(0, 0, 0, 0.95);
                color: white;
                border-radius: 8px;
                z-index: 10000;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                overflow-y: auto;
                transition: all 0.3s ease;
            }
            
            .performance-dashboard.hidden {
                transform: translateX(100%);
                opacity: 0;
                pointer-events: none;
            }
            
            .dashboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                border-bottom: 1px solid #333;
                background: rgba(255, 255, 255, 0.1);
            }
            
            .dashboard-header h3 {
                margin: 0;
                font-size: 14px;
            }
            
            .dashboard-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
            }
            
            .dashboard-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .dashboard-content {
                padding: 15px;
            }
            
            .metrics-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .metric-card {
                background: rgba(255, 255, 255, 0.1);
                padding: 12px;
                border-radius: 6px;
                text-align: center;
            }
            
            .metric-card h4 {
                margin: 0 0 8px 0;
                font-size: 11px;
                opacity: 0.8;
                text-transform: uppercase;
            }
            
            .metric-value {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 4px;
            }
            
            .metric-unit {
                font-size: 10px;
                opacity: 0.6;
            }
            
            .metric-chart {
                height: 30px;
                margin-top: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                position: relative;
                overflow: hidden;
            }
            
            .chart-bar {
                position: absolute;
                bottom: 0;
                width: 2px;
                background: linear-gradient(to top, #4CAF50, #81C784);
                transition: height 0.3s ease;
            }
            
            .pool-stats, .recommendations {
                margin-bottom: 15px;
            }
            
            .pool-stats h4, .recommendations h4 {
                margin: 0 0 10px 0;
                font-size: 12px;
                opacity: 0.8;
            }
            
            .pool-stat-item {
                display: flex;
                justify-content: space-between;
                padding: 4px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .recommendation-item {
                padding: 6px 0;
                font-size: 11px;
                opacity: 0.9;
            }
            
            .dashboard-controls {
                display: flex;
                gap: 10px;
                align-items: center;
                flex-wrap: wrap;
            }
            
            .dashboard-controls button {
                padding: 6px 12px;
                border: 1px solid rgba(255, 255, 255, 0.3);
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
            }
            
            .dashboard-controls button:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .dashboard-controls label {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 11px;
                cursor: pointer;
            }
            
            .metric-good { color: #4CAF50; }
            .metric-warning { color: #FFC107; }
            .metric-critical { color: #F44336; }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Setup dashboard event listeners
     */
    setupDashboardEvents() {
        const closeBtn = this.dashboardElement.querySelector('.dashboard-close');
        closeBtn.addEventListener('click', () => this.hide());
        
        const clearBtn = this.dashboardElement.querySelector('#clear-metrics');
        clearBtn.addEventListener('click', () => this.clearMetrics());
        
        const exportBtn = this.dashboardElement.querySelector('#export-metrics');
        exportBtn.addEventListener('click', () => this.exportMetrics());
        
        const autoOptimizeCheckbox = this.dashboardElement.querySelector('#auto-optimize');
        autoOptimizeCheckbox.addEventListener('change', (e) => {
            this.autoOptimize = e.target.checked;
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + Shift + P to toggle dashboard
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                this.toggle();
            }
        });
    }

    /**
     * Show the dashboard
     */
    show() {
        this.isVisible = true;
        this.dashboardElement.classList.remove('hidden');
        this.startUpdating();
        console.log('📊 Performance dashboard shown');
    }

    /**
     * Hide the dashboard
     */
    hide() {
        this.isVisible = false;
        this.dashboardElement.classList.add('hidden');
        this.stopUpdating();
        console.log('📊 Performance dashboard hidden');
    }

    /**
     * Toggle dashboard visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Start updating metrics
     */
    startUpdating() {
        if (this.updateInterval) return;
        
        this.updateInterval = setInterval(() => {
            this.updateMetrics();
        }, 1000); // Update every second
    }

    /**
     * Stop updating metrics
     */
    stopUpdating() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Update all metrics displays
     */
    updateMetrics() {
        const metrics = this.performanceManager.getMetrics();
        
        // Update history
        this.addToHistory('frameRate', metrics.frameRate);
        this.addToHistory('memoryUsage', metrics.memoryUsage);
        this.addToHistory('domUpdates', metrics.domUpdates);
        this.addToHistory('poolHits', metrics.poolHits);
        this.addToHistory('poolMisses', metrics.poolMisses);
        
        // Update displays
        this.updateFrameRateDisplay(metrics.frameRate);
        this.updateMemoryDisplay(metrics.memoryUsage);
        this.updateDOMDisplay(metrics.domUpdates);
        this.updatePoolDisplay(metrics);
        this.updatePoolStats(metrics.poolStats);
        this.updateRecommendations();
        
        // Auto-optimize if enabled
        if (this.autoOptimize) {
            this.performAutoOptimizations(metrics);
        }
    }

    /**
     * Add data point to metrics history
     */
    addToHistory(metric, value) {
        this.metricsHistory[metric].push(value);
        
        if (this.metricsHistory[metric].length > this.maxHistoryLength) {
            this.metricsHistory[metric].shift();
        }
    }

    /**
     * Update frame rate display
     */
    updateFrameRateDisplay(fps) {
        const valueElement = this.dashboardElement.querySelector('#fps-value');
        const chartElement = this.dashboardElement.querySelector('#fps-chart');
        
        valueElement.textContent = fps.toFixed(1);
        
        // Set color based on FPS
        if (fps >= 50) {
            valueElement.className = 'metric-value metric-good';
        } else if (fps >= 30) {
            valueElement.className = 'metric-value metric-warning';
        } else {
            valueElement.className = 'metric-value metric-critical';
        }
        
        this.updateChart(chartElement, this.metricsHistory.frameRate, 60);
    }

    /**
     * Update memory display
     */
    updateMemoryDisplay(memory) {
        const valueElement = this.dashboardElement.querySelector('#memory-value');
        
        valueElement.textContent = memory.toFixed(1);
        
        // Set color based on memory usage
        if (memory < 50) {
            valueElement.className = 'metric-value metric-good';
        } else if (memory < 100) {
            valueElement.className = 'metric-value metric-warning';
        } else {
            valueElement.className = 'metric-value metric-critical';
        }
    }

    /**
     * Update DOM updates display
     */
    updateDOMDisplay(domUpdates) {
        const valueElement = this.dashboardElement.querySelector('#dom-value');
        valueElement.textContent = domUpdates;
    }

    /**
     * Update pool efficiency display
     */
    updatePoolDisplay(metrics) {
        const valueElement = this.dashboardElement.querySelector('#pool-value');
        const totalRequests = metrics.poolHits + metrics.poolMisses;
        const hitRate = totalRequests > 0 ? (metrics.poolHits / totalRequests) * 100 : 100;
        
        valueElement.textContent = hitRate.toFixed(1);
        
        if (hitRate >= 80) {
            valueElement.className = 'metric-value metric-good';
        } else if (hitRate >= 60) {
            valueElement.className = 'metric-value metric-warning';
        } else {
            valueElement.className = 'metric-value metric-critical';
        }
    }

    /**
     * Update pool statistics
     */
    updatePoolStats(poolStats) {
        const container = this.dashboardElement.querySelector('#pool-stats-content');
        
        if (!poolStats || poolStats.length === 0) {
            container.innerHTML = '<div class="pool-stat-item">No pool data available</div>';
            return;
        }
        
        container.innerHTML = poolStats.map(pool => `
            <div class="pool-stat-item">
                <span>${pool.name}</span>
                <span>${pool.hitRate.toFixed(1)}% (${pool.hits}/${pool.hits + pool.misses})</span>
            </div>
        `).join('');
    }

    /**
     * Update recommendations
     */
    updateRecommendations() {
        const container = this.dashboardElement.querySelector('#recommendations-content');
        const recommendations = this.performanceManager.getRecommendations();
        
        container.innerHTML = recommendations.map(rec => `
            <div class="recommendation-item">${rec}</div>
        `).join('');
    }

    /**
     * Update mini chart display
     */
    updateChart(chartElement, data, maxValue) {
        chartElement.innerHTML = '';
        
        if (data.length === 0) return;
        
        const width = chartElement.offsetWidth;
        const barWidth = Math.max(1, width / this.maxHistoryLength);
        
        data.forEach((value, index) => {
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.left = `${index * barWidth}px`;
            bar.style.width = `${barWidth - 1}px`;
            bar.style.height = `${(value / maxValue) * 100}%`;
            
            chartElement.appendChild(bar);
        });
    }

    /**
     * Perform automatic optimizations based on metrics
     */
    performAutoOptimizations(metrics) {
        // Clear caches if memory usage is high
        if (metrics.memoryUsage > 100) {
            this.performanceManager.clearQuestionCache();
            console.log('🧹 Auto-optimization: Cleared question cache due to high memory usage');
        }
        
        // Optimize cache if pool hit rate is low
        const totalRequests = metrics.poolHits + metrics.poolMisses;
        const hitRate = totalRequests > 0 ? (metrics.poolHits / totalRequests) * 100 : 100;
        
        if (hitRate < 60 && totalRequests > 50) {
            // Could trigger pool size increases here
            console.log('⚡ Auto-optimization: Low pool hit rate detected');
        }
    }

    /**
     * Clear all metrics history
     */
    clearMetrics() {
        for (const key of Object.keys(this.metricsHistory)) {
            this.metricsHistory[key] = [];
        }
        
        // Reset performance manager metrics
        this.performanceManager.metrics = {
            frameRate: 0,
            memoryUsage: 0,
            domUpdates: 0,
            poolHits: 0,
            poolMisses: 0
        };
        
        console.log('🧹 Metrics cleared');
    }

    /**
     * Export metrics data
     */
    exportMetrics() {
        const exportData = {
            timestamp: new Date().toISOString(),
            metricsHistory: this.metricsHistory,
            currentMetrics: this.performanceManager.getMetrics(),
            recommendations: this.performanceManager.getRecommendations()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `performance-metrics-${Date.now()}.json`;
        link.click();
        
        console.log('📊 Metrics exported');
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.stopUpdating();
        
        if (this.dashboardElement && this.dashboardElement.parentNode) {
            this.dashboardElement.parentNode.removeChild(this.dashboardElement);
        }
        
        const styles = document.getElementById('performance-dashboard-styles');
        if (styles && styles.parentNode) {
            styles.parentNode.removeChild(styles);
        }
        
        console.log('🧹 Performance dashboard cleanup completed');
    }
}

// Export for use with PerformanceManager
if (typeof window !== 'undefined') {
    window.PerformanceMonitoringDashboard = PerformanceMonitoringDashboard;
}