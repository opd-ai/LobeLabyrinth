/**
 * DataLoader - Handles loading and validation of game data from JSON files
 * Part of LobeLabyrinth (Encarta MindMaze Clone)
 */
class DataLoader {
    constructor() {
        this.gameData = {
            rooms: null,
            questions: null,
            achievements: null
        };
        this.loadPromise = null;
    }

    /**
     * Load all game data from JSON files
     * @returns {Promise<Object>} Promise that resolves to loaded game data
     */
    async loadGameData() {
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = this._performLoad();
        return this.loadPromise;
    }

    /**
     * Internal method to perform the actual loading
     * @private
     */
    async _performLoad() {
        try {
            console.log('🔄 Loading game data...');
            
            // Load all JSON files in parallel
            const [roomsResponse, questionsResponse, achievementsResponse] = await Promise.all([
                fetch('./data/rooms.json'),
                fetch('./data/questions.json'),
                fetch('./data/achievements.json')
            ]);

            // Check if all requests were successful
            if (!roomsResponse.ok) {
                throw new Error(`Failed to load rooms.json: ${roomsResponse.status}`);
            }
            if (!questionsResponse.ok) {
                throw new Error(`Failed to load questions.json: ${questionsResponse.status}`);
            }
            if (!achievementsResponse.ok) {
                throw new Error(`Failed to load achievements.json: ${achievementsResponse.status}`);
            }

            // Parse JSON data
            const roomsData = await roomsResponse.json();
            const questionsData = await questionsResponse.json();
            const achievementsData = await achievementsResponse.json();

            // Store parsed data
            this.gameData.rooms = roomsData.rooms;
            this.gameData.questions = questionsData.questions;
            this.gameData.achievements = achievementsData.achievements;

            // Validate data integrity
            this.validateDataIntegrity();

            console.log('✅ Game data loaded successfully!');
            console.log(`📍 Loaded ${this.gameData.rooms.length} rooms`);
            console.log(`❓ Loaded ${this.gameData.questions.length} questions`);
            console.log(`🏆 Loaded ${this.gameData.achievements.length} achievements`);

            return this.gameData;

        } catch (error) {
            console.error('❌ Error loading game data:', error);
            throw new Error(`Failed to load game data: ${error.message}`);
        }
    }

    /**
     * Validate the integrity of loaded data
     * @throws {Error} If data validation fails
     */
    validateDataIntegrity() {
        console.log('🔍 Validating data integrity...');

        // Validate rooms data
        this._validateRooms();
        
        // Validate questions data
        this._validateQuestions();
        
        // Validate achievements data
        this._validateAchievements();

        // Cross-reference validation
        this._validateCrossReferences();

        console.log('✅ Data validation passed!');
    }

    /**
     * Validate rooms data structure
     * @private
     */
    _validateRooms() {
        if (!Array.isArray(this.gameData.rooms)) {
            throw new Error('Rooms data must be an array');
        }

        if (this.gameData.rooms.length === 0) {
            throw new Error('At least one room must be defined');
        }

        const requiredRoomFields = ['id', 'name', 'description', 'connections', 'requiredScore'];
        const roomIds = new Set();
        let hasStartingRoom = false;

        for (const room of this.gameData.rooms) {
            // Check required fields
            for (const field of requiredRoomFields) {
                if (!(field in room)) {
                    throw new Error(`Room missing required field: ${field}`);
                }
            }

            // Check for duplicate IDs
            if (roomIds.has(room.id)) {
                throw new Error(`Duplicate room ID: ${room.id}`);
            }
            roomIds.add(room.id);

            // Check for starting room
            if (room.isStartingRoom) {
                hasStartingRoom = true;
            }

            // Validate connections array
            if (!Array.isArray(room.connections)) {
                throw new Error(`Room ${room.id} connections must be an array`);
            }
        }

        if (!hasStartingRoom) {
            throw new Error('At least one room must be marked as starting room');
        }
    }

    /**
     * Validate questions data structure
     * @private
     */
    _validateQuestions() {
        if (!Array.isArray(this.gameData.questions)) {
            throw new Error('Questions data must be an array');
        }

        if (this.gameData.questions.length === 0) {
            throw new Error('At least one question must be defined');
        }

        const requiredQuestionFields = ['id', 'category', 'question', 'answers', 'correctAnswer', 'points'];
        const questionIds = new Set();

        for (const question of this.gameData.questions) {
            // Check required fields
            for (const field of requiredQuestionFields) {
                if (!(field in question)) {
                    throw new Error(`Question missing required field: ${field}`);
                }
            }

            // Check for duplicate IDs
            if (questionIds.has(question.id)) {
                throw new Error(`Duplicate question ID: ${question.id}`);
            }
            questionIds.add(question.id);

            // Validate answers array
            if (!Array.isArray(question.answers) || question.answers.length < 2) {
                throw new Error(`Question ${question.id} must have at least 2 answers`);
            }

            // Validate correct answer index
            if (question.correctAnswer < 0 || question.correctAnswer >= question.answers.length) {
                throw new Error(`Question ${question.id} has invalid correctAnswer index`);
            }

            // Validate points
            if (typeof question.points !== 'number' || question.points <= 0) {
                throw new Error(`Question ${question.id} must have positive points value`);
            }
        }
    }

    /**
     * Validate achievements data structure
     * @private
     */
    _validateAchievements() {
        if (!Array.isArray(this.gameData.achievements)) {
            throw new Error('Achievements data must be an array');
        }

        const requiredAchievementFields = ['id', 'name', 'description', 'condition'];
        const achievementIds = new Set();

        for (const achievement of this.gameData.achievements) {
            // Check required fields
            for (const field of requiredAchievementFields) {
                if (!(field in achievement)) {
                    throw new Error(`Achievement missing required field: ${field}`);
                }
            }

            // Check for duplicate IDs
            if (achievementIds.has(achievement.id)) {
                throw new Error(`Duplicate achievement ID: ${achievement.id}`);
            }
            achievementIds.add(achievement.id);

            // Validate condition object
            if (!achievement.condition.type) {
                throw new Error(`Achievement ${achievement.id} condition missing type`);
            }
        }
    }

    /**
     * Validate cross-references between data sets
     * @private
     */
    _validateCrossReferences() {
        const roomIds = new Set(this.gameData.rooms.map(room => room.id));

        // Validate room connections reference existing rooms
        for (const room of this.gameData.rooms) {
            for (const connectionId of room.connections) {
                if (!roomIds.has(connectionId)) {
                    throw new Error(`Room ${room.id} references non-existent room: ${connectionId}`);
                }
            }
        }

        // Validate question categories are used by rooms
        const usedCategories = new Set();
        for (const room of this.gameData.rooms) {
            if (room.questionCategories) {
                room.questionCategories.forEach(cat => usedCategories.add(cat));
            }
        }

        const questionCategories = new Set(this.gameData.questions.map(q => q.category));
        for (const category of usedCategories) {
            if (!questionCategories.has(category)) {
                console.warn(`⚠️ Room references unused question category: ${category}`);
            }
        }
    }

    /**
     * Get a specific room by ID
     * @param {string} roomId - The room ID to retrieve
     * @returns {Object|null} The room object or null if not found
     */
    getRoom(roomId) {
        if (!this.gameData.rooms) {
            throw new Error('Game data not loaded. Call loadGameData() first.');
        }

        return this.gameData.rooms.find(room => room.id === roomId) || null;
    }

    /**
     * Get a specific question by ID
     * @param {string} questionId - The question ID to retrieve
     * @returns {Object|null} The question object or null if not found
     */
    getQuestion(questionId) {
        if (!this.gameData.questions) {
            throw new Error('Game data not loaded. Call loadGameData() first.');
        }

        return this.gameData.questions.find(question => question.id === questionId) || null;
    }

    /**
     * Get questions by category
     * @param {string} category - The category to filter by
     * @returns {Array} Array of questions in the specified category
     */
    getQuestionsByCategory(category) {
        if (!this.gameData.questions) {
            throw new Error('Game data not loaded. Call loadGameData() first.');
        }

        return this.gameData.questions.filter(question => question.category === category);
    }

    /**
     * Get a specific achievement by ID
     * @param {string} achievementId - The achievement ID to retrieve
     * @returns {Object|null} The achievement object or null if not found
     */
    getAchievement(achievementId) {
        if (!this.gameData.achievements) {
            throw new Error('Game data not loaded. Call loadGameData() first.');
        }

        return this.gameData.achievements.find(achievement => achievement.id === achievementId) || null;
    }

    /**
     * Get the starting room
     * @returns {Object|null} The starting room object or null if not found
     */
    getStartingRoom() {
        if (!this.gameData.rooms) {
            throw new Error('Game data not loaded. Call loadGameData() first.');
        }

        return this.gameData.rooms.find(room => room.isStartingRoom) || null;
    }

    /**
     * Get all available data (for debugging)
     * @returns {Object} All loaded game data
     */
    getAllData() {
        return this.gameData;
    }
}