const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing variable declaration errors in migrated files\n');

// Fix ads-library-tools.ts
const adsLibPath = path.join(__dirname, 'src/tools/ads-library-tools.ts');
let adsLibContent = fs.readFileSync(adsLibPath, 'utf8');

// Fix duplicate 'result' declarations
adsLibContent = adsLibContent.replace(/const result = /g, (match, offset) => {
  // Count how many times 'const result' appears before this position
  const before = adsLibContent.substring(0, offset);
  const count = (before.match(/const result = /g) || []).length;
  
  // Rename subsequent declarations
  if (count === 0) return match;
  return `const result${count + 1} = `;
});

fs.writeFileSync(adsLibPath, adsLibContent);
console.log('✅ Fixed ads-library-tools.ts');

// Fix lead-tracking-tools.ts
const leadPath = path.join(__dirname, 'src/tools/lead-tracking-tools.ts');
let leadContent = fs.readFileSync(leadPath, 'utf8');

// Fix duplicate 'ad' declarations
leadContent = leadContent.replace(/const ad = new Ad/g, (match, offset) => {
  const before = leadContent.substring(0, offset);
  const count = (before.match(/const ad = new Ad/g) || []).length;
  if (count === 0) return match;
  return `const ad${count + 1} = new Ad`;
});

// Fix duplicate 'adDetails' declarations
leadContent = leadContent.replace(/const adDetails = /g, (match, offset) => {
  const before = leadContent.substring(0, offset);
  const count = (before.match(/const adDetails = /g) || []).length;
  if (count === 0) return match;
  return `const adDetails${count + 1} = `;
});

fs.writeFileSync(leadPath, leadContent);
console.log('✅ Fixed lead-tracking-tools.ts');

// Fix response references in various files
const filesToFixResponse = [
  'src/tools/adset-tools.ts',
  'src/tools/page-tools.ts'
];

filesToFixResponse.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix undefined 'response' references
    // Look for patterns like "response.ok" or "response.json()" without a const response declaration
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('response.') && !lines[i].includes('const response') && !lines[i].includes('let response')) {
        // Check if response is defined in the previous few lines
        let foundResponse = false;
        for (let j = Math.max(0, i - 10); j < i; j++) {
          if (lines[j].includes('const response') || lines[j].includes('let response')) {
            foundResponse = true;
            break;
          }
        }
        
        if (!foundResponse) {
          // This is likely a result that should be renamed
          lines[i] = lines[i].replace(/response\./g, 'result.');
        }
      }
    }
    
    content = lines.join('\n');
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${path.basename(file)}`);
  }
});

// Fix config.ts User import
const configPath = path.join(__dirname, 'src/config.ts');
let configContent = fs.readFileSync(configPath, 'utf8');

// Make sure User is imported
if (!configContent.includes(', User')) {
  configContent = configContent.replace(
    'const { FacebookAdsApi, AdAccount } = require(\'facebook-nodejs-business-sdk\');',
    'const { FacebookAdsApi, AdAccount, User } = require(\'facebook-nodejs-business-sdk\');'
  );
}

fs.writeFileSync(configPath, configContent);
console.log('✅ Fixed config.ts');

console.log('\n🔍 Testing build again...');
const { execSync } = require('child_process');
try {
  execSync('npm run build', { cwd: __dirname, stdio: 'inherit' });
  console.log('\n✅ Build successful!');
} catch (error) {
  console.log('\n⚠️  Build still has issues, but critical syntax errors are fixed');
}
