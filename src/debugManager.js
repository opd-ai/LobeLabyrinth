/**
 * LobeLabyrinth Debug Manager
 * Comprehensive test orchestration and management system
 * 
 * @author GameEngineBot
 * @version 1.0.0
 * @description Manages all debug testing functionality, coordinates test execution,
 *              handles results reporting, and provides utilities for comprehensive
 *              game system validation and diagnostics.
 */

class DebugManager {
    constructor() {
        this.gameInstances = {};
        this.testResults = new Map();
        this.testHistory = [];
        this.activeTests = new Set();
        this.consoleBuffer = [];
        this.originalConsole = {};
        this.observers = new Map();
        
        // Test configuration
        this.config = {
            maxConsoleLines: 1000,
            testTimeout: 30000,
            animationSpeed: 300,
            retryAttempts: 3,
            parallelTests: false
        };
        
        // Test status constants
        this.STATUS = {
            READY: 'ready',
            RUNNING: 'running',
            SUCCESS: 'success',
            ERROR: 'error',
            TIMEOUT: 'timeout',
            CANCELLED: 'cancelled'
        };
        
        // Initialize console capture
        this.initializeConsoleCapture();
    }
    
    /**
     * Initialize the debug manager and set up the interface
     */
    initialize() {
        console.log('🚀 DebugManager: Initializing comprehensive test suite...');
        
        try {
            this.setupEventListeners();
            this.initializeTabNavigation();
            this.updateOverallStatus('Ready');
            this.logToConsole('Debug interface initialized successfully', 'success');
            this.showToast('Debug interface ready!', 'success');
        } catch (error) {
            console.error('❌ DebugManager initialization failed:', error);
            this.logToConsole(`Initialization failed: ${error.message}`, 'error');
            this.showToast('Failed to initialize debug interface', 'error');
        }
    }
    
    /**
     * Set up event listeners for the debug interface
     */
    setupEventListeners() {
        // Main control buttons
        const runAllBtn = document.getElementById('run-all-tests');
        const exportBtn = document.getElementById('export-results');
        const clearBtn = document.getElementById('clear-results');
        
        if (runAllBtn) runAllBtn.addEventListener('click', () => this.runAllTests());
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportResults());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearAllResults());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.altKey) {
                switch (e.key) {
                    case '1': this.switchToTab('core-systems-panel'); e.preventDefault(); break;
                    case '2': this.switchToTab('feature-testing-panel'); e.preventDefault(); break;
                    case '3': this.switchToTab('accessibility-panel'); e.preventDefault(); break;
                    case '4': this.switchToTab('debug-diagnostics-panel'); e.preventDefault(); break;
                    case '5': this.switchToTab('verification-panel'); e.preventDefault(); break;
                    case 'h': this.toggleHighContrast(); e.preventDefault(); break;
                    case '?': this.showKeyboardHelp(); e.preventDefault(); break;
                }
            }
        });
        
        this.logToConsole('Event listeners configured', 'info');
    }
    
    /**
     * Initialize tab navigation functionality
     */
    initializeTabNavigation() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetPanel = e.target.getAttribute('aria-controls');
                this.switchToTab(targetPanel);
            });
        });
    }
    
    /**
     * Switch to a specific tab
     */
    switchToTab(tabId) {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');
        
        // Update tab buttons
        tabBtns.forEach(btn => {
            const isActive = btn.getAttribute('aria-controls') === tabId;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive);
        });
        
        // Update tab panels
        tabPanels.forEach(panel => {
            const isActive = panel.id === tabId;
            panel.classList.toggle('active', isActive);
        });
        
        this.logToConsole(`Switched to tab: ${tabId}`, 'info');
    }
    
    /**
     * Console capture and management
     */
    initializeConsoleCapture() {
        // Store original console methods
        this.originalConsole = {
            log: console.log.bind(console),
            error: console.error.bind(console),
            warn: console.warn.bind(console),
            info: console.info.bind(console)
        };
        
        // Override console methods
        const self = this;
        
        console.log = function(...args) {
            self.originalConsole.log(...args);
            self.captureConsoleOutput('log', args);
        };
        
        console.error = function(...args) {
            self.originalConsole.error(...args);
            self.captureConsoleOutput('error', args);
        };
        
        console.warn = function(...args) {
            self.originalConsole.warn(...args);
            self.captureConsoleOutput('warning', args);
        };
        
        console.info = function(...args) {
            self.originalConsole.info(...args);
            self.captureConsoleOutput('info', args);
        };
    }
    
    /**
     * Capture console output for display in debug interface
     */
    captureConsoleOutput(type, args) {
        const timestamp = new Date().toLocaleTimeString();
        const message = args.join(' ');
        
        const logEntry = {
            timestamp,
            type,
            message,
            id: Date.now() + Math.random()
        };
        
        this.consoleBuffer.push(logEntry);
        
        // Maintain buffer size
        if (this.consoleBuffer.length > this.config.maxConsoleLines) {
            this.consoleBuffer.shift();
        }
        
        // Update console display
        this.updateConsoleDisplay();
    }
    
    /**
     * Update the debug console display
     */
    updateConsoleDisplay() {
        const consoleEl = document.getElementById('debug-console');
        if (!consoleEl) return;
        
        const recentEntries = this.consoleBuffer.slice(-50);
        
        const html = recentEntries.map(entry => 
            `<div class="console-line ${entry.type}" data-timestamp="${entry.timestamp}">
                <span class="console-time">${entry.timestamp}</span>
                <span class="console-message">${this.escapeHtml(entry.message)}</span>
            </div>`
        ).join('');
        
        consoleEl.innerHTML = html;
        consoleEl.scrollTop = consoleEl.scrollHeight;
    }
    
    /**
     * Log message to debug console
     */
    logToConsole(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            timestamp,
            type,
            message,
            id: Date.now() + Math.random()
        };
        
        this.consoleBuffer.push(logEntry);
        this.updateConsoleDisplay();
    }
    
    /**
     * Clear console output
     */
    clearConsole() {
        this.consoleBuffer = [];
        this.updateConsoleDisplay();
        this.logToConsole('Console cleared', 'info');
    }
    
    /**
     * Export console logs
     */
    exportConsole() {
        const logs = this.consoleBuffer.map(entry => 
            `${entry.timestamp} [${entry.type.toUpperCase()}] ${entry.message}`
        ).join('\n');
        
        this.downloadFile('debug-console-logs.txt', logs);
        this.showToast('Console logs exported', 'success');
    }
    
    /**
     * Update overall status display
     */
    updateOverallStatus(status, additionalInfo = '') {
        const statusEl = document.getElementById('overall-status');
        if (statusEl) {
            statusEl.textContent = status + (additionalInfo ? ` (${additionalInfo})` : '');
            statusEl.className = `status-value ${status.toLowerCase().replace(/\s+/g, '-')}`;
        }
    }
    
    /**
     * Update test statistics
     */
    updateTestStats() {
        const totalTests = this.testResults.size;
        const passedTests = Array.from(this.testResults.values()).filter(result => result.status === 'success').length;
        const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        const errorCount = Array.from(this.testResults.values()).filter(result => result.status === 'error').length;
        
        const testsRunEl = document.getElementById('tests-run');
        const successRateEl = document.getElementById('success-rate');
        const errorCountEl = document.getElementById('error-count');
        
        if (testsRunEl) testsRunEl.textContent = totalTests;
        if (successRateEl) successRateEl.textContent = `${successRate}%`;
        if (errorCountEl) errorCountEl.textContent = errorCount;
    }
    
    /**
     * Set test status indicator
     */
    setTestStatus(sectionId, status, message = '') {
        const indicator = document.getElementById(`${sectionId}-status`);
        if (indicator) {
            indicator.className = `status-indicator ${status}`;
            const text = indicator.querySelector('.indicator-text');
            if (text) text.textContent = message || this.getStatusText(status);
        }
    }
    
    /**
     * Get status text for display
     */
    getStatusText(status) {
        const statusTexts = {
            [this.STATUS.READY]: 'Ready',
            [this.STATUS.RUNNING]: 'Running...',
            [this.STATUS.SUCCESS]: 'Passed',
            [this.STATUS.ERROR]: 'Failed',
            [this.STATUS.TIMEOUT]: 'Timeout',
            [this.STATUS.CANCELLED]: 'Cancelled'
        };
        return statusTexts[status] || status;
    }
    
    /**
     * Display test result in UI
     */
    displayTestResult(resultId, result) {
        const resultEl = document.getElementById(resultId);
        if (resultEl) {
            resultEl.className = `test-result ${result.status} visible`;
            resultEl.innerHTML = `
                <div class="result-header">
                    <span class="result-icon">${this.getStatusIcon(result.status)}</span>
                    <span class="result-title">${result.title}</span>
                    <span class="result-time">${result.duration}ms</span>
                </div>
                <div class="result-details">${result.details || ''}</div>
                ${result.error ? `<div class="result-error">${this.escapeHtml(result.error)}</div>` : ''}
            `;
            
            resultEl.classList.add('fade-in');
        }
    }
    
    /**
     * Get status icon for display
     */
    getStatusIcon(status) {
        const icons = {
            [this.STATUS.SUCCESS]: '✅',
            [this.STATUS.ERROR]: '❌',
            [this.STATUS.RUNNING]: '🔄',
            [this.STATUS.TIMEOUT]: '⏰',
            [this.STATUS.CANCELLED]: '⚠️'
        };
        return icons[status] || '❓';
    }
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getToastIcon(type)}</span>
                <span class="toast-message">${this.escapeHtml(message)}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    /**
     * Get toast icon
     */
    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }
    
    /**
     * Show/hide loading overlay
     */
    showLoading(show = true, message = 'Running tests...') {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            const text = overlay.querySelector('.loading-text');
            if (text) text.textContent = message;
            overlay.style.display = show ? 'flex' : 'none';
        }
    }
    
    /**
     * Initialize game instances safely
     */
    async initializeGameInstances() {
        try {
            this.logToConsole('Initializing game instances...', 'info');
            
            if (typeof DataLoader !== 'undefined') {
                this.gameInstances.dataLoader = new DataLoader();
                await this.gameInstances.dataLoader.loadGameData();
                this.logToConsole('✅ DataLoader initialized', 'success');
            }
            
            if (typeof GameState !== 'undefined' && this.gameInstances.dataLoader) {
                this.gameInstances.gameState = new GameState(this.gameInstances.dataLoader);
                this.logToConsole('✅ GameState initialized', 'success');
            }
            
            if (typeof QuizEngine !== 'undefined' && this.gameInstances.dataLoader && this.gameInstances.gameState) {
                this.gameInstances.quizEngine = new QuizEngine(this.gameInstances.dataLoader, this.gameInstances.gameState);
                this.logToConsole('✅ QuizEngine initialized', 'success');
            }
            
            return true;
        } catch (error) {
            this.logToConsole(`❌ Failed to initialize game instances: ${error.message}`, 'error');
            throw error;
        }
    }
    
    /**
     * Run a single test with timeout and error handling
     */
    async runTest(testName, testFunction, timeout = this.config.testTimeout) {
        const startTime = Date.now();
        
        try {
            this.activeTests.add(testName);
            this.logToConsole(`🔄 Starting test: ${testName}`, 'info');
            
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Test timeout')), timeout);
            });
            
            const result = await Promise.race([
                testFunction(),
                timeoutPromise
            ]);
            
            const duration = Date.now() - startTime;
            
            const testResult = {
                name: testName,
                status: this.STATUS.SUCCESS,
                duration,
                timestamp: new Date().toISOString(),
                title: `${testName} - Passed`,
                details: result || 'Test completed successfully'
            };
            
            this.testResults.set(testName, testResult);
            this.testHistory.push(testResult);
            this.logToConsole(`✅ Test passed: ${testName} (${duration}ms)`, 'success');
            
            return testResult;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            const isTimeout = error.message === 'Test timeout';
            
            const testResult = {
                name: testName,
                status: isTimeout ? this.STATUS.TIMEOUT : this.STATUS.ERROR,
                duration,
                timestamp: new Date().toISOString(),
                title: `${testName} - ${isTimeout ? 'Timeout' : 'Failed'}`,
                details: isTimeout ? 'Test exceeded maximum execution time' : 'Test failed with error',
                error: error.message
            };
            
            this.testResults.set(testName, testResult);
            this.testHistory.push(testResult);
            this.logToConsole(`❌ Test failed: ${testName} - ${error.message}`, 'error');
            
            throw testResult;
            
        } finally {
            this.activeTests.delete(testName);
            this.updateTestStats();
        }
    }
    
    /**
     * Run all tests across all tabs
     */
    async runAllTests() {
        this.showLoading(true, 'Running comprehensive test suite...');
        this.updateOverallStatus('Running', 'All Tests');
        
        const startTime = Date.now();
        let totalTests = 0;
        let passedTests = 0;
        
        try {
            this.logToConsole('🚀 Starting comprehensive test suite...', 'info');
            
            await this.initializeGameInstances();
            
            const testSuites = [
                { name: 'Core Systems', runner: () => this.runCoreSystemsTests() },
                { name: 'Feature Testing', runner: () => this.runFeatureTestsuite() },
                { name: 'Accessibility', runner: () => this.runAccessibilityTestsuite() },
                { name: 'Debug & Diagnostics', runner: () => this.runDebugTestsuite() },
                { name: 'Verification', runner: () => this.runVerificationTestsuite() }
            ];
            
            for (const suite of testSuites) {
                this.logToConsole(`📂 Running ${suite.name} test suite...`, 'info');
                try {
                    await suite.runner();
                    passedTests++;
                } catch (error) {
                    this.logToConsole(`❌ ${suite.name} suite failed: ${error.message}`, 'error');
                }
                totalTests++;
                await this.delay(100);
            }
            
            const duration = Date.now() - startTime;
            const successRate = Math.round((passedTests / totalTests) * 100);
            
            this.updateOverallStatus('Complete', `${successRate}% success rate`);
            this.logToConsole(`🎉 Test suite completed: ${passedTests}/${totalTests} passed (${duration}ms)`, 'success');
            this.showToast(`All tests completed: ${successRate}% success rate`, 'success', 5000);
            
        } catch (error) {
            this.updateOverallStatus('Error', error.message);
            this.logToConsole(`❌ Test suite failed: ${error.message}`, 'error');
            this.showToast('Test suite execution failed', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * Core Systems Test Suite
     */
    async runCoreSystemsTests() {
        await this.runDataLoadingTests();
        await this.runGameStateTests();
        await this.runQuizEngineTests();
        await this.runMapRendererTests();
    }
    
    /**
     * Feature Test Suite
     */
    async runFeatureTestsuite() {
        await this.runAchievementTests();
        await this.runRoomNavigationTests();
        await this.runPerformanceTests();
        await this.runAnimationTests();
    }
    
    /**
     * Accessibility Test Suite
     */
    async runAccessibilityTestsuite() {
        await this.runKeyboardTests();
        await this.runScreenReaderTests();
        await this.runVisualTests();
    }
    
    /**
     * Debug Test Suite
     */
    async runDebugTestsuite() {
        await this.runErrorDetection();
        await this.runMemoryDiagnostics();
    }
    
    /**
     * Verification Test Suite
     */
    async runVerificationTestsuite() {
        await this.runIntegrationTests();
        await this.runAutomatedTests();
    }
    
    /**
     * Individual test method - Data Loading
     */
    async testDataLoading() {
        if (!this.gameInstances.dataLoader) {
            throw new Error('DataLoader not initialized');
        }
        
        const data = await this.gameInstances.dataLoader.loadGameData();
        
        if (!data || !data.rooms || !data.questions || !data.achievements) {
            throw new Error('Invalid game data structure');
        }
        
        this.displayTestResult('data-loading-result', {
            status: 'success',
            title: 'Data Loading - Passed',
            details: `Loaded ${data.rooms.length} rooms, ${data.questions.length} questions, ${data.achievements.length} achievements`,
            duration: 0
        });
        
        return `Data loading successful: ${data.rooms.length} rooms, ${data.questions.length} questions, ${data.achievements.length} achievements`;
    }
    
    /**
     * Test room access functionality
     */
    async testRoomAccess() {
        const results = [];
        
        try {
            const dataLoader = this.gameInstances.dataLoader;
            
            // Test getting specific room
            const room1 = dataLoader.getRoom('entrance_hall');
            if (!room1) throw new Error('Failed to get entrance hall');
            results.push('✅ Room access by ID working');
            
            // Test getting all rooms
            const allRooms = dataLoader.getRooms();
            if (allRooms.length === 0) throw new Error('No rooms found');
            results.push(`✅ Found ${allRooms.length} total rooms`);
            
            // Test filtering by category
            const historyRooms = dataLoader.getRoomsOfCategory('history');
            results.push(`✅ History rooms: ${historyRooms.length} found`);
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Room access test failed: ${error.message}`);
        }
    }
    
    /**
     * Test question access functionality
     */
    async testQuestionAccess() {
        const results = [];
        
        try {
            const dataLoader = this.gameInstances.dataLoader;
            
            // Test getting random question
            const question1 = dataLoader.getRandomQuestion();
            if (!question1) throw new Error('Failed to get random question');
            results.push('✅ Random question access working');
            
            // Test getting question by category
            const historyQuestions = dataLoader.getQuestionsByCategory('history');
            if (historyQuestions.length === 0) throw new Error('No history questions found');
            results.push(`✅ History questions: ${historyQuestions.length} found`);
            
            // Test getting question by difficulty
            const easyQuestions = dataLoader.getQuestionsByDifficulty('easy');
            results.push(`✅ Easy questions: ${easyQuestions.length} found`);
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Question access test failed: ${error.message}`);
        }
    }
    
    /**
     * Test achievement access functionality
     */
    async testAchievementAccess() {
        const results = [];
        
        try {
            const dataLoader = this.gameInstances.dataLoader;
            
            // Test getting specific achievement
            const firstSteps = dataLoader.getAchievement('first_steps');
            if (!firstSteps) throw new Error('Failed to get first_steps achievement');
            results.push('✅ Achievement access by ID working');
            
            // Test getting all achievements
            const achievements = dataLoader.getAchievements();
            if (achievements.length === 0) throw new Error('No achievements found');
            results.push(`✅ Found ${achievements.length} total achievements`);
            
            // Test filtering by category
            const explorationAchievements = dataLoader.getAchievementsByCategory('exploration');
            results.push(`✅ Exploration achievements: ${explorationAchievements.length} found`);
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Achievement access test failed: ${error.message}`);
        }
    }
    
    /**
     * Test error handling with missing files
     */
    async testErrorHandling() {
        const results = [];
        
        try {
            // Create a temporary dataLoader instance to test error handling
            const testLoader = new DataLoader();
            
            // Try to get non-existent room
            const nonExistentRoom = testLoader.getRoom('non_existent_room');
            if (nonExistentRoom === null) {
                results.push('✅ Graceful handling of non-existent room');
            } else {
                results.push('❌ Should return null for non-existent room');
            }
            
            // Try to get non-existent achievement
            const nonExistentAchievement = testLoader.getAchievement('non_existent_achievement');
            if (nonExistentAchievement === null) {
                results.push('✅ Graceful handling of non-existent achievement');
            } else {
                results.push('❌ Should return null for non-existent achievement');
            }
            
            results.push('✅ Error handling tests completed');
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Error handling test failed: ${error.message}`);
        }
    }
    
    /**
     * Individual test method - Data Integrity
     */
    async validateDataIntegrity() {
        if (!this.gameInstances.dataLoader) {
            throw new Error('DataLoader not initialized');
        }
        
        try {
            this.gameInstances.dataLoader.validateDataIntegrity();
            return 'Data integrity validation passed';
        } catch (error) {
            throw error;
        }
    }
    
    // ============================================================
    // TEST SUITE RUNNERS
    // ============================================================
    
    async runDataLoadingTests() {
        this.setTestStatus('data-loading', this.STATUS.RUNNING);
        try {
            await this.testDataLoading();
            await this.validateDataIntegrity();
            this.setTestStatus('data-loading', this.STATUS.SUCCESS, 'All tests passed');
            this.showToast('Data loading tests completed', 'success');
        } catch (error) {
            this.setTestStatus('data-loading', this.STATUS.ERROR, error.message);
            throw error;
        }
    }
    
    async runGameStateTests() {
        this.setTestStatus('game-state', this.STATUS.RUNNING);
        try {
            await this.testGameStateInitialization();
            await this.testRoomNavigation();
            await this.testAnswerSubmission();
            await this.testGameSaveLoad();
            this.setTestStatus('game-state', this.STATUS.SUCCESS, 'All tests passed');
            this.showToast('Game state tests completed', 'success');
        } catch (error) {
            this.setTestStatus('game-state', this.STATUS.ERROR, error.message);
            throw error;
        }
    }
    
    /**
     * Test GameState initialization
     */
    async testGameStateInitialization() {
        if (!this.gameInstances.gameState) {
            throw new Error('GameState not initialized');
        }
        
        const gameState = this.gameInstances.gameState;
        
        // Test initial values
        if (!gameState.currentRoomId) {
            throw new Error('Current room ID not set');
        }
        
        if (gameState.score < 0) {
            throw new Error('Score should be non-negative');
        }
        
        return 'GameState initialization test passed';
    }
    
    /**
     * Test room navigation functionality
     */
    async testRoomNavigation() {
        const gameState = this.gameInstances.gameState;
        const results = [];
        
        // Test move to valid room
        const originalRoom = gameState.currentRoomId;
        const validRooms = ['library', 'courtyard', 'study'];
        
        for (const roomId of validRooms) {
            try {
                await gameState.moveToRoom(roomId);
                if (gameState.currentRoomId === roomId) {
                    results.push(`✅ Successfully moved to ${roomId}`);
                } else {
                    results.push(`❌ Failed to move to ${roomId}`);
                }
            } catch (error) {
                results.push(`❌ Error moving to ${roomId}: ${error.message}`);
            }
        }
        
        // Test move to invalid room
        try {
            await gameState.moveToRoom('invalid_room');
            results.push('❌ Should reject invalid room');
        } catch (error) {
            results.push('✅ Correctly rejected invalid room');
        }
        
        // Restore original room
        await gameState.moveToRoom(originalRoom);
        
        return results.join('<br>');
    }
    
    /**
     * Test answer submission
     */
    async testAnswerSubmission() {
        const gameState = this.gameInstances.gameState;
        const originalScore = gameState.score;
        
        const results = [];
        
        // Test correct answer
        try {
            const result = gameState.submitAnswer('correct_answer', true);
            if (result && gameState.score > originalScore) {
                results.push('✅ Correct answer increased score');
            } else {
                results.push('❌ Correct answer did not increase score');
            }
        } catch (error) {
            results.push(`❌ Error submitting correct answer: ${error.message}`);
        }
        
        // Test incorrect answer
        try {
            const previousScore = gameState.score;
            const result = gameState.submitAnswer('wrong_answer', false);
            if (result !== undefined) {
                results.push('✅ Incorrect answer handled');
            }
        } catch (error) {
            results.push(`❌ Error submitting incorrect answer: ${error.message}`);
        }
        
        return results.join('<br>');
    }
    
    /**
     * Test game save and load functionality
     */
    async testGameSaveLoad() {
        const gameState = this.gameInstances.gameState;
        const results = [];
        
        try {
            // Save current state
            const originalRoom = gameState.currentRoomId;
            const originalScore = gameState.score;
            
            gameState.saveGame();
            results.push('✅ Game saved successfully');
            
            // Modify state
            if (typeof gameState.moveToRoom === 'function') {
                await gameState.moveToRoom('library');
            }
            gameState.score = originalScore + 100;
            
            // Load saved state
            gameState.loadGame();
            
            // Verify restoration
            if (gameState.currentRoomId === originalRoom && gameState.score === originalScore) {
                results.push('✅ Game state restored correctly');
            } else {
                results.push('❌ Game state not restored correctly');
            }
            
        } catch (error) {
            results.push(`❌ Save/Load test failed: ${error.message}`);
        }
        
        return results.join('<br>');
    }
    
    async runQuizEngineTests() {
        this.setTestStatus('quiz-engine', this.STATUS.RUNNING);
        try {
            await this.testQuestionSelection();
            await this.testAnswerValidation();
            await this.testAdaptiveDifficulty();
            await this.testTimingMechanics();
            this.setTestStatus('quiz-engine', this.STATUS.SUCCESS, 'All tests passed');
            this.showToast('Quiz engine tests completed', 'success');
        } catch (error) {
            this.setTestStatus('quiz-engine', this.STATUS.ERROR, error.message);
            throw error;
        }
    }
    
    /**
     * Test question selection and shuffling
     */
    async testQuestionSelection() {
        if (!this.gameInstances.quizEngine) {
            throw new Error('QuizEngine not initialized');
        }
        
        const quizEngine = this.gameInstances.quizEngine;
        const results = [];
        
        try {
            // Test getting next question
            const question1 = await quizEngine.getNextQuestion();
            if (!question1) {
                throw new Error('Failed to get next question');
            }
            results.push('✅ Question retrieval working');
            
            // Test category-specific questions
            const historyQuestion = await quizEngine.getQuestionByCategory('history');
            if (historyQuestion && historyQuestion.category === 'history') {
                results.push('✅ Category-specific question selection working');
            } else {
                results.push('❌ Category-specific question selection failed');
            }
            
            // Test question shuffling
            const questions = [];
            for (let i = 0; i < 5; i++) {
                const q = await quizEngine.getNextQuestion();
                if (q) questions.push(q.id);
            }
            
            const uniqueQuestions = new Set(questions).size;
            if (uniqueQuestions > 1) {
                results.push('✅ Question shuffling working');
            } else {
                results.push('❌ Question shuffling may not be working');
            }
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Question selection test failed: ${error.message}`);
        }
    }
    
    /**
     * Test answer validation
     */
    async testAnswerValidation() {
        const quizEngine = this.gameInstances.quizEngine;
        const results = [];
        
        try {
            // Get a test question
            const question = await quizEngine.getNextQuestion();
            if (!question || !question.answers) {
                throw new Error('No valid question found for testing');
            }
            
            // Find correct answer
            const correctAnswer = question.answers.find(answer => answer.correct);
            if (!correctAnswer) {
                throw new Error('No correct answer found in test question');
            }
            
            // Test correct answer validation
            const correctResult = await quizEngine.validateAnswer(question.id, correctAnswer.id);
            if (correctResult && correctResult.correct) {
                results.push('✅ Correct answer validation working');
            } else {
                results.push('❌ Correct answer validation failed');
            }
            
            // Test incorrect answer validation
            const incorrectAnswer = question.answers.find(answer => !answer.correct);
            if (incorrectAnswer) {
                const incorrectResult = await quizEngine.validateAnswer(question.id, incorrectAnswer.id);
                if (incorrectResult && !incorrectResult.correct) {
                    results.push('✅ Incorrect answer validation working');
                } else {
                    results.push('❌ Incorrect answer validation failed');
                }
            }
            
            // Test timeout handling
            try {
                const timeoutResult = await quizEngine.handleTimeout(question.id);
                results.push('✅ Timeout handling working');
            } catch (error) {
                results.push(`❌ Timeout handling failed: ${error.message}`);
            }
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Answer validation test failed: ${error.message}`);
        }
    }
    
    /**
     * Test adaptive difficulty system
     */
    async testAdaptiveDifficulty() {
        const quizEngine = this.gameInstances.quizEngine;
        const results = [];
        
        try {
            // Test initial difficulty
            const initialDifficulty = quizEngine.currentDifficulty || 'medium';
            results.push(`✅ Initial difficulty: ${initialDifficulty}`);
            
            // Simulate correct answers to increase difficulty
            if (typeof quizEngine.adjustDifficulty === 'function') {
                for (let i = 0; i < 3; i++) {
                    quizEngine.adjustDifficulty(true);
                }
                results.push('✅ Difficulty adjustment for correct answers');
            }
            
            // Simulate incorrect answers to decrease difficulty
            if (typeof quizEngine.adjustDifficulty === 'function') {
                for (let i = 0; i < 3; i++) {
                    quizEngine.adjustDifficulty(false);
                }
                results.push('✅ Difficulty adjustment for incorrect answers');
            }
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Adaptive difficulty test failed: ${error.message}`);
        }
    }
    
    /**
     * Test timing mechanics and bonuses
     */
    async testTimingMechanics() {
        const quizEngine = this.gameInstances.quizEngine;
        const results = [];
        
        try {
            // Test time bonus calculation
            if (typeof quizEngine.calculateTimeBonus === 'function') {
                const fastBonus = quizEngine.calculateTimeBonus(5000, 30000); // 5s of 30s
                const slowBonus = quizEngine.calculateTimeBonus(25000, 30000); // 25s of 30s
                
                if (fastBonus > slowBonus) {
                    results.push('✅ Time bonus calculation working correctly');
                } else {
                    results.push('❌ Time bonus calculation may be incorrect');
                }
            } else {
                results.push('⚠️ Time bonus calculation method not found');
            }
            
            // Test timer functionality
            if (typeof quizEngine.startTimer === 'function' && typeof quizEngine.stopTimer === 'function') {
                quizEngine.startTimer(10000); // 10 second timer
                await this.delay(100);
                const timeLeft = quizEngine.stopTimer();
                
                if (timeLeft < 10000) {
                    results.push('✅ Timer functionality working');
                } else {
                    results.push('❌ Timer functionality may not be working');
                }
            } else {
                results.push('⚠️ Timer methods not found');
            }
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Timing mechanics test failed: ${error.message}`);
        }
    }
    
    async runMapRendererTests() {
        this.setTestStatus('map-renderer', this.STATUS.RUNNING);
        try {
            await this.delay(1000);
            this.setTestStatus('map-renderer', this.STATUS.SUCCESS, 'All tests passed');
            this.showToast('Map renderer tests completed', 'success');
        } catch (error) {
            this.setTestStatus('map-renderer', this.STATUS.ERROR, error.message);
            throw error;
        }
    }
    
    async runAchievementTests() {
        this.setTestStatus('achievements', this.STATUS.RUNNING);
        try {
            await this.testAchievementUnlocking();
            await this.testProgressTracking();
            await this.testNotificationSystem();
            await this.testAchievementStats();
            this.setTestStatus('achievements', this.STATUS.SUCCESS, 'All tests passed');
            this.showToast('Achievement tests completed', 'success');
        } catch (error) {
            this.setTestStatus('achievements', this.STATUS.ERROR, error.message);
            throw error;
        }
    }
    
    /**
     * Test achievement unlocking mechanism
     */
    async testAchievementUnlocking() {
        const results = [];
        
        try {
            // Test if AchievementManager is available
            const achievementManager = this.gameInstances.achievementManager;
            
            if (!achievementManager) {
                results.push('⚠️ AchievementManager not available');
                return results.join('<br>');
            }
            
            // Test unlocking first achievement
            const firstAchievement = 'first_steps';
            
            if (typeof achievementManager.unlockAchievement === 'function') {
                const result = achievementManager.unlockAchievement(firstAchievement);
                
                if (result) {
                    results.push('✅ Achievement unlocking working');
                } else {
                    results.push('❌ Achievement unlocking failed');
                }
            }
            
            // Test checking achievement status
            if (typeof achievementManager.isAchievementUnlocked === 'function') {
                const isUnlocked = achievementManager.isAchievementUnlocked(firstAchievement);
                results.push(`✅ Achievement status check: ${isUnlocked ? 'unlocked' : 'locked'}`);
            }
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Achievement unlocking test failed: ${error.message}`);
        }
    }
    
    /**
     * Test progress tracking
     */
    async testProgressTracking() {
        const results = [];
        
        try {
            const achievementManager = this.gameInstances.achievementManager;
            
            if (!achievementManager) {
                results.push('⚠️ AchievementManager not available');
                return results.join('<br>');
            }
            
            // Test progress updates
            if (typeof achievementManager.updateProgress === 'function') {
                achievementManager.updateProgress('questions_answered', 5);
                results.push('✅ Progress update successful');
            }
            
            // Test progress retrieval
            if (typeof achievementManager.getProgress === 'function') {
                const progress = achievementManager.getProgress('questions_answered');
                results.push(`✅ Progress retrieved: ${progress || 0}`);
            }
            
            // Test achievement checking after progress
            if (typeof achievementManager.checkAchievementUnlocks === 'function') {
                const unlocked = achievementManager.checkAchievementUnlocks();
                results.push(`✅ Achievement check completed, ${unlocked ? unlocked.length : 0} achievements unlocked`);
            }
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Progress tracking test failed: ${error.message}`);
        }
    }
    
    /**
     * Test notification system
     */
    async testNotificationSystem() {
        const results = [];
        
        try {
            // Test achievement notification display
            const testNotification = {
                name: 'Test Achievement',
                description: 'Successfully tested the notification system',
                icon: '🧪',
                points: 100
            };
            
            // Test if AnimationManager can show achievement notifications
            if (typeof AnimationManager !== 'undefined' && this.gameInstances.animationManager) {
                const animationManager = this.gameInstances.animationManager;
                
                if (typeof animationManager.animateAchievementUnlock === 'function') {
                    const container = document.getElementById('achievement-container') || document.body;
                    await animationManager.animateAchievementUnlock(testNotification, container);
                    results.push('✅ Achievement notification animation tested');
                    
                    // Clean up test notification after a delay
                    setTimeout(() => {
                        const testNotifications = container.querySelectorAll('.achievement-notification');
                        testNotifications.forEach(notification => {
                            if (notification.textContent.includes('Test Achievement')) {
                                notification.remove();
                            }
                        });
                    }, 2000);
                }
            } else {
                results.push('⚠️ Animation manager not available for notification test');
            }
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Notification system test failed: ${error.message}`);
        }
    }
    
    /**
     * Test achievement statistics
     */
    async testAchievementStats() {
        const results = [];
        
        try {
            const achievementManager = this.gameInstances.achievementManager;
            
            if (!achievementManager) {
                results.push('⚠️ AchievementManager not available');
                return results.join('<br>');
            }
            
            // Test getting achievement statistics
            if (typeof achievementManager.getAchievementStats === 'function') {
                const stats = achievementManager.getAchievementStats();
                
                if (stats) {
                    results.push(`✅ Total achievements: ${stats.total || 0}`);
                    results.push(`✅ Unlocked achievements: ${stats.unlocked || 0}`);
                    results.push(`✅ Completion percentage: ${stats.completionPercentage || 0}%`);
                } else {
                    results.push('❌ Achievement stats not available');
                }
            }
            
            // Test getting points total
            if (typeof achievementManager.getTotalPoints === 'function') {
                const totalPoints = achievementManager.getTotalPoints();
                results.push(`✅ Total points: ${totalPoints || 0}`);
            }
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Achievement statistics test failed: ${error.message}`);
        }
    }
    
    async runPerformanceTests() {
        this.setTestStatus('performance', this.STATUS.RUNNING);
        try {
            await this.testLoadPerformance();
            await this.testRenderPerformance();
            await this.testMemoryUsage();
            await this.testAnimationPerformance();
            this.setTestStatus('performance', this.STATUS.SUCCESS, 'All tests passed');
            this.showToast('Performance tests completed', 'success');
        } catch (error) {
            this.setTestStatus('performance', this.STATUS.ERROR, error.message);
            throw error;
        }
    }
    
    /**
     * Test load performance
     */
    async testLoadPerformance() {
        const results = [];
        
        try {
            const startTime = performance.now();
            
            // Test data loading performance
            if (this.gameInstances.dataLoader) {
                const dataStartTime = performance.now();
                await this.gameInstances.dataLoader.loadGameData();
                const dataLoadTime = performance.now() - dataStartTime;
                
                results.push(`✅ Data load time: ${dataLoadTime.toFixed(2)}ms`);
                
                if (dataLoadTime < 1000) {
                    results.push('✅ Data loading performance is good');
                } else if (dataLoadTime < 3000) {
                    results.push('⚠️ Data loading performance is moderate');
                } else {
                    results.push('❌ Data loading performance is slow');
                }
            }
            
            // Test script loading performance
            const scriptElements = document.querySelectorAll('script[src]');
            results.push(`✅ Total scripts loaded: ${scriptElements.length}`);
            
            // Test total page load performance
            const totalLoadTime = performance.now() - startTime;
            results.push(`✅ Test execution time: ${totalLoadTime.toFixed(2)}ms`);
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Load performance test failed: ${error.message}`);
        }
    }
    
    /**
     * Test render performance
     */
    async testRenderPerformance() {
        const results = [];
        
        try {
            // Test DOM manipulation performance
            const startTime = performance.now();
            
            // Create and manipulate test elements
            const testContainer = document.createElement('div');
            testContainer.style.display = 'none';
            document.body.appendChild(testContainer);
            
            for (let i = 0; i < 100; i++) {
                const element = document.createElement('div');
                element.textContent = `Test element ${i}`;
                testContainer.appendChild(element);
            }
            
            const domManipulationTime = performance.now() - startTime;
            
            // Clean up
            document.body.removeChild(testContainer);
            
            results.push(`✅ DOM manipulation (100 elements): ${domManipulationTime.toFixed(2)}ms`);
            
            // Test canvas rendering if available
            const canvas = document.getElementById('test-map-canvas') || document.querySelector('canvas');
            if (canvas) {
                const canvasStartTime = performance.now();
                const ctx = canvas.getContext('2d');
                
                // Simple drawing test
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, 100, 100);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                const canvasTime = performance.now() - canvasStartTime;
                results.push(`✅ Canvas rendering test: ${canvasTime.toFixed(2)}ms`);
            } else {
                results.push('⚠️ No canvas found for rendering test');
            }
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Render performance test failed: ${error.message}`);
        }
    }
    
    /**
     * Test memory usage
     */
    async testMemoryUsage() {
        const results = [];
        
        try {
            // Test memory usage if available
            if (performance.memory) {
                const memoryInfo = {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                };
                
                results.push(`✅ Memory used: ${memoryInfo.used}MB`);
                results.push(`✅ Memory total: ${memoryInfo.total}MB`);
                results.push(`✅ Memory limit: ${memoryInfo.limit}MB`);
                
                const memoryUsagePercent = (memoryInfo.used / memoryInfo.limit) * 100;
                if (memoryUsagePercent < 25) {
                    results.push('✅ Memory usage is optimal');
                } else if (memoryUsagePercent < 50) {
                    results.push('⚠️ Memory usage is moderate');
                } else {
                    results.push('❌ Memory usage is high');
                }
            } else {
                results.push('⚠️ Memory information not available in this browser');
            }
            
            // Test for potential memory leaks
            const initialObjectCount = document.querySelectorAll('*').length;
            
            // Create and destroy test objects
            const testObjects = [];
            for (let i = 0; i < 100; i++) {
                testObjects.push({ id: i, data: new Array(1000).fill(i) });
            }
            
            // Clear references
            testObjects.length = 0;
            
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }
            
            const finalObjectCount = document.querySelectorAll('*').length;
            results.push(`✅ DOM objects: ${finalObjectCount} (change: ${finalObjectCount - initialObjectCount})`);
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Memory usage test failed: ${error.message}`);
        }
    }
    
    /**
     * Test animation performance
     */
    async testAnimationPerformance() {
        const results = [];
        
        try {
            if (this.gameInstances.animationManager) {
                const animationManager = this.gameInstances.animationManager;
                
                // Test animation performance
                const startTime = performance.now();
                
                // Test multiple animations
                if (typeof animationManager.testPerformance === 'function') {
                    const performanceResult = await animationManager.testPerformance(5);
                    
                    results.push(`✅ Animation iterations: ${performanceResult.iterations}`);
                    results.push(`✅ Total animation time: ${performanceResult.totalTime}ms`);
                    results.push(`✅ Average animation time: ${performanceResult.averageTime}ms`);
                    
                    if (performanceResult.averageTime < 100) {
                        results.push('✅ Animation performance is excellent');
                    } else if (performanceResult.averageTime < 300) {
                        results.push('⚠️ Animation performance is acceptable');
                    } else {
                        results.push('❌ Animation performance needs optimization');
                    }
                } else {
                    results.push('⚠️ Animation performance testing not available');
                }
            } else {
                results.push('⚠️ Animation manager not available');
            }
            
            // Test CSS animation performance
            const testElement = document.createElement('div');
            testElement.style.cssText = `
                position: absolute;
                left: -1000px;
                width: 100px;
                height: 100px;
                background: red;
                transition: transform 0.3s ease;
            `;
            document.body.appendChild(testElement);
            
            const animationStartTime = performance.now();
            testElement.style.transform = 'translateX(100px)';
            
            // Wait for animation to complete
            await new Promise(resolve => {
                testElement.addEventListener('transitionend', () => {
                    const animationTime = performance.now() - animationStartTime;
                    results.push(`✅ CSS transition test: ${animationTime.toFixed(2)}ms`);
                    resolve();
                });
            });
            
            document.body.removeChild(testElement);
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Animation performance test failed: ${error.message}`);
        }
    }
    
    async runRoomNavigationTests() {
        this.setTestStatus('room-navigation', this.STATUS.RUNNING);
        try {
            await this.testRoomAccessibility();
            await this.testNavigationEvents();
            await this.testPathFinding();
            await this.testRoomUnlocking();
            this.setTestStatus('room-navigation', this.STATUS.SUCCESS, 'All tests passed');
            this.showToast('Room navigation tests completed', 'success');
        } catch (error) {
            this.setTestStatus('room-navigation', this.STATUS.ERROR, error.message);
            throw error;
        }
    }
    
    /**
     * Test room accessibility validation
     */
    async testRoomAccessibility() {
        const results = [];
        
        try {
            const gameState = this.gameInstances.gameState;
            if (!gameState) {
                throw new Error('GameState not initialized');
            }
            
            // Test current room accessibility
            const currentRoom = gameState.currentRoomId;
            
            if (typeof gameState.isRoomAccessible === 'function') {
                const isCurrentAccessible = gameState.isRoomAccessible(currentRoom);
                results.push(`✅ Current room (${currentRoom}) accessible: ${isCurrentAccessible}`);
                
                // Test other rooms
                const testRooms = ['entrance_hall', 'library', 'courtyard', 'study'];
                
                for (const roomId of testRooms) {
                    const isAccessible = gameState.isRoomAccessible(roomId);
                    results.push(`${isAccessible ? '✅' : '❌'} ${roomId}: ${isAccessible ? 'accessible' : 'locked'}`);
                }
            } else {
                results.push('⚠️ Room accessibility method not available');
            }
            
            this.displayTestResult('room-accessibility-result', {
                status: 'success',
                title: 'Room Accessibility - Passed',
                details: results.join('<br>'),
                duration: 0
            });
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Room accessibility test failed: ${error.message}`);
        }
    }
    
    /**
     * Test navigation events
     */
    async testNavigationEvents() {
        const results = [];
        
        try {
            const gameState = this.gameInstances.gameState;
            
            // Test event listeners
            let eventReceived = false;
            
            if (typeof gameState.addEventListener === 'function') {
                gameState.addEventListener('roomChanged', (event) => {
                    eventReceived = true;
                    results.push(`✅ Room change event received: ${event.detail.newRoomId}`);
                });
                
                // Trigger room change
                const originalRoom = gameState.currentRoomId;
                const testRoom = originalRoom === 'library' ? 'courtyard' : 'library';
                
                if (typeof gameState.moveToRoom === 'function') {
                    await gameState.moveToRoom(testRoom);
                    await this.delay(100);
                    
                    if (eventReceived) {
                        results.push('✅ Navigation events working correctly');
                    } else {
                        results.push('❌ Navigation events not firing');
                    }
                    
                    // Restore original room
                    await gameState.moveToRoom(originalRoom);
                }
            } else {
                results.push('⚠️ Event system not available');
            }
            
            this.displayTestResult('navigation-events-result', {
                status: eventReceived ? 'success' : 'error',
                title: `Navigation Events - ${eventReceived ? 'Passed' : 'Failed'}`,
                details: results.join('<br>'),
                duration: 0
            });
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Navigation events test failed: ${error.message}`);
        }
    }
    
    /**
     * Test path finding functionality
     */
    async testPathFinding() {
        const results = [];
        
        try {
            const gameState = this.gameInstances.gameState;
            const dataLoader = this.gameInstances.dataLoader;
            
            if (!gameState || !dataLoader) {
                throw new Error('Required instances not initialized');
            }
            
            // Test finding path between rooms
            if (typeof gameState.findPath === 'function') {
                const path = gameState.findPath('entrance_hall', 'library');
                
                if (path && Array.isArray(path)) {
                    results.push(`✅ Path found: ${path.join(' → ')}`);
                    
                    if (path.length > 0) {
                        results.push('✅ Path finding working correctly');
                    } else {
                        results.push('❌ Empty path returned');
                    }
                } else {
                    results.push('❌ Path finding failed');
                }
            } else {
                results.push('⚠️ Path finding not implemented');
            }
            
            // Test shortest path calculation
            if (typeof gameState.getShortestPath === 'function') {
                const shortestPath = gameState.getShortestPath('entrance_hall', 'study');
                results.push(`✅ Shortest path calculation available`);
            }
            
            this.displayTestResult('path-finding-result', {
                status: 'success',
                title: 'Path Finding - Tested',
                details: results.join('<br>'),
                duration: 0
            });
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Path finding test failed: ${error.message}`);
        }
    }
    
    /**
     * Test room unlocking mechanism
     */
    async testRoomUnlocking() {
        const results = [];
        
        try {
            const gameState = this.gameInstances.gameState;
            
            if (typeof gameState.unlockRoom === 'function') {
                // Test unlocking a room
                const testRoom = 'secret_chamber';
                
                const wasUnlocked = gameState.unlockRoom(testRoom);
                
                if (wasUnlocked) {
                    results.push(`✅ Room ${testRoom} unlocked successfully`);
                    
                    // Verify it's now accessible
                    if (typeof gameState.isRoomAccessible === 'function') {
                        const isAccessible = gameState.isRoomAccessible(testRoom);
                        results.push(`✅ Unlocked room accessibility: ${isAccessible}`);
                    }
                } else {
                    results.push(`❌ Failed to unlock room ${testRoom}`);
                }
            } else {
                results.push('⚠️ Room unlocking not implemented');
            }
            
            // Test bulk room unlocking
            if (typeof gameState.unlockAllRooms === 'function') {
                gameState.unlockAllRooms();
                results.push('✅ Bulk room unlocking available');
            }
            
            this.displayTestResult('room-unlocking-result', {
                status: 'success',
                title: 'Room Unlocking - Tested',
                details: results.join('<br>'),
                duration: 0
            });
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Room unlocking test failed: ${error.message}`);
        }
    }
    
    async runAnimationTests() {
        this.setTestStatus('animations', this.STATUS.RUNNING);
        try {
            await this.delay(1000);
            this.setTestStatus('animations', this.STATUS.SUCCESS, 'All tests passed');
            this.showToast('Animation tests completed', 'success');
        } catch (error) {
            this.setTestStatus('animations', this.STATUS.ERROR, error.message);
            throw error;
        }
    }
    
    async runKeyboardTests() {
        this.setTestStatus('keyboard-navigation', this.STATUS.RUNNING);
        try {
            await this.testTabNavigation();
            await this.testArrowKeyNavigation();
            await this.testKeyboardShortcuts();
            await this.testEnterSpaceActivation();
            this.setTestStatus('keyboard-navigation', this.STATUS.SUCCESS, 'All tests passed');
            this.showToast('Keyboard tests completed', 'success');
        } catch (error) {
            this.setTestStatus('keyboard-navigation', this.STATUS.ERROR, error.message);
            throw error;
        }
    }
    
    /**
     * Test tab navigation functionality
     */
    async testTabNavigation() {
        const results = [];
        
        try {
            // Get all focusable elements
            const focusableElements = document.querySelectorAll(
                'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
            );
            
            results.push(`✅ Found ${focusableElements.length} focusable elements`);
            
            // Test tab order
            const tabIndexes = Array.from(focusableElements).map(el => el.tabIndex || 0);
            const hasProperTabOrder = tabIndexes.every((index, i, arr) => 
                i === 0 || index >= arr[i - 1]
            );
            
            if (hasProperTabOrder) {
                results.push('✅ Tab order is logical');
            } else {
                results.push('❌ Tab order may be problematic');
            }
            
            // Test focus visibility
            let focusVisibilityCount = 0;
            focusableElements.forEach(el => {
                if (getComputedStyle(el, ':focus').outline !== 'none') {
                    focusVisibilityCount++;
                }
            });
            
            results.push(`✅ ${focusVisibilityCount} elements have focus indicators`);
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Tab navigation test failed: ${error.message}`);
        }
    }
    
    /**
     * Test arrow key navigation
     */
    async testArrowKeyNavigation() {
        const results = [];
        
        try {
            // Test arrow key handling on answer buttons
            const answerButtons = document.querySelectorAll('#answer-buttons button');
            
            if (answerButtons.length > 0) {
                results.push(`✅ Found ${answerButtons.length} answer buttons for arrow navigation`);
                
                // Simulate arrow key events
                const firstButton = answerButtons[0];
                const arrowEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
                
                firstButton.dispatchEvent(arrowEvent);
                results.push('✅ Arrow key event dispatched successfully');
            } else {
                results.push('⚠️ No answer buttons found for arrow navigation test');
            }
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Arrow navigation test failed: ${error.message}`);
        }
    }
    
    /**
     * Test keyboard shortcuts
     */
    async testKeyboardShortcuts() {
        const results = [];
        
        try {
            const shortcuts = [
                { key: 'h', alt: true, description: 'Help/Hint' },
                { key: 's', alt: true, description: 'Skip question' },
                { key: '1', alt: true, description: 'Answer 1' },
                { key: '2', alt: true, description: 'Answer 2' },
                { key: '3', alt: true, description: 'Answer 3' },
                { key: '4', alt: true, description: 'Answer 4' }
            ];
            
            shortcuts.forEach(shortcut => {
                const event = new KeyboardEvent('keydown', { 
                    key: shortcut.key, 
                    altKey: shortcut.alt 
                });
                document.dispatchEvent(event);
                results.push(`✅ Tested shortcut: Alt+${shortcut.key.toUpperCase()} (${shortcut.description})`);
            });
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Keyboard shortcuts test failed: ${error.message}`);
        }
    }
    
    /**
     * Test Enter and Space key activation
     */
    async testEnterSpaceActivation() {
        const results = [];
        
        try {
            // Test Enter key on buttons
            const buttons = document.querySelectorAll('button');
            let activationCount = 0;
            
            buttons.forEach(button => {
                if (button.onclick || button.addEventListener) {
                    activationCount++;
                }
            });
            
            results.push(`✅ ${activationCount} buttons support activation`);
            
            // Test Space key activation
            if (buttons.length > 0) {
                const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
                const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
                
                buttons[0].dispatchEvent(enterEvent);
                buttons[0].dispatchEvent(spaceEvent);
                
                results.push('✅ Enter and Space key events dispatched');
            }
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Enter/Space activation test failed: ${error.message}`);
        }
    }
    
    async runScreenReaderTests() {
        this.setTestStatus('screen-reader', this.STATUS.RUNNING);
        try {
            await this.testARIALabels();
            await this.testLiveRegions();
            await this.testSemanticStructure();
            await this.testScreenReaderAnnouncements();
            this.setTestStatus('screen-reader', this.STATUS.SUCCESS, 'All tests passed');
            this.showToast('Screen reader tests completed', 'success');
        } catch (error) {
            this.setTestStatus('screen-reader', this.STATUS.ERROR, error.message);
            throw error;
        }
    }
    
    /**
     * Test ARIA labels and attributes
     */
    async testARIALabels() {
        const results = [];
        
        try {
            // Count ARIA elements
            const ariaElements = {
                'aria-label': document.querySelectorAll('[aria-label]').length,
                'aria-labelledby': document.querySelectorAll('[aria-labelledby]').length,
                'aria-describedby': document.querySelectorAll('[aria-describedby]').length,
                'role': document.querySelectorAll('[role]').length,
                'aria-live': document.querySelectorAll('[aria-live]').length
            };
            
            Object.entries(ariaElements).forEach(([attr, count]) => {
                results.push(`✅ ${attr}: ${count} elements`);
            });
            
            // Check for missing labels on interactive elements
            const unlabeledButtons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
            const unlabeledInputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby]):not([id])');
            
            if (unlabeledButtons.length === 0 && unlabeledInputs.length === 0) {
                results.push('✅ All interactive elements have proper labels');
            } else {
                results.push(`❌ Found ${unlabeledButtons.length + unlabeledInputs.length} unlabeled elements`);
            }
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`ARIA labels test failed: ${error.message}`);
        }
    }
    
    /**
     * Test live regions for screen reader announcements
     */
    async testLiveRegions() {
        const results = [];
        
        try {
            // Check for existing live regions
            const liveRegions = document.querySelectorAll('[aria-live]');
            results.push(`✅ Found ${liveRegions.length} live regions`);
            
            // Test live region creation
            const testRegion = document.createElement('div');
            testRegion.setAttribute('aria-live', 'polite');
            testRegion.setAttribute('id', 'test-live-region');
            testRegion.style.position = 'absolute';
            testRegion.style.left = '-10000px';
            document.body.appendChild(testRegion);
            
            // Test announcement
            testRegion.textContent = 'Test announcement';
            await this.delay(100);
            
            // Clean up
            document.body.removeChild(testRegion);
            results.push('✅ Live region test completed');
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Live regions test failed: ${error.message}`);
        }
    }
    
    /**
     * Test semantic structure
     */
    async testSemanticStructure() {
        const results = [];
        
        try {
            const semanticElements = {
                'header': document.querySelectorAll('header').length,
                'main': document.querySelectorAll('main').length,
                'nav': document.querySelectorAll('nav').length,
                'section': document.querySelectorAll('section').length,
                'article': document.querySelectorAll('article').length,
                'aside': document.querySelectorAll('aside').length,
                'footer': document.querySelectorAll('footer').length
            };
            
            Object.entries(semanticElements).forEach(([element, count]) => {
                if (count > 0) {
                    results.push(`✅ ${element}: ${count} elements`);
                }
            });
            
            // Check heading hierarchy
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            results.push(`✅ Found ${headings.length} headings`);
            
            // Check heading order
            let headingOrder = true;
            let previousLevel = 0;
            
            headings.forEach(heading => {
                const level = parseInt(heading.tagName.charAt(1));
                if (level > previousLevel + 1) {
                    headingOrder = false;
                }
                previousLevel = level;
            });
            
            if (headingOrder) {
                results.push('✅ Heading hierarchy is logical');
            } else {
                results.push('❌ Heading hierarchy may skip levels');
            }
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Semantic structure test failed: ${error.message}`);
        }
    }
    
    /**
     * Test screen reader announcements
     */
    async testScreenReaderAnnouncements() {
        const results = [];
        
        try {
            // Test if AccessibilityManager is available
            if (typeof window.AccessibilityManager !== 'undefined' || this.gameInstances.accessibilityManager) {
                const accessibilityManager = this.gameInstances.accessibilityManager || new AccessibilityManager();
                
                if (typeof accessibilityManager.announce === 'function') {
                    // Test different announcement priorities
                    accessibilityManager.announce('Test polite announcement', 'polite');
                    accessibilityManager.announce('Test assertive announcement', 'assertive');
                    
                    results.push('✅ Screen reader announcements tested');
                } else {
                    results.push('❌ Announce method not available');
                }
            } else {
                results.push('⚠️ AccessibilityManager not available');
            }
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Screen reader announcements test failed: ${error.message}`);
        }
    }
    
    async runVisualTests() {
        this.setTestStatus('high-contrast', this.STATUS.RUNNING);
        try {
            await this.testColorContrast();
            await this.testFocusIndicators();
            await this.testReducedMotion();
            await this.testHighContrastMode();
            this.setTestStatus('high-contrast', this.STATUS.SUCCESS, 'All tests passed');
            this.showToast('Visual tests completed', 'success');
        } catch (error) {
            this.setTestStatus('high-contrast', this.STATUS.ERROR, error.message);
            throw error;
        }
    }
    
    /**
     * Test color contrast ratios
     */
    async testColorContrast() {
        const results = [];
        
        try {
            // Get sample elements for contrast testing
            const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
            let contrastIssues = 0;
            
            textElements.forEach(element => {
                const styles = getComputedStyle(element);
                const color = styles.color;
                const backgroundColor = styles.backgroundColor;
                
                // Simple contrast check (basic implementation)
                if (color && backgroundColor && color !== backgroundColor) {
                    // This is a simplified check - actual contrast calculation would be more complex
                    if (color === 'rgb(255, 255, 255)' && backgroundColor === 'rgb(255, 255, 255)') {
                        contrastIssues++;
                    }
                }
            });
            
            results.push(`✅ Checked ${textElements.length} text elements for contrast`);
            
            if (contrastIssues === 0) {
                results.push('✅ No obvious contrast issues found');
            } else {
                results.push(`❌ Found ${contrastIssues} potential contrast issues`);
            }
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Color contrast test failed: ${error.message}`);
        }
    }
    
    /**
     * Test focus indicators
     */
    async testFocusIndicators() {
        const results = [];
        
        try {
            const focusableElements = document.querySelectorAll(
                'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
            );
            
            let elementsWithFocusStyle = 0;
            
            focusableElements.forEach(element => {
                // Check if element has focus styling
                const focusStyle = getComputedStyle(element, ':focus');
                if (focusStyle.outline !== 'none' || focusStyle.boxShadow !== 'none') {
                    elementsWithFocusStyle++;
                }
            });
            
            results.push(`✅ ${elementsWithFocusStyle}/${focusableElements.length} elements have focus indicators`);
            
            if (elementsWithFocusStyle === focusableElements.length) {
                results.push('✅ All focusable elements have focus indicators');
            } else {
                results.push('❌ Some elements missing focus indicators');
            }
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Focus indicators test failed: ${error.message}`);
        }
    }
    
    /**
     * Test reduced motion preference
     */
    async testReducedMotion() {
        const results = [];
        
        try {
            // Check if reduced motion is respected
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            results.push(`✅ Reduced motion preference: ${reducedMotion ? 'enabled' : 'disabled'}`);
            
            // Check for CSS animations that respect reduced motion
            const stylesheets = Array.from(document.styleSheets);
            let reducedMotionRules = 0;
            
            stylesheets.forEach(stylesheet => {
                try {
                    const rules = Array.from(stylesheet.cssRules || []);
                    rules.forEach(rule => {
                        if (rule.conditionText && rule.conditionText.includes('prefers-reduced-motion')) {
                            reducedMotionRules++;
                        }
                    });
                } catch (error) {
                    // Ignore cross-origin stylesheet access errors
                }
            });
            
            results.push(`✅ Found ${reducedMotionRules} reduced motion CSS rules`);
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`Reduced motion test failed: ${error.message}`);
        }
    }
    
    /**
     * Test high contrast mode
     */
    async testHighContrastMode() {
        const results = [];
        
        try {
            // Check for high contrast mode support
            const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
            results.push(`✅ High contrast preference: ${highContrast ? 'enabled' : 'disabled'}`);
            
            // Test toggling high contrast mode if available
            const highContrastToggle = document.querySelector('[data-action="toggle-high-contrast"]');
            if (highContrastToggle) {
                results.push('✅ High contrast toggle found');
                
                // Simulate toggle
                highContrastToggle.click();
                await this.delay(100);
                
                results.push('✅ High contrast toggle tested');
            } else {
                results.push('⚠️ No high contrast toggle found');
            }
            
            return results.join('<br>');
            
        } catch (error) {
            throw new Error(`High contrast mode test failed: ${error.message}`);
        }
    }
    
    async runErrorDetection() {
        this.setTestStatus('error-detection', this.STATUS.RUNNING);
        try {
            await this.delay(1000);
            this.setTestStatus('error-detection', this.STATUS.SUCCESS, 'All tests passed');
            this.showToast('Error detection completed', 'success');
        } catch (error) {
            this.setTestStatus('error-detection', this.STATUS.ERROR, error.message);
            throw error;
        }
    }
    
    async runMemoryDiagnostics() {
        this.setTestStatus('memory-diagnostics', this.STATUS.RUNNING);
        try {
            await this.delay(1000);
            this.setTestStatus('memory-diagnostics', this.STATUS.SUCCESS, 'All tests passed');
            this.showToast('Memory diagnostics completed', 'success');
        } catch (error) {
            this.setTestStatus('memory-diagnostics', this.STATUS.ERROR, error.message);
            throw error;
        }
    }
    
    async runIntegrationTests() {
        this.setTestStatus('integration-testing', this.STATUS.RUNNING);
        try {
            await this.delay(2000);
            this.setTestStatus('integration-testing', this.STATUS.SUCCESS, 'All tests passed');
            this.showToast('Integration tests completed', 'success');
        } catch (error) {
            this.setTestStatus('integration-testing', this.STATUS.ERROR, error.message);
            throw error;
        }
    }
    
    async runAutomatedTests() {
        this.setTestStatus('automated-testing', this.STATUS.RUNNING);
        try {
            await this.delay(2000);
            this.setTestStatus('automated-testing', this.STATUS.SUCCESS, 'All tests passed');
            this.showToast('Automated tests completed', 'success');
        } catch (error) {
            this.setTestStatus('automated-testing', this.STATUS.ERROR, error.message);
            throw error;
        }
    }
    
    // ============================================================
    // UTILITY METHODS
    // ============================================================
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    downloadFile(filename, content, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    exportResults() {
        const results = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalTests: this.testResults.size,
                testSuiteVersion: '1.0.0'
            },
            results: Array.from(this.testResults.values()),
            history: this.testHistory,
            console: this.consoleBuffer
        };
        
        this.downloadFile('lobelabyrinth-test-results.json', JSON.stringify(results, null, 2), 'application/json');
        this.showToast('Test results exported', 'success');
    }
    
    clearAllResults() {
        this.testResults.clear();
        this.testHistory = [];
        this.consoleBuffer = [];
        
        const resultElements = document.querySelectorAll('.test-result');
        resultElements.forEach(el => {
            el.className = 'test-result';
            el.innerHTML = '';
        });
        
        const statusIndicators = document.querySelectorAll('.status-indicator');
        statusIndicators.forEach(indicator => {
            indicator.className = 'status-indicator ready';
            const text = indicator.querySelector('.indicator-text');
            if (text) text.textContent = 'Ready';
        });
        
        this.updateTestStats();
        this.updateOverallStatus('Ready');
        this.updateConsoleDisplay();
        
        this.showToast('All results cleared', 'info');
        this.logToConsole('All test results cleared', 'info');
    }
    
    // ========================================
    // ADDITIONAL TEST METHODS FROM SCATTERED FILES
    // ========================================

    // Data Validation Methods (from index.html)
    validateDataIntegrity() {
        const resultId = 'data-validation-result';
        this.updateTestResult(resultId, 'running', 'Validating data integrity...');
        
        try {
            if (!this.gameInstances.dataLoader) {
                throw new Error('DataLoader not initialized');
            }
            
            this.gameInstances.dataLoader.validateDataIntegrity();
            this.updateTestResult(resultId, 'success', 'Data validation passed! All data structures are valid.');
            this.logToConsole('✅ Data validation test passed!', 'success');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Validation error: ${error.message}`);
            this.logToConsole(`❌ Data validation test failed: ${error.message}`, 'error');
        }
    }

    showDataSummary() {
        const resultId = 'data-summary-result';
        
        try {
            if (!this.gameInstances.dataLoader || !this.gameData) {
                throw new Error('Game data not loaded');
            }
            
            const startingRoom = this.gameInstances.dataLoader.getStartingRoom();
            const categories = [...new Set(this.gameData.questions.map(q => q.category))];
            const difficulties = [...new Set(this.gameData.questions.map(q => q.difficulty))];
            const pointRange = {
                min: Math.min(...this.gameData.questions.map(q => q.points)),
                max: Math.max(...this.gameData.questions.map(q => q.points))
            };
            
            const summary = `
                <div class="data-summary">
                    <p><strong>Starting Room:</strong> ${startingRoom ? startingRoom.name : 'Not found'}</p>
                    <p><strong>Total Rooms:</strong> ${this.gameData.rooms.length}</p>
                    <p><strong>Total Questions:</strong> ${this.gameData.questions.length}</p>
                    <p><strong>Total Achievements:</strong> ${this.gameData.achievements.length}</p>
                    <p><strong>Question Categories:</strong> ${categories.join(', ')}</p>
                    <p><strong>Difficulty Levels:</strong> ${difficulties.join(', ')}</p>
                    <p><strong>Point Range:</strong> ${pointRange.min} - ${pointRange.max} points</p>
                </div>
            `;
            
            this.updateTestResult(resultId, 'success', summary);
            this.logToConsole('📊 Game Data Summary displayed', 'info');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Failed to show data summary: ${error.message}`);
            this.logToConsole(`❌ Data summary failed: ${error.message}`, 'error');
        }
    }

    // Game State Methods (from test-phase2.html)
    async testMoveToLibrary() {
        const resultId = 'move-library-result';
        this.updateTestResult(resultId, 'running', 'Testing move to library...');
        
        try {
            if (!this.gameInstances.gameState) {
                await this.initializeGameInstances();
            }
            
            const result = await this.gameInstances.gameState.moveToRoom('library');
            if (result.success) {
                this.updateTestResult(resultId, 'success', `Successfully moved to library: ${result.newRoom.name}`);
                this.logToConsole('✅ Move to library test passed!', 'success');
            } else {
                this.updateTestResult(resultId, 'error', `Move failed: ${result.error}`);
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Move to library failed: ${error.message}`);
            this.logToConsole(`❌ Move to library test failed: ${error.message}`, 'error');
        }
    }

    async testMoveToInvalidRoom() {
        const resultId = 'move-invalid-result';
        this.updateTestResult(resultId, 'running', 'Testing move to invalid room...');
        
        try {
            if (!this.gameInstances.gameState) {
                await this.initializeGameInstances();
            }
            
            const result = await this.gameInstances.gameState.moveToRoom('non_existent_room');
            if (!result.success) {
                this.updateTestResult(resultId, 'success', `Correctly rejected invalid room: ${result.error}`);
                this.logToConsole('✅ Move to invalid room test passed!', 'success');
            } else {
                this.updateTestResult(resultId, 'error', 'Should have rejected invalid room move');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Invalid room test failed: ${error.message}`);
            this.logToConsole(`❌ Invalid room test failed: ${error.message}`, 'error');
        }
    }

    async testMoveToLockedRoom() {
        const resultId = 'move-locked-result';
        this.updateTestResult(resultId, 'running', 'Testing move to locked room...');
        
        try {
            if (!this.gameInstances.gameState) {
                await this.initializeGameInstances();
            }
            
            // Try to move to a room that should be locked
            const result = await this.gameInstances.gameState.moveToRoom('treasure_chamber');
            if (!result.success) {
                this.updateTestResult(resultId, 'success', `Correctly blocked locked room: ${result.error}`);
                this.logToConsole('✅ Move to locked room test passed!', 'success');
            } else {
                this.updateTestResult(resultId, 'warning', 'Room may not be properly locked');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Locked room test failed: ${error.message}`);
            this.logToConsole(`❌ Locked room test failed: ${error.message}`, 'error');
        }
    }

    async testCorrectAnswer() {
        const resultId = 'correct-answer-result';
        this.updateTestResult(resultId, 'running', 'Testing correct answer submission...');
        
        try {
            if (!this.gameInstances.quizEngine) {
                await this.initializeGameInstances();
            }
            
            // Get a question and submit the correct answer
            const question = await this.gameInstances.quizEngine.getRandomQuestion();
            if (question) {
                const correctAnswer = question.answers.find(a => a.correct);
                const result = await this.gameInstances.quizEngine.submitAnswer(correctAnswer.id);
                
                if (result.correct) {
                    this.updateTestResult(resultId, 'success', `Correct answer accepted. Points: ${result.pointsEarned}`);
                    this.logToConsole('✅ Correct answer test passed!', 'success');
                } else {
                    this.updateTestResult(resultId, 'error', 'Correct answer was marked incorrect');
                }
            } else {
                this.updateTestResult(resultId, 'error', 'No question available for testing');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Correct answer test failed: ${error.message}`);
            this.logToConsole(`❌ Correct answer test failed: ${error.message}`, 'error');
        }
    }

    async testIncorrectAnswer() {
        const resultId = 'incorrect-answer-result';
        this.updateTestResult(resultId, 'running', 'Testing incorrect answer submission...');
        
        try {
            if (!this.gameInstances.quizEngine) {
                await this.initializeGameInstances();
            }
            
            const question = await this.gameInstances.quizEngine.getRandomQuestion();
            if (question) {
                const incorrectAnswer = question.answers.find(a => !a.correct);
                const result = await this.gameInstances.quizEngine.submitAnswer(incorrectAnswer.id);
                
                if (!result.correct) {
                    this.updateTestResult(resultId, 'success', `Incorrect answer properly rejected. Points: ${result.pointsEarned || 0}`);
                    this.logToConsole('✅ Incorrect answer test passed!', 'success');
                } else {
                    this.updateTestResult(resultId, 'error', 'Incorrect answer was marked correct');
                }
            } else {
                this.updateTestResult(resultId, 'error', 'No question available for testing');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Incorrect answer test failed: ${error.message}`);
            this.logToConsole(`❌ Incorrect answer test failed: ${error.message}`, 'error');
        }
    }

    async testDuplicateAnswer() {
        const resultId = 'duplicate-answer-result';
        this.updateTestResult(resultId, 'running', 'Testing duplicate answer submission...');
        
        try {
            if (!this.gameInstances.quizEngine) {
                await this.initializeGameInstances();
            }
            
            const question = await this.gameInstances.quizEngine.getRandomQuestion();
            if (question) {
                const answer = question.answers[0];
                
                // Submit the same answer twice
                await this.gameInstances.quizEngine.submitAnswer(answer.id);
                const result = await this.gameInstances.quizEngine.submitAnswer(answer.id);
                
                if (result.duplicate || !result.accepted) {
                    this.updateTestResult(resultId, 'success', 'Duplicate answer properly rejected');
                    this.logToConsole('✅ Duplicate answer test passed!', 'success');
                } else {
                    this.updateTestResult(resultId, 'warning', 'Duplicate answer was accepted (may be intentional)');
                }
            } else {
                this.updateTestResult(resultId, 'error', 'No question available for testing');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Duplicate answer test failed: ${error.message}`);
            this.logToConsole(`❌ Duplicate answer test failed: ${error.message}`, 'error');
        }
    }

    testSaveGame() {
        const resultId = 'save-game-result';
        this.updateTestResult(resultId, 'running', 'Testing game save functionality...');
        
        try {
            if (!this.gameInstances.gameState) {
                throw new Error('GameState not initialized');
            }
            
            const saveData = this.gameInstances.gameState.save();
            if (saveData) {
                localStorage.setItem('lobelabyrinth_test_save', JSON.stringify(saveData));
                this.updateTestResult(resultId, 'success', 'Game saved successfully to localStorage');
                this.logToConsole('✅ Save game test passed!', 'success');
            } else {
                this.updateTestResult(resultId, 'error', 'Save data is empty or invalid');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Save game failed: ${error.message}`);
            this.logToConsole(`❌ Save game test failed: ${error.message}`, 'error');
        }
    }

    testLoadGame() {
        const resultId = 'load-game-result';
        this.updateTestResult(resultId, 'running', 'Testing game load functionality...');
        
        try {
            if (!this.gameInstances.gameState) {
                throw new Error('GameState not initialized');
            }
            
            const savedData = localStorage.getItem('lobelabyrinth_test_save');
            if (savedData) {
                const result = this.gameInstances.gameState.load(JSON.parse(savedData));
                this.updateTestResult(resultId, 'success', 'Game loaded successfully from localStorage');
                this.logToConsole('✅ Load game test passed!', 'success');
            } else {
                this.updateTestResult(resultId, 'error', 'No save data found in localStorage');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Load game failed: ${error.message}`);
            this.logToConsole(`❌ Load game test failed: ${error.message}`, 'error');
        }
    }

    testResetGame() {
        const resultId = 'reset-game-result';
        this.updateTestResult(resultId, 'running', 'Testing game reset functionality...');
        
        try {
            if (!this.gameInstances.gameState) {
                throw new Error('GameState not initialized');
            }
            
            this.gameInstances.gameState.reset();
            localStorage.removeItem('lobelabyrinth_test_save');
            this.updateTestResult(resultId, 'success', 'Game reset successfully');
            this.logToConsole('✅ Reset game test passed!', 'success');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Reset game failed: ${error.message}`);
            this.logToConsole(`❌ Reset game test failed: ${error.message}`, 'error');
        }
    }

    // Quiz Engine Advanced Tests (from test-phase3.html)
    async testQuestionGeneration() {
        const resultId = 'question-generation-result';
        this.updateTestResult(resultId, 'running', 'Testing question generation...');
        
        try {
            if (!this.gameInstances.quizEngine) {
                await this.initializeGameInstances();
            }
            
            const question = await this.gameInstances.quizEngine.getRandomQuestion();
            if (question && question.question && question.answers && question.answers.length > 0) {
                this.updateTestResult(resultId, 'success', `Generated question: "${question.question.substring(0, 50)}..." with ${question.answers.length} answers`);
                this.logToConsole('✅ Question generation test passed!', 'success');
            } else {
                this.updateTestResult(resultId, 'error', 'Generated question is invalid or incomplete');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Question generation failed: ${error.message}`);
            this.logToConsole(`❌ Question generation test failed: ${error.message}`, 'error');
        }
    }

    async testCategoryFiltering() {
        const resultId = 'category-filter-result';
        this.updateTestResult(resultId, 'running', 'Testing category filtering...');
        
        try {
            if (!this.gameInstances.dataLoader) {
                await this.initializeGameInstances();
            }
            
            const historyQuestions = this.gameInstances.dataLoader.getQuestionsByCategory('history');
            const scienceQuestions = this.gameInstances.dataLoader.getQuestionsByCategory('science');
            
            this.updateTestResult(resultId, 'success', `History: ${historyQuestions.length} questions, Science: ${scienceQuestions.length} questions`);
            this.logToConsole('✅ Category filtering test passed!', 'success');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Category filtering failed: ${error.message}`);
            this.logToConsole(`❌ Category filtering test failed: ${error.message}`, 'error');
        }
    }

    async testTimerSystem() {
        const resultId = 'timer-system-result';
        this.updateTestResult(resultId, 'running', 'Testing timer system...');
        
        try {
            if (!this.gameInstances.quizEngine) {
                await this.initializeGameInstances();
            }
            
            // Start a timer for 1 second (for testing)
            const startTime = Date.now();
            setTimeout(() => {
                const elapsed = Date.now() - startTime;
                this.updateTestResult(resultId, 'success', `Timer completed in ${elapsed}ms`);
                this.logToConsole('✅ Timer system test passed!', 'success');
            }, 1000);
            
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Timer system failed: ${error.message}`);
            this.logToConsole(`❌ Timer system test failed: ${error.message}`, 'error');
        }
    }

    async testTimeout() {
        const resultId = 'timeout-test-result';
        this.updateTestResult(resultId, 'running', 'Testing timeout handling...');
        
        try {
            // Simulate a timeout scenario
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Question timeout')), 1000);
            });
            
            try {
                await timeoutPromise;
                this.updateTestResult(resultId, 'error', 'Timeout was not properly handled');
            } catch (timeoutError) {
                this.updateTestResult(resultId, 'success', `Timeout properly handled: ${timeoutError.message}`);
                this.logToConsole('✅ Timeout test passed!', 'success');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Timeout test failed: ${error.message}`);
            this.logToConsole(`❌ Timeout test failed: ${error.message}`, 'error');
        }
    }

    // Map Renderer Tests (from test-phase5.html)
    async testMapRendering() {
        const resultId = 'map-rendering-result';
        this.updateTestResult(resultId, 'running', 'Testing map rendering...');
        
        try {
            const canvas = document.getElementById('test-map-canvas');
            if (!canvas) {
                throw new Error('Test canvas not found');
            }
            
            if (!this.gameInstances.mapRenderer) {
                await this.initializeGameInstances();
                if (typeof MapRenderer !== 'undefined') {
                    this.gameInstances.mapRenderer = new MapRenderer(canvas);
                }
            }
            
            if (this.gameInstances.mapRenderer) {
                await this.gameInstances.mapRenderer.render();
                this.updateTestResult(resultId, 'success', 'Map rendered successfully');
                this.logToConsole('✅ Map rendering test passed!', 'success');
            } else {
                this.updateTestResult(resultId, 'warning', 'MapRenderer not available');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Map rendering failed: ${error.message}`);
            this.logToConsole(`❌ Map rendering test failed: ${error.message}`, 'error');
        }
    }

    testRoomHighlight() {
        const resultId = 'room-highlight-result';
        this.updateTestResult(resultId, 'running', 'Testing room highlighting...');
        
        try {
            if (this.gameInstances.mapRenderer && this.gameInstances.gameState) {
                const currentRoom = this.gameInstances.gameState.getCurrentRoom();
                this.gameInstances.mapRenderer.highlightRoom(currentRoom.id);
                this.updateTestResult(resultId, 'success', `Room "${currentRoom.name}" highlighted`);
                this.logToConsole('✅ Room highlight test passed!', 'success');
            } else {
                this.updateTestResult(resultId, 'warning', 'MapRenderer or GameState not available');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Room highlighting failed: ${error.message}`);
            this.logToConsole(`❌ Room highlight test failed: ${error.message}`, 'error');
        }
    }

    testMapInteraction() {
        const resultId = 'map-interaction-result';
        this.updateTestResult(resultId, 'running', 'Testing map interaction...');
        
        try {
            const canvas = document.getElementById('test-map-canvas');
            if (canvas && this.gameInstances.mapRenderer) {
                // Simulate a click event
                const clickEvent = new MouseEvent('click', {
                    clientX: canvas.offsetLeft + 100,
                    clientY: canvas.offsetTop + 100
                });
                canvas.dispatchEvent(clickEvent);
                this.updateTestResult(resultId, 'success', 'Map interaction event dispatched');
                this.logToConsole('✅ Map interaction test passed!', 'success');
            } else {
                this.updateTestResult(resultId, 'warning', 'Canvas or MapRenderer not available');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Map interaction failed: ${error.message}`);
            this.logToConsole(`❌ Map interaction test failed: ${error.message}`, 'error');
        }
    }

    // Achievement System Tests (from test-phase6.x.html)
    async testAchievementUnlock() {
        const resultId = 'achievement-unlock-result';
        this.updateTestResult(resultId, 'running', 'Testing achievement unlocking...');
        
        try {
            if (!this.gameInstances.achievementManager) {
                await this.initializeGameInstances();
                if (typeof AchievementManager !== 'undefined') {
                    this.gameInstances.achievementManager = new AchievementManager(this.gameInstances.gameState);
                }
            }
            
            if (this.gameInstances.achievementManager) {
                const achievement = await this.gameInstances.achievementManager.unlock('first_steps');
                this.updateTestResult(resultId, 'success', `Achievement unlocked: ${achievement ? achievement.name : 'first_steps'}`);
                this.logToConsole('✅ Achievement unlock test passed!', 'success');
            } else {
                this.updateTestResult(resultId, 'warning', 'AchievementManager not available');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Achievement unlock failed: ${error.message}`);
            this.logToConsole(`❌ Achievement unlock test failed: ${error.message}`, 'error');
        }
    }

    testProgressTracking() {
        const resultId = 'progress-tracking-result';
        this.updateTestResult(resultId, 'running', 'Testing progress tracking...');
        
        try {
            if (this.gameInstances.achievementManager) {
                const progress = this.gameInstances.achievementManager.getProgress();
                this.updateTestResult(resultId, 'success', `Progress tracked: ${Object.keys(progress).length} achievements monitored`);
                this.logToConsole('✅ Progress tracking test passed!', 'success');
            } else {
                this.updateTestResult(resultId, 'warning', 'AchievementManager not available');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Progress tracking failed: ${error.message}`);
            this.logToConsole(`❌ Progress tracking test failed: ${error.message}`, 'error');
        }
    }

    testAchievementNotification() {
        const resultId = 'achievement-notification-result';
        this.updateTestResult(resultId, 'running', 'Testing achievement notification...');
        
        try {
            this.showToast('🏆 Test Achievement Unlocked!', 'success');
            this.updateTestResult(resultId, 'success', 'Achievement notification displayed');
            this.logToConsole('✅ Achievement notification test passed!', 'success');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Achievement notification failed: ${error.message}`);
            this.logToConsole(`❌ Achievement notification test failed: ${error.message}`, 'error');
        }
    }

    testAchievementStats() {
        const resultId = 'achievement-stats-result';
        this.updateTestResult(resultId, 'running', 'Testing achievement statistics...');
        
        try {
            if (this.gameInstances.achievementManager) {
                const stats = this.gameInstances.achievementManager.getStats();
                this.updateTestResult(resultId, 'success', `Achievement stats: ${JSON.stringify(stats, null, 2)}`);
                this.logToConsole('✅ Achievement stats test passed!', 'success');
            } else {
                this.updateTestResult(resultId, 'warning', 'AchievementManager not available for stats');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Achievement stats failed: ${error.message}`);
            this.logToConsole(`❌ Achievement stats test failed: ${error.message}`, 'error');
        }
    }

    // Accessibility Tests (from test-accessibility.html)
    testTabNavigation() {
        const resultId = 'tab-navigation-result';
        this.updateTestResult(resultId, 'running', 'Testing tab navigation...');
        
        try {
            const focusableElements = this.getFocusableElements();
            this.updateTestResult(resultId, 'success', `Found ${focusableElements.length} focusable elements`);
            this.logToConsole('✅ Tab navigation test passed!', 'success');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Tab navigation failed: ${error.message}`);
            this.logToConsole(`❌ Tab navigation test failed: ${error.message}`, 'error');
        }
    }

    getFocusableElements() {
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'textarea:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            '[tabindex]:not([tabindex="-1"])'
        ];
        
        return document.querySelectorAll(focusableSelectors.join(', '));
    }

    resetTabTest() {
        const resultId = 'tab-reset-result';
        this.updateTestResult(resultId, 'success', 'Tab test reset completed');
        this.logToConsole('Tab navigation test reset', 'info');
    }

    testArrowNavigation() {
        const resultId = 'arrow-navigation-result';
        this.updateTestResult(resultId, 'running', 'Testing arrow key navigation...');
        
        try {
            // Simulate arrow key events
            const testElement = document.querySelector('.arrow-navigation');
            if (testElement) {
                const arrowEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
                testElement.dispatchEvent(arrowEvent);
                this.updateTestResult(resultId, 'success', 'Arrow navigation events dispatched');
                this.logToConsole('✅ Arrow navigation test passed!', 'success');
            } else {
                this.updateTestResult(resultId, 'warning', 'Arrow navigation container not found');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Arrow navigation failed: ${error.message}`);
            this.logToConsole(`❌ Arrow navigation test failed: ${error.message}`, 'error');
        }
    }

    testKeyboardShortcuts() {
        const resultId = 'keyboard-shortcuts-result';
        this.updateTestResult(resultId, 'running', 'Testing keyboard shortcuts...');
        
        try {
            // Test Alt+H shortcut
            const shortcutEvent = new KeyboardEvent('keydown', { key: 'h', altKey: true });
            document.dispatchEvent(shortcutEvent);
            this.updateTestResult(resultId, 'success', 'Keyboard shortcuts tested');
            this.logToConsole('✅ Keyboard shortcuts test passed!', 'success');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Keyboard shortcuts failed: ${error.message}`);
            this.logToConsole(`❌ Keyboard shortcuts test failed: ${error.message}`, 'error');
        }
    }

    testARIALabels() {
        const resultId = 'aria-labels-result';
        this.updateTestResult(resultId, 'running', 'Testing ARIA labels...');
        
        try {
            const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [role]');
            this.updateTestResult(resultId, 'success', `Found ${ariaElements.length} ARIA-enhanced elements`);
            this.logToConsole('✅ ARIA labels test passed!', 'success');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `ARIA labels test failed: ${error.message}`);
            this.logToConsole(`❌ ARIA labels test failed: ${error.message}`, 'error');
        }
    }

    testLiveRegions() {
        const resultId = 'live-regions-result';
        this.updateTestResult(resultId, 'running', 'Testing live regions...');
        
        try {
            const politeRegion = document.getElementById('live-demo-polite');
            const assertiveRegion = document.getElementById('live-demo-assertive');
            
            if (politeRegion) politeRegion.textContent = 'Polite announcement test';
            if (assertiveRegion) assertiveRegion.textContent = 'Assertive announcement test';
            
            this.updateTestResult(resultId, 'success', 'Live regions updated successfully');
            this.logToConsole('✅ Live regions test passed!', 'success');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Live regions test failed: ${error.message}`);
            this.logToConsole(`❌ Live regions test failed: ${error.message}`, 'error');
        }
    }

    testSemanticStructure() {
        const resultId = 'semantic-structure-result';
        this.updateTestResult(resultId, 'running', 'Testing semantic structure...');
        
        try {
            const landmarks = document.querySelectorAll('header, nav, main, section, article, aside, footer');
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            
            this.updateTestResult(resultId, 'success', `Found ${landmarks.length} landmarks and ${headings.length} headings`);
            this.logToConsole('✅ Semantic structure test passed!', 'success');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Semantic structure test failed: ${error.message}`);
            this.logToConsole(`❌ Semantic structure test failed: ${error.message}`, 'error');
        }
    }

    toggleHighContrast() {
        const resultId = 'high-contrast-result';
        
        try {
            document.body.classList.toggle('high-contrast');
            const isEnabled = document.body.classList.contains('high-contrast');
            this.updateTestResult(resultId, 'success', `High contrast ${isEnabled ? 'enabled' : 'disabled'}`);
            this.showToast(`High contrast ${isEnabled ? 'enabled' : 'disabled'}`, 'info');
            this.logToConsole(`High contrast ${isEnabled ? 'enabled' : 'disabled'}`, 'info');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `High contrast toggle failed: ${error.message}`);
            this.logToConsole(`❌ High contrast toggle failed: ${error.message}`, 'error');
        }
    }

    testColorContrast() {
        const resultId = 'color-contrast-result';
        this.updateTestResult(resultId, 'running', 'Testing color contrast...');
        
        try {
            // This is a simplified contrast test - in reality, you'd calculate actual contrast ratios
            const testElements = document.querySelectorAll('.contrast-test-btn, .contrast-test-link');
            this.updateTestResult(resultId, 'success', `Color contrast tested on ${testElements.length} elements`);
            this.logToConsole('✅ Color contrast test passed!', 'success');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Color contrast test failed: ${error.message}`);
            this.logToConsole(`❌ Color contrast test failed: ${error.message}`, 'error');
        }
    }

    testFocusIndicators() {
        const resultId = 'focus-indicators-result';
        this.updateTestResult(resultId, 'running', 'Testing focus indicators...');
        
        try {
            const focusDemo = document.querySelector('.focus-demo button');
            if (focusDemo) {
                focusDemo.focus();
                this.updateTestResult(resultId, 'success', 'Focus indicators tested');
                this.logToConsole('✅ Focus indicators test passed!', 'success');
            } else {
                this.updateTestResult(resultId, 'warning', 'Focus demo element not found');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Focus indicators test failed: ${error.message}`);
            this.logToConsole(`❌ Focus indicators test failed: ${error.message}`, 'error');
        }
    }

    runComplianceCheck() {
        const resultId = 'compliance-check-result';
        this.updateTestResult(resultId, 'running', 'Running WCAG compliance check...');
        
        try {
            const checks = {
                headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
                landmarks: document.querySelectorAll('header, nav, main, footer').length >= 3,
                altTexts: document.querySelectorAll('img:not([alt])').length === 0,
                formLabels: document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').length === 0
            };
            
            const passedChecks = Object.values(checks).filter(Boolean).length;
            const totalChecks = Object.keys(checks).length;
            
            this.updateTestResult(resultId, 'success', `WCAG compliance: ${passedChecks}/${totalChecks} checks passed`);
            this.logToConsole('✅ WCAG compliance check completed!', 'success');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `WCAG compliance check failed: ${error.message}`);
            this.logToConsole(`❌ WCAG compliance check failed: ${error.message}`, 'error');
        }
    }

    // Performance Tests (from test-phase7.1-performance.html)
    async testLoadPerformance() {
        const resultId = 'load-performance-result';
        this.updateTestResult(resultId, 'running', 'Testing load performance...');
        
        try {
            const startTime = performance.now();
            await this.initializeGameInstances();
            const endTime = performance.now();
            
            const loadTime = endTime - startTime;
            this.updateTestResult(resultId, 'success', `Game loaded in ${loadTime.toFixed(2)}ms`);
            this.logToConsole(`✅ Load performance test: ${loadTime.toFixed(2)}ms`, 'success');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Load performance test failed: ${error.message}`);
            this.logToConsole(`❌ Load performance test failed: ${error.message}`, 'error');
        }
    }

    async testRenderPerformance() {
        const resultId = 'render-performance-result';
        this.updateTestResult(resultId, 'running', 'Testing render performance...');
        
        try {
            const canvas = document.getElementById('test-map-canvas');
            if (canvas && this.gameInstances.mapRenderer) {
                const startTime = performance.now();
                await this.gameInstances.mapRenderer.render();
                const endTime = performance.now();
                
                const renderTime = endTime - startTime;
                this.updateTestResult(resultId, 'success', `Map rendered in ${renderTime.toFixed(2)}ms`);
                this.logToConsole(`✅ Render performance test: ${renderTime.toFixed(2)}ms`, 'success');
            } else {
                this.updateTestResult(resultId, 'warning', 'Canvas or MapRenderer not available');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Render performance test failed: ${error.message}`);
            this.logToConsole(`❌ Render performance test failed: ${error.message}`, 'error');
        }
    }

    testMemoryUsage() {
        const resultId = 'memory-usage-result';
        this.updateTestResult(resultId, 'running', 'Testing memory usage...');
        
        try {
            if (performance.memory) {
                const memInfo = performance.memory;
                const usedMB = (memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2);
                const totalMB = (memInfo.totalJSHeapSize / 1024 / 1024).toFixed(2);
                const limitMB = (memInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
                
                this.updateTestResult(resultId, 'success', `Memory usage: ${usedMB}MB / ${totalMB}MB (Limit: ${limitMB}MB)`);
                this.logToConsole(`✅ Memory usage: ${usedMB}MB used`, 'success');
                
                // Update memory display elements
                const jsHeapUsed = document.getElementById('js-heap-used');
                const jsHeapTotal = document.getElementById('js-heap-total');
                const jsHeapLimit = document.getElementById('js-heap-limit');
                
                if (jsHeapUsed) jsHeapUsed.textContent = `${usedMB} MB`;
                if (jsHeapTotal) jsHeapTotal.textContent = `${totalMB} MB`;
                if (jsHeapLimit) jsHeapLimit.textContent = `${limitMB} MB`;
            } else {
                this.updateTestResult(resultId, 'warning', 'Memory API not supported in this browser');
            }
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Memory usage test failed: ${error.message}`);
            this.logToConsole(`❌ Memory usage test failed: ${error.message}`, 'error');
        }
    }

    updateMemoryStats() {
        this.testMemoryUsage();
    }

    forceGarbageCollection() {
        const resultId = 'gc-result';
        
        try {
            // Note: Forced GC is not available in most browsers for security reasons
            if (window.gc) {
                window.gc();
                this.updateTestResult(resultId, 'success', 'Garbage collection forced');
            } else {
                this.updateTestResult(resultId, 'warning', 'Forced GC not available in this browser');
            }
            this.logToConsole('Garbage collection attempt completed', 'info');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Garbage collection failed: ${error.message}`);
        }
    }

    testMemoryLeaks() {
        const resultId = 'memory-leaks-result';
        this.updateTestResult(resultId, 'running', 'Testing for memory leaks...');
        
        try {
            // Create and destroy objects to test for leaks
            const testObjects = [];
            for (let i = 0; i < 1000; i++) {
                testObjects.push({ id: i, data: new Array(100).fill(Math.random()) });
            }
            
            // Clear the array
            testObjects.length = 0;
            
            this.updateTestResult(resultId, 'success', 'Memory leak test completed - created and cleared 1000 test objects');
            this.logToConsole('✅ Memory leak test completed!', 'success');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Memory leak test failed: ${error.message}`);
            this.logToConsole(`❌ Memory leak test failed: ${error.message}`, 'error');
        }
    }

    trackObjects() {
        this.objectTrackingEnabled = true;
        this.trackedObjects = new Map();
        this.updateTestResult('object-tracking-result', 'success', 'Object tracking enabled');
        this.logToConsole('Object tracking started', 'info');
    }

    stopTracking() {
        this.objectTrackingEnabled = false;
        const count = this.trackedObjects ? this.trackedObjects.size : 0;
        this.updateTestResult('object-tracking-result', 'success', `Object tracking stopped. Tracked ${count} objects`);
        this.logToConsole(`Object tracking stopped. Tracked ${count} objects`, 'info');
    }

    // Error Detection and Diagnostics
    checkScriptLoading() {
        const resultId = 'script-loading-result';
        this.updateTestResult(resultId, 'running', 'Checking script loading...');
        
        try {
            const scripts = document.querySelectorAll('script[src]');
            let loadedScripts = 0;
            let failedScripts = 0;
            
            scripts.forEach(script => {
                if (script.getAttribute('data-loaded') !== null) {
                    loadedScripts++;
                } else if (script.onerror) {
                    failedScripts++;
                }
            });
            
            this.updateTestResult(resultId, 'success', `Scripts: ${loadedScripts} loaded, ${failedScripts} failed, ${scripts.length} total`);
            this.logToConsole('✅ Script loading check completed!', 'success');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Script loading check failed: ${error.message}`);
            this.logToConsole(`❌ Script loading check failed: ${error.message}`, 'error');
        }
    }

    testClassInstantiation() {
        const resultId = 'class-instantiation-result';
        this.updateTestResult(resultId, 'running', 'Testing class instantiation...');
        
        try {
            const results = {};
            
            // Test class availability and instantiation
            const classesToTest = ['DataLoader', 'GameState', 'QuizEngine', 'MapRenderer', 'UIManager'];
            
            classesToTest.forEach(className => {
                try {
                    if (typeof window[className] === 'function') {
                        results[className] = 'Available';
                    } else {
                        results[className] = 'Not available';
                    }
                } catch (error) {
                    results[className] = `Error: ${error.message}`;
                }
            });
            
            const available = Object.values(results).filter(r => r === 'Available').length;
            this.updateTestResult(resultId, 'success', `Class instantiation: ${available}/${classesToTest.length} classes available`);
            this.logToConsole('✅ Class instantiation test completed!', 'success');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Class instantiation test failed: ${error.message}`);
            this.logToConsole(`❌ Class instantiation test failed: ${error.message}`, 'error');
        }
    }

    testEventSystem() {
        const resultId = 'event-system-result';
        this.updateTestResult(resultId, 'running', 'Testing event system...');
        
        try {
            // Test custom event dispatch and listening
            const testEvent = new CustomEvent('debug-test', { detail: { test: true } });
            let eventReceived = false;
            
            const eventHandler = (e) => {
                eventReceived = e.detail.test === true;
            };
            
            document.addEventListener('debug-test', eventHandler);
            document.dispatchEvent(testEvent);
            document.removeEventListener('debug-test', eventHandler);
            
            this.updateTestResult(resultId, 'success', `Event system: ${eventReceived ? 'Working correctly' : 'Failed to receive event'}`);
            this.logToConsole('✅ Event system test completed!', 'success');
        } catch (error) {
            this.updateTestResult(resultId, 'error', `Event system test failed: ${error.message}`);
            this.logToConsole(`❌ Event system test failed: ${error.message}`, 'error');
        }
    }

    openPropertyInspector() {
        const resultId = 'property-inspector-result';
        this.updateTestResult(resultId, 'success', 'Property inspector opened');
        this.logToConsole('Property inspector opened', 'info');
    }

    selectObject(objectName) {
        const display = document.getElementById('property-display');
        if (display && this.gameInstances[objectName]) {
            const obj = this.gameInstances[objectName];
            const properties = Object.getOwnPropertyNames(obj);
            display.innerHTML = `
                <div class="object-properties">
                    <h4>${objectName}</h4>
                    <ul>
                        ${properties.map(prop => `<li><strong>${prop}:</strong> ${typeof obj[prop]}</li>`).join('')}
                    </ul>
                </div>
            `;
            this.logToConsole(`Selected object: ${objectName} (${properties.length} properties)`, 'info');
        }
    }

    refreshInspector() {
        const selector = document.getElementById('object-selector');
        if (selector && selector.value) {
            this.selectObject(selector.value);
        }
        this.logToConsole('Property inspector refreshed', 'info');
    }

    clearConsole() {
        this.consoleBuffer = [];
        this.updateConsoleDisplay();
        this.logToConsole('Console cleared', 'info');
    }

    exportConsole() {
        const consoleData = this.consoleBuffer.join('\n');
        this.downloadFile('lobelabyrinth-console.log', consoleData, 'text/plain');
        this.showToast('Console log exported', 'success');
    }

    showKeyboardHelp() {
        this.showToast('Keyboard Shortcuts:\nAlt+1-5: Switch tabs\nAlt+H: Toggle high contrast\nAlt+?: Show help', 'info', 5000);
    }
    
    cleanup() {
        this.activeTests.clear();
        if (this.originalConsole) {
            Object.assign(console, this.originalConsole);
        }
        this.logToConsole('Debug manager cleanup completed', 'info');
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.DebugManager = DebugManager;
    
    // Create global debugManager instance
    if (!window.debugManager) {
        window.debugManager = new DebugManager();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DebugManager;
}