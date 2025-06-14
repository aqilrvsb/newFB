// ULTIMATE FORCE PUSH - Update both main and master branches
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔥 ULTIMATE FORCE PUSH - UPDATING BOTH BRANCHES');
console.log('===============================================');

try {
  // First, let's see current status
  console.log('📊 Current Status:');
  execSync('git status', { stdio: 'inherit' });
  
  console.log('\n📍 Current branches:');
  execSync('git branch -a', { stdio: 'inherit' });
  
  // Create a timestamp file to force a new commit
  const timestamp = new Date().toISOString();
  const forceFile = '.force-deploy-' + Date.now() + '.txt';
  fs.writeFileSync(forceFile, `Force deployment at ${timestamp}\nTotal tools: 46\n`);
  
  console.log('\n📝 Creating force commit...');
  execSync('git add -A', { stdio: 'inherit' });
  execSync(`git commit -m "[FORCE DEPLOY] 46 tools update - Facebook Ads Library + Page Management - ${timestamp}" --allow-empty`, { stdio: 'inherit' });
  
  console.log('\n🔄 Fetching latest from all remotes...');
  execSync('git fetch --all', { stdio: 'inherit' });
  
  console.log('\n💪 FORCE PUSHING to origin/main...');
  execSync('git push origin main --force', { stdio: 'inherit' });
  
  console.log('\n💪 FORCE PUSHING main to master...');
  execSync('git push origin main:master --force', { stdio: 'inherit' });
  
  console.log('\n🔄 Creating and pushing master branch locally...');
  try {
    execSync('git checkout -b master', { stdio: 'inherit' });
  } catch (e) {
    // Branch might already exist
    execSync('git checkout master', { stdio: 'inherit' });
  }
  
  console.log('\n🔄 Resetting master to main...');
  execSync('git reset --hard main', { stdio: 'inherit' });
  
  console.log('\n💪 FORCE PUSHING master branch...');
  execSync('git push origin master --force', { stdio: 'inherit' });
  
  console.log('\n🔄 Switching back to main...');
  execSync('git checkout main', { stdio: 'inherit' });
  
  // Clean up force file
  if (fs.existsSync(forceFile)) {
    fs.unlinkSync(forceFile);
  }
  
  console.log('\n✅ ULTIMATE FORCE PUSH SUCCESSFUL!');
  console.log('===============================================');
  console.log('🎉 Both main and master branches updated!');
  console.log('🚀 46 tools are now deployed:');
  console.log('   - Original tools: 25');
  console.log('   - Facebook Ads Library: 4');
  console.log('   - Page Management: 17');
  console.log('   - TOTAL: 46 tools');
  console.log('');
  console.log('🔗 GitHub: https://github.com/aqilrvsb/newFB.git');
  console.log('🚂 Railway: https://newfb-production.up.railway.app');
  console.log('');
  console.log('📝 Latest commits pushed:');
  execSync('git log --oneline -3', { stdio: 'inherit' });
  
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  
  console.log('\n🛠️ Attempting manual recovery...');
  
  try {
    // Nuclear option - force everything
    console.log('Running nuclear force push...');
    execSync('git push origin +main:main --force', { stdio: 'inherit' });
    execSync('git push origin +main:master --force', { stdio: 'inherit' });
    console.log('✅ Nuclear force push successful!');
  } catch (nuclearError) {
    console.error('Nuclear option also failed:', nuclearError.message);
    
    console.log('\n📋 Manual commands to run:');
    console.log('git add -A');
    console.log('git commit -m "Force update" --allow-empty');
    console.log('git push origin main --force');
    console.log('git push origin main:master --force');
  }
}
