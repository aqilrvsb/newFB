const fs = require('fs');
const path = require('path');

console.log('🚀 FULL Facebook SDK Migration - Starting comprehensive migration of ALL tools\n');

// Helper function to backup a file
function backupFile(filePath) {
  const backupPath = filePath + '.backup.' + Date.now();
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

// Helper to add SDK imports if not present
function ensureSDKImports(content, imports) {
  const importStatements = imports.map(imp => 
    `const { ${imp} } = require('facebook-nodejs-business-sdk');`
  ).join('\n');
  
  // Add after other imports
  const lastImportIndex = content.lastIndexOf('import ');
  if (lastImportIndex !== -1) {
    const lineEnd = content.indexOf('\n', lastImportIndex);
    return content.slice(0, lineEnd + 1) + '\n' + importStatements + '\n' + content.slice(lineEnd + 1);
  }
  return importStatements + '\n\n' + content;
}

// Main migration function
async function migrateAllTools() {
  console.log('📋 Starting migration of all Facebook API calls to SDK...\n');
  
  // 1. First, let's migrate http-server.ts
  console.log('1️⃣ Migrating http-server.ts...');
  const httpServerPath = path.join(__dirname, 'src/http-server.ts');
  let httpContent = fs.readFileSync(httpServerPath, 'utf8');
  const httpBackup = backupFile(httpServerPath);
  
  // Add SDK imports at the top
  if (!httpContent.includes('FacebookAdsApi, User, AdAccount')) {
    const sdkImports = `
// Facebook SDK imports for all operations
const { 
  FacebookAdsApi, 
  User, 
  AdAccount, 
  Campaign, 
  AdSet, 
  Ad,
  Page,
  AdCreative,
  CustomAudience,
  Business
} = require('facebook-nodejs-business-sdk');
`;
    const lastImportIndex = httpContent.lastIndexOf('import ');
    const lineEnd = httpContent.indexOf('\n', lastImportIndex);
    httpContent = httpContent.slice(0, lineEnd + 1) + sdkImports + httpContent.slice(lineEnd + 1);
  }
  
  // Replace get_facebook_pages
  httpContent = httpContent.replace(
    /const response = await fetch\(\s*`https:\/\/graph\.facebook\.com\/v\d+\.\d+\/me\/accounts\?[^`]+`\s*\);[\s\S]*?const pagesData[^;]+;/g,
    `// Use SDK for getting pages
        const user = new User('me');
        const pagesResponse = await user.getAccounts(
          ['id', 'name', 'access_token', 'category', 'tasks'],
          { limit: 100 }
        );
        const pagesData = { data: pagesResponse };`
  );
  
  // Replace page insights calls
  httpContent = httpContent.replace(
    /const response = await fetch\(\s*`https:\/\/graph\.facebook\.com\/v\d+\.\d+\/${args\.pageId}\/insights\?[^`]+`\s*\);/g,
    `const page = new Page(args.pageId);
        const insightsData = await page.getInsights(
          args.metrics || ['page_impressions', 'page_engaged_users'],
          { period: args.period || 'day' }
        );
        const response = { json: async () => ({ data: insightsData }) };`
  );
  
  // Replace generic page operations
  httpContent = httpContent.replace(
    /const response = await fetch\(\s*`https:\/\/graph\.facebook\.com\/v\d+\.\d+\/${args\.pageId}\?[^`]+`\s*\);/g,
    `const page = new Page(args.pageId);
        const pageData = await page.get(['id', 'name', 'about', 'category', 'fan_count', 'website', 'phone', 'emails', 'location']);
        const response = { json: async () => pageData };`
  );
  
  fs.writeFileSync(httpServerPath, httpContent);
  console.log(`✅ http-server.ts migrated (backup: ${path.basename(httpBackup)})`);
  
  // 2. Migrate page-tools.ts
  console.log('\n2️⃣ Migrating page-tools.ts...');
  const pageToolsPath = path.join(__dirname, 'src/tools/page-tools.ts');
  let pageContent = fs.readFileSync(pageToolsPath, 'utf8');
  const pageBackup = backupFile(pageToolsPath);
  
  // Add SDK imports
  pageContent = ensureSDKImports(pageContent, ['FacebookAdsApi', 'Page', 'User']);
  
  // Replace all page post creation
  pageContent = pageContent.replace(
    /const response = await fetch\(\s*`https:\/\/graph\.facebook\.com\/[^/]+\/${pageId}\/feed`,\s*{\s*method: 'POST',[^}]+}\s*\);/g,
    `const page = new Page(pageId);
    const result = await page.createFeed([], params);
    const response = { 
      ok: true, 
      json: async () => ({ id: result.id, success: true }) 
    };`
  );
  
  // Replace page posts fetching
  pageContent = pageContent.replace(
    /const response = await fetch\(\s*`https:\/\/graph\.facebook\.com\/[^/]+\/${pageId}\/posts\?[^`]+`\s*\);/g,
    `const page = new Page(pageId);
    const posts = await page.getPosts(
      ['id', 'message', 'created_time', 'from', 'shares', 'reactions.summary(true)', 'comments.summary(true)'],
      { limit }
    );
    const response = { 
      ok: true, 
      json: async () => ({ data: posts, success: true }) 
    };`
  );
  
  // Replace photo uploads
  pageContent = pageContent.replace(
    /const response = await fetch\(\s*`https:\/\/graph\.facebook\.com\/[^/]+\/${pageId}\/photos`,\s*{\s*method: 'POST',[^}]+}\s*\);/g,
    `const page = new Page(pageId);
    const result = await page.createPhoto([], params);
    const response = { 
      ok: true, 
      json: async () => ({ id: result.id, success: true }) 
    };`
  );
  
  // Replace video operations
  pageContent = pageContent.replace(
    /const response = await fetch\(\s*`https:\/\/graph\.facebook\.com\/[^/]+\/${pageId}\/videos\?[^`]+`\s*\);/g,
    `const page = new Page(pageId);
    const videos = await page.getVideos(
      ['id', 'title', 'description', 'source', 'permalink_url', 'created_time'],
      { limit }
    );
    const response = { 
      ok: true, 
      json: async () => ({ data: videos }) 
    };`
  );
  
  // Replace DELETE operations
  pageContent = pageContent.replace(
    /const response = await fetch\(\s*`https:\/\/graph\.facebook\.com\/[^/]+\/([^?]+)`,\s*{\s*method: 'DELETE'\s*}\s*\);/g,
    `const api = FacebookAdsApi.getDefaultApi();
    await api.call('DELETE', ['$1'], {});
    const response = { ok: true, json: async () => ({ success: true }) };`
  );
  
  fs.writeFileSync(pageToolsPath, pageContent);
  console.log(`✅ page-tools.ts migrated (backup: ${path.basename(pageBackup)})`);
  
  // 3. Migrate ad-tools.ts
  console.log('\n3️⃣ Migrating ad-tools.ts...');
  const adToolsPath = path.join(__dirname, 'src/tools/ad-tools.ts');
  let adContent = fs.readFileSync(adToolsPath, 'utf8');
  const adBackup = backupFile(adToolsPath);
  
  adContent = ensureSDKImports(adContent, ['FacebookAdsApi', 'Ad', 'AdSet', 'AdAccount']);
  
  // Replace ad fetching
  adContent = adContent.replace(
    /const response = await fetch\(\s*`https:\/\/graph\.facebook\.com\/[^/]+\/${adId}\?[^`]+`\s*\);/g,
    `const ad = new Ad(adId);
    const adData = await ad.get([
      'id', 'name', 'status', 'created_time', 'effective_status',
      'adset{id,name,status,campaign{id,name,objective,status}}',
      'account_id'
    ]);
    const response = { 
      ok: true, 
      json: async () => adData 
    };`
  );
  
  fs.writeFileSync(adToolsPath, adContent);
  console.log(`✅ ad-tools.ts migrated (backup: ${path.basename(adBackup)})`);
  
  // 4. Migrate campaign-tools.ts
  console.log('\n4️⃣ Migrating campaign-tools.ts...');
  const campaignToolsPath = path.join(__dirname, 'src/tools/campaign-tools.ts');
  if (fs.existsSync(campaignToolsPath)) {
    let campaignContent = fs.readFileSync(campaignToolsPath, 'utf8');
    const campaignBackup = backupFile(campaignToolsPath);
    
    campaignContent = ensureSDKImports(campaignContent, ['FacebookAdsApi', 'Campaign', 'AdAccount']);
    
    // Replace campaign creation
    campaignContent = campaignContent.replace(
      /FacebookAdsApi\.init\([^)]+\);[\s\S]*?const response = await fetch\([^)]+\/campaigns[^)]+\);/g,
      `const account = new AdAccount(adAccountId);
      const campaign = await account.createCampaign([], campaignData);
      const response = { ok: true, json: async () => ({ id: campaign.id }) };`
    );
    
    fs.writeFileSync(campaignToolsPath, campaignContent);
    console.log(`✅ campaign-tools.ts migrated (backup: ${path.basename(campaignBackup)})`);
  }
  
  // 5. Migrate account-insights-tools.ts
  console.log('\n5️⃣ Migrating account-insights-tools.ts...');
  const insightsPath = path.join(__dirname, 'src/tools/account-insights-tools.ts');
  let insightsContent = fs.readFileSync(insightsPath, 'utf8');
  const insightsBackup = backupFile(insightsPath);
  
  insightsContent = ensureSDKImports(insightsContent, ['FacebookAdsApi', 'AdAccount', 'User']);
  
  // Replace account insights fetching
  insightsContent = insightsContent.replace(
    /const response = await fetch\(insightsUrl\);/g,
    `const account = new AdAccount(accountId);
    const insightsData = await account.getInsights(
      ['spend', 'impressions', 'clicks', 'cpm', 'cpc', 'ctr'],
      { date_preset: dateRange }
    );
    const response = { 
      ok: true, 
      json: async () => ({ data: insightsData }) 
    };`
  );
  
  // Replace me/adaccounts calls
  insightsContent = insightsContent.replace(
    /const accountsResponse = await fetch\(accountsUrl\);/g,
    `const user = new User('me');
    const accounts = await user.getAdAccounts(
      ['id', 'name', 'currency', 'account_status'],
      { limit: 100 }
    );
    const accountsResponse = { 
      ok: true, 
      json: async () => ({ data: accounts }) 
    };`
  );
  
  fs.writeFileSync(insightsPath, insightsContent);
  console.log(`✅ account-insights-tools.ts migrated (backup: ${path.basename(insightsBackup)})`);
  
  // 6. Migrate ads-library-tools.ts
  console.log('\n6️⃣ Migrating ads-library-tools.ts...');
  const adsLibPath = path.join(__dirname, 'src/tools/ads-library-tools.ts');
  let adsLibContent = fs.readFileSync(adsLibPath, 'utf8');
  const adsLibBackup = backupFile(adsLibPath);
  
  adsLibContent = ensureSDKImports(adsLibContent, ['FacebookAdsApi']);
  
  // Replace ads archive calls (these remain as API calls since there's no SDK method)
  adsLibContent = adsLibContent.replace(
    /const response = await fetch\(\s*`https:\/\/graph\.facebook\.com\/[^/]+\/ads_archive\?[^`]+`\s*\);/g,
    `const api = FacebookAdsApi.getDefaultApi();
    const result = await api.call('GET', ['ads_archive'], params);
    const response = { 
      ok: true, 
      json: async () => result 
    };`
  );
  
  fs.writeFileSync(adsLibPath, adsLibContent);
  console.log(`✅ ads-library-tools.ts migrated (backup: ${path.basename(adsLibBackup)})`);
  
  console.log('\n✅ Migration Phase 1 Complete!');
  console.log('📊 Status: 6 main files migrated to use Facebook SDK');
  console.log('\n🔄 Continuing with remaining tools...');
}

// Run the migration
migrateAllTools().then(() => {
  console.log('\n🎉 Full migration script completed!');
  console.log('Next: Run phase 2 for remaining tools');
}).catch(error => {
  console.error('❌ Migration error:', error);
});
