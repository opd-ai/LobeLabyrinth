// Simple verification test for LobeLabyrinth fixes
console.log('🧪 Starting LobeLabyrinth verification test...');

async function runVerificationTest() {
    const errors = [];
    const results = [];
    
    try {
        // Test 1: Verify DataLoader exists and works
        console.log('📁 Testing DataLoader...');
        if (typeof DataLoader !== 'undefined') {
            const dataLoader = new DataLoader();
            results.push('✅ DataLoader instantiated successfully');
            
            // Test data loading
            try {
                await dataLoader.loadGameData();
                results.push('✅ Game data loaded successfully');
            } catch (error) {
                errors.push(`❌ Data loading failed: ${error.message}`);
            }
        } else {
            errors.push('❌ DataLoader class not found');
        }
        
        // Test 2: Verify GameState has event system
        console.log('🎮 Testing GameState...');
        if (typeof GameState !== 'undefined') {
            const gameState = new GameState(dataLoader);
            results.push('✅ GameState instantiated successfully');
            
            if (typeof gameState.on === 'function') {
                results.push('✅ GameState has .on() method');
            } else {
                errors.push('❌ GameState missing .on() method');
            }
            
            if (typeof gameState.emit === 'function') {
                results.push('✅ GameState has .emit() method');
            } else {
                errors.push('❌ GameState missing .emit() method');
            }
            
            // Test event registration
            try {
                gameState.on('testEvent', () => {});
                results.push('✅ GameState event listener registered');
            } catch (error) {
                errors.push(`❌ GameState event registration failed: ${error.message}`);
            }
        } else {
            errors.push('❌ GameState class not found');
        }
        
        // Test 3: Verify QuizEngine has event system
        console.log('❓ Testing QuizEngine...');
        if (typeof QuizEngine !== 'undefined') {
            const quizEngine = new QuizEngine(dataLoader, gameState);
            results.push('✅ QuizEngine instantiated successfully');
            
            if (typeof quizEngine.on === 'function') {
                results.push('✅ QuizEngine has .on() method');
            } else {
                errors.push('❌ QuizEngine missing .on() method');
            }
            
            if (typeof quizEngine.emit === 'function') {
                results.push('✅ QuizEngine has .emit() method');
            } else {
                errors.push('❌ QuizEngine missing .emit() method');
            }
            
            // Test event registration
            try {
                quizEngine.on('testEvent', () => {});
                results.push('✅ QuizEngine event listener registered');
            } catch (error) {
                errors.push(`❌ QuizEngine event registration failed: ${error.message}`);
            }
        } else {
            errors.push('❌ QuizEngine class not found');
        }
        
        // Test 4: Test UIManager setup
        console.log('🖥️ Testing UIManager...');
        if (typeof UIManager !== 'undefined') {
            try {
                const uiManager = new UIManager(dataLoader, gameState, quizEngine);
                results.push('✅ UIManager instantiated successfully');
            } catch (error) {
                errors.push(`❌ UIManager instantiation failed: ${error.message}`);
            }
        } else {
            errors.push('❌ UIManager class not found');
        }
        
    } catch (error) {
        errors.push(`❌ Critical test error: ${error.message}`);
    }
    
    // Report results
    console.log('\n📊 Test Results:');
    results.forEach(result => console.log(result));
    
    if (errors.length > 0) {
        console.log('\n❌ Errors found:');
        errors.forEach(error => console.log(error));
        return false;
    } else {
        console.log('\n🎉 All tests passed! LobeLabyrinth fixes are working correctly.');
        return true;
    }
}

// Auto-run test if this script is loaded
if (typeof window !== 'undefined') {
    // Run after a short delay to ensure all scripts are loaded
    setTimeout(() => {
        runVerificationTest().then(success => {
            if (success) {
                document.body.style.backgroundColor = '#d4edd6';
                document.body.innerHTML += '<div style="position:fixed;top:10px;right:10px;background:green;color:white;padding:10px;border-radius:5px;">✅ All Tests Passed</div>';
            } else {
                document.body.style.backgroundColor = '#f8d7da';
                document.body.innerHTML += '<div style="position:fixed;top:10px;right:10px;background:red;color:white;padding:10px;border-radius:5px;">❌ Tests Failed</div>';
            }
        });
    }, 1000);
}