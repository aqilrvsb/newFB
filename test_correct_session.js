// Test with the NEW User ID
const https = require('https');

const USER_ID = 'e3a7fc70-1fce-4754-a977-7a9808c2c53c'; // Your NEW User ID
const BASE_URL = 'newfb-production.up.railway.app';

function testSession() {
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

  console.log('Testing with User ID:', USER_ID);
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
          console.log('✅ Session is valid!');
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

testSession();