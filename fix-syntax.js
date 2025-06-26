const fs = require('fs');

// Read the file
const filePath = 'src/http-server.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the syntax error around line 1450
// Remove the leftover code after getOptimizationGoalForObjective
content = content.replace(
  /const \{ optimizationGoal, billingEvent \} = getOptimizationGoalForObjective\(campaignData\.objective\);[\s\S]*?else if \(objective === 'OUTCOME_LEADS'\) \{[\s\S]*?\}/,
  'const { optimizationGoal, billingEvent } = getOptimizationGoalForObjective(campaignData.objective);'
);

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed syntax error in http-server.ts');
