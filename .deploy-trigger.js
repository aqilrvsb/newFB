// RAILWAY AUTO-DEPLOY TRIGGER
// Generated at: ${new Date().toISOString()}
// Purpose: Force Railway to detect changes and deploy

const DEPLOY_INFO = {
  version: "2.0.2",
  timestamp: new Date().toISOString(),
  changes: [
    "All 6 campaign objectives now supported",
    "OUTCOME_SALES uses OFFSITE_CONVERSIONS",
    "Sessions never expire",
    "Tested and verified all objectives"
  ]
};

console.log("Deploying Facebook Ads MCP v2.0.2...");
console.log("Changes:", DEPLOY_INFO.changes.join(", "));

// This file triggers Railway deployment
module.exports = DEPLOY_INFO;
