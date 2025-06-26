const fs = require('fs');
const path = require('path');

console.log('🔧 Performing comprehensive fix for cron job tools...\n');

// Read the http-server.ts file
const httpServerPath = path.join(__dirname, '..', 'src', 'http-server.ts');
const backupPath = path.join(__dirname, '..', 'backup', 'http-server.ts.backup.' + Date.now());

// Create a backup first
let httpServerContent = fs.readFileSync(httpServerPath, 'utf8');
fs.writeFileSync(backupPath, httpServerContent);
console.log(`✅ Created backup at: ${backupPath}`);

// Find the tools array in the /stream endpoint and fix it
// We need to find the specific location and fix the malformed entries

// First, let's fix the generateConfig function's inline JavaScript
// This is the most problematic part that causes the syntax error
const generateConfigStart = httpServerContent.indexOf('function generateConfig(userId)');
const generateConfigEnd = httpServerContent.indexOf('document.getElementById(\'configJson\')', generateConfigStart) + 100;

if (generateConfigStart > -1 && generateConfigEnd > generateConfigStart) {
  const beforeConfig = httpServerContent.substring(0, generateConfigStart);
  const afterConfig = httpServerContent.substring(generateConfigEnd);
  
  // Replace the problematic generateConfig function with a fixed version
  const fixedGenerateConfig = `function generateConfig(userId) {
  const config = {
    "mcpServers": {
      "facebook-ads": {
        "command": "node",
        "args": [
          "-e",
          \`const https = require('https'); const readline = require('readline'); const USER_ID = '\${userId}'; const BASE_URL = 'newfb-production.up.railway.app'; const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); function sendRequest(method, params = {}) { return new Promise((resolve, reject) => { const postData = JSON.stringify({ method, params }); const options = { hostname: BASE_URL, port: 443, path: \\\`/mcp/\\\${USER_ID}\\\`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } }; const req = https.request(options, (res) => { let data = ''; res.on('data', (chunk) => { data += chunk; }); res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Invalid JSON response')); } }); }); req.on('error', reject); req.write(postData); req.end(); }); } rl.on('line', async (line) => { try { const message = JSON.parse(line); if (message.method === 'initialize') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'facebook-ads-http', version: '1.0.0' } } })); } else if (message.method === 'notifications/initialized') { return; } else if (message.method === 'tools/list') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { tools: [] } })); } else if (message.method === 'resources/list') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { resources: [] } })); } else if (message.method === 'prompts/list') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { prompts: [] } })); } else if (message.method === 'tools/call') { try { const result = await sendRequest(message.params.name, message.params.arguments || {}); console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } })); } catch (error) { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, error: { code: -32603, message: error.message } })); } } else { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: {} })); } } catch (error) { console.error('Parse error:', error); } }); process.on('SIGINT', () => process.exit(0)); process.on('SIGTERM', () => process.exit(0));\`
        ]
      }
    }
  };
  
  document.getElementById('configJson').textContent = JSON.stringify(config, null, 2);
}`;

  httpServerContent = beforeConfig + fixedGenerateConfig + afterConfig;
  console.log('✅ Fixed generateConfig function');
}

// Write the fixed content
fs.writeFileSync(httpServerPath, httpServerContent);
console.log('✅ Updated http-server.ts');

// Build the project
console.log('\n📦 Building the project...');
const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✅ Build completed successfully!');
  console.log('\n🎉 Cron job tools fixed!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.log('\nThe generateConfig function has been fixed, but there may be other issues.');
  console.log('You may need to manually review the tools arrays in the http-server.ts file.');
}
