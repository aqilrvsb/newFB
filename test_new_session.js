// Test with new User ID
const https = require('https');

const USER_ID = '070ee4ee-a57d-4378-9051-116ae1c2c2c7'; // Your NEW User ID
const BASE_URL = 'newfb-production.up.railway.app';

function testNewSession() {
  const postData = JSON.stringify({
    method: 'get_leads_data',
    params: {
      staffId: 'RV-007',
      startDate: '01-06-2025',
      endDate: '21-06-2025'
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

  console.log('Testing with new User ID:', USER_ID);
  console.log('URL:', `https://${BASE_URL}/mcp/${USER_ID}`);
  console.log('');

  const req = https.request(options, (res) => {
    let data = '';
    
    console.log('Response Status:', res.statusCode);
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.success) {
          console.log('✅ Session is valid! Lead data works.');
          console.log('\nNow testing Facebook API...');
          testFacebookAPI();
        } else {
          console.log('❌ Error:', parsed.error || parsed.message);
        }
      } catch (e) {
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.write(postData);
  req.end();
}

function testFacebookAPI() {
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

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        console.log('\nFacebook API Response:');
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Request error:', error);
  });

  req.write(postData);
  req.end();
}

testNewSession();