# LobeLabyrinth - GitHub Copilot Instructions

## Project Overview

LobeLabyrinth is a comprehensive web-based educational game that recreates the classic Encarta MindMaze experience using modern web technologies. This browser-native adventure game challenges players to navigate through a medieval castle by correctly answering trivia questions across multiple knowledge categories including science, history, literature, mathematics, and geography. Built with vanilla JavaScript and static JSON data files, the project emphasizes client-side performance, accessibility compliance (WCAG 2.1 AA), and Progressive Web App capabilities.

The game features a modular architecture with separate concerns for data management, game state, quiz logic, visual rendering, and user interface interactions. Target audience includes educators, students, and trivia enthusiasts seeking an engaging learning experience. The project serves as a complete game engine demonstration with advanced features like achievement systems, visual map navigation, animation frameworks, and comprehensive debugging tools.

## Technical Stack

- **Primary Language**: Vanilla JavaScript (ES6+) with strict adherence to browser-native APIs
- **Frameworks**: No external frameworks - pure client-side implementation using HTML5 Canvas API, Web Storage API, and Service Workers
- **Build Tools**: Static file serving with optional Go server (v1.23.8) for development hosting
- **Testing**: Custom debugging console (`debug.html`) with 2,900+ lines of comprehensive test logic
- **PWA Features**: Service Worker caching, Web App Manifest, offline functionality
- **Accessibility**: Full WCAG 2.1 AA compliance with ARIA attributes, keyboard navigation, and screen reader support

## Code Assistance Guidelines

1. **Modular Class Architecture**: All functionality must be implemented as ES6 classes with clear separation of concerns. Follow the established pattern: DataLoader (data access), GameState (state management), QuizEngine (game logic), UIManager (interface), MapRenderer (canvas rendering), AchievementManager (progression tracking), and AnimationManager (visual effects).

2. **Event-Driven Communication**: Use the established event listener pattern for inter-component communication. Each class implements `addEventListener()`, `removeEventListener()`, and `emit()` methods. Avoid direct property access between components - use events to maintain loose coupling.

3. **Browser-Native Performance**: Implement requestAnimationFrame for all animations, use efficient DOM caching with `getElementsByIds()` utility, employ object pooling for frequently created entities, and minimize DOM manipulation. Target 60fps performance across all browsers.

4. **Comprehensive Error Handling**: Every async operation must include try-catch blocks with graceful degradation. Use console logging with consistent prefixes (🔄 for loading, ✅ for success, ❌ for errors). Implement fallback mechanisms for data loading failures.

5. **Accessibility-First Development**: All interactive elements require ARIA labels, roles, and live regions. Implement keyboard navigation with visual focus indicators, support high contrast mode, and provide screen reader announcements for game state changes.

6. **Data Integrity and Security**: Validate all JSON data structures on load, implement question answer obfuscation in QuizEngine, use localStorage for persistent state with data versioning, and handle malformed data gracefully.

7. **Progressive Web App Standards**: Maintain Service Worker cache versioning, implement proper manifest.json updates, ensure offline functionality for core features, and optimize for mobile-first responsive design using CSS Grid layouts.

## Project Context

- **Domain**: Educational gaming with medieval castle theme, trivia-based progression system, and knowledge assessment across multiple academic categories
- **Architecture**: Client-side MVC pattern with event-driven communication between components. Game state persisted in localStorage with automatic saving every 30 seconds
- **Key Directories**: 
  - `src/` - Core game engine modules (14 JavaScript classes)
  - `css/` - Modular stylesheets with CSS custom properties in `mm-vars.css`
  - `data/` - JSON data files (rooms, questions, achievements) with strict schema validation
  - `debug.html` - Consolidated testing interface replacing multiple test files
- **Configuration**: PWA manifest supports standalone display mode, Service Worker provides offline caching, and Go module structure enables optional server deployment

## Quality Standards

- **Testing Requirements**: Maintain comprehensive test coverage through the consolidated debug interface (`debug.html`) with real-time performance monitoring, automated test execution, and export functionality for results analysis. All new features must include corresponding debug module tests.

- **Code Review Criteria**: Enforce JSDoc documentation for all public methods, consistent error handling patterns, event-driven architecture compliance, and browser compatibility across Chrome, Firefox, Safari, and Edge. Validate accessibility with screen reader testing and keyboard-only navigation.

- **Documentation Standards**: Update README.md for all new features, maintain inline code comments explaining complex algorithms (especially in MapRenderer and QuizEngine), document JSON schema changes, and preserve the phase-based development structure for future enhancements.

- **Performance Benchmarks**: Achieve sub-2 second initial load times, maintain 60fps animation performance, limit memory usage growth during extended gameplay, and ensure smooth operation on mobile devices with touch interaction support.

## Development Patterns

### Class Structure Template
```javascript
class ComponentName {
    constructor(dependencies) {
        // Dependency injection
        this.dependency = dependency;
        
        // Component state
        this.componentState = new Map();
        
        // Event system
        this.eventListeners = {};
        
        // Initialize
        this.initialize();
    }
    
    /**
     * Public API methods with JSDoc
     */
    async initialize() {
        try {
            // Initialization logic with error handling
        } catch (error) {
            console.error('ComponentName initialization failed:', error);
        }
    }
}
```

### Event Communication Pattern
```javascript
// Emit events for state changes
this.emit('gameStateChanged', { 
    room: this.currentRoomId, 
    score: this.score 
});

// Listen for events from other components
gameState.addEventListener('roomChanged', (event) => {
    this.handleRoomChange(event.detail);
});
```

### Canvas Rendering Standards
```javascript
// Use efficient rendering with proper cleanup
render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    
    // Rendering operations
    this.drawRooms();
    this.drawConnections();
    
    this.ctx.restore();
    requestAnimationFrame(() => this.render());
}
```

This instruction set ensures all code contributions maintain the project's high standards for modularity, performance, accessibility, and user experience while preserving the educational gaming focus and medieval castle atmosphere.