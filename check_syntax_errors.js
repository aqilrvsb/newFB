const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for syntax errors in http-server.ts\n');

const filePath = path.join(__dirname, 'src/http-server.ts');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Check around the error lines
const errorLines = [3388, 3400, 3412, 3424, 3436, 3448, 3460, 3472, 3484, 3496, 3518, 3542, 3566, 3593, 3616, 3644, 3667, 3691, 3715, 3737, 3760, 3773, 3786, 3792, 3793, 3800];

console.log('Checking lines with errors:\n');

errorLines.forEach(lineNum => {
  if (lineNum - 1 < lines.length) {
    console.log(`Line ${lineNum}: ${lines[lineNum - 1].substring(0, 80)}${lines[lineNum - 1].length > 80 ? '...' : ''}`);
  }
});

// Check for common syntax issues
console.log('\n🔍 Checking for common syntax issues:\n');

// Check for unclosed brackets
let openBraces = 0;
let openParens = 0;
let openBrackets = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (const char of line) {
    if (char === '{') openBraces++;
    if (char === '}') openBraces--;
    if (char === '(') openParens++;
    if (char === ')') openParens--;
    if (char === '[') openBrackets++;
    if (char === ']') openBrackets--;
  }
  
  if (i === 3400) {
    console.log(`At line ${i + 1}:`);
    console.log(`  Open braces: ${openBraces}`);
    console.log(`  Open parentheses: ${openParens}`);
    console.log(`  Open brackets: ${openBrackets}`);
  }
}

console.log('\nFinal counts:');
console.log(`  Open braces: ${openBraces}`);
console.log(`  Open parentheses: ${openParens}`);
console.log(`  Open brackets: ${openBrackets}`);

// Look for the specific pattern around the errors
console.log('\n🔍 Checking case statement structure:\n');

let inSwitch = false;
let caseCount = 0;
for (let i = 3000; i < Math.min(3850, lines.length); i++) {
  const line = lines[i].trim();
  if (line.includes('switch')) {
    inSwitch = true;
    console.log(`Line ${i + 1}: Found switch statement`);
  }
  if (line.startsWith('case ')) {
    caseCount++;
    console.log(`Line ${i + 1}: ${line.substring(0, 50)}...`);
  }
  if (line === '}' && inSwitch && caseCount > 10) {
    console.log(`Line ${i + 1}: Found closing brace (might be switch end)`);
    break;
  }
}
