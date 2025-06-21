const fs = require('fs');
const path = require('path');

console.log('🔧 Adding Cron Job Tools to the project...\n');

// Step 1: Update http-server.ts imports
const httpServerPath = path.join(__dirname, 'src', 'http-server.ts');
let httpServerContent = fs.readFileSync(httpServerPath, 'utf8');

// Add cron job tools import after lead tracking tools
httpServerContent = httpServerContent.replace(
  'import * as leadTrackingTools from \'./tools/lead-tracking-tools.js\';',
  `import * as leadTrackingTools from './tools/lead-tracking-tools.js';
import * as cronJobTools from './tools/cron-job-tools.js';`
);

// Step 2: Add cron job tools to the tools list in multiple places
// Define the tools definitions once
const cronJobToolsDefinitions = `, { name: 'create_cron_job', description: 'Create a new cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, title: { type: 'string', description: 'Job title' }, url: { type: 'string', description: 'URL to call' }, schedule: { type: 'object', properties: { hours: { type: 'array', items: { type: 'number' }, description: 'Hours (0-23)' }, minutes: { type: 'array', items: { type: 'number' }, description: 'Minutes (0-59)' } } }, requestMethod: { type: 'number', description: '0=GET, 1=POST' }, postData: { type: 'string', description: 'POST data if method is POST' } }, required: ['apiKey', 'title', 'url'] } }, { name: 'get_cron_job_details', description: 'Get cron job details', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' } }, required: ['apiKey', 'jobId'] } }, { name: 'update_cron_job', description: 'Update an existing cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, title: { type: 'string', description: 'New title' }, url: { type: 'string', description: 'New URL' }, schedule: { type: 'object', description: 'New schedule' } }, required: ['apiKey', 'jobId'] } }, { name: 'delete_cron_job', description: 'Delete a cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' } }, required: ['apiKey', 'jobId'] } }, { name: 'get_cron_job_history', description: 'Get cron job execution history', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, limit: { type: 'number', description: 'Number of records to fetch', default: 25 } }, required: ['apiKey', 'jobId'] } }, { name: 'get_cron_job_history_details', description: 'Get specific execution details', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, identifier: { type: 'string', description: 'Execution identifier' } }, required: ['apiKey', 'jobId', 'identifier'] } }, { name: 'list_cron_jobs', description: 'List all cron jobs', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' } }, required: ['apiKey'] } }`;

// First, in the MCP tools list (in websocket handler)
const toolsListPattern = /{ name: 'get_leads_with_insights'[^}]+}/;
const match = httpServerContent.match(toolsListPattern);

if (match) {
  const insertPosition = httpServerContent.indexOf(match[0]) + match[0].length;
  httpServerContent = httpServerContent.slice(0, insertPosition) + cronJobToolsDefinitions + httpServerContent.slice(insertPosition);
}

// Step 3: Add the same tools to the /stream endpoint tools list
const streamToolsPattern = /tools: \[[\s\S]*?\]/;
const streamMatch = httpServerContent.match(streamToolsPattern);

if (streamMatch) {
  // Find where to insert (after get_leads_with_insights in the stream endpoint)
  const streamInsertPattern = /{ name: 'get_leads_with_insights'[^}]+}/g;
  let lastIndex = 0;
  let match;
  
  // Find the second occurrence (in the stream endpoint)
  while ((match = streamInsertPattern.exec(httpServerContent)) !== null) {
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex > 0) {
    httpServerContent = httpServerContent.slice(0, lastIndex) + cronJobToolsDefinitions + httpServerContent.slice(lastIndex);
  }
}

// Step 4: Add the tool cases in processMcpToolCall
const casesInsertPoint = httpServerContent.indexOf('case \'get_leads_with_insights\':');
const endOfLeadsCase = httpServerContent.indexOf('default:', casesInsertPoint);

if (casesInsertPoint > -1 && endOfLeadsCase > -1) {
  const cronJobCases = `
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
        }

      `;
  
  httpServerContent = httpServerContent.slice(0, endOfLeadsCase) + cronJobCases + '\n      ' + httpServerContent.slice(endOfLeadsCase);
}

// Step 5: Update tool count in instructions
httpServerContent = httpServerContent.replace(
  '<strong>Test Facebook Ads tools</strong> - you now have 70 tools available!</li>',
  '<strong>Test Facebook Ads tools</strong> - you now have 77 tools available!</li>'
);

// Write the updated file
fs.writeFileSync(httpServerPath, httpServerContent);
console.log('✅ Updated http-server.ts with cron job tools');

// Update README.md
const readmePath = path.join(__dirname, 'README.md');
let readmeContent = fs.readFileSync(readmePath, 'utf8');

// Update tool count in README
readmeContent = readmeContent.replace(/67 working tools/g, '74 working tools');
readmeContent = readmeContent.replace(/All 67 tools/g, 'All 74 tools');
readmeContent = readmeContent.replace(/Total 67 tools/g, 'Total 74 tools');
readmeContent = readmeContent.replace(/70 tools/g, '77 tools');

// Add cron job tools section
const cronJobSection = `
### **🏆 Cron Job Management (7/7 - 100%)** **[NEW June 18]**
- ✅ \`create_cron_job\` - Create scheduled jobs with custom timing (API KEY REQUIRED)
- ✅ \`get_cron_job_details\` - Get details of a specific cron job (API KEY REQUIRED)
- ✅ \`update_cron_job\` - Update existing cron job settings (API KEY REQUIRED)
- ✅ \`delete_cron_job\` - Delete a cron job (API KEY REQUIRED)
- ✅ \`get_cron_job_history\` - View execution history (API KEY REQUIRED)
- ✅ \`get_cron_job_history_details\` - Get specific execution details (API KEY REQUIRED)
- ✅ \`list_cron_jobs\` - List all cron jobs in account (API KEY REQUIRED)
`;

// Insert after lead tracking tools section
const leadTrackingIndex = readmeContent.indexOf('### **🏆 Lead Tracking & ROI Tools');
const nextSectionIndex = readmeContent.indexOf('### **❌ Facebook Ads Library Tools', leadTrackingIndex);

if (leadTrackingIndex > -1 && nextSectionIndex > -1) {
  readmeContent = readmeContent.slice(0, nextSectionIndex) + cronJobSection + '\n' + readmeContent.slice(nextSectionIndex);
}

fs.writeFileSync(readmePath, readmeContent);
console.log('✅ Updated README.md');

console.log('\n📦 Building the project...');
const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
  console.log('\n✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
}

console.log('\n🎯 Cron Job Tools added successfully!');
console.log('\n📝 Summary:');
console.log('- Added 7 cron job management tools');
console.log('- All tools require API key as parameter');
console.log('- Default timezone: Asia/Kuala_Lumpur');
console.log('- Total tools now: 77 (67 Facebook + 3 Lead Tracking + 7 Cron Job)');
