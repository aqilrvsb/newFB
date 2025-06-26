import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { serverConfig, userSessionManager, UserCredentials, getAdAccountForUser } from './config.js';
import { createMcpServer } from './mcp-server.js';
import path from 'path';

// Import all tools functions
import * as campaignTools from './tools/campaign-tools.js';
import * as audienceTools from './tools/audience-tools.js';
import * as analyticsTools from './tools/analytics-tools.js';
import * as adSetTools from './tools/adset-tools.js';
import * as adTools from './tools/ad-tools.js';

const rateLimiter = new RateLimiterMemory({
  points: serverConfig.rateLimit.maxRequests,
  duration: serverConfig.rateLimit.windowMs / 1000,
});

const app = express();
const server = createServer(app);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors({
  origin: serverConfig.corsOrigins,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use('/public', express.static('public'));

// Also serve auth.html directly at /get-user-id route for easier access
app.get('/get-user-id', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facebook Ads MCP - Get Your User ID</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); }
        h1 { color: #2d3748; text-align: center; margin-bottom: 15px; font-size: 2.5rem; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .subtitle { text-align: center; color: #4a5568; margin-bottom: 30px; font-size: 1.1rem; }
        .step { background: #f8f9fa; border-radius: 15px; padding: 25px; margin: 20px 0; border-left: 5px solid #667eea; }
        .step h3 { color: #2d3748; margin-bottom: 15px; font-size: 1.3rem; }
        .form-group { margin: 15px 0; }
        label { display: block; margin-bottom: 8px; font-weight: 600; color: #4a5568; }
        input[type="text"] { width: 100%; padding: 12px 15px; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 16px; transition: all 0.3s ease; }
        input[type="text"]:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
        .btn { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 15px 30px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; width: 100%; margin: 20px 0; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3); }
        .result { background: #f8f9fa; border: 2px solid #48bb78; border-radius: 10px; padding: 20px; margin: 20px 0; display: none; }
        .result.show { display: block; }
        .user-id { font-family: 'Courier New', monospace; background: #2d3748; color: #68d391; padding: 15px; border-radius: 8px; font-size: 16px; text-align: center; margin: 15px 0; word-break: break-all; }
        .status { padding: 15px; border-radius: 10px; margin: 15px 0; font-weight: 500; display: none; }
        .status.success { background: #c6f6d5; color: #22543d; border: 2px solid #9ae6b4; display: block; }
        .status.error { background: #fed7d7; color: #742a2a; border: 2px solid #fc8181; display: block; }
        .status.loading { background: #bee3f8; color: #2a4365; border: 2px solid #7bb8e8; display: block; }
        .copy-btn { background: #48bb78; padding: 10px 20px; font-size: 14px; margin-top: 10px; }
        .copy-btn:hover { background: #38a169; }
        .config-section { background: #1a202c; border-radius: 15px; padding: 25px; margin: 20px 0; color: #e2e8f0; }
        .config-section h3 { color: #68d391; margin-bottom: 15px; }
        pre { background: #2d3748; padding: 20px; border-radius: 10px; overflow-x: auto; border: 2px solid #4a5568; font-family: 'Courier New', monospace; line-height: 1.6; font-size: 12px; }
        .highlight { background: #fef5e7; padding: 15px; border-radius: 10px; border: 2px solid #f6e05e; margin: 15px 0; }
        .highlight strong { color: #744210; }
        .instructions { background: linear-gradient(135deg, #ebf8ff, #e6fffa); border: 2px solid #81e6d9; border-radius: 10px; padding: 20px; margin: 20px 0; }
        .instructions h3 { color: #234e52; margin-bottom: 15px; }
        .instructions ol { color: #285e61; line-height: 1.8; padding-left: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Facebook Ads MCP</h1>
        <p class="subtitle">Get Your Personal User ID for Claude Desktop Integration</p>
        
        <div class="highlight">
            <strong>📍 Step 1:</strong> Get your User ID here → <strong>📍 Step 2:</strong> Update your Claude Desktop config → <strong>📍 Step 3:</strong> Use Facebook Ads tools in Claude!
        </div>
        
        <div class="step">
            <h3>🔑 Enter Your Facebook Credentials</h3>
            <div class="form-group">
                <label for="appId">Facebook App ID</label>
                <input type="text" id="appId" placeholder="1234567890123456" />
            </div>
            
            <div class="form-group">
                <label for="appSecret">Facebook App Secret</label>
                <input type="text" id="appSecret" placeholder="abcdef1234567890abcdef1234567890" />
            </div>
            
            <div class="form-group">
                <label for="accessToken">Facebook Access Token</label>
                <input type="text" id="accessToken" placeholder="EAA..." />
            </div>
            
            <button class="btn" onclick="authenticate()">
                🚀 Get My User ID
            </button>
        </div>
        
        <div id="status" class="status"></div>
        
        <div id="result" class="result">
            <h3>✅ Your Personal User ID:</h3>
            <div id="userId" class="user-id"></div>
            <button class="copy-btn" onclick="copyUserId()">📋 Copy User ID</button>
            
            <div class="config-section">
                <h3>📝 Claude Desktop Configuration</h3>
                <p>Copy this complete configuration for Claude Desktop:</p>
                <pre id="configJson"></pre>
                <button class="copy-btn" onclick="copyConfig()">📋 Copy Configuration</button>
            </div>
            
            <div class="instructions">
                <h3>📱 Setup Instructions:</h3>
                <ol>
                    <li><strong>Copy the Claude Desktop configuration</strong> above (it has your User ID already inserted)</li>
                    <li><strong>Open your Claude Desktop config file:</strong>
                        <br>• Windows: <code>%APPDATA%\\Claude\\claude_desktop_config.json</code>
                        <br>• macOS: <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>
                        <br>• Linux: <code>~/.config/Claude/claude_desktop_config.json</code>
                    </li>
                    <li><strong>Replace the entire file contents</strong> with the configuration above</li>
                    <li><strong>Save the file</strong></li>
                    <li><strong>Restart Claude Desktop</strong></li>
                    <li><strong>Test Facebook Ads tools</strong> - you now have 11 tools available!</li>
                </ol>
            </div>
        </div>
    </div>

    <script>
        let currentUserId = null;
        
        async function authenticate() {
            const appId = document.getElementById('appId').value.trim();
            const appSecret = document.getElementById('appSecret').value.trim();
            const accessToken = document.getElementById('accessToken').value.trim();
            
            if (!appId || !appSecret || !accessToken) {
                showStatus('Please fill in all fields', 'error');
                return;
            }
            
            showStatus('🔄 Authenticating with Railway server...', 'loading');
            
            try {
                const response = await fetch('/auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        facebookAppId: appId,
                        facebookAppSecret: appSecret,
                        facebookAccessToken: accessToken
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    currentUserId = data.userId;
                    document.getElementById('userId').textContent = currentUserId;
                    generateConfig(currentUserId);
                    document.getElementById('result').classList.add('show');
                    showStatus('✅ Authentication successful! Your User ID and config are ready.', 'success');
                } else {
                    showStatus('❌ Authentication failed: ' + (data.error || 'Unknown error'), 'error');
                }
            } catch (error) {
                showStatus('❌ Connection error: ' + error.message + '. Make sure Railway is running.', 'error');
            }
        }
        
        function generateConfig(userId) {
            const config = {
                "mcpServers": {
                    "facebook-ads": {
                        "command": "node",
                        "args": [
                            "-e",
                            "const https = require('https'); const readline = require('readline'); const USER_ID = '" + userId + "'; const BASE_URL = 'newfb-production.up.railway.app'; const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); function sendRequest(method, params = {}) { return new Promise((resolve, reject) => { const postData = JSON.stringify({ method, params }); const options = { hostname: BASE_URL, port: 443, path: \\\`/mcp/\\\${USER_ID}\\\`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } }; const req = https.request(options, (res) => { let data = ''; res.on('data', (chunk) => { data += chunk; }); res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Invalid JSON response')); } }); }); req.on('error', reject); req.write(postData); req.end(); }); } rl.on('line', async (line) => { try { const message = JSON.parse(line); if (message.method === 'initialize') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'facebook-ads-http', version: '1.0.0' } } })); } else if (message.method === 'notifications/initialized') { return; } else if (message.method === 'tools/list') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { tools: [ { name: 'create_campaign', description: 'Creates a new ad campaign', inputSchema: { type: 'object', properties: { name: { type: 'string' }, objective: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] } }, required: ['name', 'objective'] } }, { name: 'get_ad_accounts', description: 'Get list of available Facebook ad accounts', inputSchema: { type: 'object', properties: {} } }, { name: 'select_ad_account', description: 'Select a specific Facebook ad account to use', inputSchema: { type: 'object', properties: { accountId: { type: 'string', description: 'Facebook Ad Account ID (e.g., act_1234567890)' } }, required: ['accountId'] } }, { name: 'get_campaigns', description: 'Lists existing campaigns', inputSchema: { type: 'object', properties: { limit: { type: 'number', default: 25 } } } }, { name: 'get_campaign_details', description: 'Gets details for a specific campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string', description: 'Campaign ID' } }, required: ['campaignId'] } }, { name: 'update_campaign', description: 'Updates an existing campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' }, name: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] } }, required: ['campaignId'] } }, { name: 'delete_campaign', description: 'Deletes a campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' } }, required: ['campaignId'] } }, { name: 'create_custom_audience', description: 'Creates a custom, website, or engagement audience', inputSchema: { type: 'object', properties: { name: { type: 'string' }, type: { type: 'string', enum: ['CUSTOM', 'WEBSITE', 'ENGAGEMENT'] }, description: { type: 'string' } }, required: ['name', 'type'] } }, { name: 'get_audiences', description: 'Lists available custom audiences', inputSchema: { type: 'object', properties: { limit: { type: 'number', default: 25 } } } }, { name: 'create_lookalike_audience', description: 'Creates a lookalike audience', inputSchema: { type: 'object', properties: { name: { type: 'string' }, sourceAudienceId: { type: 'string' }, country: { type: 'string' }, ratio: { type: 'number', minimum: 1, maximum: 10 } }, required: ['name', 'sourceAudienceId', 'country'] } }, { name: 'create_ad_set', description: 'Creates a new ad set', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' }, name: { type: 'string' }, targeting: { type: 'object' }, budget: { type: 'number' } }, required: ['campaignId', 'name', 'targeting', 'budget'] } }, { name: 'get_campaign_insights', description: 'Retrieves performance insights for a campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' }, dateRange: { type: 'string', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'] } }, required: ['campaignId'] } }, { name: 'duplicate_campaign', description: 'Duplicates an existing campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' }, newName: { type: 'string' } }, required: ['campaignId'] } }, { name: 'update_ad_set', description: 'Updates an existing ad set', inputSchema: { type: 'object', properties: { adSetId: { type: 'string' }, name: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] }, dailyBudget: { type: 'number' } }, required: ['adSetId'] } }, { name: 'delete_ad_set', description: 'Deletes an ad set', inputSchema: { type: 'object', properties: { adSetId: { type: 'string' } }, required: ['adSetId'] } }, { name: 'duplicate_ad_set', description: 'Duplicates an existing ad set', inputSchema: { type: 'object', properties: { adSetId: { type: 'string' }, newName: { type: 'string' } }, required: ['adSetId'] } }, { name: 'get_ad_set_insights', description: 'Retrieves performance insights for an ad set', inputSchema: { type: 'object', properties: { adSetId: { type: 'string' }, dateRange: { type: 'string', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'] } }, required: ['adSetId'] } }, { name: 'update_custom_audience', description: 'Updates an existing custom audience', inputSchema: { type: 'object', properties: { audienceId: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' } }, required: ['audienceId'] } }, { name: 'create_ad', description: 'Creates a new ad using a pre-created ad creative', inputSchema: { type: 'object', properties: { adSetId: { type: 'string', description: 'Ad Set ID where the ad will be created' }, name: { type: 'string', description: 'Name for the ad' }, creativeId: { type: 'string', description: 'ID of pre-created ad creative (use create_ad_creative first)' } }, required: ['adSetId', 'name', 'creativeId'] } }, { name: 'create_ad_creative', description: 'Creates a new ad creative with dynamic parameters', inputSchema: { type: 'object', properties: { name: { type: 'string', description: 'Name for the ad creative' }, pageId: { type: 'string', description: 'Facebook Page ID (use get_facebook_pages to find valid IDs)' }, link: { type: 'string', description: 'Destination URL for the ad' }, message: { type: 'string', description: 'Main ad message/text' }, description: { type: 'string', description: 'Optional ad description' }, callToAction: { type: 'object', description: 'Optional call-to-action button', properties: { type: { type: 'string' }, link: { type: 'string' } } } }, required: ['name', 'pageId', 'link', 'message'] } }, { name: 'duplicate_ad', description: 'Duplicates an existing ad', inputSchema: { type: 'object', properties: { adId: { type: 'string' }, newName: { type: 'string' } }, required: ['adId'] } }, { name: 'update_ad', description: 'Updates an existing ad', inputSchema: { type: 'object', properties: { adId: { type: 'string' }, name: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] }, creative: { type: 'object' } }, required: ['adId'] } }, { name: 'delete_ad', description: 'Deletes an ad', inputSchema: { type: 'object', properties: { adId: { type: 'string' } }, required: ['adId'] } }, { name: 'get_ad_insights', description: 'Retrieves performance insights for an ad', inputSchema: { type: 'object', properties: { adId: { type: 'string' }, dateRange: { type: 'string', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'] } }, required: ['adId'] } }, { name: 'get_facebook_pages', description: 'Get user Facebook pages with detailed permissions and ad readiness info', inputSchema: { type: 'object', properties: {} } }, { name: 'generate_campaign_prompt', description: 'Generates a prompt for campaign creation using a template', inputSchema: { type: 'object', properties: { objective: { type: 'string' }, industry: { type: 'string' }, target_audience: { type: 'string' } }, required: ['objective'] } } ] } })); } else if (message.method === 'resources/list') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { resources: [] } })); } else if (message.method === 'prompts/list') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { prompts: [] } })); } else if (message.method === 'tools/call') { try { const result = await sendRequest(message.params.name, message.params.arguments || {}); console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } })); } catch (error) { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, error: { code: -32603, message: error.message } })); } } else { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: {} })); } } catch (error) { console.error('Parse error:', error); } }); process.on('SIGINT', () => process.exit(0)); process.on('SIGTERM', () => process.exit(0));"
                        ]
                    }
                }
            };
            
            document.getElementById('configJson').textContent = JSON.stringify(config, null, 2);
        }
        
        function copyUserId() {
            if (currentUserId) {
                navigator.clipboard.writeText(currentUserId).then(() => {
                    showCopySuccess(event.target, '✅ User ID Copied!');
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                    alert('Failed to copy to clipboard. Please select and copy manually.');
                });
            }
        }
        
        function copyConfig() {
            const configText = document.getElementById('configJson').textContent;
            
            // Try multiple methods for copying
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(configText).then(() => {
                    showCopySuccess(event.target, '✅ Config Copied!');
                }).catch(err => {
                    fallbackCopy(configText, event.target);
                });
            } else {
                fallbackCopy(configText, event.target);
            }
        }
        
        function fallbackCopy(text, btn) {
            // Fallback method using text selection
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    showCopySuccess(btn, '✅ Config Copied!');
                } else {
                    throw new Error('Copy command failed');
                }
            } catch (err) {
                // Final fallback - select the text for manual copy
                const configElement = document.getElementById('configJson');
                const range = document.createRange();
                range.selectNode(configElement);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                alert('Please press Ctrl+C (or Cmd+C on Mac) to copy the selected configuration');
            } finally {
                document.body.removeChild(textArea);
            }
        }
        
        function showCopySuccess(btn, message) {
            const originalText = btn.textContent;
            btn.textContent = message;
            btn.style.background = '#38a169';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '#48bb78';
            }, 2000);
        }
        
        function showStatus(message, type) {
            const statusDiv = document.getElementById('status');
            statusDiv.textContent = message;
            statusDiv.className = 'status ' + type;
        }
    </script>
</body>
</html>`;
  
  res.send(html);
});

const rateLimitMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    await rateLimiter.consume(req.ip || 'unknown');
    next();
  } catch (rejRes: any) {
    const remainingPoints = rejRes?.remainingPoints || 0;
    const msBeforeNext = rejRes?.msBeforeNext || 1000;
    
    res.set('Retry-After', String(Math.round(msBeforeNext / 1000)) || '1');
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      remainingPoints,
      msBeforeNext
    });
  }
};
// app.use(rateLimitMiddleware); // Rate limiting disabled

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeConnections: userSessionManager.getActiveSessionCount(),
    maxConnections: serverConfig.maxConnections,
    environment: serverConfig.environment
  });
});

// Test endpoint to verify deployment
app.get('/test-deploy', (req, res) => {
  res.json({
    status: 'deployed',
    timestamp: new Date().toISOString(),
    message: 'Stream endpoint should be available',
    deployTime: '2025-06-05-01-22-00'
  });
});

// Stream endpoint for n8n MCP Client compatibility (GET for SSE, POST for MCP messages)
app.get('/stream/:userId?', (req, res) => {
  // Set headers for SSE (Server-Sent Events)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection message
  const userId = req.params.userId; res.write(`data: {"type":"connection","status":"connected","message":"Facebook MCP Server stream ready","userId":"${userId || 'none'}"}\n\n`);

  // Keep connection alive with periodic heartbeat
  const heartbeat = setInterval(() => {
    res.write('data: {"type":"heartbeat","timestamp":"' + new Date().toISOString() + '"}\n\n');
  }, 30000); // Every 30 seconds

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
  });

  req.on('aborted', () => {
    clearInterval(heartbeat);
  });
});

// Handle POST requests to /stream (n8n MCP Client compatibility)
app.post('/stream/:userId?', async (req, res) => {
  try {
    const { jsonrpc, method, params, id } = req.body;

    // Handle MCP protocol messages
    switch (method) {
      case 'initialize':
        res.json({
          jsonrpc: '2.0',
          id: id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
              prompts: {}
            },
            serverInfo: {
              name: 'facebook-ads-mcp',
              version: '1.0.0'
            }
          }
        });
        break;

      case 'tools/list':
        res.json({
          jsonrpc: '2.0',
          id: id,
          result: {
            tools: [
              { name: 'get_ad_accounts', description: 'Get list of available Facebook ad accounts', inputSchema: { type: 'object', properties: {} } },
              { name: 'select_ad_account', description: 'Select a specific Facebook ad account to use', inputSchema: { type: 'object', properties: { accountId: { type: 'string' } }, required: ['accountId'] } },
              { name: 'get_campaigns', description: 'Lists existing campaigns', inputSchema: { type: 'object', properties: { limit: { type: 'number', default: 25 } } } },
              { name: 'create_campaign', description: 'Creates a new ad campaign', inputSchema: { type: 'object', properties: { name: { type: 'string' }, objective: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] } }, required: ['name', 'objective'] } },
              { name: 'update_campaign', description: 'Updates an existing campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' }, name: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] } }, required: ['campaignId'] } },
              { name: 'duplicate_campaign', description: 'Duplicates an existing campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' }, newName: { type: 'string' } }, required: ['campaignId'] } },
              { name: 'delete_campaign', description: 'Deletes a campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' } }, required: ['campaignId'] } },
              { name: 'get_campaign_details', description: 'Gets details for a specific campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' } }, required: ['campaignId'] } },
              { name: 'get_campaign_insights', description: 'Retrieves performance insights for a campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' }, dateRange: { type: 'string', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'] } }, required: ['campaignId'] } },
              { name: 'create_ad_set', description: 'Creates a new ad set', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' }, name: { type: 'string' }, targeting: { type: 'object' }, budget: { type: 'number' } }, required: ['campaignId', 'name', 'targeting', 'budget'] } },
              { name: 'update_ad_set', description: 'Updates an existing ad set', inputSchema: { type: 'object', properties: { adSetId: { type: 'string' }, name: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] }, dailyBudget: { type: 'number' } }, required: ['adSetId'] } },
              { name: 'duplicate_ad_set', description: 'Duplicates an existing ad set', inputSchema: { type: 'object', properties: { adSetId: { type: 'string' }, newName: { type: 'string' } }, required: ['adSetId'] } },
              { name: 'delete_ad_set', description: 'Deletes an ad set', inputSchema: { type: 'object', properties: { adSetId: { type: 'string' } }, required: ['adSetId'] } },
              { name: 'get_ad_set_insights', description: 'Retrieves performance insights for an ad set', inputSchema: { type: 'object', properties: { adSetId: { type: 'string' }, dateRange: { type: 'string', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'] } }, required: ['adSetId'] } },
              { name: 'create_ad_creative', description: 'Creates a new ad creative', inputSchema: { type: 'object', properties: { name: { type: 'string' }, pageId: { type: 'string' }, link: { type: 'string' }, message: { type: 'string' }, description: { type: 'string' } }, required: ['name', 'pageId', 'link', 'message'] } },
              { name: 'create_ad', description: 'Creates a new ad', inputSchema: { type: 'object', properties: { adSetId: { type: 'string' }, name: { type: 'string' }, creativeId: { type: 'string' } }, required: ['adSetId', 'name', 'creativeId'] } },
              { name: 'update_ad', description: 'Updates an existing ad', inputSchema: { type: 'object', properties: { adId: { type: 'string' }, name: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] } }, required: ['adId'] } },
              { name: 'duplicate_ad', description: 'Duplicates an existing ad', inputSchema: { type: 'object', properties: { adId: { type: 'string' }, newName: { type: 'string' } }, required: ['adId'] } },
              { name: 'delete_ad', description: 'Deletes an ad', inputSchema: { type: 'object', properties: { adId: { type: 'string' } }, required: ['adId'] } },
              { name: 'get_ad_insights', description: 'Retrieves performance insights for an ad', inputSchema: { type: 'object', properties: { adId: { type: 'string' }, dateRange: { type: 'string', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'] } }, required: ['adId'] } },
              { name: 'get_audiences', description: 'Lists available custom audiences', inputSchema: { type: 'object', properties: { limit: { type: 'number', default: 25 } } } },
              { name: 'create_custom_audience', description: 'Creates a custom audience', inputSchema: { type: 'object', properties: { name: { type: 'string' }, type: { type: 'string', enum: ['CUSTOM', 'WEBSITE', 'ENGAGEMENT'] }, description: { type: 'string' } }, required: ['name', 'type'] } },
              { name: 'get_facebook_pages', description: 'Get Facebook pages with permissions', inputSchema: { type: 'object', properties: {} } },
              { name: 'generate_campaign_prompt', description: 'Generates campaign creation prompts', inputSchema: { type: 'object', properties: { objective: { type: 'string' }, industry: { type: 'string' }, target_audience: { type: 'string' } }, required: ['objective'] } }
            ]
          }
        });
        break;

      case 'tools/call':
        // Route tool calls to the main MCP endpoint with session from params
        const toolName = params.name;
        const toolArgs = params.arguments || {};
        
        // Extract userId from the request (you'll need to pass this)
        // Extract userId dynamically from multiple sources
        const userId = req.params.userId || 
                      (req.headers['x-user-id'] as string) || 
                      req.body.sessionId || 
                      req.query.sessionId as string;
        
        if (!userId) {
          return res.status(400).json({
            jsonrpc: '2.0',
            id: id,
            error: {
              code: -32602,
              message: 'Session ID required. Provide via URL parameter (/stream/SESSION_ID), X-User-ID header, or sessionId in body/query.'
            }
          });
        }
        
        try {
          const result = await processMcpToolCall(toolName, toolArgs, userId);
          res.json({
            jsonrpc: '2.0',
            id: id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            }
          });
        } catch (error) {
          res.json({
            jsonrpc: '2.0',
            id: id,
            error: {
              code: -32603,
              message: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        }
        break;

      default:
        res.json({
          jsonrpc: '2.0',
          id: id,
          result: {}
        });
    }
  } catch (error) {
    res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: 'Internal error'
      }
    });
  }
});

app.post('/auth', async (req, res) => {
  try {
    const { facebookAppId, facebookAppSecret, facebookAccessToken } = req.body;
    
    if (!facebookAppId || !facebookAppSecret || !facebookAccessToken) {
      return res.status(400).json({
        error: 'Missing required credentials',
        required: ['facebookAppId', 'facebookAppSecret', 'facebookAccessToken']
      });
    }

    if (userSessionManager.getActiveSessionCount() >= serverConfig.maxConnections) {
      return res.status(503).json({
        error: 'Server at capacity',
        message: 'Maximum number of connections reached. Please try again later.'
      });
    }

    const userId = uuidv4();
    const credentials: UserCredentials = {
      facebookAppId,
      facebookAppSecret,
      facebookAccessToken,
      userId
    };

    const result = userSessionManager.createSession(credentials);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Authentication failed',
        message: result.error
      });
    }

    res.json({
      success: true,
      userId,
      message: 'Authentication successful - Ready to use',
      endpoints: {
        websocket: `/ws/${userId}`,
        http: `/mcp/${userId}`
      },
      ready: true
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process authentication request'
    });
  }
});

// New endpoint to select ad account
app.post('/select-account/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        error: 'Missing account ID',
        message: 'Please provide the accountId to select'
      });
    }

    const result = await userSessionManager.setSelectedAccount(userId, accountId);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Failed to select account',
        message: result.error
      });
    }

    res.json({
      success: true,
      message: 'Account selected successfully',
      selectedAccountId: accountId,
      ready: true
    });
  } catch (error) {
    console.error('Account selection error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to select account'
    });
  }
});

// Get available accounts for a user
app.get('/accounts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await userSessionManager.getAvailableAccounts(userId);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Failed to get accounts',
        message: result.error
      });
    }

    res.json({
      success: true,
      accounts: result.accounts
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get accounts'
    });
  }
});

app.post('/mcp/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { method, params } = req.body;

    const session = userSessionManager.getSession(userId);
    if (!session) {
      return res.status(401).json({
        error: 'Invalid session',
        message: 'User session not found or expired'
      });
    }

    const response = await processMcpToolCall(method, params || {}, userId);
    res.json(response);
  } catch (error) {
    console.error('MCP request error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process MCP request'
    });
  }
});

const wss = new WebSocket.Server({ 
  server,
  path: '/ws',
  maxPayload: 16 * 1024 * 1024
});

wss.on('connection', async (ws: WebSocket, req) => {
  try {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/');
    const userId = pathParts[2];

    if (!userId) {
      ws.close(1008, 'User ID required in path');
      return;
    }

    const session = userSessionManager.getSession(userId);
    if (!session) {
      ws.close(1008, 'Invalid or expired session');
      return;
    }

    console.log(`WebSocket connected for user: ${userId}`);

    // Create MCP server instance for this user
    const mcpServer = createMcpServer(userId);
    
    // Handle MCP protocol messages
    ws.on('message', async (data: WebSocket.Data) => {
      let message: any = null;
      try {
        message = JSON.parse(data.toString());
        console.log(`Received MCP message from user ${userId}:`, message);
        
        // Handle MCP initialize
        if (message.method === 'initialize') {
          const response = {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
                prompts: {},
                resources: {}
              },
              serverInfo: {
                name: 'facebook-ads-mcp',
                version: '1.0.0'
              }
            }
          };
          ws.send(JSON.stringify(response));
          return;
        }

        // Handle tools/list
        if (message.method === 'tools/list') {
          const response = {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              tools: [
                {
                  name: 'create_campaign',
                  description: 'Create a new Facebook ad campaign',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: 'Campaign name' },
                      objective: { type: 'string', description: 'Campaign objective' },
                      status: { type: 'string', description: 'Campaign status', enum: ['ACTIVE', 'PAUSED'] }
                    },
                    required: ['name', 'objective']
                  }
                },
                {
                  name: 'get_ad_accounts',
                  description: 'Get list of available Facebook ad accounts',
                  inputSchema: {
                    type: 'object',
                    properties: {}
                  }
                },
                {
                  name: 'select_ad_account',
                  description: 'Select a specific Facebook ad account to use',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      accountId: { type: 'string', description: 'Facebook Ad Account ID (e.g., act_1234567890)' }
                    },
                    required: ['accountId']
                  }
                },
                {
                  name: 'get_campaigns',
                  description: 'Get list of existing campaigns',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      limit: { type: 'number', description: 'Number of campaigns to retrieve', default: 25 }
                    }
                  }
                }
              ]
            }
          };
          ws.send(JSON.stringify(response));
          return;
        }

        // Handle tools/call
        if (message.method === 'tools/call') {
          const toolResult = await processMcpToolCall(message.params.name, message.params.arguments || {}, userId);
          const response = {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(toolResult, null, 2)
                }
              ]
            }
          };
          ws.send(JSON.stringify(response));
          return;
        }

        // Default response for other methods
        const response = {
          jsonrpc: '2.0',
          id: message.id,
          result: {}
        };
        ws.send(JSON.stringify(response));

      } catch (error) {
        console.error(`Error processing MCP message from user ${userId}:`, error);
        const errorResponse = {
          jsonrpc: '2.0',
          id: message?.id || null,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : 'Unknown error'
          }
        };
        ws.send(JSON.stringify(errorResponse));
      }
    });

    ws.on('close', () => {
      console.log(`WebSocket disconnected for user: ${userId}`);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
    });

  } catch (error) {
    console.error('WebSocket connection error:', error);
    ws.close(1011, 'Internal server error');
  }
});
async function processMcpRequest(method: string, params: any): Promise<any> {
  return {
    success: true,
    method,
    params,
    timestamp: new Date().toISOString()
  };
}

// Enhanced helper function to get user's Facebook pages using proper Facebook Pages API
async function getUserFacebookPages(userId: string): Promise<any> {
  try {
    const session = userSessionManager.getSession(userId);
    if (!session) {
      return { success: false, error: 'Invalid session' };
    }

    // Use proper Facebook Pages API endpoint from documentation: /me/accounts  
    // Facebook Pages API v23.0 - returns comprehensive page information
    const response = await fetch(`https://graph.facebook.com/v23.0/me/accounts?fields=id,name,access_token,category,category_list,tasks,about,website,emails&access_token=${session.credentials.facebookAccessToken}`);
    const pagesData: any = await response.json();
    
    if (pagesData.error) {
      return {
        success: false,
        error: `Facebook Pages API Error (${pagesData.error.code}): ${pagesData.error.message}`,
        details: 'Ensure your access token has pages_show_list permission'
      };
    }

    // Enhanced page information with full Facebook Pages API data
    const enhancedPages = (pagesData.data || []).map((page: any) => ({
      id: page.id,
      name: page.name,
      access_token: page.access_token,
      category: page.category,
      category_list: page.category_list || [],
      tasks: page.tasks || [],
      about: page.about || '',
      website: page.website || '',
      emails: page.emails || [],
      // Computed permissions for easy checking
      can_create_ads: page.tasks?.includes('ADVERTISE') || false,
      can_manage: page.tasks?.includes('MANAGE') || false, 
      can_create_content: page.tasks?.includes('CREATE_CONTENT') || false,
      can_moderate: page.tasks?.includes('MODERATE') || false,
      can_analyze: page.tasks?.includes('ANALYZE') || false,
      // Ad creation readiness
      ready_for_ads: (page.tasks?.includes('ADVERTISE') && page.tasks?.includes('CREATE_CONTENT')) || false
    }));

    return {
      success: true,
      pages: enhancedPages,
      totalPages: enhancedPages.length,
      message: `Found ${enhancedPages.length} Facebook page(s) with detailed permissions`,
      summary: {
        total: enhancedPages.length,
        canAdvertise: enhancedPages.filter((p: any) => p.can_create_ads).length,
        canManage: enhancedPages.filter((p: any) => p.can_manage).length,
        canCreateContent: enhancedPages.filter((p: any) => p.can_create_content).length,
        readyForAds: enhancedPages.filter((p: any) => p.ready_for_ads).length,
        recommendedPages: enhancedPages.filter((p: any) => p.ready_for_ads).map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category
        }))
      }
    };
  } catch (error: any) {
    let errorMessage = `Error fetching Facebook pages: ${error instanceof Error ? error.message : 'Unknown error'}`;
    
    // Add helpful guidance for common Facebook Pages API errors
    if (error && typeof error === 'object') {
      if (error.message?.includes('permissions')) {
        errorMessage += '\n\nSuggestion: Ensure your access token has pages_show_list permission. You may need to re-authenticate with Facebook Login.';
      }
      if (error.message?.includes('token')) {
        errorMessage += '\n\nSuggestion: Your access token may be expired. Please re-authenticate to get a fresh token.';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      tool: 'get_facebook_pages'
    };
  }
}

async function processMcpToolCall(toolName: string, args: any, userId: string): Promise<any> {
  const session = userSessionManager.getSession(userId);
  if (!session) {
    throw new Error('Invalid session');
  }

  // Initialize Facebook API with user's credentials
  const FacebookAdsApi = require('facebook-nodejs-business-sdk').FacebookAdsApi;
  const Campaign = require('facebook-nodejs-business-sdk').Campaign;
  const AdAccount = require('facebook-nodejs-business-sdk').AdAccount;
  
  FacebookAdsApi.init(session.credentials.facebookAccessToken);

  try {
    switch (toolName) {
      case 'get_ad_accounts':
        try {
          // Get ALL user's ad accounts - just the accounts, no campaigns
          const response = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&access_token=${session.credentials.facebookAccessToken}`);
          const accountsData: any = await response.json();
          
          if (accountsData.error) {
            return {
              success: false,
              error: `Facebook API Error: ${accountsData.error.message}`,
              tool: 'get_ad_accounts'
            };
          }

          if (!accountsData.data || accountsData.data.length === 0) {
            return {
              success: true,
              tool: 'get_ad_accounts',
              result: {
                accounts: [],
                total: 0,
                message: 'No ad accounts found for this user'
              }
            };
          }

          const accounts = accountsData.data.map((account: any) => ({
            id: account.id,
            name: account.name,
            status: account.account_status,
            currency: account.currency,
            timezone: account.timezone_name
          }));

          return {
            success: true,
            tool: 'get_ad_accounts',
            result: {
              accounts: accounts,
              total: accounts.length,
              message: `Found ${accounts.length} ad account(s)`
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error fetching ad accounts: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'get_ad_accounts'
          };
        }
        
      case 'get_campaigns':
        try {
          const limit = args.limit || 10;
          const status = args.status;

          // Use working implementation from tools
          const result = await campaignTools.getCampaigns(userId, limit, status);

          return {
            success: result.success,
            tool: 'get_campaigns',
            result: result.success ? {
              campaigns: result.campaigns,
              message: 'Campaigns retrieved successfully'
            } : undefined,
            error: result.success ? undefined : result.message
          };
        } catch (error) {
          return {
            success: false,
            error: `Error getting campaigns: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'get_campaigns'
          };
        }
        try {
          // Get ALL user's ad accounts
          const response = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&access_token=${session!.credentials.facebookAccessToken}`);
          const accountsData: any = await response.json();
          
          if (accountsData.error) {
            return {
              success: false,
              error: `Facebook API Error: ${accountsData.error.message}`,
              tool: 'get_campaigns'
            };
          }

          if (!accountsData.data || accountsData.data.length === 0) {
            return {
              success: true,
              tool: 'get_campaigns',
              result: {
                campaigns: [],
                accounts: [],
                total: 0,
                message: 'No ad accounts found for this user'
              }
            };
          }

          // If specific account requested, use that account
          const targetAccountId = args.accountId;
          let accountsToProcess = accountsData.data;
          
          if (targetAccountId) {
            accountsToProcess = accountsData.data.filter((acc: any) => acc.id === targetAccountId);
            if (accountsToProcess.length === 0) {
              return {
                success: false,
                error: `Account ${targetAccountId} not found or not accessible`,
                tool: 'get_campaigns'
              };
            }
          }

          // Get campaigns from all accounts (or specified account)
          const allCampaigns: any[] = [];
          const accountSummaries: any[] = [];

          for (const account of accountsToProcess) {
            try {
              const campaignsResponse = await fetch(`https://graph.facebook.com/v18.0/${account.id}/campaigns?fields=id,name,objective,status,created_time,account_id&limit=${args.limit || 25}&access_token=${session!.credentials.facebookAccessToken}`);
              const campaignsData: any = await campaignsResponse.json();

              if (campaignsData.data) {
                // Add account info to each campaign
                const campaignsWithAccount = campaignsData.data.map((campaign: any) => ({
                  ...campaign,
                  account: {
                    id: account.id,
                    name: account.name,
                    status: account.account_status
                  }
                }));
                allCampaigns.push(...campaignsWithAccount);
              }

              accountSummaries.push({
                id: account.id,
                name: account.name,
                status: account.account_status,
                currency: account.currency,
                timezone: account.timezone_name,
                campaignsCount: campaignsData.data ? campaignsData.data.length : 0
              });
            } catch (accountError) {
              console.error(`Error fetching campaigns for account ${account.id}:`, accountError);
              accountSummaries.push({
                id: account.id,
                name: account.name,
                status: account.account_status,
                error: 'Failed to fetch campaigns'
              });
            }
          }

          return {
            success: true,
            tool: 'get_campaigns',
            result: {
              campaigns: allCampaigns,
              accounts: accountSummaries,
              totalAccounts: accountsData.data.length,
              totalCampaigns: allCampaigns.length,
              requestedAccount: targetAccountId || 'all'
            },
            message: targetAccountId 
              ? `Campaigns retrieved from account ${targetAccountId}` 
              : `Campaigns retrieved from ${accountSummaries.length} accounts`
          };
        } catch (error: any) {
          return {
            success: false,
            error: `API Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'get_campaigns'
          };
        }

      case 'create_campaign':
        try {
          // Use the selected ad account instead of getting all accounts
          const adAccount = getAdAccountForUser(userId);
          if (!adAccount) {
            return {
              success: false,
              error: 'No ad account selected. Use select_ad_account first.',
              tool: 'create_campaign'
            };
          }

          const adAccountId = adAccount.id;
          
          // Create campaign
          const campaignData = {
            name: args.name,
            objective: args.objective || 'OUTCOME_LEADS',
            status: args.status || 'PAUSED',
            special_ad_categories: [], // Required by Facebook for compliance
            access_token: session.credentials.facebookAccessToken
          };

          const createResponse = await fetch(`https://graph.facebook.com/v18.0/${adAccountId}/campaigns`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(campaignData)
          });

          const createResult: any = await createResponse.json();

          if (createResult.error) {
            return {
              success: false,
              error: `Facebook API Error: ${createResult.error.message}`,
              tool: 'create_campaign'
            };
          }

          return {
            success: true,
            tool: 'create_campaign',
            result: {
              id: createResult.id,
              name: args.name,
              objective: args.objective || 'OUTCOME_LEADS',
              status: args.status || 'PAUSED',
              created_time: new Date().toISOString()
            },
            message: 'Campaign created successfully'
          };
        } catch (error) {
          return {
            success: false,
            error: `API Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'create_campaign'
          };
        }

      case 'get_campaign_details':
        try {
          const campaignResponse = await fetch(`https://graph.facebook.com/v18.0/${args.campaignId}?fields=id,name,objective,status,created_time,updated_time&access_token=${session.credentials.facebookAccessToken}`);
          const campaignData: any = await campaignResponse.json();

          if (campaignData.error) {
            return {
              success: false,
              error: `Facebook API Error: ${campaignData.error.message}`,
              tool: 'get_campaign_details'
            };
          }

          return {
            success: true,
            tool: 'get_campaign_details',
            result: campaignData,
            message: 'Campaign details retrieved successfully'
          };
        } catch (error) {
          return {
            success: false,
            error: `API Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'get_campaign_details'
          };
        }
        
      case 'update_campaign':
        try {
          const campaignId = args.campaignId;
          const name = args.name;
          const status = args.status;
          const dailyBudget = args.dailyBudget;
          const endTime = args.endTime;

          if (!campaignId) {
            return {
              success: false,
              error: 'Campaign ID is required',
              tool: 'update_campaign'
            };
          }

          const Campaign = require('facebook-nodejs-business-sdk').Campaign;
          const campaign = new Campaign(campaignId);
          
          const params: any = {};
          if (name) params.name = name;
          if (status) params.status = status;
          if (dailyBudget) params.daily_budget = dailyBudget * 100; // Convert to cents
          if (endTime) params.end_time = endTime;
          
          await campaign.update(params);
          
          return {
            success: true,
            tool: 'update_campaign',
            result: {
              campaignId: campaignId,
              updatedFields: params,
              message: `Campaign ${campaignId} updated successfully`
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error updating campaign: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'update_campaign'
          };
        }

      case 'delete_campaign':
        try {
          const campaignId = args.campaignId;
          if (!campaignId) {
            return {
              success: false,
              error: 'Campaign ID is required',
              tool: 'delete_campaign'
            };
          }

          const Campaign = require('facebook-nodejs-business-sdk').Campaign;
          const campaign = new Campaign(campaignId);
          
          await campaign.delete([]);
          
          return {
            success: true,
            tool: 'delete_campaign',
            result: {
              campaignId: campaignId,
              message: `Campaign ${campaignId} deleted successfully`
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error deleting campaign: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'delete_campaign'
          };
        }

      case 'get_campaign_insights':
        try {
          const campaignId = args.campaignId;
          const dateRange = args.dateRange || 'last_7_days';
          
          if (!campaignId) {
            return {
              success: false,
              error: 'Campaign ID is required',
              tool: 'get_campaign_insights'
            };
          }

          // Helper function to get date range
          const getDateForRange = (range: string) => {
            const today = new Date();
            const formatDate = (date: Date) => date.toISOString().split('T')[0];
            
            switch (range) {
              case 'today':
                return { since: formatDate(today), until: formatDate(today) };
              case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                return { since: formatDate(yesterday), until: formatDate(yesterday) };
              case 'last_7_days':
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(today.getDate() - 7);
                return { since: formatDate(sevenDaysAgo), until: formatDate(today) };
              case 'last_30_days':
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(today.getDate() - 30);
                return { since: formatDate(thirtyDaysAgo), until: formatDate(today) };
              default:
                const defaultRange = new Date(today);
                defaultRange.setDate(today.getDate() - 7);
                return { since: formatDate(defaultRange), until: formatDate(today) };
            }
          };

          const Campaign = require('facebook-nodejs-business-sdk').Campaign;
          const campaign = new Campaign(campaignId);
          
          const fields = [
            'spend',
            'impressions', 
            'clicks',
            'ctr',
            'cpm',
            'cpc',
            'reach',
            'frequency'
          ];
          
          const params = {
            time_range: getDateForRange(dateRange),
            level: 'campaign'
          };
          
          const insights = await campaign.getInsights(fields, params);
          
          return {
            success: true,
            tool: 'get_campaign_insights',
            result: {
              campaignId: campaignId,
              dateRange: dateRange,
              insights: insights.map((insight: any) => ({
                spend: insight._data?.spend,
                impressions: insight._data?.impressions,
                clicks: insight._data?.clicks,
                ctr: insight._data?.ctr,
                cpm: insight._data?.cpm,
                cpc: insight._data?.cpc,
                reach: insight._data?.reach,
                frequency: insight._data?.frequency
              }))
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error getting campaign insights: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'get_campaign_insights'
          };
        }

      case 'select_ad_account':
        try {
          const accountId = args.accountId;
          if (!accountId) {
            return {
              success: false,
              error: 'Account ID is required',
              tool: 'select_ad_account'
            };
          }

          const result = await userSessionManager.setSelectedAccount(userId, accountId);
          
          if (!result.success) {
            return {
              success: false,
              error: result.error,
              tool: 'select_ad_account'
            };
          }

          return {
            success: true,
            tool: 'select_ad_account',
            result: {
              selectedAccountId: accountId,
              message: `Successfully selected ad account: ${accountId}`
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error selecting account: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'select_ad_account'
          };
        }

      case 'create_ad_set':
        try {
          const campaignId = args.campaignId;
          const name = args.name;
          const targeting = args.targeting;
          const budget = args.budget;

          if (!campaignId || !name || !targeting || !budget) {
            return {
              success: false,
              error: 'campaignId, name, targeting, and budget are required',
              tool: 'create_ad_set',
              requirements: {
                campaignId: 'Campaign ID (string)',
                name: 'Ad set name (string)',
                targeting: 'Targeting object with geo_locations.countries, age_min, age_max',
                budget: 'Daily budget in MYR (will be converted to cents automatically)'
              },
              example: {
                campaignId: '120228357276280312',
                name: 'My Ad Set',
                budget: 10,
                targeting: { geo_locations: { countries: ['MY'] }, age_min: 18, age_max: 65 }
              }
            };
          }

          // Validate targeting - ensure all required fields are provided
          if (!targeting || typeof targeting !== 'object') {
            return {
              success: false,
              error: 'Invalid targeting format. Provide: {"geo_locations": {"countries": ["YOUR_COUNTRY"]}, "age_min": 18, "age_max": 65}',
              tool: 'create_ad_set',
              example: '{"geo_locations": {"countries": ["US"]}, "age_min": 25, "age_max": 55}'
            };
          }

          // Ensure minimum required targeting
          if (!targeting.geo_locations || !targeting.geo_locations.countries || targeting.geo_locations.countries.length === 0) {
            return {
              success: false,
              error: 'geo_locations.countries is required in targeting. Specify country codes like ["MY"], ["US"], ["SG"]',
              tool: 'create_ad_set',
              suggestion: 'Example: {"geo_locations": {"countries": ["MY"]}, "age_min": 25, "age_max": 55}'
            };
          }
          
          // Set default age ranges only if not provided
          if (!targeting.age_min) targeting.age_min = 18;
          if (!targeting.age_max) targeting.age_max = 65;
          const adAccount = getAdAccountForUser(userId);
          if (!adAccount) {
            return {
              success: false,
              error: 'No ad account selected. Use select_ad_account first.',
              tool: 'create_ad_set'
            };
          }

          // Get campaign details to determine proper optimization goal
          const campaignResponse = await fetch(`https://graph.facebook.com/v23.0/${campaignId}?fields=objective&access_token=${session.credentials.facebookAccessToken}`);
          const campaignData: any = await campaignResponse.json();
          
          if (campaignData.error) {
            return {
              success: false,
              error: `Cannot get campaign objective: ${campaignData.error.message}`,
              tool: 'create_ad_set'
            };
          }

          // Set optimization goal and billing event based on campaign objective
          let optimizationGoal = 'POST_ENGAGEMENT';
          let billingEvent = 'IMPRESSIONS';
          
          const objective = campaignData.objective;
          if (objective === 'OUTCOME_TRAFFIC') {
            optimizationGoal = 'LINK_CLICKS';
            billingEvent = 'LINK_CLICKS';
          } else if (objective === 'OUTCOME_ENGAGEMENT') {
            optimizationGoal = 'POST_ENGAGEMENT';
            billingEvent = 'IMPRESSIONS';
          } else if (objective === 'OUTCOME_LEADS') {
            optimizationGoal = 'LEAD_GENERATION';
            billingEvent = 'IMPRESSIONS';
          }

          // Fixed ad set creation with all required Facebook API v23 parameters
          const params: any = {
            name: name,
            campaign_id: campaignId,
            daily_budget: Math.max(budget * 100, 1000), // Convert to cents (RM10 minimum = 1000 sen)
            billing_event: billingEvent,
            optimization_goal: optimizationGoal,
            bid_strategy: 'LOWEST_COST_WITHOUT_CAP', // Recommended for safety
            targeting: targeting,
            status: 'PAUSED', // Always start paused for safety
            special_ad_categories: [] // Required by Facebook for compliance
          };

          const fieldsToRead = ['id', 'name', 'status', 'optimization_goal', 'billing_event', 'daily_budget'];
          const adSet = await adAccount.createAdSet(fieldsToRead, params);

          const adSetData = {
            id: adSet.id,
            name: adSet._data?.name,
            status: adSet._data?.status,
            optimizationGoal: adSet._data?.optimization_goal,
            billingEvent: adSet._data?.billing_event,
            dailyBudget: adSet._data?.daily_budget ? adSet._data.daily_budget / 100 : null
          };

          return {
            success: true,
            tool: 'create_ad_set',
            result: {
              adSetId: adSetData.id,
              adSetData: {
                ...adSetData,
                campaignObjective: objective,
                optimizationGoal: optimizationGoal,
                billingEvent: billingEvent,
                budgetMYR: budget,
                budgetCents: params.daily_budget
              },
              message: `Ad Set created successfully for ${objective} campaign with ${optimizationGoal} optimization`
            }
          };
        } catch (error: any) {
          // Use the same error handling as the working version
          let errorMessage = `Error creating ad set: ${error instanceof Error ? error.message : 'Unknown error'}`;
          if (error && typeof error === 'object' && 'response' in error) {
            const fbError = error.response?.data?.error;
            if (fbError) {
              errorMessage = `Facebook API Error (${fbError.code}): ${fbError.message}`;
            }
          }
          
          return {
            success: false,
            error: errorMessage,
            tool: 'create_ad_set'
          };
        }

      case 'duplicate_campaign':
        try {
          const campaignId = args.campaignId;
          const newName = args.newName;
          
          if (!campaignId) {
            return {
              success: false,
              error: 'Campaign ID is required',
              tool: 'duplicate_campaign'
            };
          }

          // Get original campaign details
          const Campaign = require('facebook-nodejs-business-sdk').Campaign;
          const originalCampaign = new Campaign(campaignId);
          
          const fields = ['name', 'objective', 'status', 'daily_budget', 'lifetime_budget', 'buying_type', 'special_ad_categories'];
          const campaignDetails = await originalCampaign.get(fields);

          const adAccount = getAdAccountForUser(userId);
          if (!adAccount) {
            return {
              success: false,
              error: 'No ad account selected. Use select_ad_account first.',
              tool: 'duplicate_campaign'
            };
          }

          // Create duplicate with modified name
          const params: any = {
            name: newName || `${campaignDetails._data?.name} - Copy`,
            objective: campaignDetails._data?.objective,
            status: 'PAUSED', // Start paused for safety
            daily_budget: campaignDetails._data?.daily_budget,
            lifetime_budget: campaignDetails._data?.lifetime_budget,
            buying_type: campaignDetails._data?.buying_type,
            special_ad_categories: campaignDetails._data?.special_ad_categories
          };

          const fieldsToRead = ['id', 'name', 'objective', 'status', 'created_time', 'daily_budget'];
          const result = await adAccount.createCampaign(fieldsToRead, params);

          return {
            success: true,
            tool: 'duplicate_campaign',
            result: {
              originalCampaignId: campaignId,
              newCampaignId: result.id,
              newCampaignName: result._data?.name,
              objective: result._data?.objective,
              status: result._data?.status,
              message: 'Campaign duplicated successfully'
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error duplicating campaign: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'duplicate_campaign'
          };
        }

      case 'update_ad_set':
        try {
          const adSetId = args.adSetId;
          const name = args.name;
          const status = args.status;
          const dailyBudget = args.dailyBudget;
          const targeting = args.targeting;

          if (!adSetId) {
            return {
              success: false,
              error: 'Ad Set ID is required',
              tool: 'update_ad_set'
            };
          }

          const AdSet = require('facebook-nodejs-business-sdk').AdSet;
          const adSet = new AdSet(adSetId);
          
          const params: any = {};
          if (name) params.name = name;
          if (status) params.status = status;
          if (dailyBudget) params.daily_budget = dailyBudget * 100;
          if (targeting) params.targeting = targeting;
          
          await adSet.update(params);
          
          return {
            success: true,
            tool: 'update_ad_set',
            result: {
              adSetId: adSetId,
              updatedFields: params,
              message: `Ad Set ${adSetId} updated successfully`
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error updating ad set: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'update_ad_set'
          };
        }

      case 'delete_ad_set':
        try {
          const adSetId = args.adSetId;
          if (!adSetId) {
            return {
              success: false,
              error: 'Ad Set ID is required',
              tool: 'delete_ad_set'
            };
          }

          const AdSet = require('facebook-nodejs-business-sdk').AdSet;
          const adSet = new AdSet(adSetId);
          
          await adSet.delete([]);
          
          return {
            success: true,
            tool: 'delete_ad_set',
            result: {
              adSetId: adSetId,
              message: `Ad Set ${adSetId} deleted successfully`
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error deleting ad set: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'delete_ad_set'
          };
        }

      case 'duplicate_ad_set':
        try {
          const adSetId = args.adSetId;
          const newName = args.newName;
          
          if (!adSetId) {
            return {
              success: false,
              error: 'Ad Set ID is required',
              tool: 'duplicate_ad_set'
            };
          }

          const session = userSessionManager.getSession(userId);
          if (!session) {
            return {
              success: false,
              error: 'User session not found or expired',
              tool: 'duplicate_ad_set'
            };
          }

          // Get original ad set details first to modify targeting
          const originalAdSetResponse = await fetch(`https://graph.facebook.com/v23.0/${adSetId}?fields=targeting&access_token=${session.credentials.facebookAccessToken}`, {
            method: 'GET'
          });
          
          const originalAdSet: any = await originalAdSetResponse.json();
          
          // Use Facebook /copies endpoint with advantage_audience fix
          const params = new URLSearchParams();
          params.append('name', newName || 'Ad Set Copy');
          params.append('deep_copy', 'true');
          params.append('status_option', 'PAUSED');
          
          // Add targeting with advantage_audience flag if original has targeting
          if (originalAdSet.targeting) {
            const modifiedTargeting = {
              ...originalAdSet.targeting,
              targeting_automation: {
                advantage_audience: 0  // Explicitly set to 0 (disabled)
              }
            };
            params.append('targeting', JSON.stringify(modifiedTargeting));
          }
          
          params.append('access_token', session.credentials.facebookAccessToken);

          const response = await fetch(`https://graph.facebook.com/v23.0/${adSetId}/copies`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
          });

          const result: any = await response.json();

          if (result.error) {
            return {
              success: false,
              error: `Facebook API Error: ${result.error.message}`,
              tool: 'duplicate_ad_set',
              details: result.error
            };
          }

          return {
            success: true,
            tool: 'duplicate_ad_set',
            result: {
              originalAdSetId: adSetId,
              newAdSetId: result.id,
              newAdSetName: newName || 'Ad Set Copy',
              message: 'Ad Set duplicated successfully using Facebook /copies endpoint'
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error duplicating ad set: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'duplicate_ad_set'
          };
        }

      case 'get_ad_set_insights':
        try {
          const adSetId = args.adSetId;
          const dateRange = args.dateRange || 'last_7_days';
          
          if (!adSetId) {
            return {
              success: false,
              error: 'Ad Set ID is required',
              tool: 'get_ad_set_insights'
            };
          }

          const getDateForRange = (range: string) => {
            const today = new Date();
            const formatDate = (date: Date) => date.toISOString().split('T')[0];
            
            switch (range) {
              case 'today':
                return { since: formatDate(today), until: formatDate(today) };
              case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                return { since: formatDate(yesterday), until: formatDate(yesterday) };
              case 'last_7_days':
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(today.getDate() - 7);
                return { since: formatDate(sevenDaysAgo), until: formatDate(today) };
              case 'last_30_days':
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(today.getDate() - 30);
                return { since: formatDate(thirtyDaysAgo), until: formatDate(today) };
              default:
                const defaultRange = new Date(today);
                defaultRange.setDate(today.getDate() - 7);
                return { since: formatDate(defaultRange), until: formatDate(today) };
            }
          };

          const AdSet = require('facebook-nodejs-business-sdk').AdSet;
          const adSet = new AdSet(adSetId);
          
          const fields = [
            'spend',
            'impressions', 
            'clicks',
            'ctr',
            'cpm',
            'cpc',
            'reach',
            'frequency'
          ];
          
          const params = {
            time_range: getDateForRange(dateRange),
            level: 'adset'
          };
          
          const insights = await adSet.getInsights(fields, params);
          
          return {
            success: true,
            tool: 'get_ad_set_insights',
            result: {
              adSetId: adSetId,
              dateRange: dateRange,
              insights: insights.map((insight: any) => ({
                spend: insight._data?.spend,
                impressions: insight._data?.impressions,
                clicks: insight._data?.clicks,
                ctr: insight._data?.ctr,
                cpm: insight._data?.cpm,
                cpc: insight._data?.cpc,
                reach: insight._data?.reach,
                frequency: insight._data?.frequency
              }))
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error getting ad set insights: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'get_ad_set_insights'
          };
        }

      case 'update_custom_audience':
        try {
          const audienceId = args.audienceId;
          const name = args.name;
          const description = args.description;

          if (!audienceId) {
            return {
              success: false,
              error: 'Audience ID is required',
              tool: 'update_custom_audience'
            };
          }

          const CustomAudience = require('facebook-nodejs-business-sdk').CustomAudience;
          const audience = new CustomAudience(audienceId);
          
          const params: any = {};
          if (name) params.name = name;
          if (description) params.description = description;
          
          await audience.update(params);
          
          return {
            success: true,
            tool: 'update_custom_audience',
            result: {
              audienceId: audienceId,
              updatedFields: params,
              message: `Custom audience ${audienceId} updated successfully`
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error updating custom audience: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'update_custom_audience'
          };
        }

      case 'create_custom_audience':
        try {
          const adAccount = getAdAccountForUser(userId);
          if (!adAccount) {
            return {
              success: false,
              error: 'No ad account selected. Use select_ad_account first.',
              tool: 'create_custom_audience'
            };
          }

          const name = args.name;
          const type = args.type;
          const description = args.description;

          if (!name || !type) {
            return {
              success: false,
              error: 'name and type are required',
              tool: 'create_custom_audience'
            };
          }

          const params: any = {
            name: name,
            subtype: type,
            customer_file_source: 'USER_PROVIDED_ONLY', // Required parameter
            description: description || `Custom audience: ${name}`
          };

          const fieldsToRead = ['id', 'name', 'description', 'approximate_count'];
          const result = await adAccount.createCustomAudience(fieldsToRead, params);

          return {
            success: true,
            tool: 'create_custom_audience',
            result: {
              audienceId: result.id,
              name: result._data?.name,
              description: result._data?.description,
              approximateCount: result._data?.approximate_count,
              message: 'Custom audience created successfully'
            }
          };
        } catch (error: any) {
          // Enhanced error handling for custom audience permissions
          let errorMessage = `Error creating custom audience: ${error instanceof Error ? error.message : 'Unknown error'}`;
          
          if (error && typeof error === 'object' && 'response' in error) {
            const fbError = error.response?.data?.error;
            if (fbError) {
              errorMessage = `Facebook API Error (${fbError.code}): ${fbError.message}`;
              
              // Add helpful suggestions for common permission errors
              if (fbError.message.includes('permission') || fbError.message.includes('Permission')) {
                errorMessage += '\n\nSuggestion: Custom audience creation requires specific Facebook permissions. This may require business verification or additional app permissions.';
              }
            }
          }
          
          return {
            success: false,
            error: errorMessage,
            tool: 'create_custom_audience'
          };
        }

      case 'create_ad_creative':
        try {
          const adAccount = getAdAccountForUser(userId);
          if (!adAccount) {
            return {
              success: false,
              error: 'No ad account selected. Use select_ad_account first.',
              tool: 'create_ad_creative'
            };
          }

          const name = args.name;
          const pageId = args.pageId;
          const link = args.link;
          const message = args.message;
          const description = args.description;
          const callToAction = args.callToAction;

          if (!name || !pageId || !link || !message) {
            return {
              success: false,
              error: 'name, pageId, link, and message are required for ad creative. Use get_facebook_pages to find valid page IDs.',
              tool: 'create_ad_creative'
            };
          }

          // Dynamic Facebook API creative format - no hardcoding
          const params = {
            name: name,
            object_story_spec: {
              page_id: pageId,
              link_data: {
                link: link,
                message: message,
                ...(description && { description: description }),
                ...(callToAction && { 
                  call_to_action: {
                    type: callToAction.type || 'LEARN_MORE',
                    value: {
                      link: callToAction.link || link
                    }
                  }
                })
              }
            }
          };

          const fieldsToRead = ['id', 'name', 'object_story_id'];
          const result = await adAccount.createAdCreative(fieldsToRead, params);

          return {
            success: true,
            tool: 'create_ad_creative',
            result: {
              creativeId: result.id,
              name: result._data?.name,
              objectStoryId: result._data?.object_story_id,
              pageId: pageId,
              message: 'Ad Creative created successfully with dynamic parameters'
            }
          };
        } catch (error: any) {
          let errorMessage = `Error creating ad creative: ${error instanceof Error ? error.message : 'Unknown error'}`;
          
          if (error && typeof error === 'object' && 'response' in error) {
            const fbError = error.response?.data?.error;
            if (fbError) {
              errorMessage = `Facebook API Error (${fbError.code}): ${fbError.message}`;
              
              if (fbError.message.includes('page_id')) {
                errorMessage += '\n\nSolution: Use get_facebook_pages to get valid page IDs you can advertise with.';
              }
            }
          }
          
          return {
            success: false,
            error: errorMessage,
            tool: 'create_ad_creative'
          };
        }

      case 'create_ad':
        try {
          const adAccount = getAdAccountForUser(userId);
          if (!adAccount) {
            return {
              success: false,
              error: 'No ad account selected. Use select_ad_account first.',
              tool: 'create_ad'
            };
          }

          const adSetId = args.adSetId;
          const name = args.name;
          const creativeId = args.creativeId;

          if (!adSetId || !name) {
            return {
              success: false,
              error: 'adSetId and name are required',
              tool: 'create_ad'
            };
          }

          if (!creativeId) {
            return {
              success: false,
              error: 'creativeId is required. Use create_ad_creative first, or use get_facebook_pages to get valid page IDs.',
              tool: 'create_ad',
              suggestion: 'Workflow: 1) get_facebook_pages → 2) create_ad_creative → 3) create_ad'
            };
          }

          // Try simpler approach with direct Graph API call
          const session = userSessionManager.getSession(userId);
          if (!session) {
            return {
              success: false,
              error: 'User session not found or expired',
              tool: 'create_ad'
            };
          }

          // Use URL-encoded format as per Facebook documentation (compatible with -F curl format)
          const params = new URLSearchParams();
          params.append('name', name);
          params.append('adset_id', adSetId);
          params.append('creative', JSON.stringify({ creative_id: creativeId }));
          params.append('status', 'PAUSED');
          params.append('access_token', session.credentials.facebookAccessToken);

          const response = await fetch(`https://graph.facebook.com/v23.0/${adAccount.id}/ads`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
          });

          const result: any = await response.json();

          if (result.error) {
            return {
              success: false,
              error: `Facebook API Error: ${result.error.message}`,
              tool: 'create_ad',
              details: result.error
            };
          }

          return {
            success: true,
            tool: 'create_ad',
            result: {
              adId: result.id,
              name: name,
              status: 'PAUSED',
              adSetId: adSetId,
              creativeId: creativeId,
              message: 'Ad created successfully using Graph API'
            }
          };
        } catch (error: any) {
          // Enhanced error handling for Facebook ad creation with detailed debugging
          let errorMessage = `Error creating ad: ${error instanceof Error ? error.message : 'Unknown error'}`;
          
          // Log the full error for debugging
          console.error('Facebook Ad Creation Error:', error);
          
          // Provide specific guidance for common Facebook ad creation errors
          if (error && typeof error === 'object' && 'response' in error) {
            const fbError = error.response?.data?.error;
            if (fbError) {
              errorMessage = `Facebook API Error (${fbError.code}): ${fbError.message}`;
              
              // Add helpful suggestions for common errors
              if (fbError.message.includes('page_id')) {
                errorMessage += '\n\nSuggestion: The page_id in creative must be a Facebook Page you manage. Use get_facebook_pages to find valid page IDs.';
              }
              if (fbError.message.includes('creative')) {
                errorMessage += '\n\nSuggestion: Check creative format - ensure object_story_spec.page_id and link_data are properly formatted.';
              }
              if (fbError.message.includes('adset_id')) {
                errorMessage += '\n\nSuggestion: Ensure the ad set exists, is active, and belongs to the selected ad account.';
              }
              if (fbError.message.includes('Invalid parameter')) {
                errorMessage += '\n\nDebug Info: Check ad set status, campaign status, and creative format. Ad set must be active or paused (not deleted).';
              }
            }
          } else {
            // Add generic debugging info
            errorMessage += `\n\nDebug Info: Ad Set ID: ${args.adSetId}, Creative provided: ${!!args.creative}`;
          }
          
          return {
            success: false,
            error: errorMessage,
            tool: 'create_ad'
          };
        }

      case 'duplicate_ad':
        try {
          const adId = args.adId;
          const newName = args.newName;
          
          if (!adId) {
            return {
              success: false,
              error: 'Ad ID is required',
              tool: 'duplicate_ad'
            };
          }

          // Use our proven create_ad method with Graph API
          const session = userSessionManager.getSession(userId);
          if (!session) {
            return {
              success: false,
              error: 'User session not found or expired',
              tool: 'duplicate_ad'
            };
          }

          // Get original ad details using working Graph API approach
          const response = await fetch(`https://graph.facebook.com/v23.0/${adId}?fields=name,adset_id,creative&access_token=${session.credentials.facebookAccessToken}`);
          const originalData: any = await response.json();

          if (originalData.error) {
            return {
              success: false,
              error: `Facebook API Error: ${originalData.error.message}`,
              tool: 'duplicate_ad',
              details: originalData.error
            };
          }

          const adAccount = getAdAccountForUser(userId);
          if (!adAccount) {
            return {
              success: false,
              error: 'No ad account selected. Use select_ad_account first.',
              tool: 'duplicate_ad'
            };
          }

          // Use our working ad creation method with URL-encoded format
          const params = new URLSearchParams();
          params.append('name', newName || `${originalData.name} - Copy`);
          params.append('adset_id', originalData.adset_id);
          params.append('creative', JSON.stringify({ creative_id: originalData.creative.id }));
          params.append('status', 'PAUSED');
          params.append('access_token', session.credentials.facebookAccessToken);

          const createResponse = await fetch(`https://graph.facebook.com/v23.0/${adAccount.id}/ads`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
          });

          const result: any = await createResponse.json();

          if (result.error) {
            return {
              success: false,
              error: `Facebook API Error: ${result.error.message}`,
              tool: 'duplicate_ad',
              details: result.error
            };
          }

          return {
            success: true,
            tool: 'duplicate_ad',
            result: {
              originalAdId: adId,
              newAdId: result.id,
              newAdName: newName || `${originalData.name} - Copy`,
              adSetId: originalData.adset_id,
              message: 'Ad duplicated successfully using working Graph API method'
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error duplicating ad: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'duplicate_ad'
          };
        }

      case 'update_ad':
        try {
          const adId = args.adId;
          const name = args.name;
          const status = args.status;
          const creative = args.creative;

          if (!adId) {
            return {
              success: false,
              error: 'Ad ID is required',
              tool: 'update_ad'
            };
          }

          const Ad = require('facebook-nodejs-business-sdk').Ad;
          const ad = new Ad(adId);
          
          const params: any = {};
          if (name) params.name = name;
          if (status) params.status = status;
          if (creative) params.creative = creative;
          
          await ad.update(params);
          
          return {
            success: true,
            tool: 'update_ad',
            result: {
              adId: adId,
              updatedFields: params,
              message: `Ad ${adId} updated successfully`
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error updating ad: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'update_ad'
          };
        }

      case 'delete_ad':
        try {
          const adId = args.adId;
          if (!adId) {
            return {
              success: false,
              error: 'Ad ID is required',
              tool: 'delete_ad'
            };
          }

          const Ad = require('facebook-nodejs-business-sdk').Ad;
          const ad = new Ad(adId);
          
          await ad.delete([]);
          
          return {
            success: true,
            tool: 'delete_ad',
            result: {
              adId: adId,
              message: `Ad ${adId} deleted successfully`
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error deleting ad: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'delete_ad'
          };
        }

      case 'get_ad_insights':
        try {
          const adId = args.adId;
          const dateRange = args.dateRange || 'last_7_days';
          
          if (!adId) {
            return {
              success: false,
              error: 'Ad ID is required',
              tool: 'get_ad_insights'
            };
          }

          const getDateForRange = (range: string) => {
            const today = new Date();
            const formatDate = (date: Date) => date.toISOString().split('T')[0];
            
            switch (range) {
              case 'today':
                return { since: formatDate(today), until: formatDate(today) };
              case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                return { since: formatDate(yesterday), until: formatDate(yesterday) };
              case 'last_7_days':
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(today.getDate() - 7);
                return { since: formatDate(sevenDaysAgo), until: formatDate(today) };
              case 'last_30_days':
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(today.getDate() - 30);
                return { since: formatDate(thirtyDaysAgo), until: formatDate(today) };
              default:
                const defaultRange = new Date(today);
                defaultRange.setDate(today.getDate() - 7);
                return { since: formatDate(defaultRange), until: formatDate(today) };
            }
          };

          const Ad = require('facebook-nodejs-business-sdk').Ad;
          const ad = new Ad(adId);
          
          const fields = [
            'spend',
            'impressions', 
            'clicks',
            'ctr',
            'cpm',
            'cpc',
            'reach',
            'frequency'
          ];
          
          const params = {
            time_range: getDateForRange(dateRange),
            level: 'ad'
          };
          
          const insights = await ad.getInsights(fields, params);
          
          return {
            success: true,
            tool: 'get_ad_insights',
            result: {
              adId: adId,
              dateRange: dateRange,
              insights: insights.map((insight: any) => ({
                spend: insight._data?.spend,
                impressions: insight._data?.impressions,
                clicks: insight._data?.clicks,
                ctr: insight._data?.ctr,
                cpm: insight._data?.cpm,
                cpc: insight._data?.cpc,
                reach: insight._data?.reach,
                frequency: insight._data?.frequency
              }))
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error getting ad insights: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'get_ad_insights'
          };
        }

      case 'duplicate_campaign':
        try {
          const { campaignId, newName } = args;
          const result = await campaignTools.duplicateCampaign(userId, campaignId, newName);
          return {
            success: result.success,
            tool: 'duplicate_campaign',
            result: result.success ? result : undefined,
            error: result.success ? undefined : result.message
          };
        } catch (error) {
          return {
            success: false,
            error: `Error duplicating campaign: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'duplicate_campaign'
          };
        }

      case 'delete_campaign':
        try {
          const { campaignId } = args;
          const result = await campaignTools.deleteCampaign(userId, campaignId);
          return {
            success: result.success,
            tool: 'delete_campaign',
            result: result.success ? { message: result.message } : undefined,
            error: result.success ? undefined : result.message
          };
        } catch (error) {
          return {
            success: false,
            error: `Error deleting campaign: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'delete_campaign'
          };
        }

      case 'get_audiences':
        try {
          const result = await audienceTools.getCustomAudiences(userId, args.limit || 25);
          return {
            success: result.success,
            tool: 'get_audiences',
            result: result.success ? result : undefined,
            error: result.success ? undefined : result.message
          };
        } catch (error) {
          return {
            success: false,
            error: `Error getting audiences: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'get_audiences'
          };
        }

      case 'delete_ad_set':
        try {
          const { adSetId } = args;
          const result = await adSetTools.deleteAdSet(userId, adSetId);
          return {
            success: result.success,
            tool: 'delete_ad_set',
            result: result.success ? { message: result.message } : undefined,
            error: result.success ? undefined : result.message
          };
        } catch (error) {
          return {
            success: false,
            error: `Error deleting ad set: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'delete_ad_set'
          };
        }

      case 'create_lookalike_audience':
        try {
          const { name, sourceAudienceId, country, ratio } = args;
          if (!name || !sourceAudienceId || !country) {
            return {
              success: false,
              error: 'name, sourceAudienceId, and country are required',
              tool: 'create_lookalike_audience'
            };
          }
          
          const adAccount = getAdAccountForUser(userId);
          if (!adAccount) {
            return {
              success: false,
              error: 'No ad account selected. Use select_ad_account first.',
              tool: 'create_lookalike_audience'
            };
          }

          const params = {
            name: name,
            description: `Lookalike audience based on ${sourceAudienceId}`,
            origin_audience_id: sourceAudienceId,
            subtype: 'LOOKALIKE',
            lookalike_spec: JSON.stringify({
              country: country,
              ratio: ratio || 0.01,
              type: 'CUSTOM_AUDIENCE'
            })
          };

          const fieldsToRead = ['id', 'name', 'description', 'approximate_count'];
          const result = await adAccount.createCustomAudience(fieldsToRead, params);

          return {
            success: true,
            tool: 'create_lookalike_audience',
            result: {
              audienceId: result.id,
              name: result._data?.name,
              description: result._data?.description,
              approximateCount: result._data?.approximate_count,
              message: 'Lookalike audience created successfully'
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error creating lookalike audience: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'create_lookalike_audience'
          };
        }

      case 'get_facebook_pages':
        try {
          const result = await getUserFacebookPages(userId);
          return {
            success: result.success,
            tool: 'get_facebook_pages',
            result: result.success ? {
              pages: result.pages,
              totalPages: result.totalPages,
              summary: result.summary,
              message: result.message,
              enhanced: true,
              apiVersion: 'v23.0'
            } : undefined,
            error: result.success ? undefined : result.error
          };
        } catch (error) {
          return {
            success: false,
            error: `Error getting Facebook pages: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'get_facebook_pages'
          };
        }

      case 'generate_campaign_prompt':
        try {
          const objective = args.objective;
          const industry = args.industry || 'General';
          const target_audience = args.target_audience || 'General audience';

          if (!objective) {
            return {
              success: false,
              error: 'Objective is required',
              tool: 'generate_campaign_prompt'
            };
          }

          // Generate AI-powered campaign prompt based on inputs
          const prompt = `Create a Facebook ad campaign with the following specifications:

**Campaign Objective**: ${objective}
**Industry**: ${industry}
**Target Audience**: ${target_audience}

**Suggested Campaign Structure:**

1. **Campaign Name**: [Industry] - [Objective] - [Date]
2. **Campaign Settings**:
   - Objective: ${objective}
   - Budget: Daily budget recommended
   - Schedule: Start immediately, end date optional

3. **Ad Set Targeting**:
   - Location: Based on business location
   - Age: 18-65 (adjust based on product/service)
   - Interests: Related to ${industry}
   - Custom Audiences: Consider creating lookalike audiences

4. **Ad Creative Recommendations**:
   - Use high-quality images/videos related to ${industry}
   - Clear call-to-action
   - Compelling headline
   - Value proposition

5. **Budget Recommendations**:
   - Start with $10-50 daily budget for testing
   - Scale up based on performance
   - Monitor CPC, CTR, and conversion rates

**Next Steps**:
1. Use create_campaign tool with objective: ${objective}
2. Create ad sets with proper targeting
3. Design compelling ad creatives
4. Monitor and optimize performance`;

          return {
            success: true,
            tool: 'generate_campaign_prompt',
            result: {
              objective: objective,
              industry: industry,
              targetAudience: target_audience,
              generatedPrompt: prompt,
              message: 'Campaign prompt generated successfully'
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error generating campaign prompt: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'generate_campaign_prompt'
          };
        }

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
          availableTools: ['get_ad_accounts', 'get_campaigns', 'create_campaign', 'get_campaign_details']
        };
    }
  } catch (error) {
    return {
      success: false,
      error: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tool: toolName
    };
  }
}

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: serverConfig.environment === 'development' ? err.message : 'Something went wrong'
  });
});

// Serve test page at root
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Dynamic Facebook MCP Server</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .status { background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .endpoint { background: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace; }
        .btn { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 5px; }
        .btn:hover { background: #0056b3; }
    </style>
</head>
<body>
    <h1>🚀 Dynamic Facebook MCP Server</h1>
    <div class="status">
        <h3>✅ Server is running successfully!</h3>
        <p>Your dynamic Facebook MCP server is operational and ready to accept connections.</p>
    </div>
    
    <h3>👥 For Users (200 users supported):</h3>
    <a href="/get-user-id" class="btn">🔑 Get Your User ID</a>
    <p>Click above to authenticate and get your personal User ID for Claude Desktop.</p>
    
    <h3>📡 Available Endpoints:</h3>
    <div class="endpoint">
        <strong>Health Check:</strong> GET /health<br>
        <strong>Authentication:</strong> POST /auth<br>
        <strong>User ID Generator:</strong> <a href="/get-user-id">/get-user-id</a><br>
        <strong>HTTP MCP:</strong> POST /mcp/{userId}
    </div>
    
    <h3>🔗 Test Endpoints:</h3>
    <p><a href="/health" target="_blank">Check Server Health</a></p>
    
    <p><strong>All 200 users can get their User ID at:</strong> <a href="/get-user-id">https://newfb-production.up.railway.app/get-user-id</a></p>
</body>
</html>
  `);
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

export const startHttpServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    server.listen(serverConfig.port, () => {
      console.log(`🚀 Dynamic Facebook MCP Server running on port ${serverConfig.port}`);
      console.log(`📊 Environment: ${serverConfig.environment}`);
      console.log(`👥 Max connections: ${serverConfig.maxConnections}`);
      console.log(`🔗 WebSocket endpoint: ws://localhost:${serverConfig.port}/ws/{userId}`);
      console.log(`🌐 HTTP endpoint: http://localhost:${serverConfig.port}/mcp/{userId}`);
      resolve();
    });

    server.on('error', (error) => {
      console.error('Server startup error:', error);
      reject(error);
    });
  });
};

export const stopHttpServer = (): Promise<void> => {
  return new Promise((resolve) => {
    console.log('🔄 Shutting down server...');
    
    wss.close(() => {
      console.log('✅ WebSocket server closed');
    });
    
    server.close(() => {
      console.log('✅ HTTP server closed');
      resolve();
    });
  });
};