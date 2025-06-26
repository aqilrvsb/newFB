const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing get-user-id syntax error...\n');

// Read the http-server.ts file
const httpServerPath = path.join(__dirname, 'src', 'http-server.ts');
let content = fs.readFileSync(httpServerPath, 'utf8');

// Find the problematic line in the get-user-id HTML generation
// The issue is that cron job tools were inserted inside get_leads_with_insights properties
const problematicPattern = /{ name: 'get_leads_with_insights', description: 'Get leads data with Facebook ad insights and ROI metrics', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID \(e\.g\., RV-007\)' }, { name: 'create_cron_job'/g;

// Replace with the correct format
const correctFormat = `{ name: 'get_leads_with_insights', description: 'Get leads data with Facebook ad insights and ROI metrics', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } }, { name: 'create_cron_job'`;

content = content.replace(problematicPattern, correctFormat);

// Also fix in the WebSocket tools list if it exists there
const wsToolsPattern = /{ name: 'get_leads_with_insights'[^}]+}\s*,\s*{ name: 'create_cron_job'/g;
const matches = content.match(wsToolsPattern);

if (!matches || matches.length === 0) {
  // If the cron job tools aren't properly added after get_leads_with_insights, add them
  const insertAfter = `{ name: 'get_leads_with_insights', description: 'Get leads data with Facebook ad insights and ROI metrics', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } }`;
  
  const cronJobTools = `, { name: 'create_cron_job', description: 'Create a new cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, title: { type: 'string', description: 'Job title' }, url: { type: 'string', description: 'URL to call' }, schedule: { type: 'object', properties: { hours: { type: 'array', items: { type: 'number' }, description: 'Hours (0-23)' }, minutes: { type: 'array', items: { type: 'number' }, description: 'Minutes (0-59)' } } }, requestMethod: { type: 'number', description: '0=GET, 1=POST' }, postData: { type: 'string', description: 'POST data if method is POST' } }, required: ['apiKey', 'title', 'url'] } }, { name: 'get_cron_job_details', description: 'Get cron job details', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' } }, required: ['apiKey', 'jobId'] } }, { name: 'update_cron_job', description: 'Update an existing cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, title: { type: 'string', description: 'New title' }, url: { type: 'string', description: 'New URL' }, schedule: { type: 'object', description: 'New schedule' } }, required: ['apiKey', 'jobId'] } }, { name: 'delete_cron_job', description: 'Delete a cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' } }, required: ['apiKey', 'jobId'] } }, { name: 'get_cron_job_history', description: 'Get cron job execution history', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, limit: { type: 'number', description: 'Number of records to fetch', default: 25 } }, required: ['apiKey', 'jobId'] } }, { name: 'get_cron_job_history_details', description: 'Get specific execution details', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, identifier: { type: 'string', description: 'Execution identifier' } }, required: ['apiKey', 'jobId', 'identifier'] } }, { name: 'list_cron_jobs', description: 'List all cron jobs', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' } }, required: ['apiKey'] } }`;
  
  // Replace only in the get-user-id route
  const getUserIdStart = content.indexOf("app.get('/get-user-id'");
  const getUserIdEnd = content.indexOf('});', getUserIdStart) + 3;
  
  if (getUserIdStart > -1) {
    let getUserIdSection = content.slice(getUserIdStart, getUserIdEnd);
    
    // Replace in this section
    getUserIdSection = getUserIdSection.replace(insertAfter, insertAfter + cronJobTools);
    
    // Put it back
    content = content.slice(0, getUserIdStart) + getUserIdSection + content.slice(getUserIdEnd);
  }
}

// Write the fixed content back
fs.writeFileSync(httpServerPath, content);
console.log('✅ Fixed http-server.ts');

// Build the project
console.log('\n📦 Building the project...');
const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  console.log('\n✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
}

console.log('\n🎯 Fix applied! The get-user-id page should now generate valid configurations.');
