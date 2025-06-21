const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing switch statement structure in http-server.ts\n');

const filePath = path.join(__dirname, 'src/http-server.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Backup the file
const backupPath = filePath + '.backup.syntax.' + Date.now();
fs.copyFileSync(filePath, backupPath);
console.log(`✅ Created backup: ${path.basename(backupPath)}`);

// Split into lines for analysis
const lines = content.split('\n');

// Find the processMcpToolCall function
let functionStart = -1;
let switchStart = -1;
let braceCount = 0;
let inFunction = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('async function processMcpToolCall')) {
    functionStart = i;
    inFunction = true;
    console.log(`Found processMcpToolCall at line ${i + 1}`);
  }
  
  if (inFunction && lines[i].trim().startsWith('switch')) {
    switchStart = i;
    console.log(`Found switch statement at line ${i + 1}`);
  }
  
  if (inFunction) {
    for (const char of lines[i]) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
    }
    
    // Check if we've closed the function
    if (braceCount === 0 && i > functionStart + 10) {
      console.log(`Function seems to end at line ${i + 1}`);
      break;
    }
  }
}

// The problem is likely that there are case statements after the switch has closed
// Let's fix this by ensuring all case statements are within the switch

console.log('\n🔍 Analyzing structure...');

// Find where the switch statement should end
let switchBraceCount = 0;
let switchEndLine = -1;
let inSwitch = false;

for (let i = switchStart; i < lines.length && i > 0; i++) {
  const line = lines[i];
  
  if (i === switchStart) {
    inSwitch = true;
  }
  
  if (inSwitch) {
    for (const char of line) {
      if (char === '{') switchBraceCount++;
      if (char === '}') switchBraceCount--;
    }
    
    if (switchBraceCount === 0 && i > switchStart) {
      switchEndLine = i;
      console.log(`Switch statement should end at line ${i + 1}`);
      break;
    }
  }
}

// Now check if there are case statements after the switch ends
let orphanedCases = [];
for (let i = switchEndLine + 1; i < lines.length; i++) {
  if (lines[i].trim().startsWith('case ')) {
    orphanedCases.push(i);
  }
}

if (orphanedCases.length > 0) {
  console.log(`\n⚠️  Found ${orphanedCases.length} case statements after switch block ends!`);
  console.log('These start at line:', orphanedCases[0] + 1);
  
  // Fix by moving the switch closing brace to after all cases
  // Find the last case statement
  let lastCase = orphanedCases[orphanedCases.length - 1];
  
  // Find the end of the last case block
  let caseEndLine = lastCase;
  let caseBraceCount = 0;
  let inCase = false;
  
  for (let i = lastCase; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim().startsWith('case ') || line.trim().startsWith('default:')) {
      if (inCase && caseBraceCount === 0) {
        caseEndLine = i - 1;
        break;
      }
      inCase = true;
      caseBraceCount = 0;
    }
    
    if (inCase) {
      for (const char of line) {
        if (char === '{') caseBraceCount++;
        if (char === '}') caseBraceCount--;
      }
    }
  }
  
  // Now we need to move the switch closing brace
  console.log(`\n🔧 Fixing: Moving switch closing brace from line ${switchEndLine + 1} to after line ${caseEndLine + 1}`);
  
  // Remove the premature closing brace
  if (lines[switchEndLine].trim() === '}') {
    lines[switchEndLine] = '';
  }
  
  // Find where to insert the closing brace (after the last case block)
  let insertLine = caseEndLine;
  
  // Skip to the end of the default case if it exists
  for (let i = caseEndLine; i < lines.length; i++) {
    if (lines[i].trim() === 'default:') {
      // Find the end of default case
      let defaultBraces = 0;
      for (let j = i; j < lines.length; j++) {
        for (const char of lines[j]) {
          if (char === '{') defaultBraces++;
          if (char === '}') defaultBraces--;
        }
        if (defaultBraces === 0 && j > i + 2) {
          insertLine = j;
          break;
        }
      }
      break;
    }
  }
  
  // Make sure we have the proper closing braces
  // The function should have proper closing
  const functionEndPattern = /^\s*}\s*catch\s*\(/;
  let functionCatchLine = -1;
  
  for (let i = insertLine; i < lines.length && i < insertLine + 50; i++) {
    if (functionEndPattern.test(lines[i])) {
      functionCatchLine = i;
      console.log(`Found catch block at line ${i + 1}`);
      break;
    }
  }
  
  if (functionCatchLine > 0) {
    // Insert the switch closing brace before the catch
    lines[functionCatchLine - 1] = lines[functionCatchLine - 1] + '\n    }';
  }
  
  // Rebuild the content
  content = lines.join('\n');
  
  // Write the fixed content
  fs.writeFileSync(filePath, content);
  console.log('\n✅ Fixed switch statement structure!');
} else {
  console.log('\n✅ No orphaned case statements found.');
}

// Double-check by compiling
console.log('\n🔍 Verifying fix...');
const { execSync } = require('child_process');
try {
  execSync('npx tsc --noEmit src/http-server.ts', { cwd: __dirname });
  console.log('✅ TypeScript compilation successful!');
} catch (error) {
  console.log('⚠️  TypeScript still has errors. Manual review needed.');
  console.log(error.stdout?.toString() || error.message);
}
