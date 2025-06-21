const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing get-user-id syntax errors...\n');

// Read the http-server.ts file
const httpServerPath = path.join(__dirname, '..', 'src', 'http-server.ts');
let content = fs.readFileSync(httpServerPath, 'utf8');

// Fix #1: Fix the incomplete document.getElementById statements
content = content.replace(
  /document\.getElementById\('configJson'\)\s*}/g,
  "document.getElementById('configJson').textContent = JSON.stringify(config, null, 2);\n        }"
);

// Fix #2: Fix the copyConfig function
content = content.replace(
  /function copyConfig\(\) {\s*document\.getElementById\('configJson'\)/,
  "function copyConfig() {\n            const configText = document.getElementById('configJson').textContent;"
);

// Fix #3: Fix another incomplete getElementById in fallback
content = content.replace(
  /document\.getElementById\('configJson'\)\s*const range/,
  "const configElement = document.getElementById('configJson');\n            const range"
);

// Write the fixed file
fs.writeFileSync(httpServerPath, content);
console.log('✅ Fixed syntax errors in get-user-id endpoint');

// Build the project
console.log('\n📦 Building the project...');
const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✅ Build completed successfully!');
  console.log('\n🎉 get-user-id page should now work without errors');
} catch (error) {
  console.error('❌ Build failed:', error.message);
}
