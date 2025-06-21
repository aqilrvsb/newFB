const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing malformed tools array in generateConfig...\n');

// Read the http-server.ts file
const httpServerPath = path.join(__dirname, '..', 'src', 'http-server.ts');
let content = fs.readFileSync(httpServerPath, 'utf8');

// Fix the malformed tool entries in the generateConfig function
// Line 205 has: ] } }, required: ['name', 'objective'] } },
// This should be: { name: 'create_campaign', description: 'Creates a new ad campaign', inputSchema: { type: 'object', properties: { name: { type: 'string' }, objective: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] } }, required: ['name', 'objective'] } },

// Replace the malformed line 205
content = content.replace(
  /\] \} \}, required: \['name', 'objective'\] \} \},\s*{ name: 'update_campaign'/g,
  `{ name: 'create_campaign', description: 'Creates a new ad campaign', inputSchema: { type: 'object', properties: { name: { type: 'string' }, objective: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] } }, required: ['name', 'objective'] } },
{ name: 'update_campaign'`
);

// Fix line 226 which has the same issue
content = content.replace(
  /\] \} \}, required: \['name', 'objective'\] \} \},\s*\]/g,
  `] } })); } else if (message.method === 'resources/list') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { resources: [] } })); } else if (message.method === 'prompts/list') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { prompts: [] } })); } else if (message.method === 'tools/call') { try { const result = await sendRequest(message.params.name, message.params.arguments || {}); console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } })); } catch (error) { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, error: { code: -32603, message: error.message } })); } } else { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: {} })); } } catch (error) { console.error('Parse error:', error); } }); process.on('SIGINT', () => process.exit(0)); process.on('SIGTERM', () => process.exit(0));"
]`
);

// Also fix the duplicate in line 418
content = content.replace(
  /case 'tools\/list':\s*res\.json\({\s*jsonrpc: '2\.0',\s*id: id,\s*result: {\s*tools: \[\s*{ name: 'get_ad_accounts'[^}]+}\s*},\s*{ name: 'select_ad_account'[^}]+}\s*},\s*{ name: 'get_campaigns'[^}]+}\s*},\s*\] \} \}, required: \['name', 'objective'\] \} \},/g,
  `case 'tools/list':
              res.json({
                jsonrpc: '2.0',
                id: id,
                result: {
                  tools: [
                    { name: 'get_ad_accounts', description: 'Get list of available Facebook ad accounts', inputSchema: { type: 'object', properties: {} } },
                    { name: 'select_ad_account', description: 'Select a specific Facebook ad account to use', inputSchema: { type: 'object', properties: { accountId: { type: 'string' } }, required: ['accountId'] } },
                    { name: 'get_campaigns', description: 'Lists existing campaigns', inputSchema: { type: 'object', properties: { limit: { type: 'number', default: 25 } } } },
                    { name: 'create_campaign', description: 'Creates a new ad campaign', inputSchema: { type: 'object', properties: { name: { type: 'string' }, objective: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] } }, required: ['name', 'objective'] } },`
);

// Write the fixed file
fs.writeFileSync(httpServerPath, content);
console.log('✅ Fixed malformed tools array');

// Build the project
console.log('\n📦 Building the project...');
const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✅ Build completed successfully!');
  console.log('\n🎉 get-user-id page should now work without syntax errors');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.log('\nThere may still be syntax errors to fix.');
}
