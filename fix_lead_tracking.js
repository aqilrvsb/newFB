const fs = require('fs').promises;
const path = require('path');

async function fixLeadTrackingTools() {
  const filePath = path.join(__dirname, 'src', 'tools', 'lead-tracking-tools.ts');
  
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    // Fix the Facebook API fetch calls
    // Replace the insights fetch with SDK
    content = content.replace(
      /const insightsUrl = `https:\/\/graph\.facebook\.com\/v\d+\.\d+\/\$\{adId\}\/insights[^`]+`;\s*[\s\S]*?const insightsData = await insightsResponse\.json\(\) as any;/g,
      `const ad = new Ad(adId);
        const insightsData = await ad.getInsights(
          ['impressions', 'reach', 'spend', 'clicks', 'cpm', 'cpc', 'ctr'],
          { time_range: { since: startDate, until: endDate } }
        );
        const insightsResponse = { data: insightsData };`
    );
    
    // Replace the ad details fetch with SDK
    content = content.replace(
      /const adDetailsUrl = `https:\/\/graph\.facebook\.com\/v\d+\.\d+\/\$\{adId\}[^`]+`;\s*[\s\S]*?const adDetails2 = await adDetailsResponse\.json\(\) as any;/g,
      `const ad2 = new Ad(adId);
        const adDetails = await ad2.get(['name', 'status', 'adset{name,campaign{name}}']);`
    );
    
    // Fix the response handling
    content = content.replace(
      /if \(insightsData\.data && insightsData\.data\.length > 0\) \{/g,
      'if (insightsResponse.data && insightsResponse.data.length > 0) {'
    );
    
    content = content.replace(
      /const insights = insightsData\.data\[0\];/g,
      'const insights = insightsResponse.data[0];'
    );
    
    // Add missing import
    if (!content.includes("import { Ad }")) {
      content = content.replace(
        "import { userSessionManager } from '../config.js';",
        `import { userSessionManager } from '../config.js';
import { Ad } from 'facebook-nodejs-business-sdk';`
      );
    }
    
    // Create backup
    const backupPath = filePath + '.backup.' + Date.now();
    await fs.writeFile(backupPath, await fs.readFile(filePath, 'utf8'));
    
    // Write updated file
    await fs.writeFile(filePath, content);
    console.log('✅ Fixed lead-tracking-tools.ts');
    
  } catch (error) {
    console.error('❌ Error fixing lead-tracking-tools.ts:', error.message);
  }
}

fixLeadTrackingTools().catch(console.error);