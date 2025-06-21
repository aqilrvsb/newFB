const fs = require('fs');
const path = require('path');

console.log('🔧 Comprehensive Facebook SDK Migration - Final Version\n');

// Apply migration to a single file
function migrateFile(filePath) {
  if (!fs.existsSync(filePath)) return { replaced: 0, skipped: true };
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Skip if no Facebook API calls
  if (!content.includes('graph.facebook.com')) {
    return { replaced: 0, skipped: true };
  }
  
  // Add import if not present
  if (!content.includes('facebook-sdk-wrapper') && !content.includes('sdkFetch')) {
    // Find the right place to add import
    const importRegex = /^import.*from.*;$/gm;
    const imports = content.match(importRegex);
    if (imports) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;
      
      // Determine the relative path based on file location
      const fileDepth = filePath.split(path.sep).filter(p => p === 'src' || p === 'tools').length;
      const importPath = fileDepth > 1 ? '../../utils/facebook-sdk-wrapper.js' : '../utils/facebook-sdk-wrapper.js';
      
      const importStatement = `\nimport { sdkFetch } from '${importPath}';`;
      content = content.slice(0, insertPosition) + importStatement + content.slice(insertPosition);
    }
  }
  
  let replacements = 0;
  
  // Replace all variations of fetch calls to Facebook
  
  // Pattern 1: Multi-line template literals
  content = content.replace(
    /const response = await fetch\(\s*\n\s*\`https:\/\/graph\.facebook\.com[^`]+\`/gm,
    (match) => {
      replacements++;
      return match.replace('await fetch(', 'await sdkFetch(');
    }
  );
  
  // Pattern 2: Single line template literals  
  content = content.replace(
    /await fetch\(\`https:\/\/graph\.facebook\.com[^`]+\`/g,
    (match) => {
      replacements++;
      return match.replace('await fetch(', 'await sdkFetch(');
    }
  );
  
  // Pattern 3: Variable assignment with fetch
  content = content.replace(
    /= await fetch\(\s*\n?\s*['"\`]https:\/\/graph\.facebook\.com/gm,
    (match) => {
      replacements++;
      return match.replace('await fetch(', 'await sdkFetch(');
    }
  );
  
  // Pattern 4: Direct fetch calls without variable assignment
  content = content.replace(
    /await fetch\(\s*\n?\s*['"\`]https:\/\/graph\.facebook\.com/gm,
    (match) => {
      replacements++;
      return match.replace('await fetch(', 'await sdkFetch(');
    }
  );
  
  // Pattern 5: Replace remaining fetch( to sdkFetch( for lines containing graph.facebook.com
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('graph.facebook.com') && lines[i].includes('fetch(')) {
      const prevLine = i > 0 ? lines[i-1] : '';
      if (prevLine.includes('await') && prevLine.includes('fetch(')) {
        lines[i-1] = prevLine.replace('fetch(', 'sdkFetch(');
        replacements++;
      }
    }
  }
  content = lines.join('\n');
  
  if (replacements > 0) {
    // Create backup
    const backupPath = filePath + '.backup.' + Date.now();
    fs.writeFileSync(backupPath, originalContent);
    
    // Write updated content
    fs.writeFileSync(filePath, content);
    
    return { replaced: replacements, backupPath };
  }
  
  return { replaced: 0 };
}

// Main migration
console.log('🔍 Starting comprehensive migration...\n');

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
let filesSkipped = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  const result = migrateFile(filePath);
  
  if (result.skipped) {
    filesSkipped++;
  } else if (result.replaced > 0) {
    console.log(`✅ ${file}: Replaced ${result.replaced} Facebook fetch calls`);
    if (result.backupPath) {
      console.log(`   Backup: ${path.basename(result.backupPath)}`);
    }
    totalReplaced += result.replaced;
    filesModified++;
  } else {
    console.log(`ℹ️  ${file}: No Facebook fetch calls found`);
  }
});

console.log('\n🎉 Migration complete!');
console.log(`   Files modified: ${filesModified}`);
console.log(`   Files skipped: ${filesSkipped}`);
console.log(`   Total Facebook fetch calls replaced: ${totalReplaced}`);

// Also check for any remaining fetch calls to Facebook
console.log('\n🔍 Verifying migration...');
let remainingFetches = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/fetch\([^)]*graph\.facebook\.com/g) || [];
    if (matches.length > 0) {
      console.log(`⚠️  ${file}: Still has ${matches.length} fetch calls to Facebook`);
      remainingFetches += matches.length;
    }
  }
});

if (remainingFetches === 0) {
  console.log('✅ All Facebook fetch calls have been migrated!');
} else {
  console.log(`\n⚠️  Warning: ${remainingFetches} fetch calls may need manual migration`);
}
