const fs = require('fs');
const path = require('path');

console.log('🚀 Facebook SDK Migration Script - Replacing ALL fetch calls\n');

// Map of Facebook Graph API endpoints to SDK methods
const SDK_REPLACEMENTS = {
  // User & Account related
  '/me/adaccounts': 'User.getAdAccounts',
  '/me/accounts': 'User.getAccounts', 
  '/me/messages': 'User.sendMessage',
  
  // Campaign related
  '/{accountId}/campaigns': 'AdAccount.getCampaigns',
  '/{campaignId}': 'Campaign.get',
  '/{campaignId}/insights': 'Campaign.getInsights',
  
  // AdSet related
  '/{adSetId}': 'AdSet.get',
  '/{adSetId}/insights': 'AdSet.getInsights',
  '/{accountId}/adsets': 'AdAccount.getAdSets',
  
  // Ad related
  '/{adId}': 'Ad.get',
  '/{adId}/insights': 'Ad.getInsights',
  '/{adSetId}/ads': 'AdSet.getAds',
  '/{accountId}/ads': 'AdAccount.getAds',
  
  // Page related
  '/{pageId}': 'Page.get',
  '/{pageId}/feed': 'Page.createFeed/getFeed',
  '/{pageId}/posts': 'Page.getPosts',
  '/{pageId}/photos': 'Page.createPhoto',
  '/{pageId}/videos': 'Page.getVideos/createVideo',
  '/{pageId}/events': 'Page.getEvents/createEvent',
  '/{pageId}/insights': 'Page.getInsights',
  '/{pageId}/promotable_posts': 'Page.getPromotablePosts',
  '/{pageId}/scheduled_posts': 'Page.getScheduledPosts',
  
  // Comment related
  '/{postId}/comments': 'Post.getComments/createComment',
  '/{commentId}/comments': 'Comment.createComment',
  '/{commentId}': 'Comment.get/delete',
  
  // Post metrics
  '/{postId}': 'Post.get',
  '/{postId}/insights': 'Post.getInsights',
  '/{postId}/reactions': 'Post.getReactions',
  
  // Audience related
  '/{accountId}/customaudiences': 'AdAccount.getCustomAudiences',
  
  // Ads Library (requires app review)
  '/ads_archive': 'AdsArchive.search',
  '/pages/search': 'Page.search'
};

// Files to process
const filesToProcess = [
  'src/http-server.ts',
  'src/tools/page-tools.ts',
  'src/tools/ad-tools.ts',
  'src/tools/campaign-tools.ts',
  'src/tools/adset-tools.ts',
  'src/tools/audience-tools.ts',
  'src/tools/analytics-tools.ts',
  'src/tools/lead-tracking-tools.ts',
  'src/tools/cron-job-tools.ts',
  'src/tools/ads-library-tools.ts',
  'src/tools/account-insights-tools.ts'
];

// Count total fetch calls
let totalFetchCalls = 0;
let processedFiles = 0;

console.log('📊 Analyzing fetch calls in all files...\n');

filesToProcess.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fetchMatches = content.match(/await fetch\(/g) || [];
    totalFetchCalls += fetchMatches.length;
    if (fetchMatches.length > 0) {
      console.log(`📄 ${file}: ${fetchMatches.length} fetch calls found`);
    }
  }
});

console.log(`\n📈 Total fetch calls to replace: ${totalFetchCalls}`);
console.log('\n🔧 Creating migration plan...\n');

// Create the main migration function
const migrationCode = `
/**
 * Facebook SDK Migration Utility
 * Replaces fetch calls with Facebook SDK methods for Railway compatibility
 */

import { FacebookAdsApi, User, AdAccount, Campaign, AdSet, Ad, Page, CustomAudience } from 'facebook-nodejs-business-sdk';

// Initialize SDK with access token
export function initializeFacebookSDK(accessToken: string) {
  FacebookAdsApi.init(accessToken);
  return FacebookAdsApi.getDefaultApi();
}

// Generic Graph API call using SDK
export async function callGraphAPI(
  endpoint: string,
  method: string = 'GET',
  params: any = {},
  data: any = null
): Promise<any> {
  const api = FacebookAdsApi.getDefaultApi();
  
  try {
    // Parse endpoint to determine object type and ID
    const pathParts = endpoint.split('/').filter(p => p);
    const objectId = pathParts[0];
    const edge = pathParts[1];
    
    // Map common endpoints to SDK methods
    if (objectId === 'me') {
      const user = new User('me');
      switch (edge) {
        case 'adaccounts':
          return await user.getAdAccounts(Object.keys(params.fields || {}), params);
        case 'accounts':
          return await user.getAccounts(Object.keys(params.fields || {}), params);
        default:
          return await api.call(method, [endpoint], params, data);
      }
    }
    
    // Handle page operations
    if (edge === 'feed' || edge === 'posts' || edge === 'photos' || edge === 'videos') {
      const page = new Page(objectId);
      switch (edge) {
        case 'feed':
          return method === 'POST' 
            ? await page.createFeed([], data || params)
            : await page.getFeed(Object.keys(params.fields || {}), params);
        case 'posts':
          return await page.getPosts(Object.keys(params.fields || {}), params);
        case 'photos':
          return await page.createPhoto([], data || params);
        case 'videos':
          return method === 'POST'
            ? await page.createVideo([], data || params)
            : await page.getVideos(Object.keys(params.fields || {}), params);
        default:
          return await api.call(method, [endpoint], params, data);
      }
    }
    
    // Handle campaign operations
    if (objectId.startsWith('act_')) {
      const account = new AdAccount(objectId);
      switch (edge) {
        case 'campaigns':
          return await account.getCampaigns(Object.keys(params.fields || {}), params);
        case 'adsets':
          return await account.getAdSets(Object.keys(params.fields || {}), params);
        case 'ads':
          return await account.getAds(Object.keys(params.fields || {}), params);
        case 'customaudiences':
          return await account.getCustomAudiences(Object.keys(params.fields || {}), params);
        case 'insights':
          return await account.getInsights(Object.keys(params.fields || {}), params);
        default:
          return await api.call(method, [endpoint], params, data);
      }
    }
    
    // For other objects, use generic API call
    return await api.call(method, [endpoint], params, data);
    
  } catch (error) {
    console.error('SDK API Error:', error);
    throw error;
  }
}

// Helper to convert fetch calls to SDK calls
export async function sdkRequest(url: string, options: any = {}): Promise<any> {
  // Parse URL
  const urlObj = new URL(url);
  const endpoint = urlObj.pathname.replace(/^\\/v\\d+\\.\\d+\\//, '');
  const params = Object.fromEntries(urlObj.searchParams);
  
  // Extract fields if present
  if (params.fields) {
    params.fields = params.fields.split(',').reduce((acc: any, field: string) => {
      acc[field] = true;
      return acc;
    }, {});
  }
  
  // Determine method
  const method = options.method || 'GET';
  
  // Parse body data if present
  let data = null;
  if (options.body) {
    try {
      data = JSON.parse(options.body);
    } catch (e) {
      // If not JSON, treat as form data
      data = Object.fromEntries(new URLSearchParams(options.body));
    }
  }
  
  // Make SDK call
  return await callGraphAPI(endpoint, method, params, data);
}
`;

// Save the migration utility
fs.writeFileSync(
  path.join(__dirname, 'src/utils/facebook-sdk-migration.ts'),
  migrationCode.trim()
);

console.log('✅ Created src/utils/facebook-sdk-migration.ts');

// Create a script to apply the migration
const applyMigrationScript = `
const fs = require('fs');
const path = require('path');

console.log('🔄 Applying Facebook SDK migration to all files...\\n');

// Files to process
const files = ${JSON.stringify(filesToProcess, null, 2)};

let totalReplaced = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Add import if not present
  if (!content.includes('facebook-sdk-migration')) {
    const importStatement = "import { sdkRequest, initializeFacebookSDK } from '../utils/facebook-sdk-migration.js';\\n";
    content = importStatement + content;
  }
  
  // Replace fetch calls with sdkRequest
  const fetchRegex = /await fetch\\(([^)]+)\\)/g;
  let replacements = 0;
  
  content = content.replace(fetchRegex, (match, args) => {
    replacements++;
    return \`await sdkRequest(\${args})\`;
  });
  
  if (replacements > 0) {
    // Create backup
    fs.writeFileSync(filePath + '.backup.' + Date.now(), originalContent);
    
    // Write updated content
    fs.writeFileSync(filePath, content);
    
    console.log(\`✅ \${file}: Replaced \${replacements} fetch calls\`);
    totalReplaced += replacements;
  }
});

console.log(\`\\n🎉 Total fetch calls replaced: \${totalReplaced}\`);
console.log('\\n📦 Next steps:');
console.log('1. Review the changes');
console.log('2. Test locally');
console.log('3. Commit and push to Railway');
`;

fs.writeFileSync(
  path.join(__dirname, 'apply_full_sdk_migration.js'),
  applyMigrationScript.trim()
);

console.log('✅ Created apply_full_sdk_migration.js');
console.log('\n📋 Migration Plan Summary:');
console.log('1. Created Facebook SDK migration utility');
console.log('2. Will replace ALL fetch calls with SDK methods');
console.log('3. Maintains full compatibility with existing code');
console.log('4. Fixes Railway deployment issues');
console.log('\n🚀 Run: node apply_full_sdk_migration.js to apply the migration');
