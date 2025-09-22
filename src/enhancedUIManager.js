/**
 * Enhanced UI Manager Integration with Performance Optimization
 * Provides performance-optimized versions of common UI operations
 */
class EnhancedUIManager {
    constructor(originalUIManager, performanceManager) {
        this.originalUI = originalUIManager;
        this.performanceManager = performanceManager;
        this.updateQueue = new Map();
        this.batchScheduled = false;
        
        // Element pools for frequently created/destroyed elements
        this.initializeElementPools();
        
        // Optimized update methods
        this.optimizedUpdates = new Map();
        this.setupOptimizedUpdates();
        
        console.log('🚀 Enhanced UIManager initialized with performance optimizations');
    }

    /**
     * Initialize element pools for common UI components
     */
    initializeElementPools() {
        // Create pools for common UI elements
        this.performanceManager.createPool('answerButtons', UIFactories.answerButton, 8);
        this.performanceManager.createPool('notifications', UIFactories.notificationToast, 5);
        this.performanceManager.createPool('roomConnections', UIFactories.roomConnection, 10);
        this.performanceManager.createPool('progressBars', UIFactories.progressBar, 3);
        this.performanceManager.createPool('timers', UIFactories.timerDisplay, 2);
        
        console.log('📦 UI element pools initialized');
    }

    /**
     * Setup optimized update methods
     */
    setupOptimizedUpdates() {
        // Score update optimization
        this.optimizedUpdates.set('score', this.createScoreUpdater());
        
        // Room info update optimization
        this.optimizedUpdates.set('roomInfo', this.createRoomInfoUpdater());
        
        // Question display optimization
        this.optimizedUpdates.set('question', this.createQuestionUpdater());
        
        // Progress update optimization
        this.optimizedUpdates.set('progress', this.createProgressUpdater());
        
        // Timer update optimization
        this.optimizedUpdates.set('timer', this.createTimerUpdater());
    }

    /**
     * Create optimized score updater
     */
    createScoreUpdater() {
        let lastScore = null;
        let scoreElement = null;
        
        return (newScore) => {
            if (!scoreElement) {
                scoreElement = document.getElementById('current-score');
            }
            
            if (scoreElement && lastScore !== newScore) {
                this.performanceManager.batchDOMUpdate(
                    DOMUpdateTemplates.updateText(scoreElement, newScore.toString()),
                    1 // High priority
                );
                lastScore = newScore;
            }
        };
    }

    /**
     * Create optimized room info updater
     */
    createRoomInfoUpdater() {
        let lastRoomId = null;
        let elements = {};
        
        return (roomData) => {
            if (lastRoomId === roomData.id) return;
            
            if (!elements.name) {
                elements.name = document.getElementById('room-name');
                elements.description = document.getElementById('room-description');
                elements.connections = document.getElementById('room-connections');
            }
            
            const updates = [];
            
            if (elements.name) {
                updates.push(DOMUpdateTemplates.updateText(elements.name, roomData.name));
            }
            
            if (elements.description) {
                updates.push(DOMUpdateTemplates.updateText(elements.description, roomData.description));
            }
            
            if (elements.connections) {
                updates.push(() => this.updateRoomConnections(elements.connections, roomData.connections));
            }
            
            // Batch all room updates together
            updates.forEach(update => this.performanceManager.batchDOMUpdate(update, 2));
            
            lastRoomId = roomData.id;
        };
    }

    /**
     * Create optimized question updater
     */
    createQuestionUpdater() {
        let lastQuestionId = null;
        let elements = {};
        
        return (questionData) => {
            if (lastQuestionId === questionData.id) return;
            
            if (!elements.text) {
                elements.text = document.getElementById('question-text');
                elements.category = document.getElementById('question-category');
                elements.difficulty = document.getElementById('question-difficulty');
                elements.points = document.getElementById('question-points');
                elements.answers = document.getElementById('answer-buttons');
            }
            
            const updates = [];
            
            if (elements.text) {
                updates.push(DOMUpdateTemplates.updateText(elements.text, questionData.question));
            }
            
            if (elements.category) {
                updates.push(DOMUpdateTemplates.updateText(elements.category, questionData.category));
            }
            
            if (elements.difficulty) {
                updates.push(DOMUpdateTemplates.updateText(elements.difficulty, questionData.difficulty));
            }
            
            if (elements.points) {
                updates.push(DOMUpdateTemplates.updateText(elements.points, `${questionData.points} points`));
            }
            
            if (elements.answers) {
                updates.push(() => this.updateAnswerButtons(elements.answers, questionData.answers));
            }
            
            // Batch all question updates together
            updates.forEach(update => this.performanceManager.batchDOMUpdate(update, 1));
            
            lastQuestionId = questionData.id;
        };
    }

    /**
     * Create optimized progress updater
     */
    createProgressUpdater() {
        let lastProgress = {};
        let elements = {};
        
        return (progressData) => {
            const progressKey = JSON.stringify(progressData);
            if (lastProgress.key === progressKey) return;
            
            if (!elements.overall) {
                elements.overall = document.getElementById('overall-progress');
                elements.rooms = document.getElementById('rooms-progress');
                elements.questions = document.getElementById('questions-progress');
            }
            
            const updates = [];
            
            if (elements.overall && progressData.overall !== lastProgress.overall) {
                updates.push(DOMUpdateTemplates.updateProgress(
                    elements.overall, 
                    progressData.overall, 
                    `${Math.round(progressData.overall)}%`
                ));
            }
            
            if (elements.rooms && progressData.rooms !== lastProgress.rooms) {
                updates.push(DOMUpdateTemplates.updateProgress(
                    elements.rooms, 
                    progressData.rooms, 
                    `Rooms: ${progressData.roomsVisited}/${progressData.totalRooms}`
                ));
            }
            
            if (elements.questions && progressData.questions !== lastProgress.questions) {
                updates.push(DOMUpdateTemplates.updateProgress(
                    elements.questions, 
                    progressData.questions, 
                    `Questions: ${progressData.questionsAnswered}/${progressData.totalQuestions}`
                ));
            }
            
            // Batch progress updates
            updates.forEach(update => this.performanceManager.batchDOMUpdate(update, 2));
            
            lastProgress = { ...progressData, key: progressKey };
        };
    }

    /**
     * Create optimized timer updater
     */
    createTimerUpdater() {
        let lastTime = null;
        let timerElement = null;
        
        return (timeRemaining, totalTime) => {
            if (lastTime === timeRemaining) return;
            
            if (!timerElement) {
                timerElement = document.getElementById('question-timer');
            }
            
            if (timerElement) {
                this.performanceManager.batchDOMUpdate(
                    DOMUpdateTemplates.updateTimer(timerElement, timeRemaining, totalTime),
                    1 // High priority for timer updates
                );
                lastTime = timeRemaining;
            }
        };
    }

    /**
     * Optimized room connections update using element pooling
     */
    updateRoomConnections(container, connections) {
        // Clear existing connections
        container.innerHTML = '';
        
        connections.forEach(connection => {
            const connectionElement = this.performanceManager.acquireFromPool('roomConnections');
            const link = connectionElement.querySelector('.connection-link');
            
            link.textContent = connection.name;
            link.setAttribute('data-room-id', connection.id);
            link.setAttribute('aria-label', `Navigate to ${connection.name}`);
            
            if (connection.locked) {
                connectionElement.classList.add('locked');
                link.disabled = true;
            } else {
                connectionElement.classList.remove('locked');
                link.disabled = false;
                link.onclick = () => this.originalUI.moveToRoom(connection.id);
            }
            
            container.appendChild(connectionElement);
        });
    }

    /**
     * Optimized answer buttons update using element pooling
     */
    updateAnswerButtons(container, answers) {
        // Clear existing buttons
        container.innerHTML = '';
        
        answers.forEach((answer, index) => {
            const button = this.performanceManager.acquireFromPool('answerButtons');
            
            button.textContent = answer;
            button.setAttribute('data-answer-index', index);
            button.setAttribute('aria-label', `Answer option ${index + 1}: ${answer}`);
            button.onclick = () => this.originalUI.selectAnswer(index);
            
            container.appendChild(button);
        });
    }

    /**
     * Optimized notification system using element pooling
     */
    showOptimizedNotification(type, title, message, duration = 5000) {
        const notification = this.performanceManager.acquireFromPool('notifications');
        const icon = notification.querySelector('.toast-icon');
        const titleElement = notification.querySelector('.toast-title');
        const messageElement = notification.querySelector('.toast-message');
        
        // Configure notification
        notification.className = `notification-toast toast-${type}`;
        notification.setAttribute('data-type', type);
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            achievement: '🏆'
        };
        
        icon.textContent = icons[type] || icons.info;
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });
        
        // Auto-remove after duration
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.performanceManager.releaseToPool('notifications', notification);
            }, 300);
        }, duration);
    }

    /**
     * Optimized batch UI update method
     */
    updateUI(updates) {
        for (const [type, data] of Object.entries(updates)) {
            const updater = this.optimizedUpdates.get(type);
            if (updater) {
                updater(data);
            }
        }
    }

    /**
     * Delegate methods to original UI manager with optimization wrapper
     */
    updateScore(score) {
        const updater = this.optimizedUpdates.get('score');
        if (updater) {
            updater(score);
        } else {
            this.originalUI.updateScore(score);
        }
    }

    updateRoomInfo(roomData) {
        const updater = this.optimizedUpdates.get('roomInfo');
        if (updater) {
            updater(roomData);
        } else {
            this.originalUI.updateRoomInfo(roomData);
        }
    }

    updateQuestionDisplay(questionData) {
        const updater = this.optimizedUpdates.get('question');
        if (updater) {
            updater(questionData);
        } else {
            this.originalUI.updateQuestionDisplay(questionData);
        }
    }

    updateProgress(progressData) {
        const updater = this.optimizedUpdates.get('progress');
        if (updater) {
            updater(progressData);
        } else {
            this.originalUI.updateProgress(progressData);
        }
    }

    updateTimer(timeRemaining, totalTime) {
        const updater = this.optimizedUpdates.get('timer');
        if (updater) {
            updater(timeRemaining, totalTime);
        } else {
            this.originalUI.updateTimer(timeRemaining, totalTime);
        }
    }

    /**
     * Show notification with optimization
     */
    showNotification(type, title, message, duration) {
        this.showOptimizedNotification(type, title, message, duration);
    }

    /**
     * Cleanup and resource management
     */
    cleanup() {
        // Return all pooled elements
        ['answerButtons', 'notifications', 'roomConnections', 'progressBars', 'timers'].forEach(poolName => {
            const pool = this.performanceManager.objectPools.get(poolName);
            if (pool) {
                // Clear in-use items
                pool.inUse.clear();
                
                // Reset available items
                pool.available.forEach(item => {
                    if (typeof item.reset === 'function') {
                        item.reset();
                    }
                });
            }
        });
        
        // Clear update queue
        this.updateQueue.clear();
        this.batchScheduled = false;
        
        console.log('🧹 Enhanced UIManager cleanup completed');
    }

    /**
     * Get UI performance statistics
     */
    getUIPerformanceStats() {
        return {
            poolStats: ['answerButtons', 'notifications', 'roomConnections', 'progressBars', 'timers']
                .map(name => this.performanceManager.getPoolStats(name)),
            queuedUpdates: this.updateQueue.size,
            batchScheduled: this.batchScheduled,
            optimizedUpdaters: this.optimizedUpdates.size
        };
    }

    /**
     * Delegate all other methods to original UI manager
     */
    selectAnswer(index) {
        return this.originalUI.selectAnswer(index);
    }

    moveToRoom(roomId) {
        return this.originalUI.moveToRoom(roomId);
    }

    newQuestion() {
        return this.originalUI.newQuestion();
    }

    skipQuestion() {
        return this.originalUI.skipQuestion();
    }

    showHint() {
        return this.originalUI.showHint();
    }

    saveGame() {
        return this.originalUI.saveGame();
    }

    loadGame() {
        return this.originalUI.loadGame();
    }

    resetGame() {
        return this.originalUI.resetGame();
    }
}

// Export for use with existing codebase
if (typeof window !== 'undefined') {
    window.EnhancedUIManager = EnhancedUIManager;
}