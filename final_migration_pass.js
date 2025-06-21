const fs = require('fs');
const path = require('path');

console.log('🎯 Final Facebook SDK Migration - Catching remaining fetch calls\n');

// More aggressive migration
function migrateFinalPass(filePath) {
  if (!fs.existsSync(filePath)) return { replaced: 0, skipped: true };
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Skip if no Facebook API calls
  if (!content.includes('graph.facebook.com')) {
    return { replaced: 0, skipped: true };
  }
  
  // Ensure import is present
  if (!content.includes('sdkFetch')) {
    const fileDepth = filePath.split(path.sep).filter(p => p === 'src' || p === 'tools').length;
    const importPath = fileDepth > 1 ? '../../utils/facebook-sdk-wrapper.js' : '../utils/facebook-sdk-wrapper.js';
    
    // Add import at the top after other imports
    const firstImportMatch = content.match(/^import .* from .*;$/m);
    if (firstImportMatch) {
      const insertIndex = content.indexOf(firstImportMatch[0]) + firstImportMatch[0].length;
      content = content.slice(0, insertIndex) + `\nimport { sdkFetch } from '${importPath}';` + content.slice(insertIndex);
    }
  }
  
  let replacements = 0;
  
  // Replace all fetch( with sdkFetch( where Facebook URLs are involved
  // This is more aggressive but safer since we check for Facebook URLs
  
  const lines = content.split('\n');
  let inFacebookContext = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
    const prevLine = i > 0 ? lines[i - 1] : '';
    
    // Check if we're in a Facebook API context
    if (line.includes('graph.facebook.com') || 
        nextLine.includes('graph.facebook.com') ||
        prevLine.includes('graph.facebook.com')) {
      inFacebookContext = true;
    }
    
    // Replace fetch with sdkFetch in Facebook context
    if (inFacebookContext && line.includes('fetch(') && !line.includes('sdkFetch(')) {
      lines[i] = line.replace(/fetch\(/g, 'sdkFetch(');
      replacements++;
      inFacebookContext = false;
    }
    
    // Reset context after a few lines
    if (!line.includes('graph.facebook.com') && i > 2) {
      inFacebookContext = false;
    }
  }
  
  content = lines.join('\n');
  
  if (replacements > 0) {
    // Create backup
    const backupPath = filePath + '.backup.final.' + Date.now();
    fs.writeFileSync(backupPath, originalContent);
    
    // Write updated content
    fs.writeFileSync(filePath, content);
    
    return { replaced: replacements, backupPath };
  }
  
  return { replaced: 0 };
}

// Files that still need migration
const remainingFiles = [
  'src/tools/account-insights-tools.ts',
  'src/tools/lead-tracking-tools.ts',
  'src/tools/campaign-tools.ts',
  'src/tools/analytics-tools.ts',
  'src/tools/audience-tools.ts'
];

console.log('🔍 Final pass migration...\n');

let totalReplaced = 0;

remainingFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const result = migrateFinalPass(filePath);
  
  if (result.replaced > 0) {
    console.log(`✅ ${file}: Replaced ${result.replaced} remaining fetch calls`);
    totalReplaced += result.replaced;
  }
});

console.log(`\n🎉 Final migration complete!`);
console.log(`   Total additional fetch calls replaced: ${totalReplaced}`);

// Final verification
console.log('\n🔍 Final verification...');
let remaining = 0;

const allFiles = [
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

allFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Look for fetch( followed by Facebook URL (accounting for line breaks)
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('fetch(') && !lines[i].includes('sdkFetch(')) {
        // Check next few lines for Facebook URL
        const context = lines.slice(i, Math.min(i + 3, lines.length)).join(' ');
        if (context.includes('graph.facebook.com')) {
          console.log(`⚠️  ${file} line ${i + 1}: Still has fetch(`);
          remaining++;
        }
      }
    }
  }
});

if (remaining === 0) {
  console.log('✅ All Facebook fetch calls have been successfully migrated!');
} else {
  console.log(`\n⚠️  ${remaining} fetch calls may still need manual review`);
}
