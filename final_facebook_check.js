const fs = require('fs');
const path = require('path');

console.log('🔍 Final comprehensive check for any remaining Facebook fetch calls\n');

// All tool files to check
const allFiles = [
  'src/http-server.ts',
  'src/mcp-server.ts',
  'src/tools/account-insights-tools.ts',
  'src/tools/ad-tools.ts',
  'src/tools/ads-library-tools.ts',
  'src/tools/adset-tools.ts',
  'src/tools/analytics-tools.ts',
  'src/tools/audience-tools.ts',
  'src/tools/campaign-tools.ts',
  'src/tools/cron-job-tools.ts',
  'src/tools/lead-tracking-tools.ts',
  'src/tools/page-tools.ts'
];

let totalRemaining = 0;
let filesWithFetch = [];

allFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${file} not found`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Count Facebook-related fetch calls
  let fetchCount = 0;
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
    const next2Lines = i < lines.length - 2 ? lines[i + 2] : '';
    
    // Check if this is a fetch call
    if (line.includes('fetch(') && !line.includes('sdkFetch(')) {
      // Check if it's related to Facebook
      const context = line + ' ' + nextLine + ' ' + next2Lines;
      if (context.includes('graph.facebook.com')) {
        fetchCount++;
        console.log(`❌ ${file} line ${i + 1}: Found Facebook fetch`);
      }
    }
  }
  
  if (fetchCount > 0) {
    totalRemaining += fetchCount;
    filesWithFetch.push({ file, count: fetchCount });
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Total files checked: ${allFiles.length}`);
console.log(`   Files with remaining Facebook fetch calls: ${filesWithFetch.length}`);
console.log(`   Total remaining Facebook fetch calls: ${totalRemaining}`);

if (totalRemaining > 0) {
  console.log('\n🔧 Attempting automatic fix...\n');
  
  // Fix remaining files
  filesWithFetch.forEach(({ file }) => {
    const filePath = path.join(__dirname, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Add import if needed
    if (!content.includes('sdkFetch')) {
      const fileDepth = file.split('/').length - 1;
      const importPath = fileDepth > 1 ? '../../utils/facebook-sdk-wrapper' : '../utils/facebook-sdk-wrapper';
      
      // Add import after first import
      const firstImport = content.match(/^import .* from .*;$/m);
      if (firstImport) {
        const insertPos = content.indexOf(firstImport[0]) + firstImport[0].length;
        content = content.slice(0, insertPos) + `\nimport { sdkFetch } from '${importPath}';` + content.slice(insertPos);
      }
    }
    
    // Replace any remaining fetch calls that are Facebook-related
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('graph.facebook.com') || 
          (i > 0 && lines[i-1].includes('graph.facebook.com')) ||
          (i < lines.length - 1 && lines[i+1].includes('graph.facebook.com'))) {
        lines[i] = lines[i].replace(/\bfetch\(/g, 'sdkFetch(');
      }
    }
    content = lines.join('\n');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${file}`);
    }
  });
}

console.log('\n✅ Final check complete!');
