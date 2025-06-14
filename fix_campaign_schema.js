// Fix the create_campaign tool schema to include special_ad_categories
const fs = require('fs');

const serverPath = 'src/http-server.ts';
let content = fs.readFileSync(serverPath, 'utf8');

// Find and replace the create_campaign tool definition to include special_ad_categories
const oldCampaignTool = `{ name: 'create_campaign', description: 'Creates a new ad campaign', inputSchema: { type: 'object', properties: { name: { type: 'string' }, objective: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] } }, required: ['name', 'objective'] } }`;

const newCampaignTool = `{ name: 'create_campaign', description: 'Creates a new ad campaign', inputSchema: { type: 'object', properties: { name: { type: 'string' }, objective: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] }, special_ad_categories: { type: 'array', items: { type: 'string' }, default: [] } }, required: ['name', 'objective'] } }`;

content = content.replace(oldCampaignTool, newCampaignTool);

fs.writeFileSync(serverPath, content);
console.log('✅ Updated create_campaign tool schema to include special_ad_categories parameter');
