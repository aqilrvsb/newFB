// Test script for the new check_ad_id tool
// This demonstrates how to use the tool to get full ad hierarchy from just an ad ID

const fetch = require('node-fetch');

// Configuration
const SERVER_URL = 'https://newfb-production.up.railway.app'; // or http://localhost:3000 for local
const USER_ID = 'YOUR_SESSION_ID_HERE'; // Replace with your actual session ID

async function testCheckAdId(adId) {
  try {
    console.log(`\n🔍 Checking ad ID: ${adId}\n`);
    
    const response = await fetch(`${SERVER_URL}/mcp/${USER_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'tools/call',
        params: {
          name: 'check_ad_id',
          arguments: {
            adId: adId
          }
        }
      })
    });

    const result = await response.json();
    
    if (result.result?.success) {
      const data = result.result;
      
      console.log('✅ Ad Details Retrieved Successfully!\n');
      
      console.log('📄 AD INFORMATION:');
      console.log(`   - Ad ID: ${data.adInfo.adId}`);
      console.log(`   - Ad Name: ${data.adInfo.adName}`);
      console.log(`   - Ad Status: ${data.adInfo.adStatus}`);
      console.log(`   - Effective Status: ${data.adInfo.adEffectiveStatus}`);
      console.log(`   - Created: ${data.adInfo.adCreatedTime}\n`);
      
      if (data.adSetInfo) {
        console.log('📊 AD SET INFORMATION:');
        console.log(`   - Ad Set ID: ${data.adSetInfo.adSetId}`);
        console.log(`   - Ad Set Name: ${data.adSetInfo.adSetName}`);
        console.log(`   - Ad Set Status: ${data.adSetInfo.adSetStatus}\n`);
      }
      
      if (data.campaignInfo) {
        console.log('🎯 CAMPAIGN INFORMATION:');
        console.log(`   - Campaign ID: ${data.campaignInfo.campaignId}`);
        console.log(`   - Campaign Name: ${data.campaignInfo.campaignName}`);
        console.log(`   - Campaign Objective: ${data.campaignInfo.campaignObjective}`);
        console.log(`   - Campaign Status: ${data.campaignInfo.campaignStatus}\n`);
      }
      
      if (data.adAccountInfo) {
        console.log('💼 AD ACCOUNT INFORMATION:');
        console.log(`   - Account ID: ${data.adAccountInfo.accountId}`);
        console.log(`   - Account Name: ${data.adAccountInfo.accountName}`);
        console.log(`   - Currency: ${data.adAccountInfo.currency}`);
        console.log(`   - Timezone: ${data.adAccountInfo.timezone}\n`);
      }
      
      console.log('🔗 COMPLETE HIERARCHY:');
      console.log(`   Level 4 (Account): ${data.hierarchy.level4_adAccount}`);
      console.log(`   └─ Level 3 (Campaign): ${data.hierarchy.level3_campaign}`);
      console.log(`      └─ Level 2 (Ad Set): ${data.hierarchy.level2_adSet}`);
      console.log(`         └─ Level 1 (Ad): ${data.hierarchy.level1_ad}`);
      
    } else {
      console.log('❌ Error:', result.result?.message || result.error?.message || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Example usage
async function main() {
  // Replace with actual ad IDs you want to check
  const adIds = [
    '120222861998810312', // Example ad ID
    // Add more ad IDs here
  ];
  
  for (const adId of adIds) {
    await testCheckAdId(adId);
  }
}

// Run the test
main();
