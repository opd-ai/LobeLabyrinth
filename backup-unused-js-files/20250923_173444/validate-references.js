const fs = require('fs');

// Get all JavaScript files
const jsFiles = [
  'src/dataLoader.js', 'src/gameState.js', 'src/quizEngine.js', 
  'src/uiManager.js', 'src/animationManager.js', 'src/achievementManager.js',
  'src/mapRenderer.js', 'src/errorBoundary.js', 'src/accessibilityManager.js',
  'src/enhancedDataLoader.js', 'src/enhancedUIManager.js', 'src/learningAnalytics.js',
  'src/performanceManager.js', 'src/performanceMonitoringDashboard.js', 'src/uiOptimizations.js'
];

let functionDefs = [];
let functionCalls = [];
let methodCalls = [];
let undefinedRefs = [];

console.log('🔍 Analyzing JavaScript files for function references...\n');

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
      
      // Find function definitions
      const funcDefMatch = trimmed.match(/^(async\s+)?function\s+(\w+)\s*\(/);
      if (funcDefMatch) {
        functionDefs.push({
          name: funcDefMatch[2],
          file: file,
          line: lineNum + 1,
          signature: trimmed,
          type: 'function'
        });
      }
      
      // Find class method definitions
      const methodDefMatch = trimmed.match(/^\s*(\w+)\s*\([^)]*\)\s*{/);
      if (methodDefMatch && !['if', 'for', 'while', 'switch', 'catch', 'else'].includes(methodDefMatch[1])) {
        functionDefs.push({
          name: methodDefMatch[1],
          file: file,
          line: lineNum + 1,
          signature: trimmed,
          type: 'method'
        });
      }
      
      // Find constructor definitions
      if (trimmed.match(/^\s*constructor\s*\(/)) {
        functionDefs.push({
          name: 'constructor',
          file: file,
          line: lineNum + 1,
          signature: trimmed,
          type: 'constructor'
        });
      }
      
      // Find function calls
      const funcCallMatches = line.match(/(\w+)\s*\(/g);
      if (funcCallMatches) {
        funcCallMatches.forEach(match => {
          const funcName = match.replace(/\s*\(/, '');
          // Skip built-in functions and control structures
          const skipList = ['if', 'for', 'while', 'switch', 'function', 'catch', 'console', 'setTimeout', 'setInterval', 'require', 'Date', 'Math', 'Array', 'Object', 'JSON', 'parseInt', 'parseFloat', 'isNaN', 'localStorage', 'document', 'window', 'requestAnimationFrame', 'cancelAnimationFrame'];
          if (!skipList.includes(funcName)) {
            functionCalls.push({
              name: funcName,
              file: file,
              line: lineNum + 1,
              context: line.trim()
            });
          }
        });
      }
      
      // Find method calls
      const methodCallMatches = line.match(/(\w+)\.(\w+)\s*\(/g);
      if (methodCallMatches) {
        methodCallMatches.forEach(match => {
          const parts = match.match(/(\w+)\.(\w+)\s*\(/);
          if (parts) {
            methodCalls.push({
              object: parts[1],
              method: parts[2],
              file: file,
              line: lineNum + 1,
              context: line.trim()
            });
          }
        });
      }
    });
    
  } catch (error) {
    console.log(`⚠️  Could not read ${file}: ${error.message}`);
  }
});

console.log(`📊 Analysis Summary:`);
console.log(`- Function definitions found: ${functionDefs.length}`);
console.log(`- Function calls found: ${functionCalls.length}`);
console.log(`- Method calls found: ${methodCalls.length}\n`);

// Check for undefined function calls
console.log('🔍 Checking for undefined function references...\n');

functionCalls.forEach(call => {
  const defined = functionDefs.find(def => def.name === call.name);
  if (!defined) {
    undefinedRefs.push({
      type: 'function',
      name: call.name,
      file: call.file,
      line: call.line,
      context: call.context,
      error: `Function '${call.name}' is not defined`
    });
  }
});

// Check critical method calls that are known to fail
const criticalMethodCalls = [
  'exportSaveData',
  'getStateSnapshot', 
  'getGameStatistics',
  'on',
  'emit',
  'addEventListener',
  'removeEventListener'
];

methodCalls.forEach(call => {
  if (criticalMethodCalls.includes(call.method)) {
    // Check if the method exists on known objects
    const knownObjects = {
      'gameState': ['exportSaveData', 'getStateSnapshot', 'getGameStatistics', 'on', 'emit'],
      'quizEngine': ['on', 'emit'],
      'achievementManager': ['addEventListener', 'removeEventListener', 'emit'],
      'dataLoader': ['loadGameData', 'getRoom', 'getQuestion'],
      'uiManager': ['updateDisplay', 'showFeedback'],
      'animationManager': ['animateScoreUpdate', 'animateRoomTransition']
    };
    
    if (knownObjects[call.object] && !knownObjects[call.object].includes(call.method)) {
      undefinedRefs.push({
        type: 'method',
        name: `${call.object}.${call.method}`,
        file: call.file,
        line: call.line,
        context: call.context,
        error: `Method '${call.method}' does not exist on object '${call.object}'`
      });
    }
  }
});

// Generate report
console.log('## Reference Validation Report\n');

if (undefinedRefs.length === 0) {
  console.log('✅ **SUCCESS**: All function and method references are properly defined!\n');
} else {
  console.log('### ❌ UNDEFINED REFERENCES (Will cause runtime errors)\n');
  
  undefinedRefs.forEach((ref, index) => {
    console.log(`**REFERENCE #${index + 1}: ${ref.name}**`);
    console.log(`Called at: ${ref.file}:${ref.line}`);
    console.log(`Status: ${ref.type.toUpperCase()} NOT DEFINED`);
    console.log(`Error: "Uncaught ${ref.type === 'function' ? 'ReferenceError' : 'TypeError'}: ${ref.error}"`);
    console.log(`Context: \`${ref.context}\``);
    console.log('');
  });
}

console.log('### 📊 FUNCTION REFERENCE MAP\n');
console.log('| Function/Method | Called From | Defined In | Status |');
console.log('|----------------|-------------|------------|---------|');

// Sample of function calls with their status
functionCalls.slice(0, 10).forEach(call => {
  const defined = functionDefs.find(def => def.name === call.name);
  const status = defined ? '✅ OK' : '❌ NOT FOUND';
  const definedIn = defined ? `${defined.file}:${defined.line}` : 'NOT FOUND';
  console.log(`| \`${call.name}()\` | ${call.file}:${call.line} | ${definedIn} | ${status} |`);
});

console.log('\n### 🔍 DETAILED ANALYSIS\n');

if (undefinedRefs.length > 0) {
  console.log('#### Missing Functions:');
  const missingFunctions = undefinedRefs.filter(ref => ref.type === 'function');
  missingFunctions.forEach(ref => {
    console.log(`\`\`\`javascript`);
    console.log(`// FILE: ${ref.file}`);
    console.log(`${ref.name}(); // Line ${ref.line} - NOT DEFINED`);
    console.log(`  ↳ Context: ${ref.context}`);
    console.log(`\`\`\``);
  });
  
  console.log('\n#### Missing Methods:');
  const missingMethods = undefinedRefs.filter(ref => ref.type === 'method');
  missingMethods.forEach(ref => {
    console.log(`\`\`\`javascript`);
    console.log(`// FILE: ${ref.file}`);
    console.log(`${ref.name}; // Line ${ref.line} - METHOD DOES NOT EXIST`);
    console.log(`  ↳ Context: ${ref.context}`);
    console.log(`\`\`\``);
  });
  
  console.log('\n### 🚨 CRITICAL FIXES (In order of priority)\n');
  undefinedRefs.forEach((ref, index) => {
    console.log(`${index + 1}. **Fix ${ref.type}**: \`${ref.name}\``);
    console.log(`   - Location: ${ref.file}:${ref.line}`);
    console.log(`   - Issue: ${ref.error}`);
    console.log('');
  });
}

// Save detailed results
const results = {
  functionDefs,
  functionCalls, 
  methodCalls,
  undefinedRefs,
  summary: {
    totalFunctionDefs: functionDefs.length,
    totalFunctionCalls: functionCalls.length,
    totalMethodCalls: methodCalls.length,
    undefinedCount: undefinedRefs.length,
    status: undefinedRefs.length === 0 ? 'PASS' : 'FAIL'
  }
};

fs.writeFileSync('reference-validation-results.json', JSON.stringify(results, null, 2));
console.log(`\n✅ Detailed results saved to reference-validation-results.json`);
console.log(`\n🎯 **VALIDATION STATUS**: ${undefinedRefs.length === 0 ? '✅ PASS' : '❌ FAIL'} - ${undefinedRefs.length} undefined references found`);