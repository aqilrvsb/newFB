// Direct test of get_lead_report tool via MCP endpoint
const https = require('https');

const USER_ID = 'f9de49d5-2b6a-44b7-8d66-8095a5ffed1f';
const BASE_URL = 'newfb-production.up.railway.app';

function callTool(toolName, args) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      method: toolName,
      params: args
    });

    const options = {
      hostname: BASE_URL,
      port: 443,
      path: `/mcp/${USER_ID}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
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

// Test the get_lead_report tool
async function test() {
  console.log('Testing get_lead_report tool via MCP endpoint...\n');
  
  try {
    const result = await callTool('get_lead_report', {
      staffId: 'RV-007',
      startDate: '01-06-2025',
      endDate: '21-06-2025'
    });
    
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success && result.reports) {
      console.log('\n=== REPORT SUMMARY ===');
      console.log(`Date Range: ${result.dateRange.start} to ${result.dateRange.end}`);
      console.log(`Staff ID: ${result.staffId}`);
      console.log(`Total Reports: ${result.reports.length}`);
      console.log(`Total Leads: ${result.summary.totalLeads}`);
      console.log(`Total Customers: ${result.summary.totalCustomers}`);
      console.log(`Total Revenue: $${result.summary.totalRevenue}`);
      console.log(`Total Ad Spend: $${result.summary.totalSpent}`);
      console.log(`Overall ROAS: ${result.summary.overallROAS.toFixed(2)}`);
      console.log(`Overall Cost Per Lead: $${result.summary.overallCostPerLead.toFixed(2)}`);
      
      console.log('\n=== INDIVIDUAL AD REPORTS ===');
      result.reports.forEach((report, index) => {
        console.log(`\n--- Report ${index + 1} ---`);
        console.log(`Ad Name: ${report.adName}`);
        console.log(`Ad ID: ${report.adId || 'N/A'}`);
        console.log(`Campaign: ${report.campaignName || 'N/A'}`);
        console.log(`Ad Set: ${report.adSetName || 'N/A'}`);
        console.log(`Post URL: ${report.postUrl || 'N/A'}`);
        console.log(`Budget: $${report.budgetAds}`);
        console.log(`Spent: $${report.amountSpent}`);
        console.log(`Leads: ${report.totalLead}`);
        console.log(`Cost/Lead: $${report.costPerLead.toFixed(2)}`);
        console.log(`CPM: $${report.cpm}`);
        console.log(`CTR: ${report.ctr}%`);
        console.log(`Link CTR: ${report.ctrLinkClick}%`);
        console.log(`Customers: ${report.totalCustomer}`);
        console.log(`Revenue: $${report.totalPrice}`);
        console.log(`ROAS: ${report.roas.toFixed(2)}`);
      });
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

test();
