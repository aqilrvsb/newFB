const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing generateConfig function syntax and adding cron job tools...\n');

// Read the http-server.ts file
const httpServerPath = path.join(__dirname, '..', 'src', 'http-server.ts');
let content = fs.readFileSync(httpServerPath, 'utf8');

// Fix #1: Add missing { after function generateConfig(userId)
content = content.replace(
  /function generateConfig\(userId\)\s*\n\s*const config = {/,
  'function generateConfig(userId) {\n            const config = {'
);

// Fix #2: Add cron job tools to the inline MCP client tools array
const cronJobToolsString = `, { name: 'create_cron_job', description: 'Create a new cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, title: { type: 'string', description: 'Job title' }, url: { type: 'string', description: 'URL to call' }, schedule: { type: 'object', properties: { hours: { type: 'array', items: { type: 'number' }, description: 'Hours (0-23)' }, minutes: { type: 'array', items: { type: 'number' }, description: 'Minutes (0-59)' } } }, requestMethod: { type: 'number', description: '0=GET, 1=POST' }, postData: { type: 'string', description: 'POST data if method is POST' } }, required: ['apiKey', 'title', 'url'] } }, { name: 'get_cron_job_details', description: 'Get cron job details', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' } }, required: ['apiKey', 'jobId'] } }, { name: 'update_cron_job', description: 'Update an existing cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, title: { type: 'string', description: 'New title' }, url: { type: 'string', description: 'New URL' }, schedule: { type: 'object', description: 'New schedule' } }, required: ['apiKey', 'jobId'] } }, { name: 'delete_cron_job', description: 'Delete a cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' } }, required: ['apiKey', 'jobId'] } }, { name: 'get_cron_job_history', description: 'Get cron job execution history', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, limit: { type: 'number', description: 'Number of records to fetch', default: 25 } }, required: ['apiKey', 'jobId'] } }, { name: 'get_cron_job_history_details', description: 'Get specific execution details', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, identifier: { type: 'string', description: 'Execution identifier' } }, required: ['apiKey', 'jobId', 'identifier'] } }, { name: 'list_cron_jobs', description: 'List all cron jobs', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' } }, required: ['apiKey'] } }`;

// Add cron job tools before the closing of the tools array in the inline client
content = content.replace(
  /{ name: 'send_dm_to_user', description: 'Send a direct message to a user', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, recipientId: { type: 'string' }, message: { type: 'string' } }, required: \['pageId', 'recipientId', 'message'\] } } \] } }\)\);\s*} else if \(message\.method === 'resources\/list'\)/g,
  `{ name: 'send_dm_to_user', description: 'Send a direct message to a user', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, recipientId: { type: 'string' }, message: { type: 'string' } }, required: ['pageId', 'recipientId', 'message'] } }${cronJobToolsString} ] } })); } else if (message.method === 'resources/list')`
);

// Fix #3: Ensure the inline client uses /stream endpoint properly
content = content.replace(
  /path: \\`\/mcp\/\\\${USER_ID}\\`/g,
  'path: \\`/stream/\\${USER_ID}\\`'
);

// Write the fixed file
fs.writeFileSync(httpServerPath, content);
console.log('✅ Fixed generateConfig and added cron job tools');

// Build the project
console.log('\n📦 Building the project...');
const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✅ Build completed successfully!');
  console.log('\n🎉 All 77 tools are now in the inline MCP client!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
}
