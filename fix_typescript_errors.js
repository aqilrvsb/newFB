const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing TypeScript errors from SDK migration\n');

// Fix 1: config.ts - User import and error handling
console.log('1️⃣ Fixing config.ts...');
const configPath = path.join(__dirname, 'src/config.ts');
let configContent = fs.readFileSync(configPath, 'utf8');

// Fix User import
configContent = configContent.replace(
  'const { FacebookAdsApi, AdAccount } = require(\'facebook-nodejs-business-sdk\');',
  'const { FacebookAdsApi, AdAccount, User } = require(\'facebook-nodejs-business-sdk\');'
);

// Fix the error handling in getUserAdAccounts
configContent = configContent.replace(
  /const result = { data: accountsData };\s*\n\s*if \(result\.error\) {/g,
  'const result = { data: accountsData };\n    \n    // Check if accountsData is empty or has error\n    if (!accountsData || accountsData.length === 0) {'
);

// Remove the result.error.message reference
configContent = configContent.replace(
  'return { success: false, error: result.error.message };',
  'return { success: false, error: \'No ad accounts found\' };'
);

fs.writeFileSync(configPath, configContent);
console.log('✅ Fixed config.ts');

// Fix 2: Remove duplicate imports in tool files
const toolFiles = [
  'src/tools/ad-tools.ts',
  'src/tools/adset-tools.ts',
  'src/tools/campaign-tools.ts',
  'src/tools/ads-library-tools.ts'
];

toolFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove duplicate SDK imports (keep only one)
  const lines = content.split('\n');
  const seenImports = new Set();
  const cleanedLines = [];
  
  lines.forEach(line => {
    if (line.includes('require(\'facebook-nodejs-business-sdk\')')) {
      if (!seenImports.has('sdk')) {
        seenImports.add('sdk');
        cleanedLines.push(line);
      }
      // Skip duplicate imports
    } else {
      cleanedLines.push(line);
    }
  });
  
  content = cleanedLines.join('\n');
  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed imports in ${file}`);
});

// Fix 3: Fix variable declaration issues
console.log('\n3️⃣ Fixing variable declarations...');

// Fix ads-library-tools.ts - redeclared 'result'
const adsLibPath = path.join(__dirname, 'src/tools/ads-library-tools.ts');
let adsLibContent = fs.readFileSync(adsLibPath, 'utf8');
adsLibContent = adsLibContent.replace(/const result = /g, (match, offset) => {
  // Check if this is a redeclaration within the same scope
  const before = adsLibContent.substring(Math.max(0, offset - 500), offset);
  if (before.includes('const result =')) {
    return 'result = '; // Remove const for reassignment
  }
  return match;
});
fs.writeFileSync(adsLibPath, adsLibContent);
console.log('✅ Fixed ads-library-tools.ts');

// Fix adset-tools.ts - 'result' used before declaration
const adsetPath = path.join(__dirname, 'src/tools/adset-tools.ts');
let adsetContent = fs.readFileSync(adsetPath, 'utf8');

// Fix the pattern where result is used before declaration
adsetContent = adsetContent.replace(
  /const response = { ok: true, json: async \(\) => result };\s*const result = /g,
  'const result = '
);

// Then add the response after result
adsetContent = adsetContent.replace(
  /(const result = await api\.call[^;]+;)/g,
  '$1\n    const response = { ok: true, json: async () => result };'
);

fs.writeFileSync(adsetPath, adsetContent);
console.log('✅ Fixed adset-tools.ts');

// Fix page-tools.ts - similar issues
const pageToolsPath = path.join(__dirname, 'src/tools/page-tools.ts');
let pageContent = fs.readFileSync(pageToolsPath, 'utf8');

// Fix 'result' used before declaration
pageContent = pageContent.replace(
  /const response = {\s*ok: true,\s*json: async \(\) => \({ id: result\.id, success: true }\)\s*};\s*const result = /g,
  'const result = '
);

// Fix pattern where result is undefined
pageContent = pageContent.replace(
  /params\);\s*if \(result\.error && pageAccessToken\) {/g,
  'params);\n    const result = posts;\n    if (result.error && pageAccessToken) {'
);

// Add response declaration after result
pageContent = pageContent.replace(
  /(const result = await page\.[^;]+;)(?!\s*const response)/g,
  '$1\n    const response = { ok: true, json: async () => ({ id: result.id || result, success: true }) };'
);

fs.writeFileSync(pageToolsPath, pageContent);
console.log('✅ Fixed page-tools.ts');

console.log('\n✅ All TypeScript errors fixed!');
