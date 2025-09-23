/**
 * AchievementManager handles achievement tracking, progression monitoring, 
 * and unlock detection using browser-native APIs only
 */
class AchievementManager {
    constructor(dataLoader, gameState) {
        this.dataLoader = dataLoader;
        this.gameState = gameState;
        
        // Achievement tracking state
        this.achievements = new Map(); // All available achievements
        this.unlockedAchievements = new Set(); // Achievement IDs that are unlocked
        this.achievementProgress = new Map(); // Progress tracking for each achievement
        this.totalAchievementPoints = 0;
        
        // Performance tracking for achievements
        this.sessionStats = {
            correctAnswers: 0,
            totalQuestions: 0,
            quickAnswers: [], // Array of answer times for quick thinking tracking
            consecutiveCorrect: 0,
            consecutiveWrong: 0,
            maxConsecutiveCorrect: 0,
            roomsVisited: new Set(),
            startTime: Date.now(),
            lastAnswerTimes: [] // For tracking answer speed patterns
        };
        
        // Event listeners
        this.eventListeners = {};
        
        console.log('AchievementManager initialized');
        this.initialize();
    }

    /**
     * Initialize achievement system - load data and set up tracking
     */
    async initialize() {
        try {
            await this.loadAchievements();
            this.loadAchievementProgress();
            this.setupEventListeners();
            this.updateSessionStats();
            console.log(`Loaded ${this.achievements.size} achievements`);
        } catch (error) {
            console.error('Failed to initialize AchievementManager:', error);
        }
    }

    /**
     * Load achievement definitions from data file
     */
    async loadAchievements() {
        try {
            const gameData = this.dataLoader.getAllData();
            
            if (!gameData.achievements) {
                throw new Error('Achievement data not available. Ensure DataLoader.loadGameData() was called first.');
            }
            
            // Convert to Map for efficient lookups
            gameData.achievements.forEach(achievement => {
                this.achievements.set(achievement.id, {
                    ...achievement,
                    unlockedAt: null, // Timestamp when unlocked
                    progress: 0, // Current progress toward achievement
                    maxProgress: this.getMaxProgress(achievement) // Maximum progress needed
                });
            });
            
            console.log('Achievement definitions loaded:', this.achievements.size);
        } catch (error) {
            console.error('Failed to load achievements:', error);
            throw error;
        }
    }

    /**
     * Get maximum progress value for an achievement based on its condition
     */
    getMaxProgress(achievement) {
        const condition = achievement.condition;
        
        switch (condition.type) {
            case 'correct_answers':
            case 'total_questions':
            case 'rooms_visited':
            case 'quick_answers':
            case 'consecutive_correct':
                return condition.value;
            
            case 'accuracy_with_minimum':
                return condition.minQuestions;
            
            case 'comeback_correct':
                return condition.value; // Number of consecutive wrong answers needed
            
            case 'completion_time':
                return 1; // Binary achievement
            
            case 'all_rooms_visited':
            case 'game_completed':
            case 'game_completed_perfect':
            case 'specific_room_visited':
                return 1; // Binary achievements
            
            default:
                return 1;
        }
    }

    /**
     * Load saved achievement progress from localStorage
     */
    loadAchievementProgress() {
        try {
            const saved = localStorage.getItem('lobeLabyrinth_achievements');
            if (saved) {
                const data = JSON.parse(saved);
                
                // Restore unlocked achievements
                if (data.unlockedAchievements) {
                    this.unlockedAchievements = new Set(data.unlockedAchievements);
                    
                    // Update achievement objects with unlock data
                    this.unlockedAchievements.forEach(achievementId => {
                        const achievement = this.achievements.get(achievementId);
                        if (achievement) {
                            achievement.unlocked = true;
                            achievement.unlockedAt = data.unlockTimes?.[achievementId] || Date.now();
                        }
                    });
                }
                
                // Restore progress tracking
                if (data.achievementProgress) {
                    this.achievementProgress = new Map(Object.entries(data.achievementProgress));
                }
                
                // Restore total points
                this.totalAchievementPoints = data.totalPoints || 0;
                
                console.log(`Loaded ${this.unlockedAchievements.size} unlocked achievements`);
            }
        } catch (error) {
            console.error('Failed to load achievement progress:', error);
        }
    }

    /**
     * Save achievement progress to localStorage
     */
    saveAchievementProgress() {
        try {
            const unlockTimes = {};
            this.achievements.forEach((achievement, id) => {
                if (achievement.unlocked && achievement.unlockedAt) {
                    unlockTimes[id] = achievement.unlockedAt;
                }
            });
            
            const data = {
                unlockedAchievements: Array.from(this.unlockedAchievements),
                achievementProgress: Object.fromEntries(this.achievementProgress),
                totalPoints: this.totalAchievementPoints,
                unlockTimes: unlockTimes,
                lastSaved: Date.now()
            };
            
            localStorage.setItem('lobeLabyrinth_achievements', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save achievement progress:', error);
        }
    }

    /**
     * Set up event listeners for game state changes
     */
    setupEventListeners() {
        // Listen for question answers
        this.gameState.addEventListener('questionAnswered', (event) => {
            this.handleQuestionAnswered(event.detail);
        });
        
        // Listen for room changes
        this.gameState.addEventListener('roomChanged', (event) => {
            this.handleRoomChanged(event.detail);
        });
        
        // Listen for game completion
        this.gameState.addEventListener('gameCompleted', (event) => {
            this.handleGameCompleted(event.detail);
        });
        
        console.log('Achievement event listeners set up');
    }

    /**
     * Update session stats from current game state
     */
    updateSessionStats() {
        const gameSnapshot = this.gameState.getStateSnapshot();
        
        this.sessionStats.roomsVisited = new Set(gameSnapshot.visitedRooms);
        this.sessionStats.totalQuestions = gameSnapshot.answeredQuestions.length;
        
        // Calculate correct answers from game state
        // Note: This is a simplified calculation - in a real implementation,
        // we'd track this more precisely through events
        this.sessionStats.correctAnswers = Math.floor(gameSnapshot.score / 50); // Rough estimate
    }

    /**
     * Handle question answered event
     */
    handleQuestionAnswered(eventData) {
        const { isCorrect, timeElapsed, pointsEarned } = eventData;
        
        // Update session statistics
        this.sessionStats.totalQuestions++;
        
        if (isCorrect) {
            this.sessionStats.correctAnswers++;
            this.sessionStats.consecutiveCorrect++;
            this.sessionStats.consecutiveWrong = 0;
            this.sessionStats.maxConsecutiveCorrect = Math.max(
                this.sessionStats.maxConsecutiveCorrect,
                this.sessionStats.consecutiveCorrect
            );
            
            // Track quick answers (under 10 seconds)
            if (timeElapsed && timeElapsed < 10000) {
                this.sessionStats.quickAnswers.push(timeElapsed);
            }
        } else {
            this.sessionStats.consecutiveCorrect = 0;
            this.sessionStats.consecutiveWrong++;
        }
        
        // Track recent answer times for patterns
        this.sessionStats.lastAnswerTimes.push({
            time: Date.now(),
            elapsed: timeElapsed,
            correct: isCorrect
        });
        
        // Keep only last 10 answers for pattern detection
        if (this.sessionStats.lastAnswerTimes.length > 10) {
            this.sessionStats.lastAnswerTimes.shift();
        }
        
        // Check for achievement unlocks
        this.checkAchievementUnlocks();
    }

    /**
     * Handle room changed event
     */
    handleRoomChanged(eventData) {
        const { to: roomId } = eventData;
        
        this.sessionStats.roomsVisited.add(roomId);
        
        // Check for achievement unlocks
        this.checkAchievementUnlocks();
    }

    /**
     * Handle game completed event
     */
    handleGameCompleted(eventData) {
        // Check for completion-based achievements
        this.checkAchievementUnlocks();
    }

    /**
     * Check all achievements for unlock conditions
     */
    checkAchievementUnlocks() {
        this.achievements.forEach((achievement, achievementId) => {
            if (!achievement.unlocked) {
                const shouldUnlock = this.checkAchievementCondition(achievement);
                if (shouldUnlock) {
                    this.unlockAchievement(achievementId);
                } else {
                    // Update progress even if not unlocked
                    this.updateAchievementProgress(achievementId, achievement);
                }
            }
        });
    }

    /**
     * Check if a specific achievement condition is met
     */
    checkAchievementCondition(achievement) {
        const condition = achievement.condition;
        const gameSnapshot = this.gameState.getStateSnapshot();
        
        switch (condition.type) {
            case 'correct_answers':
                return this.sessionStats.correctAnswers >= condition.value;
            
            case 'total_questions':
                return this.sessionStats.totalQuestions >= condition.value;
            
            case 'rooms_visited':
                return this.sessionStats.roomsVisited.size >= condition.value;
            
            case 'quick_answers':
                const quickCount = this.sessionStats.quickAnswers.filter(
                    time => time < (condition.timeLimit || 10) * 1000
                ).length;
                return quickCount >= condition.value;
            
            case 'consecutive_correct':
                return this.sessionStats.maxConsecutiveCorrect >= condition.value;
            
            case 'comeback_correct':
                // Check if player answered correctly after 3+ consecutive wrong answers
                if (this.sessionStats.lastAnswerTimes.length >= condition.value + 1) {
                    const recent = this.sessionStats.lastAnswerTimes.slice(-(condition.value + 1));
                    const wrongAnswers = recent.slice(0, -1).every(answer => !answer.correct);
                    const finalCorrect = recent[recent.length - 1].correct;
                    return wrongAnswers && finalCorrect;
                }
                return false;
            
            case 'accuracy_with_minimum':
                if (this.sessionStats.totalQuestions >= condition.minQuestions) {
                    const accuracy = this.sessionStats.correctAnswers / this.sessionStats.totalQuestions;
                    return accuracy >= condition.accuracy;
                }
                return false;
            
            case 'completion_time':
                if (gameSnapshot.gameCompleted) {
                    const playTime = Date.now() - this.sessionStats.startTime;
                    return playTime <= condition.value;
                }
                return false;
            
            case 'all_rooms_visited':
                // Check if all rooms are visited (assuming we know total room count)
                return this.sessionStats.roomsVisited.size >= 6; // Adjust based on actual room count
            
            case 'specific_room_visited':
                return this.sessionStats.roomsVisited.has(condition.value);
            
            case 'game_completed':
                return gameSnapshot.gameCompleted;
            
            case 'game_completed_perfect':
                return gameSnapshot.gameCompleted && this.sessionStats.roomsVisited.size >= 6;
            
            default:
                console.warn('Unknown achievement condition type:', condition.type);
                return false;
        }
    }

    /**
     * Update progress for a specific achievement
     */
    updateAchievementProgress(achievementId, achievement) {
        let currentProgress = 0;
        const condition = achievement.condition;
        
        switch (condition.type) {
            case 'correct_answers':
                currentProgress = this.sessionStats.correctAnswers;
                break;
            case 'total_questions':
                currentProgress = this.sessionStats.totalQuestions;
                break;
            case 'rooms_visited':
                currentProgress = this.sessionStats.roomsVisited.size;
                break;
            case 'quick_answers':
                currentProgress = this.sessionStats.quickAnswers.filter(
                    time => time < (condition.timeLimit || 10) * 1000
                ).length;
                break;
            case 'consecutive_correct':
                currentProgress = this.sessionStats.maxConsecutiveCorrect;
                break;
            case 'accuracy_with_minimum':
                currentProgress = this.sessionStats.totalQuestions;
                break;
            default:
                currentProgress = 0;
        }
        
        this.achievementProgress.set(achievementId, Math.min(currentProgress, achievement.maxProgress));
        achievement.progress = this.achievementProgress.get(achievementId);
    }

    /**
     * Unlock a specific achievement
     */
    unlockAchievement(achievementId) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || achievement.unlocked) {
            return;
        }
        
        // Mark as unlocked
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        this.unlockedAchievements.add(achievementId);
        
        // Add points to total
        this.totalAchievementPoints += achievement.points;
        
        // Save progress
        this.saveAchievementProgress();
        
        // Emit unlock event
        this.emit('achievementUnlocked', {
            achievement: achievement,
            totalPoints: this.totalAchievementPoints,
            unlockedCount: this.unlockedAchievements.size
        });
        
        console.log(`🏆 Achievement unlocked: ${achievement.name} (+${achievement.points} points)`);
    }

    /**
     * Get all achievements with their current status
     */
    getAllAchievements() {
        return Array.from(this.achievements.values()).map(achievement => ({
            ...achievement,
            progressPercentage: (achievement.progress / achievement.maxProgress) * 100
        }));
    }

    /**
     * Get achievements by category
     */
    getAchievementsByCategory(category) {
        return this.getAllAchievements().filter(achievement => 
            achievement.category === category
        );
    }

    /**
     * Get unlocked achievements
     */
    getUnlockedAchievements() {
        return this.getAllAchievements().filter(achievement => achievement.unlocked);
    }

    /**
     * Get achievements in progress (not unlocked but with some progress)
     */
    getAchievementsInProgress() {
        return this.getAllAchievements().filter(achievement => 
            !achievement.unlocked && achievement.progress > 0
        );
    }

    /**
     * Get achievement statistics
     */
    getAchievementStats() {
        const total = this.achievements.size;
        const unlocked = this.unlockedAchievements.size;
        const percentage = total > 0 ? (unlocked / total) * 100 : 0;
        
        return {
            total,
            unlocked,
            percentage: Math.round(percentage * 10) / 10,
            totalPoints: this.totalAchievementPoints,
            categories: this.getCategoryStats()
        };
    }

    /**
     * Get statistics by category
     */
    getCategoryStats() {
        const categories = {};
        
        this.achievements.forEach(achievement => {
            const category = achievement.category;
            if (!categories[category]) {
                categories[category] = { total: 0, unlocked: 0 };
            }
            
            categories[category].total++;
            if (achievement.unlocked) {
                categories[category].unlocked++;
            }
        });
        
        // Calculate percentages
        Object.keys(categories).forEach(category => {
            const stats = categories[category];
            stats.percentage = stats.total > 0 ? (stats.unlocked / stats.total) * 100 : 0;
        });
        
        return categories;
    }

    /**
     * Reset all achievement progress (for new game)
     */
    resetAchievements() {
        this.unlockedAchievements.clear();
        this.achievementProgress.clear();
        this.totalAchievementPoints = 0;
        
        // Reset achievement objects
        this.achievements.forEach(achievement => {
            achievement.unlocked = false;
            achievement.unlockedAt = null;
            achievement.progress = 0;
        });
        
        // Reset session stats
        this.sessionStats = {
            correctAnswers: 0,
            totalQuestions: 0,
            quickAnswers: [],
            consecutiveCorrect: 0,
            consecutiveWrong: 0,
            maxConsecutiveCorrect: 0,
            roomsVisited: new Set(),
            startTime: Date.now(),
            lastAnswerTimes: []
        };
        
        // Clear saved data
        localStorage.removeItem('lobeLabyrinth_achievements');
        
        console.log('Achievement progress reset');
        this.emit('achievementsReset', {});
    }

    /**
     * Event system methods
     */
    addEventListener(eventType, callback) {
        if (!this.eventListeners[eventType]) {
            this.eventListeners[eventType] = [];
        }
        this.eventListeners[eventType].push(callback);
    }

    removeEventListener(eventType, callback) {
        if (this.eventListeners[eventType]) {
            const index = this.eventListeners[eventType].indexOf(callback);
            if (index > -1) {
                this.eventListeners[eventType].splice(index, 1);
            }
        }
    }

    emit(eventType, data) {
        if (this.eventListeners[eventType]) {
            this.eventListeners[eventType].forEach(callback => {
                try {
                    callback({ detail: data });
                } catch (error) {
                    console.error(`Error in ${eventType} event listener:`, error);
                }
            });
        }
    }

    /**
     * Get debug information for troubleshooting
     */
    getDebugInfo() {
        return {
            achievementCount: this.achievements.size,
            unlockedCount: this.unlockedAchievements.size,
            sessionStats: this.sessionStats,
            achievementProgress: Object.fromEntries(this.achievementProgress),
            totalPoints: this.totalAchievementPoints
        };
    }
}

// Export for module systems or make globally available
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AchievementManager;
} else if (typeof window !== 'undefined') {
    window.AchievementManager = AchievementManager;
}