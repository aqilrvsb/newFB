// Direct test to list all Facebook ad accounts
const https = require('https');

const USER_ID = 'a35f6da4-1c60-4547-920c-946df589afeb';
const BASE_URL = 'newfb-production.up.railway.app';

function listAdAccounts() {
  const postData = JSON.stringify({
    method: 'get_ad_accounts',
    params: {}
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

  console.log('Fetching your Facebook Ad Accounts...\n');

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        
        if (parsed.success && parsed.result?.accounts) {
          console.log(`Found ${parsed.result.accounts.length} ad account(s):\n`);
          
          parsed.result.accounts.forEach((account, index) => {
            console.log(`Account ${index + 1}:`);
            console.log(`  ID: ${account.id}`);
            console.log(`  Name: ${account.name}`);
            console.log(`  Status: ${account.account_status}`);
            console.log(`  Currency: ${account.currency}`);
            console.log(`  Timezone: ${account.timezone_name}`);
            console.log('  ---');
          });
          
          if (parsed.result.accounts.length === 0) {
            console.log('No ad accounts found. This could mean:');
            console.log('1. You don\'t have any ad accounts');
            console.log('2. Your token doesn\'t have ads_management permission');
            console.log('3. You need to be added to an ad account');
          }
        } else {
          console.log('Error:', parsed.error || 'Unknown error');
          console.log('\nFull response:', JSON.stringify(parsed, null, 2));
        }
      } catch (e) {
        console.log('Failed to parse response:', e.message);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.write(postData);
  req.end();
}

// Also test with direct Facebook Graph API
function testDirectGraphAPI() {
  console.log('\n\nTesting direct Facebook Graph API...\n');
  
  const postData = JSON.stringify({
    method: 'get_facebook_pages',
    params: {}
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
        const parsed = JSON.parse(data);
        console.log('Facebook Pages response:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('Failed to parse response:', e.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.write(postData);
  req.end();
}

// Run both tests
listAdAccounts();
setTimeout(testDirectGraphAPI, 2000);