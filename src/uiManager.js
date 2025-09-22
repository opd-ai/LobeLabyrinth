/**
 * UIManager class handles the user interface interactions and display updates
 */
class UIManager {
    constructor(dataLoader, gameState, quizEngine, animationManager = null, achievementManager = null) {
        this.dataLoader = dataLoader;
        this.gameState = gameState;
        this.quizEngine = quizEngine;
        this.animationManager = animationManager;
        this.achievementManager = achievementManager;
        
        this.elements = {};
        this.currentQuestion = null;
        this.isQuestionActive = false;
        this.previousScore = 0; // Track previous score for animations
        
        // Achievement notification queue
        this.achievementQueue = [];
        this.showingAchievement = false;
        
        console.log('UIManager initialized with animations:', !!this.animationManager, 'achievements:', !!this.achievementManager);
        this.initializeElements();
        this.setupEventListeners();
        this.updateDisplay();
        this.setupAchievementNotifications();
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
        this.elements = {
            // Room display
            roomInfo: document.getElementById('room-info'),
            roomName: document.getElementById('room-name'),
            roomDescription: document.getElementById('room-description'),
            roomConnections: document.getElementById('room-connections'),
            
            // Question area
            questionArea: document.getElementById('question-area'),
            questionText: document.getElementById('question-text'),
            questionCategory: document.getElementById('question-category'),
            questionDifficulty: document.getElementById('question-difficulty'),
            questionPoints: document.getElementById('question-points'),
            
            // Answer area
            answerArea: document.getElementById('answer-area'),
            answerButtons: document.getElementById('answer-buttons'),
            
            // Timer
            timerArea: document.getElementById('timer-area'),
            timerBar: document.getElementById('timer-bar'),
            timerText: document.getElementById('timer-text'),
            
            // Score and stats
            scoreDisplay: document.getElementById('score-display'),
            currentScore: document.getElementById('current-score'),
            questionsAnswered: document.getElementById('questions-answered'),
            roomsVisited: document.getElementById('rooms-visited'),
            
            // Game controls
            gameControls: document.getElementById('game-controls'),
            newQuestionBtn: document.getElementById('new-question-btn'),
            hintBtn: document.getElementById('hint-btn'),
            skipBtn: document.getElementById('skip-btn'),
            saveBtn: document.getElementById('save-btn'),
            loadBtn: document.getElementById('load-btn'),
            resetBtn: document.getElementById('reset-btn'),
            
            // Feedback area
            feedbackArea: document.getElementById('feedback-area'),
            
            // Navigation
            navigationArea: document.getElementById('navigation-area'),
            availableRooms: document.getElementById('available-rooms'),
            
            // Achievement elements
            achievementNotification: document.getElementById('achievement-notification'),
            achievementGallery: document.getElementById('achievement-gallery'),
            achievementToggle: document.getElementById('achievement-toggle'),
            achievementStats: document.getElementById('achievement-stats')
        };

        console.log('UI elements initialized');
    }

    /**
     * Setup event listeners for UI interactions
     */
    setupEventListeners() {
        // Game control buttons
        if (this.elements.newQuestionBtn) {
            this.elements.newQuestionBtn.addEventListener('click', () => this.presentNewQuestion());
        }
        
        if (this.elements.hintBtn) {
            this.elements.hintBtn.addEventListener('click', () => this.showHint());
        }
        
        if (this.elements.skipBtn) {
            this.elements.skipBtn.addEventListener('click', () => this.skipQuestion());
        }
        
        if (this.elements.saveBtn) {
            this.elements.saveBtn.addEventListener('click', () => this.saveGame());
        }
        
        if (this.elements.loadBtn) {
            this.elements.loadBtn.addEventListener('click', () => this.loadGame());
        }
        
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => this.resetGame());
        }

        // Game state events
        if (this.gameState) {
            this.gameState.on('roomChanged', (data) => this.handleRoomChange(data));
            this.gameState.on('questionAnswered', (data) => this.handleQuestionAnswered(data));
            this.gameState.on('gameCompleted', (data) => this.handleGameCompleted(data));
        }

        // Quiz engine events
        if (this.quizEngine) {
            this.quizEngine.on('questionPresented', (data) => this.displayQuestion(data));
            this.quizEngine.on('answerValidated', (data) => this.handleAnswerValidated(data));
            this.quizEngine.on('timerUpdate', (data) => this.updateTimer(data));
            this.quizEngine.on('timeUp', (data) => this.handleTimeUp(data));
        }

        console.log('Event listeners setup complete');
    }

    /**
     * Setup achievement notification system
     */
    setupAchievementNotifications() {
        if (this.achievementManager) {
            // Listen for achievement unlocks
            this.achievementManager.addEventListener('achievementUnlocked', (event) => {
                this.queueAchievementNotification(event.detail);
            });
            
            // Setup achievement gallery toggle
            if (this.elements.achievementToggle) {
                this.elements.achievementToggle.addEventListener('click', () => {
                    this.toggleAchievementGallery();
                });
            }
            
            console.log('Achievement notifications setup complete');
        }
    }

    /**
     * Queue an achievement notification for display
     */
    queueAchievementNotification(achievementData) {
        this.achievementQueue.push(achievementData);
        
        // Start processing queue if not already showing
        if (!this.showingAchievement) {
            this.processAchievementQueue();
        }
    }

    /**
     * Process the achievement notification queue
     */
    async processAchievementQueue() {
        if (this.achievementQueue.length === 0) {
            this.showingAchievement = false;
            return;
        }
        
        this.showingAchievement = true;
        const achievementData = this.achievementQueue.shift();
        
        await this.showAchievementNotification(achievementData);
        
        // Continue with next achievement after a delay
        setTimeout(() => {
            this.processAchievementQueue();
        }, 500);
    }

    /**
     * Show achievement unlock notification with animation
     */
    async showAchievementNotification(achievementData) {
        const { achievement, totalPoints, unlockedCount } = achievementData;
        
        // Create notification element if it doesn't exist
        let notification = this.elements.achievementNotification;
        if (!notification) {
            notification = this.createAchievementNotificationElement();
        }
        
        // Update notification content
        notification.innerHTML = `
            <div class="achievement-unlock-animation">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-details">
                    <div class="achievement-title">Achievement Unlocked!</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <div class="achievement-points">+${achievement.points} points</div>
                </div>
                <div class="achievement-rarity achievement-rarity-${achievement.rarity}">
                    ${achievement.rarity.toUpperCase()}
                </div>
            </div>
        `;
        
        // Add CSS classes for animation
        notification.className = 'achievement-notification show';
        
        // Use animation manager if available
        if (this.animationManager) {
            await this.animationManager.animateAchievementUnlock(notification);
        } else {
            // Fallback animation with setTimeout
            notification.style.transform = 'translateY(-100%)';
            notification.style.opacity = '0';
            
            setTimeout(() => {
                notification.style.transform = 'translateY(0)';
                notification.style.opacity = '1';
            }, 50);
        }
        
        // Auto-hide after 4 seconds
        setTimeout(() => {
            this.hideAchievementNotification(notification);
        }, 4000);
        
        // Update achievement stats display
        this.updateAchievementStats();
    }

    /**
     * Hide achievement notification
     */
    hideAchievementNotification(notification) {
        notification.style.transform = 'translateY(-100%)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            notification.className = 'achievement-notification';
        }, 300);
    }

    /**
     * Create achievement notification element if it doesn't exist
     */
    createAchievementNotificationElement() {
        let notification = document.getElementById('achievement-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'achievement-notification';
            notification.className = 'achievement-notification';
            
            // Add to body or a container
            document.body.appendChild(notification);
            this.elements.achievementNotification = notification;
        }
        
        return notification;
    }

    /**
     * Toggle achievement gallery visibility
     */
    toggleAchievementGallery() {
        const gallery = this.elements.achievementGallery;
        if (!gallery) {
            console.warn('Achievement gallery element not found');
            return;
        }
        
        const isVisible = gallery.classList.contains('visible');
        
        if (isVisible) {
            gallery.classList.remove('visible');
        } else {
            this.populateAchievementGallery();
            gallery.classList.add('visible');
        }
    }

    /**
     * Populate achievement gallery with current achievements
     */
    populateAchievementGallery() {
        if (!this.achievementManager || !this.elements.achievementGallery) {
            return;
        }
        
        const achievements = this.achievementManager.getAllAchievements();
        const stats = this.achievementManager.getAchievementStats();
        
        // Group achievements by category
        const categories = {};
        achievements.forEach(achievement => {
            if (!categories[achievement.category]) {
                categories[achievement.category] = [];
            }
            categories[achievement.category].push(achievement);
        });
        
        // Create gallery HTML
        let galleryHTML = `
            <div class="achievement-gallery-header">
                <h3>🏆 Achievements</h3>
                <div class="achievement-summary">
                    ${stats.unlocked}/${stats.total} unlocked (${stats.percentage}%)
                    <br>
                    ${stats.totalPoints} total points
                </div>
                <button class="achievement-close-btn" onclick="this.closest('.achievement-gallery').classList.remove('visible')">×</button>
            </div>
            <div class="achievement-categories">
        `;
        
        // Add each category
        Object.keys(categories).forEach(categoryName => {
            const categoryAchievements = categories[categoryName];
            const categoryStats = stats.categories[categoryName];
            
            galleryHTML += `
                <div class="achievement-category">
                    <h4 class="category-title">
                        ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
                        <span class="category-progress">(${categoryStats.unlocked}/${categoryStats.total})</span>
                    </h4>
                    <div class="achievement-grid">
            `;
            
            categoryAchievements.forEach(achievement => {
                const progressWidth = Math.max(achievement.progressPercentage, achievement.unlocked ? 100 : 0);
                const unlockClass = achievement.unlocked ? 'unlocked' : 'locked';
                
                galleryHTML += `
                    <div class="achievement-card ${unlockClass} achievement-rarity-${achievement.rarity}">
                        <div class="achievement-icon">${achievement.icon}</div>
                        <div class="achievement-info">
                            <div class="achievement-name">${achievement.name}</div>
                            <div class="achievement-description">${achievement.description}</div>
                            <div class="achievement-progress-bar">
                                <div class="achievement-progress-fill" style="width: ${progressWidth}%"></div>
                            </div>
                            <div class="achievement-meta">
                                <span class="achievement-points">${achievement.points} pts</span>
                                <span class="achievement-rarity">${achievement.rarity}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            galleryHTML += `
                    </div>
                </div>
            `;
        });
        
        galleryHTML += '</div>';
        
        this.elements.achievementGallery.innerHTML = galleryHTML;
    }

    /**
     * Update achievement stats display
     */
    updateAchievementStats() {
        if (!this.achievementManager || !this.elements.achievementStats) {
            return;
        }
        
        const stats = this.achievementManager.getAchievementStats();
        
        this.elements.achievementStats.innerHTML = `
            <div class="achievement-stats-summary">
                🏆 ${stats.unlocked}/${stats.total} 
                (${stats.percentage}%)
                <span class="achievement-points">+${stats.totalPoints} pts</span>
            </div>
        `;
    }

    /**
     * Update all UI displays
     */
    async updateDisplay() {
        // Initialize previous score if not set
        if (this.previousScore === 0) {
            const stats = this.gameState.getStatistics();
            this.previousScore = stats.score;
        }
        
        await this.updateRoomInfo();
        await this.updateScoreDisplay();
        await this.updateNavigationOptions();
        this.updateGameControls();
    }    /**
     * Update room information display
     */
    async updateRoomInfo() {
        try {
            const currentRoom = await this.dataLoader.getRoom(this.gameState.currentRoomId);
            if (!currentRoom) return;

            if (this.elements.roomName) {
                this.elements.roomName.textContent = currentRoom.name;
            }
            
            if (this.elements.roomDescription) {
                this.elements.roomDescription.textContent = currentRoom.description;
            }

            // Update room connections
            if (this.elements.roomConnections && currentRoom.connections) {
                const connectionsHtml = currentRoom.connections
                    .map(roomId => {
                        const isUnlocked = this.gameState.unlockedRooms.has(roomId);
                        const className = isUnlocked ? 'connection-unlocked' : 'connection-locked';
                        return `<span class="${className}">${roomId}</span>`;
                    })
                    .join(', ');
                this.elements.roomConnections.innerHTML = `Connected to: ${connectionsHtml}`;
            }

        } catch (error) {
            console.error('Failed to update room info:', error);
        }
    }

    /**
     * Update score and statistics display
     */
    async updateScoreDisplay() {
        const stats = this.gameState.getStatistics();
        
        // Animate score change if AnimationManager is available
        if (this.elements.currentScore && this.animationManager) {
            try {
                // Only animate if score has changed significantly (more than just page refresh)
                if (Math.abs(stats.score - this.previousScore) > 0 && this.previousScore !== 0) {
                    console.log(`Animating score: ${this.previousScore} → ${stats.score}`);
                    await this.animationManager.animateScoreIncrease(
                        this.elements.currentScore, 
                        this.previousScore, 
                        stats.score
                    );
                } else {
                    this.elements.currentScore.textContent = stats.score;
                }
                this.previousScore = stats.score;
            } catch (error) {
                console.warn('Score animation failed, using direct update:', error);
                this.elements.currentScore.textContent = stats.score;
                this.previousScore = stats.score;
            }
        } else if (this.elements.currentScore) {
            this.elements.currentScore.textContent = stats.score;
            this.previousScore = stats.score;
        }
        
        if (this.elements.questionsAnswered) {
            this.elements.questionsAnswered.textContent = stats.questionsAnswered;
        }
        
        if (this.elements.roomsVisited) {
            this.elements.roomsVisited.textContent = stats.roomsVisited;
        }
    }

    /**
     * Update navigation options
     */
    async updateNavigationOptions() {
        if (!this.elements.availableRooms) return;

        try {
            const availableRooms = await this.gameState.getAvailableRooms();
            
            if (availableRooms.length === 0) {
                this.elements.availableRooms.innerHTML = '<p>No rooms available. Answer questions to unlock new areas!</p>';
                return;
            }

            const roomButtons = await Promise.all(
                availableRooms.map(async (roomId) => {
                    const room = await this.dataLoader.getRoom(roomId);
                    const roomName = room ? room.name : roomId;
                    return `<button class="room-nav-btn" onclick="uiManager.moveToRoom('${roomId}')">${roomName}</button>`;
                })
            );

            this.elements.availableRooms.innerHTML = `
                <h4>Available Rooms:</h4>
                <div class="room-nav-buttons">${roomButtons.join('')}</div>
            `;

        } catch (error) {
            console.error('Failed to update navigation options:', error);
        }
    }

    /**
     * Update game control buttons
     */
    updateGameControls() {
        // Enable/disable buttons based on game state
        if (this.elements.newQuestionBtn) {
            this.elements.newQuestionBtn.disabled = this.isQuestionActive;
        }
        
        if (this.elements.hintBtn) {
            this.elements.hintBtn.disabled = !this.isQuestionActive;
        }
        
        if (this.elements.skipBtn) {
            this.elements.skipBtn.disabled = !this.isQuestionActive;
        }
    }

    /**
     * Present a new question
     */
    async presentNewQuestion() {
        try {
            // Get current room to determine question category
            const currentRoom = await this.dataLoader.getRoom(this.gameState.currentRoomId);
            const category = currentRoom ? currentRoom.questionCategory : null;
            
            await this.quizEngine.presentQuestion(null, category);
            this.updateGameControls();
            
        } catch (error) {
            this.showFeedback(`Failed to present question: ${error.message}`, 'error');
        }
    }

    /**
     * Display a question in the UI
     */
    displayQuestion(questionData) {
        this.currentQuestion = questionData;
        this.isQuestionActive = true;
        
        // Update question text and metadata
        if (this.elements.questionText) {
            this.elements.questionText.textContent = questionData.question;
        }
        
        if (this.elements.questionCategory) {
            this.elements.questionCategory.textContent = questionData.category || 'General';
        }
        
        if (this.elements.questionDifficulty) {
            this.elements.questionDifficulty.textContent = questionData.difficulty || 'Medium';
        }
        
        if (this.elements.questionPoints) {
            this.elements.questionPoints.textContent = questionData.points;
        }

        // Display answer options
        this.displayAnswerOptions(questionData);
        
        // Show question and timer areas
        if (this.elements.questionArea) {
            this.elements.questionArea.style.display = 'block';
        }
        
        if (this.elements.timerArea) {
            this.elements.timerArea.style.display = 'block';
        }
        
        this.updateGameControls();
        this.clearFeedback();
    }

    /**
     * Display answer options as buttons
     */
    displayAnswerOptions(questionData) {
        if (!this.elements.answerButtons) return;

        const buttonsHtml = questionData.answers.map((answer, index) => 
            `<button class="answer-btn" onclick="uiManager.selectAnswer(${index})" data-answer="${index}">
                ${String.fromCharCode(65 + index)}. ${answer}
            </button>`
        ).join('');

        this.elements.answerButtons.innerHTML = buttonsHtml;
        
        if (this.elements.answerArea) {
            this.elements.answerArea.style.display = 'block';
        }
    }

    /**
     * Handle answer selection
     */
    async selectAnswer(answerIndex) {
        if (!this.isQuestionActive || !this.currentQuestion) return;

        try {
            // Get the clicked button element for animation
            const answerButtons = document.querySelectorAll('.answer-btn');
            const clickedButton = answerButtons[answerIndex];
            
            // Disable answer buttons
            this.disableAnswerButtons();
            
            // Validate answer through quiz engine
            const result = await this.quizEngine.validateAnswer(answerIndex);
            
            // Animate answer feedback if animation manager is available
            if (this.animationManager && clickedButton && result) {
                await this.animationManager.animateAnswerFeedback(clickedButton, result.isCorrect);
            }
            
        } catch (error) {
            this.showFeedback(`Error validating answer: ${error.message}`, 'error');
            this.enableAnswerButtons();
        }
    }

    /**
     * Show hint for current question
     */
    showHint() {
        if (!this.isQuestionActive || !this.quizEngine) return;

        const hint = this.quizEngine.getHint();
        if (hint) {
            this.showFeedback(`💡 Hint: ${hint}`, 'info');
        } else {
            this.showFeedback('No hint available for this question.', 'warning');
        }
    }

    /**
     * Skip current question
     */
    skipQuestion() {
        if (!this.isQuestionActive || !this.quizEngine) return;

        const result = this.quizEngine.skipQuestion();
        if (result) {
            this.showFeedback(`Question skipped. Penalty: ${Math.abs(result.pointsEarned)} points`, 'warning');
            this.clearQuestion();
        }
    }

    /**
     * Handle room movement
     */
    async moveToRoom(roomId) {
        try {
            await this.gameState.moveToRoom(roomId);
            // Display updates automatically through event handlers
        } catch (error) {
            this.showFeedback(`Cannot move to ${roomId}: ${error.message}`, 'error');
        }
    }

    /**
     * Handle room change event
     */
    async handleRoomChange(data) {
        console.log(`Room changed: ${data.from} -> ${data.to}`);
        await this.updateRoomInfo();
        await this.updateNavigationOptions();
        this.showFeedback(`Moved to ${data.room.name}`, 'success');
    }

    /**
     * Handle answer validation event
     */
    handleAnswerValidated(data) {
        const answerButtons = document.querySelectorAll('.answer-btn');
        
        // Highlight correct and selected answers
        answerButtons.forEach((btn, index) => {
            btn.classList.remove('answer-correct', 'answer-incorrect');
            
            if (index === data.correctAnswer) {
                btn.classList.add('answer-correct');
            } else if (index === data.selectedAnswer && !data.isCorrect) {
                btn.classList.add('answer-incorrect');
            }
        });

        // Show feedback
        const feedback = data.isCorrect 
            ? `Correct! +${data.pointsEarned} points (${data.timeBonus} time bonus)`
            : `Incorrect. The correct answer was ${String.fromCharCode(65 + data.correctAnswer)}.`;
        
        this.showFeedback(feedback, data.isCorrect ? 'success' : 'error');
        
        if (data.explanation) {
            setTimeout(() => {
                this.showFeedback(`💡 ${data.explanation}`, 'info');
            }, 1500);
        }

        // Update score display
        this.updateScoreDisplay();
        
        // Clear question after delay
        setTimeout(() => {
            this.clearQuestion();
        }, 3000);
    }

    /**
     * Handle timer updates
     */
    updateTimer(data) {
        if (this.elements.timerBar) {
            const percentage = 100 - data.percentage;
            this.elements.timerBar.style.width = `${percentage}%`;
            
            if (percentage < 20) {
                this.elements.timerBar.classList.add('timer-warning');
            } else {
                this.elements.timerBar.classList.remove('timer-warning');
            }
        }
        
        if (this.elements.timerText) {
            const seconds = Math.ceil(data.timeRemaining / 1000);
            this.elements.timerText.textContent = `${seconds}s`;
        }
    }

    /**
     * Handle time up event
     */
    handleTimeUp(data) {
        this.showFeedback('⏰ Time\'s up! No points awarded.', 'warning');
        
        if (data.explanation) {
            setTimeout(() => {
                this.showFeedback(`💡 ${data.explanation}`, 'info');
            }, 1500);
        }
        
        setTimeout(() => {
            this.clearQuestion();
        }, 3000);
    }

    /**
     * Handle game completion
     */
    handleGameCompleted(data) {
        this.showFeedback(`🎉 Congratulations! Game completed! Final score: ${data.finalScore}`, 'success');
        
        // Show completion modal or update UI
        if (this.elements.feedbackArea) {
            setTimeout(() => {
                this.elements.feedbackArea.innerHTML += `
                    <div class="game-completion">
                        <h3>🏆 Victory!</h3>
                        <p>You have successfully navigated the Lobe Labyrinth!</p>
                        <p><strong>Final Score:</strong> ${data.finalScore}</p>
                        <p><strong>Rooms Visited:</strong> ${data.gameState.visitedRooms.length}</p>
                        <p><strong>Questions Answered:</strong> ${data.gameState.answeredQuestions.length}</p>
                        <button onclick="uiManager.resetGame()">Play Again</button>
                    </div>
                `;
            }, 2000);
        }
    }

    /**
     * Save game
     */
    saveGame() {
        const success = this.gameState.saveGame();
        if (success) {
            this.showFeedback('Game saved successfully!', 'success');
        } else {
            this.showFeedback('Failed to save game.', 'error');
        }
    }

    /**
     * Load game
     */
    loadGame() {
        const success = this.gameState.loadGame();
        if (success) {
            this.showFeedback('Game loaded successfully!', 'success');
            this.updateDisplay();
        } else {
            this.showFeedback('No saved game found.', 'info');
        }
    }

    /**
     * Reset game
     */
    resetGame() {
        if (confirm('Are you sure you want to reset the game? All progress will be lost.')) {
            this.gameState.resetGame();
            this.clearQuestion();
            this.updateDisplay();
            this.showFeedback('Game reset successfully!', 'info');
        }
    }

    /**
     * Clear current question display
     */
    clearQuestion() {
        this.currentQuestion = null;
        this.isQuestionActive = false;
        
        if (this.elements.questionArea) {
            this.elements.questionArea.style.display = 'none';
        }
        
        if (this.elements.answerArea) {
            this.elements.answerArea.style.display = 'none';
        }
        
        if (this.elements.timerArea) {
            this.elements.timerArea.style.display = 'none';
        }
        
        this.updateGameControls();
    }

    /**
     * Disable answer buttons
     */
    disableAnswerButtons() {
        const buttons = document.querySelectorAll('.answer-btn');
        buttons.forEach(btn => btn.disabled = true);
    }

    /**
     * Enable answer buttons
     */
    enableAnswerButtons() {
        const buttons = document.querySelectorAll('.answer-btn');
        buttons.forEach(btn => btn.disabled = false);
    }

    /**
     * Show feedback message
     */
    showFeedback(message, type = 'info') {
        if (!this.elements.feedbackArea) return;
        
        const feedbackHtml = `
            <div class="feedback-message feedback-${type}">
                ${message}
            </div>
        `;
        
        this.elements.feedbackArea.innerHTML = feedbackHtml;
        
        // Auto-clear certain types of feedback
        if (type !== 'error') {
            setTimeout(() => {
                this.clearFeedback();
            }, 5000);
        }
    }

    /**
     * Clear feedback area
     */
    clearFeedback() {
        if (this.elements.feedbackArea) {
            this.elements.feedbackArea.innerHTML = '';
        }
    }

    /**
     * Get UI state for debugging
     */
    getUIState() {
        return {
            currentQuestion: this.currentQuestion?.id || null,
            isQuestionActive: this.isQuestionActive,
            elementsFound: Object.keys(this.elements).filter(key => this.elements[key] !== null)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}