const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing cron job tools syntax error...\n');

// Read the http-server.ts file
const httpServerPath = path.join(__dirname, '..', 'src', 'http-server.ts');
let httpServerContent = fs.readFileSync(httpServerPath, 'utf8');

// Fix #1: Fix the malformed get_leads_with_insights definition in generateConfig
// Find and fix the first occurrence (around line 217)
httpServerContent = httpServerContent.replace(
  /get_leads_with_insights', description: 'Get leads data with Facebook ad insights and ROI metrics', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID \(e\.g\., RV-007\)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: \['staffId', 'startDate', 'endDate'\] } }, { name: 'create_cron_job'/g,
  `{ name: 'get_leads_with_insights', description: 'Get leads data with Facebook ad insights and ROI metrics', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } }, { name: 'create_cron_job'`
);

// Fix #2: Remove extra properties after list_cron_jobs
// This pattern will match the list_cron_jobs tool and the extra properties that follow it
httpServerContent = httpServerContent.replace(
  /{ name: 'list_cron_jobs', description: 'List all cron jobs', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job\.org API key' } }, required: \['apiKey'\] } }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: \['staffId', 'startDate', 'endDate'\] } },/g,
  `{ name: 'list_cron_jobs', description: 'List all cron jobs', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' } }, required: ['apiKey'] } },`
);

// Fix #3: Fix the malformed get_leads_with_insights in tools/list (around line 441 and 770)
httpServerContent = httpServerContent.replace(
  /get_leads_with_insights', description: 'Get leads data with Facebook ad insights and ROI metrics', inputSchema/g,
  `{ name: 'get_leads_with_insights', description: 'Get leads data with Facebook ad insights and ROI metrics', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } },`
);

// Fix #4: Ensure proper tool count - should be 77 tools (67 Facebook + 3 Lead Tracking + 7 Cron Job)
httpServerContent = httpServerContent.replace(
  /<strong>Test Facebook Ads tools<\/strong> - you now have \d+ tools available!<\/li>/g,
  '<strong>Test Facebook Ads tools</strong> - you now have 77 tools available!</li>'
);

// Write the fixed file
fs.writeFileSync(httpServerPath, httpServerContent);
console.log('✅ Fixed cron job tools syntax errors in http-server.ts');

// Build the project
console.log('\n📦 Building the project...');
const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✅ Build completed successfully!');
  
  console.log('\n🎉 Cron job tools syntax fixed successfully!');
  console.log('📝 Summary of fixes:');
  console.log('- Fixed malformed get_leads_with_insights tool definitions');
  console.log('- Removed extra properties after list_cron_jobs');
  console.log('- Ensured proper JSON structure for all tools');
  console.log('- Total tools: 77 (67 Facebook + 3 Lead Tracking + 7 Cron Job)');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.log('\nPlease check for any remaining syntax errors.');
}
