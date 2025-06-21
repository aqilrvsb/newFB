const fs = require('fs');
const path = require('path');

console.log('🔧 Adding Lead Tracking and Cron Job Tools...\n');

// Read the http-server.ts file
const httpServerPath = path.join(__dirname, '..', 'src', 'http-server.ts');
let content = fs.readFileSync(httpServerPath, 'utf8');

// Tools to add after get_ad_insights
const newTools = `{ name: 'check_ad_id', description: 'Check ad details and hierarchy by ad ID', inputSchema: { type: 'object', properties: { adId: { type: 'string', description: 'Facebook ad ID to check' } }, required: ['adId'] } },
              { name: 'get_leads_data', description: 'Get leads data from Laravel app', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } },
              { name: 'get_leads_with_insights', description: 'Get leads data with Facebook ad insights and ROI metrics', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } },
              { name: 'create_cron_job', description: 'Create a new cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, title: { type: 'string', description: 'Job title' }, url: { type: 'string', description: 'URL to call' }, schedule: { type: 'object', properties: { hours: { type: 'array', items: { type: 'number' }, description: 'Hours (0-23)' }, minutes: { type: 'array', items: { type: 'number' }, description: 'Minutes (0-59)' } } }, requestMethod: { type: 'number', description: '0=GET, 1=POST' }, postData: { type: 'string', description: 'POST data if method is POST' } }, required: ['apiKey', 'title', 'url'] } },
              { name: 'get_cron_job_details', description: 'Get cron job details', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' } }, required: ['apiKey', 'jobId'] } },
              { name: 'update_cron_job', description: 'Update an existing cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, title: { type: 'string', description: 'New title' }, url: { type: 'string', description: 'New URL' }, schedule: { type: 'object', description: 'New schedule' } }, required: ['apiKey', 'jobId'] } },
              { name: 'delete_cron_job', description: 'Delete a cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' } }, required: ['apiKey', 'jobId'] } },
              { name: 'get_cron_job_history', description: 'Get cron job execution history', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, limit: { type: 'number', description: 'Number of records to fetch', default: 25 } }, required: ['apiKey', 'jobId'] } },
              { name: 'get_cron_job_history_details', description: 'Get specific execution details', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, identifier: { type: 'string', description: 'Execution identifier' } }, required: ['apiKey', 'jobId', 'identifier'] } },
              { name: 'list_cron_jobs', description: 'List all cron jobs', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' } }, required: ['apiKey'] } },
              `;

// Find and replace in the /stream endpoint tools array
const streamPattern = /{ name: 'get_ad_insights'[^}]+} },/g;
content = content.replace(streamPattern, (match) => {
  return match + '\n              ' + newTools;
});

// Find and replace in WebSocket tools array
const wsPattern = /if \(message\.method === 'tools\/list'\) {[\s\S]*?tools: \[[\s\S]*?{ name: 'get_ad_insights'[^}]+} },/;
const wsMatch = content.match(wsPattern);
if (wsMatch) {
  // Do another replacement for WebSocket section
  content = content.replace(/{ name: 'get_ad_insights'[^}]+} },(?=\s*{ name: 'get_audiences')/g, (match) => {
    return match + '\n                  ' + newTools;
  });
}

// Update the tool count
content = content.replace(
  /<strong>Test Facebook Ads tools<\/strong> - you now have \d+ tools available!<\/li>/g,
  '<strong>Test Facebook Ads tools</strong> - you now have 77 tools available!</li>'
);

// Write the file
fs.writeFileSync(httpServerPath, content);
console.log('✅ Added tools to http-server.ts');

// Build the project
console.log('\n📦 Building the project...');
const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✅ Build completed successfully!');
  console.log('\n🎉 All tools added successfully!');
  console.log('Total tools: 77 (67 Facebook + 3 Lead Tracking + 7 Cron Job)');
} catch (error) {
  console.error('❌ Build failed:', error.message);
}
