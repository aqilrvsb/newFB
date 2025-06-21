const fs = require('fs');
const path = require('path');

console.log('🎯 Direct Facebook SDK Integration - No wrapper needed\n');

// Remove the polyfill and just fix get_ad_accounts directly
const httpServerPath = path.join(__dirname, 'src/http-server.ts');
let content = fs.readFileSync(httpServerPath, 'utf8');

// Remove the polyfill we just added
const polyfillStart = content.indexOf('// Polyfill for fetch');
const polyfillEnd = content.indexOf('};', polyfillStart) + 2;
if (polyfillStart !== -1) {
  content = content.slice(0, polyfillStart) + content.slice(polyfillEnd + 1);
}

// Now let's properly fix the get_ad_accounts case with SDK
const getAdAccountsOld = `case 'get_ad_accounts':
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

// Check if it's already using SDK
if (content.includes('case \'get_ad_accounts\':') && content.includes('await fetch(`https://graph.facebook.com')) {
  // Find and replace the get_ad_accounts implementation
  const caseStart = content.indexOf('case \'get_ad_accounts\':');
  const nextCase = content.indexOf('case \'', caseStart + 20);
  
  if (caseStart !== -1 && nextCase !== -1) {
    const beforeCase = content.substring(0, caseStart);
    const afterCase = content.substring(nextCase);
    content = beforeCase + getAdAccountsOld + '\n        \n      ' + afterCase;
  }
}

fs.writeFileSync(httpServerPath, content);
console.log('✅ Fixed get_ad_accounts in http-server.ts to use SDK directly');

// Now let's add node-fetch as a dependency for non-Facebook URLs
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add node-fetch for other fetch calls (non-Facebook)
if (!packageJson.dependencies['node-fetch']) {
  packageJson.dependencies['node-fetch'] = '^2.6.7';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Added node-fetch@2.6.7 to dependencies for non-Facebook fetch calls');
}

// Add global fetch polyfill for Node.js environments
const indexPath = path.join(__dirname, 'src/index.ts');
let indexContent = fs.readFileSync(indexPath, 'utf8');

if (!indexContent.includes('global.fetch')) {
  const polyfill = `
// Add fetch polyfill for Node.js environment
if (!global.fetch) {
  const fetch = require('node-fetch');
  global.fetch = fetch;
  global.Headers = fetch.Headers;
  global.Request = fetch.Request;
  global.Response = fetch.Response;
}
`;
  
  indexContent = polyfill + '\n' + indexContent;
  fs.writeFileSync(indexPath, indexContent);
  console.log('✅ Added fetch polyfill to index.ts');
}

console.log('\n✅ Done! Changes:');
console.log('  1. get_ad_accounts now uses Facebook SDK directly');
console.log('  2. Added node-fetch@2.6.7 for other non-Facebook fetch calls');
console.log('  3. Added global fetch polyfill in index.ts');
console.log('\n📦 Note: Railway will need to run npm install to get node-fetch');
