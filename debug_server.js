// Debug script to check what's happening on the server
const https = require('https');

const USER_ID = 'a35f6da4-1c60-4547-920c-946df589afeb';
const BASE_URL = 'newfb-production.up.railway.app';

// Test a simple health check first
function testHealth() {
  const options = {
    hostname: BASE_URL,
    port: 443,
    path: `/auth/callback`,  // Try a different endpoint
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  };

  console.log('1. Testing server health...\n');

  const req = https.request(options, (res) => {
    console.log('Server Status:', res.statusCode);
    console.log('Server is', res.statusCode === 200 ? '✅ UP' : '❌ DOWN');
    
    // Now test the session endpoint
    testSessionEndpoint();
  });

  req.on('error', (error) => {
    console.error('Server might be down:', error.message);
  });

  req.end();
}

// Test session endpoint
function testSessionEndpoint() {
  const options = {
    hostname: BASE_URL,
    port: 443,
    path: `/api/session/${USER_ID}`,  // Try checking session directly
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  console.log('\n2. Checking session status...\n');

  const req = https.request(options, (res) => {
    let data = '';
    
    console.log('Session endpoint status:', res.statusCode);
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Session response:', data || 'No data');
      
      // Finally test the MCP endpoint with a simple command
      testSimpleMCP();
    });
  });

  req.on('error', (error) => {
    console.error('Session check error:', error.message);
    testSimpleMCP();
  });

  req.end();
}

// Test with the simplest MCP command
function testSimpleMCP() {
  const postData = JSON.stringify({
    method: 'get_leads_data',
    params: {
      staffId: 'RV-007',
      startDate: '01-06-2025',
      endDate: '01-06-2025'  // Just one day
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

  console.log('\n3. Testing MCP endpoint (non-Facebook)...\n');

  const req = https.request(options, (res) => {
    let data = '';
    
    console.log('MCP Status:', res.statusCode);
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.success) {
          console.log('✅ MCP is working!');
          console.log('Session is active for user:', USER_ID);
        } else {
          console.log('❌ MCP error:', parsed.error);
        }
      } catch (e) {
        console.log('Response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('MCP error:', error.message);
  });

  req.write(postData);
  req.end();
}

// Start tests
testHealth();