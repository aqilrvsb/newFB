// Railway deployment trigger - Modified get_lead_report implementation
// Timestamp: 2025-06-26 ${new Date().toISOString()}

const deploymentInfo = {
  version: "2.1.0",
  feature: "Modified get_lead_report tool",
  changes: [
    "Removed Laravel CRM app dependency",
    "New adDataArray parameter structure", 
    "Enhanced Facebook ad performance metrics",
    "Multi-user analytics support",
    "Comprehensive error handling"
  ],
  timestamp: "${new Date().toISOString()}",
  trigger: true
};

console.log("🚀 Forcing Railway deployment...");
console.log(JSON.stringify(deploymentInfo, null, 2));

module.exports = deploymentInfo;
