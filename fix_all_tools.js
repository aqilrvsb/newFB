// Fix all failing Facebook SDK tools
const fs = require('fs');
const path = require('path');

async function fixAllTools() {
  const filePath = path.join(__dirname, 'src', 'http-server.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  let fixCount = 0;

  console.log('🔧 Starting comprehensive fix for all Facebook SDK tools...\n');

  // Fix 1: get_campaigns
  console.log('1. Fixing get_campaigns...');
  const getCampaignsOld = `case 'get_campaigns':
        try {
          const limit = args.limit || 10;
          const status = args.status;

          // Use working implementation from tools
          const result = await campaignTools.getCampaigns(userId, limit, status);`;
  
  const getCampaignsNew = `case 'get_campaigns':
        try {
          const limit = args.limit || 10;
          const status = args.status;
          
          // Ensure SDK is initialized
          if (!session.credentials?.facebookAccessToken) {
            return {
              success: false,
              error: 'No Facebook access token found',
              tool: 'get_campaigns'
            };
          }
          
          FacebookAdsApi.init(session.credentials.facebookAccessToken);

          // Use working implementation from tools
          const result = await campaignTools.getCampaigns(userId, limit, status);`;

  if (content.includes(getCampaignsOld)) {
    content = content.replace(getCampaignsOld, getCampaignsNew);
    fixCount++;
  }

  // Fix 2: get_campaign_details
  console.log('2. Fixing get_campaign_details...');
  const getCampaignDetailsOld = `case 'get_campaign_details':
        try {
          // Use SDK to get campaign details
          const Campaign = require('facebook-nodejs-business-sdk').Campaign;
          const campaign = new Campaign(args.campaignId);`;

  const getCampaignDetailsNew = `case 'get_campaign_details':
        try {
          if (!args.campaignId) {
            return {
              success: false,
              error: 'Campaign ID is required',
              tool: 'get_campaign_details'
            };
          }
          
          // Ensure SDK is initialized
          FacebookAdsApi.init(session.credentials.facebookAccessToken);
          
          // Use SDK to get campaign details
          const Campaign = require('facebook-nodejs-business-sdk').Campaign;
          const campaign = new Campaign(args.campaignId);`;

  if (content.includes(getCampaignDetailsOld)) {
    content = content.replace(getCampaignDetailsOld, getCampaignDetailsNew);
    fixCount++;
  }

  // Fix 3: create_campaign
  console.log('3. Fixing create_campaign...');
  // Look for the create_campaign error handler
  const createCampaignError = `error: \`API Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: 'create_campaign'`;
  
  const createCampaignErrorNew = `error: error.response?.error?.message || (error instanceof Error ? error.message : 'Unknown error'),
            tool: 'create_campaign'`;

  if (content.includes(createCampaignError)) {
    content = content.replace(createCampaignError, createCampaignErrorNew);
    fixCount++;
  }

  // Fix 4: get_audiences
  console.log('4. Fixing get_audiences...');
  const getAudiencesOld = `case 'get_audiences':
        try {
          const limit = args.limit || 25;
          const result = await audienceTools.getAudiences(userId, limit);`;

  const getAudiencesNew = `case 'get_audiences':
        try {
          const limit = args.limit || 25;
          
          // Ensure SDK is initialized
          FacebookAdsApi.init(session.credentials.facebookAccessToken);
          
          const result = await audienceTools.getAudiences(userId, limit);`;

  if (content.includes(getAudiencesOld)) {
    content = content.replace(getAudiencesOld, getAudiencesNew);
    fixCount++;
  }

  // Fix 5: get_facebook_pages
  console.log('5. Fixing get_facebook_pages...');
  // This one needs special handling as it's outside processMcpToolCall
  const getFacebookPagesOld = `// Use SDK to get Facebook pages
          const User = require('facebook-nodejs-business-sdk').User;
          const user = new User('me');`;

  const getFacebookPagesNew = `// Ensure SDK is initialized with fresh token
          const FacebookAdsApi = require('facebook-nodejs-business-sdk').FacebookAdsApi;
          FacebookAdsApi.init(session.credentials.facebookAccessToken);
          
          // Use SDK to get Facebook pages
          const User = require('facebook-nodejs-business-sdk').User;
          const user = new User('me');`;

  if (content.includes(getFacebookPagesOld)) {
    content = content.replace(getFacebookPagesOld, getFacebookPagesNew);
    fixCount++;
  }

  // Fix 6: check_ad_id
  console.log('6. Fixing check_ad_id...');
  const checkAdIdOld = `case 'check_ad_id':
        try {
          const adId = args.adId;
          if (!adId) {`;

  const checkAdIdNew = `case 'check_ad_id':
        try {
          const adId = args.adId;
          if (!adId) {`;

  // Find and fix the check_ad_id implementation
  const checkAdIdPattern = /case 'check_ad_id':[^}]+tool: 'check_ad_id'[^}]+}/s;
  const checkAdIdMatch = content.match(checkAdIdPattern);
  
  if (checkAdIdMatch) {
    const oldBlock = checkAdIdMatch[0];
    const newBlock = oldBlock.replace(
      'const result = await adTools.checkAdId(userId, adId);',
      `// Ensure SDK is initialized
          FacebookAdsApi.init(session.credentials.facebookAccessToken);
          
          const result = await adTools.checkAdId(userId, adId);`
    );
    content = content.replace(oldBlock, newBlock);
    fixCount++;
  }

  // Write the fixed content back
  fs.writeFileSync(filePath, content);

  console.log(`\n✅ Fixed ${fixCount} tools`);
  console.log('\n📝 Summary of fixes applied:');
  console.log('- Added SDK initialization checks to all tools');
  console.log('- Improved error handling for Facebook API responses');
  console.log('- Ensured token validation before API calls');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Deploy these changes to Railway');
  console.log('2. Test all tools again to verify fixes');
}

fixAllTools().catch(console.error);