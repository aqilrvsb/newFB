const fs = require('fs');
const path = require('path');

console.log('🔧 Adding Cron Job Tools to the working backup (70 → 77 tools)...\n');

// Read the http-server.ts file
const httpServerPath = path.join(__dirname, '..', 'src', 'http-server.ts');
let content = fs.readFileSync(httpServerPath, 'utf8');

// Step 1: Add cron job tools import if not already present
if (!content.includes("import * as cronJobTools from './tools/cron-job-tools.js';")) {
  const leadTrackingImport = "import * as leadTrackingTools from './tools/lead-tracking-tools.js';";
  if (content.includes(leadTrackingImport)) {
    content = content.replace(
      leadTrackingImport,
      leadTrackingImport + "\nimport * as cronJobTools from './tools/cron-job-tools.js';"
    );
    console.log('✅ Added cron job tools import');
  }
}

// Step 2: Update tool count from 70 to 77
content = content.replace(
  /you now have \d+ tools/g,
  'you now have 77 tools'
);
console.log('✅ Updated tool count to 77');

// Step 3: Add cron job tool handlers to processMcpToolCall
const cronJobHandlers = `
      case 'create_cron_job':
        try {
          const { apiKey, title, url, schedule, requestMethod, postData, httpHeaders } = args;
          
          if (!apiKey || !title || !url) {
            return {
              success: false,
              error: 'API key, title, and URL are required',
              tool: toolName
            };
          }

          const result = await cronJobTools.createCronJob(apiKey, {
            title,
            url,
            schedule,
            requestMethod,
            postData,
            httpHeaders
          });
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'get_cron_job_details':
        try {
          const { apiKey, jobId } = args;
          
          if (!apiKey || !jobId) {
            return {
              success: false,
              error: 'API key and job ID are required',
              tool: toolName
            };
          }

          const result = await cronJobTools.getCronJobDetails(apiKey, jobId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'update_cron_job':
        try {
          const { apiKey, jobId, ...updates } = args;
          
          if (!apiKey || !jobId) {
            return {
              success: false,
              error: 'API key and job ID are required',
              tool: toolName
            };
          }

          const result = await cronJobTools.updateCronJob(apiKey, jobId, updates);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'delete_cron_job':
        try {
          const { apiKey, jobId } = args;
          
          if (!apiKey || !jobId) {
            return {
              success: false,
              error: 'API key and job ID are required',
              tool: toolName
            };
          }

          const result = await cronJobTools.deleteCronJob(apiKey, jobId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'get_cron_job_history':
        try {
          const { apiKey, jobId, limit } = args;
          
          if (!apiKey || !jobId) {
            return {
              success: false,
              error: 'API key and job ID are required',
              tool: toolName
            };
          }

          const result = await cronJobTools.getCronJobHistory(apiKey, jobId, limit);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'get_cron_job_history_details':
        try {
          const { apiKey, jobId, identifier } = args;
          
          if (!apiKey || !jobId || !identifier) {
            return {
              success: false,
              error: 'API key, job ID, and identifier are required',
              tool: toolName
            };
          }

          const result = await cronJobTools.getCronJobHistoryDetails(apiKey, jobId, identifier);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'list_cron_jobs':
        try {
          const { apiKey } = args;
          
          if (!apiKey) {
            return {
              success: false,
              error: 'API key is required',
              tool: toolName
            };
          }

          const result = await cronJobTools.listCronJobs(apiKey);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }`;

// Find the default case in processMcpToolCall and insert before it
const defaultCaseMatch = content.match(/case 'send_dm_to_user':[\s\S]*?}\s*default:/);
if (defaultCaseMatch) {
  const insertPos = content.indexOf(defaultCaseMatch[0]) + defaultCaseMatch[0].lastIndexOf('default:');
  content = content.slice(0, insertPos) + cronJobHandlers + '\n\n      ' + content.slice(insertPos);
  console.log('✅ Added cron job tool handlers');
}

// Write the updated file
fs.writeFileSync(httpServerPath, content);
console.log('✅ Updated http-server.ts');

// Now we need to add the tools to the tools arrays
console.log('\n📝 Creating script to add tools to arrays...');

// Create a separate script to add the tools to the arrays
const addToolsScript = `
const fs = require('fs');
const path = require('path');

const httpServerPath = path.join(__dirname, '..', 'src', 'http-server.ts');
let content = fs.readFileSync(httpServerPath, 'utf8');

// Cron job tools to add
const cronJobTools = \`, { name: 'create_cron_job', description: 'Create a new cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, title: { type: 'string', description: 'Job title' }, url: { type: 'string', description: 'URL to call' }, schedule: { type: 'object', properties: { hours: { type: 'array', items: { type: 'number' }, description: 'Hours (0-23)' }, minutes: { type: 'array', items: { type: 'number' }, description: 'Minutes (0-59)' } } }, requestMethod: { type: 'number', description: '0=GET, 1=POST' }, postData: { type: 'string', description: 'POST data if method is POST' } }, required: ['apiKey', 'title', 'url'] } },
              { name: 'get_cron_job_details', description: 'Get cron job details', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' } }, required: ['apiKey', 'jobId'] } },
              { name: 'update_cron_job', description: 'Update an existing cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, title: { type: 'string', description: 'New title' }, url: { type: 'string', description: 'New URL' }, schedule: { type: 'object', description: 'New schedule' } }, required: ['apiKey', 'jobId'] } },
              { name: 'delete_cron_job', description: 'Delete a cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' } }, required: ['apiKey', 'jobId'] } },
              { name: 'get_cron_job_history', description: 'Get cron job execution history', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, limit: { type: 'number', description: 'Number of records to fetch', default: 25 } }, required: ['apiKey', 'jobId'] } },
              { name: 'get_cron_job_history_details', description: 'Get specific execution details', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, identifier: { type: 'string', description: 'Execution identifier' } }, required: ['apiKey', 'jobId', 'identifier'] } },
              { name: 'list_cron_jobs', description: 'List all cron jobs', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' } }, required: ['apiKey'] } }\`;

// Find all occurrences of send_dm_to_user and add cron job tools after it
let count = 0;
content = content.replace(/{ name: 'send_dm_to_user'[^}]+}\s*}/g, (match) => {
  count++;
  return match + cronJobTools;
});

console.log(\`Added cron job tools to \${count} locations\`);

fs.writeFileSync(httpServerPath, content);
`;

fs.writeFileSync(path.join(__dirname, '..', 'fixes', 'add_cron_tools_to_arrays.js'), addToolsScript);
console.log('✅ Created add_cron_tools_to_arrays.js');

// Run the script
const { execSync } = require('child_process');
execSync('node fixes/add_cron_tools_to_arrays.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

// Build the project
console.log('\n📦 Building the project...');

try {
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✅ Build completed successfully!');
  console.log('\n🎉 All 77 tools are now available!');
  console.log('- 67 Facebook Ads tools');
  console.log('- 3 Lead Tracking tools');  
  console.log('- 7 Cron Job tools');
} catch (error) {
  console.error('❌ Build failed:', error.message);
}
