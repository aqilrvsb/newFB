// Test for the new get_lead_report function with modified structure
const https = require('https');

const USER_ID = 'f9de49d5-2b6a-44b7-8d66-8095a5ffed1f'; // Replace with your actual user ID
const BASE_URL = 'newfb-production.up.railway.app';

function callTool(toolName, args) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      tool: toolName,
      args: args
    });

    const options = {
      hostname: BASE_URL,
      port: 443,
      path: `/tool`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-User-ID': USER_ID
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response: ' + data));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Test the new get_lead_report tool with the new structure
async function testNewLeadReport() {
  console.log('Testing new get_lead_report tool...\n');
  
  // Sample data structure as per your requirement
  const sampleAdData = [
    {
      "user_id": "ded1e68b-350d-43f9-bbdb-d343de4436ba",
      "date": "26-06-2025",
      "ads": [
        { "ad_id": "120219408501250312" }, // Replace with actual ad IDs
        { "ad_id": "120219408509190312" },
        { "ad_id": "120219408517130312" }
      ]
    },
    {
      "user_id": "a2f3c123-9f6a-4abc-bbcc-12ab34cd56ef",
      "date": "26-06-2025",
      "ads": [
        { "ad_id": "120219408525070312" },
        { "ad_id": "120219408533010312" }
      ]
    }
  ];
  
  try {
    const result = await callTool('get_lead_report', {
      adDataArray: sampleAdData
    });
    
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success && result.reports) {
      console.log('\n=== NEW REPORT SUMMARY ===');
      console.log(`Total Users: ${result.summary.totalUsers}`);
      console.log(`Total Ads Processed: ${result.summary.totalAds}`);
      console.log(`Total Spend: $${result.summary.totalSpend}`);
      console.log(`Total Impressions: ${result.summary.totalImpressions}`);
      console.log(`Total Clicks: ${result.summary.totalClicks}`);
      console.log(`Average CPM: $${result.summary.averageCPM.toFixed(2)}`);
      console.log(`Average CTR: ${result.summary.averageCTR.toFixed(2)}%`);
      console.log(`Date: ${result.summary.date}`);
      
      console.log('\n=== INDIVIDUAL AD REPORTS ===');
      result.reports.forEach((report, index) => {
        console.log(`\n--- Report ${index + 1} ---`);
        console.log(`User ID: ${report.user_id}`);
        console.log(`Date: ${report.date}`);
        console.log(`Ad ID: ${report.ad_id}`);
        console.log(`Ad Name: ${report.adName}`);
        console.log(`Campaign: ${report.campaignName}`);
        console.log(`Ad Set: ${report.adSetName}`);
        console.log(`Spend: $${report.spend}`);
        console.log(`Impressions: ${report.impressions}`);
        console.log(`Clicks: ${report.clicks}`);
        console.log(`CPM: $${report.cpm}`);
        console.log(`CTR: ${report.ctr}%`);
        if (report.reach) console.log(`Reach: ${report.reach}`);
        if (report.frequency) console.log(`Frequency: ${report.frequency}`);
        if (report.inline_link_clicks) console.log(`Link Clicks: ${report.inline_link_clicks}`);
        if (report.inline_link_click_ctr) console.log(`Link CTR: ${report.inline_link_click_ctr}%`);
      });
      
      if (result.errors && result.errors.length > 0) {
        console.log('\n=== ERRORS ENCOUNTERED ===');
        result.errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error}`);
        });
      }
    } else {
      console.log('❌ Test failed or no reports generated');
      console.log('Message:', result.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testNewLeadReport();
