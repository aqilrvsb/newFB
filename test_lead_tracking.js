// Test script for Lead Tracking tools
// This demonstrates how to use the lead tracking integration

const fetch = require('node-fetch');

// Configuration
const SERVER_URL = 'https://newfb-production.up.railway.app'; // or http://localhost:3000 for local
const USER_ID = 'YOUR_SESSION_ID_HERE'; // Replace with your actual session ID

// Test get_leads_data
async function testGetLeadsData(staffId, startDate, endDate) {
  console.log(`\n📊 Testing get_leads_data`);
  console.log(`   Staff ID: ${staffId}`);
  console.log(`   Date Range: ${startDate} to ${endDate}\n`);
  
  try {
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
          name: 'get_leads_data',
          arguments: {
            staffId: staffId,
            startDate: startDate,
            endDate: endDate
          }
        }
      })
    });

    const result = await response.json();
    
    if (result.result?.success) {
      const data = result.result;
      console.log('✅ Leads Data Retrieved Successfully!\n');
      
      console.log('📈 SUMMARY:');
      console.log(`   Total Leads: ${data.summary.totalLeads}`);
      console.log(`   Staff ID: ${data.summary.staffId}`);
      console.log(`   Date Range: ${data.summary.dateRange.start} to ${data.summary.dateRange.end}\n`);
      
      if (data.summary.leadsByDateCount) {
        console.log('📅 LEADS BY DATE:');
        data.summary.leadsByDateCount.forEach(item => {
          console.log(`   ${item.date}: ${item.count} leads`);
        });
        console.log('');
      }
      
      if (data.summary.leadsByKeywordCount) {
        console.log('🔑 LEADS BY KEYWORD:');
        data.summary.leadsByKeywordCount.forEach(item => {
          console.log(`   ${item.keyword}: ${item.count} leads`);
        });
        console.log('');
      }
      
      if (data.summary.leadsByAdIdCount) {
        console.log('📢 LEADS BY AD ID:');
        data.summary.leadsByAdIdCount.forEach(item => {
          console.log(`   ${item.adId}: ${item.count} leads`);
        });
        console.log('');
      }
      
      if (data.leads && data.leads.length > 0) {
        console.log('👥 SAMPLE LEADS (First 3):');
        data.leads.slice(0, 3).forEach((lead, index) => {
          console.log(`   Lead ${index + 1}:`);
          console.log(`     Name: ${lead.prospect_nama}`);
          console.log(`     Phone: ${lead.prospect_num}`);
          console.log(`     Date: ${lead.date_order}`);
          console.log(`     Keyword: ${lead.keywordiklan}`);
          console.log(`     Ad ID: ${lead.ad_id}\n`);
        });
      }
      
      return data;
    } else {
      console.log('❌ Error:', result.result?.message || result.error?.message || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

// Test get_leads_with_insights
async function testGetLeadsWithInsights(staffId, startDate, endDate) {
  console.log(`\n💰 Testing get_leads_with_insights (ROI Analysis)`);
  console.log(`   Staff ID: ${staffId}`);
  console.log(`   Date Range: ${startDate} to ${endDate}\n`);
  
  try {
    const response = await fetch(`${SERVER_URL}/mcp/${USER_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '2',
        method: 'tools/call',
        params: {
          name: 'get_leads_with_insights',
          arguments: {
            staffId: staffId,
            startDate: startDate,
            endDate: endDate
          }
        }
      })
    });

    const result = await response.json();
    
    if (result.result?.success) {
      const data = result.result;
      console.log('✅ Leads with Insights Retrieved Successfully!\n');
      
      console.log('💵 ROI SUMMARY:');
      console.log(`   Total Leads: ${data.summary.totalLeads}`);
      console.log(`   Total Spend: $${data.summary.totalSpend.toFixed(2)}`);
      console.log(`   Overall Cost Per Lead: $${data.summary.overallCostPerLead.toFixed(2)}`);
      console.log(`   Unique Ads Used: ${data.summary.uniqueAdsUsed}\n`);
      
      if (data.summary.bestPerformingAd) {
        console.log('🏆 BEST PERFORMING AD (Lowest CPL):');
        const best = data.summary.bestPerformingAd;
        console.log(`   Ad Name: ${best.adName}`);
        console.log(`   Campaign: ${best.campaignName}`);
        console.log(`   Total Leads: ${best.totalLeads}`);
        console.log(`   Total Spend: $${best.totalSpend.toFixed(2)}`);
        console.log(`   Cost Per Lead: $${best.costPerLead.toFixed(2)}`);
        console.log(`   CTR: ${best.ctr}%\n`);
      }
      
      if (data.summary.adWithMostLeads) {
        console.log('📊 AD WITH MOST LEADS:');
        const most = data.summary.adWithMostLeads;
        console.log(`   Ad Name: ${most.adName}`);
        console.log(`   Total Leads: ${most.totalLeads}`);
        console.log(`   Cost Per Lead: $${most.costPerLead.toFixed(2)}\n`);
      }
      
      if (data.adPerformance) {
        console.log('📈 AD PERFORMANCE BREAKDOWN:');
        Object.values(data.adPerformance).forEach(ad => {
          console.log(`   ${ad.adName}:`);
          console.log(`     - Leads: ${ad.totalLeads}`);
          console.log(`     - Spend: $${ad.totalSpend.toFixed(2)}`);
          console.log(`     - CPL: $${ad.costPerLead.toFixed(2)}`);
          console.log(`     - Impressions: ${ad.impressions || 'N/A'}`);
          console.log(`     - Clicks: ${ad.clicks || 'N/A'}`);
          console.log(`     - CTR: ${ad.ctr || 'N/A'}%\n`);
        });
      }
      
      return data;
    } else {
      console.log('❌ Error:', result.result?.message || result.error?.message || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return null;
  }
}

// Combined test with check_ad_id
async function testCombinedAdCheck(adId) {
  console.log(`\n🔍 Testing Combined: check_ad_id + lead tracking`);
  console.log(`   Ad ID: ${adId}\n`);
  
  try {
    // First, check ad details
    const adResponse = await fetch(`${SERVER_URL}/mcp/${USER_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '3',
        method: 'tools/call',
        params: {
          name: 'check_ad_id',
          arguments: {
            adId: adId
          }
        }
      })
    });

    const adResult = await adResponse.json();
    
    if (adResult.result?.success) {
      const adData = adResult.result;
      console.log('✅ Ad Details:');
      console.log(`   Ad Name: ${adData.adInfo.adName}`);
      console.log(`   Campaign: ${adData.campaignInfo?.campaignName || 'N/A'}`);
      console.log(`   Status: ${adData.adInfo.adStatus}\n`);
      
      console.log('📝 Note: To see lead performance for this ad,');
      console.log('   run get_leads_with_insights and check the');
      console.log('   adPerformance section for this ad ID.\n');
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Lead Tracking Tools Test Suite\n');
  console.log('===================================\n');
  
  // Test parameters
  const staffId = 'RV-007';
  const startDate = '16-06-2025';
  const endDate = '17-06-2025';
  const adId = '120222861998810312';
  
  // Run tests
  const leadsData = await testGetLeadsData(staffId, startDate, endDate);
  
  if (leadsData && leadsData.success) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await testGetLeadsWithInsights(staffId, startDate, endDate);
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  await testCombinedAdCheck(adId);
  
  console.log('\n✅ Test suite completed!');
  console.log('\n💡 Tips:');
  console.log('   - Make sure your Laravel app is running at https://rvsbbot.com');
  console.log('   - Use real dates that have lead data');
  console.log('   - The ad IDs in your leads should match Facebook ad IDs');
  console.log('   - Cost per lead calculations require Facebook ad spend data');
}

// Run the tests
runTests();
