const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing get-user-id syntax error...\n');

// Read the http-server.ts file
const httpServerPath = path.join(__dirname, 'src', 'http-server.ts');
let content = fs.readFileSync(httpServerPath, 'utf8');

// Find the get-user-id route
const routeStart = content.indexOf("app.get('/get-user-id'");
const routeEnd = content.indexOf('});', routeStart) + 3;

if (routeStart === -1 || routeEnd === -1) {
  console.error('❌ Could not find get-user-id route');
  process.exit(1);
}

// Extract the route content
let routeContent = content.slice(routeStart, routeEnd);

// Find where the long string is in the route
const longStringStart = routeContent.indexOf('"const https = require');
const longStringEnd = routeContent.indexOf('process.on(\'SIGTERM\', () => process.exit(0));"');

if (longStringStart === -1 || longStringEnd === -1) {
  console.error('❌ Could not find the long string boundaries');
  process.exit(1);
}

// Check if there's a duplicate after the string
const afterString = longStringEnd + 'process.on(\'SIGTERM\', () => process.exit(0));"'.length;
const nextChars = routeContent.slice(afterString, afterString + 100);

// If there's duplicate content, remove it
if (nextChars.includes('{ console.log(JSON.stringify')) {
  console.log('Found duplicate string content, removing it...');
  
  // Find the correct end of the string (should just be the closing quote)
  const correctEnd = afterString;
  
  // Find where the actual array closing should be (after all the tools)
  const duplicateStart = routeContent.indexOf(' { console.log(JSON.stringify', correctEnd);
  
  if (duplicateStart > -1) {
    // Remove the duplicate part
    routeContent = routeContent.slice(0, correctEnd) + '\n' + routeContent.slice(duplicateStart + 1000); // Skip the duplicate
  }
}

// Also add the missing lead tracking tools to the list if not present
if (!routeContent.includes("name: 'get_leads_data'")) {
  console.log('Adding lead tracking tools to the list...');
  
  // Find the position after check_ad_id tool
  const checkAdIdPos = routeContent.indexOf("{ name: 'check_ad_id'");
  if (checkAdIdPos > -1) {
    const endOfCheckAdId = routeContent.indexOf('}', checkAdIdPos) + 1;
    const leadTrackingTools = `, { name: 'get_leads_data', description: 'Get leads data from Laravel app', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } }, { name: 'get_leads_with_insights', description: 'Get leads data with Facebook ad insights and ROI metrics', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } }`;
    
    routeContent = routeContent.slice(0, endOfCheckAdId) + leadTrackingTools + routeContent.slice(endOfCheckAdId);
  }
}

// Replace the route in the original content
content = content.slice(0, routeStart) + routeContent + content.slice(routeEnd);

// Write the fixed content back
fs.writeFileSync(httpServerPath, content);
console.log('✅ Fixed get-user-id route');

// Alternative approach: Let's create a simpler fix by finding and replacing the exact problematic string
const problematicPattern = /process\.on\('SIGTERM', \(\) => process\.exit\(0\)\);\"\s*{\s*console\.log\(JSON\.stringify/g;
if (content.match(problematicPattern)) {
  console.log('Found problematic pattern, fixing...');
  content = content.replace(problematicPattern, 'process.on(\'SIGTERM\', () => process.exit(0));"');
  fs.writeFileSync(httpServerPath, content);
  console.log('✅ Fixed duplicate string issue');
}

// Build the project
console.log('\n📦 Building the project...');
const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  console.log('\n✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
}

console.log('\n🎯 Fix applied!');
