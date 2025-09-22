/**
 * LearningAnalytics class provides comprehensive educational progress tracking
 * and intelligent insights for the LobeLabyrinth game
 */
class LearningAnalytics {
    constructor(gameState = null) {
        this.gameState = gameState;
        
        // Session tracking
        this.sessionData = {
            startTime: Date.now(),
            sessionId: this.generateSessionId(),
            questionPatterns: new Map(),
            difficultyProgression: [],
            hintUsage: [],
            errorPatterns: [],
            timePatterns: [],
            categoryPerformance: new Map(),
            streakData: {
                current: 0,
                longest: 0,
                type: null // 'correct' or 'incorrect'
            }
        };
        
        // Learning metrics
        this.learningMetrics = {
            masteryThreshold: 0.8,        // 80% accuracy for mastery
            improvementThreshold: 0.15,   // 15% improvement threshold
            consistencyThreshold: 0.7,    // 70% consistency threshold
            velocityWindow: 10            // Questions to analyze for velocity
        };
        
        // Insights cache
        this.lastInsights = null;
        this.insightsVersion = 0;
        
        this.loadPersistentData();
        this.setupPerformanceObserver();
        
        console.log('📊 LearningAnalytics initialized - Advanced educational tracking active');
    }

    /**
     * Generate unique session ID
     * @returns {string} Unique session identifier
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Load persistent analytics data from localStorage
     */
    loadPersistentData() {
        try {
            const saved = localStorage.getItem('lobeLabyrinth_analytics');
            if (saved) {
                const data = JSON.parse(saved);
                this.historicalData = data.historicalData || [];
                this.longtermPatterns = data.longtermPatterns || {};
                this.learnerProfile = data.learnerProfile || this.createDefaultProfile();
            } else {
                this.historicalData = [];
                this.longtermPatterns = {};
                this.learnerProfile = this.createDefaultProfile();
            }
        } catch (error) {
            console.warn('Failed to load learning analytics data:', error);
            this.historicalData = [];
            this.longtermPatterns = {};
            this.learnerProfile = this.createDefaultProfile();
        }
    }

    /**
     * Create default learner profile
     * @returns {object} Default profile structure
     */
    createDefaultProfile() {
        return {
            preferredLearningSpeed: 'medium',
            strongCategories: [],
            improvementAreas: [],
            motivationTriggers: [],
            totalQuestionsAnswered: 0,
            averageAccuracy: 0,
            longestStreak: 0,
            createdAt: Date.now()
        };
    }

    /**
     * Setup performance observer for timing analytics
     */
    setupPerformanceObserver() {
        if (!('PerformanceObserver' in window)) {
            console.warn('PerformanceObserver not supported');
            return;
        }

        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name.includes('question') || entry.name.includes('answer')) {
                        this.trackPerformanceMetric(entry);
                    }
                }
            });
            
            observer.observe({ entryTypes: ['measure', 'navigation'] });
        } catch (error) {
            console.warn('Performance observer setup failed:', error);
        }
    }

    /**
     * Track performance metric from PerformanceEntry
     * @param {PerformanceEntry} entry - Performance entry
     */
    trackPerformanceMetric(entry) {
        this.sessionData.timePatterns.push({
            timestamp: Date.now(),
            duration: entry.duration,
            type: entry.name,
            detail: entry.detail || {}
        });
    }

    /**
     * Track question response and analyze patterns
     * @param {object} questionData - Question response data
     */
    trackQuestionResponse(questionData) {
        const {
            questionId,
            category,
            difficulty,
            isCorrect,
            timeSpent,
            hintsUsed,
            attemptsCount,
            userAnswer,
            correctAnswer
        } = questionData;

        // Update session data
        const pattern = {
            questionId,
            category,
            difficulty,
            isCorrect,
            timeSpent,
            hintsUsed,
            attemptsCount,
            timestamp: Date.now()
        };

        this.sessionData.questionPatterns.set(questionId, pattern);
        this.sessionData.difficultyProgression.push(difficulty);
        
        if (hintsUsed > 0) {
            this.sessionData.hintUsage.push({
                questionId,
                hintsUsed,
                difficulty,
                timestamp: Date.now()
            });
        }

        // Track error patterns for incorrect answers
        if (!isCorrect) {
            this.sessionData.errorPatterns.push({
                questionId,
                category,
                difficulty,
                userAnswer,
                correctAnswer,
                timestamp: Date.now()
            });
        }

        // Update category performance
        if (!this.sessionData.categoryPerformance.has(category)) {
            this.sessionData.categoryPerformance.set(category, {
                total: 0,
                correct: 0,
                totalTime: 0,
                averageTime: 0
            });
        }

        const categoryStats = this.sessionData.categoryPerformance.get(category);
        categoryStats.total++;
        categoryStats.totalTime += timeSpent;
        categoryStats.averageTime = categoryStats.totalTime / categoryStats.total;
        
        if (isCorrect) {
            categoryStats.correct++;
        }

        // Update streak data
        this.updateStreakData(isCorrect);

        // Update learner profile
        this.updateLearnerProfile(pattern);

        console.log(`📈 Tracked response: ${category} (${difficulty}) - ${isCorrect ? 'Correct' : 'Incorrect'}`);
    }

    /**
     * Update streak tracking
     * @param {boolean} isCorrect - Whether the answer was correct
     */
    updateStreakData(isCorrect) {
        if (isCorrect) {
            if (this.sessionData.streakData.type === 'correct') {
                this.sessionData.streakData.current++;
            } else {
                this.sessionData.streakData.current = 1;
                this.sessionData.streakData.type = 'correct';
            }
            
            if (this.sessionData.streakData.current > this.sessionData.streakData.longest) {
                this.sessionData.streakData.longest = this.sessionData.streakData.current;
                this.learnerProfile.longestStreak = Math.max(
                    this.learnerProfile.longestStreak, 
                    this.sessionData.streakData.longest
                );
            }
        } else {
            if (this.sessionData.streakData.type === 'incorrect') {
                this.sessionData.streakData.current++;
            } else {
                this.sessionData.streakData.current = 1;
                this.sessionData.streakData.type = 'incorrect';
            }
        }
    }

    /**
     * Update long-term learner profile
     * @param {object} pattern - Question response pattern
     */
    updateLearnerProfile(pattern) {
        this.learnerProfile.totalQuestionsAnswered++;
        
        // Recalculate average accuracy
        const totalCorrect = Array.from(this.sessionData.questionPatterns.values())
            .filter(p => p.isCorrect).length;
        this.learnerProfile.averageAccuracy = totalCorrect / this.sessionData.questionPatterns.size;

        // Update category strengths/weaknesses
        this.updateCategoryAssessment(pattern);
        
        // Determine learning speed preference
        this.updateLearningSpeedPreference(pattern);
    }

    /**
     * Update category strength/weakness assessment
     * @param {object} pattern - Question response pattern
     */
    updateCategoryAssessment(pattern) {
        const categoryStats = this.sessionData.categoryPerformance.get(pattern.category);
        const accuracy = categoryStats.correct / categoryStats.total;
        
        if (accuracy >= this.learningMetrics.masteryThreshold && categoryStats.total >= 3) {
            if (!this.learnerProfile.strongCategories.includes(pattern.category)) {
                this.learnerProfile.strongCategories.push(pattern.category);
            }
            // Remove from improvement areas if present
            this.learnerProfile.improvementAreas = this.learnerProfile.improvementAreas
                .filter(cat => cat !== pattern.category);
        } else if (accuracy < 0.5 && categoryStats.total >= 3) {
            if (!this.learnerProfile.improvementAreas.includes(pattern.category)) {
                this.learnerProfile.improvementAreas.push(pattern.category);
            }
            // Remove from strong categories if present
            this.learnerProfile.strongCategories = this.learnerProfile.strongCategories
                .filter(cat => cat !== pattern.category);
        }
    }

    /**
     * Update learning speed preference based on time patterns
     * @param {object} pattern - Question response pattern
     */
    updateLearningSpeedPreference(pattern) {
        const recentPatterns = Array.from(this.sessionData.questionPatterns.values())
            .slice(-this.learningMetrics.velocityWindow);
        
        if (recentPatterns.length >= 5) {
            const averageTime = recentPatterns.reduce((sum, p) => sum + p.timeSpent, 0) / recentPatterns.length;
            
            if (averageTime < 15000) { // Less than 15 seconds
                this.learnerProfile.preferredLearningSpeed = 'fast';
            } else if (averageTime > 45000) { // More than 45 seconds
                this.learnerProfile.preferredLearningSpeed = 'slow';
            } else {
                this.learnerProfile.preferredLearningSpeed = 'medium';
            }
        }
    }

    /**
     * Calculate learning velocity and trends
     * @returns {object} Learning velocity metrics
     */
    calculateLearningVelocity() {
        const patterns = Array.from(this.sessionData.questionPatterns.values());
        if (patterns.length < this.learningMetrics.velocityWindow) {
            return { velocity: 0, trend: 'insufficient_data', confidence: 0 };
        }

        const recentPatterns = patterns.slice(-this.learningMetrics.velocityWindow);
        const firstHalf = recentPatterns.slice(0, Math.floor(recentPatterns.length / 2));
        const secondHalf = recentPatterns.slice(Math.floor(recentPatterns.length / 2));

        const firstHalfAccuracy = firstHalf.filter(p => p.isCorrect).length / firstHalf.length;
        const secondHalfAccuracy = secondHalf.filter(p => p.isCorrect).length / secondHalf.length;

        const velocityChange = secondHalfAccuracy - firstHalfAccuracy;
        
        let trend = 'stable';
        if (velocityChange > this.learningMetrics.improvementThreshold) {
            trend = 'improving';
        } else if (velocityChange < -this.learningMetrics.improvementThreshold) {
            trend = 'declining';
        }

        return {
            velocity: velocityChange,
            trend,
            confidence: Math.min(recentPatterns.length / this.learningMetrics.velocityWindow, 1),
            currentAccuracy: secondHalfAccuracy,
            previousAccuracy: firstHalfAccuracy
        };
    }

    /**
     * Generate comprehensive learning insights
     * @returns {object} Learning insights and recommendations
     */
    generateLearningInsights() {
        const velocity = this.calculateLearningVelocity();
        const sessionStats = this.getSessionStatistics();
        const strengths = this.identifyStrengthsAndWeaknesses();
        const recommendations = this.generateRecommendations();

        const insights = {
            sessionId: this.sessionData.sessionId,
            timestamp: Date.now(),
            velocity,
            sessionStats,
            strengths,
            recommendations,
            motivationalMessage: this.generateMotivationalMessage(velocity, sessionStats)
        };

        this.lastInsights = insights;
        this.insightsVersion++;

        return insights;
    }

    /**
     * Get current session statistics
     * @returns {object} Session statistics
     */
    getSessionStatistics() {
        const patterns = Array.from(this.sessionData.questionPatterns.values());
        const totalQuestions = patterns.length;
        const correctAnswers = patterns.filter(p => p.isCorrect).length;
        const accuracy = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;

        const totalTime = patterns.reduce((sum, p) => sum + p.timeSpent, 0);
        const averageTimePerQuestion = totalQuestions > 0 ? totalTime / totalQuestions : 0;

        const categories = Array.from(this.sessionData.categoryPerformance.entries());
        const hintsUsed = this.sessionData.hintUsage.reduce((sum, h) => sum + h.hintsUsed, 0);

        return {
            totalQuestions,
            correctAnswers,
            accuracy: Math.round(accuracy * 100),
            averageTimePerQuestion: Math.round(averageTimePerQuestion / 1000), // Convert to seconds
            categoriesCovered: categories.length,
            hintsUsed,
            currentStreak: this.sessionData.streakData.current,
            longestStreak: this.sessionData.streakData.longest,
            sessionDuration: Math.round((Date.now() - this.sessionData.startTime) / 1000 / 60) // minutes
        };
    }

    /**
     * Identify learning strengths and weaknesses
     * @returns {object} Strengths and weaknesses analysis
     */
    identifyStrengthsAndWeaknesses() {
        const categoryPerformance = Array.from(this.sessionData.categoryPerformance.entries())
            .map(([category, stats]) => ({
                category,
                accuracy: stats.correct / stats.total,
                averageTime: stats.averageTime,
                questionsAnswered: stats.total
            }))
            .filter(cat => cat.questionsAnswered >= 2); // Only consider categories with at least 2 questions

        const strengths = categoryPerformance
            .filter(cat => cat.accuracy >= this.learningMetrics.masteryThreshold)
            .sort((a, b) => b.accuracy - a.accuracy);

        const weaknesses = categoryPerformance
            .filter(cat => cat.accuracy < 0.6)
            .sort((a, b) => a.accuracy - b.accuracy);

        return { strengths, weaknesses };
    }

    /**
     * Generate personalized recommendations
     * @returns {array} Array of recommendation objects
     */
    generateRecommendations() {
        const recommendations = [];
        const velocity = this.calculateLearningVelocity();
        const sessionStats = this.getSessionStatistics();
        const strengths = this.identifyStrengthsAndWeaknesses();

        // Accuracy-based recommendations
        if (sessionStats.accuracy < 60) {
            recommendations.push({
                type: 'improvement',
                priority: 'high',
                title: 'Focus on Understanding',
                message: 'Consider taking more time to read questions carefully and use hints when needed.',
                icon: '📚'
            });
        }

        // Speed-based recommendations
        if (sessionStats.averageTimePerQuestion > 60) {
            recommendations.push({
                type: 'efficiency',
                priority: 'medium',
                title: 'Boost Your Confidence',
                message: 'You\'re being thorough! Try trusting your first instinct more often.',
                icon: '⚡'
            });
        }

        // Streak-based recommendations
        if (sessionStats.currentStreak >= 5) {
            recommendations.push({
                type: 'challenge',
                priority: 'low',
                title: 'Challenge Yourself',
                message: 'Great streak! Consider trying harder difficulty levels.',
                icon: '🏆'
            });
        }

        // Weakness-based recommendations
        if (strengths.weaknesses.length > 0) {
            const weakestCategory = strengths.weaknesses[0];
            recommendations.push({
                type: 'focus',
                priority: 'high',
                title: `Strengthen ${weakestCategory.category}`,
                message: `Spend extra time practicing ${weakestCategory.category} questions.`,
                icon: '🎯'
            });
        }

        // Velocity-based recommendations
        if (velocity.trend === 'improving') {
            recommendations.push({
                type: 'motivation',
                priority: 'low',
                title: 'Keep It Up!',
                message: 'Your performance is improving! You\'re on the right track.',
                icon: '📈'
            });
        } else if (velocity.trend === 'declining') {
            recommendations.push({
                type: 'adjustment',
                priority: 'medium',
                title: 'Take a Break',
                message: 'Consider taking a short break to recharge your focus.',
                icon: '☕'
            });
        }

        return recommendations.slice(0, 3); // Limit to top 3 recommendations
    }

    /**
     * Generate motivational message based on performance
     * @param {object} velocity - Learning velocity data
     * @param {object} sessionStats - Session statistics
     * @returns {string} Motivational message
     */
    generateMotivationalMessage(velocity, sessionStats) {
        const messages = {
            excellent: [
                "🏆 Outstanding work! You're mastering this material with excellence!",
                "⭐ Brilliant performance! Your dedication is truly paying off!",
                "🎉 Exceptional job! You're setting a great example of learning!"
            ],
            good: [
                "👏 Great job! You're making solid progress on your learning journey!",
                "💪 Well done! Your consistent effort is showing great results!",
                "🌟 Nice work! You're building strong knowledge foundations!"
            ],
            improving: [
                "📈 You're improving! Every question helps you grow stronger!",
                "🚀 Progress detected! Your persistence is starting to pay off!",
                "💡 Getting better! Each attempt brings you closer to mastery!"
            ],
            encouraging: [
                "🌱 Learning takes time! Every expert was once a beginner!",
                "💝 Keep going! Mistakes are stepping stones to understanding!",
                "🔥 Stay determined! Your effort today builds tomorrow's success!"
            ]
        };

        let category = 'encouraging';
        
        if (sessionStats.accuracy >= 85 && velocity.trend === 'improving') {
            category = 'excellent';
        } else if (sessionStats.accuracy >= 70 || velocity.trend === 'improving') {
            category = 'good';
        } else if (velocity.trend === 'improving' || sessionStats.accuracy >= 50) {
            category = 'improving';
        }

        const categoryMessages = messages[category];
        return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
    }

    /**
     * Save analytics data to localStorage
     */
    saveAnalyticsData() {
        try {
            const dataToSave = {
                historicalData: this.historicalData,
                longtermPatterns: this.longtermPatterns,
                learnerProfile: this.learnerProfile,
                lastUpdated: Date.now()
            };

            localStorage.setItem('lobeLabyrinth_analytics', JSON.stringify(dataToSave));
            console.log('📊 Learning analytics data saved');
        } catch (error) {
            console.error('Failed to save learning analytics data:', error);
        }
    }

    /**
     * End current session and archive data
     */
    endSession() {
        const sessionSummary = {
            sessionId: this.sessionData.sessionId,
            startTime: this.sessionData.startTime,
            endTime: Date.now(),
            duration: Date.now() - this.sessionData.startTime,
            totalQuestions: this.sessionData.questionPatterns.size,
            insights: this.lastInsights,
            finalStats: this.getSessionStatistics()
        };

        this.historicalData.push(sessionSummary);
        this.saveAnalyticsData();

        console.log('📋 Session ended and archived:', this.sessionData.sessionId);
        return sessionSummary;
    }

    /**
     * Get learning analytics summary for external use
     * @returns {object} Analytics summary
     */
    getAnalyticsSummary() {
        return {
            sessionStats: this.getSessionStatistics(),
            learnerProfile: this.learnerProfile,
            lastInsights: this.lastInsights,
            sessionData: {
                questionsAnswered: this.sessionData.questionPatterns.size,
                categoriesCovered: this.sessionData.categoryPerformance.size,
                sessionDuration: Date.now() - this.sessionData.startTime
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LearningAnalytics;
} else if (typeof window !== 'undefined') {
    window.LearningAnalytics = LearningAnalytics;
}