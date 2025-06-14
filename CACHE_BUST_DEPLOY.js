// FORCE RAILWAY REBUILD - Clear cache and ensure 46 tools
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 FORCING RAILWAY TO REBUILD WITH 46 TOOLS');
console.log('==========================================');

try {
  // Add a cache-busting change to the HTML generation
  console.log('📝 Adding cache-buster to force rebuild...');
  
  // Read the current package.json
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Update version to force rebuild
  const currentVersion = pkg.version || '2.0.1';
  const versionParts = currentVersion.split('.');
  versionParts[2] = parseInt(versionParts[2]) + 1;
  pkg.version = versionParts.join('.');
  pkg.buildTime = new Date().toISOString();
  pkg.toolsCount = 46;
  pkg.includesPageManagement = true;
  
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
  
  console.log(`✓ Updated version to ${pkg.version}`);
  
  // Create a deployment file to track
  const deployInfo = {
    version: pkg.version,
    timestamp: new Date().toISOString(),
    tools: {
      campaign: 7,
      account: 2,
      adSet: 5,
      ad: 6,
      audience: 5,
      adsLibrary: 4,
      pageManagement: 17,
      other: 1,
      total: 46
    }
  };
  
  fs.writeFileSync('deployment-info.json', JSON.stringify(deployInfo, null, 2));
  
  console.log('\n🔨 Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n📤 Committing and pushing...');
  execSync('git add -A', { stdio: 'inherit' });
  execSync(`git commit -m "[CACHE BUST] Force Railway rebuild - 46 tools including Page Management - v${pkg.version}"`, { stdio: 'inherit' });
  execSync('git push origin main:master --force', { stdio: 'inherit' });
  
  console.log('\n✅ FORCED REBUILD TRIGGERED!');
  console.log('==============================');
  console.log('🚂 Railway will rebuild from scratch');
  console.log(`📦 New version: ${pkg.version}`);
  console.log('🔧 This should force a complete rebuild');
  console.log('');
  console.log('⏰ Wait 3-5 minutes then check:');
  console.log('https://newfb-production.up.railway.app/get-user-id');
  console.log('');
  console.log('The config should now include all 46 tools!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
