/**
 * UI Component Pool Extension for PerformanceManager
 * Provides specific object pools for common UI components and DOM operations
 */

/**
 * Factory functions for common DOM elements and UI components
 */
const UIFactories = {
    /**
     * Create answer button elements
     */
    answerButton: () => {
        const button = document.createElement('button');
        button.className = 'answer-button';
        button.type = 'button';
        button.setAttribute('tabindex', '0');
        button.setAttribute('role', 'button');
        
        // Add reset method
        button.reset = function() {
            this.textContent = '';
            this.className = 'answer-button';
            this.disabled = false;
            this.onclick = null;
            this.removeAttribute('data-answer-index');
            this.removeAttribute('aria-label');
        };
        
        return button;
    },

    /**
     * Create notification toast elements
     */
    notificationToast: () => {
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
        
        // Create internal structure
        const icon = document.createElement('span');
        icon.className = 'toast-icon';
        
        const content = document.createElement('div');
        content.className = 'toast-content';
        
        const title = document.createElement('div');
        title.className = 'toast-title';
        
        const message = document.createElement('div');
        message.className = 'toast-message';
        
        content.appendChild(title);
        content.appendChild(message);
        toast.appendChild(icon);
        toast.appendChild(content);
        
        // Add reset method
        toast.reset = function() {
            this.className = 'notification-toast';
            this.style.cssText = '';
            icon.textContent = '';
            title.textContent = '';
            message.textContent = '';
            this.removeAttribute('data-type');
        };
        
        return toast;
    },

    /**
     * Create room connection elements
     */
    roomConnection: () => {
        const connection = document.createElement('div');
        connection.className = 'room-connection';
        
        const link = document.createElement('button');
        link.className = 'connection-link';
        link.type = 'button';
        link.setAttribute('tabindex', '0');
        
        connection.appendChild(link);
        
        // Add reset method
        connection.reset = function() {
            this.className = 'room-connection';
            link.textContent = '';
            link.className = 'connection-link';
            link.onclick = null;
            link.removeAttribute('data-room-id');
            link.removeAttribute('aria-label');
        };
        
        return connection;
    },

    /**
     * Create progress bar elements
     */
    progressBar: () => {
        const container = document.createElement('div');
        container.className = 'progress-container';
        
        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        
        const label = document.createElement('span');
        label.className = 'progress-label';
        
        bar.appendChild(fill);
        container.appendChild(bar);
        container.appendChild(label);
        
        // Add reset method
        container.reset = function() {
            this.className = 'progress-container';
            fill.style.width = '0%';
            label.textContent = '';
            this.removeAttribute('data-progress');
        };
        
        return container;
    },

    /**
     * Create timer display elements
     */
    timerDisplay: () => {
        const timer = document.createElement('div');
        timer.className = 'timer-display';
        
        const bar = document.createElement('div');
        bar.className = 'timer-bar';
        
        const fill = document.createElement('div');
        fill.className = 'timer-fill';
        
        const text = document.createElement('span');
        text.className = 'timer-text';
        
        bar.appendChild(fill);
        timer.appendChild(bar);
        timer.appendChild(text);
        
        // Add reset method
        timer.reset = function() {
            this.className = 'timer-display';
            fill.style.width = '100%';
            fill.className = 'timer-fill';
            text.textContent = '';
        };
        
        return timer;
    }
};

/**
 * DOM Update Batch Templates
 * Common DOM update patterns optimized for batching
 */
const DOMUpdateTemplates = {
    /**
     * Update element text content efficiently
     */
    updateText: (element, text) => {
        return () => {
            if (element.textContent !== text) {
                element.textContent = text;
            }
        };
    },

    /**
     * Update element class efficiently
     */
    updateClass: (element, className) => {
        return () => {
            if (element.className !== className) {
                element.className = className;
            }
        };
    },

    /**
     * Update element style properties
     */
    updateStyle: (element, styles) => {
        return () => {
            for (const [property, value] of Object.entries(styles)) {
                if (element.style[property] !== value) {
                    element.style[property] = value;
                }
            }
        };
    },

    /**
     * Update element attributes
     */
    updateAttributes: (element, attributes) => {
        return () => {
            for (const [attr, value] of Object.entries(attributes)) {
                if (element.getAttribute(attr) !== value) {
                    element.setAttribute(attr, value);
                }
            }
        };
    },

    /**
     * Update progress bar value
     */
    updateProgress: (progressElement, percentage, label = '') => {
        return () => {
            const fill = progressElement.querySelector('.progress-fill');
            const labelElement = progressElement.querySelector('.progress-label');
            
            if (fill) {
                fill.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
            }
            if (labelElement && label) {
                labelElement.textContent = label;
            }
            progressElement.setAttribute('data-progress', percentage);
        };
    },

    /**
     * Update timer display
     */
    updateTimer: (timerElement, timeRemaining, totalTime) => {
        return () => {
            const fill = timerElement.querySelector('.timer-fill');
            const text = timerElement.querySelector('.timer-text');
            
            const percentage = (timeRemaining / totalTime) * 100;
            
            if (fill) {
                fill.style.width = `${Math.max(0, percentage)}%`;
                
                // Update color based on time remaining
                if (percentage < 25) {
                    fill.className = 'timer-fill timer-critical';
                } else if (percentage < 50) {
                    fill.className = 'timer-fill timer-warning';
                } else {
                    fill.className = 'timer-fill';
                }
            }
            
            if (text) {
                text.textContent = `${Math.ceil(timeRemaining)}s`;
            }
        };
    }
};

/**
 * Performance optimization utilities for UI operations
 */
const UIOptimizations = {
    /**
     * Create an intersection observer for lazy element loading
     */
    createIntersectionObserver: (callback, options = {}) => {
        const defaultOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };
        
        return new IntersectionObserver(callback, { ...defaultOptions, ...options });
    },

    /**
     * Efficiently manage event listeners with delegation
     */
    setupEventDelegation: (container, eventType, selector, handler) => {
        container.addEventListener(eventType, (event) => {
            const target = event.target.closest(selector);
            if (target) {
                handler(event, target);
            }
        });
    },

    /**
     * Create efficient resize observer for responsive updates
     */
    createResizeObserver: (callback) => {
        if (window.ResizeObserver) {
            return new ResizeObserver(callback);
        }
        
        // Fallback for browsers without ResizeObserver
        let resizeTimeout;
        const fallbackHandler = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(callback, 100);
        };
        
        window.addEventListener('resize', fallbackHandler);
        return {
            observe: () => {},
            unobserve: () => {},
            disconnect: () => window.removeEventListener('resize', fallbackHandler)
        };
    },

    /**
     * Optimize animation frames for smooth performance
     */
    createAnimationLoop: (updateFunction, maxFPS = 60) => {
        let lastTime = 0;
        let animationId = null;
        const frameInterval = 1000 / maxFPS;
        
        const loop = (currentTime) => {
            if (currentTime - lastTime >= frameInterval) {
                updateFunction(currentTime - lastTime);
                lastTime = currentTime;
            }
            animationId = requestAnimationFrame(loop);
        };
        
        return {
            start: () => {
                if (!animationId) {
                    animationId = requestAnimationFrame(loop);
                }
            },
            stop: () => {
                if (animationId) {
                    cancelAnimationFrame(animationId);
                    animationId = null;
                }
            }
        };
    },

    /**
     * Memory-efficient event listener management
     */
    createEventManager: () => {
        const listeners = new Map();
        
        return {
            add: (element, eventType, handler, options = {}) => {
                const key = `${element}:${eventType}`;
                if (!listeners.has(key)) {
                    listeners.set(key, []);
                }
                listeners.get(key).push({ handler, options });
                element.addEventListener(eventType, handler, options);
            },
            
            remove: (element, eventType, handler) => {
                const key = `${element}:${eventType}`;
                const elementListeners = listeners.get(key);
                if (elementListeners) {
                    const index = elementListeners.findIndex(l => l.handler === handler);
                    if (index >= 0) {
                        elementListeners.splice(index, 1);
                        element.removeEventListener(eventType, handler);
                    }
                }
            },
            
            removeAll: (element) => {
                for (const [key, elementListeners] of listeners.entries()) {
                    if (key.startsWith(element.toString())) {
                        elementListeners.forEach(({ handler }) => {
                            const eventType = key.split(':')[1];
                            element.removeEventListener(eventType, handler);
                        });
                        listeners.delete(key);
                    }
                }
            },
            
            clear: () => {
                listeners.clear();
            }
        };
    }
};

// Export for use with PerformanceManager
if (typeof window !== 'undefined') {
    window.UIFactories = UIFactories;
    window.DOMUpdateTemplates = DOMUpdateTemplates;
    window.UIOptimizations = UIOptimizations;
}