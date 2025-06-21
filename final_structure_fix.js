const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing the misplaced code in http-server.ts\n');

const filePath = path.join(__dirname, 'src/http-server.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Backup
const backupPath = filePath + '.backup.final.' + Date.now();
fs.copyFileSync(filePath, backupPath);
console.log(`✅ Created backup: ${path.basename(backupPath)}`);

// The issue is that there's fetch polyfill code inside the switch statement
// Let's remove it
const polyfillStart = content.indexOf('// For non-Facebook URLs, use original fetch if available');
const polyfillEnd = content.indexOf('throw new Error(\'fetch is not available\');');

if (polyfillStart > -1 && polyfillEnd > -1) {
  const endOfPolyfill = content.indexOf('};', polyfillEnd) + 2;
  
  console.log('Found misplaced polyfill code, removing it...');
  
  // Extract the polyfill code
  const polyfillCode = content.substring(polyfillStart, endOfPolyfill);
  
  // Remove it from its current location
  content = content.substring(0, polyfillStart) + content.substring(endOfPolyfill);
  
  console.log('✅ Removed misplaced polyfill code');
}

// Now we need to fix the switch statement structure
// Find all case statements after line 3000
const lines = content.split('\n');
let inProperSwitch = false;
let switchLevel = 0;
let needsClosingBrace = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('switch (toolName)')) {
    inProperSwitch = true;
    switchLevel = 1;
    console.log(`Found switch at line ${i + 1}`);
  }
  
  if (inProperSwitch) {
    // Count braces to track nesting
    for (const char of lines[i]) {
      if (char === '{') switchLevel++;
      if (char === '}') switchLevel--;
    }
    
    // Check if switch closed prematurely
    if (switchLevel === 0 && i < 3200) {
      console.log(`Switch closed prematurely at line ${i + 1}`);
      
      // Check if there are more cases after this
      let hasMoreCases = false;
      for (let j = i + 1; j < lines.length && j < i + 100; j++) {
        if (lines[j].trim().startsWith('case ')) {
          hasMoreCases = true;
          needsClosingBrace = true;
          break;
        }
      }
      
      if (hasMoreCases) {
        // Comment out the premature closing
        lines[i] = '      // } // Removed premature closing';
        console.log('Commented out premature closing brace');
      }
    }
  }
}

// If we need to add a closing brace, find where
if (needsClosingBrace) {
  // Find the last case statement
  let lastCaseIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim().startsWith('case ') || lines[i].trim() === 'default:') {
      // Now find the end of this case block
      let braceCount = 0;
      for (let j = i; j < lines.length; j++) {
        for (const char of lines[j]) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }
        
        // End of case block
        if (braceCount === 0 && j > i + 2) {
          lastCaseIndex = j;
          break;
        }
      }
      break;
    }
  }
  
  if (lastCaseIndex > 0) {
    console.log(`Adding switch closing brace after line ${lastCaseIndex + 1}`);
    
    // Find the catch block
    let catchIndex = -1;
    for (let i = lastCaseIndex; i < lines.length && i < lastCaseIndex + 50; i++) {
      if (lines[i].includes('} catch (error)')) {
        catchIndex = i;
        break;
      }
    }
    
    if (catchIndex > 0) {
      // Add closing brace before catch
      lines[catchIndex] = '    }\n' + lines[catchIndex];
      console.log('✅ Added closing brace before catch block');
    }
  }
}

// Rebuild content
content = lines.join('\n');

// Save
fs.writeFileSync(filePath, content);
console.log('\n✅ Fixed structure');

// Test
console.log('\n🔍 Testing compilation...');
const { execSync } = require('child_process');
try {
  execSync('npx tsc --noEmit src/http-server.ts', { cwd: __dirname, stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful!');
} catch (error) {
  const output = error.stdout?.toString() || '';
  const errors = output.split('\n').filter(line => line.includes('error TS'));
  console.log(`⚠️  Still ${errors.length} TypeScript errors`);
  
  // Show first few errors
  errors.slice(0, 5).forEach(err => {
    console.log(err.trim());
  });
}
