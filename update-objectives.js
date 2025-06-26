// This script will update the http-server.ts file to support all campaign objectives

const fs = require('fs');
const path = require('path');

// Read the current file
const filePath = path.join(__dirname, 'src', 'http-server.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add the import for campaign helpers
if (!content.includes("import { getOptimizationGoalForObjective, VALID_CAMPAIGN_OBJECTIVES }")) {
  content = content.replace(
    "import path from 'path';",
    "import path from 'path';\nimport { getOptimizationGoalForObjective, VALID_CAMPAIGN_OBJECTIVES } from './utils/campaign-helpers.js';"
  );
}

// 2. Update the create_campaign tool definition in tools/list (around line 393)
content = content.replace(
  /\{ name: 'create_campaign', description: 'Creates a new ad campaign', inputSchema: \{ type: 'object', properties: \{ name: \{ type: 'string' \}, objective: \{ type: 'string' \}, status: \{ type: 'string', enum: \['ACTIVE', 'PAUSED'\] \} \}, required: \['name', 'objective'\] \} \}/g,
  `{ name: 'create_campaign', description: 'Creates a new ad campaign', inputSchema: { type: 'object', properties: { name: { type: 'string' }, objective: { type: 'string', enum: ['OUTCOME_AWARENESS', 'OUTCOME_TRAFFIC', 'OUTCOME_ENGAGEMENT', 'OUTCOME_LEADS', 'OUTCOME_APP_PROMOTION', 'OUTCOME_SALES'] }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] } }, required: ['name', 'objective'] } }`
);

// 3. Update the other create_campaign definition (around line 694)
content = content.replace(
  /name: 'create_campaign',\s*description: 'Create a new Facebook ad campaign',\s*inputSchema: \{[^}]+type: 'string', description: 'Campaign objective'\s*\}/g,
  `name: 'create_campaign',
            description: 'Create a new Facebook ad campaign',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Campaign name' },
                objective: { 
                  type: 'string', 
                  description: 'Campaign objective',
                  enum: ['OUTCOME_AWARENESS', 'OUTCOME_TRAFFIC', 'OUTCOME_ENGAGEMENT', 'OUTCOME_LEADS', 'OUTCOME_APP_PROMOTION', 'OUTCOME_SALES']
                }`
);

// 4. Update the create_campaign implementation to validate objectives
const createCampaignImpl = `case 'create_campaign':
        try {
          // Validate objective
          if (!VALID_CAMPAIGN_OBJECTIVES.includes(args.objective)) {
            return {
              success: false,
              error: \`Invalid objective. Valid options are: \${VALID_CAMPAIGN_OBJECTIVES.join(', ')}\`,
              tool: 'create_campaign'
            };
          }

          // Use the selected ad account instead of getting all accounts
          const adAccount = getAdAccountForUser(userId);
          if (!adAccount) {
            return {
              success: false,
              error: 'No ad account selected. Use select_ad_account first.',
              tool: 'create_campaign'
            };
          }

          const adAccountId = adAccount.id;
          
          // Create campaign
          const campaignData = {
            name: args.name,
            objective: args.objective,
            status: args.status || 'PAUSED',
            special_ad_categories: []
          };`;

// Find and replace the create_campaign case
content = content.replace(
  /case 'create_campaign':\s*try \{[\s\S]*?objective: args\.objective \|\| 'OUTCOME_LEADS',/,
  createCampaignImpl.replace(/objective: args\.objective,/, 'objective: args.objective,')
);

// 5. Update the ad set creation to use the helper function
const adSetOptimizationReplacement = `// Get campaign details to determine proper optimization goal
          const campaignResponse = await fetch(\`https://graph.facebook.com/v23.0/\${campaignId}?fields=objective&access_token=\${session.credentials.facebookAccessToken}\`);
          const campaignData: any = await campaignResponse.json();

          if (campaignData.error) {
            return {
              success: false,
              error: \`Cannot get campaign objective: \${campaignData.error.message}\`,
              tool: 'create_ad_set'
            };
          }

          // Use helper function to get optimization goal and billing event
          const { optimizationGoal, billingEvent } = getOptimizationGoalForObjective(campaignData.objective);`;

// Find and replace the optimization goal logic in create_ad_set
content = content.replace(
  /\/\/ Get campaign details to determine proper optimization goal[\s\S]*?billingEvent = 'IMPRESSIONS';\s*\}/,
  adSetOptimizationReplacement
);

// Write the updated content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ http-server.ts has been updated to support all campaign objectives!');
console.log('✅ Added support for: OUTCOME_AWARENESS, OUTCOME_TRAFFIC, OUTCOME_ENGAGEMENT, OUTCOME_LEADS, OUTCOME_APP_PROMOTION, OUTCOME_SALES');
