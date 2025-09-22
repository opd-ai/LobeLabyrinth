/**
 * ErrorBoundary class provides comprehensive error handling and recovery options
 * for the LobeLabyrinth game with user-friendly interface and graceful degradation
 */
class ErrorBoundary {
    constructor(gameState = null, uiManager = null) {
        this.gameState = gameState;
        this.uiManager = uiManager;
        this.errorCount = 0;
        this.maxErrors = 5;
        this.errorLog = [];
        this.criticalErrorShown = false;
        
        this.setupGlobalErrorHandler();
        this.injectErrorStyles();
        
        console.log('🛡️ ErrorBoundary initialized - Enhanced error recovery system active');
    }

    /**
     * Setup global error handlers for JavaScript errors and promise rejections
     */
    setupGlobalErrorHandler() {
        // Handle JavaScript runtime errors
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'JavaScript Error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                stack: event.error?.stack
            });
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'Promise Rejection',
                message: event.reason?.message || 'Unhandled promise rejection',
                error: event.reason,
                stack: event.reason?.stack
            });
        });

        // Handle resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleError({
                    type: 'Resource Error',
                    message: `Failed to load ${event.target.tagName}: ${event.target.src || event.target.href}`,
                    target: event.target
                });
            }
        }, true);
    }

    /**
     * Main error handling logic with user-friendly recovery options
     * @param {Object} errorInfo - Error information object
     */
    handleError(errorInfo) {
        this.errorCount++;
        const timestamp = new Date().toISOString();
        
        // Log error for debugging
        const logEntry = {
            timestamp,
            count: this.errorCount,
            ...errorInfo
        };
        
        this.errorLog.push(logEntry);
        console.error(`🚨 Error #${this.errorCount}:`, errorInfo);

        // Auto-save game state if available
        this.attemptAutoSave();

        // Show appropriate recovery interface based on error count
        if (this.errorCount <= this.maxErrors && !this.criticalErrorShown) {
            this.showRecoveryDialog(errorInfo);
        } else if (!this.criticalErrorShown) {
            this.showCriticalErrorScreen();
        }
    }

    /**
     * Attempt to save game state when errors occur
     */
    attemptAutoSave() {
        try {
            if (this.gameState && typeof this.gameState.saveGame === 'function') {
                this.gameState.saveGame();
                console.log('💾 Auto-saved game state due to error');
            }
        } catch (saveError) {
            console.warn('⚠️ Failed to auto-save game state:', saveError);
        }
    }

    /**
     * Show user-friendly error recovery dialog
     * @param {Object} errorInfo - Error information
     */
    showRecoveryDialog(errorInfo) {
        // Don't show multiple dialogs
        if (document.querySelector('.error-recovery-dialog')) {
            return;
        }

        const dialog = document.createElement('div');
        dialog.className = 'error-recovery-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-labelledby', 'error-title');
        dialog.setAttribute('aria-describedby', 'error-description');
        
        const isResourceError = errorInfo.type === 'Resource Error';
        const errorType = isResourceError ? 'loading issue' : 'unexpected problem';
        
        dialog.innerHTML = `
            <div class="error-content">
                <div class="error-header">
                    <span class="error-icon">🛡️</span>
                    <h3 id="error-title">A ${errorType} occurred</h3>
                </div>
                
                <div class="error-body">
                    <p id="error-description">
                        Don't worry! Your progress has been automatically saved. 
                        Choose how you'd like to continue:
                    </p>
                    
                    <div class="error-details" style="display: none;">
                        <strong>Technical details:</strong><br>
                        <code>${this.escapeHtml(errorInfo.message || 'Unknown error')}</code>
                    </div>
                </div>
                
                <div class="error-actions">
                    <button class="error-btn error-btn-primary" onclick="this.handleRefresh()">
                        🔄 Refresh Game
                    </button>
                    <button class="error-btn error-btn-secondary" onclick="this.handleContinue()">
                        ▶️ Continue Playing
                    </button>
                    <button class="error-btn error-btn-secondary" onclick="this.handleSaveExit()">
                        💾 Save & Exit
                    </button>
                    <button class="error-btn error-btn-tertiary" onclick="this.handleToggleDetails()">
                        🔍 Show Details
                    </button>
                </div>
                
                <div class="error-footer">
                    <small>Error #${this.errorCount} of ${this.maxErrors} before critical error mode</small>
                </div>
            </div>
        `;

        // Add event handlers
        this.setupDialogHandlers(dialog);
        
        document.body.appendChild(dialog);
        
        // Focus the dialog for accessibility
        setTimeout(() => {
            const primaryButton = dialog.querySelector('.error-btn-primary');
            if (primaryButton) primaryButton.focus();
        }, 100);
    }

    /**
     * Setup event handlers for error dialog
     * @param {HTMLElement} dialog - Dialog element
     */
    setupDialogHandlers(dialog) {
        const refreshBtn = dialog.querySelector('button[onclick*="handleRefresh"]');
        const continueBtn = dialog.querySelector('button[onclick*="handleContinue"]');
        const saveExitBtn = dialog.querySelector('button[onclick*="handleSaveExit"]');
        const detailsBtn = dialog.querySelector('button[onclick*="handleToggleDetails"]');

        if (refreshBtn) {
            refreshBtn.onclick = () => this.handleRefresh();
        }
        
        if (continueBtn) {
            continueBtn.onclick = () => this.handleContinue(dialog);
        }
        
        if (saveExitBtn) {
            saveExitBtn.onclick = () => this.handleSaveExit();
        }
        
        if (detailsBtn) {
            detailsBtn.onclick = () => this.handleToggleDetails(dialog);
        }

        // Handle Escape key
        dialog.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.handleContinue(dialog);
            }
        });
    }

    /**
     * Handle refresh action
     */
    handleRefresh() {
        try {
            window.location.reload();
        } catch (error) {
            console.error('Failed to refresh:', error);
            alert('Unable to refresh. Please manually refresh your browser.');
        }
    }

    /**
     * Handle continue playing action
     * @param {HTMLElement} dialog - Dialog to remove
     */
    handleContinue(dialog) {
        if (dialog && dialog.parentElement) {
            dialog.remove();
        }
        
        // Announce to screen readers
        if (this.uiManager && this.uiManager.announceToScreenReader) {
            this.uiManager.announceToScreenReader('Continuing game after error recovery');
        }
    }

    /**
     * Handle save and exit action
     */
    handleSaveExit() {
        try {
            if (this.gameState && typeof this.gameState.saveGame === 'function') {
                this.gameState.saveGame();
            }
            
            // Show confirmation
            const confirmDialog = document.createElement('div');
            confirmDialog.className = 'error-recovery-dialog';
            confirmDialog.innerHTML = `
                <div class="error-content">
                    <h3>💾 Game Saved Successfully</h3>
                    <p>Your progress has been saved. You can safely close the browser.</p>
                    <button class="error-btn error-btn-primary" onclick="this.parentElement.parentElement.remove()">
                        ✓ Close
                    </button>
                </div>
            `;
            
            document.body.appendChild(confirmDialog);
            
            // Remove after 3 seconds
            setTimeout(() => {
                if (confirmDialog.parentElement) {
                    confirmDialog.remove();
                }
            }, 3000);
            
        } catch (error) {
            console.error('Failed to save game:', error);
            alert('Save failed. Please try again or manually save using Ctrl+S.');
        }
    }

    /**
     * Toggle error details visibility
     * @param {HTMLElement} dialog - Dialog element
     */
    handleToggleDetails(dialog) {
        const details = dialog.querySelector('.error-details');
        const button = dialog.querySelector('button[onclick*="handleToggleDetails"]');
        
        if (details && button) {
            const isVisible = details.style.display !== 'none';
            details.style.display = isVisible ? 'none' : 'block';
            button.textContent = isVisible ? '🔍 Show Details' : '🔒 Hide Details';
        }
    }

    /**
     * Show critical error screen when too many errors occur
     */
    showCriticalErrorScreen() {
        if (this.criticalErrorShown) return;
        this.criticalErrorShown = true;

        const criticalScreen = document.createElement('div');
        criticalScreen.className = 'critical-error-screen';
        criticalScreen.setAttribute('role', 'dialog');
        criticalScreen.setAttribute('aria-labelledby', 'critical-error-title');
        
        criticalScreen.innerHTML = `
            <div class="critical-error-content">
                <div class="critical-error-header">
                    <span class="critical-error-icon">⚠️</span>
                    <h2 id="critical-error-title">Critical Error Mode</h2>
                </div>
                
                <div class="critical-error-body">
                    <p>Multiple errors have occurred (${this.errorCount}/${this.maxErrors}). 
                    To ensure the best experience, please:</p>
                    
                    <ol>
                        <li>Refresh your browser to restart the game</li>
                        <li>Check your internet connection</li>
                        <li>Clear your browser cache if problems persist</li>
                    </ol>
                    
                    <p><strong>Your game progress has been automatically saved.</strong></p>
                </div>
                
                <div class="critical-error-actions">
                    <button class="error-btn error-btn-primary" onclick="window.location.reload()">
                        🔄 Refresh Browser
                    </button>
                    <button class="error-btn error-btn-secondary" onclick="this.showErrorLog()">
                        📋 View Error Log
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(criticalScreen);
    }

    /**
     * Show error log for debugging
     */
    showErrorLog() {
        const logWindow = window.open('', '_blank', 'width=800,height=600');
        logWindow.document.write(`
            <html>
                <head><title>LobeLabyrinth Error Log</title></head>
                <body style="font-family: monospace; padding: 20px;">
                    <h2>Error Log</h2>
                    <pre>${JSON.stringify(this.errorLog, null, 2)}</pre>
                </body>
            </html>
        `);
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Inject CSS styles for error dialogs
     */
    injectErrorStyles() {
        const styles = `
            .error-recovery-dialog, .critical-error-screen {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(44, 24, 16, 0.95);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                font-family: var(--font-ui, 'Segoe UI', sans-serif);
                backdrop-filter: blur(5px);
            }
            
            .error-content, .critical-error-content {
                background: linear-gradient(135deg, var(--medieval-parchment, #F5E6D3), var(--medieval-parchment-light, #FAF0E6));
                border: 3px solid var(--medieval-gold, #D4AF37);
                border-radius: 15px;
                padding: 30px;
                max-width: 500px;
                margin: 20px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                text-align: center;
                position: relative;
            }
            
            .error-header, .critical-error-header {
                margin-bottom: 20px;
            }
            
            .error-icon, .critical-error-icon {
                font-size: 2.5em;
                display: block;
                margin-bottom: 10px;
            }
            
            .error-content h3, .critical-error-content h2 {
                color: var(--medieval-ink, #2C1810);
                margin: 0;
                font-family: var(--font-heading, 'Cinzel', serif);
            }
            
            .error-body, .critical-error-body {
                margin: 20px 0;
                line-height: 1.6;
                color: var(--medieval-ink, #2C1810);
            }
            
            .error-details {
                background: var(--medieval-parchment-dark, #E8D5B7);
                padding: 15px;
                border-radius: 8px;
                margin: 15px 0;
                text-align: left;
                border-left: 4px solid var(--medieval-crimson, #8B0000);
            }
            
            .error-details code {
                background: rgba(0, 0, 0, 0.1);
                padding: 2px 4px;
                border-radius: 3px;
                font-size: 0.9em;
            }
            
            .error-actions, .critical-error-actions {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 25px;
            }
            
            .error-btn {
                padding: 12px 20px;
                border: 2px solid transparent;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 14px;
                text-decoration: none;
                display: inline-block;
            }
            
            .error-btn-primary {
                background: linear-gradient(135deg, var(--medieval-gold, #D4AF37), var(--medieval-gold-dark, #B8941F));
                color: var(--medieval-ink, #2C1810);
                border-color: var(--medieval-gold-dark, #B8941F);
            }
            
            .error-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(212, 175, 55, 0.3);
            }
            
            .error-btn-secondary {
                background: linear-gradient(135deg, var(--medieval-blue, #4A6FA5), var(--medieval-blue-dark, #3A5A8A));
                color: white;
                border-color: var(--medieval-blue-dark, #3A5A8A);
            }
            
            .error-btn-secondary:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(74, 111, 165, 0.3);
            }
            
            .error-btn-tertiary {
                background: transparent;
                color: var(--medieval-ink, #2C1810);
                border-color: var(--medieval-ink-light, #8B7355);
            }
            
            .error-btn-tertiary:hover {
                background: var(--medieval-parchment-dark, #E8D5B7);
            }
            
            .error-footer {
                margin-top: 20px;
                color: var(--medieval-ink-light, #8B7355);
                font-size: 0.9em;
            }
            
            .critical-error-body ol {
                text-align: left;
                margin: 20px 0;
            }
            
            .critical-error-body li {
                margin: 10px 0;
                padding-left: 5px;
            }
            
            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .error-content, .critical-error-content {
                    margin: 10px;
                    padding: 20px;
                    max-width: none;
                }
                
                .error-actions, .critical-error-actions {
                    gap: 8px;
                }
                
                .error-btn {
                    padding: 10px 16px;
                    font-size: 13px;
                }
            }
            
            /* Respect reduced motion */
            @media (prefers-reduced-motion: reduce) {
                .error-btn:hover {
                    transform: none;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    /**
     * Get error statistics for debugging
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        return {
            totalErrors: this.errorCount,
            errorLog: this.errorLog,
            criticalMode: this.criticalErrorShown,
            maxErrors: this.maxErrors
        };
    }

    /**
     * Reset error boundary state
     */
    reset() {
        this.errorCount = 0;
        this.errorLog = [];
        this.criticalErrorShown = false;
        
        // Remove any existing error dialogs
        document.querySelectorAll('.error-recovery-dialog, .critical-error-screen').forEach(dialog => {
            dialog.remove();
        });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorBoundary;
} else if (typeof window !== 'undefined') {
    window.ErrorBoundary = ErrorBoundary;
}