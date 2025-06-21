const fs = require('fs');
const path = require('path');

console.log('🔄 Applying Facebook SDK migration...\n');

// Files to process
const files = [
  'src/http-server.ts',
  'src/tools/page-tools.ts',
  'src/tools/ad-tools.ts',
  'src/tools/campaign-tools.ts',
  'src/tools/adset-tools.ts',
  'src/tools/audience-tools.ts',
  'src/tools/analytics-tools.ts',
  'src/tools/lead-tracking-tools.ts',
  'src/tools/ads-library-tools.ts',
  'src/tools/account-insights-tools.ts'
];

let totalReplaced = 0;
let filesModified = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Check if file has Facebook API calls
  if (!content.includes('graph.facebook.com')) return;
  
  // Add import if not present
  if (!content.includes('facebook-sdk-wrapper')) {
    // Find the right place to add import (after other imports)
    const importRegex = /^import.*from.*;$/gm;
    const imports = content.match(importRegex);
    if (imports) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;
      const importStatement = "\nimport { sdkFetch } from '../utils/facebook-sdk-wrapper.js';";
      content = content.slice(0, insertPosition) + importStatement + content.slice(insertPosition);
    } else {
      // Add at the beginning if no imports found
      content = "import { sdkFetch } from '../utils/facebook-sdk-wrapper.js';\n" + content;
    }
  }
  
  // Replace fetch calls that use graph.facebook.com
  let replacements = 0;
  
  // Pattern 1: await fetch(`https://graph.facebook.com/...
  content = content.replace(
    /await fetch\((`[^)]*graph\.facebook\.com[^)]*`)([^)]*)?\)/g,
    (match, url, options) => {
      replacements++;
      return `await sdkFetch(${url}${options || ''})`;
    }
  );
  
  // Pattern 2: await fetch('https://graph.facebook.com/...
  content = content.replace(
    /await fetch\(('[^)]*graph\.facebook\.com[^)]*')([^)]*)?\)/g,
    (match, url, options) => {
      replacements++;
      return `await sdkFetch(${url}${options || ''})`;
    }
  );
  
  // Pattern 3: await fetch("https://graph.facebook.com/...
  content = content.replace(
    /await fetch\(("[^)]*graph\.facebook\.com[^)]*")([^)]*)?\)/g,
    (match, url, options) => {
      replacements++;
      return `await sdkFetch(${url}${options || ''})`;
    }
  );
  
  if (replacements > 0) {
    // Create backup
    const backupPath = filePath + '.backup.' + Date.now();
    fs.writeFileSync(backupPath, originalContent);
    
    // Write updated content
    fs.writeFileSync(filePath, content);
    
    console.log(`✅ ${file}: Replaced ${replacements} Facebook fetch calls`);
    console.log(`   Backup saved to: ${path.basename(backupPath)}`);
    totalReplaced += replacements;
    filesModified++;
  }
});

console.log(`\n🎉 Migration complete!`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Total Facebook fetch calls replaced: ${totalReplaced}`);
console.log(`\n📋 Note: Non-Facebook fetch calls (cron-job.org, Laravel) were preserved.`);