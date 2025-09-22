/**
 * MapRenderer class handles the visual map display using HTML5 Canvas.
 * Renders rooms, connections, and handles interactive navigation.
 */
class MapRenderer {
    /**
     * Initialize the map renderer
     * @param {HTMLCanvasElement} canvas - The canvas element for rendering
     * @param {GameState} gameState - Game state manager
     * @param {DataLoader} dataLoader - Data access layer
     */
    constructor(canvas, gameState, dataLoader) {
        // Canvas and context setup
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameState = gameState;
        this.dataLoader = dataLoader;

        // Map configuration
        this.mapWidth = 800;
        this.mapHeight = 600;
        this.roomSize = 80;
        this.connectionWidth = 4;
        this.padding = 40;

        // Visual themes and colors
        this.colors = {
            visited: '#48bb78',      // Green for visited rooms
            current: '#3182ce',      // Blue for current room
            accessible: '#ed8936',   // Orange for accessible rooms
            locked: '#a0aec0',       // Gray for locked rooms
            connection: '#cbd5e0',   // Light gray for connections
            background: '#f7fafc',   // Light background
            text: '#2d3748',         // Dark text
            border: '#4a5568'        // Border color
        };

        // Room icons for different types
        this.roomIcons = {
            entrance_hall: '🏰',
            library: '📚',
            armory: '⚔️',
            observatory: '🔭',
            throne_room: '👑',
            secret_chamber: '🗝️'
        };

        // Room layout positions (grid-based)
        this.roomPositions = new Map();
        this.setupRoomPositions();

        // Event listeners
        this.setupEventListeners();

        console.log('MapRenderer initialized with canvas size:', this.mapWidth, 'x', this.mapHeight);
    }

    /**
     * Setup predefined room positions in a castle-like layout
     */
    setupRoomPositions() {
        const centerX = this.mapWidth / 2;
        const centerY = this.mapHeight / 2;
        const spacing = 120;

        // Castle layout:
        //     Observatory
        //         |
        // Library - Entrance - Armory
        //              |
        //         Throne Room
        //              |
        //       Secret Chamber

        this.roomPositions.set('entrance_hall', {
            x: centerX,
            y: centerY
        });

        this.roomPositions.set('library', {
            x: centerX - spacing,
            y: centerY
        });

        this.roomPositions.set('armory', {
            x: centerX + spacing,
            y: centerY
        });

        this.roomPositions.set('observatory', {
            x: centerX,
            y: centerY - spacing
        });

        this.roomPositions.set('throne_room', {
            x: centerX,
            y: centerY + spacing
        });

        this.roomPositions.set('secret_chamber', {
            x: centerX,
            y: centerY + spacing * 2
        });

        console.log('Room positions configured:', this.roomPositions);
    }

    /**
     * Setup event listeners for canvas interactions and game state changes
     */
    setupEventListeners() {
        // Canvas click events for room navigation
        this.canvas.addEventListener('click', (event) => {
            this.handleCanvasClick(event);
        });

        // Canvas hover events for tooltips
        this.canvas.addEventListener('mousemove', (event) => {
            this.handleCanvasHover(event);
        });

        // Game state change events
        this.gameState.on('roomChanged', () => {
            this.render();
        });

        this.gameState.on('scoreChanged', () => {
            this.render();
        });

        // Window resize events for responsive design
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    /**
     * Main render function - draws the complete map
     */
    async render() {
        try {
            console.log('Rendering map...');
            
            // Clear canvas
            this.clearCanvas();

            // Get all room data
            const rooms = await this.dataLoader.getAllRooms();
            
            // Draw connections first (behind rooms)
            await this.renderConnections(rooms);

            // Draw rooms
            await this.renderRooms(rooms);

            // Draw any additional UI elements
            this.renderUI();

            console.log('Map rendering complete');
        } catch (error) {
            console.error('Error rendering map:', error);
            this.renderError(error.message);
        }
    }

    /**
     * Clear the entire canvas
     */
    clearCanvas() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.mapWidth, this.mapHeight);
    }

    /**
     * Render all rooms on the map
     * @param {Array} rooms - Array of room objects
     */
    async renderRooms(rooms) {
        for (const room of rooms) {
            await this.renderRoom(room);
        }
    }

    /**
     * Render a single room
     * @param {Object} room - Room object
     */
    async renderRoom(room) {
        const position = this.roomPositions.get(room.id);
        if (!position) {
            console.warn(`No position defined for room: ${room.id}`);
            return;
        }

        // Determine room state for coloring
        const roomState = this.getRoomState(room.id);
        const color = this.colors[roomState];

        // Draw room rectangle
        this.drawRoomShape(position.x, position.y, color, roomState === 'current');

        // Draw room icon
        this.drawRoomIcon(room, position.x, position.y);

        // Draw room label
        this.drawRoomLabel(room.name, position.x, position.y);
    }

    /**
     * Draw the basic room shape (rectangle with rounded corners)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate  
     * @param {string} color - Fill color
     * @param {boolean} isCurrent - Whether this is the current room
     */
    drawRoomShape(x, y, color, isCurrent = false) {
        const ctx = this.ctx;
        const size = this.roomSize;
        const radius = 8;

        // Calculate room bounds
        const left = x - size / 2;
        const top = y - size / 2;

        // Draw rounded rectangle
        ctx.beginPath();
        ctx.roundRect(left, top, size, size, radius);
        
        // Fill room
        ctx.fillStyle = color;
        ctx.fill();

        // Draw border (thicker for current room)
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = isCurrent ? 3 : 1;
        ctx.stroke();
    }

    /**
     * Draw room icon/emoji
     * @param {Object} room - Room object
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    drawRoomIcon(room, x, y) {
        const icon = this.roomIcons[room.id] || '🏛️';
        
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#2d3748';
        this.ctx.fillText(icon, x, y - 10);
    }

    /**
     * Draw room name label
     * @param {string} name - Room name
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    drawRoomLabel(name, x, y) {
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = this.colors.text;
        this.ctx.fillText(name, x, y + 25);
    }

    /**
     * Render connections between rooms
     * @param {Array} rooms - Array of room objects
     */
    async renderConnections(rooms) {
        for (const room of rooms) {
            await this.renderRoomConnections(room);
        }
    }

    /**
     * Render connections for a specific room
     * @param {Object} room - Room object
     */
    async renderRoomConnections(room) {
        const roomPos = this.roomPositions.get(room.id);
        if (!roomPos) return;

        for (const connectionId of room.connections) {
            const connectionPos = this.roomPositions.get(connectionId);
            if (connectionPos) {
                this.drawConnection(roomPos, connectionPos);
            }
        }
    }

    /**
     * Draw a connection line between two rooms
     * @param {Object} fromPos - Starting position {x, y}
     * @param {Object} toPos - Ending position {x, y}
     */
    drawConnection(fromPos, toPos) {
        this.ctx.beginPath();
        this.ctx.moveTo(fromPos.x, fromPos.y);
        this.ctx.lineTo(toPos.x, toPos.y);
        this.ctx.strokeStyle = this.colors.connection;
        this.ctx.lineWidth = this.connectionWidth;
        this.ctx.stroke();
    }

    /**
     * Get the current state of a room for visual styling
     * @param {string} roomId - Room identifier
     * @returns {string} Room state ('current', 'visited', 'accessible', 'locked')
     */
    getRoomState(roomId) {
        if (roomId === this.gameState.currentRoomId) {
            return 'current';
        } else if (this.gameState.visitedRooms.has(roomId)) {
            return 'visited';
        } else if (this.gameState.unlockedRooms.has(roomId)) {
            return 'accessible';
        } else {
            return 'locked';
        }
    }

    /**
     * Handle canvas click events for room navigation
     * @param {MouseEvent} event - Click event
     */
    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const clickedRoom = this.getRoomAtPosition(x, y);
        if (clickedRoom) {
            console.log('Clicked room:', clickedRoom);
            this.attemptRoomNavigation(clickedRoom);
        }
    }

    /**
     * Handle canvas hover events for tooltips
     * @param {MouseEvent} event - Mouse move event
     */
    handleCanvasHover(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const hoveredRoom = this.getRoomAtPosition(x, y);
        
        // Update cursor style
        this.canvas.style.cursor = hoveredRoom ? 'pointer' : 'default';
        
        // Could add tooltip display here in future
    }

    /**
     * Get room at specific canvas coordinates
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {string|null} Room ID if found, null otherwise
     */
    getRoomAtPosition(x, y) {
        for (const [roomId, position] of this.roomPositions) {
            const distance = Math.sqrt(
                Math.pow(x - position.x, 2) + 
                Math.pow(y - position.y, 2)
            );
            
            if (distance <= this.roomSize / 2) {
                return roomId;
            }
        }
        return null;
    }

    /**
     * Attempt to navigate to a clicked room
     * @param {string} roomId - Target room ID
     */
    async attemptRoomNavigation(roomId) {
        try {
            await this.gameState.moveToRoom(roomId);
            console.log('Successfully moved to room:', roomId);
        } catch (error) {
            console.log('Room navigation failed:', error.message);
            // Could show user feedback here
        }
    }

    /**
     * Handle window resize events
     */
    handleResize() {
        // Update canvas size if needed
        // For now, maintain fixed size
        console.log('Window resized, map renderer handling resize');
    }

    /**
     * Render additional UI elements
     */
    renderUI() {
        // Add any additional UI elements like legends, title, etc.
        this.drawMapTitle();
    }

    /**
     * Draw map title
     */
    drawMapTitle() {
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = this.colors.text;
        this.ctx.fillText('Castle Map', this.mapWidth / 2, 10);
    }

    /**
     * Render error message when map fails to load
     * @param {string} message - Error message
     */
    renderError(message) {
        this.clearCanvas();
        
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#e53e3e';
        this.ctx.fillText(
            `Map Error: ${message}`, 
            this.mapWidth / 2, 
            this.mapHeight / 2
        );
    }

    /**
     * Get current renderer state for debugging
     * @returns {Object} Current state snapshot
     */
    getRendererState() {
        return {
            canvasSize: { width: this.mapWidth, height: this.mapHeight },
            roomPositions: Object.fromEntries(this.roomPositions),
            currentRoom: this.gameState.currentRoomId,
            visitedRooms: Array.from(this.gameState.visitedRooms),
            unlockedRooms: Array.from(this.gameState.unlockedRooms)
        };
    }
}

// Make MapRenderer available globally for debugging
if (typeof window !== 'undefined') {
    window.MapRenderer = MapRenderer;
}