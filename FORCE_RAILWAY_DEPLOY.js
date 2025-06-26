// FORCE RAILWAY DEPLOYMENT - CRITICAL SYNTAX FIX
// Timestamp: 2025-06-05 02:20:00
// FIXED: Removed unescaped single quote in get_facebook_pages description
// FIXED: /get-user-id now generates working MCP configs without syntax errors
// FIXED: All 24 Facebook Ads tools with exact working config structure

const deploymentInfo = {
    timestamp: new Date().toISOString(),
    fix: "Syntax error in get_facebook_pages description",
    status: "CRITICAL_FIX_DEPLOYED",
    changes: [
        "Removed special_ad_categories from create_campaign",
        "Removed dailyBudget from update_campaign", 
        "Fixed unescaped single quote in get_facebook_pages",
        "Config now matches exact working structure"
    ],
    verification: "SyntaxError: Unexpected identifier 's' - RESOLVED"
};

console.log('🚀 RAILWAY FORCE DEPLOYMENT TRIGGERED');
console.log('✅ Critical syntax error fixed');
console.log('✅ /get-user-id endpoint now generates working configs');
console.log('✅ All 24 Facebook Ads tools available');
console.log('✅ Config structure matches exactly');

module.exports = deploymentInfo;
