const fs = require('fs');
const path = require('path');

console.log('🔧 Applying Facebook SDK fix for Railway deployment...\n');

// Read the http-server.ts file
const filePath = path.join(__dirname, 'src', 'http-server.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Replace the get_ad_accounts implementation
const getAdAccountsFix = `      case 'get_ad_accounts':
        try {
          // Use Facebook SDK instead of fetch - fixes Railway deployment issue
          const User = require('facebook-nodejs-business-sdk').User;
          
          // Get user's ad accounts using SDK
          const user = new User('me');
          const fields = ['id', 'name', 'account_status', 'currency', 'timezone_name'];
          const params = { limit: 100 };
          
          const accountsResponse = await user.getAdAccounts(fields, params);
          
          // Convert to array if needed
          const accountsArray = Array.isArray(accountsResponse) ? accountsResponse : accountsResponse.data || [];
          
          if (accountsArray.length === 0) {
            return {
              success: true,
              tool: 'get_ad_accounts',
              result: {
                accounts: [],
                total: 0,
                message: 'No ad accounts found for this user'
              }
            };
          }

          const accounts = accountsArray.map((account: any) => ({
            id: account.id,
            name: account.name,
            status: account.account_status,
            currency: account.currency,
            timezone: account.timezone_name
          }));

          return {
            success: true,
            tool: 'get_ad_accounts',
            result: {
              accounts: accounts,
              total: accounts.length,
              message: \`Found \${accounts.length} ad account(s)\`
            }
          };
        } catch (error) {
          return {
            success: false,
            error: \`Error fetching ad accounts: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: 'get_ad_accounts'
          };
        }`;

// Find the get_ad_accounts case and replace it
const startPattern = "case 'get_ad_accounts':";
const endPattern = "case 'get_campaigns':";

const startIndex = content.indexOf(startPattern);
const endIndex = content.indexOf(endPattern, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    // Extract everything before and after the case we want to replace
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    
    // Reconstruct with our new implementation
    content = before + getAdAccountsFix + '\n        \n      ' + after;
    
    // Write the updated content back
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Successfully updated get_ad_accounts to use Facebook SDK');
} else {
    console.error('❌ Could not find get_ad_accounts case');
}

// Also create a backup of the original
fs.copyFileSync(filePath, filePath + '.backup.' + Date.now());
console.log('📦 Created backup of original file');

console.log('\n🚀 Next steps to deploy to Railway:');
console.log('1. cd "C:\\Users\\ROGSTRIX\\Music\\New folder\\newFB-main"');
console.log('2. git add -A');
console.log('3. git commit -m "Fix: Use Facebook SDK instead of fetch for Railway compatibility"');
console.log('4. git push origin main');
console.log('\nRailway will automatically redeploy with the fix!');
