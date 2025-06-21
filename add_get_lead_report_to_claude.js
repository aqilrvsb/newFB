const fs = require('fs');
const path = require('path');

// Read the current config
const configPath = 'C:\\Users\\ROGSTRIX\\AppData\\Roaming\\Claude\\claude_desktop_config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Get the current embedded JavaScript code
let jsCode = config.mcpServers['facebook-ads'].args[1];

// Find the position right after get_leads_with_insights
const searchString = "{ name: 'get_leads_with_insights', description: 'Get leads data with Facebook ad insights and ROI metrics', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } }";

const newTool = ", { name: 'get_lead_report', description: 'Generate comprehensive lead report with full ad metrics including budget, spend, CPM, CTR, and ROAS', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } }";

// Find the position and insert the new tool
const position = jsCode.indexOf(searchString);
if (position !== -1) {
    const insertPosition = position + searchString.length;
    jsCode = jsCode.slice(0, insertPosition) + newTool + jsCode.slice(insertPosition);
    
    // Update the config
    config.mcpServers['facebook-ads'].args[1] = jsCode;
    
    // Write back to file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log('✅ Successfully added get_lead_report tool to Claude configuration!');
    console.log('📌 Total tools now: 78 (including the new get_lead_report)');
    console.log('🔄 Please restart Claude Desktop for changes to take effect.');
} else {
    console.error('❌ Could not find get_leads_with_insights in the configuration');
}
