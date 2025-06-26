// Test script to check if Facebook session is active
const https = require('https');

const USER_ID = 'a35f6da4-1c60-4547-920c-946df589afeb';
const BASE_URL = 'newfb-production.up.railway.app';

// Test direct API call to check session
function testSession() {
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

  console.log('Testing connection to:', `https://${BASE_URL}/mcp/${USER_ID}`);
  console.log('Sending request...');

  const req = https.request(options, (res) => {
    let data = '';
    
    console.log('Response Status:', res.statusCode);
    console.log('Response Headers:', res.headers);
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\nRaw Response:');
      console.log(data);
      
      try {
        const parsed = JSON.parse(data);
        console.log('\nParsed Response:');
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('Failed to parse JSON:', e.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.write(postData);
  req.end();
}

testSession();