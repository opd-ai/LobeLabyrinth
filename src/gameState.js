/**
 * GameState class manages the core game state including player position,
 * score, visited rooms, and save/load functionality
 */
class GameState {
    constructor(dataLoader) {
        this.dataLoader = dataLoader;
        this.currentRoomId = 'entrance';
        this.score = 0;
        this.visitedRooms = new Set(['entrance']);
        this.unlockedRooms = new Set(['entrance']);
        this.answeredQuestions = new Set();
        this.startTime = Date.now();
        this.gameCompleted = false;
        this.playerName = '';
        
        // Event system for state changes
        this.eventListeners = {};
        
        console.log('GameState initialized:', this.getStateSnapshot());
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
            const totalRooms = Object.keys(gameData.rooms).length;
            const totalQuestions = gameData.questions.length;
            
            if (this.visitedRooms.size >= totalRooms * 0.8 && 
                this.answeredQuestions.size >= totalQuestions * 0.7) {
                
                this.gameCompleted = true;
                const finalScore = this.calculateFinalScore();
                
                console.log('Game completed!', { 
                    visitedRooms: this.visitedRooms.size, 
                    answeredQuestions: this.answeredQuestions.size,
                    finalScore
                });
                
                this.emit('gameCompleted', { finalScore, gameState: this.getStateSnapshot() });
            }
        } catch (error) {
            console.error('Error checking game completion:', error);
        }
    }

    /**
     * Calculate final score with bonuses
     */
    calculateFinalScore() {
        const completionBonus = this.gameCompleted ? 500 : 0;
        const explorationBonus = this.visitedRooms.size * 10;
        return this.score + completionBonus + explorationBonus;
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
            
            this.currentRoomId = data.currentRoomId || 'entrance';
            this.score = data.score || 0;
            this.visitedRooms = new Set(data.visitedRooms || ['entrance']);
            this.unlockedRooms = new Set(data.unlockedRooms || ['entrance']);
            this.answeredQuestions = new Set(data.answeredQuestions || []);
            this.startTime = data.startTime || Date.now();
            this.gameCompleted = data.gameCompleted || false;
            this.playerName = data.playerName || '';

            console.log('Game loaded successfully:', this.getStateSnapshot());
            this.emit('gameLoaded', data);
            return true;
        } catch (error) {
            console.error('Failed to load game:', error);
            this.emit('error', { type: 'load', message: error.message });
            return false;
        }
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameState;
}