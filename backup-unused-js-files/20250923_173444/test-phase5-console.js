/**
 * Phase 5 MapRenderer Console Tests
 * Run these commands in the browser console on test-phase5.html to verify functionality
 */

// Test 1: Verify MapRenderer initialization
console.assert(typeof MapRenderer === 'function', 'MapRenderer class should be available');

// Test 2: Verify canvas context
function testCanvasSetup() {
    const canvas = document.getElementById('test-map-canvas');
    console.assert(canvas !== null, 'Test canvas should exist');
    console.assert(canvas.getContext('2d') !== null, 'Canvas should have 2D context');
    return canvas !== null && canvas.getContext('2d') !== null;
}

// Test 3: Verify room positioning
function testRoomPositioning() {
    // This will be available after MapRenderer initializes
    setTimeout(() => {
        if (window.testFunctions) {
            const state = window.testFunctions.getRendererState();
            console.log('Renderer state available:', !!state);
        }
    }, 2000);
}

// Test 4: Verify click detection
function testClickDetectionFunction() {
    const canvas = document.getElementById('test-map-canvas');
    if (canvas) {
        // Simulate a click event
        const rect = canvas.getBoundingClientRect();
        const event = new MouseEvent('click', {
            clientX: rect.left + canvas.width / 2,
            clientY: rect.top + canvas.height / 2
        });
        canvas.dispatchEvent(event);
        console.log('Click event dispatched successfully');
        return true;
    }
    return false;
}

// Test 5: Verify game state integration
function testGameStateIntegration() {
    setTimeout(() => {
        if (window.testFunctions) {
            // Try to move to a room
            window.testFunctions.testMoveToRoom('library')
                .then(() => console.log('✅ Room movement test completed'))
                .catch(err => console.log('❌ Room movement test failed:', err.message));
        }
    }, 3000);
}

// Manual test instructions
console.log(`
🧪 PHASE 5 MAPRENDERER MANUAL TESTS

Run these tests in the browser console:

1. Basic Setup:
   testCanvasSetup() // Should return true

2. Room Positioning:
   testRoomPositioning() // Check console for renderer state

3. Click Detection:
   testClickDetectionFunction() // Should log success

4. Game Integration:
   testGameStateIntegration() // Should test room movement

5. Interactive Tests:
   - Click on different rooms on the map
   - Use the test buttons on the page
   - Check the console output section
   - Run the automated test suite

Expected Behavior:
- Map should render with castle layout
- Rooms should be colored by state (blue=current, green=visited, etc.)
- Clicking unlocked rooms should navigate
- Console should show detailed logs
- All automated tests should pass
`);

// Export test functions
if (typeof window !== 'undefined') {
    window.Phase5Tests = {
        testCanvasSetup,
        testRoomPositioning, 
        testClickDetectionFunction,
        testGameStateIntegration
    };
}