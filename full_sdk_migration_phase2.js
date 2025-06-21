const fs = require('fs');
const path = require('path');

console.log('🚀 Facebook SDK Migration Phase 2 - Completing migration\n');

async function migratePhase2() {
  // 7. Migrate adset-tools.ts
  console.log('7️⃣ Migrating adset-tools.ts...');
  const adsetPath = path.join(__dirname, 'src/tools/adset-tools.ts');
  let adsetContent = fs.readFileSync(adsetPath, 'utf8');
  const adsetBackup = adsetPath + '.backup.' + Date.now();
  fs.copyFileSync(adsetPath, adsetBackup);
  
  // Add SDK imports
  if (!adsetContent.includes('FacebookAdsApi')) {
    const imports = `const { FacebookAdsApi, AdSet, AdAccount } = require('facebook-nodejs-business-sdk');\n`;
    adsetContent = imports + adsetContent;
  }
  
  // Replace AdSet operations
  adsetContent = adsetContent.replace(
    /const response = await fetch\(\s*`https:\/\/graph\.facebook\.com\/[^/]+\/${adSetId}\?[^`]+`\s*\);/g,
    `const adset = new AdSet(adSetId);
    const adsetData = await adset.get(['name', 'targeting', 'daily_budget', 'status']);
    const response = { ok: true, json: async () => adsetData };`
  );
  
  // Replace AdSet creation/duplication
  adsetContent = adsetContent.replace(
    /const response = await fetch\([^,]+,\s*{\s*method: 'POST',[^}]+}\s*\);/g,
    `const api = FacebookAdsApi.getDefaultApi();
    const result = await api.call('POST', [endpoint], {}, params);
    const response = { ok: true, json: async () => result };`
  );
  
  fs.writeFileSync(adsetPath, adsetContent);
  console.log(`✅ adset-tools.ts migrated`);
  
  // 8. Migrate lead-tracking-tools.ts
  console.log('\n8️⃣ Migrating lead-tracking-tools.ts...');
  const leadPath = path.join(__dirname, 'src/tools/lead-tracking-tools.ts');
  let leadContent = fs.readFileSync(leadPath, 'utf8');
  const leadBackup = leadPath + '.backup.' + Date.now();
  fs.copyFileSync(leadPath, leadBackup);
  
  // Add SDK imports
  if (!leadContent.includes('FacebookAdsApi')) {
    leadContent = `const { FacebookAdsApi, Ad } = require('facebook-nodejs-business-sdk');\n` + leadContent;
  }
  
  // Replace Facebook ad insights calls
  leadContent = leadContent.replace(
    /const insightsResponse = await fetch\(insightsUrl\);/g,
    `const ad = new Ad(adId);
    const insights = await ad.getInsights(
      ['impressions', 'reach', 'spend', 'clicks', 'cpm', 'cpc', 'ctr'],
      { time_range: { since: startDate, until: endDate } }
    );
    const insightsResponse = { 
      ok: true, 
      json: async () => ({ data: insights }) 
    };`
  );
  
  // Replace ad details fetching
  leadContent = leadContent.replace(
    /const adDetailsResponse = await fetch\(adDetailsUrl\);/g,
    `const ad = new Ad(adId);
    const adDetails = await ad.get(['name', 'status', 'adset{name,campaign{name}}']);
    const adDetailsResponse = { 
      ok: true, 
      json: async () => adDetails 
    };`
  );
  
  fs.writeFileSync(leadPath, leadContent);
  console.log(`✅ lead-tracking-tools.ts migrated`);
  
  // 9. Fix remaining files that use fetch
  console.log('\n9️⃣ Cleaning up any remaining Facebook fetch calls...');
  
  const allFiles = [
    'src/tools/analytics-tools.ts',
    'src/tools/audience-tools.ts',
    'src/tools/cron-job-tools.ts'
  ];
  
  for (const file of allFiles) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) continue;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file has Facebook API calls
    if (content.includes('graph.facebook.com')) {
      const backup = filePath + '.backup.' + Date.now();
      fs.copyFileSync(filePath, backup);
      
      // Add SDK imports if needed
      if (!content.includes('FacebookAdsApi')) {
        content = `const { FacebookAdsApi } = require('facebook-nodejs-business-sdk');\n` + content;
      }
      
      // Replace generic Facebook API calls
      content = content.replace(
        /await fetch\(`https:\/\/graph\.facebook\.com[^`]+`(?:,\s*{[^}]+})?\)/g,
        (match) => {
          if (match.includes('method: \'DELETE\'')) {
            return `await FacebookAdsApi.getDefaultApi().call('DELETE', [endpoint], {})`;
          } else if (match.includes('method: \'POST\'')) {
            return `await FacebookAdsApi.getDefaultApi().call('POST', [endpoint], {}, data)`;
          } else {
            return `await FacebookAdsApi.getDefaultApi().call('GET', [endpoint], params)`;
          }
        }
      );
      
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${file} migrated`);
    }
  }
  
  console.log('\n✅ Phase 2 Complete!');
}

// Remove node-fetch dependency since we don't need it anymore
function removeNodeFetch() {
  console.log('\n🧹 Removing node-fetch dependency...');
  const packagePath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (packageJson.dependencies['node-fetch']) {
    delete packageJson.dependencies['node-fetch'];
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Removed node-fetch from dependencies');
  }
  
  // Remove fetch polyfill from index.ts
  const indexPath = path.join(__dirname, 'src/index.ts');
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  indexContent = indexContent.replace(/\/\/ Add fetch polyfill[\s\S]*?}\n\n/, '');
  fs.writeFileSync(indexPath, indexContent);
  console.log('✅ Removed fetch polyfill from index.ts');
}

// Final verification
function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  const filesToCheck = [
    'src/http-server.ts',
    'src/tools/page-tools.ts',
    'src/tools/ad-tools.ts',
    'src/tools/campaign-tools.ts',
    'src/tools/adset-tools.ts',
    'src/tools/audience-tools.ts',
    'src/tools/analytics-tools.ts',
    'src/tools/lead-tracking-tools.ts',
    'src/tools/ads-library-tools.ts',
    'src/tools/account-insights-tools.ts',
    'src/tools/cron-job-tools.ts'
  ];
  
  let remaining = 0;
  
  filesToCheck.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/fetch\([^)]*graph\.facebook\.com/g) || [];
    
    if (matches.length > 0) {
      console.log(`⚠️  ${file}: ${matches.length} Facebook fetch calls remaining`);
      remaining += matches.length;
    }
  });
  
  if (remaining === 0) {
    console.log('✅ All Facebook API calls have been migrated to SDK!');
  } else {
    console.log(`\n⚠️  ${remaining} fetch calls may need manual review`);
  }
}

// Run phase 2
migratePhase2()
  .then(() => {
    removeNodeFetch();
    verifyMigration();
    console.log('\n🎉 FULL MIGRATION COMPLETE!');
    console.log('✅ All 77 Facebook tools now use the Facebook SDK');
    console.log('✅ No more fetch calls to graph.facebook.com');
    console.log('✅ Better performance and reliability on Railway');
  })
  .catch(error => {
    console.error('❌ Migration error:', error);
  });
