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

        // Canvas double-click events for fast room movement
        this.canvas.addEventListener('dblclick', (event) => {
            this.handleCanvasDoubleClick(event);
        });

        // Canvas hover events for tooltips
        this.canvas.addEventListener('mousemove', (event) => {
            this.handleCanvasHover(event);
        });

        // Keyboard navigation for accessibility
        this.canvas.addEventListener('keydown', (event) => {
            this.handleKeyboardNavigation(event);
        });

        // Make canvas focusable for keyboard navigation
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.setAttribute('role', 'application');
        this.canvas.setAttribute('aria-label', 'Castle map - Use arrow keys to navigate between rooms');

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
            const gameData = this.dataLoader.getAllData();
            const rooms = gameData.rooms;
            
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
     * Handle canvas double-click events for fast room movement
     * @param {MouseEvent} event - Double-click event
     */
    handleCanvasDoubleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const clickedRoom = this.getRoomAtPosition(x, y);
        if (clickedRoom) {
            console.log('Double-clicked room:', clickedRoom);
            
            // For double-click, immediately navigate if accessible
            const roomStatus = this.getRoomStatus(clickedRoom);
            if (roomStatus === 'accessible' || roomStatus === 'visited') {
                // Show loading indicator for fast movement
                this.showFastMovementFeedback(clickedRoom);
                
                // Navigate immediately without confirmation
                this.gameState.moveToRoom(clickedRoom);
                
                // Trigger room entry (including questions if needed)
                if (window.quizEngine) {
                    window.quizEngine.handleRoomEntry(clickedRoom);
                }
            } else {
                // Show feedback that room is not accessible
                this.showInaccessibleRoomFeedback(clickedRoom);
            }
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
     * Show visual feedback for fast movement (double-click)
     * @param {string} roomId - Target room ID
     */
    showFastMovementFeedback(roomId) {
        const position = this.roomPositions.get(roomId);
        if (!position) return;

        // Create a brief flash effect
        const originalColor = this.colors.current;
        
        // Flash effect
        setTimeout(() => {
            this.drawRoom(roomId, position.x, position.y, '#FFD700'); // Gold flash
            setTimeout(() => {
                this.render(); // Return to normal
            }, 150);
        }, 50);
    }

    /**
     * Show feedback for inaccessible rooms
     * @param {string} roomId - Target room ID
     */
    showInaccessibleRoomFeedback(roomId) {
        const position = this.roomPositions.get(roomId);
        if (!position) return;

        // Create a red flash to indicate inaccessible
        setTimeout(() => {
            this.drawRoom(roomId, position.x, position.y, '#E53E3E'); // Red flash
            setTimeout(() => {
                this.render(); // Return to normal
            }, 200);
        }, 50);

        // Show tooltip or message
        if (window.uiManager) {
            window.uiManager.showTooltip('This room is not accessible yet!', 2000);
        }
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

    /**
     * Handle keyboard navigation for accessibility
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyboardNavigation(event) {
        const directions = {
            'ArrowUp': 'north',
            'ArrowDown': 'south',
            'ArrowLeft': 'west',
            'ArrowRight': 'east'
        };

        const direction = directions[event.key];
        if (direction) {
            event.preventDefault();
            this.navigateWithKeyboard(direction);
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.activateCurrentRoom();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            this.canvas.blur();
        }
    }

    /**
     * Navigate map using keyboard direction
     * @param {string} direction - Direction to navigate (north, south, east, west)
     */
    navigateWithKeyboard(direction) {
        const currentRoomId = this.gameState.currentRoomId;
        const currentRoom = this.dataLoader.getRoomById(currentRoomId);
        
        if (!currentRoom) {
            console.warn('No current room for keyboard navigation');
            return;
        }

        // Find accessible room in the given direction
        const targetRoomId = this.findRoomInDirection(currentRoomId, direction);
        
        if (targetRoomId) {
            const targetRoom = this.dataLoader.getRoomById(targetRoomId);
            if (targetRoom && this.gameState.isRoomAccessible(targetRoomId)) {
                // Announce navigation intent
                this.announceRoomNavigation(targetRoom, direction);
                
                // Attempt to navigate
                this.attemptRoomNavigation(targetRoomId);
            } else {
                // Announce that room is not accessible
                this.announceNavigationBlocked(direction);
            }
        } else {
            // No room in that direction
            this.announceNoRoom(direction);
        }
    }

    /**
     * Find room in a specific direction from current room
     * @param {string} fromRoomId - Starting room ID
     * @param {string} direction - Direction to search
     * @returns {string|null} Room ID in that direction or null
     */
    findRoomInDirection(fromRoomId, direction) {
        const currentPos = this.roomPositions.get(fromRoomId);
        if (!currentPos) return null;

        let targetPos = null;
        let minDistance = Infinity;
        let targetRoomId = null;

        // Get direction vector
        const directionVectors = {
            'north': { x: 0, y: -1 },
            'south': { x: 0, y: 1 },
            'west': { x: -1, y: 0 },
            'east': { x: 1, y: 0 }
        };

        const dirVector = directionVectors[direction];
        if (!dirVector) return null;

        // Check all room positions
        for (const [roomId, position] of this.roomPositions.entries()) {
            if (roomId === fromRoomId) continue;

            const deltaX = position.x - currentPos.x;
            const deltaY = position.y - currentPos.y;

            // Check if room is generally in the right direction
            const dotProduct = deltaX * dirVector.x + deltaY * dirVector.y;
            if (dotProduct <= 0) continue; // Room is not in this direction

            // Calculate distance
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Find closest room in this direction
            if (distance < minDistance) {
                minDistance = distance;
                targetRoomId = roomId;
                targetPos = position;
            }
        }

        return targetRoomId;
    }

    /**
     * Activate the current room (Enter/Space)
     */
    activateCurrentRoom() {
        const currentRoomId = this.gameState.currentRoomId;
        if (this.gameState.isRoomAccessible(currentRoomId)) {
            // Trigger room entry if not already there
            this.attemptRoomNavigation(currentRoomId);
        }
    }

    /**
     * Announce room navigation for screen readers
     * @param {Object} targetRoom - Target room data
     * @param {string} direction - Navigation direction
     */
    announceRoomNavigation(targetRoom, direction) {
        const message = `Navigating ${direction} to ${targetRoom.name}`;
        console.log(`♿ Map navigation: ${message}`);
        
        // Emit accessibility event for announcement
        const event = new CustomEvent('accessibility-map-announce', {
            detail: { message, type: 'navigation' }
        });
        document.dispatchEvent(event);
    }

    /**
     * Announce blocked navigation
     * @param {string} direction - Blocked direction
     */
    announceNavigationBlocked(direction) {
        const message = `Cannot move ${direction} - room is locked or inaccessible`;
        console.log(`♿ Map navigation blocked: ${message}`);
        
        const event = new CustomEvent('accessibility-map-announce', {
            detail: { message, type: 'blocked' }
        });
        document.dispatchEvent(event);
    }

    /**
     * Announce no room in direction
     * @param {string} direction - Direction with no room
     */
    announceNoRoom(direction) {
        const message = `No room available to the ${direction}`;
        console.log(`♿ Map navigation: ${message}`);
        
        const event = new CustomEvent('accessibility-map-announce', {
            detail: { message, type: 'no-room' }
        });
        document.dispatchEvent(event);
    }

    /**
     * Add accessibility announcements to the render cycle
     */
    announceMapState() {
        const currentRoom = this.dataLoader.getRoomById(this.gameState.currentRoomId);
        if (!currentRoom) return;

        const accessibleRooms = Array.from(this.gameState.unlockedRooms)
            .filter(roomId => roomId !== this.gameState.currentRoomId)
            .map(roomId => this.dataLoader.getRoomById(roomId))
            .filter(room => room)
            .map(room => room.name);

        const message = `Current location: ${currentRoom.name}. ` +
                       `Accessible rooms: ${accessibleRooms.length > 0 ? accessibleRooms.join(', ') : 'none'}. ` +
                       `Use arrow keys to navigate.`;

        const event = new CustomEvent('accessibility-map-announce', {
            detail: { message, type: 'state' }
        });
        document.dispatchEvent(event);
    }
}

// Make MapRenderer available globally for debugging
if (typeof window !== 'undefined') {
    window.MapRenderer = MapRenderer;
}