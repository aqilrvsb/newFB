const fs = require('fs');
const path = require('path');

// Script to replace all fetch calls with Facebook SDK methods
async function replaceFetchWithSDK() {
    console.log('🔧 Replacing fetch calls with Facebook SDK methods...\n');
    
    const srcDir = path.join(__dirname, 'src');
    
    // Fix 1: Add a utility function to handle Graph API calls using SDK
    const utilityFunction = `
// Utility function to make Graph API calls using SDK instead of fetch
async function makeGraphAPICall(endpoint: string, method: string = 'GET', data?: any, accessToken?: string): Promise<any> {
  const FacebookAdsApi = require('facebook-nodejs-business-sdk').FacebookAdsApi;
  const api = accessToken ? new FacebookAdsApi(accessToken) : FacebookAdsApi.getDefaultApi();
  
  try {
    // Parse the endpoint to extract the path and params
    const url = new URL(endpoint, 'https://graph.facebook.com');
    const path = url.pathname.replace('/v23.0/', '').replace('/v18.0/', '');
    const params = Object.fromEntries(url.searchParams);
    
    // Use SDK's call method
    const response = await api.call(
      method,
      [path],
      params,
      data
    );
    
    return response;
  } catch (error) {
    console.error('Graph API Error:', error);
    throw error;
  }
}
`;

    // Fix 2: Create a sed-like replacement for http-server.ts
    const httpServerFix = `
// In http-server.ts, replace the get_ad_accounts case:
case 'get_ad_accounts':
  try {
    const User = require('facebook-nodejs-business-sdk').User;
    const AdAccount = require('facebook-nodejs-business-sdk').AdAccount;
    
    // Get user's ad accounts using SDK
    const user = new User('me');
    const fields = ['id', 'name', 'account_status', 'currency', 'timezone_name'];
    const params = { limit: 100 };
    
    const accountsResponse = await user.getAdAccounts(fields, params);
    
    if (!accountsResponse || accountsResponse.length === 0) {
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

    const accounts = accountsResponse.map((account: any) => ({
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
  }
`;

    console.log('✅ Created replacement functions');
    console.log('\n📝 Next steps:');
    console.log('1. Add the makeGraphAPICall utility function to your codebase');
    console.log('2. Replace fetch calls with SDK methods as shown above');
    console.log('3. For page-related calls, use the Page class from SDK');
    console.log('4. For ad-related calls, use AdAccount, Campaign, AdSet, Ad classes');
    
    // Save the fixes to a file
    fs.writeFileSync('fix_fetch_to_sdk.md', `
# Fix for Fetch to Facebook SDK Migration

## Problem
The \`fetch\` API is not working on Railway deployment, causing "fetch failed" errors.

## Solution
Replace all fetch calls with Facebook SDK methods.

## Utility Function
Add this to your codebase:

\`\`\`typescript
${utilityFunction}
\`\`\`

## Example Replacements

### 1. Get Ad Accounts (http-server.ts)
\`\`\`typescript
${httpServerFix}
\`\`\`

### 2. Get Page Posts
Replace:
\`\`\`typescript
const response = await fetch(
  \`https://graph.facebook.com/v23.0/\${pageId}/posts?fields=id,message&access_token=\${token}\`
);
const data = await response.json();
\`\`\`

With:
\`\`\`typescript
const Page = require('facebook-nodejs-business-sdk').Page;
const page = new Page(pageId);
const posts = await page.getPosts(['id', 'message'], { limit: 25 });
\`\`\`

### 3. Create Post
Replace:
\`\`\`typescript
await fetch(\`https://graph.facebook.com/v23.0/\${pageId}/feed\`, {
  method: 'POST',
  body: JSON.stringify({ message, link })
});
\`\`\`

With:
\`\`\`typescript
const Page = require('facebook-nodejs-business-sdk').Page;
const page = new Page(pageId);
await page.createFeed([], { message, link });
\`\`\`

## Key SDK Classes to Use:
- User: for user-related calls
- AdAccount: for ad account operations  
- Campaign: for campaign operations
- AdSet: for ad set operations
- Ad: for ad operations
- Page: for page operations
- Creative: for creative operations

## Note
The Facebook SDK handles authentication automatically when you initialize it with:
\`\`\`typescript
FacebookAdsApi.init(accessToken);
\`\`\`
`);
    
    console.log('\n✅ Saved detailed fix instructions to fix_fetch_to_sdk.md');
}

replaceFetchWithSDK();
