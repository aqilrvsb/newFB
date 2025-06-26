/**
 * COMPLETE RAILWAY & CLAUDE DESKTOP VALIDATION
 * Tests all endpoints and verifies Claude can connect properly
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'newfb-production.up.railway.app';
const TEST_CREDENTIALS = {
    facebookAppId: 'test_app_id',
    facebookAppSecret: 'test_app_secret', 
    facebookAccessToken: 'test_access_token'
};

// Color output for better visibility
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const postData = data ? JSON.stringify(data) : null;
        
        const options = {
            hostname: BASE_URL,
            port: 443,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (postData) {
            req.write(postData);
        }
        
        req.end();
    });
}

async function testEndpoint(name, path, method = 'GET', data = null, expectedStatus = 200) {
    try {
        log(`\n🧪 Testing ${name}...`, colors.yellow);
        const result = await makeRequest(path, method, data);
        
        if (result.status === expectedStatus) {
            log(`✅ ${name} - SUCCESS (${result.status})`, colors.green);
            if (typeof result.data === 'object') {
                console.log('   Response:', JSON.stringify(result.data, null, 2));
            } else {
                console.log('   Response type:', typeof result.data);
            }
            return true;
        } else {
            log(`❌ ${name} - FAILED (${result.status})`, colors.red);
            console.log('   Response:', result.data);
            return false;
        }
    } catch (error) {
        log(`❌ ${name} - ERROR: ${error.message}`, colors.red);
        return false;
    }
}

async function testAuthFlow() {
    log(`\n🔐 Testing Authentication Flow...`, colors.blue);
    
    try {
        const authResult = await makeRequest('/auth', 'POST', TEST_CREDENTIALS);
        
        if (authResult.status === 200 && authResult.data.success) {
            log(`✅ Auth Flow - SUCCESS`, colors.green);
            console.log('   User ID:', authResult.data.userId);
            return authResult.data.userId;
        } else {
            log(`❌ Auth Flow - FAILED`, colors.red);
            console.log('   Response:', authResult.data);
            return null;
        }
    } catch (error) {
        log(`❌ Auth Flow - ERROR: ${error.message}`, colors.red);
        return null;
    }
}

async function testStreamEndpoint(userId) {
    if (!userId) {
        log(`⚠️  Skipping Stream Test - No User ID`, colors.yellow);
        return false;
    }
    
    log(`\n🌊 Testing Stream Endpoint with User ID: ${userId}...`, colors.blue);
    
    const mcpMessage = {
        jsonrpc: '2.0',
        method: 'tools/list',
        id: Math.random()
    };
    
    try {
        const result = await makeRequest(`/stream/${userId}`, 'POST', mcpMessage);
        
        if (result.status === 200 && result.data.result && result.data.result.tools) {
            log(`✅ Stream Endpoint - SUCCESS`, colors.green);
            console.log(`   Found ${result.data.result.tools.length} tools`);
            console.log('   Sample tools:', result.data.result.tools.slice(0, 3).map(t => t.name));
            return true;
        } else {
            log(`❌ Stream Endpoint - FAILED`, colors.red);
            console.log('   Response:', result.data);
            return false;
        }
    } catch (error) {
        log(`❌ Stream Endpoint - ERROR: ${error.message}`, colors.red);
        return false;
    }
}

function generateClaudeConfig(userId) {
    const clientScript = [
        "const https = require('https');",
        "const readline = require('readline');", 
        `const USER_ID = '${userId}';`,
        "const BASE_URL = 'newfb-production.up.railway.app';",
        "const rl = readline.createInterface({ input: process.stdin, output: process.stdout });",
        "function sendRequest(method, params = {}) {",
        "  return new Promise((resolve, reject) => {",
        "    const postData = JSON.stringify({ jsonrpc: '2.0', method, params, id: Math.random() });",
        "    const options = { hostname: BASE_URL, port: 443, path: '/stream/' + USER_ID, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } };",
        "    const req = https.request(options, (res) => {",
        "      let data = '';",
        "      res.on('data', (chunk) => { data += chunk; });",
        "      res.on('end', () => {",
        "        try {",
        "          const response = JSON.parse(data);",
        "          if (response.result) { resolve(response.result); }",
        "          else if (response.error) { reject(new Error(response.error.message || 'Unknown error')); }",
        "          else { resolve(response); }",
        "        } catch (e) { reject(new Error('Invalid JSON response')); }",
        "      });",
        "    });",
        "    req.on('error', reject);",
        "    req.write(postData);",
        "    req.end();",
        "  });",
        "}",
        "rl.on('line', async (line) => {",
        "  try {",
        "    const message = JSON.parse(line);",
        "    if (message.method === 'initialize') {",
        "      console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'facebook-ads-stream', version: '2.0.0' } } }));",
        "    } else if (message.method === 'notifications/initialized') {",
        "      return;",
        "    } else if (message.method === 'tools/list') {",
        "      try {",
        "        const result = await sendRequest('tools/list', {});",
        "        console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result }));",
        "      } catch (error) {",
        "        console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, error: { code: -32603, message: error.message } }));",
        "      }",
        "    } else if (message.method === 'resources/list') {",
        "      console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { resources: [] } }));",
        "    } else if (message.method === 'prompts/list') {",
        "      console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { prompts: [] } }));",
        "    } else if (message.method === 'tools/call') {",
        "      try {",
        "        const result = await sendRequest('tools/call', { name: message.params.name, arguments: message.params.arguments || {} });",
        "        console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } }));",
        "      } catch (error) {",
        "        console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, error: { code: -32603, message: error.message } }));",
        "      }",
        "    } else {",
        "      console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: {} }));",
        "    }",
        "  } catch (error) {",
        "    console.error('Parse error:', error);",
        "  }",
        "});",
        "process.on('SIGINT', () => process.exit(0));",
        "process.on('SIGTERM', () => process.exit(0));"
    ].join(' ');

    return {
        "mcpServers": {
            "facebook-ads": {
                "command": "node",
                "args": [
                    "-e",
                    clientScript
                ]
            }
        }
    };
}

async function runFullValidation() {
    log(`${colors.bold}🚀 STARTING FULL RAILWAY & CLAUDE DESKTOP VALIDATION${colors.reset}`, colors.blue);
    log(`Testing Railway URL: https://${BASE_URL}`, colors.blue);
    
    const results = {
        health: false,
        getUserId: false,
        testDeploy: false,
        auth: false,
        stream: false,
        overall: false
    };

    // Test basic endpoints
    results.health = await testEndpoint('Health Check', '/health');
    results.getUserId = await testEndpoint('Get User ID Page', '/get-user-id');
    results.testDeploy = await testEndpoint('Test Deploy', '/test-deploy');
    
    // Test authentication flow
    const userId = await testAuthFlow();
    results.auth = userId !== null;
    
    // Test stream endpoint
    results.stream = await testStreamEndpoint(userId);
    
    // Calculate overall success
    results.overall = Object.values(results).every(result => result === true);
    
    // Generate final report
    log(`\n${colors.bold}📊 VALIDATION RESULTS${colors.reset}`, colors.blue);
    log(`Health Check: ${results.health ? '✅' : '❌'}`, results.health ? colors.green : colors.red);
    log(`User ID Page: ${results.getUserId ? '✅' : '❌'}`, results.getUserId ? colors.green : colors.red);
    log(`Test Deploy: ${results.testDeploy ? '✅' : '❌'}`, results.testDeploy ? colors.green : colors.red);
    log(`Authentication: ${results.auth ? '✅' : '❌'}`, results.auth ? colors.green : colors.red);
    log(`Stream Endpoint: ${results.stream ? '✅' : '❌'}`, results.stream ? colors.green : colors.red);
    log(`Overall Status: ${results.overall ? '✅ PASS' : '❌ FAIL'}`, results.overall ? colors.green : colors.red);
    
    if (results.overall) {
        log(`\n${colors.bold}🎉 ALL TESTS PASSED! Claude Desktop can connect to Railway.${colors.reset}`, colors.green);
        
        if (userId) {
            log(`\n${colors.bold}📋 CLAUDE DESKTOP CONFIGURATION${colors.reset}`, colors.blue);
            log(`Save this to your Claude Desktop config file:`, colors.yellow);
            
            const config = generateClaudeConfig(userId);
            console.log(JSON.stringify(config, null, 2));
            
            // Save config to file
            const configPath = path.join(__dirname, 'claude_desktop_config_validated.json');
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            log(`\n✅ Configuration saved to: ${configPath}`, colors.green);
            
            log(`\n${colors.bold}📍 SETUP INSTRUCTIONS:${colors.reset}`, colors.blue);
            log(`1. Copy the configuration above`, colors.yellow);
            log(`2. Open your Claude Desktop config file:`, colors.yellow);
            log(`   • Windows: %APPDATA%\\Claude\\claude