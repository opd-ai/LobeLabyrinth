/**
 * AnimationManager class handles all visual animations and effects in the game.
 * Uses browser-native APIs like requestAnimationFrame, CSS transitions, and Web Animations API.
 */
class AnimationManager {
    /**
     * Initialize the animation manager
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
        // Animation configuration
        this.defaultDuration = options.defaultDuration || 800;
        this.easing = options.easing || 'ease-out';
        this.reducedMotion = this.checkReducedMotion();
        
        // Animation state tracking
        this.activeAnimations = new Map();
        this.animationCounter = 0;
        
        // Performance monitoring
        this.performanceMetrics = {
            animationsStarted: 0,
            animationsCompleted: 0,
            totalDuration: 0
        };

        console.log('AnimationManager initialized with reduced motion:', this.reducedMotion);
    }

    /**
     * Check if user prefers reduced motion
     * @returns {boolean} True if reduced motion is preferred
     */
    checkReducedMotion() {
        try {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (error) {
            console.warn('Could not check reduced motion preference:', error);
            return false;
        }
    }

    /**
     * Generate unique animation ID
     * @returns {string} Unique animation identifier
     */
    generateAnimationId() {
        return `anim_${++this.animationCounter}_${Date.now()}`;
    }

    /**
     * Animate score increase with smooth counting effect
     * @param {HTMLElement} element - Element displaying the score
     * @param {number} fromValue - Starting score value
     * @param {number} toValue - Target score value
     * @param {number} duration - Animation duration in milliseconds
     * @returns {Promise} Resolves when animation completes
     */
    async animateScoreIncrease(element, fromValue, toValue, duration = 1000) {
        if (!element) {
            throw new Error('Score element is required for animation');
        }

        const animationId = this.generateAnimationId();
        
        try {
            // Skip animation if reduced motion is preferred
            if (this.reducedMotion) {
                element.textContent = toValue.toString();
                return Promise.resolve();
            }

            console.log(`Starting score animation from ${fromValue} to ${toValue}`);
            this.performanceMetrics.animationsStarted++;

            const startTime = performance.now();
            const difference = toValue - fromValue;

            return new Promise((resolve) => {
                const animation = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Use easeOut curve for smooth deceleration
                    const easedProgress = 1 - Math.pow(1 - progress, 3);
                    const currentValue = Math.round(fromValue + (difference * easedProgress));
                    
                    element.textContent = currentValue.toString();
                    
                    // Add visual emphasis
                    if (progress < 0.3) {
                        element.style.transform = `scale(${1 + (progress * 0.2)})`;
                        element.style.color = '#3182ce';
                    } else if (progress > 0.7) {
                        const fadeProgress = (progress - 0.7) / 0.3;
                        element.style.transform = `scale(${1.2 - (fadeProgress * 0.2)})`;
                        element.style.color = '';
                    }
                    
                    if (progress < 1) {
                        const frameId = requestAnimationFrame(animation);
                        this.activeAnimations.set(animationId, frameId);
                    } else {
                        // Animation complete
                        element.style.transform = '';
                        element.style.color = '';
                        this.activeAnimations.delete(animationId);
                        this.performanceMetrics.animationsCompleted++;
                        this.performanceMetrics.totalDuration += elapsed;
                        console.log(`Score animation completed in ${elapsed.toFixed(2)}ms`);
                        resolve();
                    }
                };
                
                requestAnimationFrame(animation);
            });

        } catch (error) {
            console.error('Score animation failed:', error);
            element.textContent = toValue.toString();
            this.activeAnimations.delete(animationId);
            throw error;
        }
    }

    /**
     * Animate answer feedback with color transitions and visual effects
     * @param {boolean} isCorrect - Whether the answer was correct
     * @param {HTMLElement} element - Element to animate
     * @param {Object} options - Animation options
     * @returns {Promise} Resolves when animation completes
     */
    async animateAnswerFeedback(isCorrect, element, options = {}) {
        if (!element) {
            throw new Error('Element is required for answer feedback animation');
        }

        const animationId = this.generateAnimationId();
        const duration = options.duration || 600;
        const colors = {
            correct: { bg: '#c6f6d5', border: '#68d391', text: '#22543d' },
            incorrect: { bg: '#fed7d7', border: '#fc8181', text: '#742a2a' }
        };

        try {
            console.log(`Starting answer feedback animation: ${isCorrect ? 'correct' : 'incorrect'}`);
            this.performanceMetrics.animationsStarted++;

            // Store original styles
            const originalStyles = {
                backgroundColor: element.style.backgroundColor,
                borderColor: element.style.borderColor,
                color: element.style.color,
                transform: element.style.transform,
                transition: element.style.transition
            };

            const targetColors = colors[isCorrect ? 'correct' : 'incorrect'];

            if (this.reducedMotion) {
                // Simple color change for reduced motion
                Object.assign(element.style, {
                    backgroundColor: targetColors.bg,
                    borderColor: targetColors.border,
                    color: targetColors.text
                });
                
                setTimeout(() => {
                    this.restoreStyles(element, originalStyles);
                }, 1000);
                
                return Promise.resolve();
            }

            return new Promise((resolve) => {
                // Phase 1: Quick highlight
                element.style.transition = 'all 0.15s ease-out';
                element.style.transform = 'scale(1.05)';
                element.style.backgroundColor = targetColors.bg;
                element.style.borderColor = targetColors.border;
                element.style.color = targetColors.text;

                setTimeout(() => {
                    // Phase 2: Settle
                    element.style.transition = 'all 0.3s ease-out';
                    element.style.transform = 'scale(1)';
                    
                    setTimeout(() => {
                        // Phase 3: Fade back
                        element.style.transition = 'all 0.4s ease-in-out';
                        this.restoreStyles(element, originalStyles);
                        
                        setTimeout(() => {
                            this.activeAnimations.delete(animationId);
                            this.performanceMetrics.animationsCompleted++;
                            console.log('Answer feedback animation completed');
                            resolve();
                        }, 400);
                        
                    }, 300);
                }, 150);
            });

        } catch (error) {
            console.error('Answer feedback animation failed:', error);
            this.activeAnimations.delete(animationId);
            throw error;
        }
    }

    /**
     * Animate room transition with fade effects
     * @param {HTMLElement} roomElement - Room content element
     * @param {Object} transition - Transition details {from, to, room}
     * @param {Object} options - Animation options
     * @returns {Promise} Resolves when transition completes
     */
    async animateRoomTransition(roomElement, transition, options = {}) {
        if (!roomElement) {
            throw new Error('Room element is required for transition animation');
        }

        const animationId = this.generateAnimationId();
        const duration = options.duration || 500;

        try {
            console.log(`Starting room transition: ${transition.from} → ${transition.to}`);
            this.performanceMetrics.animationsStarted++;

            if (this.reducedMotion) {
                // Simple instant update for reduced motion
                return Promise.resolve();
            }

            return new Promise((resolve) => {
                // Store original styles
                const originalOpacity = roomElement.style.opacity;
                const originalTransition = roomElement.style.transition;

                // Phase 1: Fade out
                roomElement.style.transition = `opacity ${duration/2}ms ease-in-out`;
                roomElement.style.opacity = '0';

                setTimeout(() => {
                    // Phase 2: Update content (handled by caller)
                    // Phase 3: Fade in
                    roomElement.style.opacity = '1';
                    
                    setTimeout(() => {
                        // Restore original styles
                        roomElement.style.opacity = originalOpacity;
                        roomElement.style.transition = originalTransition;
                        
                        this.activeAnimations.delete(animationId);
                        this.performanceMetrics.animationsCompleted++;
                        console.log('Room transition animation completed');
                        resolve();
                    }, duration/2);
                }, duration/2);
            });

        } catch (error) {
            console.error('Room transition animation failed:', error);
            this.activeAnimations.delete(animationId);
            throw error;
        }
    }

    /**
     * Animate achievement unlock notification
     * @param {Object} achievement - Achievement data
     * @param {HTMLElement} container - Container for notification
     * @param {Object} options - Animation options
     * @returns {Promise} Resolves when animation completes
     */
    async animateAchievementUnlock(achievement, container, options = {}) {
        if (!achievement || !container) {
            throw new Error('Achievement and container are required for unlock animation');
        }

        const animationId = this.generateAnimationId();
        const duration = options.duration || 3000;

        try {
            console.log(`Starting achievement unlock animation: ${achievement.name}`);
            this.performanceMetrics.animationsStarted++;

            // Create notification element
            const notification = this.createAchievementNotification(achievement);
            container.appendChild(notification);

            if (this.reducedMotion) {
                // Simple show/hide for reduced motion
                notification.style.opacity = '1';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 2000);
                return Promise.resolve();
            }

            return new Promise((resolve) => {
                // Animation sequence
                setTimeout(() => {
                    notification.style.transform = 'translateY(0) scale(1)';
                    notification.style.opacity = '1';
                }, 50);

                setTimeout(() => {
                    notification.style.transform = 'translateY(0) scale(0.95)';
                }, duration - 500);

                setTimeout(() => {
                    notification.style.opacity = '0';
                    notification.style.transform = 'translateY(-20px) scale(0.8)';
                    
                    setTimeout(() => {
                        if (notification.parentNode) {
                            notification.parentNode.removeChild(notification);
                        }
                        this.activeAnimations.delete(animationId);
                        this.performanceMetrics.animationsCompleted++;
                        console.log('Achievement unlock animation completed');
                        resolve();
                    }, 300);
                }, duration - 200);
            });

        } catch (error) {
            console.error('Achievement unlock animation failed:', error);
            this.activeAnimations.delete(animationId);
            throw error;
        }
    }

    /**
     * Create achievement notification element
     * @param {Object} achievement - Achievement data
     * @returns {HTMLElement} Notification element
     */
    createAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #fef5e7, #fed7aa);
            border: 2px solid #f6ad55;
            border-radius: 8px;
            padding: 15px 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            max-width: 300px;
            opacity: 0;
            transform: translateY(-20px) scale(0.8);
            transition: all 0.3s ease-out;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="font-size: 24px;">${achievement.icon || '🏆'}</div>
                <div>
                    <div style="font-weight: bold; color: #7b341e; margin-bottom: 4px;">
                        Achievement Unlocked!
                    </div>
                    <div style="color: #8b4513; font-size: 14px;">
                        ${achievement.name}
                    </div>
                    <div style="color: #a0522d; font-size: 12px; margin-top: 2px;">
                        +${achievement.points || 0} points
                    </div>
                </div>
            </div>
        `;

        return notification;
    }

    /**
     * Animate loading state with spinner or progress indication
     * @param {HTMLElement} element - Element to show loading state
     * @param {boolean} isLoading - Whether to start or stop loading animation
     * @returns {Promise} Resolves when animation state is set
     */
    async animateLoadingState(element, isLoading) {
        if (!element) {
            throw new Error('Element is required for loading animation');
        }

        try {
            if (isLoading) {
                element.classList.add('loading-state');
                if (!this.reducedMotion) {
                    element.style.opacity = '0.7';
                    element.style.cursor = 'wait';
                }
            } else {
                element.classList.remove('loading-state');
                element.style.opacity = '';
                element.style.cursor = '';
            }

            return Promise.resolve();

        } catch (error) {
            console.error('Loading state animation failed:', error);
            throw error;
        }
    }

    /**
     * Restore original styles to an element
     * @param {HTMLElement} element - Element to restore
     * @param {Object} originalStyles - Original style values
     */
    restoreStyles(element, originalStyles) {
        try {
            Object.keys(originalStyles).forEach(property => {
                element.style[property] = originalStyles[property];
            });
        } catch (error) {
            console.warn('Failed to restore styles:', error);
        }
    }

    /**
     * Cancel a specific animation
     * @param {string} animationId - Animation ID to cancel
     */
    cancelAnimation(animationId) {
        try {
            const frameId = this.activeAnimations.get(animationId);
            if (frameId) {
                cancelAnimationFrame(frameId);
                this.activeAnimations.delete(animationId);
                console.log(`Animation ${animationId} cancelled`);
            }
        } catch (error) {
            console.warn('Failed to cancel animation:', error);
        }
    }

    /**
     * Cancel all active animations
     */
    cancelAllAnimations() {
        try {
            this.activeAnimations.forEach((frameId, animationId) => {
                cancelAnimationFrame(frameId);
            });
            this.activeAnimations.clear();
            console.log('All animations cancelled');
        } catch (error) {
            console.warn('Failed to cancel all animations:', error);
        }
    }

    /**
     * Get animation performance metrics
     * @returns {Object} Performance statistics
     */
    getPerformanceMetrics() {
        const avgDuration = this.performanceMetrics.animationsCompleted > 0 
            ? this.performanceMetrics.totalDuration / this.performanceMetrics.animationsCompleted 
            : 0;

        return {
            ...this.performanceMetrics,
            activeAnimations: this.activeAnimations.size,
            averageDuration: Math.round(avgDuration * 100) / 100,
            reducedMotion: this.reducedMotion
        };
    }

    /**
     * Test animation performance
     * @param {number} iterations - Number of test iterations
     * @returns {Promise} Resolves with performance results
     */
    async testPerformance(iterations = 10) {
        console.log(`Starting animation performance test with ${iterations} iterations`);
        
        const testElement = document.createElement('div');
        testElement.style.cssText = 'position: absolute; top: -100px; left: -100px;';
        document.body.appendChild(testElement);

        const startTime = performance.now();
        
        try {
            for (let i = 0; i < iterations; i++) {
                await this.animateScoreIncrease(testElement, i * 10, (i + 1) * 10, 100);
            }
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            
            const results = {
                iterations,
                totalTime: Math.round(totalTime),
                averageTime: Math.round(totalTime / iterations),
                performance: totalTime < iterations * 200 ? 'Good' : 'Needs optimization'
            };
            
            console.log('Animation performance test results:', results);
            return results;
            
        } finally {
            document.body.removeChild(testElement);
        }
    }
}

// CSS for loading state animation
const animationStyles = `
    .loading-state {
        position: relative;
    }
    
    .loading-state::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .achievement-notification {
        user-select: none;
    }
    
    @media (prefers-reduced-motion: reduce) {
        .loading-state::after {
            animation: none;
            border: 2px solid #667eea;
        }
    }
`;

// Inject styles into document
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = animationStyles;
    document.head.appendChild(styleElement);
}

// Make AnimationManager available globally for debugging
if (typeof window !== 'undefined') {
    window.AnimationManager = AnimationManager;
}

// For module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationManager;
}