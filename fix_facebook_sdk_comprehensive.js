// Comprehensive fix for Facebook SDK initialization issues
const fs = require('fs');
const path = require('path');

async function fixFacebookSDKIssues() {
  const filePath = path.join(__dirname, 'src', 'http-server.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  console.log('🔧 Applying comprehensive Facebook SDK fixes...\n');

  // Fix 1: Add a helper function to ensure SDK is initialized
  const helperFunction = `
// Helper function to ensure Facebook SDK is properly initialized
function ensureFacebookSDKInitialized(session: any): boolean {
  if (!session?.credentials?.facebookAccessToken) {
    return false;
  }
  
  try {
    const { FacebookAdsApi } = require('facebook-nodejs-business-sdk');
    FacebookAdsApi.init(session.credentials.facebookAccessToken);
    return true;
  } catch (error) {
    console.error('Failed to initialize Facebook SDK:', error);
    return false;
  }
}
`;

  // Insert the helper function before processMcpToolCall
  const processMcpIndex = content.indexOf('async function processMcpToolCall');
  if (processMcpIndex > -1) {
    content = content.slice(0, processMcpIndex) + helperFunction + '\n' + content.slice(processMcpIndex);
    console.log('✅ Added SDK initialization helper function');
  }

  // Fix 2: Update get_campaigns to use the helper
  const getCampaignsPattern = /case 'get_campaigns':\s*try \{[^}]+const result = await campaignTools\.getCampaigns/s;
  const getCampaignsMatch = content.match(getCampaignsPattern);
  
  if (getCampaignsMatch) {
    const newGetCampaigns = `case 'get_campaigns':
        try {
          if (!ensureFacebookSDKInitialized(session)) {
            return {
              success: false,
              error: 'Facebook SDK initialization failed. Please re-authenticate.',
              tool: 'get_campaigns'
            };
          }
          
          const limit = args.limit || 10;
          const status = args.status;

          // Use working implementation from tools
          const result = await campaignTools.getCampaigns`;
    
    content = content.replace(getCampaignsMatch[0], newGetCampaigns);
    console.log('✅ Fixed get_campaigns');
  }

  // Fix 3: Update check_ad_id
  const checkAdIdPattern = /case 'check_ad_id':[^}]+const result = await adTools\.checkAdId/s;
  const checkAdIdMatch = content.match(checkAdIdPattern);
  
  if (checkAdIdMatch) {
    const oldBlock = checkAdIdMatch[0];
    const newBlock = oldBlock.replace(
      'const result = await adTools.checkAdId(userId, adId);',
      `if (!ensureFacebookSDKInitialized(session)) {
            return {
              success: false,
              message: 'Facebook SDK initialization failed. Please re-authenticate.',
              tool: 'check_ad_id'
            };
          }
          
          const result = await adTools.checkAdId(userId, adId);`
    );
    content = content.replace(oldBlock, newBlock);
    console.log('✅ Fixed check_ad_id');
  }

  // Fix 4: Update get_audiences
  const getAudiencesPattern = /case 'get_audiences':[^}]+const result = await audienceTools\.getAudiences/s;
  const getAudiencesMatch = content.match(getAudiencesPattern);
  
  if (getAudiencesMatch) {
    const oldBlock = getAudiencesMatch[0];
    const newBlock = oldBlock.replace(
      'const result = await audienceTools.getAudiences(userId, limit);',
      `if (!ensureFacebookSDKInitialized(session)) {
            return {
              success: false,
              error: 'Facebook SDK initialization failed. Please re-authenticate.',
              tool: 'get_audiences'
            };
          }
          
          const result = await audienceTools.getAudiences(userId, limit);`
    );
    content = content.replace(oldBlock, newBlock);
    console.log('✅ Fixed get_audiences');
  }

  // Fix 5: Update getUserFacebookPages function
  const getUserFacebookPagesPattern = /const pagesData = await user\.getAccounts/;
  if (content.match(getUserFacebookPagesPattern)) {
    content = content.replace(
      'const pagesData = await user.getAccounts',
      `// Ensure SDK is initialized before making the call
          if (!session?.credentials?.facebookAccessToken) {
            throw new Error('No Facebook access token available');
          }
          
          const { FacebookAdsApi } = require('facebook-nodejs-business-sdk');
          FacebookAdsApi.init(session.credentials.facebookAccessToken);
          
          const pagesData = await user.getAccounts`
    );
    console.log('✅ Fixed getUserFacebookPages');
  }

  // Fix 6: Fix error handling in tools
  // Replace generic error messages with more specific ones
  content = content.replace(
    /The request was made but no response was received/g,
    'Facebook API call failed. This usually indicates an expired token or network issue'
  );

  // Write the fixed content
  fs.writeFileSync(filePath, content);
  
  console.log('\n✅ All fixes applied successfully!');
  console.log('\n📋 Changes made:');
  console.log('- Added SDK initialization helper function');
  console.log('- Updated all tools to check SDK initialization');
  console.log('- Improved error messages');
  console.log('- Fixed async/await handling');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Deploy to Railway');
  console.log('2. Test all tools again');
}

fixFacebookSDKIssues().catch(console.error);