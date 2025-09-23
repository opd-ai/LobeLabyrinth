const fs = require('fs');

// Manual verification of specific known issues
console.log('🔍 Manual Verification of Known Function References...\n');

const files = [
  'src/dataLoader.js', 
  'src/gameState.js', 
  'src/quizEngine.js', 
  'src/uiManager.js', 
  'src/animationManager.js', 
  'src/achievementManager.js',
  'src/mapRenderer.js'
];

const criticalFunctions = [
  'exportSaveData',
  'presentNewQuestion', 
  'handleRoomChange',
  'loadGameData',
  'getStateSnapshot',
  'getGameStatistics'
];

let allGood = true;
let findings = [];

criticalFunctions.forEach(funcName => {
  console.log(`🔍 Checking for '${funcName}'...`);
  let found = false;
  
  files.forEach(file => {
    try {
      if (!fs.existsSync(file)) return;
      
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        // Look for function definitions with various patterns
        const patterns = [
          `${funcName}\\s*\\([^)]*\\)\\s*{`,
          `async\\s+${funcName}\\s*\\([^)]*\\)\\s*{`,
          `${funcName}\\s*:\\s*function`,
          `${funcName}\\s*=\\s*function`,
          `${funcName}\\s*=\\s*\\([^)]*\\)\\s*=>`
        ];
        
        patterns.forEach(pattern => {
          const regex = new RegExp(pattern);
          if (regex.test(trimmed)) {
            console.log(`  ✅ Found in ${file}:${index + 1} - ${trimmed}`);
            found = true;
            findings.push({
              function: funcName,
              file: file,
              line: index + 1,
              definition: trimmed,
              status: 'FOUND'
            });
          }
        });
      });
      
    } catch (error) {
      console.log(`  ⚠️  Error reading ${file}: ${error.message}`);
    }
  });
  
  if (!found) {
    console.log(`  ❌ NOT FOUND: '${funcName}' is not defined anywhere!`);
    allGood = false;
    findings.push({
      function: funcName,
      file: 'NONE',
      line: 0,
      definition: '',
      status: 'MISSING'
    });
  }
  
  console.log('');
});

// Check for common runtime errors
console.log('🔍 Checking for common runtime error patterns...\n');

const errorPatterns = [
  { pattern: /this\.gameState\.exportSaveData\s*\(/, description: 'exportSaveData call on gameState' },
  { pattern: /this\.presentNewQuestion\s*\(/, description: 'presentNewQuestion call' },
  { pattern: /this\.handleRoomChange\s*\(/, description: 'handleRoomChange call' },
  { pattern: /DataLoader\.loadGameData\s*\(/, description: 'static loadGameData call' },
  { pattern: /\.loadGameData\s*\(/, description: 'instance loadGameData call' }
];

files.forEach(file => {
  try {
    if (!fs.existsSync(file)) return;
    
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      errorPatterns.forEach(({ pattern, description }) => {
        if (pattern.test(line)) {
          console.log(`🔍 Found ${description} in ${file}:${index + 1}`);
          console.log(`   Context: ${line.trim()}`);
          
          // Check if the called function exists
          const funcMatch = line.match(/\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
          if (funcMatch) {
            const calledFunc = funcMatch[1];
            const foundFunc = findings.find(f => f.function === calledFunc && f.status === 'FOUND');
            if (foundFunc) {
              console.log(`   ✅ Function '${calledFunc}' IS defined in ${foundFunc.file}:${foundFunc.line}`);
            } else {
              console.log(`   ❌ Function '${calledFunc}' is NOT defined!`);
              allGood = false;
            }
          }
          console.log('');
        }
      });
    });
    
  } catch (error) {
    console.log(`⚠️  Error reading ${file}: ${error.message}`);
  }
});

console.log(`\\n📊 SUMMARY:`);
console.log(`- Functions checked: ${criticalFunctions.length}`);
console.log(`- Functions found: ${findings.filter(f => f.status === 'FOUND').length}`);
console.log(`- Functions missing: ${findings.filter(f => f.status === 'MISSING').length}`);

console.log(`\\n🎯 **FINAL RESULT**: ${allGood ? '✅ ALL CRITICAL FUNCTIONS FOUND' : '❌ MISSING FUNCTIONS DETECTED'}`);

// Save results
fs.writeFileSync('manual-function-verification.json', JSON.stringify(findings, null, 2));
console.log(`\\n✅ Detailed results saved to manual-function-verification.json`);