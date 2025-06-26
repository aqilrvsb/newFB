// FORCE DEPLOYMENT SCRIPT - 46 TOOLS UPDATE
// This script forces a deployment to Railway with the new 46 tools update

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 FORCE DEPLOYMENT - 46 TOOLS UPDATE');
console.log('=====================================');
console.log('Adding: Facebook Ads Library (4 tools) + Page Management (17 tools)');
console.log('Total tools: 46 (up from 24)');
console.log('');

// Create a deployment timestamp
const deploymentTime = new Date().toISOString();
const deploymentMessage = `[DEPLOY ${deploymentTime}] Added 22 new tools - Facebook Ads Library (4) + Page Management (17) = 46 total tools`;

// Update deployment marker
const deploymentMarkerPath = path.join(__dirname, '.deployment-46-tools');
fs.writeFileSync(deploymentMarkerPath, JSON.stringify({
  timestamp: deploymentTime,
  totalTools: 46,
  newTools: {
    adsLibrary: ['get_meta_platform_id', 'get_meta_ads', 'search_ads_library', 'get_competitor_ads_analysis'],
    pageManagement: [
      'get_page_details', 'create_page_post', 'update_page_post', 'delete_page_post',
      'get_page_posts', 'get_page_insights', 'schedule_page_post', 'get_scheduled_posts',
      'publish_scheduled_post', 'cancel_scheduled_post', 'get_page_videos', 'upload_page_video',
      'get_page_events', 'create_page_event', 'update_page_event', 'delete_page_event',
      'get_page_fan_count'
    ]
  },
  message: deploymentMessage
}, null, 2));

try {
  console.log('📦 Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
  
  console.log('\n📝 Staging changes...');
  execSync('git add -A', { stdio: 'inherit' });
  
  console.log('\n💾 Committing changes...');
  execSync(`git commit -m "${deploymentMessage}" --allow-empty`, { stdio: 'inherit' });
  
  console.log('\n🔄 Pushing to GitHub (main -> master)...');
  execSync('git push origin main:master --force', { stdio: 'inherit' });
  
  console.log('\n✅ DEPLOYMENT SUCCESSFUL!');
  console.log('=====================================');
  console.log('🎉 46 TOOLS NOW AVAILABLE!');
  console.log('');
  console.log('📋 New Tools Added:');
  console.log('');
  console.log('Facebook Ads Library (4):');
  console.log('- get_meta_platform_id');
  console.log('- get_meta_ads');
  console.log('- search_ads_library');
  console.log('- get_competitor_ads_analysis');
  console.log('');
  console.log('Page Management (17):');
  console.log('- get_page_details');
  console.log('- create_page_post');
  console.log('- update_page_post');
  console.log('- delete_page_post');
  console.log('- get_page_posts');
  console.log('- get_page_insights');
  console.log('- schedule_page_post');
  console.log('- get_scheduled_posts');
  console.log('- publish_scheduled_post');
  console.log('- cancel_scheduled_post');
  console.log('- get_page_videos');
  console.log('- upload_page_video');
  console.log('- get_page_events');
  console.log('- create_page_event');
  console.log('- update_page_event');
  console.log('- delete_page_event');
  console.log('- get_page_fan_count');
  console.log('');
  console.log('🌐 Railway will auto-deploy from master branch');
  console.log('🔗 Check deployment at: https://newfb-production.up.railway.app');
  console.log('');
  console.log('👥 Users can get updated config at:');
  console.log('https://newfb-production.up.railway.app/get-user-id');
  
  // Clean up deployment marker
  setTimeout(() => {
    if (fs.existsSync(deploymentMarkerPath)) {
      fs.unlinkSync(deploymentMarkerPath);
    }
  }, 3000);
  
} catch (error) {
  console.error('\n❌ DEPLOYMENT FAILED!');
  console.error('Error:', error.message);
  
  // Clean up on error
  if (fs.existsSync(deploymentMarkerPath)) {
    fs.unlinkSync(deploymentMarkerPath);
  }
  
  process.exit(1);
}
