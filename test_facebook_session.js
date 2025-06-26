// Test if session exists and has Facebook token
const https = require('https');

const USER_ID = 'a35f6da4-1c60-4547-920c-946df589afeb';
const BASE_URL = 'newfb-production.up.railway.app';

// First test a simple endpoint that doesn't require Facebook
function testLeadsData() {
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

  console.log('1. Testing leads data (no Facebook required)...\n');

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.success) {
          console.log('✅ Leads data works! Session is active.\n');
        } else {
          console.log('❌ Leads data failed:', parsed.error, '\n');
        }
        
        // Now test Facebook
        testFacebookPages();
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

// Test Facebook pages endpoint
function testFacebookPages() {
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

  console.log('2. Testing Facebook pages (requires Facebook token)...\n');

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.success) {
          console.log('✅ Facebook API works! Token is valid.');
          console.log('Pages found:', parsed.pages?.length || 0);
        } else {
          console.log('❌ Facebook API failed:', parsed.error);
          console.log('\nPossible issues:');
          console.log('1. Facebook token might have expired');
          console.log('2. Token might not have required permissions');
          console.log('3. Session might not have Facebook credentials');
          console.log('\nSolution: Re-authenticate at https://newfb-production.up.railway.app/');
        }
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

// Start tests
testLeadsData();