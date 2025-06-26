const fs = require('fs');
const path = require('path');

console.log('🔄 Applying Facebook SDK migration to all files...\n');

// Files to process
const files = [
  "src/http-server.ts",
  "src/tools/page-tools.ts",
  "src/tools/ad-tools.ts",
  "src/tools/campaign-tools.ts",
  "src/tools/adset-tools.ts",
  "src/tools/audience-tools.ts",
  "src/tools/analytics-tools.ts",
  "src/tools/lead-tracking-tools.ts",
  "src/tools/cron-job-tools.ts",
  "src/tools/ads-library-tools.ts",
  "src/tools/account-insights-tools.ts"
];

let totalReplaced = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Add import if not present
  if (!content.includes('facebook-sdk-migration')) {
    const importStatement = "import { sdkRequest, initializeFacebookSDK } from '../utils/facebook-sdk-migration.js';\n";
    content = importStatement + content;
  }
  
  // Replace fetch calls with sdkRequest
  const fetchRegex = /await fetch\(([^)]+)\)/g;
  let replacements = 0;
  
  content = content.replace(fetchRegex, (match, args) => {
    replacements++;
    return `await sdkRequest(${args})`;
  });
  
  if (replacements > 0) {
    // Create backup
    fs.writeFileSync(filePath + '.backup.' + Date.now(), originalContent);
    
    // Write updated content
    fs.writeFileSync(filePath, content);
    
    console.log(`✅ ${file}: Replaced ${replacements} fetch calls`);
    totalReplaced += replacements;
  }
});

console.log(`\n🎉 Total fetch calls replaced: ${totalReplaced}`);
console.log('\n📦 Next steps:');
console.log('1. Review the changes');
console.log('2. Test locally');
console.log('3. Commit and push to Railway');