const fs = require('fs');
const path = require('path');

console.log('🚀 Comprehensive Facebook SDK Migration - All Tools\n');

// This script will show how to migrate each type of Facebook API call to SDK

const migrations = {
  // Page operations
  'page_feed_post': {
    old: 'await fetch(`https://graph.facebook.com/v23.0/${pageId}/feed`, { method: \'POST\', body: ... })',
    new: `const Page = require('facebook-nodejs-business-sdk').Page;
const page = new Page(pageId);
const result = await page.createFeed([], bodyData);`
  },
  
  'page_posts_get': {
    old: 'await fetch(`https://graph.facebook.com/v23.0/${pageId}/posts?fields=...`)',
    new: `const Page = require('facebook-nodejs-business-sdk').Page;
const page = new Page(pageId);
const posts = await page.getPosts(fieldsArray, params);`
  },
  
  // Campaign operations
  'campaign_create': {
    old: 'await fetch(`https://graph.facebook.com/v23.0/act_${accountId}/campaigns`, { method: \'POST\' })',
    new: `const AdAccount = require('facebook-nodejs-business-sdk').AdAccount;
const account = new AdAccount(\`act_\${accountId}\`);
const campaign = await account.createCampaign([], campaignData);`
  },
  
  'campaign_insights': {
    old: 'await fetch(`https://graph.facebook.com/v23.0/${campaignId}/insights?...`)',
    new: `const Campaign = require('facebook-nodejs-business-sdk').Campaign;
const campaign = new Campaign(campaignId);
const insights = await campaign.getInsights(fields, params);`
  },
  
  // Ad operations
  'ad_create': {
    old: 'await fetch(`https://graph.facebook.com/v23.0/act_${accountId}/ads`, { method: \'POST\' })',
    new: `const AdSet = require('facebook-nodejs-business-sdk').AdSet;
const adset = new AdSet(adSetId);
const ad = await adset.createAd([], adData);`
  },
  
  // Comment operations
  'comment_create': {
    old: 'await fetch(`https://graph.facebook.com/v23.0/${objectId}/comments`, { method: \'POST\' })',
    new: `const api = require('facebook-nodejs-business-sdk').FacebookAdsApi.getDefaultApi();
const result = await api.call('POST', [\`\${objectId}/comments\`], {}, commentData);`
  },
  
  // Generic GET operations
  'generic_get': {
    old: 'await fetch(`https://graph.facebook.com/v23.0/${objectId}?fields=...`)',
    new: `const api = require('facebook-nodejs-business-sdk').FacebookAdsApi.getDefaultApi();
const result = await api.call('GET', [objectId], params);`
  },
  
  // DELETE operations
  'generic_delete': {
    old: 'await fetch(`https://graph.facebook.com/v23.0/${objectId}`, { method: \'DELETE\' })',
    new: `const api = require('facebook-nodejs-business-sdk').FacebookAdsApi.getDefaultApi();
await api.call('DELETE', [objectId], {});`
  }
};

console.log('📋 Migration Examples:\n');
Object.entries(migrations).forEach(([key, value]) => {
  console.log(`### ${key.replace(/_/g, ' ').toUpperCase()}`);
  console.log('Old (fetch):');
  console.log(`  ${value.old}`);
  console.log('New (SDK):');
  console.log(`  ${value.new}`);
  console.log('');
});

// Now let's create a migration helper function
const migrationHelper = `
/**
 * Facebook SDK Migration Helper
 * Use these patterns to replace fetch calls with SDK methods
 */

// Helper function to make Facebook API calls using SDK
export async function facebookApiCall(
  endpoint: string,
  method: string = 'GET',
  data?: any,
  accessToken?: string
): Promise<any> {
  const { FacebookAdsApi } = require('facebook-nodejs-business-sdk');
  
  // Initialize API with token if provided
  if (accessToken) {
    FacebookAdsApi.init(accessToken);
  }
  
  const api = FacebookAdsApi.getDefaultApi();
  
  // Remove version prefix from endpoint
  endpoint = endpoint.replace(/^\\/v\\d+\\.\\d+\\//, '');
  
  try {
    const result = await api.call(method, [endpoint], {}, data);
    return result;
  } catch (error: any) {
    if (error.response?.error) {
      throw new Error(error.response.error.message);
    }
    throw error;
  }
}

// Specific SDK methods for common operations
export const FacebookSDKHelpers = {
  // Page operations
  async createPagePost(pageId: string, data: any) {
    const { Page } = require('facebook-nodejs-business-sdk');
    const page = new Page(pageId);
    return await page.createFeed([], data);
  },
  
  async getPagePosts(pageId: string, fields: string[], params: any = {}) {
    const { Page } = require('facebook-nodejs-business-sdk');
    const page = new Page(pageId);
    return await page.getPosts(fields, params);
  },
  
  // Campaign operations
  async createCampaign(accountId: string, data: any) {
    const { AdAccount } = require('facebook-nodejs-business-sdk');
    const account = new AdAccount(accountId);
    return await account.createCampaign([], data);
  },
  
  async getCampaignInsights(campaignId: string, fields: string[], params: any = {}) {
    const { Campaign } = require('facebook-nodejs-business-sdk');
    const campaign = new Campaign(campaignId);
    return await campaign.getInsights(fields, params);
  },
  
  // Ad operations
  async createAd(adSetId: string, data: any) {
    const { AdSet } = require('facebook-nodejs-business-sdk');
    const adset = new AdSet(adSetId);
    return await adset.createAd([], data);
  },
  
  // Generic operations
  async getObject(objectId: string, fields: string[]) {
    const api = require('facebook-nodejs-business-sdk').FacebookAdsApi.getDefaultApi();
    return await api.call('GET', [objectId], { fields: fields.join(',') });
  },
  
  async deleteObject(objectId: string) {
    const api = require('facebook-nodejs-business-sdk').FacebookAdsApi.getDefaultApi();
    return await api.call('DELETE', [objectId], {});
  }
};
`;

// Save the migration helper
const helperPath = path.join(__dirname, 'facebook_sdk_migration_guide.ts');
fs.writeFileSync(helperPath, migrationHelper.trim());

console.log('\n✅ Created facebook_sdk_migration_guide.ts');
console.log('\n📌 Key Points:');
console.log('  1. Use SDK classes for specific objects (Page, Campaign, AdAccount, etc.)');
console.log('  2. Use FacebookAdsApi.getDefaultApi().call() for generic operations');
console.log('  3. Fields should be arrays, not comma-separated strings');
console.log('  4. The SDK handles authentication automatically after init');
console.log('\n🎯 To complete the migration:');
console.log('  1. Replace each fetch call with the appropriate SDK method');
console.log('  2. Test each tool to ensure it works correctly');
console.log('  3. Remove the need for node-fetch entirely for Facebook calls');
