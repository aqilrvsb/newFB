const fetch = require('node-fetch');

async function testLeadReport() {
  try {
    // First, let's authenticate
    const authResponse = await fetch('http://localhost:3000/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        facebookAppId: '1351952692757405',
        facebookAppSecret: '92432bc79dfe9bbed3e40f6ceb88f43f',
        facebookAccessToken: 'YOUR_ACCESS_TOKEN' // Replace with actual token
      })
    });

    const authData = await authResponse.json();
    console.log('Auth Response:', authData);

    if (!authData.userId) {
      console.error('Authentication failed');
      return;
    }

    const userId = authData.userId;

    // Now test the get_lead_report tool
    const reportResponse = await fetch('http://localhost:3000/tool', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId
      },
      body: JSON.stringify({
        tool: 'get_lead_report',
        args: {
          staffId: 'RV-007',
          startDate: '01-06-2025',
          endDate: '21-06-2025'
        }
      })
    });

    const reportData = await reportResponse.json();
    console.log('\n=== Lead Report Response ===');
    console.log(JSON.stringify(reportData, null, 2));

    if (reportData.success && reportData.reports) {
      console.log('\n=== Report Summary ===');
      console.log(`Total Reports: ${reportData.reports.length}`);
      console.log(`Total Leads: ${reportData.summary.totalLeads}`);
      console.log(`Total Customers: ${reportData.summary.totalCustomers}`);
      console.log(`Total Revenue: $${reportData.summary.totalRevenue}`);
      console.log(`Total Spent: $${reportData.summary.totalSpent}`);
      console.log(`Overall ROAS: ${reportData.summary.overallROAS.toFixed(2)}`);
      console.log(`Overall Cost Per Lead: $${reportData.summary.overallCostPerLead.toFixed(2)}`);

      console.log('\n=== Individual Ad Reports ===');
      reportData.reports.forEach((report, index) => {
        console.log(`\n--- Report ${index + 1} ---`);
        console.log(`Ad Name: ${report.adName}`);
        console.log(`Ad ID: ${report.adId || 'N/A'}`);
        console.log(`Post URL: ${report.postUrl || 'N/A'}`);
        console.log(`Budget: $${report.budgetAds}`);
        console.log(`Amount Spent: $${report.amountSpent}`);
        console.log(`Total Leads: ${report.totalLead}`);
        console.log(`Cost Per Lead: $${report.costPerLead.toFixed(2)}`);
        console.log(`CPM: $${report.cpm}`);
        console.log(`CTR: ${report.ctr}%`);
        console.log(`CTR Link Click: ${report.ctrLinkClick}%`);
        console.log(`Total Customers: ${report.totalCustomer}`);
        console.log(`Total Revenue: $${report.totalPrice}`);
        console.log(`ROAS: ${report.roas.toFixed(2)}`);
      });
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testLeadReport();
