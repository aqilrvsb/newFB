const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing get-user-id page syntax errors...\n');

// Read the http-server.ts file
const httpServerPath = path.join(__dirname, '..', 'src', 'http-server.ts');
let content = fs.readFileSync(httpServerPath, 'utf8');

// Fix #1: Add missing { after function generateConfig(userId)
content = content.replace(
  /function generateConfig\(userId\)\s*\n\s*const config = {/,
  'function generateConfig(userId) {\n            const config = {'
);

// Fix #2: Replace the entire malformed generateConfig function with a clean one
const generateConfigStart = content.indexOf('function generateConfig(userId)');
const generateConfigEnd = content.indexOf('function copyUserId()');

if (generateConfigStart > -1 && generateConfigEnd > -1) {
  const before = content.substring(0, generateConfigStart);
  const after = content.substring(generateConfigEnd);
  
  const cleanGenerateConfig = `function generateConfig(userId) {
            const config = {
                "mcpServers": {
                    "facebook-ads": {
                        "command": "npx",
                        "args": ["-y", "@modelcontextprotocol/server-facebook-ads", userId]
                    }
                }
            };
            
            document.getElementById('configJson').textContent = JSON.stringify(config, null, 2);
        }
        
        `;
  
  content = before + cleanGenerateConfig + after;
  console.log('✅ Fixed generateConfig function');
}

// Write the fixed file
fs.writeFileSync(httpServerPath, content);
console.log('✅ Updated http-server.ts');

// Build the project
console.log('\n📦 Building the project...');
const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✅ Build completed successfully!');
  console.log('\n🎉 get-user-id page syntax errors fixed!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
}
