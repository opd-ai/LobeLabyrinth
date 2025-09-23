/**
 * QuizEngine class handles question presentation, answer validation,
 * scoring, timing, and question selection logic
 */
class QuizEngine {
    constructor(dataLoader, gameState) {
        this.dataLoader = dataLoader;
        this.gameState = gameState;
        
        this.currentQuestion = null;
        this.timerAnimationId = null; // For requestAnimationFrame timer
        this.questionTimeLimit = 30000; // 30 seconds per question
        this.questionStartTime = null;
        this.timeRemaining = 0;
        this.processingAnswer = false; // Prevent concurrent answer processing
        
        // Secure storage for original question data (basic obfuscation)
        this.questionAnswerMap = new Map(); // Store original correct answers
        
        // Question selection state
        this.questionHistory = new Set();
        this.categoryQuestions = new Map();
        this.shuffledQuestions = [];
        
        // Event system
        this.eventListeners = {};
        
        console.log('QuizEngine initialized - call initializeQuestionPool() after instantiation');
    }

    /**
     * Initialize and categorize the question pool
     */
    async initializeQuestionPool() {
        try {
            const gameData = await this.dataLoader.loadGameData();
            this.allQuestions = gameData.questions;
            
            // Categorize questions
            this.categorizeQuestions();
            
            // Shuffle questions for random selection
            this.shuffleQuestionPool();
            
            console.log(`Question pool initialized: ${this.allQuestions.length} questions across ${this.categoryQuestions.size} categories`);
        } catch (error) {
            console.error('Failed to initialize question pool:', error);
        }
    }

    /**
     * Categorize questions by subject/category
     */
    categorizeQuestions() {
        this.categoryQuestions.clear();
        
        this.allQuestions.forEach(question => {
            const category = question.category || 'general';
            if (!this.categoryQuestions.has(category)) {
                this.categoryQuestions.set(category, []);
            }
            this.categoryQuestions.get(category).push(question);
        });
    }

    /**
     * Shuffle the question pool for random selection
     */
    shuffleQuestionPool() {
        this.shuffledQuestions = [...this.allQuestions];
        for (let i = this.shuffledQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffledQuestions[i], this.shuffledQuestions[j]] = 
            [this.shuffledQuestions[j], this.shuffledQuestions[i]];
        }
    }

    /**
     * Get next question based on current room and player progress
     */
    async getNextQuestion(preferredCategory = null) {
        try {
            // Filter out already answered questions
            const availableQuestions = this.shuffledQuestions.filter(q => 
                !this.gameState.answeredQuestions.has(q.id)
            );

            if (availableQuestions.length === 0) {
                // Reshuffle if all questions answered
                this.shuffleQuestionPool();
                console.log('All questions answered, reshuffling pool');
            }

            let selectedQuestion = null;

            // Try to select from preferred category first
            if (preferredCategory && this.categoryQuestions.has(preferredCategory)) {
                const categoryQuestions = this.categoryQuestions.get(preferredCategory)
                    .filter(q => !this.gameState.answeredQuestions.has(q.id));
                
                if (categoryQuestions.length > 0) {
                    selectedQuestion = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
                }
            }

            // Fall back to random selection if no category preference or category exhausted
            if (!selectedQuestion && availableQuestions.length > 0) {
                selectedQuestion = availableQuestions[0]; // Take first from shuffled array
            }

            return selectedQuestion;
        } catch (error) {
            console.error('Error selecting next question:', error);
            return null;
        }
    }

    /**
     * Present a question to the player
     */
    async presentQuestion(questionId = null, category = null) {
        try {
            let question;
            
            if (questionId) {
                question = await this.dataLoader.getQuestion(questionId);
            } else {
                question = await this.getNextQuestion(category);
            }

            if (!question) {
                throw new Error('No questions available');
            }

            this.currentQuestion = question;
            this.questionStartTime = Date.now();
            this.timeRemaining = this.questionTimeLimit;
            
            // Store original correct answer securely (basic obfuscation)
            this.questionAnswerMap.set(question.id, {
                correctAnswer: question.correctAnswer,
                shuffledCorrectIndex: null // Will be set after shuffling
            });
            
            // Start the countdown timer
            this.startQuestionTimer();
            
            // Shuffle answers for this presentation
            const shuffledAnswers = this.shuffleAnswers(question);
            
            // Update stored correct index after shuffling
            this.questionAnswerMap.get(question.id).shuffledCorrectIndex = shuffledAnswers.correctIndex;
            
            // Generate answer hash for validation (basic obfuscation)
            const answerHash = this.generateAnswerHash(question.id, shuffledAnswers.correctIndex);
            
            const questionData = {
                ...question,
                answers: shuffledAnswers.answers,
                // Remove correctAnswer from client-side data
                correctAnswer: undefined,
                correctAnswerIndex: undefined,
                answerHash: answerHash,
                timeLimit: this.questionTimeLimit,
                startTime: this.questionStartTime
            };

            console.log(`Presenting question: ${question.question}`);
            this.emit('questionPresented', questionData);
            
            return questionData;
        } catch (error) {
            console.error('Failed to present question:', error);
            this.emit('error', { type: 'presentation', message: error.message });
            throw error;
        }
    }

    /**
     * Shuffle answer options while tracking correct answer position
     */
    shuffleAnswers(question) {
        const answers = [...question.answers];
        const correctAnswer = answers[question.correctAnswer];
        
        // Fisher-Yates shuffle
        for (let i = answers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [answers[i], answers[j]] = [answers[j], answers[i]];
        }
        
        // Find new position of correct answer
        const correctIndex = answers.indexOf(correctAnswer);
        
        return {
            answers,
            correctIndex
        };
    }

    /**
     * Start the question timer countdown using requestAnimationFrame for smooth updates
     */
    startQuestionTimer() {
        this.clearQuestionTimer();
        
        // Use requestAnimationFrame for smooth updates
        const startTime = performance.now();
        const updateTimer = (currentTime) => {
            const elapsed = currentTime - startTime;
            this.timeRemaining = Math.max(0, this.questionTimeLimit - elapsed);
            
            this.emit('timerUpdate', {
                timeRemaining: this.timeRemaining,
                timeElapsed: elapsed,
                percentage: (elapsed / this.questionTimeLimit) * 100
            });
            
            if (this.timeRemaining > 0) {
                this.timerAnimationId = requestAnimationFrame(updateTimer);
            } else {
                this.handleTimeUp();
            }
        };
        
        this.timerAnimationId = requestAnimationFrame(updateTimer);
    }

    /**
     * Clear the question timer and cancel animation frame
     */
    clearQuestionTimer() {
        if (this.timerAnimationId) {
            cancelAnimationFrame(this.timerAnimationId);
            this.timerAnimationId = null;
        }
    }

    /**
     * Handle time running out
     */
    handleTimeUp() {
        this.clearQuestionTimer();
        
        // If answer is already being processed, don't emit timeUp
        if (this.processingAnswer) {
            console.log('Answer already being processed, skipping timeUp');
            return;
        }
        
        console.log('Time up for question:', this.currentQuestion?.id);
        
        const result = {
            questionId: this.currentQuestion?.id,
            isCorrect: false,
            isTimeUp: true,
            timeRemaining: 0,
            correctAnswer: this.getOriginalCorrectAnswer(this.currentQuestion?.id),
            explanation: this.currentQuestion?.explanation || '',
            pointsEarned: 0
        };
        
        this.emit('timeUp', result);
        this.currentQuestion = null;
    }

    /**
     * Validate a player's answer
     */
    async validateAnswer(answerIndex) {
        try {
            if (!this.currentQuestion) {
                throw new Error('No question currently active');
            }
            
            if (this.processingAnswer) {
                console.warn('Answer processing already in progress, ignoring duplicate submission');
                return null;
            }
            
            this.processingAnswer = true;

            const question = this.currentQuestion;
            const timeElapsed = Date.now() - this.questionStartTime;
            
            // Validate answer using hash (basic obfuscation)
            const isCorrect = this.validateAnswerHash(question.id, answerIndex, question.answerHash);
            
            // Stop the timer
            this.clearQuestionTimer();
            
            // Calculate score with time bonus
            const timeBonus = this.calculateTimeBonus(timeElapsed);
            let pointsEarned = 0;
            
            if (isCorrect) {
                pointsEarned = question.points + timeBonus;
            }

            const result = {
                questionId: question.id,
                isCorrect,
                selectedAnswer: answerIndex,
                correctAnswer: this.getOriginalCorrectAnswer(question.id), // Only revealed after answer
                timeElapsed,
                timeBonus,
                pointsEarned,
                explanation: question.explanation || '',
                isTimeUp: false
            };

            console.log(`Answer validation: ${isCorrect ? 'Correct' : 'Incorrect'} (${pointsEarned} points)`);
            
            // Update game state through the gameState instance
            if (this.gameState) {
                this.gameState.startQuestionTimer(); // Sync with gameState
                await this.gameState.answerQuestion(question.id, answerIndex);
            }

            this.emit('answerValidated', result);
            this.currentQuestion = null;
            
            return result;
        } catch (error) {
            console.error('Failed to validate answer:', error);
            this.emit('error', { type: 'validation', message: error.message });
            throw error;
        } finally {
            this.processingAnswer = false;
        }
    }

    /**
     * Generate a hash for answer validation (basic obfuscation)
     * Note: This is not cryptographically secure - true security requires server-side validation
     * @param {string} questionId - Question identifier
     * @param {number} correctIndex - Correct answer index
     * @returns {string} - Answer hash
     */
    generateAnswerHash(questionId, correctIndex) {
        // Simple obfuscation - not cryptographically secure but makes casual cheating harder
        const seed = `${questionId}_${correctIndex}_${this.questionStartTime || Date.now()}`;
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Validate answer using hash comparison
     * @param {string} questionId - Question identifier  
     * @param {number} answerIndex - Selected answer index
     * @param {string} expectedHash - Expected answer hash
     * @returns {boolean} - True if answer is correct
     */
    validateAnswerHash(questionId, answerIndex, expectedHash) {
        // Generate hash for submitted answer and compare
        const submittedHash = this.generateAnswerHash(questionId, answerIndex);
        return submittedHash === expectedHash;
    }

    /**
     * Get original correct answer for a question (only after validation)
     * @param {string} questionId - Question identifier
     * @returns {number} - Original correct answer index (shuffled)
     */
    getOriginalCorrectAnswer(questionId) {
        try {
            // Retrieve from secure storage first
            const storedData = this.questionAnswerMap.get(questionId);
            if (storedData && storedData.shuffledCorrectIndex !== null) {
                return storedData.shuffledCorrectIndex;
            }
            
            // Fallback to dataLoader (this still exposes the answer but only after submission)
            const originalQuestion = this.dataLoader.getQuestion(questionId);
            return originalQuestion ? originalQuestion.correctAnswer : -1;
        } catch (error) {
            console.error('Error retrieving original correct answer:', error);
            return -1;
        }
    }

    /**
     * Calculate time bonus based on response speed
     */
    calculateTimeBonus(timeElapsed) {
        const maxBonusTime = 10000; // 10 seconds for full bonus
        const maxBonus = 50;
        
        if (timeElapsed <= maxBonusTime) {
            const bonusMultiplier = 1 - (timeElapsed / maxBonusTime);
            return Math.floor(maxBonus * bonusMultiplier);
        }
        return 0;
    }

    /**
     * Get a hint for the current question
     */
    getHint() {
        if (!this.currentQuestion) {
            return null;
        }

        if (this.currentQuestion.hint) {
            console.log('Hint requested for current question');
            this.emit('hintRequested', {
                questionId: this.currentQuestion.id,
                hint: this.currentQuestion.hint
            });
            return this.currentQuestion.hint;
        }

        return 'No hint available for this question.';
    }

    /**
     * Skip the current question (with penalty)
     */
    skipQuestion() {
        if (!this.currentQuestion) {
            return null;
        }

        this.clearQuestionTimer();
        
        const result = {
            questionId: this.currentQuestion.id,
            isSkipped: true,
            correctAnswer: this.currentQuestion.correctAnswer,
            explanation: this.currentQuestion.explanation || '',
            pointsEarned: -10 // Penalty for skipping
        };

        console.log('Question skipped:', this.currentQuestion.id);
        
        this.emit('questionSkipped', result);
        this.currentQuestion = null;
        
        return result;
    }

    /**
     * Get questions by category
     */
    getQuestionsByCategory(category) {
        return this.categoryQuestions.get(category) || [];
    }

    /**
     * Get available categories
     */
    getAvailableCategories() {
        return Array.from(this.categoryQuestions.keys());
    }

    /**
     * Get quiz statistics
     */
    getQuizStatistics() {
        const totalQuestions = this.allQuestions.length;
        const answeredQuestions = this.gameState ? this.gameState.answeredQuestions.size : 0;
        const categories = this.getAvailableCategories();
        
        const categoryStats = categories.map(category => {
            const categoryQuestions = this.categoryQuestions.get(category);
            const answeredInCategory = categoryQuestions.filter(q => 
                this.gameState && this.gameState.answeredQuestions.has(q.id)
            ).length;
            
            return {
                category,
                total: categoryQuestions.length,
                answered: answeredInCategory,
                percentage: Math.round((answeredInCategory / categoryQuestions.length) * 100)
            };
        });

        return {
            totalQuestions,
            answeredQuestions,
            remainingQuestions: totalQuestions - answeredQuestions,
            categories: categoryStats,
            completionPercentage: Math.round((answeredQuestions / totalQuestions) * 100)
        };
    }

    /**
     * Get difficulty-appropriate questions based on player performance
     */
    getAdaptiveQuestion() {
        if (!this.gameState) {
            return this.getNextQuestion();
        }

        const stats = this.gameState.getStatistics();
        const accuracy = stats.questionsAnswered > 0 ? 
            (stats.score / (stats.questionsAnswered * 100)) : 0.5; // Assume 50% for no history

        let preferredDifficulty;
        if (accuracy > 0.8) {
            preferredDifficulty = 'hard';
        } else if (accuracy > 0.6) {
            preferredDifficulty = 'medium';
        } else {
            preferredDifficulty = 'easy';
        }

        // Find questions of preferred difficulty
        const adaptiveQuestions = this.allQuestions.filter(q => 
            q.difficulty === preferredDifficulty && 
            !this.gameState.answeredQuestions.has(q.id)
        );

        if (adaptiveQuestions.length > 0) {
            return adaptiveQuestions[Math.floor(Math.random() * adaptiveQuestions.length)];
        }

        // Fall back to any available question
        return this.getNextQuestion();
    }

    /**
     * Event system methods
     */
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }

    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in QuizEngine event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.clearQuestionTimer();
        this.eventListeners = {};
        this.currentQuestion = null;
        console.log('QuizEngine destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizEngine;
}