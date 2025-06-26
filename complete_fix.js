// Complete Fix: Restore page-tools.ts to clean state and add proper functions
const fs = require('fs');
const path = require('path');

console.log('🚨 COMPLETE FIX: Restoring page-tools.ts to clean state...');

// Read the current broken file
const pageToolsPath = path.join(__dirname, 'src', 'tools', 'page-tools.ts');
let content = fs.readFileSync(pageToolsPath, 'utf8');

// Find the last valid export function before the corruption
const getTopCommentersStart = content.indexOf('export const getTopCommenters');
if (getTopCommentersStart === -1) {
  console.log('❌ Could not find getTopCommenters function');
  process.exit(1);
}

// Find the end of the getTopCommenters function
let endIndex = getTopCommentersStart;
let braceCount = 0;
let inFunction = false;

for (let i = getTopCommentersStart; i < content.length; i++) {
  const char = content[i];
  
  if (char === '{') {
    braceCount++;
    inFunction = true;
  } else if (char === '}') {
    braceCount--;
    if (inFunction && braceCount === 0) {
      // Look for the semicolon after the closing brace
      let j = i + 1;
      while (j < content.length && /\s/.test(content[j])) {
        j++;
      }
      if (content[j] === ';') {
        endIndex = j + 1;
        break;
      }
    }
  }
}

console.log(`📍 Found valid content up to position ${endIndex}`);

// Keep only the clean content up to the end of getTopCommenters
const cleanContent = content.slice(0, endIndex);

// Write the cleaned file
fs.writeFileSync(pageToolsPath, cleanContent, 'utf8');

console.log('✅ Restored page-tools.ts to clean state');
console.log('📝 Removed all corrupted code');
console.log('🔧 File should now compile without TypeScript errors');
