const fs = require('fs');
const path = require('path');

// Fix the get_ad_accounts implementation in http-server.ts
async function fixGetAdAccounts() {
    const filePath = path.join(__dirname, 'src', 'http-server.ts');
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find and replace the get_ad_accounts case
    const oldImplementation = `case 'get_ad_accounts':
        try {
          // Get ALL user's ad accounts - just the accounts, no campaigns
          const response = await fetch(\`https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&access_token=\${session.credentials.facebookAccessToken}\`);
          const accountsData: any = await response.json();
          
          if (accountsData.error) {
            return {
              success: false,
              error: \`Facebook API Error: \${accountsData.error.message}\`,
              tool: 'get_ad_accounts'
            };
          }

          if (!accountsData.data || accountsData.data.length === 0) {
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

          const accounts = accountsData.data.map((account: any) => ({
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

    const newImplementation = `case 'get_ad_accounts':
        try {
          // Use Facebook SDK instead of fetch
          const User = require('facebook-nodejs-business-sdk').User;
          
          // Initialize API with user's token
          FacebookAdsApi.init(session.credentials.facebookAccessToken);
          
          // Get user's ad accounts using SDK
          const user = new User('me');
          const fields = ['id', 'name', 'account_status', 'currency', 'timezone_name'];
          const params = { limit: 100 };
          
          const accountsData = await user.getAdAccounts(fields, params);
          
          if (!accountsData || accountsData.length === 0) {
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

          const accounts = accountsData.map((account: any) => ({
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

    // Replace the implementation
    if (content.includes('case \'get_ad_accounts\':')) {
        // Find the exact location and replace
        const startIndex = content.indexOf('case \'get_ad_accounts\':');
        const endIndex = content.indexOf('case \'get_campaigns\':', startIndex);
        
        if (startIndex !== -1 && endIndex !== -1) {
            const oldSection = content.substring(startIndex, endIndex).trim();
            content = content.replace(oldSection, newImplementation);
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('✅ Successfully updated get_ad_accounts implementation');
            return true;
        }
    }
    
    console.error('❌ Could not find get_ad_accounts case in http-server.ts');
    return false;
}

// Run the fix
fixGetAdAccounts().then(success => {
    if (success) {
        console.log('\n🎉 Fix applied successfully!');
        console.log('Next steps:');
        console.log('1. Commit the changes: git add -A && git commit -m "Fix: Replace fetch with Facebook SDK for get_ad_accounts"');
        console.log('2. Push to Railway: git push origin main');
        console.log('3. Railway will automatically redeploy with the fix');
    }
});
