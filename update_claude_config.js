// Script to add get_lead_report to the Claude Desktop config
const fs = require('fs');
const path = require('path');

// Read the current config
const configPath = 'C:\\Users\\ROGSTRIX\\AppData\\Roaming\\Claude\\claude_desktop_config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Find the position to insert the new tool (after get_leads_with_insights)
const nodeArgs = config.mcpServers['facebook-ads'].args[1];

// Find the get_leads_with_insights tool and add get_lead_report after it
const insertPosition = nodeArgs.indexOf("{ name: 'get_leads_with_insights'");
if (insertPosition !== -1) {
    // Find the end of get_leads_with_insights definition
    let bracketCount = 0;
    let endPosition = insertPosition;
    for (let i = insertPosition; i < nodeArgs.length; i++) {
        if (nodeArgs[i] === '{') bracketCount++;
        if (nodeArgs[i] === '}') bracketCount--;
        if (bracketCount === 0 && nodeArgs[i] === '}') {
            endPosition = i + 1;
            break;
        }
    }
    
    // Insert the new tool definition
    const newToolDef = ", { name: 'get_lead_report', description: 'Generate comprehensive lead report with full ad metrics including budget, spend, CPM, CTR, and ROAS', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } }";
    
    config.mcpServers['facebook-ads'].args[1] = 
        nodeArgs.slice(0, endPosition) + 
        newToolDef + 
        nodeArgs.slice(endPosition);
}

// Write the updated config
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('Config updated successfully! Please restart Claude Desktop.');
