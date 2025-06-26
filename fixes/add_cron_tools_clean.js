const fs = require('fs');
const path = require('path');

console.log('🔧 Adding Cron Job Tools cleanly...\n');

// Read the http-server.ts file
const httpServerPath = path.join(__dirname, '..', 'src', 'http-server.ts');
let httpServerContent = fs.readFileSync(httpServerPath, 'utf8');

// Step 1: Add import for cron-job-tools
const importPattern = /import \* as leadTrackingTools from '\.\/tools\/lead-tracking-tools\.js';/;
if (importPattern.test(httpServerContent) && !httpServerContent.includes('cron-job-tools')) {
  httpServerContent = httpServerContent.replace(
    importPattern,
    `import * as leadTrackingTools from './tools/lead-tracking-tools.js';
import * as cronJobTools from './tools/cron-job-tools.js';`
  );
  console.log('✅ Added cron-job-tools import');
}

// Step 2: Add cron job tool cases to processMcpToolCall
const processToolsPattern = /case 'get_leads_with_insights':[\s\S]*?return { \.\.\.result, tool: toolName };[\s\S]*?}/;
const processMatch = httpServerContent.match(processToolsPattern);

if (processMatch) {
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
        }`;

  // Find the default case and insert before it
  const defaultCaseIndex = httpServerContent.indexOf('default:', processMatch.index);
  if (defaultCaseIndex > -1) {
    httpServerContent = httpServerContent.slice(0, defaultCaseIndex) + cronJobCases + '\n\n      ' + httpServerContent.slice(defaultCaseIndex);
    console.log('✅ Added cron job tool cases to processMcpToolCall');
  }
}

// Step 3: Update tool count
httpServerContent = httpServerContent.replace(
  /<strong>Test Facebook Ads tools<\/strong> - you now have \d+ tools available!<\/li>/g,
  '<strong>Test Facebook Ads tools</strong> - you now have 77 tools available!</li>'
);

// Write the updated file
fs.writeFileSync(httpServerPath, httpServerContent);
console.log('✅ Updated http-server.ts');

// Now we need to manually add the tools to the tools arrays
// Since the automatic insertion is complex, let's create a separate file with instructions
const instructionsPath = path.join(__dirname, '..', 'CRON_TOOLS_MANUAL_ADD.md');
const instructions = `# Manual Steps to Add Cron Job Tools to Tools Arrays

The cron job tool handlers have been added successfully. Now you need to manually add these tool definitions to the two tools arrays in http-server.ts:

1. Find the \`case 'tools/list':\` section (around line 413)
2. After the line with \`get_leads_with_insights\`, add these tools:

\`\`\`javascript
              { name: 'create_cron_job', description: 'Create a new cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, title: { type: 'string', description: 'Job title' }, url: { type: 'string', description: 'URL to call' }, schedule: { type: 'object', properties: { hours: { type: 'array', items: { type: 'number' }, description: 'Hours (0-23)' }, minutes: { type: 'array', items: { type: 'number' }, description: 'Minutes (0-59)' } } }, requestMethod: { type: 'number', description: '0=GET, 1=POST' }, postData: { type: 'string', description: 'POST data if method is POST' } }, required: ['apiKey', 'title', 'url'] } },
              { name: 'get_cron_job_details', description: 'Get cron job details', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' } }, required: ['apiKey', 'jobId'] } },
              { name: 'update_cron_job', description: 'Update an existing cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, title: { type: 'string', description: 'New title' }, url: { type: 'string', description: 'New URL' }, schedule: { type: 'object', description: 'New schedule' } }, required: ['apiKey', 'jobId'] } },
              { name: 'delete_cron_job', description: 'Delete a cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' } }, required: ['apiKey', 'jobId'] } },
              { name: 'get_cron_job_history', description: 'Get cron job execution history', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, limit: { type: 'number', description: 'Number of records to fetch', default: 25 } }, required: ['apiKey', 'jobId'] } },
              { name: 'get_cron_job_history_details', description: 'Get specific execution details', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, identifier: { type: 'string', description: 'Execution identifier' } }, required: ['apiKey', 'jobId', 'identifier'] } },
              { name: 'list_cron_jobs', description: 'List all cron jobs', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' } }, required: ['apiKey'] } },
\`\`\`

3. Find the WebSocket handler section with \`if (message.method === 'tools/list')\` (around line 742)
4. Add the same tool definitions after \`get_leads_with_insights\` in that array too

5. Save the file and run: \`npm run build\`

Total tools: 77 (67 Facebook + 3 Lead Tracking + 7 Cron Job)
`;

fs.writeFileSync(instructionsPath, instructions);
console.log(`\n📝 Created manual instructions at: ${instructionsPath}`);

// Build the project
console.log('\n📦 Building the project...');
const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✅ Build completed successfully!');
  console.log('\n🎉 Cron job tools partially added!');
  console.log('⚠️  Please follow the manual instructions to complete the setup.');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.log('\n⚠️  The tool handlers have been added, but you need to manually add the tool definitions.');
  console.log('Please follow the instructions in CRON_TOOLS_MANUAL_ADD.md');
}
