const fs = require('fs');

// Get all JavaScript files that are actually used in the game
const jsFiles = [
  'src/dataLoader.js', 'src/gameState.js', 'src/quizEngine.js', 
  'src/uiManager.js', 'src/animationManager.js', 'src/achievementManager.js',
  'src/mapRenderer.js'
];

let functionDefs = [];
let criticalUndefinedRefs = [];

console.log('🔍 Focused Analysis: Critical function references only...\n');

// First pass: collect all function and method definitions
jsFiles.forEach(file => {
  try {
    if (!fs.existsSync(file)) {
      console.log(`❌ File not found: ${file}`);
      return;
    }
    
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, lineNum) => {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || !trimmed) return;
      
      // Find class definitions
      const classMatch = trimmed.match(/^class\s+(\w+)/);
      if (classMatch) {
        functionDefs.push({
          name: classMatch[1],
          file: file,
          line: lineNum + 1,
          type: 'class'
        });
      }
      
      // Find function definitions
      const funcDefMatch = trimmed.match(/^(async\s+)?function\s+(\w+)\s*\(/);
      if (funcDefMatch) {
        functionDefs.push({
          name: funcDefMatch[2],
          file: file,
          line: lineNum + 1,
          type: 'function'
        });
      }
      
      // Find method definitions (including arrow functions)
      const methodDefMatch = trimmed.match(/^\s*(\w+)\s*[=:]?\s*(\([^)]*\)\s*=>|\([^)]*\)\s*{)/);
      if (methodDefMatch && !['if', 'for', 'while', 'switch', 'catch', 'else', 'return'].includes(methodDefMatch[1])) {
        functionDefs.push({
          name: methodDefMatch[1],
          file: file,
          line: lineNum + 1,
          type: 'method'
        });
      }
      
      // Find constructor definitions
      if (trimmed.match(/^\s*constructor\s*\(/)) {
        functionDefs.push({
          name: 'constructor',
          file: file,
          line: lineNum + 1,
          type: 'constructor'
        });
      }
    });
    
  } catch (error) {
    console.log(`⚠️  Could not read ${file}: ${error.message}`);
  }
});

// Second pass: look for critical undefined references based on known issues
jsFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, lineNum) => {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || !trimmed) return;
      
      // Check for known problematic method calls
      const criticalCalls = [
        'exportSaveData',
        'getStateSnapshot', 
        'getGameStatistics',
        'getAllData',
        'getStartingRoom',
        'getQuestion',
        'getRoom',
        'loadGameData'
      ];
      
      criticalCalls.forEach(method => {
        if (line.includes(`${method}(`)) {
          // Extract the object being called
          const match = line.match(new RegExp(`(\\w+)\\.${method}\\(`));
          if (match) {
            const objectName = match[1];
            const knownMethods = {
              'dataLoader': ['getAllData', 'getStartingRoom', 'getQuestion', 'getRoom', 'loadGameData'],
              'gameState': ['exportSaveData', 'getStateSnapshot', 'getGameStatistics', 'on', 'emit'],
              'quizEngine': ['on', 'emit'],
              'this': ['exportSaveData', 'getStateSnapshot', 'getGameStatistics']  // 'this' context methods
            };
            
            if (knownMethods[objectName] && !knownMethods[objectName].includes(method)) {
              criticalUndefinedRefs.push({
                type: 'method',
                name: `${objectName}.${method}`,
                method: method,
                object: objectName,
                file: file,
                line: lineNum + 1,
                context: line.trim(),
                error: `Method '${method}' does not exist on object '${objectName}'`
              });
            } else if (!knownMethods[objectName]) {
              // Check if method is defined anywhere
              const methodDefined = functionDefs.find(def => def.name === method);
              if (!methodDefined) {
                criticalUndefinedRefs.push({
                  type: 'method',
                  name: `${objectName}.${method}`,
                  method: method,
                  object: objectName,
                  file: file,
                  line: lineNum + 1,
                  context: line.trim(),
                  error: `Method '${method}' is not defined anywhere`
                });
              }
            }
          }
        }
      });
      
      // Check for function calls that should exist but might not
      const functionsToCheck = [
        'presentNewQuestion',
        'showHint', 
        'skipQuestion',
        'saveGame',
        'loadGame',
        'resetGame',
        'handleRoomChange',
        'handleQuestionAnswered',
        'handleGameCompleted',
        'displayQuestion',
        'handleAnswerValidated',
        'updateTimer',
        'handleTimeUp'
      ];
      
      functionsToCheck.forEach(func => {
        if (line.includes(`${func}(`)) {
          const functionDefined = functionDefs.find(def => def.name === func);
          if (!functionDefined) {
            criticalUndefinedRefs.push({
              type: 'function',
              name: func,
              file: file,
              line: lineNum + 1,
              context: line.trim(),
              error: `Function '${func}' is not defined`
            });
          }
        }
      });
      
      // Check for variable references that should be defined
      if (line.includes('this.gameState.exportSaveData')) {
        // This is a known problematic call - check if exportSaveData exists in gameState
        const exportSaveDataDefined = functionDefs.find(def => def.name === 'exportSaveData');
        if (!exportSaveDataDefined) {
          criticalUndefinedRefs.push({
            type: 'method',
            name: 'this.gameState.exportSaveData',
            method: 'exportSaveData',
            object: 'gameState',
            file: file,
            line: lineNum + 1,
            context: line.trim(),
            error: `Method 'exportSaveData' is not defined in GameState class`
          });
        }
      }
    });
    
  } catch (error) {
    console.log(`⚠️  Could not read ${file}: ${error.message}`);
  }
});

console.log(`📊 Focused Analysis Summary:`);
console.log(`- Function/Method definitions found: ${functionDefs.length}`);
console.log(`- Critical undefined references found: ${criticalUndefinedRefs.length}\n`);

// Generate focused report
console.log('## Reference Validation Report\n');

if (criticalUndefinedRefs.length === 0) {
  console.log('✅ **SUCCESS**: All critical function and method references are properly defined!\n');
} else {
  console.log('### ❌ UNDEFINED REFERENCES (Will cause runtime errors)\n');
  
  criticalUndefinedRefs.forEach((ref, index) => {
    console.log(`**REFERENCE #${index + 1}: ${ref.name}**`);
    console.log(`Called at: ${ref.file}:${ref.line}`);
    console.log(`Status: ${ref.type.toUpperCase()} NOT DEFINED`);
    console.log(`Error: "Uncaught ${ref.type === 'function' ? 'ReferenceError' : 'TypeError'}: ${ref.error}"`);
    console.log(`Context: \`${ref.context}\``);
    console.log('');
  });
}

console.log('### 📊 DEFINED METHODS BY CLASS\n');

// Group methods by file/class
const methodsByFile = {};
functionDefs.forEach(def => {
  if (!methodsByFile[def.file]) {
    methodsByFile[def.file] = [];
  }
  methodsByFile[def.file].push(def);
});

Object.keys(methodsByFile).forEach(file => {
  console.log(`**${file}:**`);
  const methods = methodsByFile[file];
  const classes = methods.filter(m => m.type === 'class');
  const functions = methods.filter(m => m.type === 'function');
  const classMethods = methods.filter(m => m.type === 'method');
  
  if (classes.length > 0) {
    console.log(`- Classes: ${classes.map(c => c.name).join(', ')}`);
  }
  if (functions.length > 0) {
    console.log(`- Functions: ${functions.map(f => f.name).join(', ')}`);
  }
  if (classMethods.length > 0) {
    console.log(`- Methods: ${classMethods.map(m => m.name).join(', ')}`);
  }
  console.log('');
});

if (criticalUndefinedRefs.length > 0) {
  console.log('### 🚨 CRITICAL FIXES NEEDED\n');
  
  // Group by type of issue
  const methodIssues = criticalUndefinedRefs.filter(ref => ref.type === 'method');
  const functionIssues = criticalUndefinedRefs.filter(ref => ref.type === 'function');
  
  if (methodIssues.length > 0) {
    console.log('#### Missing Methods:');
    methodIssues.forEach((ref, index) => {
      console.log(`${index + 1}. **${ref.method}** method missing from **${ref.object}** object`);
      console.log(`   - Called at: ${ref.file}:${ref.line}`);
      console.log(`   - Context: \`${ref.context}\``);
      console.log('   - Fix: Implement the missing method or verify the method name');
      console.log('');
    });
  }
  
  if (functionIssues.length > 0) {
    console.log('#### Missing Functions:');
    functionIssues.forEach((ref, index) => {
      console.log(`${index + 1}. **${ref.name}** function not defined`);
      console.log(`   - Called at: ${ref.file}:${ref.line}`);
      console.log(`   - Context: \`${ref.context}\``);
      console.log('   - Fix: Implement the missing function or check for typos');
      console.log('');
    });
  }
}

// Check for exportSaveData specifically
const exportSaveDataExists = functionDefs.find(def => def.name === 'exportSaveData');
console.log(`\n🔍 **SPECIFIC CHECK**: exportSaveData method`);
if (exportSaveDataExists) {
  console.log(`✅ exportSaveData is defined in ${exportSaveDataExists.file}:${exportSaveDataExists.line}`);
} else {
  console.log(`❌ exportSaveData is NOT defined anywhere`);
  console.log(`   This will cause "TypeError: this.gameState.exportSaveData is not a function"`);
}

// Save focused results
const results = {
  functionDefs,
  criticalUndefinedRefs,
  summary: {
    totalFunctionDefs: functionDefs.length,
    criticalUndefinedCount: criticalUndefinedRefs.length,
    status: criticalUndefinedRefs.length === 0 ? 'PASS' : 'FAIL',
    exportSaveDataExists: !!exportSaveDataExists
  }
};

fs.writeFileSync('focused-reference-validation.json', JSON.stringify(results, null, 2));
console.log(`\n✅ Focused analysis saved to focused-reference-validation.json`);
console.log(`\n🎯 **VALIDATION STATUS**: ${criticalUndefinedRefs.length === 0 ? '✅ PASS' : '❌ FAIL'} - ${criticalUndefinedRefs.length} critical undefined references found`);