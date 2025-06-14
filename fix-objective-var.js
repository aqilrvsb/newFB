const fs = require('fs');

// Read the file
const filePath = 'src/http-server.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix the undefined 'objective' variable - should be campaignData.objective
content = content.replace(
  /campaignObjective: objective,/g,
  'campaignObjective: campaignData.objective,'
);

content = content.replace(
  /message: `Ad Set created successfully for \${objective} campaign/g,
  'message: `Ad Set created successfully for ${campaignData.objective} campaign'
);

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed undefined objective variable');
