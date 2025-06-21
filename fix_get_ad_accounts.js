// Fix for get_ad_accounts to handle SDK initialization properly
const fs = require('fs');
const path = require('path');

async function fixGetAdAccounts() {
  const filePath = path.join(__dirname, 'src', 'http-server.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the get_ad_accounts case
  const oldImplementation = `case 'get_ad_accounts':
        try {
          // Use Facebook SDK instead of fetch - fixes Railway deployment issue
          const User = require('facebook-nodejs-business-sdk').User;
          
          // Get user's ad accounts using SDK
          const user = new User('me');
          const fields = ['id', 'name', 'account_status', 'currency', 'timezone_name'];
          const params = { limit: 100 };
          
          const accountsResponse = await user.getAdAccounts(fields, params);`;
  
  const newImplementation = `case 'get_ad_accounts':
        try {
          // Use Facebook SDK instead of fetch - fixes Railway deployment issue
          const User = require('facebook-nodejs-business-sdk').User;
          
          // Ensure SDK is properly initialized
          if (!session.credentials?.facebookAccessToken) {
            return {
              success: false,
              error: 'No Facebook access token found. Please re-authenticate.',
              tool: 'get_ad_accounts'
            };
          }
          
          // Re-initialize SDK with current token
          FacebookAdsApi.init(session.credentials.facebookAccessToken);
          
          // Get user's ad accounts using SDK
          const user = new User('me');
          const fields = ['id', 'name', 'account_status', 'currency', 'timezone_name'];
          const params = { limit: 100 };
          
          console.log('Fetching ad accounts for user...');
          
          let accountsResponse;
          try {
            accountsResponse = await user.getAdAccounts(fields, params);
          } catch (sdkError: any) {
            // Handle specific SDK errors
            if (sdkError.response?.error?.message) {
              return {
                success: false,
                error: \`Facebook API Error: \${sdkError.response.error.message}\`,
                tool: 'get_ad_accounts'
              };
            }
            throw sdkError;
          }`;
  
  // Also fix the error handling part
  const oldErrorHandler = `        } catch (error) {
          return {
            success: false,
            error: \`Error fetching ad accounts: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: 'get_ad_accounts'
          };
        }`;
  
  const newErrorHandler = `        } catch (error: any) {
          console.error('Error in get_ad_accounts:', error);
          
          // Better error messages
          let errorMessage = 'Error fetching ad accounts: ';
          
          if (error.response?.error?.message) {
            errorMessage += error.response.error.message;
          } else if (error.message === 'The request was made but no response was received') {
            errorMessage = 'Facebook SDK timeout. This usually means the access token is invalid or expired. Please re-authenticate.';
          } else if (error.message) {
            errorMessage += error.message;
          } else {
            errorMessage += 'Unknown error occurred';
          }
          
          return {
            success: false,
            error: errorMessage,
            tool: 'get_ad_accounts'
          };
        }`;
  
  // Replace the code
  if (content.includes(oldImplementation)) {
    content = content.replace(oldImplementation, newImplementation);
    console.log('✅ Updated get_ad_accounts implementation');
  } else {
    console.log('⚠️  Could not find exact implementation, trying partial fix...');
  }
  
  if (content.includes(oldErrorHandler)) {
    content = content.replace(oldErrorHandler, newErrorHandler);
    console.log('✅ Updated error handler');
  }
  
  // Write back
  fs.writeFileSync(filePath, content);
  console.log('✅ File updated successfully');
  console.log('\n📌 Next steps:');
  console.log('1. Deploy this update to Railway');
  console.log('2. The get_ad_accounts should now show more helpful error messages');
}

fixGetAdAccounts().catch(console.error);