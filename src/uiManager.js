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
            achievementStats: document.getElementById('achievement-stats'),
            
            // Victory screen elements
            victoryScreen: document.getElementById('victory-screen'),
            victoryFinalScore: document.getElementById('victory-final-score'),
            victoryTime: document.getElementById('victory-time'),
            victoryAccuracy: document.getElementById('victory-accuracy'),
            victoryRooms: document.getElementById('victory-rooms'),
            victoryBaseScore: document.getElementById('victory-base-score'),
            victoryCompletionBonus: document.getElementById('victory-completion-bonus'),
            victoryExplorationBonus: document.getElementById('victory-exploration-bonus'),
            victoryPerfectBonus: document.getElementById('victory-perfect-bonus'),
            victorySpeedBonus: document.getElementById('victory-speed-bonus'),
            victoryAchievementBonus: document.getElementById('victory-achievement-bonus'),
            victoryAchievementIcons: document.getElementById('victory-achievement-icons'),
            victoryGrade: document.getElementById('victory-grade'),
            
            // Victory action buttons
            playAgainBtn: document.getElementById('play-again-btn'),
            viewAchievementsBtn: document.getElementById('view-achievements-btn'),
            shareResultsBtn: document.getElementById('share-results-btn'),
            playAgainBtn: document.getElementById('play-again-btn'),
            viewAchievementsBtn: document.getElementById('view-achievements-btn'),
            shareResultsBtn: document.getElementById('share-results-btn')
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

        // Victory screen event listeners
        if (this.elements.playAgainBtn) {
            this.elements.playAgainBtn.addEventListener('click', () => this.handlePlayAgain());
        }
        
        if (this.elements.viewAchievementsBtn) {
            this.elements.viewAchievementsBtn.addEventListener('click', () => this.handleViewAchievements());
        }
        
        if (this.elements.shareResultsBtn) {
            this.elements.shareResultsBtn.addEventListener('click', () => this.handleShareResults());
        }

        // Victory screen event listeners
        if (this.elements.victoryPlayAgain) {
            this.elements.victoryPlayAgain.addEventListener('click', () => this.handlePlayAgain());
        }
        
        if (this.elements.victoryViewAchievements) {
            this.elements.victoryViewAchievements.addEventListener('click', () => this.showAchievements());
        }
        
        if (this.elements.victoryShareResults) {
            this.elements.victoryShareResults.addEventListener('click', () => this.shareResults());
        }
        
        if (this.elements.victoryClose) {
            this.elements.victoryClose.addEventListener('click', () => this.hideVictoryScreen());
        }

        // Keyboard navigation setup
        this.setupKeyboardNavigation();

        console.log('Event listeners setup complete');
    }

    /**
     * Setup comprehensive keyboard navigation system
     */
    setupKeyboardNavigation() {
        // Keyboard navigation state
        this.keyboardEnabled = true;
        this.currentFocusIndex = 0;
        this.focusableElements = [];
        
        // Add global keyboard event listener
        document.addEventListener('keydown', (event) => this.handleKeyboardInput(event));
        
        // Prevent default handling for specific keys
        document.addEventListener('keydown', (event) => {
            if (this.shouldPreventDefault(event)) {
                event.preventDefault();
            }
        });
        
        console.log('Keyboard navigation setup complete');
    }

    /**
     * Handle keyboard input for navigation and shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyboardInput(event) {
        if (!this.keyboardEnabled) return;
        
        const key = event.key;
        const code = event.code;
        const ctrlKey = event.ctrlKey;
        const altKey = event.altKey;
        
        try {
            // Handle different contexts
            if (this.isVictoryScreenVisible()) {
                this.handleVictoryScreenKeys(event);
                return;
            }
            
            if (this.isQuestionActive()) {
                this.handleQuestionKeys(event);
                return;
            }
            
            if (this.isMapFocused()) {
                this.handleMapNavigationKeys(event);
                return;
            }
            
            // Global shortcuts (work in all contexts)
            this.handleGlobalShortcuts(event);
            
        } catch (error) {
            console.error('Error handling keyboard input:', error);
        }
    }

    /**
     * Handle keyboard input when victory screen is visible
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleVictoryScreenKeys(event) {
        const key = event.key;
        
        switch (key) {
            case 'Enter':
            case ' ':
                // Default action: Play Again
                this.handlePlayAgain();
                event.preventDefault();
                break;
            case 'Escape':
                this.hideVictoryScreen();
                event.preventDefault();
                break;
            case '1':
                this.handlePlayAgain();
                event.preventDefault();
                break;
            case '2':
                this.handleViewAchievements();
                event.preventDefault();
                break;
            case '3':
                this.handleShareResults();
                event.preventDefault();
                break;
        }
    }

    /**
     * Handle keyboard input when a question is active
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleQuestionKeys(event) {
        const key = event.key;
        
        // Number keys for answer selection (1-4)
        if (key >= '1' && key <= '4') {
            const answerIndex = parseInt(key) - 1;
            this.selectAnswerByIndex(answerIndex);
            event.preventDefault();
            return;
        }
        
        // Special actions
        switch (key) {
            case 'Enter':
            case ' ':
                // Submit current answer if one is selected
                this.submitCurrentAnswer();
                event.preventDefault();
                break;
            case 'h':
            case 'H':
                // Show hint
                this.showHint();
                event.preventDefault();
                break;
            case 's':
            case 'S':
                // Skip question
                this.skipQuestion();
                event.preventDefault();
                break;
            case 'n':
            case 'N':
                // New question (if no current question)
                if (!this.currentQuestion) {
                    this.presentNewQuestion();
                    event.preventDefault();
                }
                break;
            case 'Escape':
                // Clear selection or go back
                this.clearAnswerSelection();
                event.preventDefault();
                break;
        }
    }

    /**
     * Handle keyboard input for map navigation
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleMapNavigationKeys(event) {
        const key = event.key;
        
        switch (key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.navigateMapDirection('up');
                event.preventDefault();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.navigateMapDirection('down');
                event.preventDefault();
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                this.navigateMapDirection('left');
                event.preventDefault();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                this.navigateMapDirection('right');
                event.preventDefault();
                break;
            case 'Enter':
            case ' ':
                // Enter current room or start question
                this.enterCurrentRoom();
                event.preventDefault();
                break;
        }
    }

    /**
     * Handle global keyboard shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleGlobalShortcuts(event) {
        const key = event.key;
        const ctrlKey = event.ctrlKey;
        const altKey = event.altKey;
        const shiftKey = event.shiftKey;
        
        // Ctrl+key combinations
        if (ctrlKey) {
            switch (key) {
                case 's':
                    this.saveGame();
                    event.preventDefault();
                    break;
                case 'l':
                    this.loadGame();
                    event.preventDefault();
                    break;
                case 'r':
                    this.resetGame();
                    event.preventDefault();
                    break;
                case 'h':
                    this.showKeyboardHelp();
                    event.preventDefault();
                    break;
                case 'n':
                    // Start new question quickly
                    this.presentNewQuestion();
                    event.preventDefault();
                    break;
                case 'p':
                    // Quick pause/resume timer
                    this.toggleTimer();
                    event.preventDefault();
                    break;
            }
        }
        
        // Alt+key combinations
        if (altKey) {
            switch (key) {
                case 'a':
                    this.handleViewAchievements();
                    event.preventDefault();
                    break;
                case 'm':
                    this.focusMap();
                    event.preventDefault();
                    break;
                case 'q':
                    this.focusQuestion();
                    event.preventDefault();
                    break;
                case 's':
                    // Quick stats view
                    this.showQuickStats();
                    event.preventDefault();
                    break;
                case 'h':
                    // Quick hint
                    this.showHint();
                    event.preventDefault();
                    break;
            }
        }
        
        // Ctrl+Shift combinations for advanced actions
        if (ctrlKey && shiftKey) {
            switch (key) {
                case 'R':
                    // Force complete reset
                    this.confirmAndResetGame();
                    event.preventDefault();
                    break;
                case 'D':
                    // Developer/debug mode toggle
                    this.toggleDebugMode();
                    event.preventDefault();
                    break;
                case 'S':
                    // Export save data
                    this.exportSaveData();
                    event.preventDefault();
                    break;
            }
        }
        
        // Function keys
        switch (key) {
            case 'F1':
                this.showKeyboardHelp();
                event.preventDefault();
                break;
            case 'F2':
                this.showQuickStats();
                event.preventDefault();
                break;
            case 'F5':
                // Refresh/restart current room
                this.refreshCurrentRoom();
                event.preventDefault();
                break;
        }
        
        // Single key shortcuts (when not in input)
        if (!this.isInInputField(event.target)) {
            switch (key) {
                case '?':
                    this.showKeyboardHelp();
                    event.preventDefault();
                    break;
                case 'Tab':
                    // Cycle through focusable elements
                    this.cycleFocus();
                    event.preventDefault();
                    break;
            }
        }
    }

    /**
     * Determine if default handling should be prevented for specific keys
     * @param {KeyboardEvent} event - Keyboard event
     * @returns {boolean} Whether to prevent default
     */
    shouldPreventDefault(event) {
        const key = event.key;
        const target = event.target;
        
        // Don't prevent default in input fields (unless specific shortcuts)
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
            return false;
        }
        
        // Prevent default for navigation keys in game context
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)) {
            return true;
        }
        
        return false;
    }

    /**
     * Check if victory screen is currently visible
     * @returns {boolean} True if victory screen is visible
     */
    isVictoryScreenVisible() {
        return this.elements.victoryScreen && 
               this.elements.victoryScreen.style.display !== 'none' &&
               this.elements.victoryScreen.classList.contains('show');
    }

    /**
     * Check if a question is currently active
     * @returns {boolean} True if question is active
     */
    isQuestionActive() {
        return this.currentQuestion && this.isQuestionActive;
    }

    /**
     * Check if map should receive navigation input
     * @returns {boolean} True if map should handle navigation
     */
    isMapFocused() {
        return !this.isQuestionActive() && !this.isVictoryScreenVisible();
    }

    /**
     * Select answer by index (0-3) for keyboard navigation
     * @param {number} index - Answer index
     */
    selectAnswerByIndex(index) {
        if (!this.currentQuestion || index < 0 || index >= 4) {
            return;
        }
        
        try {
            const answerButtons = document.querySelectorAll('.answer-btn');
            if (answerButtons && answerButtons[index]) {
                // Simulate click on the answer button
                answerButtons[index].click();
                
                // Add visual focus indicator
                this.highlightSelectedAnswer(index);
            }
        } catch (error) {
            console.error('Error selecting answer by index:', error);
        }
    }

    /**
     * Highlight the selected answer for keyboard navigation
     * @param {number} index - Answer index to highlight
     */
    highlightSelectedAnswer(index) {
        try {
            // Remove previous highlights
            document.querySelectorAll('.answer-btn').forEach(btn => {
                btn.classList.remove('keyboard-selected');
            });
            
            // Add highlight to selected answer
            const answerButtons = document.querySelectorAll('.answer-btn');
            if (answerButtons && answerButtons[index]) {
                answerButtons[index].classList.add('keyboard-selected');
                this.selectedAnswerIndex = index;
            }
        } catch (error) {
            console.error('Error highlighting answer:', error);
        }
    }

    /**
     * Submit the currently selected answer
     */
    submitCurrentAnswer() {
        if (this.selectedAnswerIndex !== null && this.selectedAnswerIndex !== undefined) {
            const answerButtons = document.querySelectorAll('.answer-btn');
            if (answerButtons && answerButtons[this.selectedAnswerIndex]) {
                answerButtons[this.selectedAnswerIndex].click();
            }
        }
    }

    /**
     * Clear answer selection
     */
    clearAnswerSelection() {
        document.querySelectorAll('.answer-btn').forEach(btn => {
            btn.classList.remove('keyboard-selected');
        });
        this.selectedAnswerIndex = null;
    }

    /**
     * Navigate map in specified direction
     * @param {string} direction - Direction to navigate (up, down, left, right)
     */
    navigateMapDirection(direction) {
        if (this.mapRenderer && typeof this.mapRenderer.navigateDirection === 'function') {
            this.mapRenderer.navigateDirection(direction);
        } else {
            console.log(`Map navigation: ${direction} (map renderer not available)`);
        }
    }

    /**
     * Enter the currently selected room
     */
    enterCurrentRoom() {
        if (this.mapRenderer && typeof this.mapRenderer.enterCurrentRoom === 'function') {
            this.mapRenderer.enterCurrentRoom();
        } else {
            // Fallback: start a new question
            this.presentNewQuestion();
        }
    }

    /**
     * Focus the map for navigation
     */
    focusMap() {
        if (this.elements.mapCanvas) {
            this.elements.mapCanvas.focus();
            this.showFeedback('🗺️ Map focused - Use arrow keys to navigate', 'info');
        }
    }

    /**
     * Focus the question area
     */
    focusQuestion() {
        if (this.elements.questionText) {
            this.elements.questionText.focus();
            this.showFeedback('❓ Question focused - Use number keys to select answers', 'info');
        }
    }

    /**
     * Show keyboard help dialog
     */
    showKeyboardHelp() {
        const helpText = `
🎮 LobeLabyrinth Keyboard Controls

📍 NAVIGATION
• Arrow Keys / WASD: Navigate map
• Enter / Space: Enter room or confirm action
• Escape: Go back or clear selection

❓ QUESTIONS
• 1-4: Select answer options
• H: Show hint
• S: Skip question
• N: New question
• Enter: Submit selected answer

🎯 SHORTCUTS
• Ctrl+S: Save game
• Ctrl+L: Load game
• Ctrl+R: Reset game
• Ctrl+H: Show this help
• Ctrl+N: New question
• Ctrl+P: Pause/Resume timer
• Alt+A: View achievements
• Alt+M: Focus map
• Alt+Q: Focus question
• Alt+S: Quick stats
• Alt+H: Quick hint
• F1: Show help
• F2: Quick stats
• F5: Refresh room
• ?: Show help

🏆 VICTORY SCREEN
• 1: Play again
• 2: View achievements
• 3: Share results
• Escape: Close

🚀 ADVANCED
• Ctrl+Shift+R: Force reset
• Ctrl+Shift+D: Debug mode
• Ctrl+Shift+S: Export save

Press any key to close this help.
        `;
        
        this.showFeedback(helpText.trim(), 'info', 8000);
    }

    /**
     * Show quick statistics overlay
     */
    showQuickStats() {
        try {
            const stats = this.gameState.getGameStatistics();
            const quickStatsText = `
📊 Quick Stats

🏆 Score: ${stats.finalScore.toLocaleString()}
⚡ Accuracy: ${stats.accuracyPercent}%
🗺️ Rooms: ${stats.roomsExploredPercent}% explored
⏱️ Time: ${this.gameState.formatTime(stats.totalTime)}
🎯 Correct: ${stats.correctAnswers}/${stats.totalAnswers}
            `;
            
            this.showTooltip(quickStatsText.trim(), 4000);
        } catch (error) {
            console.error('Error showing quick stats:', error);
            this.showTooltip('Stats not available', 2000);
        }
    }

    /**
     * Toggle timer pause/resume
     */
    toggleTimer() {
        if (this.gameState.isPaused) {
            this.gameState.resumeTimer();
            this.showTooltip('⏱️ Timer resumed', 1500);
        } else {
            this.gameState.pauseTimer();
            this.showTooltip('⏸️ Timer paused', 1500);
        }
    }

    /**
     * Confirm and reset game (for Ctrl+Shift+R)
     */
    confirmAndResetGame() {
        const confirmed = confirm('Are you sure you want to completely reset the game? This will lose all progress.');
        if (confirmed) {
            this.resetGame();
            this.showTooltip('🔄 Game completely reset', 2000);
        }
    }

    /**
     * Toggle debug mode
     */
    toggleDebugMode() {
        if (window.gameDebugMode === undefined) {
            window.gameDebugMode = false;
        }
        
        window.gameDebugMode = !window.gameDebugMode;
        
        if (window.gameDebugMode) {
            this.showTooltip('🔧 Debug mode enabled', 2000);
            console.log('Debug mode enabled - Game state:', this.gameState);
        } else {
            this.showTooltip('🔧 Debug mode disabled', 2000);
        }
    }

    /**
     * Export save data
     */
    exportSaveData() {
        try {
            const saveData = this.gameState.exportSaveData();
            const blob = new Blob([JSON.stringify(saveData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `lobe-labyrinth-save-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            this.showTooltip('💾 Save data exported', 2000);
        } catch (error) {
            console.error('Error exporting save data:', error);
            this.showTooltip('❌ Export failed', 2000);
        }
    }

    /**
     * Refresh current room
     */
    refreshCurrentRoom() {
        try {
            this.updateDisplay();
            if (this.currentQuestion) {
                this.clearQuestion();
            }
            this.showTooltip('🔄 Room refreshed', 1500);
        } catch (error) {
            console.error('Error refreshing room:', error);
            this.showTooltip('❌ Refresh failed', 2000);
        }
    }

    /**
     * Cycle focus through interactive elements
     */
    cycleFocus() {
        const focusableElements = [
            ...document.querySelectorAll('.answer-btn'),
            ...document.querySelectorAll('button'),
            document.getElementById('game-canvas')
        ].filter(el => el && el.style.display !== 'none');

        if (focusableElements.length === 0) return;

        const currentIndex = focusableElements.indexOf(document.activeElement);
        const nextIndex = (currentIndex + 1) % focusableElements.length;
        
        focusableElements[nextIndex].focus();
        this.showTooltip(`Focus: ${focusableElements[nextIndex].tagName}`, 1000);
    }

    /**
     * Check if target is an input field
     */
    isInInputField(target) {
        return target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true');
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
        console.log('Game completed:', data);
        
        // Show brief success message
        this.showFeedback(`🎉 Congratulations! Game completed!`, 'success');
        
        // Show victory screen after a brief delay
        setTimeout(() => {
            this.showVictoryScreen(data);
        }, 1500);
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

    /**
     * Show victory screen with game statistics
     */
    showVictoryScreen(data) {
        if (!this.elements.victoryScreen) {
            console.error('Victory screen element not found');
            return;
        }

        try {
            // Get comprehensive game statistics
            const stats = this.gameState.getGameStatistics();
            
            // Update victory screen content
            this.updateVictoryScreenContent(stats, data);
            
            // Show victory screen with animation
            this.elements.victoryScreen.style.display = 'flex';
            this.elements.victoryScreen.classList.add('show');
            
            console.log('Victory screen displayed');
        } catch (error) {
            console.error('Error showing victory screen:', error);
        }
    }

    /**
     * Update victory screen content with game statistics
     */
    /**
     * Update victory screen content with comprehensive game statistics
     * @param {Object} stats - Game statistics from gameState.getGameStatistics()
     * @param {Object} data - Victory data
     */
    updateVictoryScreenContent(stats, data) {
        try {
            console.log('Updating victory screen with stats:', stats);
            
            // Update main statistics
            if (this.elements.victoryFinalScore) {
                this.elements.victoryFinalScore.textContent = stats.finalScore.toLocaleString();
            }
            
            if (this.elements.victoryTime) {
                this.elements.victoryTime.textContent = stats.playTimeFormatted;
            }
            
            if (this.elements.victoryAccuracy) {
                this.elements.victoryAccuracy.textContent = `${stats.accuracyPercent}%`;
            }
            
            if (this.elements.victoryRooms) {
                this.elements.victoryRooms.textContent = `${stats.roomsVisited}/${stats.roomsTotal}`;
            }
            
            // Update score breakdown
            if (this.elements.victoryBaseScore) {
                this.elements.victoryBaseScore.textContent = stats.baseScore.toLocaleString();
            }
            
            if (this.elements.victoryCompletionBonus) {
                this.elements.victoryCompletionBonus.textContent = `+${stats.completionBonus}`;
            }
            
            if (this.elements.victoryExplorationBonus) {
                this.elements.victoryExplorationBonus.textContent = `+${stats.explorationBonus}`;
            }
            
            // Show/hide conditional bonuses
            const perfectBonusItem = document.getElementById('victory-perfect-bonus-item');
            if (perfectBonusItem) {
                if (stats.perfectBonus > 0) {
                    perfectBonusItem.style.display = 'flex';
                    if (this.elements.victoryPerfectBonus) {
                        this.elements.victoryPerfectBonus.textContent = `+${stats.perfectBonus}`;
                    }
                } else {
                    perfectBonusItem.style.display = 'none';
                }
            }
            
            const speedBonusItem = document.getElementById('victory-speed-bonus-item');
            if (speedBonusItem) {
                if (stats.speedBonus > 0) {
                    speedBonusItem.style.display = 'flex';
                    if (this.elements.victorySpeedBonus) {
                        this.elements.victorySpeedBonus.textContent = `+${stats.speedBonus}`;
                    }
                } else {
                    speedBonusItem.style.display = 'none';
                }
            }
            
            // Update achievement bonus
            if (this.elements.victoryAchievementBonus) {
                const achievementPoints = this.achievementManager ? this.achievementManager.getTotalPoints() : 0;
                this.elements.victoryAchievementBonus.textContent = `+${achievementPoints}`;
            }
            
            // Update achievement icons
            this.updateAchievementIcons();
            
            // Update performance grade
            this.updatePerformanceGrade(stats);
            
        } catch (error) {
            console.error('Error updating victory screen content:', error);
        }
    }

    /**
     * Update achievement icons in victory screen
     */
    updateAchievementIcons() {
        if (!this.elements.victoryAchievementIcons || !this.achievementManager) {
            return;
        }
        
        try {
            const unlockedAchievements = this.achievementManager.getUnlockedAchievements();
            this.elements.victoryAchievementIcons.innerHTML = '';
            
            if (unlockedAchievements.length === 0) {
                this.elements.victoryAchievementIcons.innerHTML = '<p class="no-achievements">No achievements unlocked yet</p>';
                return;
            }
            
            unlockedAchievements.slice(0, 6).forEach(achievement => {
                const iconElement = document.createElement('div');
                iconElement.className = 'achievement-icon';
                iconElement.innerHTML = `
                    <span class="achievement-emoji">${achievement.icon || '🏆'}</span>
                    <span class="achievement-name">${achievement.name}</span>
                `;
                iconElement.title = achievement.description;
                this.elements.victoryAchievementIcons.appendChild(iconElement);
            });
            
            if (unlockedAchievements.length > 6) {
                const moreElement = document.createElement('div');
                moreElement.className = 'achievement-icon more-achievements';
                moreElement.innerHTML = `<span class="achievement-count">+${unlockedAchievements.length - 6}</span>`;
                moreElement.title = 'Click "View All Achievements" to see more';
                this.elements.victoryAchievementIcons.appendChild(moreElement);
            }
            
        } catch (error) {
            console.error('Error updating achievement icons:', error);
        }
    }
    /**
     * Update performance grade display
     * @param {Object} stats - Game statistics
     */
    updatePerformanceGrade(stats) {
        if (!this.elements.victoryGrade) {
            return;
        }
        
        try {
            const grade = this.calculatePerformanceGrade(stats);
            const gradeInfo = this.getGradeInfo(grade, stats);
            
            this.elements.victoryGrade.textContent = gradeInfo.message;
            this.elements.victoryGrade.className = `completion-grade grade-${grade.toLowerCase()}`;
            
        } catch (error) {
            console.error('Error updating performance grade:', error);
        }
    }
    
    /**
     * Calculate performance grade based on statistics
     * @param {Object} stats - Game statistics
     * @returns {string} Performance grade (S, A, B, C, D, F)
     */
    calculatePerformanceGrade(stats) {
        const score = stats.performanceScore || 
                     ((stats.accuracyPercent * 0.5) + 
                      (stats.roomsExploredPercent * 0.3) + 
                      (stats.questionsAnsweredPercent * 0.2));

        if (score >= 95) return 'S';
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }
    
    /**
     * Get grade information and message
     * @param {string} grade - Performance grade
     * @param {Object} stats - Game statistics
     * @returns {Object} Grade information
     */
    getGradeInfo(grade, stats) {
        const gradeMessages = {
            'S': 'Legendary Performance! 🌟',
            'A': 'Excellent Work! 🎉',
            'B': 'Good Job! 👍',
            'C': 'Nice Try! 😊',
            'D': 'Keep Practicing! 💪',
            'F': 'Better Luck Next Time! 🔄'
        };
        
        return {
            grade,
            message: gradeMessages[grade] || 'Performance Evaluated!',
            score: stats.performanceScore || 0
        };
    }

    /**
     * Hide victory screen
     */
    hideVictoryScreen() {
        if (this.elements.victoryScreen) {
            this.elements.victoryScreen.classList.remove('show');
            setTimeout(() => {
                this.elements.victoryScreen.style.display = 'none';
            }, 300);
        }
    }

    /**
     * Handle play again button click
     */
    handlePlayAgain() {
        this.hideVictoryScreen();
        setTimeout(() => {
            this.resetGame();
        }, 300);
    }

    /**
     * Show achievements panel
     */
    showAchievements() {
        if (this.achievementManager) {
            // If there's an achievement display method, use it
            if (typeof this.achievementManager.showAchievements === 'function') {
                this.achievementManager.showAchievements();
            } else {
                console.log('Achievement display not implemented yet');
                this.showFeedback('Achievement display coming soon!', 'info');
            }
        }
    }

    /**
     * Share game results
     */
    shareResults() {
        try {
            const stats = this.gameState.getGameStatistics();
            const shareText = `🎮 I just completed Lobe Labyrinth! 🧠\n\n` +
                            `🏆 Final Score: ${stats.finalScore.toLocaleString()}\n` +
                            `⚡ Accuracy: ${stats.accuracyPercent}%\n` +
                            `🗺️ Rooms Explored: ${stats.roomsExploredPercent}%\n` +
                            `⏱️ Time: ${this.gameState.formatTime(stats.totalTime)}\n\n` +
                            `Can you beat my score? 🚀`;

            if (navigator.share) {
                navigator.share({
                    title: 'Lobe Labyrinth Results',
                    text: shareText
                }).catch(console.error);
            } else if (navigator.clipboard) {
                navigator.clipboard.writeText(shareText).then(() => {
                    this.showFeedback('Results copied to clipboard!', 'success');
                }).catch(() => {
                    this.fallbackShare(shareText);
                });
            } else {
                this.fallbackShare(shareText);
            }
        } catch (error) {
            console.error('Error sharing results:', error);
            this.showFeedback('Unable to share results', 'error');
        }
    }

    /**
     * Hide victory screen with animation
     */
    hideVictoryScreen() {
        if (!this.elements.victoryScreen) {
            return;
        }
        
        try {
            this.elements.victoryScreen.classList.remove('show');
            this.elements.victoryScreen.classList.add('hide');
            
            setTimeout(() => {
                this.elements.victoryScreen.style.display = 'none';
                this.elements.victoryScreen.classList.remove('hide');
            }, 300);
            
            console.log('Victory screen hidden');
        } catch (error) {
            console.error('Error hiding victory screen:', error);
        }
    }

    /**
     * Handle play again button click
     */
    handlePlayAgain() {
        try {
            console.log('Play again requested');
            
            // Hide victory screen
            this.hideVictoryScreen();
            
            // Reset game after animation
            setTimeout(() => {
                this.resetGame();
                this.showFeedback('🎮 Starting new game...', 'info');
            }, 500);
            
        } catch (error) {
            console.error('Error handling play again:', error);
            this.showFeedback('❌ Error starting new game', 'error');
        }
    }
    
    /**
     * Handle view achievements button click
     */
    handleViewAchievements() {
        try {
            console.log('View achievements requested');
            
            if (this.achievementManager && typeof this.achievementManager.showAchievementGallery === 'function') {
                this.achievementManager.showAchievementGallery();
            } else {
                this.showFeedback('🏆 Achievement gallery coming soon!', 'info');
            }
            
        } catch (error) {
            console.error('Error viewing achievements:', error);
            this.showFeedback('❌ Error loading achievements', 'error');
        }
    }
    
    /**
     * Handle share results button click
     */
    handleShareResults() {
        try {
            console.log('Share results requested');
            
            const stats = this.gameState.getGameStatistics();
            const grade = this.calculatePerformanceGrade(stats);
            
            const shareText = `🏰 I just completed LobeLabyrinth! 🧠\n\n` +
                            `🏆 Final Score: ${stats.finalScore.toLocaleString()}\n` +
                            `⏱️ Time: ${stats.playTimeFormatted}\n` +
                            `🎯 Accuracy: ${stats.accuracyPercent}%\n` +
                            `🗺️ Rooms Explored: ${stats.roomsVisited}/${stats.roomsTotal}\n` +
                            `📊 Grade: ${grade}\n\n` +
                            `Can you beat my score? 🚀`;
            
            // Try Web Share API first (mobile/modern browsers)
            if (navigator.share) {
                navigator.share({
                    title: 'LobeLabyrinth Results',
                    text: shareText
                }).then(() => {
                    this.showFeedback('✅ Results shared successfully!', 'success');
                }).catch((error) => {
                    console.log('Share failed, falling back to clipboard');
                    this.copyToClipboard(shareText);
                });
            } else {
                // Fallback to clipboard
                this.copyToClipboard(shareText);
            }
            
        } catch (error) {
            console.error('Error sharing results:', error);
            this.showFeedback('❌ Error sharing results', 'error');
        }
    }
    
    /**
     * Copy text to clipboard with fallback
     * @param {string} text - Text to copy
     */
    copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                this.showFeedback('📋 Results copied to clipboard!', 'success');
            }).catch(() => {
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    }
    
    /**
     * Fallback clipboard copy method
     * @param {string} text - Text to copy
     */
    fallbackCopyToClipboard(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
                this.showFeedback('📋 Results copied to clipboard!', 'success');
            } else {
                this.showFeedback('❌ Could not copy results', 'error');
            }
        } catch (error) {
            console.error('Fallback copy failed:', error);
            this.showFeedback('❌ Copy not supported in this browser', 'error');
        }
    }

    /**
     * Show a temporary tooltip message
     * @param {string} message - The message to display
     * @param {number} duration - How long to show the tooltip in milliseconds (default: 2000)
     */
    showTooltip(message, duration = 2000) {
        // Remove any existing tooltip
        const existingTooltip = document.getElementById('game-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }

        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.id = 'game-tooltip';
        tooltip.textContent = message;
        tooltip.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 10000;
            pointer-events: none;
            animation: fadeInOut ${duration}ms ease;
        `;

        // Add CSS animation if not already present
        if (!document.getElementById('tooltip-styles')) {
            const style = document.createElement('style');
            style.id = 'tooltip-styles';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    10% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    90% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
            `;
            document.head.appendChild(style);
        }

        // Add to page
        document.body.appendChild(tooltip);

        // Remove after duration
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.remove();
            }
        }, duration);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}