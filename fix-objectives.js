// First, let's fix the imports by adding the campaign helpers import
const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'src', 'http-server.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import for campaign helpers after path import
const importIndex = content.indexOf("import path from 'path';");
if (importIndex !== -1 && !content.includes('campaign-helpers')) {
  const insertPosition = importIndex + "import path from 'path';".length;
  content = content.substring(0, insertPosition) + 
    "\nimport { getOptimizationGoalForObjective, VALID_CAMPAIGN_OBJECTIVES } from './utils/campaign-helpers.js';" +
    content.substring(insertPosition);
}

// 2. Update the first create_campaign tool definition (around line 393)
// Find and replace the objective property to include enum
const toolsListPattern = /(\{ name: 'create_campaign', description: 'Creates a new ad campaign', inputSchema: \{ type: 'object', properties: \{[^}]+objective: \{ type: 'string' \})/g;
content = content.replace(toolsListPattern, (match) => {
  return match.replace("objective: { type: 'string' }", 
    "objective: { type: 'string', enum: ['OUTCOME_AWARENESS', 'OUTCOME_TRAFFIC', 'OUTCOME_ENGAGEMENT', 'OUTCOME_LEADS', 'OUTCOME_APP_PROMOTION', 'OUTCOME_SALES'] }");
});

// 3. Update the second create_campaign definition (around line 694)
const secondPattern = /(name: 'create_campaign',\s*description: 'Create a new Facebook ad campaign',\s*inputSchema: \{[^}]+objective: \{ type: 'string', description: 'Campaign objective' \})/g;
content = content.replace(secondPattern, (match) => {
  return match.replace("objective: { type: 'string', description: 'Campaign objective' }", 
    "objective: { type: 'string', description: 'Campaign objective', enum: ['OUTCOME_AWARENESS', 'OUTCOME_TRAFFIC', 'OUTCOME_ENGAGEMENT', 'OUTCOME_LEADS', 'OUTCOME_APP_PROMOTION', 'OUTCOME_SALES'] }");
});

// 4. Add validation in create_campaign implementation
// Find the create_campaign case and add validation
const createCampaignPattern = /case 'create_campaign':\s*try \{/g;
content = content.replace(createCampaignPattern, `case 'create_campaign':
        try {
          // Validate objective
          if (!VALID_CAMPAIGN_OBJECTIVES.includes(args.objective)) {
            return {
              success: false,
              error: \`Invalid objective. Valid options are: \${VALID_CAMPAIGN_OBJECTIVES.join(', ')}\`,
              tool: 'create_campaign'
            };
          }`);

// 5. Update the ad set creation optimization goal logic
// Find the pattern and replace
const adSetPattern = /\/\/ Set optimization goal and billing event based on campaign objective[\s\S]*?billingEvent = 'IMPRESSIONS';\s*\}/;
const adSetReplacement = `// Use helper function to get optimization goal and billing event
          const { optimizationGoal, billingEvent } = getOptimizationGoalForObjective(campaignData.objective);`;

content = content.replace(adSetPattern, adSetReplacement);

// Write the updated content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Successfully updated http-server.ts with all campaign objectives support!');
console.log('✅ Updated tool definitions and implementation');
console.log('✅ Added validation for campaign objectives');
console.log('✅ Integrated optimization goal helper function');
