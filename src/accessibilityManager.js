/**
 * AccessibilityManager - Comprehensive accessibility support system
 * Provides keyboard navigation, ARIA enhancements, screen reader support,
 * and high contrast mode using only browser-native APIs
 */
class AccessibilityManager {
    constructor() {
        this.isHighContrastMode = false;
        this.focusableElements = [];
        this.currentFocusIndex = -1;
        this.liveRegions = new Map();
        this.keyboardShortcuts = new Map();
        this.navigationMode = 'normal'; // 'normal' | 'spatial' | 'sequential'
        
        // Track screen reader announcements to avoid repetition
        this.lastAnnouncement = '';
        this.announcementHistory = [];
        
        // Accessibility preferences
        this.preferences = {
            reducedMotion: false,
            highContrast: false,
            largeText: false,
            screenReaderMode: false,
            keyboardNavigation: true
        };
        
        console.log('♿ AccessibilityManager initialized');
        this.initialize();
    }

    /**
     * Initialize accessibility features
     */
    initialize() {
        this.loadPreferences();
        this.setupKeyboardNavigation();
        this.enhanceARIA();
        this.createLiveRegions();
        this.setupHighContrastMode();
        this.detectAccessibilityFeatures();
        this.setupFocusManagement();
        
        console.log('♿ Accessibility features initialized');
    }

    /**
     * Load accessibility preferences from localStorage
     */
    loadPreferences() {
        try {
            const saved = localStorage.getItem('accessibility-preferences');
            if (saved) {
                this.preferences = { ...this.preferences, ...JSON.parse(saved) };
                console.log('♿ Loaded accessibility preferences');
            }
            
            // Apply saved preferences
            this.applyPreferences();
        } catch (error) {
            console.warn('⚠️ Could not load accessibility preferences:', error);
        }
    }

    /**
     * Save accessibility preferences to localStorage
     */
    savePreferences() {
        try {
            localStorage.setItem('accessibility-preferences', JSON.stringify(this.preferences));
            console.log('♿ Saved accessibility preferences');
        } catch (error) {
            console.warn('⚠️ Could not save accessibility preferences:', error);
        }
    }

    /**
     * Apply accessibility preferences
     */
    applyPreferences() {
        if (this.preferences.highContrast) {
            this.enableHighContrastMode();
        }
        
        if (this.preferences.reducedMotion) {
            this.enableReducedMotion();
        }
        
        if (this.preferences.largeText) {
            this.enableLargeText();
        }
        
        if (this.preferences.screenReaderMode) {
            this.enableScreenReaderMode();
        }
    }

    /**
     * Detect browser accessibility features and user preferences
     */
    detectAccessibilityFeatures() {
        // Check for reduced motion preference
        if (window.matchMedia) {
            const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.preferences.reducedMotion = reducedMotionQuery.matches;
            
            // Listen for changes
            reducedMotionQuery.addEventListener('change', (e) => {
                this.preferences.reducedMotion = e.matches;
                this.applyPreferences();
                this.announce('Motion preferences updated');
            });
        }

        // Check for high contrast preference
        if (window.matchMedia) {
            const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
            if (highContrastQuery.matches) {
                this.preferences.highContrast = true;
                this.enableHighContrastMode();
            }
        }

        // Detect screen reader usage (heuristic)
        this.detectScreenReader();
        
        console.log('♿ Accessibility features detected:', this.preferences);
    }

    /**
     * Heuristic detection of screen reader usage
     */
    detectScreenReader() {
        // Check for common screen reader indicators
        const indicators = [
            // NVDA, JAWS, ORCA typically set this
            navigator.userAgent.includes('NVDA') || 
            navigator.userAgent.includes('JAWS') ||
            navigator.userAgent.includes('Orca'),
            
            // Check for accessibility APIs
            'speechSynthesis' in window,
            
            // Check for forced colors (Windows high contrast)
            window.matchMedia && window.matchMedia('(forced-colors: active)').matches
        ];
        
        if (indicators.some(indicator => indicator)) {
            this.preferences.screenReaderMode = true;
            this.enableScreenReaderMode();
            console.log('♿ Screen reader detected');
        }
    }

    /**
     * Setup comprehensive keyboard navigation
     */
    setupKeyboardNavigation() {
        // Global keyboard event listener
        document.addEventListener('keydown', (event) => {
            this.handleGlobalKeyPress(event);
        });

        // Define keyboard shortcuts
        this.keyboardShortcuts.set('Alt+1', () => this.focusOnSection('map-area'));
        this.keyboardShortcuts.set('Alt+2', () => this.focusOnSection('room-info'));
        this.keyboardShortcuts.set('Alt+3', () => this.focusOnSection('question-area'));
        this.keyboardShortcuts.set('Alt+4', () => this.focusOnSection('answer-buttons'));
        this.keyboardShortcuts.set('Alt+5', () => this.focusOnSection('game-controls'));
        this.keyboardShortcuts.set('Alt+h', () => this.toggleHighContrastMode());
        this.keyboardShortcuts.set('Alt+?', () => this.showKeyboardHelp());
        this.keyboardShortcuts.set('Alt+s', () => this.skipToMainContent());
        
        // Arrow key navigation for spatial elements
        this.setupSpatialNavigation();
        
        console.log('⌨️ Keyboard navigation setup complete');
    }

    /**
     * Handle global key press events
     */
    handleGlobalKeyPress(event) {
        const key = this.getKeyboardShortcut(event);
        
        // Handle shortcuts
        if (this.keyboardShortcuts.has(key)) {
            event.preventDefault();
            this.keyboardShortcuts.get(key)();
            return;
        }

        // Handle standard navigation keys
        switch (event.key) {
            case 'Tab':
                this.handleTabNavigation(event);
                break;
            case 'Enter':
            case ' ':
                this.handleActivation(event);
                break;
            case 'Escape':
                this.handleEscape(event);
                break;
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                this.handleArrowNavigation(event);
                break;
            case '1':
            case '2':
            case '3':
            case '4':
                // Number keys for answer selection (when appropriate)
                this.handleNumberKeyPress(event);
                break;
        }
    }

    /**
     * Get keyboard shortcut string from event
     */
    getKeyboardShortcut(event) {
        const modifiers = [];
        if (event.ctrlKey) modifiers.push('Ctrl');
        if (event.altKey) modifiers.push('Alt');
        if (event.shiftKey) modifiers.push('Shift');
        
        modifiers.push(event.key);
        return modifiers.join('+');
    }

    /**
     * Setup spatial navigation for map and answers
     */
    setupSpatialNavigation() {
        // Map navigation with arrow keys
        const mapCanvas = document.getElementById('map-canvas');
        if (mapCanvas) {
            mapCanvas.addEventListener('keydown', (event) => {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                    event.preventDefault();
                    this.navigateMapWithKeys(event.key);
                }
            });
        }

        // Answer buttons navigation
        const answerContainer = document.getElementById('answer-buttons');
        if (answerContainer) {
            answerContainer.addEventListener('keydown', (event) => {
                if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
                    event.preventDefault();
                    this.navigateAnswersWithKeys(event.key);
                }
            });
        }
    }

    /**
     * Navigate map using keyboard
     */
    navigateMapWithKeys(direction) {
        // This would integrate with the map renderer
        const directions = {
            'ArrowUp': 'north',
            'ArrowDown': 'south',
            'ArrowLeft': 'west',
            'ArrowRight': 'east'
        };
        
        const mappedDirection = directions[direction];
        this.announce(`Navigating ${mappedDirection} on map`);
        
        // Emit custom event for map navigation
        const event = new CustomEvent('accessibility-map-navigate', {
            detail: { direction: mappedDirection }
        });
        document.dispatchEvent(event);
    }

    /**
     * Navigate answer buttons using keyboard
     */
    navigateAnswersWithKeys(direction) {
        const buttons = document.querySelectorAll('#answer-buttons button:not([disabled])');
        if (buttons.length === 0) return;

        const currentFocus = document.activeElement;
        let currentIndex = Array.from(buttons).indexOf(currentFocus);
        
        if (direction === 'ArrowDown') {
            currentIndex = (currentIndex + 1) % buttons.length;
        } else if (direction === 'ArrowUp') {
            currentIndex = currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1;
        }
        
        buttons[currentIndex].focus();
        this.announce(`Answer option ${currentIndex + 1}: ${buttons[currentIndex].textContent}`);
    }

    /**
     * Handle number key presses for answer selection
     */
    handleNumberKeyPress(event) {
        // Only handle if we're in the question area
        const questionArea = document.getElementById('question-area');
        if (!questionArea || !questionArea.contains(document.activeElement)) {
            return;
        }

        const answerIndex = parseInt(event.key) - 1;
        const buttons = document.querySelectorAll('#answer-buttons button:not([disabled])');
        
        if (buttons[answerIndex]) {
            event.preventDefault();
            buttons[answerIndex].click();
            this.announce(`Selected answer ${event.key}: ${buttons[answerIndex].textContent}`);
        }
    }

    /**
     * Enhance ARIA attributes throughout the application
     */
    enhanceARIA() {
        // Add skip links
        this.addSkipLinks();
        
        // Enhance form controls
        this.enhanceFormControls();
        
        // Add landmark roles where missing
        this.addLandmarkRoles();
        
        // Enhance dynamic content areas
        this.enhanceDynamicContent();
        
        // Add keyboard instructions
        this.addKeyboardInstructions();
        
        console.log('♿ ARIA enhancements applied');
    }

    /**
     * Add skip links for keyboard navigation
     */
    addSkipLinks() {
        const skipLinks = document.createElement('div');
        skipLinks.className = 'skip-links';
        skipLinks.innerHTML = `
            <a href="#main-content" class="skip-link">Skip to main content</a>
            <a href="#map-area" class="skip-link">Skip to map</a>
            <a href="#question-area" class="skip-link">Skip to question</a>
            <a href="#answer-buttons" class="skip-link">Skip to answers</a>
        `;
        
        document.body.insertBefore(skipLinks, document.body.firstChild);
        
        // Add main content landmark
        const gameMain = document.querySelector('.game-main');
        if (gameMain) {
            gameMain.id = 'main-content';
        }
    }

    /**
     * Enhance form controls with better ARIA support
     */
    enhanceFormControls() {
        // Enhance buttons
        const buttons = document.querySelectorAll('button:not([aria-label])');
        buttons.forEach(button => {
            if (!button.getAttribute('aria-label') && button.textContent.trim()) {
                button.setAttribute('aria-label', button.textContent.trim());
            }
        });

        // Enhance interactive elements
        const interactiveElements = document.querySelectorAll('[onclick]:not([role])');
        interactiveElements.forEach(element => {
            if (!element.getAttribute('role')) {
                element.setAttribute('role', 'button');
                element.setAttribute('tabindex', '0');
            }
        });
    }

    /**
     * Add landmark roles for better navigation
     */
    addLandmarkRoles() {
        // Ensure proper heading structure
        const sections = document.querySelectorAll('.section');
        sections.forEach((section, index) => {
            if (!section.getAttribute('role')) {
                section.setAttribute('role', 'region');
            }
            
            // Ensure each section has a proper heading
            const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
            if (heading && !section.getAttribute('aria-labelledby')) {
                if (!heading.id) {
                    heading.id = `section-heading-${index}`;
                }
                section.setAttribute('aria-labelledby', heading.id);
            }
        });
    }

    /**
     * Enhance dynamic content areas
     */
    enhanceDynamicContent() {
        // Enhance score display
        const scoreElement = document.getElementById('current-score');
        if (scoreElement) {
            scoreElement.setAttribute('aria-live', 'polite');
            scoreElement.setAttribute('aria-atomic', 'true');
        }

        // Enhance timer
        const timerElement = document.querySelector('.timer-container');
        if (timerElement) {
            timerElement.setAttribute('aria-live', 'off'); // Prevent constant announcements
            timerElement.setAttribute('aria-atomic', 'true');
        }

        // Enhance room info
        const roomInfo = document.getElementById('room-info');
        if (roomInfo) {
            roomInfo.setAttribute('aria-live', 'polite');
        }
    }

    /**
     * Add keyboard navigation instructions
     */
    addKeyboardInstructions() {
        const instructions = document.createElement('div');
        instructions.className = 'keyboard-instructions sr-only';
        instructions.innerHTML = `
            <h2>Keyboard Navigation</h2>
            <ul>
                <li>Tab: Navigate between elements</li>
                <li>Enter/Space: Activate buttons</li>
                <li>Arrow keys: Navigate map and answers</li>
                <li>Numbers 1-4: Select answers</li>
                <li>Alt+1-5: Jump to sections</li>
                <li>Alt+H: Toggle high contrast</li>
                <li>Alt+?: Show help</li>
                <li>Escape: Cancel/close dialogs</li>
            </ul>
        `;
        
        document.body.appendChild(instructions);
    }

    /**
     * Create live regions for dynamic announcements
     */
    createLiveRegions() {
        // Polite announcements (don't interrupt)
        const politeRegion = document.createElement('div');
        politeRegion.id = 'polite-announcements';
        politeRegion.className = 'sr-only';
        politeRegion.setAttribute('aria-live', 'polite');
        politeRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(politeRegion);
        this.liveRegions.set('polite', politeRegion);

        // Assertive announcements (interrupt current speech)
        const assertiveRegion = document.createElement('div');
        assertiveRegion.id = 'assertive-announcements';
        assertiveRegion.className = 'sr-only';
        assertiveRegion.setAttribute('aria-live', 'assertive');
        assertiveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(assertiveRegion);
        this.liveRegions.set('assertive', assertiveRegion);

        // Status announcements
        const statusRegion = document.createElement('div');
        statusRegion.id = 'status-announcements';
        statusRegion.className = 'sr-only';
        statusRegion.setAttribute('role', 'status');
        statusRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(statusRegion);
        this.liveRegions.set('status', statusRegion);

        console.log('♿ Live regions created');
    }

    /**
     * Make announcements to screen readers
     */
    announce(message, priority = 'polite', delay = 100) {
        if (!message || message === this.lastAnnouncement) return;
        
        this.lastAnnouncement = message;
        this.announcementHistory.push({
            message,
            timestamp: Date.now(),
            priority
        });

        // Keep only last 10 announcements
        if (this.announcementHistory.length > 10) {
            this.announcementHistory.shift();
        }

        setTimeout(() => {
            const region = this.liveRegions.get(priority);
            if (region) {
                region.textContent = message;
                console.log(`♿ Announced (${priority}): ${message}`);
                
                // Clear after a delay to allow re-announcement of same message
                setTimeout(() => {
                    if (region.textContent === message) {
                        region.textContent = '';
                    }
                }, 3000);
            }
        }, delay);
    }

    /**
     * Announce answer result to screen readers
     * @param {boolean} isCorrect - Whether the answer was correct
     * @param {string} explanation - Answer explanation
     */
    announceAnswerResult(isCorrect, explanation) {
        const prefix = isCorrect ? '✅ Correct answer!' : '❌ Incorrect answer.';
        const message = explanation ? `${prefix} ${explanation}` : prefix;
        this.announce(message, 'assertive');
    }

    /**
     * Setup high contrast mode
     */
    setupHighContrastMode() {
        // Create high contrast stylesheet
        const highContrastStyles = document.createElement('style');
        highContrastStyles.id = 'high-contrast-styles';
        highContrastStyles.textContent = `
            .high-contrast {
                /* High contrast color scheme */
                --bg-color: #000000 !important;
                --text-color: #ffffff !important;
                --accent-color: #ffff00 !important;
                --border-color: #ffffff !important;
                --focus-color: #ff0000 !important;
                --visited-color: #00ffff !important;
                --success-color: #00ff00 !important;
                --error-color: #ff0000 !important;
                --warning-color: #ffaa00 !important;
            }
            
            .high-contrast * {
                background-color: var(--bg-color) !important;
                color: var(--text-color) !important;
                border-color: var(--border-color) !important;
            }
            
            .high-contrast a {
                color: var(--accent-color) !important;
                text-decoration: underline !important;
            }
            
            .high-contrast a:visited {
                color: var(--visited-color) !important;
            }
            
            .high-contrast button,
            .high-contrast input,
            .high-contrast select,
            .high-contrast textarea {
                background-color: var(--text-color) !important;
                color: var(--bg-color) !important;
                border: 2px solid var(--border-color) !important;
            }
            
            .high-contrast :focus {
                outline: 3px solid var(--focus-color) !important;
                outline-offset: 2px !important;
            }
            
            .high-contrast .success {
                color: var(--success-color) !important;
            }
            
            .high-contrast .error {
                color: var(--error-color) !important;
            }
            
            .high-contrast .warning {
                color: var(--warning-color) !important;
            }
            
            /* Enhanced focus indicators */
            .high-contrast .answer-button:focus {
                background-color: var(--focus-color) !important;
                color: var(--bg-color) !important;
                box-shadow: 0 0 0 3px var(--accent-color) !important;
            }
            
            /* Screen reader only content becomes visible in high contrast */
            .high-contrast .sr-only:focus {
                position: absolute !important;
                width: auto !important;
                height: auto !important;
                padding: 1em !important;
                background: var(--bg-color) !important;
                color: var(--text-color) !important;
                border: 2px solid var(--accent-color) !important;
                clip: unset !important;
                overflow: visible !important;
                white-space: normal !important;
                z-index: 10000 !important;
            }
        `;
        
        document.head.appendChild(highContrastStyles);
    }

    /**
     * Toggle high contrast mode
     */
    toggleHighContrastMode() {
        this.isHighContrastMode = !this.isHighContrastMode;
        this.preferences.highContrast = this.isHighContrastMode;
        
        if (this.isHighContrastMode) {
            this.enableHighContrastMode();
        } else {
            this.disableHighContrastMode();
        }
        
        this.savePreferences();
    }

    /**
     * Enable high contrast mode
     */
    enableHighContrastMode() {
        document.body.classList.add('high-contrast');
        this.isHighContrastMode = true;
        this.announce('High contrast mode enabled', 'assertive');
        console.log('♿ High contrast mode enabled');
    }

    /**
     * Disable high contrast mode
     */
    disableHighContrastMode() {
        document.body.classList.remove('high-contrast');
        this.isHighContrastMode = false;
        this.announce('High contrast mode disabled', 'assertive');
        console.log('♿ High contrast mode disabled');
    }

    /**
     * Enable reduced motion mode
     */
    enableReducedMotion() {
        document.body.classList.add('reduced-motion');
        this.preferences.reducedMotion = true;
        console.log('♿ Reduced motion mode enabled');
    }

    /**
     * Enable large text mode
     */
    enableLargeText() {
        document.body.classList.add('large-text');
        this.preferences.largeText = true;
        console.log('♿ Large text mode enabled');
    }

    /**
     * Enable screen reader mode optimizations
     */
    enableScreenReaderMode() {
        document.body.classList.add('screen-reader-mode');
        this.preferences.screenReaderMode = true;
        
        // Add additional screen reader optimizations
        this.optimizeForScreenReaders();
        console.log('♿ Screen reader mode enabled');
    }

    /**
     * Optimize interface for screen readers
     */
    optimizeForScreenReaders() {
        // Add more descriptive labels
        const elements = document.querySelectorAll('button, input, select, textarea');
        elements.forEach(element => {
            if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
                const label = this.generateAccessibleLabel(element);
                if (label) {
                    element.setAttribute('aria-label', label);
                }
            }
        });

        // Enhance table headers
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            const headers = table.querySelectorAll('th');
            headers.forEach((header, index) => {
                if (!header.id) {
                    header.id = `table-header-${index}`;
                }
            });
        });
    }

    /**
     * Generate accessible label for an element
     */
    generateAccessibleLabel(element) {
        // Try to find associated label
        const id = element.id;
        if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) return label.textContent.trim();
        }

        // Use surrounding text context
        const parent = element.parentElement;
        if (parent) {
            const textNodes = this.getTextContent(parent);
            if (textNodes.length > 0) {
                return textNodes[0].substring(0, 50);
            }
        }

        // Use element attributes
        if (element.title) return element.title;
        if (element.placeholder) return `Input: ${element.placeholder}`;
        if (element.textContent && element.textContent.trim()) {
            return element.textContent.trim();
        }

        return null;
    }

    /**
     * Get meaningful text content from an element
     */
    getTextContent(element) {
        const texts = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        while (node = walker.nextNode()) {
            const text = node.textContent.trim();
            if (text && text.length > 3) {
                texts.push(text);
            }
        }

        return texts;
    }

    /**
     * Setup focus management
     */
    setupFocusManagement() {
        // Track focus changes
        document.addEventListener('focusin', (event) => {
            this.handleFocusChange(event);
        });

        // Manage focus trapping in modals
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                this.handleFocusTrapping(event);
            }
        });
    }

    /**
     * Handle focus changes for accessibility announcements
     */
    handleFocusChange(event) {
        const element = event.target;
        
        // Announce focus change for important elements
        if (element.matches('button, input, select, textarea, [role="button"]')) {
            const label = this.getAccessibleName(element);
            if (label) {
                this.announce(`Focused: ${label}`, 'polite', 200);
            }
        }
    }

    /**
     * Get accessible name for an element
     */
    getAccessibleName(element) {
        // Check various sources for accessible name
        if (element.getAttribute('aria-label')) {
            return element.getAttribute('aria-label');
        }
        
        if (element.getAttribute('aria-labelledby')) {
            const labelId = element.getAttribute('aria-labelledby');
            const labelElement = document.getElementById(labelId);
            if (labelElement) {
                return labelElement.textContent.trim();
            }
        }
        
        if (element.textContent && element.textContent.trim()) {
            return element.textContent.trim();
        }
        
        if (element.title) {
            return element.title;
        }
        
        return null;
    }

    /**
     * Focus on a specific section
     */
    focusOnSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            // Find first focusable element in section
            const focusableElement = section.querySelector(
                'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
            ) || section;
            
            focusableElement.focus();
            
            const sectionName = section.querySelector('h1, h2, h3, h4, h5, h6')?.textContent || sectionId;
            this.announce(`Focused on ${sectionName} section`, 'assertive');
        }
    }

    /**
     * Skip to main content
     */
    skipToMainContent() {
        const mainContent = document.getElementById('main-content') || 
                           document.querySelector('main') ||
                           document.querySelector('[role="main"]');
        
        if (mainContent) {
            mainContent.focus();
            this.announce('Skipped to main content', 'assertive');
        }
    }

    /**
     * Show keyboard help
     */
    showKeyboardHelp() {
        const existingHelp = document.getElementById('keyboard-help-modal');
        if (existingHelp) {
            existingHelp.remove();
        }

        const helpModal = document.createElement('div');
        helpModal.id = 'keyboard-help-modal';
        helpModal.className = 'accessibility-modal';
        helpModal.setAttribute('role', 'dialog');
        helpModal.setAttribute('aria-labelledby', 'help-title');
        helpModal.setAttribute('aria-modal', 'true');
        
        helpModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="help-title">Keyboard Navigation Help</h2>
                    <button class="modal-close" aria-label="Close help dialog">×</button>
                </div>
                <div class="modal-body">
                    <h3>Navigation</h3>
                    <ul>
                        <li><kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> - Navigate between elements</li>
                        <li><kbd>Enter</kbd> / <kbd>Space</kbd> - Activate buttons and links</li>
                        <li><kbd>Escape</kbd> - Close dialogs or cancel actions</li>
                        <li><kbd>Arrow Keys</kbd> - Navigate map and answer options</li>
                    </ul>
                    
                    <h3>Quick Actions</h3>
                    <ul>
                        <li><kbd>1-4</kbd> - Select answer options</li>
                        <li><kbd>Alt+1</kbd> - Focus on map</li>
                        <li><kbd>Alt+2</kbd> - Focus on room info</li>
                        <li><kbd>Alt+3</kbd> - Focus on question</li>
                        <li><kbd>Alt+4</kbd> - Focus on answers</li>
                        <li><kbd>Alt+5</kbd> - Focus on controls</li>
                    </ul>
                    
                    <h3>Accessibility</h3>
                    <ul>
                        <li><kbd>Alt+H</kbd> - Toggle high contrast mode</li>
                        <li><kbd>Alt+S</kbd> - Skip to main content</li>
                        <li><kbd>Alt+?</kbd> - Show this help</li>
                    </ul>
                </div>
                <div class="modal-footer">
                    <button class="modal-close-btn">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(helpModal);
        
        // Focus management
        const closeButtons = helpModal.querySelectorAll('.modal-close, .modal-close-btn');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                helpModal.remove();
                this.announce('Help dialog closed', 'assertive');
            });
        });
        
        // Focus on first element
        const firstButton = helpModal.querySelector('button');
        if (firstButton) {
            firstButton.focus();
        }
        
        this.announce('Keyboard help dialog opened', 'assertive');
    }

    /**
     * Update game state announcements
     */
    announceGameState(gameState) {
        if (gameState.roomChanged) {
            this.announce(`Entered ${gameState.currentRoom.name}: ${gameState.currentRoom.description}`, 'polite');
        }
        
        if (gameState.scoreChanged) {
            this.announce(`Score updated: ${gameState.score} points`, 'polite');
        }
        
        if (gameState.questionChanged) {
            this.announce(`New question: ${gameState.question.category}, ${gameState.question.difficulty} difficulty`, 'polite');
        }
    }

    /**
     * Announce answer results
     */
    announceAnswerResult(isCorrect, explanation = '') {
        const result = isCorrect ? 'Correct' : 'Incorrect';
        let message = `${result} answer!`;
        
        if (explanation) {
            message += ` ${explanation}`;
        }
        
        this.announce(message, 'assertive');
    }

    /**
     * Get accessibility status
     */
    getAccessibilityStatus() {
        return {
            preferences: this.preferences,
            highContrastMode: this.isHighContrastMode,
            liveRegionsCount: this.liveRegions.size,
            shortcutsCount: this.keyboardShortcuts.size,
            lastAnnouncement: this.lastAnnouncement,
            announcementHistory: this.announcementHistory.slice(-5)
        };
    }

    /**
     * Cleanup accessibility resources
     */
    cleanup() {
        // Remove event listeners
        // (In real implementation, we'd store references to remove them)
        
        // Clear live regions
        this.liveRegions.forEach(region => {
            if (region.parentNode) {
                region.parentNode.removeChild(region);
            }
        });
        this.liveRegions.clear();
        
        // Remove modal if open
        const modal = document.getElementById('keyboard-help-modal');
        if (modal) {
            modal.remove();
        }
        
        console.log('♿ AccessibilityManager cleanup completed');
    }

    // Additional helper methods for specific accessibility needs...
    
    /**
     * Handle tab navigation trapping in modals
     */
    handleFocusTrapping(event) {
        const modal = document.querySelector('[aria-modal="true"]');
        if (!modal) return;
        
        const focusableElements = modal.querySelectorAll(
            'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
        }
    }

    /**
     * Handle standard tab navigation
     */
    handleTabNavigation(event) {
        // Enhanced tab navigation logic can be added here
        // For now, let browser handle standard tab navigation
    }

    /**
     * Handle activation (Enter/Space) events
     */
    handleActivation(event) {
        const element = event.target;
        
        // Handle custom interactive elements
        if (element.hasAttribute('onclick') && !element.matches('button, input, select, textarea, a')) {
            event.preventDefault();
            element.click();
        }
    }

    /**
     * Handle escape key events
     */
    handleEscape(event) {
        // Close any open modals
        const modal = document.querySelector('[aria-modal="true"]');
        if (modal) {
            event.preventDefault();
            const closeButton = modal.querySelector('.modal-close, .modal-close-btn');
            if (closeButton) {
                closeButton.click();
            }
        }
    }

    /**
     * Handle arrow key navigation for map and UI elements
     */
    handleArrowNavigation(event) {
        const element = event.target;
        const key = event.key;
        
        // Handle map canvas navigation
        if (element.matches('#map-canvas')) {
            event.preventDefault();
            this.handleMapArrowNavigation(key);
            return;
        }
        
        // Handle answer button navigation
        if (element.matches('.answer-btn')) {
            event.preventDefault();
            this.navigateAnswerButtons(key);
            return;
        }
        
        // Handle menu/list navigation
        if (element.matches('[role="menu"], [role="listbox"], .menu-item, .list-item')) {
            event.preventDefault();
            this.navigateMenuItems(key);
            return;
        }
        
        // Default: let browser handle standard navigation
    }

    /**
     * Navigate map with arrow keys
     */
    handleMapArrowNavigation(direction) {
        // Dispatch custom event for map navigation
        const mapNavigationEvent = new CustomEvent('accessibility-map-navigate', {
            detail: { direction: direction.replace('Arrow', '').toLowerCase() }
        });
        document.dispatchEvent(mapNavigationEvent);
        
        // Announce navigation attempt
        this.announce(`Navigating ${direction.replace('Arrow', '').toLowerCase()}`, 'polite');
    }

    /**
     * Navigate between answer buttons with arrow keys
     */
    navigateAnswerButtons(direction) {
        const buttons = Array.from(document.querySelectorAll('.answer-btn:not([disabled])'));
        const currentIndex = buttons.findIndex(btn => btn === document.activeElement);
        
        let nextIndex;
        if (direction === 'ArrowDown' || direction === 'ArrowRight') {
            nextIndex = (currentIndex + 1) % buttons.length;
        } else {
            nextIndex = currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1;
        }
        
        if (buttons[nextIndex]) {
            buttons[nextIndex].focus();
            this.announce(`Answer option ${String.fromCharCode(65 + nextIndex)}`, 'polite');
        }
    }

    /**
     * Navigate menu items with arrow keys
     */
    navigateMenuItems(direction) {
        const menuItems = Array.from(document.querySelectorAll('.menu-item:not([disabled]), .list-item:not([disabled])'));
        const currentIndex = menuItems.findIndex(item => item === document.activeElement);
        
        let nextIndex;
        if (direction === 'ArrowDown') {
            nextIndex = (currentIndex + 1) % menuItems.length;
        } else if (direction === 'ArrowUp') {
            nextIndex = currentIndex <= 0 ? menuItems.length - 1 : currentIndex - 1;
        } else {
            return; // Left/Right not handled for vertical menus
        }
        
        if (menuItems[nextIndex]) {
            menuItems[nextIndex].focus();
        }
    }
}

// Make AccessibilityManager available globally for debugging and integration
if (typeof window !== 'undefined') {
    window.AccessibilityManager = AccessibilityManager;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityManager;
}