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
        this.questionActive = false;
        this.previousScore = 0; // Track previous score for animations
        
        // Achievement notification queue
        this.achievementQueue = [];
        this.showingAchievement = false;
        
        // Track answer button listeners for cleanup
        this.answerButtonListeners = [];
        
        // Track timer state for accessibility announcements
        this.previousTimeRemaining = null;
        this.lastTimerWarning = null;
        
        console.log('UIManager initialized with animations:', !!this.animationManager, 'achievements:', !!this.achievementManager);
        this.initializeElements();
        this.setupEventListeners();
        this.setupAriaLiveRegions();
        this.updateDisplay();
        this.setupAchievementNotifications();
        
        // Initialize loading state management
        this.loadingStates = new Map();
        
        // Initialize haptic feedback system
        this.setupHapticFeedback();
    }

    /**
     * Initialize DOM element references with efficient caching and error handling
     */
    initializeElements() {
        // Cache elements once with error handling
        this.elements = this.getElementsByIds([
            // Room display
            'room-info', 'room-name', 'room-description', 'room-connections',
            
            // Question area
            'question-area', 'question-text', 'question-category', 'question-difficulty', 'question-points',
            
            // Answer area
            'answer-area', 'answer-buttons',
            
            // Timer
            'timer-area', 'timer-bar', 'timer-text',
            
            // Score and stats
            'score-display', 'current-score', 'questions-answered', 'rooms-visited',
            
            // Progress indicators
            'progress-indicators', 'overall-progress-percent', 'overall-progress-fill',
            'rooms-progress-percent', 'rooms-progress-fill', 'accuracy-progress-percent',
            'accuracy-progress-fill', 'play-time-display', 'time-pulse',
            
            // Game controls
            'game-controls', 'new-question-btn', 'hint-btn', 'skip-btn',
            'save-btn', 'load-btn', 'reset-btn',
            
            // Feedback area
            'feedback-area',
            
            // Navigation
            'navigation-area', 'available-rooms',
            
            // Achievement elements
            'achievement-notification', 'achievement-gallery', 'achievement-toggle', 'achievement-stats',
            
            // Victory screen elements
            'victory-screen', 'victory-final-score', 'victory-time', 'victory-accuracy',
            'victory-rooms', 'victory-base-score', 'victory-completion-bonus',
            'victory-exploration-bonus', 'victory-perfect-bonus', 'victory-speed-bonus',
            'victory-achievement-bonus', 'victory-achievement-icons', 'victory-grade',
            
            // Victory action buttons
            'play-again-btn', 'view-achievements-btn', 'share-results-btn'
        ]);

        console.log('UI elements initialized with caching');
    }

    /**
     * Efficiently cache DOM elements by ID with error handling
     * @param {string[]} ids - Array of element IDs to cache
     * @returns {Object} Object with camelCase keys and cached DOM elements
     */
    getElementsByIds(ids) {
        const elements = {};
        ids.forEach(id => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`UIManager: Element with ID '${id}' not found in DOM`);
            }
            // Convert kebab-case to camelCase for object keys
            const camelCaseKey = id.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
            elements[camelCaseKey] = element;
        });
        return elements;
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
        if (this.elements.playAgainBtn) {
            this.elements.playAgainBtn.addEventListener('click', () => this.handlePlayAgain());
        }
        
        if (this.elements.viewAchievementsBtn) {
            this.elements.viewAchievementsBtn.addEventListener('click', () => this.showAchievements());
        }
        
        if (this.elements.shareResultsBtn) {
            this.elements.shareResultsBtn.addEventListener('click', () => this.shareResults());
        }
        
        // Note: victoryClose element would need to be added to HTML if close functionality is needed

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
        
        // Add single global keyboard event listener for efficiency
        document.addEventListener('keydown', (event) => {
            // Handle preventDefault first to avoid unnecessary processing
            if (this.shouldPreventDefault(event)) {
                event.preventDefault();
            }
            
            // Process keyboard input
            this.handleKeyboardInput(event);
        });
        
        console.log('Keyboard navigation setup complete');
    }

    /**
     * Setup ARIA live regions for screen reader announcements
     */
    setupAriaLiveRegions() {
        // Create polite announcements region for score updates
        this.politeRegion = document.createElement('div');
        this.politeRegion.setAttribute('aria-live', 'polite');
        this.politeRegion.setAttribute('aria-atomic', 'true');
        this.politeRegion.className = 'sr-only';
        this.politeRegion.id = 'polite-announcements';
        document.body.appendChild(this.politeRegion);
        
        // Create assertive announcements region for urgent messages (timer warnings)
        this.assertiveRegion = document.createElement('div');
        this.assertiveRegion.setAttribute('aria-live', 'assertive');
        this.assertiveRegion.setAttribute('aria-atomic', 'true');
        this.assertiveRegion.className = 'sr-only';
        this.assertiveRegion.id = 'assertive-announcements';
        document.body.appendChild(this.assertiveRegion);
        
        console.log('ARIA live regions initialized for accessibility');
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     * @param {string} priority - 'polite' or 'assertive'
     */
    announceToScreenReader(message, priority = 'polite') {
        const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
        
        if (region) {
            // Clear previous message first
            region.textContent = '';
            
            // Set new message after a brief delay to ensure screen readers detect the change
            setTimeout(() => {
                region.textContent = message;
                
                // Clear message after announcement to avoid repetition
                setTimeout(() => {
                    region.textContent = '';
                }, 1000);
            }, 100);
        }
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
            
            if (this.checkQuestionActive()) {
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
        return this.currentQuestion && this.questionActive === true;
    }

    /**
     * Alternative method to check if question is active (for debugging)
     * @returns {boolean} True if question is active
     */
    checkQuestionActive() {
        return this.currentQuestion && this.questionActive === true;
    }

    /**
     * Check if map should receive navigation input
     * @returns {boolean} True if map should handle navigation
     */
    isMapFocused() {
        return !this.checkQuestionActive() && !this.isVictoryScreenVisible();
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
            // Remove previous highlights and aria-checked states
            document.querySelectorAll('.answer-btn').forEach((btn, i) => {
                btn.classList.remove('keyboard-selected');
                btn.setAttribute('aria-checked', 'false');
            });
            
            // Add highlight to selected answer
            const answerButtons = document.querySelectorAll('.answer-btn');
            if (answerButtons && answerButtons[index]) {
                answerButtons[index].classList.add('keyboard-selected');
                answerButtons[index].setAttribute('aria-checked', 'true');
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
            btn.setAttribute('aria-checked', 'false');
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
        const mapCanvas = document.getElementById('map-canvas');
        const focusableElements = [
            ...document.querySelectorAll('.answer-btn'),
            ...document.querySelectorAll('button'),
            mapCanvas
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
        
        // Update notification content with escaped data to prevent XSS
        notification.innerHTML = `
            <div class="achievement-unlock-animation">
                <div class="achievement-icon">${this.escapeHtml(achievement.icon)}</div>
                <div class="achievement-details">
                    <div class="achievement-title">Achievement Unlocked!</div>
                    <div class="achievement-name">${this.escapeHtml(achievement.name)}</div>
                    <div class="achievement-description">${this.escapeHtml(achievement.description)}</div>
                    <div class="achievement-points">+${achievement.points} points</div>
                </div>
                <div class="achievement-rarity achievement-rarity-${this.escapeHtml(achievement.rarity)}">
                    ${this.escapeHtml(achievement.rarity).toUpperCase()}
                </div>
            </div>
        `;
        
        // Add CSS classes for animation
        notification.className = 'achievement-notification show';
        
        // Use animation manager if available
        if (this.animationManager) {
            // Pass achievement data and container to animation manager
            await this.animationManager.animateAchievementUnlock(achievement, notification);
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
                    <div class="achievement-card ${unlockClass} achievement-rarity-${this.escapeHtml(achievement.rarity)}">
                        <div class="achievement-icon">${this.escapeHtml(achievement.icon)}</div>
                        <div class="achievement-info">
                            <div class="achievement-name">${this.escapeHtml(achievement.name)}</div>
                            <div class="achievement-description">${this.escapeHtml(achievement.description)}</div>
                            <div class="achievement-progress-bar">
                                <div class="achievement-progress-fill" style="width: ${progressWidth}%"></div>
                            </div>
                            <div class="achievement-meta">
                                <span class="achievement-points">${achievement.points} pts</span>
                                <span class="achievement-rarity">${this.escapeHtml(achievement.rarity)}</span>
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

            // Update room connections with text indicators
            if (this.elements.roomConnections && currentRoom.connections) {
                const connectionsHtml = currentRoom.connections
                    .map(roomId => {
                        const isUnlocked = this.gameState.unlockedRooms.has(roomId);
                        const className = isUnlocked ? 'connection-unlocked' : 'connection-locked';
                        const statusIcon = isUnlocked ? '\u2713' : '\u1F512'; // ✓ or 🔒
                        const statusText = isUnlocked ? ' (accessible)' : ' (locked)';
                        return `<span class="${className}" title="${roomId}${statusText}">${statusIcon} ${roomId}</span>`;
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
        const scoreChange = stats.score - this.previousScore;
        
        // Animate score change if AnimationManager is available
        if (this.elements.currentScore && this.animationManager) {
            try {
                // Only animate if score has changed significantly (more than just page refresh)
                if (Math.abs(scoreChange) > 0 && this.previousScore !== 0) {
                    console.log(`Animating score: ${this.previousScore} → ${stats.score}`);
                    await this.animationManager.animateScoreIncrease(
                        this.elements.currentScore, 
                        this.previousScore, 
                        stats.score
                    );
                    
                    // Announce significant score changes to screen readers
                    if (scoreChange >= 100) {
                        this.announceToScreenReader(`Great! Score increased by ${scoreChange} points. Total score: ${stats.score}`);
                    } else if (scoreChange >= 50) {
                        this.announceToScreenReader(`Score increased by ${scoreChange} points. Total score: ${stats.score}`);
                    }
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
            
            // Announce score changes without animation
            if (Math.abs(scoreChange) >= 50 && this.previousScore !== 0) {
                this.announceToScreenReader(`Score updated: ${stats.score} points`);
            }
            
            this.previousScore = stats.score;
        }
        
        if (this.elements.questionsAnswered) {
            this.elements.questionsAnswered.textContent = stats.questionsAnswered;
        }
        
        if (this.elements.roomsVisited) {
            this.elements.roomsVisited.textContent = stats.roomsVisited;
        }

        // Update progress indicators
        this.updateProgressIndicators();
    }

    /**
     * Update visual progress indicators
     */
    updateProgressIndicators() {
        try {
            const stats = this.gameState.getGameStatistics();
            
            // Overall progress (combination of rooms and accuracy)
            const overallProgress = Math.round((stats.roomsExploredPercent + stats.accuracyPercent) / 2);
            this.updateProgressBar('overall', overallProgress);
            
            // Room exploration progress
            this.updateProgressBar('rooms', stats.roomsExploredPercent);
            
            // Answer accuracy progress
            this.updateProgressBar('accuracy', stats.accuracyPercent);
            
            // Play time display
            if (this.elements.playTimeDisplay) {
                const timeInCurrentRoom = this.gameState.getTimeInCurrentRoom();
                this.elements.playTimeDisplay.textContent = this.gameState.formatTime(timeInCurrentRoom);
            }
            
        } catch (error) {
            console.error('Error updating progress indicators:', error);
        }
    }

    /**
     * Update individual progress bar
     * @param {string} type - Progress bar type (overall, rooms, accuracy)
     * @param {number} percentage - Progress percentage (0-100)
     */
    updateProgressBar(type, percentage) {
        const percentElement = this.elements[`${type}ProgressPercent`];
        const fillElement = this.elements[`${type}ProgressFill`];
        
        if (percentElement && fillElement) {
            // Clamp percentage between 0 and 100
            const clampedPercentage = Math.max(0, Math.min(100, percentage || 0));
            
            percentElement.textContent = `${clampedPercentage}%`;
            fillElement.style.width = `${clampedPercentage}%`;
            
            // Add visual feedback for milestones
            if (clampedPercentage >= 100) {
                fillElement.classList.add('completed');
            } else {
                fillElement.classList.remove('completed');
            }
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
            this.elements.newQuestionBtn.disabled = this.questionActive;
        }
        
        if (this.elements.hintBtn) {
            this.elements.hintBtn.disabled = !this.questionActive;
        }
        
        if (this.elements.skipBtn) {
            this.elements.skipBtn.disabled = !this.questionActive;
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
        this.questionActive = true;
        
        // Reset timer warning tracking for new question
        this.lastTimerWarning = null;
        
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

        // Clear existing listeners before creating new buttons
        this.clearAnswerButtonListeners();

        // Add radiogroup role to container for proper semantics
        this.elements.answerButtons.setAttribute('role', 'radiogroup');
        this.elements.answerButtons.setAttribute('aria-label', 'Answer options');

        const buttonsHtml = questionData.answers.map((answer, index) => 
            `<button class="answer-btn" 
                     data-answer="${index}"
                     role="radio"
                     aria-checked="false"
                     aria-posinset="${index + 1}"
                     aria-setsize="${questionData.answers.length}"
                     aria-label="Option ${String.fromCharCode(65 + index)}: ${this.escapeHtml(answer)}"
                     tabindex="${index === 0 ? '0' : '-1'}">
                <span class="answer-letter" aria-hidden="true">${String.fromCharCode(65 + index)}.</span>
                <span class="answer-text">${this.escapeHtml(answer)}</span>
            </button>`
        ).join('');

        this.elements.answerButtons.innerHTML = buttonsHtml;
        
        if (this.elements.answerArea) {
            this.elements.answerArea.style.display = 'block';
        }

        // Setup event listeners with proper tracking
        this.setupAnswerButtonListeners();
    }

    /**
     * Clear existing answer button listeners to prevent memory leaks
     */
    clearAnswerButtonListeners() {
        if (this.answerButtonListeners) {
            this.answerButtonListeners.forEach(listener => {
                listener.element.removeEventListener(listener.event, listener.handler);
            });
            this.answerButtonListeners = [];
        }
    }

    /**
     * Setup all event listeners for answer buttons with proper tracking
     */
    setupAnswerButtonListeners() {
        const buttons = document.querySelectorAll('.answer-btn');
        
        buttons.forEach((button, index) => {
            // Click handler
            const clickHandler = () => this.selectAnswer(index);
            button.addEventListener('click', clickHandler);
            this.answerButtonListeners.push({
                element: button,
                event: 'click',
                handler: clickHandler
            });
            
            // Keyboard handler
            const keyHandler = (e) => {
                switch (e.key) {
                    case 'ArrowDown':
                    case 'ArrowRight':
                        e.preventDefault();
                        const nextIndex = (index + 1) % buttons.length;
                        this.focusAnswerButton(nextIndex);
                        break;
                    case 'ArrowUp':
                    case 'ArrowLeft':
                        e.preventDefault();
                        const prevIndex = (index - 1 + buttons.length) % buttons.length;
                        this.focusAnswerButton(prevIndex);
                        break;
                    case ' ':
                    case 'Enter':
                        e.preventDefault();
                        this.selectAnswer(index);
                        break;
                }
            };
            button.addEventListener('keydown', keyHandler);
            this.answerButtonListeners.push({
                element: button,
                event: 'keydown',
                handler: keyHandler
            });
        });
    }

    /**
     * Escape HTML to prevent XSS attacks
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Setup keyboard navigation for answer buttons (radio group pattern)
     * @deprecated Use setupAnswerButtonListeners instead
     */
    setupAnswerButtonKeyNavigation() {
        console.warn('setupAnswerButtonKeyNavigation is deprecated. Use setupAnswerButtonListeners instead.');
        // This method is deprecated to prevent memory leaks
        // The new setupAnswerButtonListeners method provides proper cleanup
    }

    /**
     * Focus specific answer button and update tabindex and aria-checked
     */
    focusAnswerButton(index) {
        const buttons = document.querySelectorAll('.answer-btn');
        
        buttons.forEach((btn, i) => {
            btn.tabIndex = i === index ? 0 : -1;
            btn.setAttribute('aria-checked', i === index ? 'true' : 'false');
            if (i === index) {
                btn.focus();
            }
        });
    }

    /**
     * Handle answer selection
     */
    async selectAnswer(answerIndex) {
        if (!this.checkQuestionActive() || !this.currentQuestion) return;
        
        // Check if quiz engine is already processing an answer
        if (this.quizEngine && this.quizEngine.processingAnswer) {
            console.warn('Answer already being processed, ignoring click');
            return;
        }

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
     * Show hint for current question or context-aware help
     */
    showHint() {
        // If there's an active question, show question-specific hint
        if (this.checkQuestionActive() && this.quizEngine && this.currentQuestion) {
            this.showQuestionHint();
            return;
        }
        
        // Otherwise, show context-aware smart hints
        this.showSmartHint();
    }

    /**
     * Show question-specific hint
     */
    showQuestionHint() {
        const hint = this.quizEngine.getHint();
        if (hint) {
            this.showFeedback(`💡 Hint: ${hint}`, 'info');
        } else {
            // Generate smart hint based on question difficulty and category
            const smartHint = this.generateQuestionSmartHint();
            this.showFeedback(`💡 Smart Hint: ${smartHint}`, 'info');
        }
    }

    /**
     * Generate smart hint based on question properties
     */
    generateQuestionSmartHint() {
        if (!this.currentQuestion) return 'Think carefully about each option.';

        const difficulty = this.currentQuestion.difficulty;
        const category = this.currentQuestion.category;
        
        const hints = {
            'easy': [
                'This is a straightforward question - trust your first instinct!',
                'Look for the most obvious answer.',
                'Easy questions usually have clear, direct answers.'
            ],
            'medium': [
                'Consider all options carefully.',
                'Think about what you know about this topic.',
                'Look for clues in the question wording.',
                'Eliminate obviously wrong answers first.'
            ],
            'hard': [
                'Break down the question into smaller parts.',
                'Use process of elimination.',
                'Consider what makes each answer unique.',
                'Hard questions often test specific knowledge - think precisely.'
            ]
        };

        const categoryHints = {
            'science': 'Think about scientific principles and facts.',
            'history': 'Consider the time period and context.',
            'literature': 'Think about themes, characters, and literary devices.',
            'general': 'Use your general knowledge and common sense.',
            'art': 'Consider artistic movements and techniques.',
            'geography': 'Think about locations, features, and relationships.'
        };

        const difficultyHints = hints[difficulty] || hints['medium'];
        const categoryHint = categoryHints[category.toLowerCase()] || categoryHints['general'];
        
        const randomDifficultyHint = difficultyHints[Math.floor(Math.random() * difficultyHints.length)];
        
        return `${randomDifficultyHint} ${categoryHint}`;
    }

    /**
     * Show context-aware smart hints based on game state
     */
    showSmartHint() {
        const stats = this.gameState.getGameStatistics();
        const currentRoom = this.gameState.currentRoomId;
        const isNewPlayer = stats.totalAnswers < 5;
        const hasLowAccuracy = stats.accuracyPercent < 50;
        const isStuck = this.gameState.getTimeInCurrentRoom() > 120000; // 2 minutes
        
        let hint = '';
        
        if (isNewPlayer) {
            hint = this.getNewPlayerHints();
        } else if (hasLowAccuracy) {
            hint = this.getLowAccuracyHints();
        } else if (isStuck) {
            hint = this.getStuckPlayerHints();
        } else if (!this.currentQuestion) {
            hint = this.getNavigationHints();
        } else {
            hint = this.getGeneralGameplayHints();
        }
        
        this.showTooltip(`💡 Smart Tip: ${hint}`, 4000);
    }

    /**
     * Get hints for new players
     */
    getNewPlayerHints() {
        const hints = [
            'Welcome! Click on connected rooms (orange) to explore the castle.',
            'Answer questions correctly to unlock new areas and earn points.',
            'Use keyboard shortcuts: 1-4 for answers, H for hints, S to save.',
            'Green rooms are visited, blue is current, orange are accessible.',
            'Your goal is to explore all rooms and answer questions correctly.',
            'Double-click rooms for quick movement!',
            'Press F1 or ? for a complete list of keyboard shortcuts.'
        ];
        
        return hints[Math.floor(Math.random() * hints.length)];
    }

    /**
     * Get hints for players with low accuracy
     */
    getLowAccuracyHints() {
        const hints = [
            'Take your time reading questions carefully.',
            'Use the hint button (H) when you\'re unsure.',
            'Try to eliminate obviously wrong answers first.',
            'Don\'t rush - accuracy is more important than speed.',
            'Review the question category for context clues.',
            'If stuck, skip the question and come back later.',
            'Consider the question difficulty - easier questions have more obvious answers.'
        ];
        
        return hints[Math.floor(Math.random() * hints.length)];
    }

    /**
     * Get hints for stuck players
     */
    getStuckPlayerHints() {
        const hints = [
            'Feeling stuck? Try moving to a different room for a change of pace.',
            'Skip difficult questions and return to them later.',
            'Look for rooms with easier questions to build confidence.',
            'Use Ctrl+N to get a new question in the current room.',
            'Check your progress with F2 or Alt+S for quick stats.',
            'Try exploring rooms you haven\'t visited yet.',
            'Consider taking a short break - fresh perspective helps!'
        ];
        
        return hints[Math.floor(Math.random() * hints.length)];
    }

    /**
     * Get navigation hints
     */
    getNavigationHints() {
        const hints = [
            'Click on orange rooms to move there and get new questions.',
            'Use arrow keys or WASD to navigate the map quickly.',
            'Double-click rooms for instant movement.',
            'Green rooms are completed, blue is current, orange are accessible.',
            'Look for rooms you haven\'t fully explored yet.',
            'Some rooms may unlock new areas when completed.',
            'Try visiting different room types for varied questions.'
        ];
        
        return hints[Math.floor(Math.random() * hints.length)];
    }

    /**
     * Get general gameplay hints
     */
    getGeneralGameplayHints() {
        const hints = [
            'Maintain a steady pace - consistency beats speed.',
            'Use keyboard shortcuts to play more efficiently.',
            'Save your progress regularly with Ctrl+S.',
            'Track your progress with the quick stats (F2).',
            'Explore all rooms to maximize your score.',
            'Each room type offers different categories of questions.',
            'Aim for high accuracy to unlock achievement bonuses.'
        ];
        
        return hints[Math.floor(Math.random() * hints.length)];
    }

    /**
     * Skip current question
     */
    skipQuestion() {
        if (!this.checkQuestionActive() || !this.quizEngine) return;

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
     * Handle question answered event from GameState
     */
    handleQuestionAnswered(data) {
        // This event is emitted after GameState processes the answer
        // Most UI updates are handled by handleAnswerValidated from QuizEngine
        // This can be used for additional GameState-specific updates
        console.log('Question answered in GameState:', data);
        
        // Update score display to reflect any GameState changes
        this.updateScoreDisplay();
        
        // Update room navigation if rooms were unlocked
        if (data.isCorrect) {
            setTimeout(() => {
                this.updateNavigationOptions();
            }, 1000);
        }
    }

    /**
     * Handle timer updates with accessibility announcements
     */
    updateTimer(data) {
        if (this.elements.timerBar) {
            const percentage = 100 - data.percentage;
            this.elements.timerBar.style.width = `${percentage}%`;
            
            // Apply consistent urgency classes based on percentage
            if (data.percentage > 80) {
                this.elements.timerBar.className = 'timer-bar timer-urgent';
            } else if (data.percentage > 60) {
                this.elements.timerBar.className = 'timer-bar timer-warning';
            } else {
                this.elements.timerBar.className = 'timer-bar';
            }
        }
        
        if (this.elements.timerText) {
            const seconds = Math.ceil(data.timeRemaining / 1000);
            
            // Add text indicators for urgency levels
            let urgencyText = '';
            let urgencyClass = '';
            
            if (data.percentage > 80) {
                urgencyText = ' (URGENT)';
                urgencyClass = 'timer-urgent';
            } else if (data.percentage > 60) {
                urgencyText = ' (Warning)';
                urgencyClass = 'timer-warning';
            }
            
            this.elements.timerText.textContent = `${seconds}s${urgencyText}`;
            this.elements.timerText.className = `timer-text ${urgencyClass}`;
            
            // Announce critical time warnings to screen readers
            if (seconds === 10 && this.lastTimerWarning !== 10) {
                this.announceToScreenReader('10 seconds remaining', 'assertive');
                this.lastTimerWarning = 10;
            } else if (seconds === 5 && this.lastTimerWarning !== 5) {
                this.announceToScreenReader('5 seconds remaining', 'assertive');
                this.lastTimerWarning = 5;
            } else if (seconds === 1 && this.lastTimerWarning !== 1) {
                this.announceToScreenReader('1 second remaining', 'assertive');
                this.lastTimerWarning = 1;
            }
        }
        
        this.previousTimeRemaining = data.timeRemaining;
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
        this.questionActive = false;
        
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
            isQuestionActive: this.questionActive,
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
            try {
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
            } catch (error) {
                console.warn('UIManager: Failed to inject tooltip styles:', error);
            }
        }        // Add to page
        document.body.appendChild(tooltip);

        // Remove after duration
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.remove();
            }
        }, duration);
    }

    /**
     * Show skeleton loading state for better perceived performance
     * @param {HTMLElement} container - Container to show skeleton in
     * @param {string} type - Type of skeleton ('question', 'answers', 'room-info', 'score')
     */
    showSkeletonLoading(container, type = 'question') {
        if (!container) return;

        const loadingId = `skeleton-${Date.now()}`;
        this.loadingStates.set(container, loadingId);

        // Clear existing content
        const originalContent = container.innerHTML;
        container.setAttribute('data-original-content', originalContent);
        
        let skeletonHTML = '';
        
        switch (type) {
            case 'question':
                skeletonHTML = `
                    <div class="loading-state">
                        <div class="skeleton-loader question-skeleton" aria-label="Loading question..."></div>
                        <div class="skeleton-loader answer-skeleton"></div>
                        <div class="skeleton-loader answer-skeleton"></div>
                        <div class="skeleton-loader answer-skeleton"></div>
                        <div class="skeleton-loader answer-skeleton"></div>
                    </div>
                `;
                break;
            case 'answers':
                skeletonHTML = `
                    <div class="loading-state">
                        <div class="skeleton-loader answer-skeleton"></div>
                        <div class="skeleton-loader answer-skeleton"></div>
                        <div class="skeleton-loader answer-skeleton"></div>
                        <div class="skeleton-loader answer-skeleton"></div>
                    </div>
                `;
                break;
            case 'room-info':
                skeletonHTML = `
                    <div class="loading-state">
                        <div class="skeleton-loader room-info-skeleton" aria-label="Loading room information..."></div>
                    </div>
                `;
                break;
            case 'score':
                skeletonHTML = `
                    <div class="loading-state">
                        <div class="skeleton-loader score-skeleton"></div>
                        <div class="skeleton-loader score-skeleton"></div>
                        <div class="skeleton-loader score-skeleton"></div>
                    </div>
                `;
                break;
            default:
                skeletonHTML = `
                    <div class="loading-state">
                        <div class="skeleton-loader" style="height: 60px;" aria-label="Loading..."></div>
                    </div>
                `;
        }

        container.innerHTML = skeletonHTML;
        container.setAttribute('aria-busy', 'true');
    }

    /**
     * Hide skeleton loading and restore content
     * @param {HTMLElement} container - Container to restore
     */
    hideSkeletonLoading(container) {
        if (!container) return;

        const loadingId = this.loadingStates.get(container);
        if (!loadingId) return;

        const originalContent = container.getAttribute('data-original-content');
        if (originalContent) {
            container.innerHTML = originalContent;
            container.removeAttribute('data-original-content');
        }
        
        container.removeAttribute('aria-busy');
        this.loadingStates.delete(container);
    }

    /**
     * Show loading state with skeleton animation
     * @param {string} elementId - ID of element to show loading in
     * @param {string} type - Type of skeleton to show
     */
    showLoadingState(elementId, type = 'question') {
        const element = document.getElementById(elementId);
        if (element) {
            this.showSkeletonLoading(element, type);
        }
    }

    /**
     * Hide loading state and restore content
     * @param {string} elementId - ID of element to hide loading from
     */
    hideLoadingState(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            this.hideSkeletonLoading(element);
        }
    }

    /**
     * Setup haptic feedback system for enhanced user experience
     */
    setupHapticFeedback() {
        this.hapticSupported = 'vibrate' in navigator;
        this.hapticEnabled = true; // Could be user preference
        
        console.log('🎮 Haptic feedback:', this.hapticSupported ? 'supported' : 'not supported');
    }

    /**
     * Trigger haptic feedback with specified pattern
     * @param {string} type - Type of feedback ('tap', 'success', 'error', 'warning', 'achievement')
     */
    triggerHapticFeedback(type = 'tap') {
        if (!this.hapticSupported || !this.hapticEnabled) return;

        const patterns = {
            tap: [50],                    // Short tap
            success: [100, 50, 100],      // Double pulse
            error: [200],                 // Strong pulse
            warning: [50, 50, 50, 50, 50], // Rapid pulses
            achievement: [100, 100, 200], // Celebration pattern
            roomEnter: [75],              // Medium pulse
            questionCorrect: [50, 50, 100], // Success sequence
            questionIncorrect: [150],      // Error pulse
            buttonPress: [25],            // Subtle feedback
            milestone: [100, 50, 100, 50, 200] // Achievement milestone
        };

        const pattern = patterns[type] || patterns.tap;
        
        try {
            navigator.vibrate(pattern);
        } catch (error) {
            console.warn('Haptic feedback failed:', error);
        }
    }

    /**
     * Add micro-interaction effects to element
     * @param {HTMLElement} element - Element to enhance
     * @param {string} effectType - Type of effect ('sword', 'shield', 'crown', 'gem', 'sparkle')
     */
    addMicroInteraction(element, effectType = 'sword') {
        if (!element) return;

        // Add base micro-interaction class
        element.classList.add('micro-interaction');

        const effects = {
            sword: () => this.addSwordGleam(element),
            shield: () => this.addShieldPulse(element),
            crown: () => this.addCrownFloat(element),
            gem: () => this.addGemSparkle(element),
            sparkle: () => this.addSparkleEffect(element)
        };

        const effect = effects[effectType];
        if (effect) {
            effect();
        }
    }

    /**
     * Add sword gleam effect to element
     * @param {HTMLElement} element - Target element
     */
    addSwordGleam(element) {
        element.addEventListener('mouseenter', () => {
            if (!element.querySelector('.sword-gleam')) {
                const gleam = document.createElement('span');
                gleam.className = 'sword-gleam';
                gleam.innerHTML = '⚔️';
                gleam.style.cssText = `
                    position: absolute;
                    right: 15px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 1.2em;
                    opacity: 0;
                    animation: swordGleam 0.6s ease-out;
                    pointer-events: none;
                `;
                element.style.position = element.style.position || 'relative';
                element.appendChild(gleam);
                
                setTimeout(() => gleam.remove(), 600);
            }
        });
    }

    /**
     * Add shield pulse effect to element
     * @param {HTMLElement} element - Target element
     */
    addShieldPulse(element) {
        element.addEventListener('click', () => {
            element.style.animation = 'shieldPulse 0.8s ease-out';
            setTimeout(() => {
                element.style.animation = '';
            }, 800);
        });
    }

    /**
     * Add crown floating effect to element
     * @param {HTMLElement} element - Target element
     */
    addCrownFloat(element) {
        element.classList.add('score-increase');
        setTimeout(() => {
            element.classList.remove('score-increase');
        }, 1000);
    }

    /**
     * Add gem sparkle effect to element
     * @param {HTMLElement} element - Target element
     */
    addGemSparkle(element) {
        if (!element.querySelector('.gem-sparkle')) {
            const gem = document.createElement('span');
            gem.className = 'gem-sparkle';
            gem.innerHTML = '💎';
            gem.style.cssText = `
                position: absolute;
                margin-left: 5px;
                animation: gemSparkle 1s ease-in-out;
                pointer-events: none;
            `;
            element.style.position = element.style.position || 'relative';
            element.appendChild(gem);
            
            setTimeout(() => gem.remove(), 1000);
        }
    }

    /**
     * Add sparkle effect to element
     * @param {HTMLElement} element - Target element
     */
    addSparkleEffect(element) {
        element.classList.add('achievement-sparkle');
        setTimeout(() => {
            element.classList.remove('achievement-sparkle');
        }, 3000);
    }

    /**
     * Enhanced button click handler with micro-interactions
     * @param {HTMLElement} button - Button element
     * @param {Function} callback - Click callback
     * @param {string} feedbackType - Haptic feedback type
     */
    enhanceButton(button, callback, feedbackType = 'tap') {
        if (!button) return;

        // Add interactive styling
        button.classList.add('interactive-element');

        // Enhanced click handler
        button.addEventListener('click', (event) => {
            // Trigger haptic feedback
            this.triggerHapticFeedback(feedbackType);
            
            // Add visual feedback
            button.style.animation = 'tapFeedback 0.15s ease-out';
            setTimeout(() => {
                button.style.animation = '';
            }, 150);
            
            // Execute callback
            if (callback) {
                callback(event);
            }
        });

        // Add hover effects
        button.addEventListener('mouseenter', () => {
            if (button.classList.contains('answer-btn')) {
                this.addSwordGleam(button);
            }
        });
    }

    /**
     * Animate score increase with enhanced effects
     * @param {number} newScore - New score value
     * @param {number} points - Points gained
     */
    animateScoreIncrease(newScore, points) {
        const scoreElement = this.elements.currentScore;
        if (!scoreElement) return;

        // Trigger haptic feedback based on points
        if (points >= 100) {
            this.triggerHapticFeedback('achievement');
        } else {
            this.triggerHapticFeedback('success');
        }

        // Add visual effects
        this.addCrownFloat(scoreElement);
        if (points >= 50) {
            this.addGemSparkle(scoreElement);
        }

        // Update score with animation
        if (this.animationManager) {
            this.animationManager.animateScoreIncrease(scoreElement, this.previousScore, newScore);
        } else {
            scoreElement.textContent = newScore;
        }

        this.previousScore = newScore;
    }

    /**
     * Enhanced room transition with micro-interactions
     * @param {Object} roomData - Room data
     */
    enhancedRoomTransition(roomData) {
        const roomInfoElement = this.elements.roomInfo;
        if (roomInfoElement) {
            // Add transition effect
            roomInfoElement.classList.add('room-transition');
            setTimeout(() => {
                roomInfoElement.classList.remove('room-transition');
            }, 800);
        }

        // Trigger haptic feedback
        this.triggerHapticFeedback('roomEnter');

        // Announce to screen readers
        this.announceToScreenReader(`Entered ${roomData.name}`);
    }

    /**
     * Enhanced question presentation with reveal animation
     * @param {Object} questionData - Question data
     */
    enhancedQuestionPresentation(questionData) {
        const questionElement = this.elements.questionText;
        if (questionElement) {
            // Add reveal animation
            questionElement.classList.add('question-reveal');
            setTimeout(() => {
                questionElement.classList.remove('question-reveal');
            }, 1000);
        }

        // Subtle haptic feedback
        this.triggerHapticFeedback('tap');
    }

    /**
     * Add accessibility hooks for integration with AccessibilityManager
     * @param {AccessibilityManager} accessibilityManager - Accessibility manager instance
     */
    addAccessibilityHooks(accessibilityManager) {
        this.accessibilityManager = accessibilityManager;

        // Listen for accessibility map announcements
        document.addEventListener('accessibility-map-announce', (event) => {
            const { message, type } = event.detail;
            
            // Use appropriate priority based on announcement type
            const priority = type === 'blocked' || type === 'no-room' ? 'assertive' : 'polite';
            this.accessibilityManager.announce(message, priority);
        });

        // Enhance answer button accessibility
        this.enhanceAnswerButtonAccessibility();

        // Setup keyboard shortcuts for answer selection
        document.addEventListener('keydown', (event) => {
            if (this.checkQuestionActive() && event.key >= '1' && event.key <= '4') {
                const answerIndex = parseInt(event.key) - 1;
                const buttons = document.querySelectorAll('#answer-buttons button:not([disabled])');
                if (buttons[answerIndex]) {
                    event.preventDefault();
                    buttons[answerIndex].click();
                }
            }
        });

        // Enhance timer accessibility
        this.enhanceTimerAccessibility();

        console.log('♿ UI accessibility hooks added');
    }

    /**
     * Enhance answer button accessibility
     */
    enhanceAnswerButtonAccessibility() {
        const answerContainer = document.getElementById('answer-buttons');
        if (answerContainer) {
            // Improve ARIA attributes
            answerContainer.setAttribute('role', 'radiogroup');
            answerContainer.setAttribute('aria-label', 'Answer options');
            
            // Add keyboard navigation instructions
            answerContainer.setAttribute('aria-describedby', 'answer-instructions');
            
            if (!document.getElementById('answer-instructions')) {
                const instructions = document.createElement('div');
                instructions.id = 'answer-instructions';
                instructions.className = 'sr-only';
                instructions.textContent = 'Use arrow keys to navigate answers, Enter to select, or press number keys 1-4';
                answerContainer.appendChild(instructions);
            }
        }
    }

    /**
     * Enhance timer accessibility
     */
    enhanceTimerAccessibility() {
        const timerElement = document.getElementById('timer-text');
        if (timerElement) {
            // Reduce timer announcements to avoid overwhelming screen readers
            timerElement.setAttribute('aria-live', 'off');
            
            // Only announce timer at critical moments
            this.quizEngine.on('timerUpdate', (data) => {
                const timeRemaining = data.timeRemaining;
                
                // Announce only at 10 seconds and 5 seconds remaining
                if (timeRemaining === 10000 && this.accessibilityManager) {
                    this.accessibilityManager.announce('10 seconds remaining', 'polite');
                } else if (timeRemaining === 5000 && this.accessibilityManager) {
                    this.accessibilityManager.announce('5 seconds remaining', 'assertive');
                }
            });
        }
    }

    /**
     * Enhanced answer selection with accessibility announcements
     * @param {number} answerIndex - Selected answer index
     */
    selectAnswerWithAccessibility(answerIndex) {
        const buttons = document.querySelectorAll('#answer-buttons button');
        if (buttons[answerIndex] && this.accessibilityManager) {
            const answerText = buttons[answerIndex].textContent;
            this.accessibilityManager.announce(`Selected: ${answerText}`, 'polite');
        }
    }

    /**
     * Enhanced game state announcements
     * @param {string} message - Message to announce
     * @param {string} priority - Announcement priority
     */
    announceGameStateChange(message, priority = 'polite') {
        if (this.accessibilityManager) {
            this.accessibilityManager.announce(message, priority);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}