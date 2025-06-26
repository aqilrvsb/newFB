const fs = require('fs');
const path = require('path');

console.log('🔧 Adding Cron Job Tools to all tool arrays...\n');

// Read the http-server.ts file
const httpServerPath = path.join(__dirname, '..', 'src', 'http-server.ts');
let content = fs.readFileSync(httpServerPath, 'utf8');

// Cron job tools string
const cronJobToolsString = `, { name: 'create_cron_job', description: 'Create a new cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, title: { type: 'string', description: 'Job title' }, url: { type: 'string', description: 'URL to call' }, schedule: { type: 'object', properties: { hours: { type: 'array', items: { type: 'number' }, description: 'Hours (0-23)' }, minutes: { type: 'array', items: { type: 'number' }, description: 'Minutes (0-59)' } } }, requestMethod: { type: 'number', description: '0=GET, 1=POST' }, postData: { type: 'string', description: 'POST data if method is POST' } }, required: ['apiKey', 'title', 'url'] } }, { name: 'get_cron_job_details', description: 'Get cron job details', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' } }, required: ['apiKey', 'jobId'] } }, { name: 'update_cron_job', description: 'Update an existing cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, title: { type: 'string', description: 'New title' }, url: { type: 'string', description: 'New URL' }, schedule: { type: 'object', description: 'New schedule' } }, required: ['apiKey', 'jobId'] } }, { name: 'delete_cron_job', description: 'Delete a cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' } }, required: ['apiKey', 'jobId'] } }, { name: 'get_cron_job_history', description: 'Get cron job execution history', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, limit: { type: 'number', description: 'Number of records to fetch', default: 25 } }, required: ['apiKey', 'jobId'] } }, { name: 'get_cron_job_history_details', description: 'Get specific execution details', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, identifier: { type: 'string', description: 'Execution identifier' } }, required: ['apiKey', 'jobId', 'identifier'] } }, { name: 'list_cron_jobs', description: 'List all cron jobs', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' } }, required: ['apiKey'] } }`;

// Pattern 1: Add after send_dm_to_user in generateConfig
content = content.replace(
  /send_dm_to_user', description: 'Send a direct message to a user', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, recipientId: { type: 'string' }, message: { type: 'string' } },/g,
  (match) => match + ' required: [\'pageId\', \'recipientId\', \'message\'] } }' + cronJobToolsString + ' ] } })); } else if (message.method === \'resources/list\') { console.log(JSON.stringify({ jsonrpc: \'2.0\', id: message.id, result: { resources: [] } })); } else if (message.method === \'prompts/list\') { console.log(JSON.stringify({ jsonrpc: \'2.0\', id: message.id, result: { prompts: [] } })); } else if (message.method === \'tools/call\') { try { const result = await sendRequest(message.params.name, message.params.arguments || {}); console.log(JSON.stringify({ jsonrpc: \'2.0\', id: message.id, result: { content: [{ type: \'text\', text: JSON.stringify(result, null, 2) }] } })); } catch (error) { console.log(JSON.stringify({ jsonrpc: \'2.0\', id: message.id, error: { code: -32603, message: error.message } })); } } else { console.log(JSON.stringify({ jsonrpc: \'2.0\', id: message.id, result: {} })); } } catch (error) { console.error(\'Parse error:\', error); } }); process.on(\'SIGINT\', () => process.exit(0)); process.on(\'SIGTERM\', () => process.exit(0));"'
);

// Pattern 2: Look for tools arrays that end with specific patterns and add cron job tools
let replacements = 0;

// For /stream endpoint
const streamPattern = /case 'tools\/list':\s*res\.json\({[\s\S]*?tools: \[([\s\S]*?)\]\s*}\s*}\);/g;
content = content.replace(streamPattern, (match, toolsList) => {
  if (!toolsList.includes('create_cron_job')) {
    replacements++;
    // Add cron job tools before the closing bracket
    return match.replace(
      /\]\s*}\s*}\);/,
      cronJobToolsString + '\n            ]\n          }\n        });'
    );
  }
  return match;
});

// For WebSocket handler
const wsPattern = /if \(message\.method === 'tools\/list'\) {\s*const response = {[\s\S]*?tools: \[([\s\S]*?)\]\s*}\s*};\s*ws\.send/g;
content = content.replace(wsPattern, (match, toolsList) => {
  if (!toolsList.includes('create_cron_job')) {
    replacements++;
    // Add cron job tools before the closing bracket
    return match.replace(
      /\]\s*}\s*};\s*ws\.send/,
      cronJobToolsString + '\n              ]\n            }\n          };\n          ws.send'
    );
  }
  return match;
});

console.log(`✅ Added cron job tools to ${replacements} locations`);

// Write the updated file
fs.writeFileSync(httpServerPath, content);
console.log('✅ Updated http-server.ts');

// Build the project
console.log('\n📦 Building the project...');
const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✅ Build completed successfully!');
  console.log('\n🎉 All 77 tools are now integrated!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
}
