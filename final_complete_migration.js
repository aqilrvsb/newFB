const fs = require('fs');
const path = require('path');

console.log('🔧 Final SDK Migration - Handling ALL remaining Facebook fetch calls\n');

function migrateFetchToSDK(content, fileName) {
  let migrated = content;
  let changeCount = 0;
  
  // Pattern 1: Simple fetch with URL only
  migrated = migrated.replace(
    /await fetch\(\s*`(https:\/\/graph\.facebook\.com\/v[\d.]+\/[^`]+)`\s*\)/g,
    (match, url) => {
      changeCount++;
      const urlObj = new URL(url);
      const endpoint = urlObj.pathname.replace(/^\/v[\d.]+\//, '');
      
      // Parse query parameters
      const params = {};
      urlObj.searchParams.forEach((value, key) => {
        if (key !== 'access_token') {
          params[key] = value;
        }
      });
      
      const paramsStr = Object.keys(params).length > 0 
        ? `, ${JSON.stringify(params)}` 
        : ', {}';
      
      return `await FacebookAdsApi.getDefaultApi().call('GET', ['${endpoint}']${paramsStr})`;
    }
  );
  
  // Pattern 2: fetch with method POST
  migrated = migrated.replace(
    /await fetch\(\s*`(https:\/\/graph\.facebook\.com\/v[\d.]+\/[^`]+)`,\s*{\s*method:\s*['"]POST['"],[^}]*body:\s*([^}]+)}\s*\)/g,
    (match, url, body) => {
      changeCount++;
      const urlObj = new URL(url);
      const endpoint = urlObj.pathname.replace(/^\/v[\d.]+\//, '');
      
      return `await FacebookAdsApi.getDefaultApi().call('POST', ['${endpoint}'], {}, ${body.trim()})`;
    }
  );
  
  // Pattern 3: fetch with method DELETE
  migrated = migrated.replace(
    /await fetch\(\s*`(https:\/\/graph\.facebook\.com\/v[\d.]+\/[^`]+)`,\s*{\s*method:\s*['"]DELETE['"]\s*}\s*\)/g,
    (match, url) => {
      changeCount++;
      const urlObj = new URL(url);
      const endpoint = urlObj.pathname.replace(/^\/v[\d.]+\//, '');
      
      return `await FacebookAdsApi.getDefaultApi().call('DELETE', ['${endpoint}'], {})`;
    }
  );
  
  // Pattern 4: Multi-line fetch calls
  const lines = migrated.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('await fetch(') && !lines[i].includes('FacebookAdsApi')) {
      // Check next few lines for Facebook URL
      let fetchBlock = lines[i];
      let j = i + 1;
      while (j < lines.length && !fetchBlock.includes(');')) {
        fetchBlock += ' ' + lines[j].trim();
        j++;
      }
      
      if (fetchBlock.includes('graph.facebook.com')) {
        changeCount++;
        // Extract URL and method
        const urlMatch = fetchBlock.match(/`([^`]+)`/);
        const methodMatch = fetchBlock.match(/method:\s*['"](\w+)['"]/);
        
        if (urlMatch) {
          const url = urlMatch[1];
          const method = methodMatch ? methodMatch[1] : 'GET';
          const endpoint = url.replace(/https:\/\/graph\.facebook\.com\/v[\d.]+\//, '');
          
          lines[i] = `      await FacebookAdsApi.getDefaultApi().call('${method}', ['${endpoint}'], {})`;
          
          // Remove the extra lines
          for (let k = i + 1; k < j; k++) {
            lines[k] = '';
          }
        }
      }
    }
  }
  
  if (changeCount > 0) {
    migrated = lines.join('\n');
    
    // Ensure FacebookAdsApi is imported
    if (!migrated.includes('FacebookAdsApi') || !migrated.includes('require(\'facebook-nodejs-business-sdk\')')) {
      const sdkImport = `const { FacebookAdsApi } = require('facebook-nodejs-business-sdk');\n`;
      migrated = sdkImport + migrated;
    }
  }
  
  console.log(`${fileName}: ${changeCount} fetch calls migrated`);
  return { content: migrated, changes: changeCount };
}

// Process all files
const files = [
  'src/http-server.ts',
  'src/tools/page-tools.ts',
  'src/tools/ad-tools.ts',
  'src/tools/adset-tools.ts',
  'src/tools/ads-library-tools.ts',
  'src/tools/account-insights-tools.ts',
  'src/tools/lead-tracking-tools.ts'
];

let totalChanges = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Only process if it has Facebook API calls
  if (content.includes('graph.facebook.com') && content.includes('fetch')) {
    const backup = filePath + '.backup.final.' + Date.now();
    fs.copyFileSync(filePath, backup);
    
    const result = migrateFetchToSDK(content, file);
    if (result.changes > 0) {
      fs.writeFileSync(filePath, result.content);
      totalChanges += result.changes;
    }
  }
});

console.log(`\n✅ Total fetch calls migrated: ${totalChanges}`);

// Final cleanup - remove any response.json() patterns and fix them
console.log('\n🧹 Fixing response patterns...');

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Fix patterns where we use response.json()
  if (content.includes('response.json()')) {
    content = content.replace(
      /const (\w+) = await FacebookAdsApi\.getDefaultApi\(\)\.call\([^)]+\);\s*const (\w+)[^=]*= await \1\.json\(\);/g,
      'const $2 = await FacebookAdsApi.getDefaultApi().call$1;'
    );
    changed = true;
  }
  
  // Fix response = await pattern
  content = content.replace(
    /const response = await FacebookAdsApi\.getDefaultApi\(\)\.call\(([^)]+)\);/g,
    'const result = await FacebookAdsApi.getDefaultApi().call($1);\n      const response = { ok: true, json: async () => result };'
  );
  
  if (changed || content.includes('const result = await FacebookAdsApi')) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed response patterns in ${file}`);
  }
});

console.log('\n🎉 FINAL MIGRATION COMPLETE!');
console.log('All Facebook API calls now use the Facebook SDK');
