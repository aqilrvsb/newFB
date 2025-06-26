// Test session storage and Facebook token
const https = require('https');

const USER_ID = 'e3a7fc70-1fce-4754-a977-7a9808c2c53c';
const BASE_URL = 'newfb-production.up.railway.app';

// Custom endpoint to check session details
function checkSession() {
  const postData = JSON.stringify({
    method: 'debug_session',
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

  console.log('Checking session details for User ID:', USER_ID);
  console.log('');

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Raw response:', data);
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.write(postData);
  req.end();
}

checkSession();
