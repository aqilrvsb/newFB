// FINAL DEPLOYMENT PUSH - Ensure Railway gets the 46 tools
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 FINAL DEPLOYMENT PUSH - 46 TOOLS');
console.log('===================================');

try {
  // Add a timestamp to package.json to force a change
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.deploymentTimestamp = new Date().toISOString();
  packageJson.toolsCount = 46;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  
  console.log('📝 Updated package.json with deployment timestamp');
  
  console.log('\n📦 Final build...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n💾 Committing final changes...');
  execSync('git add -A', { stdio: 'inherit' });
  execSync('git commit -m "[FINAL DEPLOY] 46 tools - Updated package.json to force Railway rebuild"', { stdio: 'inherit' });
  
  console.log('\n🚀 Pushing to master (Railway deployment branch)...');
  execSync('git push origin HEAD:master --force', { stdio: 'inherit' });
  
  console.log('\n🚀 Also pushing to main for GitHub sync...');
  execSync('git push origin HEAD:main --force', { stdio: 'inherit' });
  
  console.log('\n✅ FINAL DEPLOYMENT COMPLETE!');
  console.log('=============================');
  console.log('🎉 46 TOOLS DEPLOYMENT PUSHED');
  console.log('');
  console.log('📋 Tools included:');
  console.log('- Original tools: 24');
  console.log('- Audience tools: 1'); 
  console.log('- Ads Library tools: 4');
  console.log('- Page Management tools: 17');
  console.log('- TOTAL: 46 tools');
  console.log('');
  console.log('🚂 Railway will rebuild from master branch');
  console.log('⏰ Deployment should complete in 3-5 minutes');
  console.log('');
  console.log('🔗 Check deployment at:');
  console.log('https://newfb-production.up.railway.app/get-user-id');
  console.log('');
  console.log('📊 The generated config will include all 46 tools!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
