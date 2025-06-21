const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing last Facebook fetch call in config.ts\n');

const configPath = path.join(__dirname, 'src/config.ts');
let content = fs.readFileSync(configPath, 'utf8');

// Backup
const backup = configPath + '.backup.final.' + Date.now();
fs.copyFileSync(configPath, backup);

// Add User import if not present
if (!content.includes('User') && content.includes('FacebookAdsApi')) {
  content = content.replace(
    'const { FacebookAdsApi, AdAccount } = require(\'facebook-nodejs-business-sdk\');',
    'const { FacebookAdsApi, AdAccount, User } = require(\'facebook-nodejs-business-sdk\');'
  );
}

// Replace the fetch call
content = content.replace(
  /const response = await fetch\(`https:\/\/graph\.facebook\.com\/v18\.0\/me\/adaccounts\?fields=id,name,account_status,currency,timezone_name&access_token=\${accessToken}`\);\s*const result: any = await response\.json\(\);/g,
  `// Use SDK instead of fetch
    const user = new User('me');
    const accountsData = await user.getAdAccounts(
      ['id', 'name', 'account_status', 'currency', 'timezone_name'],
      { limit: 100 }
    );
    const result = { data: accountsData };`
);

fs.writeFileSync(configPath, content);
console.log('✅ Fixed config.ts - replaced fetch with SDK call');

// Verify
const newContent = fs.readFileSync(configPath, 'utf8');
const remaining = (newContent.match(/fetch\([^)]*graph\.facebook\.com/g) || []).length;
console.log(`\n✅ Verification: ${remaining} Facebook fetch calls remaining in config.ts`);
