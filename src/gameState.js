/**
 * GameState class manages the core game state including player position,
 * score, visited rooms, and save/load functionality
 */
class GameState {
    constructor(dataLoader) {
        this.dataLoader = dataLoader;
        this.currentRoomId = null; // Will be set after data loads
        this.score = 0;
        this.visitedRooms = new Set();
        this.unlockedRooms = new Set();
        this.answeredQuestions = new Set();
        this.startTime = Date.now();
        this.currentRoomStartTime = Date.now(); // Track time in current room
        this.gameCompleted = false;
        this.playerName = '';
        this.isPaused = false;
        this.pausedTime = 0;
        
        // Initialize starting room after construction
        this.initializeStartingRoom();
        
        // Event system for state changes
        this.eventListeners = {};
        
        console.log('GameState initialized:', this.getStateSnapshot());
    }

    /**
     * Initialize the starting room based on data from dataLoader
     */
    initializeStartingRoom() {
        try {
            const startingRoom = this.dataLoader.getStartingRoom();
            if (startingRoom) {
                this.currentRoomId = startingRoom.id;
                this.visitedRooms.add(startingRoom.id);
                this.unlockedRooms.add(startingRoom.id);
                console.log(`Starting room initialized: ${startingRoom.id} (${startingRoom.name})`);
            } else {
                console.error('No starting room found in data!');
                // Fallback to first room if no starting room marked
                const gameData = this.dataLoader.getAllData();
                if (gameData.rooms && gameData.rooms.length > 0) {
                    const firstRoom = gameData.rooms[0];
                    this.currentRoomId = firstRoom.id;
                    this.visitedRooms.add(firstRoom.id);
                    this.unlockedRooms.add(firstRoom.id);
                    console.warn(`Using first room as fallback: ${firstRoom.id}`);
                }
            }
        } catch (error) {
            console.error('Failed to initialize starting room:', error);
        }
    }

    /**
     * Move to a new room if conditions are met
     */
    async moveToRoom(roomId) {
        try {
            console.log(`Attempting to move to room: ${roomId}`);
            
            // Validate room exists
            const targetRoom = await this.dataLoader.getRoom(roomId);
            if (!targetRoom) {
                throw new Error(`Room ${roomId} does not exist`);
            }

            // Check if room is unlocked
            if (!this.unlockedRooms.has(roomId)) {
                throw new Error(`Room ${roomId} is locked. Answer questions to unlock new areas.`);
            }

            const previousRoom = this.currentRoomId;
            this.currentRoomId = roomId;
            this.visitedRooms.add(roomId);
            this.currentRoomStartTime = Date.now(); // Reset room timer

            console.log(`Moved from ${previousRoom} to ${roomId}`);
            this.emit('roomChanged', { from: previousRoom, to: roomId, room: targetRoom });
            
            return targetRoom;
        } catch (error) {
            console.error('Failed to move to room:', error.message);
            this.emit('error', { type: 'movement', message: error.message });
            throw error;
        }
    }

    /**
     * Process a question answer and update game state
     */
    async answerQuestion(questionId, answerIndex) {
        try {
            console.log(`Answering question ${questionId} with answer ${answerIndex}`);
            
            const question = await this.dataLoader.getQuestion(questionId);
            if (!question) {
                throw new Error(`Question ${questionId} not found`);
            }

            if (this.answeredQuestions.has(questionId)) {
                throw new Error('Question already answered');
            }

            const isCorrect = answerIndex === question.correctAnswer;
            const timeBonus = this.calculateTimeBonus();
            let pointsEarned = 0;

            if (isCorrect) {
                pointsEarned = question.points + timeBonus;
                this.score += pointsEarned;
                this.answeredQuestions.add(questionId);
                
                // Emit score changed event
                this.emit('scoreChanged', { 
                    score: this.score, 
                    pointsEarned: pointsEarned,
                    previousScore: this.score - pointsEarned
                });
                
                // Unlock connected rooms based on current room
                await this.unlockConnectedRooms();
                
                console.log(`Correct answer! Points earned: ${pointsEarned} (${question.points} + ${timeBonus} time bonus)`);
            } else {
                console.log('Incorrect answer');
            }

            const result = {
                questionId,
                isCorrect,
                pointsEarned,
                currentScore: this.score,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation || ''
            };

            this.emit('questionAnswered', result);
            
            // Check for game completion
            this.checkGameCompletion();
            
            return result;
        } catch (error) {
            console.error('Failed to answer question:', error.message);
            this.emit('error', { type: 'answer', message: error.message });
            throw error;
        }
    }

    /**
     * Unlock rooms connected to current room after correct answer
     */
    async unlockConnectedRooms() {
        try {
            const currentRoom = await this.dataLoader.getRoom(this.currentRoomId);
            if (currentRoom && currentRoom.connections) {
                currentRoom.connections.forEach(roomId => {
                    if (!this.unlockedRooms.has(roomId)) {
                        this.unlockedRooms.add(roomId);
                        console.log(`Unlocked room: ${roomId}`);
                        this.emit('roomUnlocked', { roomId });
                    }
                });
            }
        } catch (error) {
            console.error('Failed to unlock connected rooms:', error);
        }
    }

    /**
     * Calculate time bonus based on response speed
     */
    calculateTimeBonus() {
        const now = Date.now();
        const timeSinceQuestion = now - (this.questionStartTime || now);
        const maxBonusTime = 10000; // 10 seconds
        const maxBonus = 50;
        
        if (timeSinceQuestion < maxBonusTime) {
            return Math.floor(maxBonus * (1 - timeSinceQuestion / maxBonusTime));
        }
        return 0;
    }

    /**
     * Start timer for current question
     */
    startQuestionTimer() {
        this.questionStartTime = Date.now();
    }

    /**
     * Check if game is completed (all rooms visited and questions answered)
     */
    async checkGameCompletion() {
        try {
            const gameData = await this.dataLoader.loadGameData();
            const totalRooms = gameData.rooms.length;
            const totalQuestions = gameData.questions.length;
            
            const roomsVisitedCount = this.visitedRooms.size;
            const questionsAnsweredCount = this.answeredQuestions.size;
            const roomsPercentage = (roomsVisitedCount / totalRooms) * 100;
            const questionsPercentage = (questionsAnsweredCount / totalQuestions) * 100;
            
            // Calculate accuracy
            const correctAnswers = this.getCorrectAnswersCount();
            const accuracy = questionsAnsweredCount > 0 ? (correctAnswers / questionsAnsweredCount) * 100 : 0;
            
            // Check victory conditions
            const hasVisitedEnoughRooms = roomsPercentage >= 80;
            const hasAnsweredEnoughQuestions = questionsPercentage >= 70;
            const meetsAccuracyRequirement = accuracy >= 70;
            
            if (hasVisitedEnoughRooms && hasAnsweredEnoughQuestions && meetsAccuracyRequirement && !this.gameCompleted) {
                this.gameCompleted = true;
                const finalScore = this.calculateFinalScore();
                const playTime = Date.now() - this.startTime;
                
                const completionData = {
                    finalScore,
                    playTime,
                    roomsVisited: roomsVisitedCount,
                    totalRooms,
                    questionsAnswered: questionsAnsweredCount,
                    totalQuestions,
                    correctAnswers,
                    accuracy,
                    roomsPercentage,
                    questionsPercentage,
                    isPerfectGame: roomsPercentage === 100 && accuracy === 100,
                    isSpeedRun: playTime < 600000, // Under 10 minutes
                    gameState: this.getStateSnapshot()
                };
                
                console.log('🎉 Game completed!', completionData);
                this.emit('gameCompleted', completionData);
                
                return completionData;
            }
            
            return {
                completed: false,
                progress: {
                    roomsVisited: roomsVisitedCount,
                    totalRooms,
                    questionsAnswered: questionsAnsweredCount,
                    totalQuestions,
                    correctAnswers,
                    accuracy,
                    roomsPercentage,
                    questionsPercentage,
                    hasVisitedEnoughRooms,
                    hasAnsweredEnoughQuestions,
                    meetsAccuracyRequirement
                }
            };
        } catch (error) {
            console.error('Error checking game completion:', error);
            return { completed: false, error: error.message };
        }
    }

    /**
     * Get count of correct answers from game statistics
     */
    getCorrectAnswersCount() {
        // This is a simplified calculation
        // In a real implementation, we'd track this more precisely
        return Math.floor(this.score / 100); // Rough estimate based on scoring
    }

    /**
     * Get detailed game statistics for completion screen
     */
    getGameStatistics() {
        const playTime = Date.now() - this.startTime;
        const questionsAnsweredCount = this.answeredQuestions.size;
        const correctAnswers = this.getCorrectAnswersCount();
        const accuracy = questionsAnsweredCount > 0 ? (correctAnswers / questionsAnsweredCount) * 100 : 0;
        
        // Calculate detailed bonuses
        const bonusDetails = this.calculateDetailedBonuses();
        const gameData = this.dataLoader ? this.dataLoader.getAllData() : null;
        const totalRooms = gameData ? gameData.rooms.length : 10;
        const totalQuestions = gameData ? gameData.questions.length : 50;
        
        return {
            // Basic stats
            score: this.score,
            baseScore: this.score,
            finalScore: this.calculateFinalScore(),
            
            // Timing stats
            playTime,
            playTimeFormatted: this.formatTime(playTime),
            averageAnswerTime: questionsAnsweredCount > 0 ? playTime / questionsAnsweredCount : 0,
            averageAnswerTimeFormatted: this.formatTime(questionsAnsweredCount > 0 ? playTime / questionsAnsweredCount : 0),
            
            // Completion stats
            roomsVisited: this.visitedRooms.size,
            roomsTotal: totalRooms,
            roomsExploredPercent: Math.round((this.visitedRooms.size / totalRooms) * 100),
            questionsAnswered: questionsAnsweredCount,
            questionsTotal: totalQuestions,
            questionsAnsweredPercent: Math.round((questionsAnsweredCount / totalQuestions) * 100),
            correctAnswers,
            incorrectAnswers: questionsAnsweredCount - correctAnswers,
            accuracy: Math.round(accuracy * 10) / 10,
            accuracyPercent: Math.round(accuracy),
            
            // Bonus breakdown
            completionBonus: bonusDetails.completionBonus,
            explorationBonus: bonusDetails.explorationBonus,
            perfectBonus: bonusDetails.perfectBonus,
            speedBonus: bonusDetails.speedBonus,
            achievementBonus: bonusDetails.achievementBonus,
            
            // Game state
            gameCompleted: this.gameCompleted,
            
            // Performance grade calculation
            performanceScore: this.calculatePerformanceScore(accuracy, this.visitedRooms.size / totalRooms * 100, questionsAnsweredCount / totalQuestions * 100)
        };
    }

    /**
     * Format time in milliseconds to human readable format
     */
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Calculate detailed bonus breakdown
     * @returns {Object} Detailed bonus calculations
     */
    calculateDetailedBonuses() {
        const questionsAnsweredCount = this.answeredQuestions.size;
        const correctAnswers = this.getCorrectAnswersCount();
        const accuracy = questionsAnsweredCount > 0 ? (correctAnswers / questionsAnsweredCount) * 100 : 0;
        const playTime = Date.now() - this.startTime;
        
        return {
            completionBonus: this.gameCompleted ? 500 : 0,
            explorationBonus: this.visitedRooms.size * 10,
            perfectBonus: accuracy === 100 ? 1000 : 0,
            speedBonus: playTime < 600000 ? 750 : 0, // Under 10 minutes
            achievementBonus: 0 // Will be calculated by achievement manager
        };
    }
    
    /**
     * Calculate final score with bonuses
     */
    calculateFinalScore() {
        const bonuses = this.calculateDetailedBonuses();
        return this.score + bonuses.completionBonus + bonuses.explorationBonus + 
               bonuses.perfectBonus + bonuses.speedBonus + bonuses.achievementBonus;
    }
    
    /**
     * Calculate performance score for grading
     * @param {number} accuracy - Accuracy percentage
     * @param {number} exploration - Exploration percentage
     * @param {number} completion - Question completion percentage
     * @returns {number} Performance score 0-100
     */
    calculatePerformanceScore(accuracy, exploration, completion) {
        return Math.round((accuracy * 0.5) + (exploration * 0.3) + (completion * 0.2));
    }

    /**
     * Get available rooms that can be visited from current location
     */
    async getAvailableRooms() {
        try {
            const currentRoom = await this.dataLoader.getRoom(this.currentRoomId);
            if (!currentRoom || !currentRoom.connections) {
                return [];
            }
            
            return currentRoom.connections.filter(roomId => 
                this.unlockedRooms.has(roomId)
            );
        } catch (error) {
            console.error('Error getting available rooms:', error);
            return [];
        }
    }

    /**
     * Save game state to localStorage
     */
    saveGame() {
        try {
            const saveData = {
                currentRoomId: this.currentRoomId,
                score: this.score,
                visitedRooms: Array.from(this.visitedRooms),
                unlockedRooms: Array.from(this.unlockedRooms),
                answeredQuestions: Array.from(this.answeredQuestions),
                startTime: this.startTime,
                gameCompleted: this.gameCompleted,
                playerName: this.playerName,
                saveTime: Date.now()
            };
            
            localStorage.setItem('lobeLabyrinthSave', JSON.stringify(saveData));
            console.log('Game saved successfully');
            this.emit('gameSaved', saveData);
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            this.emit('error', { type: 'save', message: error.message });
            return false;
        }
    }

    /**
     * Load game state from localStorage
     */
    loadGame() {
        try {
            const saveData = localStorage.getItem('lobeLabyrinthSave');
            if (!saveData) {
                console.log('No saved game found');
                return false;
            }

            const data = JSON.parse(saveData);
            
            // Validate save data structure and integrity
            if (!this.validateSaveData(data)) {
                console.warn('Invalid save data detected, starting new game');
                localStorage.removeItem('lobeLabyrinthSave');
                return false;
            }
            
            // Get the actual starting room as fallback
            const startingRoom = this.dataLoader.getStartingRoom();
            const defaultRoomId = startingRoom ? startingRoom.id : null;
            
            // Sanitize and validate all fields before assignment
            this.currentRoomId = this.sanitizeRoomId(data.currentRoomId) || defaultRoomId;
            this.score = Math.max(0, parseInt(data.score) || 0);
            this.visitedRooms = new Set(this.sanitizeRoomArray(data.visitedRooms, defaultRoomId));
            this.unlockedRooms = new Set(this.sanitizeRoomArray(data.unlockedRooms, defaultRoomId));
            this.answeredQuestions = new Set(this.sanitizeQuestionArray(data.answeredQuestions));
            this.startTime = this.sanitizeTimestamp(data.startTime) || Date.now();
            this.gameCompleted = Boolean(data.gameCompleted);
            this.playerName = this.sanitizePlayerName(data.playerName) || '';

            console.log('Game loaded successfully:', this.getStateSnapshot());
            this.emit('gameLoaded', data);
            return true;
        } catch (error) {
            console.error('Failed to load save game:', error);
            localStorage.removeItem('lobeLabyrinthSave');
            this.emit('error', { type: 'load', message: 'Save data corrupted or invalid' });
            return false;
        }
    }

    /**
     * Validate save data structure and types
     * @param {Object} data - Parsed save data
     * @returns {boolean} - True if data is valid
     */
    validateSaveData(data) {
        // Check if data is an object
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        // Check required fields and types
        if (data.score !== undefined && (typeof data.score !== 'number' || isNaN(data.score))) {
            return false;
        }
        
        if (data.currentRoomId !== undefined && typeof data.currentRoomId !== 'string') {
            return false;
        }
        
        if (data.visitedRooms !== undefined && !Array.isArray(data.visitedRooms)) {
            return false;
        }
        
        if (data.unlockedRooms !== undefined && !Array.isArray(data.unlockedRooms)) {
            return false;
        }
        
        if (data.answeredQuestions !== undefined && !Array.isArray(data.answeredQuestions)) {
            return false;
        }
        
        if (data.startTime !== undefined && (typeof data.startTime !== 'number' || isNaN(data.startTime))) {
            return false;
        }
        
        return true;
    }

    /**
     * Sanitize room ID string
     * @param {any} roomId - Room ID to sanitize
     * @returns {string|null} - Sanitized room ID or null
     */
    sanitizeRoomId(roomId) {
        if (typeof roomId !== 'string' || roomId.length === 0 || roomId.length > 50) {
            return null;
        }
        
        // Only allow alphanumeric characters, underscores, and hyphens
        if (!/^[a-zA-Z0-9_-]+$/.test(roomId)) {
            return null;
        }
        
        return roomId;
    }

    /**
     * Sanitize array of room IDs
     * @param {any} roomArray - Array to sanitize
     * @param {string} defaultRoom - Default room to include
     * @returns {Array} - Sanitized room array
     */
    sanitizeRoomArray(roomArray, defaultRoom) {
        if (!Array.isArray(roomArray)) {
            return defaultRoom ? [defaultRoom] : [];
        }
        
        const sanitized = roomArray
            .filter(room => typeof room === 'string')
            .map(room => this.sanitizeRoomId(room))
            .filter(room => room !== null)
            .slice(0, 20); // Limit array size
            
        // Ensure default room is included if available
        if (defaultRoom && !sanitized.includes(defaultRoom)) {
            sanitized.unshift(defaultRoom);
        }
        
        return sanitized;
    }

    /**
     * Sanitize array of question IDs
     * @param {any} questionArray - Array to sanitize
     * @returns {Array} - Sanitized question array
     */
    sanitizeQuestionArray(questionArray) {
        if (!Array.isArray(questionArray)) {
            return [];
        }
        
        return questionArray
            .filter(q => typeof q === 'string' && q.length > 0 && q.length < 100)
            .filter(q => /^[a-zA-Z0-9_-]+$/.test(q))
            .slice(0, 100); // Limit array size
    }

    /**
     * Sanitize timestamp value
     * @param {any} timestamp - Timestamp to sanitize
     * @returns {number|null} - Sanitized timestamp or null
     */
    sanitizeTimestamp(timestamp) {
        if (typeof timestamp !== 'number' || isNaN(timestamp)) {
            return null;
        }
        
        // Check if timestamp is reasonable (not too far in past/future)
        const now = Date.now();
        const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
        const oneYearFuture = now + (365 * 24 * 60 * 60 * 1000);
        
        if (timestamp < oneYearAgo || timestamp > oneYearFuture) {
            return null;
        }
        
        return timestamp;
    }

    /**
     * Sanitize player name
     * @param {any} playerName - Player name to sanitize
     * @returns {string} - Sanitized player name
     */
    sanitizePlayerName(playerName) {
        if (typeof playerName !== 'string') {
            return '';
        }
        
        // Remove HTML tags and limit length
        return playerName
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .trim()
            .slice(0, 50); // Limit length
    }

    /**
     * Reset game to initial state
     */
    resetGame() {
        this.currentRoomId = 'entrance';
        this.score = 0;
        this.visitedRooms = new Set(['entrance']);
        this.unlockedRooms = new Set(['entrance']);
        this.answeredQuestions = new Set();
        this.startTime = Date.now();
        this.gameCompleted = false;
        this.playerName = '';
        
        // Clear saved game
        localStorage.removeItem('lobeLabyrinthSave');
        
        console.log('Game reset to initial state');
        this.emit('gameReset');
    }

    /**
     * Get current game state snapshot
     */
    getStateSnapshot() {
        return {
            currentRoomId: this.currentRoomId,
            score: this.score,
            visitedRooms: Array.from(this.visitedRooms),
            unlockedRooms: Array.from(this.unlockedRooms),
            answeredQuestions: Array.from(this.answeredQuestions),
            gameCompleted: this.gameCompleted,
            playerName: this.playerName,
            playTime: Date.now() - this.startTime
        };
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
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    /**
     * Get game statistics
     */
    getStatistics() {
        const playTime = Date.now() - this.startTime;
        return {
            score: this.score,
            roomsVisited: this.visitedRooms.size,
            questionsAnswered: this.answeredQuestions.size,
            playTime: Math.floor(playTime / 1000), // in seconds
            gameCompleted: this.gameCompleted
        };
    }

    /**
     * Get time spent in current room (in milliseconds)
     */
    getTimeInCurrentRoom() {
        if (this.isPaused) {
            return this.pausedTime;
        }
        return Date.now() - this.currentRoomStartTime;
    }

    /**
     * Pause the timer
     */
    pauseTimer() {
        if (!this.isPaused) {
            this.isPaused = true;
            this.pausedTime = Date.now() - this.currentRoomStartTime;
        }
    }

    /**
     * Resume the timer
     */
    resumeTimer() {
        if (this.isPaused) {
            this.isPaused = false;
            this.currentRoomStartTime = Date.now() - this.pausedTime;
            this.pausedTime = 0;
        }
    }

    /**
     * Format time duration in readable format
     */
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameState;
}