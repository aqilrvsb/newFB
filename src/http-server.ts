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
                            "const https = require('https'); const readline = require('readline'); const USER_ID = '" + userId + "'; const BASE_URL = 'newfb-production.up.railway.app'; const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); function sendRequest(method, params = {}) { return new Promise((resolve, reject) => { const postData = JSON.stringify({ method, params }); const options = { hostname: BASE_URL, port: 443, path: \\\`/mcp/\\\${USER_ID}\\\`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } }; const req = https.request(options, (res) => { let data = ''; res.on('data', (chunk) => { data += chunk; }); res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Invalid JSON response')); } }); }); req.on('error', reject); req.write(postData); req.end(); }); } rl.on('line', async (line) => { try { const message = JSON.parse(line); if (message.method === 'initialize') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'facebook-ads-http', version: '1.0.0' } } })); } else if (message.method === 'notifications/initialized') { return; } else if (message.method === 'tools/list') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { tools: [ { name: 'create_campaign', description: 'Creates a new ad campaign', inputSchema: { type: 'object', properties: { name: { type: 'string' }, objective: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] } }, required: ['name', 'objective'] } }, { name: 'get_ad_accounts', description: 'Get list of available Facebook ad accounts', inputSchema: { type: 'object', properties: {} } }, { name: 'select_ad_account', description: 'Select a specific Facebook ad account to use', inputSchema: { type: 'object', properties: { accountId: { type: 'string', description: 'Facebook Ad Account ID (e.g., act_1234567890)' } }, required: ['accountId'] } }, { name: 'get_campaigns', description: 'Lists existing campaigns', inputSchema: { type: 'object', properties: { limit: { type: 'number', default: 25 } } } }, { name: 'get_campaign_details', description: 'Gets details for a specific campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string', description: 'Campaign ID' } }, required: ['campaignId'] } }, { name: 'update_campaign', description: 'Updates an existing campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' }, name: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] } }, required: ['campaignId'] } }, { name: 'delete_campaign', description: 'Deletes a campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' } }, required: ['campaignId'] } }, { name: 'create_custom_audience', description: 'Creates a custom, website, or engagement audience', inputSchema: { type: 'object', properties: { name: { type: 'string' }, type: { type: 'string', enum: ['CUSTOM', 'WEBSITE', 'ENGAGEMENT'] }, description: { type: 'string' } }, required: ['name', 'type'] } }, { name: 'get_audiences', description: 'Lists available custom audiences', inputSchema: { type: 'object', properties: { limit: { type: 'number', default: 25 } } } }, { name: 'create_lookalike_audience', description: 'Creates a lookalike audience', inputSchema: { type: 'object', properties: { name: { type: 'string' }, sourceAudienceId: { type: 'string' }, country: { type: 'string' }, ratio: { type: 'number', minimum: 1, maximum: 10 } }, required: ['name', 'sourceAudienceId', 'country'] } }, { name: 'create_ad_set', description: 'Creates a new ad set', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' }, name: { type: 'string' }, targeting: { type: 'object' }, budget: { type: 'number' } }, required: ['campaignId', 'name', 'targeting', 'budget'] } }, { name: 'get_campaign_insights', description: 'Retrieves performance insights for a campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' }, dateRange: { type: 'string', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'] } }, required: ['campaignId'] } }, { name: 'duplicate_campaign', description: 'Duplicates an existing campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' }, newName: { type: 'string' } }, required: ['campaignId'] } }, { name: 'update_ad_set', description: 'Updates an existing ad set', inputSchema: { type: 'object', properties: { adSetId: { type: 'string' }, name: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] }, dailyBudget: { type: 'number' } }, required: ['adSetId'] } }, { name: 'delete_ad_set', description: 'Deletes an ad set', inputSchema: { type: 'object', properties: { adSetId: { type: 'string' } }, required: ['adSetId'] } }, { name: 'duplicate_ad_set', description: 'Duplicates an existing ad set', inputSchema: { type: 'object', properties: { adSetId: { type: 'string' }, newName: { type: 'string' } }, required: ['adSetId'] } }, { name: 'get_ad_set_insights', description: 'Retrieves performance insights for an ad set', inputSchema: { type: 'object', properties: { adSetId: { type: 'string' }, dateRange: { type: 'string', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'] } }, required: ['adSetId'] } }, { name: 'update_custom_audience', description: 'Updates an existing custom audience', inputSchema: { type: 'object', properties: { audienceId: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' } }, required: ['audienceId'] } }, { name: 'create_ad', description: 'Creates a new ad', inputSchema: { type: 'object', properties: { adSetId: { type: 'string' }, name: { type: 'string' }, creative: { type: 'object' } }, required: ['adSetId', 'name', 'creative'] } }, { name: 'duplicate_ad', description: 'Duplicates an existing ad', inputSchema: { type: 'object', properties: { adId: { type: 'string' }, newName: { type: 'string' } }, required: ['adId'] } }, { name: 'update_ad', description: 'Updates an existing ad', inputSchema: { type: 'object', properties: { adId: { type: 'string' }, name: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] }, creative: { type: 'object' } }, required: ['adId'] } }, { name: 'delete_ad', description: 'Deletes an ad', inputSchema: { type: 'object', properties: { adId: { type: 'string' } }, required: ['adId'] } }, { name: 'get_ad_insights', description: 'Retrieves performance insights for an ad', inputSchema: { type: 'object', properties: { adId: { type: 'string' }, dateRange: { type: 'string', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'] } }, required: ['adId'] } }, { name: 'generate_campaign_prompt', description: 'Generates a prompt for campaign creation using a template', inputSchema: { type: 'object', properties: { objective: { type: 'string' }, industry: { type: 'string' }, target_audience: { type: 'string' } }, required: ['objective'] } } ] } })); } else if (message.method === 'resources/list') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { resources: [] } })); } else if (message.method === 'prompts/list') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { prompts: [] } })); } else if (message.method === 'tools/call') { try { const result = await sendRequest(message.params.name, message.params.arguments || {}); console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } })); } catch (error) { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, error: { code: -32603, message: error.message } })); } } else { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: {} })); } } catch (error) { console.error('Parse error:', error); } }); process.on('SIGINT', () => process.exit(0)); process.on('SIGTERM', () => process.exit(0));"
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
app.use(rateLimitMiddleware);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeConnections: userSessionManager.getActiveSessionCount(),
    maxConnections: serverConfig.maxConnections,
    environment: serverConfig.environment
  });
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
          // Get user's ad accounts first
          const response = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name&access_token=${session.credentials.facebookAccessToken}`);
          const accountsData: any = await response.json();
          
          if (accountsData.error || !accountsData.data || accountsData.data.length === 0) {
            return {
              success: false,
              error: 'No ad accounts available',
              tool: 'create_campaign'
            };
          }

          const adAccountId = accountsData.data[0].id;
          
          // Create campaign
          const campaignData = {
            name: args.name,
            objective: args.objective || 'OUTCOME_LEADS',
            status: args.status || 'PAUSED',
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
              tool: 'create_ad_set'
            };
          }

          // Use the working implementation from tools
          const result = await adSetTools.createAdSet(
            userId,
            campaignId,
            name,
            'PAUSED', // status
            targeting,
            'LINK_CLICKS', // optimizationGoal for TRAFFIC campaigns
            'IMPRESSIONS', // billingEvent
            undefined, // bidAmount
            budget * 100, // dailyBudget in cents
            undefined, // lifetimeBudget
            undefined, // startTime
            undefined  // endTime
          );

          if (result.success) {
            return {
              success: true,
              tool: 'create_ad_set',
              result: {
                adSetId: result.adSetId,
                adSetData: result.adSetData,
                message: result.message
              }
            };
          } else {
            return {
              success: false,
              error: result.message,
              tool: 'create_ad_set'
            };
          }
        } catch (error) {
          console.error('Error in create_ad_set:', error);
          return {
            success: false,
            error: `Error creating ad set: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

          const AdSet = require('facebook-nodejs-business-sdk').AdSet;
          const originalAdSet = new AdSet(adSetId);
          
          const fields = ['name', 'campaign_id', 'daily_budget', 'targeting', 'billing_event', 'optimization_goal'];
          const adSetDetails = await originalAdSet.get(fields);

          const adAccount = getAdAccountForUser(userId);
          if (!adAccount) {
            return {
              success: false,
              error: 'No ad account selected. Use select_ad_account first.',
              tool: 'duplicate_ad_set'
            };
          }

          const params = {
            name: newName || `${adSetDetails._data?.name} - Copy`,
            campaign_id: adSetDetails._data?.campaign_id,
            daily_budget: adSetDetails._data?.daily_budget,
            targeting: adSetDetails._data?.targeting,
            billing_event: adSetDetails._data?.billing_event,
            optimization_goal: adSetDetails._data?.optimization_goal,
            status: 'PAUSED'
          };

          const fieldsToRead = ['id', 'name', 'status', 'daily_budget', 'campaign_id'];
          const result = await adAccount.createAdSet(fieldsToRead, params);

          return {
            success: true,
            tool: 'duplicate_ad_set',
            result: {
              originalAdSetId: adSetId,
              newAdSetId: result.id,
              newAdSetName: result._data?.name,
              campaignId: result._data?.campaign_id,
              message: 'Ad Set duplicated successfully'
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
        } catch (error) {
          return {
            success: false,
            error: `Error creating custom audience: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: 'create_custom_audience'
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
          const creative = args.creative;

          if (!adSetId || !name || !creative) {
            return {
              success: false,
              error: 'adSetId, name, and creative are required',
              tool: 'create_ad'
            };
          }

          const params = {
            name: name,
            adset_id: adSetId,
            creative: creative,
            status: 'PAUSED' // Start paused for safety
          };

          const fieldsToRead = ['id', 'name', 'status', 'adset_id'];
          const result = await adAccount.createAd(fieldsToRead, params);

          return {
            success: true,
            tool: 'create_ad',
            result: {
              adId: result.id,
              name: result._data?.name,
              status: result._data?.status,
              adSetId: result._data?.adset_id,
              message: 'Ad created successfully'
            }
          };
        } catch (error) {
          return {
            success: false,
            error: `Error creating ad: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

          const Ad = require('facebook-nodejs-business-sdk').Ad;
          const originalAd = new Ad(adId);
          
          const fields = ['name', 'adset_id', 'creative'];
          const adDetails = await originalAd.get(fields);

          const adAccount = getAdAccountForUser(userId);
          if (!adAccount) {
            return {
              success: false,
              error: 'No ad account selected. Use select_ad_account first.',
              tool: 'duplicate_ad'
            };
          }

          const params = {
            name: newName || `${adDetails._data?.name} - Copy`,
            adset_id: adDetails._data?.adset_id,
            creative: adDetails._data?.creative,
            status: 'PAUSED'
          };

          const fieldsToRead = ['id', 'name', 'status', 'adset_id'];
          const result = await adAccount.createAd(fieldsToRead, params);

          return {
            success: true,
            tool: 'duplicate_ad',
            result: {
              originalAdId: adId,
              newAdId: result.id,
              newAdName: result._data?.name,
              adSetId: result._data?.adset_id,
              message: 'Ad duplicated successfully'
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