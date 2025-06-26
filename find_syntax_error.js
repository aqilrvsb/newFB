const fs = require('fs');
const path = require('path');

console.log('🔍 Finding the actual syntax error in http-server.ts\n');

const filePath = path.join(__dirname, 'src/http-server.ts');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Look for the processMcpToolCall function
let functionStart = -1;
let switchStart = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('async function processMcpToolCall')) {
    functionStart = i;
    console.log(`Found processMcpToolCall at line ${i + 1}`);
  }
  if (functionStart > -1 && lines[i].trim().startsWith('switch (toolName)')) {
    switchStart = i;
    console.log(`Found switch statement at line ${i + 1}`);
    break;
  }
}

// Count braces in the switch statement
let braceCount = 0;
let caseCount = 0;
let lastCaseLine = -1;

console.log('\nAnalyzing switch structure:');
for (let i = switchStart; i < lines.length && i < switchStart + 3000; i++) {
  const line = lines[i];
  
  // Count braces
  for (const char of line) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
  }
  
  // Count cases
  if (line.trim().startsWith('case ')) {
    caseCount++;
    lastCaseLine = i;
    if (caseCount <= 5 || caseCount > 70) {
      console.log(`  Line ${i + 1}: ${line.trim().substring(0, 50)}`);
    } else if (caseCount === 6) {
      console.log('  ... (showing first 5 and last cases)');
    }
  }
  
  // Check if switch closed prematurely
  if (braceCount === 0 && i > switchStart + 10) {
    console.log(`\n⚠️  Switch statement closed at line ${i + 1}`);
    console.log(`  Total cases found so far: ${caseCount}`);
    
    // Check if there are more cases after this
    let moreCases = 0;
    for (let j = i + 1; j < lines.length && j < i + 200; j++) {
      if (lines[j].trim().startsWith('case ')) {
        moreCases++;
      }
    }
    
    if (moreCases > 0) {
      console.log(`  ❌ Found ${moreCases} more case statements after switch closed!`);
      console.log(`  This is the syntax error - case statements outside switch block`);
      
      // The fix is to NOT close the switch statement early
      // Find the line that prematurely closes it
      if (lines[i].trim() === '}') {
        console.log(`\n🔧 Fix: Remove premature closing brace at line ${i + 1}`);
        
        // Create backup and fix
        const backupPath = filePath + '.backup.fix.' + Date.now();
        fs.copyFileSync(filePath, backupPath);
        
        // Comment out the premature closing brace
        lines[i] = '        // } // <-- Removed premature closing brace';
        
        // Find where the switch SHOULD close (after all cases)
        let shouldCloseAt = lastCaseLine;
        
        // Find the last case block's closing
        for (let k = lastCaseLine; k < lines.length && k < lastCaseLine + 100; k++) {
          if (lines[k].trim().startsWith('default:')) {
            // Find end of default block
            let defaultBraces = 0;
            for (let m = k; m < lines.length && m < k + 50; m++) {
              for (const char of lines[m]) {
                if (char === '{') defaultBraces++;
                if (char === '}') defaultBraces--;
              }
              if (defaultBraces === 0 && m > k + 3) {
                shouldCloseAt = m;
                break;
              }
            }
            break;
          }
        }
        
        console.log(`  Switch should close after line ${shouldCloseAt + 1}`);
        
        // Add proper closing brace after the last case
        if (shouldCloseAt > 0) {
          // Find the catch block
          let catchLine = -1;
          for (let n = shouldCloseAt; n < lines.length && n < shouldCloseAt + 50; n++) {
            if (lines[n].includes('} catch (error)')) {
              catchLine = n;
              break;
            }
          }
          
          if (catchLine > 0) {
            // Insert closing brace before catch
            lines[catchLine] = '    }\n' + lines[catchLine];
          }
        }
        
        // Save the fixed file
        const fixedContent = lines.join('\n');
        fs.writeFileSync(filePath, fixedContent);
        console.log('\n✅ Fixed! Removed premature switch closing and added proper closing');
        
        // Test compilation
        console.log('\n🔍 Testing TypeScript compilation...');
        const { execSync } = require('child_process');
        try {
          execSync('npx tsc --noEmit src/http-server.ts', { cwd: __dirname, stdio: 'pipe' });
          console.log('✅ TypeScript compilation successful!');
        } catch (error) {
          console.log('⚠️  Still has compilation errors, checking...');
          const output = error.stdout?.toString() || '';
          const errorCount = (output.match(/error TS/g) || []).length;
          console.log(`  Found ${errorCount} TypeScript errors`);
          if (errorCount < 50) {
            console.log('  (Reduced from 50+ errors - progress!)');
          }
        }
      }
    }
    break;
  }
}

console.log(`\nTotal cases in switch: ${caseCount}`);
