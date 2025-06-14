// NUCLEAR FORCE SYNC - Override everything on GitHub
const { execSync } = require('child_process');

console.log('☢️ NUCLEAR FORCE SYNC - OVERRIDING GITHUB');
console.log('=========================================');

try {
  console.log('📊 Current status:');
  execSync('git status', { stdio: 'inherit' });
  
  console.log('\n🔄 Fetching all remote branches...');
  execSync('git fetch --all', { stdio: 'inherit' });
  
  console.log('\n🗑️ Deleting remote main branch...');
  try {
    execSync('git push origin --delete main', { stdio: 'inherit' });
  } catch (e) {
    console.log('Main branch might not exist or is protected');
  }
  
  console.log('\n💥 Force pushing local main to both branches...');
  execSync('git push origin main:main --force', { stdio: 'inherit' });
  execSync('git push origin main:master --force', { stdio: 'inherit' });
  
  console.log('\n🔧 Setting upstream tracking...');
  execSync('git branch --set-upstream-to=origin/master main', { stdio: 'inherit' });
  
  console.log('\n📌 Setting default branch...');
  execSync('git symbolic-ref refs/remotes/origin/HEAD refs/remotes/origin/master', { stdio: 'inherit' });
  
  console.log('\n✅ NUCLEAR SYNC COMPLETE!');
  console.log('========================');
  console.log('🎯 Both branches forcefully synced');
  console.log('🚀 GitHub should now accept the push');
  console.log('');
  console.log('Latest commit:');
  execSync('git log --oneline -1', { stdio: 'inherit' });
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  
  console.log('\n🆘 EMERGENCY OVERRIDE:');
  console.log('Run these commands manually:');
  console.log('');
  console.log('git checkout main');
  console.log('git branch -D master');
  console.log('git checkout -b master');
  console.log('git push origin master --force');
  console.log('git checkout main');
  console.log('git push origin main --force');
}
