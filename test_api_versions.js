// Test with specific API version
const https = require('https');

const FB_ACCESS_TOKEN = 'EAA8rmujqwMwBO5uxGZCS7DhTAtZAuVI1G1v3WU8kYdndU94wLO7VTY9hnsB79H7JBudImC96ZAHMWZAZBE4KXgPDx2YdSk0DQi40A2r7pcswH9qO1TMAipXm3ArstIxgghzQ8uLbZBb6YFcWX89c5Ea89avLIloV9fCw04zfGFGbIZBb3IDzzIUeZBDVzRqPtESA';

console.log('Testing Facebook API versions...\n');

// Test different API versions
const versions = ['v18.0', 'v19.0', 'v20.0', 'v21.0', 'v22.0', 'v23.0'];

async function testVersion(version) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/${version}/me/adaccounts?fields=id,name&access_token=${FB_ACCESS_TOKEN}`,
      method: 'GET'
    };

    console.log(`Testing ${version}...`);

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          
          if (parsed.data) {
            console.log(`✅ ${version} works! Found ${parsed.data.length} ad account(s)`);
            if (parsed.data.length > 0) {
              console.log(`   First account: ${parsed.data[0].id} - ${parsed.data[0].name}`);
            }
          } else if (parsed.error) {
            console.log(`❌ ${version} failed: ${parsed.error.message}`);
          }
        } catch (e) {
          console.log(`❌ ${version} error: ${e.message}`);
        }
        console.log('');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error(`${version} request error:`, error.message);
      resolve();
    });

    req.end();
  });
}

// Test all versions sequentially
async function testAllVersions() {
  for (const version of versions) {
    await testVersion(version);
  }
  
  console.log('\nRecommendation:');
  console.log('Update your facebook-nodejs-business-sdk to the latest version');
  console.log('Run: npm install facebook-nodejs-business-sdk@latest');
}

testAllVersions();