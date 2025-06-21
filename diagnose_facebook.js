// Test to check if we need to select an ad account first
const https = require('https');

const USER_ID = 'a35f6da4-1c60-4547-920c-946df589afeb';
const BASE_URL = 'newfb-production.up.railway.app';

console.log('Facebook Ad Account Diagnostic Test\n');
console.log('User ID:', USER_ID);
console.log('Server:', BASE_URL);
console.log('========================================\n');

// Step 1: Check if we have any cached/selected ad account
function checkSelectedAccount() {
  const postData = JSON.stringify({
    method: 'get_campaigns',  // This might work if an account is already selected
    params: {
      limit: 1
    }
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

  console.log('1. Checking if any ad account is selected...\n');

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('Response:', JSON.stringify(parsed, null, 2));
        
        if (parsed.error && parsed.error.includes('No ad account selected')) {
          console.log('\n❌ No ad account is selected. You need to select one first.');
          console.log('\nTo fix this:');
          console.log('1. First get your ad accounts with get_ad_accounts');
          console.log('2. Then select one with select_ad_account');
        } else if (parsed.success) {
          console.log('\n✅ An ad account seems to be selected!');
        }
        
        // Try to check ad directly
        setTimeout(checkAdDirectly, 2000);
      } catch (e) {
        console.log('Error parsing response:', e.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.write(postData);
  req.end();
}

// Step 2: Try to check one of the ads directly
function checkAdDirectly() {
  const postData = JSON.stringify({
    method: 'check_ad_id',
    params: {
      adId: '120219408501250312'  // One of your ads
    }
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

  console.log('\n\n2. Checking specific ad (120219408501250312)...\n');

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('Response:', JSON.stringify(parsed, null, 2));
        
        if (parsed.success) {
          console.log('\n✅ Can access ad data!');
        } else {
          console.log('\n❌ Cannot access ad data');
          console.log('Possible reasons:');
          console.log('- The ad belongs to a different ad account');
          console.log('- Your Facebook user doesn\'t have access to this ad account');
          console.log('- The token doesn\'t have ads_read permission');
        }
      } catch (e) {
        console.log('Error parsing response:', e.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.write(postData);
  req.end();
}

// Start the diagnostic
checkSelectedAccount();