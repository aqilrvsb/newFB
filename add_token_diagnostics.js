// Diagnostic script to verify Facebook SDK token handling
const fs = require('fs');
const path = require('path');

async function addTokenDiagnostics() {
  const filePath = path.join(__dirname, 'src', 'http-server.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  console.log('🔍 Adding diagnostics to verify Facebook SDK token handling...\n');

  // Add diagnostic logging to processMcpToolCall
  const processMcpPattern = /async function processMcpToolCall\(toolName: string, args: any, userId: string\): Promise<any> \{[\s\S]*?FacebookAdsApi\.init\(session\.credentials\.facebookAccessToken\);/;
  
  const processMcpMatch = content.match(processMcpPattern);
  
  if (processMcpMatch) {
    const originalBlock = processMcpMatch[0];
    const newBlock = originalBlock.replace(
      'FacebookAdsApi.init(session.credentials.facebookAccessToken);',
      `// Diagnostic: Log token status
    console.log('[DIAGNOSTIC] Processing MCP tool:', toolName);
    console.log('[DIAGNOSTIC] User ID:', userId);
    console.log('[DIAGNOSTIC] Session exists:', !!session);
    console.log('[DIAGNOSTIC] Has credentials:', !!session?.credentials);
    console.log('[DIAGNOSTIC] Has Facebook token:', !!session?.credentials?.facebookAccessToken);
    console.log('[DIAGNOSTIC] Token length:', session?.credentials?.facebookAccessToken?.length || 0);
    console.log('[DIAGNOSTIC] Token preview:', session?.credentials?.facebookAccessToken?.substring(0, 20) + '...');
    
    try {
      FacebookAdsApi.init(session.credentials.facebookAccessToken);
      console.log('[DIAGNOSTIC] SDK initialized successfully');
    } catch (sdkError) {
      console.error('[DIAGNOSTIC] SDK initialization failed:', sdkError);
      throw sdkError;
    }`
    );
    
    content = content.replace(originalBlock, newBlock);
    console.log('✅ Added diagnostics to processMcpToolCall');
  }

  // Add diagnostic to get_ad_accounts specifically
  const getAdAccountsPattern = /case 'get_ad_accounts':[\s\S]*?const accountsResponse = await user\.getAdAccounts/;
  const getAdAccountsMatch = content.match(getAdAccountsPattern);
  
  if (getAdAccountsMatch) {
    const originalBlock = getAdAccountsMatch[0];
    const newBlock = originalBlock.replace(
      'const accountsResponse = await user.getAdAccounts',
      `console.log('[DIAGNOSTIC] get_ad_accounts - About to call Facebook API');
          console.log('[DIAGNOSTIC] SDK Default API:', !!FacebookAdsApi.getDefaultApi());
          
          const accountsResponse = await user.getAdAccounts`
    );
    
    content = content.replace(originalBlock, newBlock);
    console.log('✅ Added diagnostics to get_ad_accounts');
  }

  // Add diagnostic for session retrieval
  const sessionPattern = /const session = userSessionManager\.getSession\(userId\);/g;
  let sessionCount = 0;
  content = content.replace(sessionPattern, (match) => {
    sessionCount++;
    return `const session = userSessionManager.getSession(userId);
    console.log('[DIAGNOSTIC] Session retrieved for user:', userId, 'Has session:', !!session);`;
  });
  console.log(`✅ Added diagnostics to ${sessionCount} session retrievals`);

  // Add diagnostic to the helper function if it exists
  const helperPattern = /function ensureFacebookSDKInitialized\(session: any\): boolean \{/;
  if (content.match(helperPattern)) {
    content = content.replace(helperPattern, 
      `function ensureFacebookSDKInitialized(session: any): boolean {
    console.log('[DIAGNOSTIC] ensureFacebookSDKInitialized called');
    console.log('[DIAGNOSTIC] Session param:', !!session);
    console.log('[DIAGNOSTIC] Token exists:', !!session?.credentials?.facebookAccessToken);`
    );
    console.log('✅ Added diagnostics to ensureFacebookSDKInitialized');
  }

  // Write the updated content
  fs.writeFileSync(filePath, content);
  
  console.log('\n📊 Diagnostics added successfully!');
  console.log('\n🔍 What these diagnostics will show:');
  console.log('1. Whether the session is being retrieved correctly');
  console.log('2. If the Facebook token exists in the session');
  console.log('3. Token length and preview (first 20 chars)');
  console.log('4. Whether SDK initialization succeeds or fails');
  console.log('5. The actual error if SDK initialization fails');
  
  console.log('\n📝 Next steps:');
  console.log('1. Deploy this update to Railway');
  console.log('2. Try calling get_ad_accounts');
  console.log('3. Check Railway logs for [DIAGNOSTIC] messages');
  console.log('4. Share the diagnostic output so we can see what\'s happening');
}

// Also create a standalone test to check session storage
async function createSessionTest() {
  const testContent = `// Test session storage and Facebook token
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
    path: \`/mcp/\${USER_ID}\`,
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
`;

  fs.writeFileSync(path.join(__dirname, 'test_session_storage.js'), testContent);
  console.log('\n✅ Created test_session_storage.js');
}

// Run both functions
addTokenDiagnostics()
  .then(() => createSessionTest())
  .catch(console.error);