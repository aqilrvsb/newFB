// FORCE PUSH SCRIPT - Override any conflicts
const { execSync } = require('child_process');

console.log('🔥 FORCE PUSH - OVERRIDING ALL CONFLICTS');
console.log('=====================================');

try {
  console.log('📍 Current branch status:');
  execSync('git branch -v', { stdio: 'inherit' });
  
  console.log('\n🔄 Fetching latest from remote...');
  execSync('git fetch origin', { stdio: 'inherit' });
  
  console.log('\n💪 FORCE PUSHING to master (overriding remote)...');
  execSync('git push origin main:master --force', { stdio: 'inherit' });
  
  console.log('\n✅ FORCE PUSH SUCCESSFUL!');
  console.log('=====================================');
  console.log('🎉 Remote master branch has been overwritten with your local changes!');
  console.log('🚀 Railway will now deploy the 46 tools update');
  console.log('');
  console.log('Check deployment at: https://newfb-production.up.railway.app');
  
} catch (error) {
  console.error('\n❌ FORCE PUSH FAILED!');
  console.error('Error:', error.message);
  
  console.log('\n🔧 Trying alternative approach...');
  try {
    // Alternative: Reset to local and force push
    console.log('Resetting to local main branch...');
    execSync('git checkout main', { stdio: 'inherit' });
    execSync('git push origin +main:master', { stdio: 'inherit' });
    
    console.log('\n✅ ALTERNATIVE FORCE PUSH SUCCESSFUL!');
  } catch (altError) {
    console.error('Alternative also failed:', altError.message);
    
    console.log('\n🛠️ Manual steps to force push:');
    console.log('1. Run: git push origin main:master --force');
    console.log('2. Or: git push origin +main:master');
    console.log('3. If that fails, try: git push --force-with-lease origin main:master');
  }
  
  process.exit(1);
}
