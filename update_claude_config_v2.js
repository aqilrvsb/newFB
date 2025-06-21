const fs = require('fs');

// Read the config file
const configPath = 'C:\\Users\\ROGSTRIX\\AppData\\Roaming\\Claude\\claude_desktop_config.json';
const configContent = fs.readFileSync(configPath, 'utf8');

// Parse the JSON
const config = JSON.parse(configContent);

// Get the embedded JavaScript string
let jsCode = config.mcpServers['facebook-ads'].args[1];

// Find where to insert the new tool - after get_leads_with_insights
const searchPattern = "{ name: 'get_leads_with_insights', description: 'Get leads data with Facebook ad insights and ROI metrics', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } }";

if (jsCode.includes(searchPattern)) {
    // Check if get_lead_report is already there
    if (jsCode.includes("name: 'get_lead_report'")) {
        console.log('✅ get_lead_report tool is already in the configuration!');
    } else {
        // Add the new tool after get_leads_with_insights
        const insertAfter = searchPattern;
        const newTool = ", { name: 'get_lead_report', description: 'Generate comprehensive lead report with full ad metrics including budget, spend, CPM, CTR, and ROAS', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } }";
        
        jsCode = jsCode.replace(insertAfter, insertAfter + newTool);
        
        // Update the config
        config.mcpServers['facebook-ads'].args[1] = jsCode;
        
        // Write the updated config back
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('✅ Successfully added get_lead_report tool!');
        console.log('📋 The tool has been added to your Claude configuration.');
        console.log('🔄 Please close Claude Desktop completely and restart it.');
    }
} else {
    console.error('❌ Could not find the expected pattern in the configuration');
    console.log('Looking for get_leads_with_insights...');
    
    // Try a simpler search
    if (jsCode.includes('get_leads_with_insights')) {
        console.log('Found get_leads_with_insights but pattern matching failed.');
        console.log('Please manually add the tool or check the configuration format.');
    }
}

// Count total tools
const toolMatches = jsCode.match(/name: '[^']+'/g);
if (toolMatches) {
    console.log(`\n📊 Total tools in configuration: ${toolMatches.length}`);
}
