const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing WebSocket tools list to show all 77 tools...\n');

// Read the http-server.ts file
const httpServerPath = path.join(__dirname, '..', 'src', 'http-server.ts');
let content = fs.readFileSync(httpServerPath, 'utf8');

// Find the WebSocket tools list - it starts after "if (message.method === 'tools/list') {"
const wsToolsStart = content.indexOf("if (message.method === 'tools/list') {");
if (wsToolsStart === -1) {
  console.error('❌ Could not find WebSocket tools/list handler');
  process.exit(1);
}

// Find where the tools array starts
const toolsArrayStart = content.indexOf('tools: [', wsToolsStart);
if (toolsArrayStart === -1) {
  console.error('❌ Could not find tools array in WebSocket handler');
  process.exit(1);
}

// Find where the tools array ends (look for the closing bracket of the result object)
let bracketCount = 0;
let inTools = false;
let toolsArrayEnd = -1;

for (let i = toolsArrayStart + 8; i < content.length; i++) {
  if (content[i] === '[') {
    bracketCount++;
    inTools = true;
  } else if (content[i] === ']' && inTools) {
    bracketCount--;
    if (bracketCount === 0) {
      toolsArrayEnd = i;
      break;
    }
  }
}

if (toolsArrayEnd === -1) {
  console.error('❌ Could not find end of tools array');
  process.exit(1);
}

// Extract the complete tools list from the /stream endpoint (which has all 77 tools)
const streamToolsMatch = content.match(/case 'tools\/list':\s*res\.json\({[\s\S]*?tools: \[([\s\S]*?)\]\s*}\s*}\);/);
if (!streamToolsMatch) {
  console.error('❌ Could not find /stream endpoint tools list');
  process.exit(1);
}

const allToolsString = streamToolsMatch[1].trim();

// Replace the WebSocket tools array with the complete one
const beforeTools = content.substring(0, toolsArrayStart + 8);
const afterTools = content.substring(toolsArrayEnd);
const newContent = beforeTools + '\n                ' + allToolsString + '\n              ' + afterTools;

// Write the updated file
fs.writeFileSync(httpServerPath, newContent);
console.log('✅ Updated WebSocket tools list with all 77 tools');

// Build the project
console.log('\n📦 Building the project...');
const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✅ Build completed successfully!');
  console.log('\n🎉 WebSocket handler now serves all 77 tools!');
  console.log('Claude Desktop should now see all tools after deployment.');
} catch (error) {
  console.error('❌ Build failed:', error.message);
}
