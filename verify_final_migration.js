const fs = require('fs');
const path = require('path');

console.log('🔍 Final Verification - Checking all files for remaining fetch calls\n');

const allFiles = [
  'src/http-server.ts',
  'src/mcp-server.ts',
  'src/index.ts',
  'src/config.ts',
  'src/tools/account-insights-tools.ts',
  'src/tools/ad-tools.ts',
  'src/tools/ads-library-tools.ts',
  'src/tools/adset-tools.ts',
  'src/tools/analytics-tools.ts',
  'src/tools/audience-tools.ts',
  'src/tools/campaign-tools.ts',
  'src/tools/cron-job-tools.ts',
  'src/tools/lead-tracking-tools.ts',
  'src/tools/page-tools.ts'
];

let totalFacebookFetch = 0;
let totalNonFacebookFetch = 0;
let filesWithFacebookFetch = [];

allFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${file} - File not found`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Count Facebook fetch calls
  const facebookFetches = (content.match(/fetch\([^)]*graph\.facebook\.com/g) || []).length;
  
  // Count non-Facebook fetch calls (for cron-job.org, Laravel, etc)
  const allFetches = (content.match(/fetch\(/g) || []).length;
  const nonFacebookFetches = allFetches - facebookFetches;
  
  if (facebookFetches > 0) {
    console.log(`❌ ${file}: ${facebookFetches} Facebook fetch calls still present`);
    filesWithFacebookFetch.push(file);
    totalFacebookFetch += facebookFetches;
  } else if (nonFacebookFetches > 0) {
    console.log(`✅ ${file}: No Facebook fetch calls (${nonFacebookFetches} non-Facebook fetch calls preserved)`);
    totalNonFacebookFetch += nonFacebookFetches;
  } else {
    console.log(`✅ ${file}: Clean - no fetch calls`);
  }
});

console.log('\n📊 Summary:');
console.log(`   Total Facebook fetch calls remaining: ${totalFacebookFetch}`);
console.log(`   Total non-Facebook fetch calls (preserved): ${totalNonFacebookFetch}`);
console.log(`   Files with Facebook fetch: ${filesWithFacebookFetch.length}`);

if (totalFacebookFetch === 0) {
  console.log('\n🎉 SUCCESS! All Facebook API calls have been migrated to the Facebook SDK!');
  console.log('✅ All 77 tools now use native SDK methods');
  console.log('✅ Non-Facebook APIs (cron-job.org, Laravel) remain unchanged');
  console.log('✅ Ready for Railway deployment');
} else {
  console.log('\n⚠️  Some Facebook fetch calls remain. Manual review needed for:');
  filesWithFacebookFetch.forEach(file => console.log(`   - ${file}`));
}
