// Test Facebook credentials directly
const https = require('https');

// Your credentials
const FB_APP_ID = '4270068983316684';
const FB_APP_SECRET = '7e2d50ddccb717fec03b9e5b4746505c';
const FB_ACCESS_TOKEN = 'EAA8rmujqwMwBO5uxGZCS7DhTAtZAuVI1G1v3WU8kYdndU94wLO7VTY9hnsB79H7JBudImC96ZAHMWZAZBE4KXgPDx2YdSk0DQi40A2r7pcswH9qO1TMAipXm3ArstIxgghzQ8uLbZBb6YFcWX89c5Ea89avLIloV9fCw04zfGFGbIZBb3IDzzIUeZBDVzRqPtESA';

console.log('Facebook Credentials Verification\n');
console.log('App ID:', FB_APP_ID);
console.log('Token:', FB_ACCESS_TOKEN.substring(0, 20) + '...\n');

// Test 1: Verify token with Facebook Graph API
function verifyToken() {
  const options = {
    hostname: 'graph.facebook.com',
    port: 443,
    path: `/debug_token?input_token=${FB_ACCESS_TOKEN}&access_token=${FB_APP_ID}|${FB_APP_SECRET}`,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  };

  console.log('1. Verifying token with Facebook...\n');

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        
        if (parsed.data) {
          console.log('Token Details:');
          console.log('- Valid:', parsed.data.is_valid ? '✅ YES' : '❌ NO');
          console.log('- App ID:', parsed.data.app_id);
          console.log('- User ID:', parsed.data.user_id);
          console.log('- Expires:', parsed.data.expires_at ? new Date(parsed.data.expires_at * 1000).toLocaleString() : 'Never');
          console.log('- Scopes:', parsed.data.scopes ? parsed.data.scopes.join(', ') : 'None');
          
          if (parsed.data.is_valid) {
            // Test 2: Get user info
            setTimeout(getUserInfo, 1000);
          }
        } else if (parsed.error) {
          console.log('❌ Error:', parsed.error.message);
        }
      } catch (e) {
        console.log('Error parsing response:', e.message);
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.end();
}

// Test 2: Get user info
function getUserInfo() {
  const options = {
    hostname: 'graph.facebook.com',
    port: 443,
    path: `/me?fields=id,name,email&access_token=${FB_ACCESS_TOKEN}`,
    method: 'GET'
  };

  console.log('\n\n2. Getting user info...\n');

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        
        if (parsed.id) {
          console.log('User Info:');
          console.log('- ID:', parsed.id);
          console.log('- Name:', parsed.name);
          console.log('- Email:', parsed.email || 'Not provided');
          
          // Test 3: Get ad accounts
          setTimeout(getAdAccounts, 1000);
        } else if (parsed.error) {
          console.log('❌ Error:', parsed.error.message);
        }
      } catch (e) {
        console.log('Error parsing response:', e.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.end();
}

// Test 3: Get ad accounts
function getAdAccounts() {
  const options = {
    hostname: 'graph.facebook.com',
    port: 443,
    path: `/me/adaccounts?fields=id,name,account_status,currency&access_token=${FB_ACCESS_TOKEN}`,
    method: 'GET'
  };

  console.log('\n\n3. Getting ad accounts...\n');

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        
        if (parsed.data) {
          console.log(`Found ${parsed.data.length} ad account(s):\n`);
          
          parsed.data.forEach((account, index) => {
            console.log(`Account ${index + 1}:`);
            console.log('- ID:', account.id);
            console.log('- Name:', account.name);
            console.log('- Status:', account.account_status === 1 ? '✅ Active' : '❌ Inactive');
            console.log('- Currency:', account.currency);
            console.log('');
          });
          
          if (parsed.data.length === 0) {
            console.log('No ad accounts found. Possible reasons:');
            console.log('- You need to create an ad account');
            console.log('- Token doesn\'t have ads_management permission');
            console.log('- You need to be added to an existing ad account');
          }
        } else if (parsed.error) {
          console.log('❌ Error:', parsed.error.message);
          if (parsed.error.code === 190) {
            console.log('\nToken might be expired or invalid.');
          }
        }
      } catch (e) {
        console.log('Error parsing response:', e.message);
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.end();
}

// Start verification
verifyToken();