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
import { getOptimizationGoalForObjective, VALID_CAMPAIGN_OBJECTIVES } from './utils/campaign-helpers.js';

// Import all tools functions
import * as campaignTools from './tools/campaign-tools.js';
import * as audienceTools from './tools/audience-tools.js';
import * as analyticsTools from './tools/analytics-tools.js';
import * as adSetTools from './tools/adset-tools.js';
import * as adTools from './tools/ad-tools.js';
import * as pageTools from './tools/page-tools.js';
import * as adsLibraryTools from './tools/ads-library-tools.js';
import * as leadTrackingTools from './tools/lead-tracking-tools.js';
import * as reportingTools from './tools/reporting-tools.js';
import * as cronJobTools from './tools/cron-job-tools.js';
import * as accountInsightsTools from './tools/account-insights-tools.js';

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
                <h3>🤖 n8n Integration (Alternative)</h3>
                <p>Want to use with n8n for automation? Use this endpoint:</p>
                <div class="user-id" id="n8nEndpoint" style="word-break: break-all;"></div>
                <button class="copy-btn" onclick="copyN8nEndpoint()">📋 Copy n8n Endpoint</button>
                <p style="margin-top: 10px; font-size: 14px; color: #4a5568;">
                    Use HTTP Request node in n8n with POST method and JSON body containing the tool parameters.
                </p>
            </div>
            
            <div class="instructions">
                <h3>📱 Claude Desktop Setup Instructions:</h3>
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
                    <li><strong>Test Facebook Ads tools</strong> - you now have 70 tools available!</li>
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
                    document.getElementById('n8nEndpoint').textContent = 'https://newfb-production.up.railway.app/stream/' + currentUserId;
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
                            "const https = require('https'); const readline = require('readline'); const USER_ID = '" + userId + "'; const BASE_URL = 'newfb-production.up.railway.app'; const rl = readline.createInterface({ input: process.stdin, output: process.stdout }); function sendRequest(method, params = {}) { return new Promise((resolve, reject) => { const postData = JSON.stringify({ method, params }); const options = { hostname: BASE_URL, port: 443, path: \`/mcp/\${USER_ID}\`, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } }; const req = https.request(options, (res) => { let data = ''; res.on('data', (chunk) => { data += chunk; }); res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Invalid JSON response')); } }); }); req.on('error', reject); req.write(postData); req.end(); }); } rl.on('line', async (line) => { try { const message = JSON.parse(line); if (message.method === 'initialize') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'facebook-ads-http', version: '1.0.0' } } })); } else if (message.method === 'notifications/initialized') { return; } else if (message.method === 'tools/list') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { tools: [ { name: 'create_campaign', description: 'Creates a new ad campaign', inputSchema: { type: 'object', properties: { name: { type: 'string' }, objective: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] } }, required: ['name', 'objective'] } }, { name: 'get_ad_accounts', description: 'Get list of available Facebook ad accounts', inputSchema: { type: 'object', properties: {} } }, { name: 'select_ad_account', description: 'Select a specific Facebook ad account to use', inputSchema: { type: 'object', properties: { accountId: { type: 'string', description: 'Facebook Ad Account ID (e.g., act_1234567890)' } }, required: ['accountId'] } }, { name: 'get_campaigns', description: 'Lists existing campaigns', inputSchema: { type: 'object', properties: { limit: { type: 'number', default: 25 } } } }, { name: 'get_campaign_details', description: 'Gets details for a specific campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string', description: 'Campaign ID' } }, required: ['campaignId'] } }, { name: 'update_campaign', description: 'Updates an existing campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' }, name: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] } }, required: ['campaignId'] } }, { name: 'delete_campaign', description: 'Deletes a campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' } }, required: ['campaignId'] } }, { name: 'create_custom_audience', description: 'Creates a custom, website, or engagement audience', inputSchema: { type: 'object', properties: { name: { type: 'string' }, type: { type: 'string', enum: ['CUSTOM', 'WEBSITE', 'ENGAGEMENT'] }, description: { type: 'string' } }, required: ['name', 'type'] } }, { name: 'get_audiences', description: 'Lists available custom audiences', inputSchema: { type: 'object', properties: { limit: { type: 'number', default: 25 } } } }, { name: 'create_lookalike_audience', description: 'Creates a lookalike audience', inputSchema: { type: 'object', properties: { name: { type: 'string' }, sourceAudienceId: { type: 'string' }, country: { type: 'string' }, ratio: { type: 'number', minimum: 1, maximum: 10 } }, required: ['name', 'sourceAudienceId', 'country'] } }, { name: 'create_ad_set', description: 'Creates a new ad set', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' }, name: { type: 'string' }, targeting: { type: 'object' }, budget: { type: 'number' } }, required: ['campaignId', 'name', 'targeting', 'budget'] } }, { name: 'get_campaign_insights', description: 'Retrieves performance insights for a campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' }, dateRange: { type: 'string', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'] } }, required: ['campaignId'] } }, { name: 'duplicate_campaign', description: 'Duplicates an existing campaign', inputSchema: { type: 'object', properties: { campaignId: { type: 'string' }, newName: { type: 'string' } }, required: ['campaignId'] } }, { name: 'update_ad_set', description: 'Updates an existing ad set', inputSchema: { type: 'object', properties: { adSetId: { type: 'string' }, name: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] }, dailyBudget: { type: 'number' } }, required: ['adSetId'] } }, { name: 'delete_ad_set', description: 'Deletes an ad set', inputSchema: { type: 'object', properties: { adSetId: { type: 'string' } }, required: ['adSetId'] } }, { name: 'duplicate_ad_set', description: 'Duplicates an existing ad set', inputSchema: { type: 'object', properties: { adSetId: { type: 'string' }, newName: { type: 'string' } }, required: ['adSetId'] } }, { name: 'get_ad_set_insights', description: 'Retrieves performance insights for an ad set', inputSchema: { type: 'object', properties: { adSetId: { type: 'string' }, dateRange: { type: 'string', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'] } }, required: ['adSetId'] } }, { name: 'update_custom_audience', description: 'Updates an existing custom audience', inputSchema: { type: 'object', properties: { audienceId: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' } }, required: ['audienceId'] } }, { name: 'create_ad', description: 'Creates a new ad using a pre-created ad creative', inputSchema: { type: 'object', properties: { adSetId: { type: 'string', description: 'Ad Set ID where the ad will be created' }, name: { type: 'string', description: 'Name for the ad' }, creativeId: { type: 'string', description: 'ID of pre-created ad creative (use create_ad_creative first)' } }, required: ['adSetId', 'name', 'creativeId'] } }, { name: 'create_ad_creative', description: 'Creates a new ad creative with dynamic parameters', inputSchema: { type: 'object', properties: { name: { type: 'string', description: 'Name for the ad creative' }, pageId: { type: 'string', description: 'Facebook Page ID (use get_facebook_pages to find valid IDs)' }, link: { type: 'string', description: 'Destination URL for the ad' }, message: { type: 'string', description: 'Main ad message/text' }, description: { type: 'string', description: 'Optional ad description' }, callToAction: { type: 'object', description: 'Optional call-to-action button', properties: { type: { type: 'string' }, link: { type: 'string' } } } }, required: ['name', 'pageId', 'link', 'message'] } }, { name: 'duplicate_ad', description: 'Duplicates an existing ad', inputSchema: { type: 'object', properties: { adId: { type: 'string' }, newName: { type: 'string' } }, required: ['adId'] } }, { name: 'update_ad', description: 'Updates an existing ad', inputSchema: { type: 'object', properties: { adId: { type: 'string' }, name: { type: 'string' }, status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] }, creative: { type: 'object' } }, required: ['adId'] } }, { name: 'delete_ad', description: 'Deletes an ad', inputSchema: { type: 'object', properties: { adId: { type: 'string' } }, required: ['adId'] } }, { name: 'get_ad_insights', description: 'Retrieves performance insights for an ad', inputSchema: { type: 'object', properties: { adId: { type: 'string' }, dateRange: { type: 'string', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'] } }, required: ['adId'] } }, { name: 'check_ad_id', description: 'Check ad details and hierarchy by ad ID', inputSchema: { type: 'object', properties: { adId: { type: 'string', description: 'Facebook ad ID to check' } }, required: ['adId'] } }, { name: 'get_leads_data', description: 'Get leads data from Laravel app', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } },{ name: 'get_lead_report', description: 'Get ad performance report for multiple users and ads with spend, impressions, clicks, CPM, CTR metrics', inputSchema: { type: 'object', properties: { adDataArray: { type: 'array', description: 'Array of user ad data', items: { type: 'object', properties: { user_id: { type: 'string', description: 'User ID' }, date: { type: 'string', description: 'Date in DD-MM-YYYY format' }, ads: { type: 'array', description: 'Array of ads', items: { type: 'object', properties: { ad_id: { type: 'string', description: 'Facebook Ad ID' } }, required: ['ad_id'] } } }, required: ['user_id', 'date', 'ads'] } } }, required: ['adDataArray'] } }, { name: 'get_leads_with_insights', description: 'Get leads data with Facebook ad insights and ROI metrics', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } }, { name: 'get_facebook_pages', description: 'Get user Facebook pages with detailed permissions and ad readiness info', inputSchema: { type: 'object', properties: {} } }, { name: 'generate_campaign_prompt', description: 'Generates a prompt for campaign creation using a template', inputSchema: { type: 'object', properties: { objective: { type: 'string' }, industry: { type: 'string' }, target_audience: { type: 'string' } }, required: ['objective'] } }, { name: 'get_meta_platform_id', description: 'Get Meta Platform ID for a brand', inputSchema: { type: 'object', properties: { brandNames: { type: 'string', description: 'Brand name or array of brand names' } }, required: ['brandNames'] } }, { name: 'get_meta_ads', description: 'Get ads from Meta Ads Library for a specific page', inputSchema: { type: 'object', properties: { platformId: { type: 'string' }, adType: { type: 'string', enum: ['POLITICAL_AND_ISSUE_ADS', 'ALL'] }, adActiveStatus: { type: 'string', enum: ['ALL', 'ACTIVE', 'INACTIVE'] }, limit: { type: 'number', default: 25 }, searchTerms: { type: 'string' }, adReachedCountries: { type: 'array', items: { type: 'string' } }, adDeliveryDateMin: { type: 'string' }, adDeliveryDateMax: { type: 'string' } }, required: ['platformId'] } }, { name: 'search_ads_library', description: 'Search ads across multiple advertisers', inputSchema: { type: 'object', properties: { searchQuery: { type: 'string' }, countries: { type: 'array', items: { type: 'string' } }, adType: { type: 'string', enum: ['POLITICAL_AND_ISSUE_ADS', 'ALL'] }, limit: { type: 'number', default: 25 } }, required: ['searchQuery'] } }, { name: 'get_competitor_ads_analysis', description: 'Get competitor analysis', inputSchema: { type: 'object', properties: { competitorPageIds: { type: 'array', items: { type: 'string' } }, dateRange: { type: 'number', default: 30 } }, required: ['competitorPageIds'] } }, { name: 'get_page_details', description: 'Get detailed information about a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' } }, required: ['pageId'] } }, { name: 'create_page_post', description: 'Create a new post on a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, message: { type: 'string' }, link: { type: 'string' }, published: { type: 'boolean', default: true } }, required: ['pageId', 'message'] } }, { name: 'update_page_post', description: 'Update an existing Facebook page post', inputSchema: { type: 'object', properties: { postId: { type: 'string' }, message: { type: 'string' } }, required: ['postId', 'message'] } }, { name: 'delete_page_post', description: 'Delete a post from a Facebook page', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } }, { name: 'get_page_posts', description: 'Get posts from a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, limit: { type: 'number', default: 25 } }, required: ['pageId'] } }, { name: 'get_page_insights', description: 'Get insights and analytics for a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, metrics: { type: 'array', items: { type: 'string' } }, period: { type: 'string', enum: ['day', 'week', 'days_28', 'month', 'lifetime'] } }, required: ['pageId'] } }, { name: 'schedule_page_post', description: 'Schedule a post for future publishing', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, message: { type: 'string' }, scheduledTime: { type: 'string' }, link: { type: 'string' } }, required: ['pageId', 'message', 'scheduledTime'] } }, { name: 'get_scheduled_posts', description: 'Get all scheduled posts for a page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' } }, required: ['pageId'] } }, { name: 'publish_scheduled_post', description: 'Publish a scheduled post immediately', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } }, { name: 'cancel_scheduled_post', description: 'Cancel a scheduled post', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } }, { name: 'get_page_videos', description: 'Get videos from a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, limit: { type: 'number', default: 25 } }, required: ['pageId'] } }, { name: 'upload_page_video', description: 'Upload a video to a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, videoUrl: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' } }, required: ['pageId', 'videoUrl'] } }, { name: 'get_page_events', description: 'Get events from a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, timeFilter: { type: 'string', enum: ['upcoming', 'past'] } }, required: ['pageId'] } }, { name: 'create_page_event', description: 'Create an event on a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, name: { type: 'string' }, startTime: { type: 'string' }, endTime: { type: 'string' }, description: { type: 'string' }, location: { type: 'string' } }, required: ['pageId', 'name', 'startTime'] } }, { name: 'update_page_event', description: 'Update an existing page event', inputSchema: { type: 'object', properties: { eventId: { type: 'string' }, name: { type: 'string' }, startTime: { type: 'string' }, endTime: { type: 'string' }, description: { type: 'string' } }, required: ['eventId'] } }, { name: 'delete_page_event', description: 'Delete an event from a Facebook page', inputSchema: { type: 'object', properties: { eventId: { type: 'string' } }, required: ['eventId'] } }, { name: 'get_page_fan_count', description: 'Get the total fan/follower count for a page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' } }, required: ['pageId'] } }, { name: 'reply_to_comment', description: 'Reply to a specific comment on a post', inputSchema: { type: 'object', properties: { commentId: { type: 'string' }, message: { type: 'string' } }, required: ['commentId', 'message'] } }, { name: 'get_post_comments', description: 'Fetch comments on a given post', inputSchema: { type: 'object', properties: { postId: { type: 'string' }, limit: { type: 'number', default: 25 } }, required: ['postId'] } }, { name: 'delete_comment', description: 'Delete a specific comment by ID', inputSchema: { type: 'object', properties: { commentId: { type: 'string' } }, required: ['commentId'] } }, { name: 'delete_comment_from_post', description: 'Alias for deleting a comment from a specific post', inputSchema: { type: 'object', properties: { commentId: { type: 'string' } }, required: ['commentId'] } }, { name: 'filter_negative_comments', description: 'Filter out comments with negative sentiment keywords', inputSchema: { type: 'object', properties: { postId: { type: 'string' }, keywords: { type: 'array', items: { type: 'string' } } }, required: ['postId'] } }, { name: 'get_number_of_comments', description: 'Count the number of comments on a post', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } }, { name: 'get_number_of_likes', description: 'Count the number of likes on a post', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } }, { name: 'get_post_impressions', description: 'Get total impressions on a post', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } }, { name: 'get_post_impressions_unique', description: 'Get number of unique users who saw the post', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } }, { name: 'get_post_impressions_paid', description: 'Get number of paid impressions on the post', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } }, { name: 'get_post_impressions_organic', description: 'Get number of organic impressions on the post', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } }, { name: 'get_post_engaged_users', description: 'Get number of users who engaged with the post', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } }, { name: 'get_post_clicks', description: 'Get number of clicks on the post', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } }, { name: 'get_post_reactions_like_total', description: 'Get total number of Like reactions', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } }, { name: 'get_post_top_commenters', description: 'Get the top commenters on a post', inputSchema: { type: 'object', properties: { postId: { type: 'string' }, limit: { type: 'number', default: 10 } }, required: ['postId'] } }, { name: 'post_image_to_facebook', description: 'Post an image with a caption to the Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, imageUrl: { type: 'string' }, caption: { type: 'string' } }, required: ['pageId', 'imageUrl'] } }, { name: 'get_post_share_count', description: 'Get the number of shares on a post', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } }, { name: 'send_dm_to_user', description: 'Send a direct message to a user', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, recipientId: { type: 'string' }, message: { type: 'string' } }, required: ['pageId', 'recipientId', 'message'] } }, { name: 'create_cron_job', description: 'Create a new cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, title: { type: 'string', description: 'Job title' }, url: { type: 'string', description: 'URL to call' }, schedule: { type: 'object', properties: { minutes: { type: 'array', items: { type: 'number' }, description: 'Minutes (0-59)' }, hours: { type: 'array', items: { type: 'number' }, description: 'Hours (0-23)' } } }, requestMethod: { type: 'number', description: '0=GET, 1=POST' }, postData: { type: 'string', description: 'POST data if method is POST' } }, required: ['apiKey', 'title', 'url'] } }, { name: 'get_cron_job_details', description: 'Get cron job details', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' } }, required: ['apiKey', 'jobId'] } }, { name: 'update_cron_job', description: 'Update an existing cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, title: { type: 'string', description: 'New title' }, url: { type: 'string', description: 'New URL' }, schedule: { type: 'object', description: 'New schedule' } }, required: ['apiKey', 'jobId'] } }, { name: 'delete_cron_job', description: 'Delete a cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' } }, required: ['apiKey', 'jobId'] } }, { name: 'get_cron_job_history', description: 'Get cron job execution history', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, limit: { type: 'number', description: 'Number of records to fetch', default: 25 } }, required: ['apiKey', 'jobId'] } }, { name: 'get_cron_job_history_details', description: 'Get specific execution details', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, identifier: { type: 'string', description: 'Execution identifier' } }, required: ['apiKey', 'jobId', 'identifier'] } }, { name: 'list_cron_jobs', description: 'List all cron jobs', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' } }, required: ['apiKey'] } }, { name: 'get_account_insights', description: 'Get insights for a single ad account', inputSchema: { type: 'object', properties: { accountId: { type: 'string', description: 'Facebook Ad Account ID (e.g., act_123456)' }, dateRange: { type: 'string', description: 'Date range preset', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'], default: 'today' } }, required: ['accountId'] } }, { name: 'get_total_spend_all_accounts', description: 'Get total spend across all ad accounts', inputSchema: { type: 'object', properties: { dateRange: { type: 'string', description: 'Date range preset', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'], default: 'today' } } } }, { name: 'get_spend_by_campaign', description: 'Get spend breakdown by campaign across all accounts', inputSchema: { type: 'object', properties: { dateRange: { type: 'string', description: 'Date range preset', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'], default: 'today' } } } } ] } })); } else if (message.method === 'resources/list') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { resources: [] } })); } else if (message.method === 'prompts/list') { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { prompts: [] } })); } else if (message.method === 'tools/call') { try { const result = await sendRequest(message.params.name, message.params.arguments || {}); console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } })); } catch (error) { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, error: { code: -32603, message: error.message } })); } } else { console.log(JSON.stringify({ jsonrpc: '2.0', id: message.id, result: {} })); } } catch (error) { console.error('Parse error:', error); } }); process.on('SIGINT', () => process.exit(0)); process.on('SIGTERM', () => process.exit(0));"
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
        
        function copyN8nEndpoint() {
            const endpoint = document.getElementById('n8nEndpoint').textContent;
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(endpoint).then(() => {
                    showCopySuccess(event.target, '✅ n8n Endpoint Copied!');
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                    alert('Failed to copy to clipboard. Please select and copy manually.');
                });
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
        // ============= FOUNDATIONAL TOOLS - Always call these first =============
        { 
          name: 'get_ad_accounts', 
          description: 'FOUNDATIONAL STEP: Discovers all accessible Facebook ad accounts with IDs, names, currencies, and permissions. INTELLIGENCE: Always call this FIRST before any advertising operations. Returns accounts array for multi-account analysis. AUTOMATION TRIGGER: Use for tasks requesting "all accounts" or "total across accounts". OUTPUT: Account list for account selection and spend aggregation. PERFECT FOR: Initial setup, account discovery, multi-account analytics.',
          inputSchema: { type: 'object', properties: {} }
        },
        { 
          name: 'select_ad_account', 
          description: 'CONTEXT SETTER: Activates specific ad account for subsequent operations. INTELLIGENCE: Call after get_ad_accounts when working with specific account. NOT NEEDED for multi-account analysis tools. AUTOMATION: Skip this for "total across all accounts" tasks. USE CASE: Single account operations only. WORKFLOW: get_ad_accounts → select_ad_account → account-specific operations.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              accountId: { type: 'string', description: 'Format: act_XXXXXXXXX from get_ad_accounts response' } 
            }, 
            required: ['accountId'] 
          }
        },
        
        // ============= MULTI-ACCOUNT ANALYTICS - Perfect for complex reporting =============
        { 
          name: 'get_total_spend_all_accounts', 
          description: 'MULTI-ACCOUNT AGGREGATOR: Calculates total advertising spend across ALL Facebook accounts automatically. INTELLIGENCE: Use for "total spent on all accounts", "overall company spend", "budget analysis across accounts". NO PREREQUISITES: Works independently, auto-discovers accounts. RETURNS: Grand total spend + individual account breakdowns + performance metrics. AUTOMATION PERFECT FOR: Executive reporting, budget tracking, ROAS calculation base data.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              dateRange: { 
                type: 'string', 
                enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'], 
                default: 'last_30_days',
                description: 'RECOMMENDATION: Use last_30_days for comprehensive ROAS analysis' 
              } 
            } 
          }
        },
        { 
          name: 'get_spend_by_campaign', 
          description: 'CAMPAIGN-LEVEL BREAKDOWN: Shows spending by individual campaigns across ALL accounts with performance metrics. INTELLIGENCE: Use for "spend per campaign", "which campaigns spent most", "campaign performance ranking". RETURNS: Campaign spend + impressions + clicks + conversions sorted by spend. AUTOMATION PERFECT FOR: Campaign optimization, budget reallocation, ROI by campaign analysis.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              dateRange: { 
                type: 'string', 
                enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'], 
                default: 'last_30_days',
                description: 'Match with other analytics for consistent ROAS calculation' 
              } 
            } 
          }
        },
        { 
          name: 'get_account_insights', 
          description: 'SINGLE ACCOUNT DEEP DIVE: Detailed performance analytics for ONE specific account including spend, impressions, clicks, conversions, CPM, CPC, CTR, ROAS. INTELLIGENCE: Use when you need per-account breakdown after get_total_spend_all_accounts. PREREQUISITE: select_ad_account first. AUTOMATION: Loop through all accounts for complete analysis. WORKFLOW: get_ad_accounts → select_ad_account → get_account_insights (repeat for each account).',
          inputSchema: { 
            type: 'object', 
            properties: { 
              accountId: { 
                type: 'string', 
                description: 'Account ID from get_ad_accounts. Use in loop for all-account analysis' 
              }, 
              dateRange: { 
                type: 'string', 
                enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'], 
                default: 'last_30_days',
                description: 'Keep consistent with other analytics for accurate ROAS calculation' 
              } 
            }, 
            required: ['accountId'] 
          }
        },
        
        // ============= LEAD TRACKING & ROI CALCULATION - Essential for ROAS =============
        { 
          name: 'get_leads_data', 
          description: 'CRM LEAD EXTRACTOR: Retrieves leads from Laravel CRM by staff member and date range. INTELLIGENCE: Use for "total leads", "leads by channel", "sales data", "conversion tracking". RETURNS: Lead count, lead details, conversion data, sales amounts by staff/channel. AUTOMATION: Essential for ROAS calculation = (Lead Value × Lead Count) ÷ Ad Spend. WORKFLOW: Call for each staff ID to get channel-specific data.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              staffId: { 
                type: 'string', 
                description: 'Staff ID format: RV-007, SM-001, etc. Use ALL staff IDs for total leads across channels' 
              }, 
              startDate: { 
                type: 'string', 
                description: 'Format: DD-MM-YYYY. Match with ad spend date range for accurate ROAS' 
              }, 
              endDate: { 
                type: 'string', 
                description: 'Format: DD-MM-YYYY. Align with advertising analytics period' 
              } 
            }, 
            required: ['staffId', 'startDate', 'endDate'] 
          }
        },
        { 
          name: 'get_leads_with_insights', 
          description: 'ROI CALCULATOR: Combines CRM leads with Facebook ad spend for automatic ROAS calculation. INTELLIGENCE: Perfect for "calculate ROAS", "cost per lead", "advertising ROI", "lead attribution". RETURNS: Lead count + ad spend + cost per lead + ROAS percentage. AUTOMATION PERFECT FOR: Complete ROI analysis in one call. WORKFLOW: Call for each staff/channel to get channel-specific ROAS.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              staffId: { 
                type: 'string', 
                description: 'Staff/channel identifier. Query each channel for channel-specific ROAS' 
              }, 
              startDate: { 
                type: 'string', 
                description: 'DD-MM-YYYY format. Align with advertising spend period' 
              }, 
              endDate: { 
                type: 'string', 
                description: 'DD-MM-YYYY format. Match advertising analytics timeframe' 
              } 
            }, 
            required: ['staffId', 'startDate', 'endDate'] 
          }
        },
        
        // ============= CAMPAIGN MANAGEMENT WORKFLOW =============
        { 
          name: 'get_campaigns', 
          description: 'CAMPAIGN INVENTORY: Lists all campaigns in selected account with status, objectives, budget, and basic metrics. INTELLIGENCE: Use to discover existing campaigns, get campaign IDs for analysis, check campaign portfolio. PREREQUISITE: select_ad_account required. AUTOMATION: Essential before campaign creation to avoid duplicates. RETURNS: Campaign IDs needed for insights and management.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              limit: { type: 'number', default: 25, description: 'Campaign count limit. Use 50+ for comprehensive view' } 
            } 
          }
        },
        { 
          name: 'create_campaign', 
          description: 'CAMPAIGN CREATOR: Builds new advertising campaigns with specified objectives. INTELLIGENCE: Use after account selection for new campaign creation. OBJECTIVES: OUTCOME_TRAFFIC (website visits), OUTCOME_SALES (purchases), OUTCOME_LEADS (lead generation), OUTCOME_ENGAGEMENT (social interaction), OUTCOME_AWARENESS (brand visibility). AUTOMATION: Start of 4-step ad creation process. WORKFLOW: select_ad_account → create_campaign → create_ad_set → create_ad_creative → create_ad.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              name: { type: 'string', description: 'Campaign name. Suggest format: "[Objective]-[Product]-[Date]"' }, 
              objective: { type: 'string', description: 'EXACT values: OUTCOME_TRAFFIC, OUTCOME_SALES, OUTCOME_LEADS, OUTCOME_ENGAGEMENT, OUTCOME_AWARENESS' }, 
              status: { type: 'string', enum: ['ACTIVE', 'PAUSED'], description: 'PAUSED for setup, ACTIVE to start spending' } 
            }, 
            required: ['name', 'objective'] 
          }
        },
{
  name: 'get_lead_report',
  description: 'AD PERFORMANCE ANALYTICS: Generates comprehensive Facebook ad performance report for multiple users and ads. INTELLIGENCE: Fetches real-time Facebook SDK insights including spend, impressions, clicks, CPM, CTR metrics. AUTOMATION: Perfect for multi-user analytics and campaign performance tracking. USE CASE: Analyze ad performance across multiple users, calculate efficiency metrics, track campaign effectiveness. WORKFLOW: Provide adDataArray with user_id, date, and ads → Get detailed performance report with all Facebook metrics. DATA INCLUDED: Ad spend, impressions, clicks, CPM, CTR, reach, frequency, link clicks, campaign names, ad set details.',
  inputSchema: {
    type: 'object',
    properties: {
      adDataArray: {
        type: 'array',
        description: 'Array of user ad data containing user_id, date, and ads with ad_id',
        items: {
          type: 'object',
          properties: {
            user_id: { 
              type: 'string', 
              description: 'User identifier for ad ownership tracking' 
            },
            date: { 
              type: 'string', 
              description: 'Analysis date in DD-MM-YYYY format (e.g., 26-06-2025)' 
            },
            ads: {
              type: 'array',
              description: 'Array of Facebook ads for this user',
              items: {
                type: 'object',
                properties: {
                  ad_id: { 
                    type: 'string', 
                    description: 'Facebook Ad ID (e.g., 120219408501250312)' 
                  }
                },
                required: ['ad_id']
              }
            }
          },
          required: ['user_id', 'date', 'ads']
        }
      }
    },
    required: ['adDataArray']
  }
},
        { 
          name: 'get_campaign_details', 
          description: 'CAMPAIGN ANALYZER: Retrieves comprehensive information about specific campaign including objective, status, budget details, targeting summary, creation date, and configuration. INTELLIGENCE: Use when you need detailed campaign analysis or troubleshooting. REQUIRES: Campaign ID from get_campaigns. AUTOMATION: Use for campaign auditing and optimization analysis.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              campaignId: { type: 'string', description: 'Campaign ID from get_campaigns response' } 
            }, 
            required: ['campaignId'] 
          }
        },
        { 
          name: 'update_campaign', 
          description: 'CAMPAIGN MODIFIER: Changes campaign name, status, or settings. INTELLIGENCE: Use for campaign optimization, pausing underperformers, activating new campaigns. STATUS IMPACT: PAUSED stops spending immediately, ACTIVE starts spending. AUTOMATION: Use for bulk campaign management and optimization workflows. REQUIRES: Campaign ID from get_campaigns.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              campaignId: { type: 'string', description: 'Campaign to modify from get_campaigns' }, 
              name: { type: 'string', description: 'New campaign name (optional)' }, 
              status: { type: 'string', enum: ['ACTIVE', 'PAUSED'], description: 'New status - PAUSED stops spend, ACTIVE starts spend' } 
            }, 
            required: ['campaignId'] 
          }
        },
        { 
          name: 'duplicate_campaign', 
          description: 'CAMPAIGN CLONER: Creates exact copy of existing campaign with all ad sets and ads. INTELLIGENCE: Use for A/B testing different campaign strategies, scaling successful campaigns, or creating similar campaigns for different products. AUTOMATION: Perfect for rapid campaign scaling. WORKFLOW: get_campaigns → duplicate_campaign → update new campaign settings.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              campaignId: { type: 'string', description: 'Source campaign ID to clone' }, 
              newName: { type: 'string', description: 'Name for duplicated campaign' } 
            }, 
            required: ['campaignId'] 
          }
        },
        { 
          name: 'delete_campaign', 
          description: 'CAMPAIGN REMOVER: Permanently deletes campaign and ALL its ad sets and ads. INTELLIGENCE: Use with extreme caution for failed campaigns or cleanup. IRREVERSIBLE ACTION: Cannot be undone. RECOMMENDATION: Pause instead of delete for data preservation. PREREQUISITE: Campaign must be PAUSED first.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              campaignId: { type: 'string', description: 'Campaign ID to permanently delete' } 
            }, 
            required: ['campaignId'] 
          }
        },
        { 
          name: 'get_campaign_insights', 
          description: 'CAMPAIGN PERFORMANCE: Detailed analytics for specific campaign including spend, impressions, clicks, conversions, CTR, CPC, ROAS, frequency, reach. INTELLIGENCE: Use for campaign optimization, performance tracking, ROI analysis. REQUIRES: Campaign ID. DATA AVAILABILITY: Wait 1+ hours after campaign activation. AUTOMATION: Essential for performance monitoring and optimization.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              campaignId: { type: 'string', description: 'Campaign ID to analyze from get_campaigns' }, 
              dateRange: { type: 'string', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'], description: 'Analysis period for insights' } 
            }, 
            required: ['campaignId'] 
          }
        },
        
        // ============= AD SET MANAGEMENT WORKFLOW =============
        { 
          name: 'create_ad_set', 
          description: 'TARGETING & BUDGET SETUP: Creates ad set with audience targeting and budget allocation within campaign. INTELLIGENCE: Step 2 after create_campaign. REQUIRES: Campaign ID from previous step. TARGETING STRUCTURE: {age_min: 18, age_max: 65, genders: [1,2], geo_locations: {countries: ["US"]}}. BUDGET MINIMUM: 100 cents ($1 daily). AUTOMATION: Essential for campaign structure.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              campaignId: { type: 'string', description: 'From create_campaign response' }, 
              name: { type: 'string', description: 'Ad set name. Format: "[Audience]-[Age]-[Location]"' }, 
              targeting: { type: 'object', description: 'Required: age_min, age_max, genders, geo_locations' }, 
              budget: { type: 'number', description: 'Daily budget in cents. Minimum: 100 (=$1.00)' } 
            }, 
            required: ['campaignId', 'name', 'targeting', 'budget'] 
          }
        },
        { 
          name: 'update_ad_set', 
          description: 'AD SET OPTIMIZER: Modifies ad set settings including budget, targeting, schedule, or status. INTELLIGENCE: Use to optimize performance by adjusting daily budget, pausing underperforming ad sets, or refining audience targeting. AUTOMATION: Perfect for bid optimization and budget reallocation workflows.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              adSetId: { type: 'string', description: 'Ad set ID to modify' }, 
              name: { type: 'string', description: 'New ad set name (optional)' }, 
              status: { type: 'string', enum: ['ACTIVE', 'PAUSED'], description: 'PAUSED stops spend, ACTIVE starts spend' }, 
              dailyBudget: { type: 'number', description: 'New daily budget in cents (optional)' } 
            }, 
            required: ['adSetId'] 
          }
        },
        { 
          name: 'duplicate_ad_set', 
          description: 'AD SET CLONER: Creates exact copy of ad set with all targeting, budget, and optimization settings. INTELLIGENCE: Perfect for A/B testing different audiences, scaling successful ad sets to new demographics, or testing different budgets. AUTOMATION: Essential for rapid scaling and testing workflows.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              adSetId: { type: 'string', description: 'Source ad set ID to clone' }, 
              newName: { type: 'string', description: 'Name for duplicated ad set' } 
            }, 
            required: ['adSetId'] 
          }
        },
        { 
          name: 'delete_ad_set', 
          description: 'AD SET REMOVER: Permanently removes ad set and all ads within it. INTELLIGENCE: Use when ad set consistently underperforms or targeting strategy changes. IRREVERSIBLE: Cannot be undone. RECOMMENDATION: Consider pausing first for data analysis.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              adSetId: { type: 'string', description: 'Ad set ID to permanently delete' } 
            }, 
            required: ['adSetId'] 
          }
        },
        { 
          name: 'get_ad_set_insights', 
          description: 'AD SET PERFORMANCE: Detailed metrics for ad set including cost per result, frequency, reach, demographic breakdowns, placement performance. INTELLIGENCE: Critical for optimizing targeting and budget allocation. AUTOMATION: Use for identifying best-performing audiences and optimizing targeting strategies.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              adSetId: { type: 'string', description: 'Ad set ID to analyze' }, 
              dateRange: { type: 'string', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'], description: 'Analysis period' } 
            }, 
            required: ['adSetId'] 
          }
        },
        
        // ============= CREATIVE AND AD CREATION WORKFLOW =============
        { 
          name: 'get_facebook_pages', 
          description: 'PAGE DISCOVERY: Lists Facebook pages for ad creative requirements. INTELLIGENCE: Call before create_ad_creative to get page IDs. NO PREREQUISITES. RETURNS: Page IDs, names, permissions, and advertising capabilities. AUTOMATION: Essential step in ad creation workflow. USE CASE: Every ad must be associated with a Facebook page.',
          inputSchema: { type: 'object', properties: {} }
        },
        { 
          name: 'create_ad_creative', 
          description: 'CREATIVE BUILDER: Designs ad visual content with images, videos, text, headlines, descriptions, and call-to-action buttons. INTELLIGENCE: Step 3 after create_ad_set. REQUIRES: Page ID from get_facebook_pages. LINK FORMAT: Must include https://. TEXT OPTIMIZATION: Keep message under 125 characters for best performance. AUTOMATION: Essential for ad creation workflow.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              name: { type: 'string', description: 'Creative identifier for organization' }, 
              pageId: { type: 'string', description: 'Page ID from get_facebook_pages response' }, 
              link: { type: 'string', description: 'Destination URL with https://' }, 
              message: { type: 'string', description: 'Main ad text (max 125 chars recommended)' }, 
              description: { type: 'string', description: 'Additional ad description (optional but recommended)' },
              callToAction: { type: 'object', description: 'Optional CTA button: {type: "LEARN_MORE", link: "url"}' }
            }, 
            required: ['name', 'pageId', 'link', 'message'] 
          }
        },
        { 
          name: 'create_ad', 
          description: 'FINAL AD ASSEMBLY: Combines ad set (targeting/budget) with creative (visuals/text) to create live advertisement that users see. INTELLIGENCE: Final step (Step 4) requiring ad set ID + creative ID. BILLING ACTIVATION: Spending starts immediately if campaign/ad set are ACTIVE status. WORKFLOW: create_campaign → create_ad_set → create_ad_creative → create_ad.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              adSetId: { type: 'string', description: 'Ad set ID from create_ad_set response' }, 
              name: { type: 'string', description: 'Ad identifier for tracking and organization' }, 
              creativeId: { type: 'string', description: 'Creative ID from create_ad_creative response' } 
            }, 
            required: ['adSetId', 'name', 'creativeId'] 
          }
        },
        { 
          name: 'update_ad', 
          description: 'AD MODIFIER: Changes ad name, status, or creative elements. INTELLIGENCE: Use to pause underperforming ads, test different creative variations, or update messaging for seasonal campaigns. AUTOMATION: Perfect for creative testing and ad optimization workflows.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              adId: { type: 'string', description: 'Ad ID to modify' }, 
              name: { type: 'string', description: 'New ad name (optional)' }, 
              status: { type: 'string', enum: ['ACTIVE', 'PAUSED'], description: 'PAUSED stops delivery, ACTIVE starts delivery' },
              creative: { type: 'object', description: 'New creative elements (optional)' }
            }, 
            required: ['adId'] 
          }
        },
        { 
          name: 'duplicate_ad', 
          description: 'AD CLONER: Creates exact copy of ad including all creative elements and targeting. INTELLIGENCE: Perfect for A/B testing different ad copy, images, or call-to-action buttons while keeping everything else constant. AUTOMATION: Essential for creative testing workflows and rapid scaling.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              adId: { type: 'string', description: 'Source ad ID to clone' }, 
              newName: { type: 'string', description: 'Name for duplicated ad' } 
            }, 
            required: ['adId'] 
          }
        },
        { 
          name: 'delete_ad', 
          description: 'AD REMOVER: Permanently removes ad from Facebook. INTELLIGENCE: Use for ads with poor performance or outdated creative content. IRREVERSIBLE: Consider the impact on ad set performance and historical data before deletion. RECOMMENDATION: Pause instead of delete for data preservation.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              adId: { type: 'string', description: 'Ad ID to permanently delete' } 
            }, 
            required: ['adId'] 
          }
        },
        { 
          name: 'get_ad_insights', 
          description: 'AD PERFORMANCE: Granular performance data for individual ads including CTR, CPC, conversion rates, demographic performance, creative engagement metrics. INTELLIGENCE: Essential for identifying winning ad variations and optimizing creative strategy. AUTOMATION: Use for creative performance analysis and optimization.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              adId: { type: 'string', description: 'Ad ID to analyze' }, 
              dateRange: { type: 'string', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'], description: 'Analysis period' } 
            }, 
            required: ['adId'] 
          }
        },
        { 
          name: 'check_ad_id', 
          description: 'AD HIERARCHY INSPECTOR: Retrieves comprehensive information about ad including parent campaign, ad set, creative details, targeting settings, current status. INTELLIGENCE: Use to understand ad hierarchy, troubleshoot performance issues, audit ad structure. AUTOMATION: Perfect for ad auditing and hierarchy analysis.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              adId: { type: 'string', description: 'Facebook ad ID to inspect and analyze' } 
            }, 
            required: ['adId'] 
          }
        },
        
        // ============= AUDIENCE MANAGEMENT TOOLS =============
        { 
          name: 'get_audiences', 
          description: 'AUDIENCE INVENTORY: Lists all custom audiences available in ad account including lookalike audiences, website visitors, customer lists, engagement audiences. INTELLIGENCE: Use to see available targeting options for ad sets, plan audience strategies. AUTOMATION: Essential before audience-based targeting.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              limit: { type: 'number', default: 25, description: 'Audience count limit' } 
            } 
          }
        },
        { 
          name: 'create_custom_audience', 
          description: 'AUDIENCE BUILDER: Creates targeted audience segments based on customer data, website visitors, or engagement. INTELLIGENCE: Types - CUSTOM (upload customer list), WEBSITE (pixel-based website visitors), ENGAGEMENT (people who interacted with content). AUTOMATION: Essential for retargeting and lookalike audience creation. PREREQUISITE: Business verification may be required.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              name: { type: 'string', description: 'Audience name for identification' }, 
              type: { type: 'string', enum: ['CUSTOM', 'WEBSITE', 'ENGAGEMENT'], description: 'Audience type and data source' }, 
              description: { type: 'string', description: 'Audience description and purpose' } 
            }, 
            required: ['name', 'type'] 
          }
        },
        { 
          name: 'create_lookalike_audience', 
          description: 'LOOKALIKE GENERATOR: Creates audiences similar to existing custom audiences. INTELLIGENCE: Use existing high-value customer audiences as source to find similar prospects. RATIO: 1% (most similar) to 10% (broader but less similar). AUTOMATION: Perfect for scaling successful customer segments.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              name: { type: 'string', description: 'Lookalike audience name' }, 
              sourceAudienceId: { type: 'string', description: 'Source custom audience ID from get_audiences' }, 
              country: { type: 'string', description: 'Target country code (e.g., "US", "MY")' }, 
              ratio: { type: 'number', minimum: 1, maximum: 10, description: '1=most similar, 10=broader reach' } 
            }, 
            required: ['name', 'sourceAudienceId', 'country'] 
          }
        },
        { 
          name: 'update_custom_audience', 
          description: 'AUDIENCE MODIFIER: Updates existing custom audience name, description, or settings. INTELLIGENCE: Use for audience maintenance, updating descriptions for better organization. AUTOMATION: Useful for audience management workflows.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              audienceId: { type: 'string', description: 'Audience ID to update' }, 
              name: { type: 'string', description: 'New audience name (optional)' }, 
              description: { type: 'string', description: 'New audience description (optional)' } 
            }, 
            required: ['audienceId'] 
          }
        },
        
        // ============= AI-POWERED CAMPAIGN PLANNING =============
        { 
          name: 'generate_campaign_prompt', 
          description: 'AI CAMPAIGN STRATEGIST: Uses AI to generate strategic campaign recommendations based on objective, industry, and target audience. INTELLIGENCE: Provides campaign structure suggestions, audience insights, creative ideas, budget recommendations. AUTOMATION: Great starting point for campaign planning and strategy development. NO PREREQUISITES.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              objective: { type: 'string', description: 'Campaign objective (traffic, sales, leads, etc.)' }, 
              industry: { type: 'string', description: 'Business industry or vertical' }, 
              target_audience: { type: 'string', description: 'Target audience description' } 
            }, 
            required: ['objective'] 
          }
        },
        
        // ============= FACEBOOK ADS LIBRARY TOOLS (Requires App Review) =============
        { 
          name: 'get_meta_platform_id', 
          description: 'PLATFORM ID FINDER: Retrieves Meta Platform ID for brand or company name. INTELLIGENCE: Required for accessing ads library data for competitive analysis. NOTE: Requires Facebook App Review for Ads Library API access. AUTOMATION: First step in competitive research workflow.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              brandNames: { type: 'string', description: 'Brand name or company name to find Platform ID' } 
            }, 
            required: ['brandNames'] 
          }
        },
        { 
          name: 'get_meta_ads', 
          description: 'COMPETITIVE AD RESEARCH: Retrieves active and inactive ads from Facebook Ads Library for competitive analysis. INTELLIGENCE: See competitors\' ad creative, messaging, targeting strategies, ad spend patterns. AUTOMATION: Perfect for competitive intelligence and creative inspiration. PREREQUISITE: Requires App Review for Ads Library access.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              platformId: { type: 'string', description: 'Platform ID from get_meta_platform_id' }, 
              adType: { type: 'string', enum: ['POLITICAL_AND_ISSUE_ADS', 'ALL'], description: 'Ad type filter' }, 
              adActiveStatus: { type: 'string', enum: ['ALL', 'ACTIVE', 'INACTIVE'], description: 'Active status filter' }, 
              limit: { type: 'number', default: 25, description: 'Number of ads to retrieve' },
              searchTerms: { type: 'string', description: 'Keywords to search in ads' },
              adReachedCountries: { type: 'array', items: { type: 'string' }, description: 'Country codes for geographic filter' },
              adDeliveryDateMin: { type: 'string', description: 'Start date for ad delivery period' },
              adDeliveryDateMax: { type: 'string', description: 'End date for ad delivery period' }
            }, 
            required: ['platformId'] 
          }
        },
        { 
          name: 'search_ads_library', 
          description: 'MARKET AD SEARCH: Searches Facebook Ads Library across multiple advertisers by keywords or phrases. INTELLIGENCE: Perfect for competitive research, creative inspiration, market analysis. AUTOMATION: See what messaging and visuals competitors use for similar products/services. PREREQUISITE: Requires App Review.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              searchQuery: { type: 'string', description: 'Keywords or phrases to search for in ads' }, 
              countries: { type: 'array', items: { type: 'string' }, description: 'Country codes to search within' }, 
              adType: { type: 'string', enum: ['POLITICAL_AND_ISSUE_ADS', 'ALL'], description: 'Type of ads to search' }, 
              limit: { type: 'number', default: 25, description: 'Maximum ads to return' } 
            }, 
            required: ['searchQuery'] 
          }
        },
        { 
          name: 'get_competitor_ads_analysis', 
          description: 'COMPETITIVE INTELLIGENCE: Analyzes competitor advertising strategies by examining ads library data over time. INTELLIGENCE: Identifies trends, messaging patterns, creative strategies, advertising frequency. AUTOMATION: Valuable for competitive intelligence and market positioning analysis. PREREQUISITE: Requires App Review.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              competitorPageIds: { type: 'array', items: { type: 'string' }, description: 'Array of competitor Facebook page IDs' }, 
              dateRange: { type: 'number', default: 30, description: 'Days to analyze (default 30 days)' } 
            }, 
            required: ['competitorPageIds'] 
          }
        },
        
        // ============= FACEBOOK PAGE MANAGEMENT TOOLS =============
        { 
          name: 'get_page_details', 
          description: 'PAGE ANALYZER: Retrieves comprehensive information about Facebook page including follower count, verification status, category, contact info, page insights. INTELLIGENCE: Use to understand page health and audience before creating ads. AUTOMATION: Essential for page audit and performance analysis.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              pageId: { type: 'string', description: 'Facebook page ID to analyze' } 
            }, 
            required: ['pageId'] 
          }
        },
        { 
          name: 'create_page_post', 
          description: 'ORGANIC POST CREATOR: Creates organic posts on Facebook page with text, links, and images. INTELLIGENCE: These posts can later be promoted as ads or used to build engagement before advertising. AUTOMATION: Perfect for content calendar automation and organic reach building.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              pageId: { type: 'string', description: 'Facebook page ID from get_facebook_pages' }, 
              message: { type: 'string', description: 'Post content and text' }, 
              link: { type: 'string', description: 'URL to include in post (optional)' }, 
              published: { type: 'boolean', default: true, description: 'true=publish immediately, false=save as draft' } 
            }, 
            required: ['pageId', 'message'] 
          }
        },
        { 
          name: 'update_page_post', 
          description: 'POST EDITOR: Modifies existing page posts to correct errors, update information, or refresh content. INTELLIGENCE: Useful for keeping evergreen content current or fixing typos in important posts. AUTOMATION: Perfect for content maintenance workflows.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              postId: { type: 'string', description: 'Post ID to update' }, 
              message: { type: 'string', description: 'New post content' } 
            }, 
            required: ['postId', 'message'] 
          }
        },
        { 
          name: 'delete_page_post', 
          description: 'POST REMOVER: Removes posts from Facebook page. INTELLIGENCE: Use for outdated content, incorrect information, or posts that no longer align with brand messaging. IRREVERSIBLE: Consider archiving strategy before deletion.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              postId: { type: 'string', description: 'Post ID to delete permanently' } 
            }, 
            required: ['postId'] 
          }
        },
        { 
          name: 'get_page_posts', 
          description: 'POST INVENTORY: Retrieves all posts from Facebook page with engagement metrics, reach data, post performance. INTELLIGENCE: Use to identify high-performing content for ad promotion or content strategy optimization. AUTOMATION: Essential for content performance analysis.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              pageId: { type: 'string', description: 'Facebook page ID to get posts from' }, 
              limit: { type: 'number', default: 25, description: 'Maximum posts to retrieve' } 
            }, 
            required: ['pageId'] 
          }
        },
        { 
          name: 'get_page_insights', 
          description: 'PAGE ANALYTICS: Detailed analytics for Facebook pages including reach, engagement, demographics, page views, follower growth. INTELLIGENCE: Essential for understanding organic performance and audience behavior patterns. AUTOMATION: Perfect for regular page performance reporting.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              pageId: { type: 'string', description: 'Facebook page ID to analyze' }, 
              metrics: { type: 'array', items: { type: 'string' }, description: 'Specific metrics to retrieve' }, 
              period: { type: 'string', enum: ['day', 'week', 'days_28', 'month', 'lifetime'], description: 'Time period for insights' } 
            }, 
            required: ['pageId'] 
          }
        },
        { 
          name: 'schedule_page_post', 
          description: 'POST SCHEDULER: Schedules posts for future publication at optimal times. INTELLIGENCE: Include timezone considerations and audience activity patterns. AUTOMATION: Perfect for maintaining consistent posting schedule and global audience management across time zones.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              pageId: { type: 'string', description: 'Facebook page ID' }, 
              message: { type: 'string', description: 'Post content to schedule' }, 
              scheduledTime: { type: 'string', description: 'ISO datetime for publication' }, 
              link: { type: 'string', description: 'URL to include (optional)' } 
            }, 
            required: ['pageId', 'message', 'scheduledTime'] 
          }
        },
        { 
          name: 'get_scheduled_posts', 
          description: 'SCHEDULE MANAGER: Shows all posts scheduled for future publication with times and content. INTELLIGENCE: Use to manage content calendar, avoid conflicts, ensure consistent messaging across time zones. AUTOMATION: Essential for content calendar management.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              pageId: { type: 'string', description: 'Facebook page ID to check scheduled posts' } 
            }, 
            required: ['pageId'] 
          }
        },
        { 
          name: 'publish_scheduled_post', 
          description: 'IMMEDIATE PUBLISHER: Immediately publishes previously scheduled post, overriding scheduled time. INTELLIGENCE: Useful for time-sensitive content or when optimal posting windows change. AUTOMATION: Perfect for dynamic content timing adjustments.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              postId: { type: 'string', description: 'Scheduled post ID to publish immediately' } 
            }, 
            required: ['postId'] 
          }
        },
        { 
          name: 'cancel_scheduled_post', 
          description: 'SCHEDULE CANCELER: Cancels scheduled post before publication. INTELLIGENCE: Use when content becomes irrelevant, needs major revisions, or timing is no longer appropriate. AUTOMATION: Perfect for dynamic content management.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              postId: { type: 'string', description: 'Scheduled post ID to cancel' } 
            }, 
            required: ['postId'] 
          }
        },
        { 
          name: 'get_page_videos', 
          description: 'VIDEO INVENTORY: Retrieves all videos uploaded to Facebook page with view counts, engagement metrics, performance data. INTELLIGENCE: Video content typically has higher engagement rates and can be used in video ads. AUTOMATION: Essential for video content analysis.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              pageId: { type: 'string', description: 'Facebook page ID' }, 
              limit: { type: 'number', default: 25, description: 'Maximum videos to retrieve' } 
            }, 
            required: ['pageId'] 
          }
        },
        { 
          name: 'upload_page_video', 
          description: 'VIDEO UPLOADER: Uploads video content to Facebook page for organic reach and potential ad promotion. INTELLIGENCE: Video ads typically have higher engagement rates than image ads. AUTOMATION: Perfect for video content distribution and ad creative preparation.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              pageId: { type: 'string', description: 'Facebook page ID' }, 
              videoUrl: { type: 'string', description: 'URL of video file to upload' }, 
              title: { type: 'string', description: 'Video title for discoverability' }, 
              description: { type: 'string', description: 'Video description and context' } 
            }, 
            required: ['pageId', 'videoUrl'] 
          }
        },
        { 
          name: 'get_page_events', 
          description: 'EVENT MANAGER: Retrieves Facebook events created by page. INTELLIGENCE: Events can be promoted through ads to increase attendance and engagement. AUTOMATION: Perfect for event-based marketing campaigns and attendance tracking.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              pageId: { type: 'string', description: 'Facebook page ID' }, 
              timeFilter: { type: 'string', enum: ['upcoming', 'past'], description: 'Filter by event timing' } 
            }, 
            required: ['pageId'] 
          }
        },
        { 
          name: 'create_page_event', 
          description: 'EVENT CREATOR: Creates Facebook events for page to promote webinars, sales, product launches, or physical events. INTELLIGENCE: Events can be promoted through ads to reach targeted audiences and increase attendance. AUTOMATION: Perfect for automated event marketing workflows.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              pageId: { type: 'string', description: 'Facebook page ID' }, 
              name: { type: 'string', description: 'Event name and title' }, 
              startTime: { type: 'string', description: 'Event start time (ISO format)' }, 
              endTime: { type: 'string', description: 'Event end time (ISO format)' }, 
              description: { type: 'string', description: 'Event description and details' }, 
              location: { type: 'string', description: 'Event location or online details' } 
            }, 
            required: ['pageId', 'name', 'startTime'] 
          }
        },
        { 
          name: 'update_page_event', 
          description: 'EVENT EDITOR: Modifies existing Facebook events to update details, change timing, or add information. INTELLIGENCE: Important for keeping event information current and managing attendee expectations. AUTOMATION: Perfect for dynamic event management.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              eventId: { type: 'string', description: 'Event ID to update' }, 
              name: { type: 'string', description: 'New event name (optional)' }, 
              startTime: { type: 'string', description: 'New start time (optional)' }, 
              endTime: { type: 'string', description: 'New end time (optional)' }, 
              description: { type: 'string', description: 'New description (optional)' } 
            }, 
            required: ['eventId'] 
          }
        },
        { 
          name: 'delete_page_event', 
          description: 'EVENT REMOVER: Removes Facebook events that are cancelled or no longer relevant. INTELLIGENCE: Consider impact on attendees and provide alternative communication before deletion. AUTOMATION: Use for event cleanup and management.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              eventId: { type: 'string', description: 'Event ID to delete permanently' } 
            }, 
            required: ['eventId'] 
          }
        },
        { 
          name: 'get_page_fan_count', 
          description: 'FOLLOWER COUNTER: Retrieves total follower/fan count for Facebook page. INTELLIGENCE: This metric indicates page popularity and potential organic reach. Higher follower counts can improve ad social proof and credibility. AUTOMATION: Perfect for growth tracking and social proof metrics.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              pageId: { type: 'string', description: 'Facebook page ID to count followers' } 
            }, 
            required: ['pageId'] 
          }
        },
        
        // ============= COMMENT AND ENGAGEMENT MANAGEMENT =============
        { 
          name: 'reply_to_comment', 
          description: 'COMMENT RESPONDER: Responds to specific comments on posts to increase engagement and build community. INTELLIGENCE: Quick responses improve customer satisfaction and show active page management, boosting organic reach. AUTOMATION: Perfect for customer service automation and community building.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              commentId: { type: 'string', description: 'Comment ID to reply to' }, 
              message: { type: 'string', description: 'Reply message content' } 
            }, 
            required: ['commentId', 'message'] 
          }
        },
        { 
          name: 'get_post_comments', 
          description: 'COMMENT EXTRACTOR: Retrieves all comments on specific post with commenter information and engagement data. INTELLIGENCE: Essential for community management, customer service, identifying brand advocates or detractors. AUTOMATION: Perfect for sentiment analysis and engagement monitoring.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              postId: { type: 'string', description: 'Post ID to get comments from' }, 
              limit: { type: 'number', default: 25, description: 'Maximum comments to retrieve' } 
            }, 
            required: ['postId'] 
          }
        },
        { 
          name: 'delete_comment', 
          description: 'COMMENT MODERATOR: Removes inappropriate, spam, or negative comments from posts. INTELLIGENCE: Use carefully to maintain authentic engagement while protecting brand reputation. RECOMMENDATION: Consider responding first before deletion.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              commentId: { type: 'string', description: 'Comment ID to delete permanently' } 
            }, 
            required: ['commentId'] 
          }
        },
        { 
          name: 'delete_comment_from_post', 
          description: 'POST COMMENT REMOVER: Alternative method to remove comments from posts. INTELLIGENCE: Same functionality as delete_comment but with different parameter structure for specific use cases. AUTOMATION: Use for bulk comment moderation workflows.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              commentId: { type: 'string', description: 'Comment ID to remove from post' } 
            }, 
            required: ['commentId'] 
          }
        },
        { 
          name: 'filter_negative_comments', 
          description: 'SENTIMENT FILTER: Automatically identifies and filters comments containing negative sentiment keywords. INTELLIGENCE: Helps manage brand reputation by flagging potentially harmful comments for review or removal. AUTOMATION: Perfect for automated reputation management.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              postId: { type: 'string', description: 'Post ID to filter comments' }, 
              keywords: { type: 'array', items: { type: 'string' }, description: 'Negative keywords to filter' } 
            }, 
            required: ['postId'] 
          }
        },
        { 
          name: 'get_number_of_comments', 
          description: 'COMMENT COUNTER: Counts total comments on post. INTELLIGENCE: High comment counts indicate strong engagement and can inform content strategy. AUTOMATION: Use to identify most engaging content types and optimize content strategy.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              postId: { type: 'string', description: 'Post ID to count comments' } 
            }, 
            required: ['postId'] 
          }
        },
        { 
          name: 'get_number_of_likes', 
          description: 'LIKE COUNTER: Counts total likes/reactions on post. INTELLIGENCE: Primary engagement metric for content performance. Higher like counts improve organic reach and indicate content resonance. AUTOMATION: Essential for content performance tracking.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              postId: { type: 'string', description: 'Post ID to count likes' } 
            }, 
            required: ['postId'] 
          }
        },
        { 
          name: 'get_post_impressions', 
          description: 'IMPRESSION TRACKER: Shows how many times post was displayed in news feeds, regardless of clicks. INTELLIGENCE: High impressions with low engagement may indicate poor content quality or targeting issues. AUTOMATION: Perfect for reach analysis and content optimization.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              postId: { type: 'string', description: 'Post ID to track impressions' } 
            }, 
            required: ['postId'] 
          }
        },
        { 
          name: 'get_post_impressions_unique', 
          description: 'UNIQUE REACH TRACKER: Shows how many unique users saw post, avoiding duplicate counts. INTELLIGENCE: More accurate measure of actual reach than total impressions. Critical for understanding true audience size and content effectiveness.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              postId: { type: 'string', description: 'Post ID to track unique impressions' } 
            }, 
            required: ['postId'] 
          }
        },
        { 
          name: 'get_post_impressions_paid', 
          description: 'PAID REACH TRACKER: Shows impressions generated through paid promotion or ads. INTELLIGENCE: Helps distinguish between organic and paid reach to measure effectiveness of promoted posts and ad spend. AUTOMATION: Essential for paid content ROI analysis.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              postId: { type: 'string', description: 'Post ID to track paid impressions' } 
            }, 
            required: ['postId'] 
          }
        },
        { 
          name: 'get_post_impressions_organic', 
          description: 'ORGANIC REACH TRACKER: Shows impressions from organic reach without paid promotion. INTELLIGENCE: Indicates natural content performance and audience engagement. Declining organic reach may signal need for better content or paid promotion.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              postId: { type: 'string', description: 'Post ID to track organic impressions' } 
            }, 
            required: ['postId'] 
          }
        },
        { 
          name: 'get_post_engaged_users', 
          description: 'ENGAGEMENT TRACKER: Counts unique users who interacted with post through likes, comments, shares, or clicks. INTELLIGENCE: More meaningful than impression counts as it shows actual audience engagement and interest. AUTOMATION: Perfect for engagement analysis.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              postId: { type: 'string', description: 'Post ID to track engaged users' } 
            }, 
            required: ['postId'] 
          }
        },
        { 
          name: 'get_post_clicks', 
          description: 'CLICK TRACKER: Tracks all clicks on post including link clicks, photo views, profile clicks. INTELLIGENCE: High click-through rates indicate compelling content and effective call-to-actions. AUTOMATION: Essential for content effectiveness measurement.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              postId: { type: 'string', description: 'Post ID to track clicks' } 
            }, 
            required: ['postId'] 
          }
        },
        { 
          name: 'get_post_reactions_like_total', 
          description: 'LIKE REACTION COUNTER: Counts specifically "Like" reactions (not other reactions like Love, Haha, etc.). INTELLIGENCE: Useful for detailed sentiment analysis and understanding audience emotional response to content. AUTOMATION: Perfect for sentiment tracking.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              postId: { type: 'string', description: 'Post ID to count Like reactions' } 
            }, 
            required: ['postId'] 
          }
        },
        { 
          name: 'get_post_top_commenters', 
          description: 'COMMUNITY IDENTIFIER: Identifies users who comment most frequently on posts. INTELLIGENCE: These are often most engaged followers and potential brand advocates. AUTOMATION: Great for building community relationships and identifying influencers.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              postId: { type: 'string', description: 'Post ID to find top commenters' }, 
              limit: { type: 'number', default: 10, description: 'Number of top commenters to return' } 
            }, 
            required: ['postId'] 
          }
        },
        { 
          name: 'post_image_to_facebook', 
          description: 'IMAGE PUBLISHER: Uploads and publishes images directly to Facebook page with captions. INTELLIGENCE: High-quality visual content typically generates more engagement than text-only posts. AUTOMATION: Essential for visual marketing strategies and content automation.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              pageId: { type: 'string', description: 'Facebook page ID' }, 
              imageUrl: { type: 'string', description: 'URL of image to post' }, 
              caption: { type: 'string', description: 'Image caption and description' } 
            }, 
            required: ['pageId', 'imageUrl'] 
          }
        },
        { 
          name: 'get_post_share_count', 
          description: 'SHARE TRACKER: Counts how many times post was shared by users. INTELLIGENCE: Shares indicate high-value content and exponentially increase reach through user networks. Most valuable engagement metric for viral potential. AUTOMATION: Perfect for viral content identification.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              postId: { type: 'string', description: 'Post ID to count shares' } 
            }, 
            required: ['postId'] 
          }
        },
        { 
          name: 'send_dm_to_user', 
          description: 'DIRECT MESSENGER: Sends direct messages to users for customer service, follow-up, or personalized communication. INTELLIGENCE: Useful for lead nurturing and customer support. PREREQUISITE: Requires proper permissions and user consent. AUTOMATION: Perfect for customer service workflows.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              pageId: { type: 'string', description: 'Facebook page ID' }, 
              recipientId: { type: 'string', description: 'User ID to send message to' }, 
              message: { type: 'string', description: 'Message content' } 
            }, 
            required: ['pageId', 'recipientId', 'message'] 
          }
        },
        
        // ============= CRON JOB AUTOMATION TOOLS =============
        { 
          name: 'create_cron_job', 
          description: 'AUTOMATION SCHEDULER: Creates automated scheduled tasks using cron-job.org service for regular campaign monitoring, reporting, or maintenance. INTELLIGENCE: Set up automatic bid adjustments, daily reports, performance alerts. AUTOMATION: Perfect for hands-off campaign management. TIMEZONE: Supports Malaysia timezone for local business operations.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              apiKey: { type: 'string', description: 'Cron-job.org API key for authentication' }, 
              title: { type: 'string', description: 'Descriptive job title' }, 
              url: { type: 'string', description: 'URL endpoint to call' }, 
              schedule: { 
                type: 'object', 
                properties: { 
                  minutes: { type: 'array', items: { type: 'number' }, description: 'Minutes array (0-59)' }, 
                  hours: { type: 'array', items: { type: 'number' }, description: 'Hours array (0-23)' } 
                }, 
                description: 'Cron schedule configuration' 
              }, 
              requestMethod: { type: 'number', description: '0=GET request, 1=POST request' }, 
              postData: { type: 'string', description: 'POST data if method is POST' } 
            }, 
            required: ['apiKey', 'title', 'url'] 
          }
        },
        { 
          name: 'get_cron_job_details', 
          description: 'JOB INSPECTOR: Retrieves configuration and status of specific cron job including schedule, last execution, success rate, error logs. INTELLIGENCE: Use to monitor automation health and troubleshoot failed executions. AUTOMATION: Essential for automation reliability monitoring.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              apiKey: { type: 'string', description: 'Cron-job.org API key' }, 
              jobId: { type: 'number', description: 'Cron job ID to inspect' } 
            }, 
            required: ['apiKey', 'jobId'] 
          }
        },
        { 
          name: 'update_cron_job', 
          description: 'JOB MODIFIER: Modifies existing cron job schedule, URL, or parameters. INTELLIGENCE: Use to adjust automation frequency, update endpoints, change execution parameters based on business needs or performance requirements. AUTOMATION: Perfect for dynamic automation management.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              apiKey: { type: 'string', description: 'Cron-job.org API key' }, 
              jobId: { type: 'number', description: 'Job ID to update' }, 
              title: { type: 'string', description: 'New job title (optional)' }, 
              url: { type: 'string', description: 'New URL endpoint (optional)' }, 
              schedule: { type: 'object', description: 'New schedule configuration (optional)' } 
            }, 
            required: ['apiKey', 'jobId'] 
          }
        },
        { 
          name: 'delete_cron_job', 
          description: 'JOB REMOVER: Removes automated cron jobs that are no longer needed or causing issues. INTELLIGENCE: Clean up obsolete automation to reduce API calls and maintain system efficiency. AUTOMATION: Use for automation lifecycle management.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              apiKey: { type: 'string', description: 'Cron-job.org API key' }, 
              jobId: { type: 'number', description: 'Job ID to delete permanently' } 
            }, 
            required: ['apiKey', 'jobId'] 
          }
        },
        { 
          name: 'get_cron_job_history', 
          description: 'EXECUTION TRACKER: Shows execution history of cron jobs including success/failure rates, response times, error messages. INTELLIGENCE: Essential for monitoring automation reliability and identifying patterns in failures. AUTOMATION: Perfect for automation performance analysis.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              apiKey: { type: 'string', description: 'Cron-job.org API key' }, 
              jobId: { type: 'number', description: 'Job ID to get history' }, 
              limit: { type: 'number', description: 'Number of history records', default: 25 } 
            }, 
            required: ['apiKey', 'jobId'] 
          }
        },
        { 
          name: 'get_cron_job_history_details', 
          description: 'EXECUTION ANALYZER: Retrieves detailed information about specific cron job execution including request/response data, execution time, error details. INTELLIGENCE: Use for debugging failed automations and optimizing performance. AUTOMATION: Essential for automation troubleshooting.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              apiKey: { type: 'string', description: 'Cron-job.org API key' }, 
              jobId: { type: 'number', description: 'Job ID' }, 
              identifier: { type: 'string', description: 'Specific execution identifier' } 
            }, 
            required: ['apiKey', 'jobId', 'identifier'] 
          }
        },
        { 
          name: 'list_cron_jobs', 
          description: 'JOB INVENTORY: Lists all active cron jobs in account with schedules, status, last execution times. INTELLIGENCE: Use to manage automation portfolio and ensure no conflicts or duplicates exist. AUTOMATION: Essential for automation portfolio management.',
          inputSchema: { 
            type: 'object', 
            properties: { 
              apiKey: { type: 'string', description: 'Cron-job.org API key for account access' } 
            }, 
            required: ['apiKey'] 
          }
        }
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
    console.log('[DIAGNOSTIC] Session retrieved for user:', userId, 'Has session:', !!session);
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
    console.log('[DIAGNOSTIC] Session retrieved for user:', userId, 'Has session:', !!session);
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
                { name: 'check_ad_id', description: 'Check ad details and hierarchy by ad ID', inputSchema: { type: 'object', properties: { adId: { type: 'string', description: 'Facebook ad ID to check' } }, required: ['adId'] } },
                { name: 'get_leads_data', description: 'Get leads data from Laravel app', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } },
                { name: 'get_leads_with_insights', description: 'Get leads data with Facebook ad insights and ROI metrics', inputSchema: { type: 'object', properties: { staffId: { type: 'string', description: 'Staff ID (e.g., RV-007)' }, startDate: { type: 'string', description: 'Start date in DD-MM-YYYY format' }, endDate: { type: 'string', description: 'End date in DD-MM-YYYY format' } }, required: ['staffId', 'startDate', 'endDate'] } },
                { name: 'get_lead_report', description: 'Get ad performance report for multiple users and ads with spend, impressions, clicks, CPM, CTR metrics', inputSchema: { type: 'object', properties: { adDataArray: { type: 'array', description: 'Array of user ad data', items: { type: 'object', properties: { user_id: { type: 'string', description: 'User ID' }, date: { type: 'string', description: 'Date in DD-MM-YYYY format' }, ads: { type: 'array', description: 'Array of ads', items: { type: 'object', properties: { ad_id: { type: 'string', description: 'Facebook Ad ID' } }, required: ['ad_id'] } } }, required: ['user_id', 'date', 'ads'] } } }, required: ['adDataArray'] } },
                { name: 'get_audiences', description: 'Lists available custom audiences', inputSchema: { type: 'object', properties: { limit: { type: 'number', default: 25 } } } },
                { name: 'create_custom_audience', description: 'Creates a custom audience', inputSchema: { type: 'object', properties: { name: { type: 'string' }, type: { type: 'string', enum: ['CUSTOM', 'WEBSITE', 'ENGAGEMENT'] }, description: { type: 'string' } }, required: ['name', 'type'] } },
                { name: 'get_facebook_pages', description: 'Get Facebook pages with permissions', inputSchema: { type: 'object', properties: {} } },
                { name: 'generate_campaign_prompt', description: 'Generates campaign creation prompts', inputSchema: { type: 'object', properties: { objective: { type: 'string' }, industry: { type: 'string' }, target_audience: { type: 'string' } }, required: ['objective'] } },
                // Facebook Ads Library Tools
                { name: 'get_meta_platform_id', description: 'Get Meta Platform ID for a brand', inputSchema: { type: 'object', properties: { brandNames: { type: 'string', description: 'Brand name or array of brand names' } }, required: ['brandNames'] } },
                { name: 'get_meta_ads', description: 'Get ads from Meta Ads Library for a specific page', inputSchema: { type: 'object', properties: { platformId: { type: 'string' }, adType: { type: 'string', enum: ['POLITICAL_AND_ISSUE_ADS', 'ALL'] }, adActiveStatus: { type: 'string', enum: ['ALL', 'ACTIVE', 'INACTIVE'] }, limit: { type: 'number', default: 25 }, searchTerms: { type: 'string' }, adReachedCountries: { type: 'array', items: { type: 'string' } }, adDeliveryDateMin: { type: 'string' }, adDeliveryDateMax: { type: 'string' } }, required: ['platformId'] } },
                { name: 'search_ads_library', description: 'Search ads across multiple advertisers', inputSchema: { type: 'object', properties: { searchQuery: { type: 'string' }, countries: { type: 'array', items: { type: 'string' } }, adType: { type: 'string', enum: ['POLITICAL_AND_ISSUE_ADS', 'ALL'] }, limit: { type: 'number', default: 25 } }, required: ['searchQuery'] } },
                { name: 'get_competitor_ads_analysis', description: 'Get competitor analysis', inputSchema: { type: 'object', properties: { competitorPageIds: { type: 'array', items: { type: 'string' } }, dateRange: { type: 'number', default: 30 } }, required: ['competitorPageIds'] } },
                // Page Management Tools
                { name: 'get_page_details', description: 'Get detailed information about a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' } }, required: ['pageId'] } },
                { name: 'create_page_post', description: 'Create a new post on a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, message: { type: 'string' }, link: { type: 'string' }, published: { type: 'boolean', default: true } }, required: ['pageId', 'message'] } },
                { name: 'update_page_post', description: 'Update an existing Facebook page post', inputSchema: { type: 'object', properties: { postId: { type: 'string' }, message: { type: 'string' } }, required: ['postId', 'message'] } },
                { name: 'delete_page_post', description: 'Delete a post from a Facebook page', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } },
                { name: 'get_page_posts', description: 'Get posts from a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, limit: { type: 'number', default: 25 } }, required: ['pageId'] } },
                { name: 'get_page_insights', description: 'Get insights and analytics for a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, metrics: { type: 'array', items: { type: 'string' } }, period: { type: 'string', enum: ['day', 'week', 'days_28', 'month', 'lifetime'] } }, required: ['pageId'] } },
                { name: 'schedule_page_post', description: 'Schedule a post for future publishing', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, message: { type: 'string' }, scheduledTime: { type: 'string' }, link: { type: 'string' } }, required: ['pageId', 'message', 'scheduledTime'] } },
                { name: 'get_scheduled_posts', description: 'Get all scheduled posts for a page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' } }, required: ['pageId'] } },
                { name: 'publish_scheduled_post', description: 'Publish a scheduled post immediately', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } },
                { name: 'cancel_scheduled_post', description: 'Cancel a scheduled post', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } },
                { name: 'get_page_videos', description: 'Get videos from a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, limit: { type: 'number', default: 25 } }, required: ['pageId'] } },
                { name: 'upload_page_video', description: 'Upload a video to a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, videoUrl: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' } }, required: ['pageId', 'videoUrl'] } },
                { name: 'get_page_events', description: 'Get events from a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, timeFilter: { type: 'string', enum: ['upcoming', 'past'] } }, required: ['pageId'] } },
                { name: 'create_page_event', description: 'Create an event on a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, name: { type: 'string' }, startTime: { type: 'string' }, endTime: { type: 'string' }, description: { type: 'string' }, location: { type: 'string' } }, required: ['pageId', 'name', 'startTime'] } },
                { name: 'update_page_event', description: 'Update an existing page event', inputSchema: { type: 'object', properties: { eventId: { type: 'string' }, name: { type: 'string' }, startTime: { type: 'string' }, endTime: { type: 'string' }, description: { type: 'string' } }, required: ['eventId'] } },
                { name: 'delete_page_event', description: 'Delete an event from a Facebook page', inputSchema: { type: 'object', properties: { eventId: { type: 'string' } }, required: ['eventId'] } },
                { name: 'get_page_fan_count', description: 'Get the total fan/follower count for a page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' } }, required: ['pageId'] } },
                // Cron Job Tools
                { name: 'create_cron_job', description: 'Create a new cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, title: { type: 'string', description: 'Job title' }, url: { type: 'string', description: 'URL to call' }, schedule: { type: 'object', properties: { minutes: { type: 'array', items: { type: 'number' }, description: 'Minutes (0-59)' }, hours: { type: 'array', items: { type: 'number' }, description: 'Hours (0-23)' } } }, requestMethod: { type: 'number', description: '0=GET, 1=POST' }, postData: { type: 'string', description: 'POST data if method is POST' } }, required: ['apiKey', 'title', 'url'] } },
                { name: 'get_cron_job_details', description: 'Get cron job details', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' } }, required: ['apiKey', 'jobId'] } },
                { name: 'update_cron_job', description: 'Update an existing cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, title: { type: 'string', description: 'New title' }, url: { type: 'string', description: 'New URL' }, schedule: { type: 'object', description: 'New schedule' } }, required: ['apiKey', 'jobId'] } },
                { name: 'delete_cron_job', description: 'Delete a cron job', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' } }, required: ['apiKey', 'jobId'] } },
                { name: 'get_cron_job_history', description: 'Get cron job execution history', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, limit: { type: 'number', description: 'Number of records to fetch', default: 25 } }, required: ['apiKey', 'jobId'] } },
                { name: 'get_cron_job_history_details', description: 'Get specific execution details', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' }, jobId: { type: 'number', description: 'Job ID' }, identifier: { type: 'string', description: 'Execution identifier' } }, required: ['apiKey', 'jobId', 'identifier'] } },
                { name: 'list_cron_jobs', description: 'List all cron jobs', inputSchema: { type: 'object', properties: { apiKey: { type: 'string', description: 'Cron-job.org API key' } }, required: ['apiKey'] } },
                // Account Insights Tools
                { name: 'get_account_insights', description: 'Get insights for a single ad account', inputSchema: { type: 'object', properties: { accountId: { type: 'string', description: 'Facebook Ad Account ID (e.g., act_123456)' }, dateRange: { type: 'string', description: 'Date range preset or custom range (e.g., "2025-06-01,2025-06-21")', default: 'today' } }, required: ['accountId'] } },
                { name: 'get_total_spend_all_accounts', description: 'Get total spend across all ad accounts', inputSchema: { type: 'object', properties: { dateRange: { type: 'string', description: 'Date range preset', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'], default: 'today' } } } },
                { name: 'get_spend_by_campaign', description: 'Get spend breakdown by campaign across all accounts', inputSchema: { type: 'object', properties: { dateRange: { type: 'string', description: 'Date range preset', enum: ['today', 'yesterday', 'last_7_days', 'last_30_days'], default: 'today' } } } }
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
    console.log('[DIAGNOSTIC] Session retrieved for user:', userId, 'Has session:', !!session);
    if (!session) {
      return { success: false, error: 'Invalid session' };
    }

    // Use proper Facebook Pages API endpoint from documentation: /me/accounts  
    // Use SDK to get Facebook pages
    const { User } = require('facebook-nodejs-business-sdk');
    const user = new User('me');
    // Ensure SDK is initialized before making the call
          if (!session?.credentials?.facebookAccessToken) {
            throw new Error('No Facebook access token available');
          }
          
          const { FacebookAdsApi } = require('facebook-nodejs-business-sdk');
          FacebookAdsApi.init(session.credentials.facebookAccessToken);
          
          const pagesData = await user.getAccounts(['id', 'name', 'access_token', 'category', 'category_list', 'tasks', 'about', 'website', 'emails']);
    
    if (pagesData.error) {
      return {
        success: false,
        error: `Facebook Pages API Error (${pagesData.error.code}): ${pagesData.error.message}`,
        details: 'Ensure your access token has pages_show_list permission'
      };
    }

    // Enhanced page information with full Facebook Pages API data
    const enhancedPages = (Array.isArray(pagesData) ? pagesData : pagesData.data || []).map((page: any) => ({
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


// Helper function to ensure Facebook SDK is properly initialized
function ensureFacebookSDKInitialized(session: any): boolean {
    console.log('[DIAGNOSTIC] ensureFacebookSDKInitialized called');
    console.log('[DIAGNOSTIC] Session param:', !!session);
    console.log('[DIAGNOSTIC] Token exists:', !!session?.credentials?.facebookAccessToken);
  if (!session?.credentials?.facebookAccessToken) {
    return false;
  }
  
  try {
    const { FacebookAdsApi } = require('facebook-nodejs-business-sdk');
    FacebookAdsApi.init(session.credentials.facebookAccessToken);
    return true;
  } catch (error) {
    console.error('Failed to initialize Facebook SDK:', error);
    return false;
  }
}

async function processMcpToolCall(toolName: string, args: any, userId: string): Promise<any> {
  const session = userSessionManager.getSession(userId);
    console.log('[DIAGNOSTIC] Session retrieved for user:', userId, 'Has session:', !!session);
  if (!session) {
    throw new Error('Invalid session');
  }

  // Initialize Facebook API with user's credentials
  const FacebookAdsApi = require('facebook-nodejs-business-sdk').FacebookAdsApi;
  const Campaign = require('facebook-nodejs-business-sdk').Campaign;
  const AdAccount = require('facebook-nodejs-business-sdk').AdAccount;
  
  // Diagnostic: Log token status
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
    }

  try {
    switch (toolName) {
            case 'get_ad_accounts':
        try {
          // Use Facebook SDK instead of fetch - fixes Railway deployment issue
          const User = require('facebook-nodejs-business-sdk').User;
          
          // Ensure we have a valid token
          if (!session.credentials?.facebookAccessToken) {
            return {
              success: false,
              error: 'No Facebook access token found. Please re-authenticate.',
              tool: 'get_ad_accounts'
            };
          }
          
          // Re-initialize SDK to ensure it's using the latest token
          FacebookAdsApi.init(session.credentials.facebookAccessToken);
          
          // Get user's ad accounts using SDK
          const user = new User('me');
          const fields = ['id', 'name', 'account_status', 'currency', 'timezone_name'];
          const params = { limit: 100 };
          
          let accountsResponse;
          try {
            accountsResponse = await user.getAdAccounts(fields, params);
          } catch (fbError: any) {
            console.error('Facebook SDK error:', fbError);
            if (fbError.response?.error?.message) {
              return {
                success: false,
                error: `Facebook API Error: ${fbError.response.error.message}`,
                tool: 'get_ad_accounts'
              };
            }
            throw fbError;
          }
          
          // Convert to array if needed
          const accountsArray = Array.isArray(accountsResponse) ? accountsResponse : accountsResponse.data || [];
          
          if (accountsArray.length === 0) {
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

          const accounts = accountsArray.map((account: any) => ({
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
        } catch (error: any) {
          console.error('Error in get_ad_accounts:', error);
          
          let errorMessage = 'Error fetching ad accounts: ';
          
          if (error.response?.error?.message) {
            errorMessage = `Facebook API Error: ${error.response.error.message}`;
          } else if (error.message?.includes('ECONNRESET') || error.code === 'ECONNRESET') {
            errorMessage = 'Connection to Facebook was reset. Please try again.';
          } else if (error.message === 'Facebook API call failed. This usually indicates an expired token or network issue') {
            errorMessage = 'Facebook API timeout. Please check your internet connection and try again.';
          } else if (error.message) {
            errorMessage += error.message;
          } else {
            errorMessage += 'Unknown error occurred';
          }
          
          return {
            success: false,
            error: errorMessage,
            tool: 'get_ad_accounts'
          };
        }
        
      case 'get_campaigns':
        try {
          if (!ensureFacebookSDKInitialized(session)) {
            return {
              success: false,
              error: 'Facebook SDK initialization failed. Please re-authenticate.',
              tool: 'get_campaigns'
            };
          }
          
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
          // Get ALL user's ad accounts using SDK
          const { User } = require('facebook-nodejs-business-sdk');
          const user = new User('me');
          const accountsData = await user.getAdAccounts(['id', 'name', 'account_status', 'currency', 'timezone_name']);
          
          if (accountsData.error) {
            return {
              success: false,
              error: `Facebook API Error: ${accountsData.error.message}`,
              tool: 'get_campaigns'
            };
          }

          const accounts = Array.isArray(accountsData) ? accountsData : (accountsData.data || []);
          
          if (!accounts || accounts.length === 0) {
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
          let accountsToProcess = accounts;
          
          if (targetAccountId) {
            accountsToProcess = accounts.filter((acc: any) => acc.id === targetAccountId);
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
              // Use SDK to get campaigns
              const { AdAccount } = require('facebook-nodejs-business-sdk');
              const adAccount = new AdAccount(account.id);
              const campaignsData = await adAccount.getCampaigns(['id', 'name', 'objective', 'status', 'created_time', 'account_id'], { 
                limit: args.limit || 25 
              });

              if (campaignsData && campaignsData.length > 0) {
                // Add account info to each campaign
                const campaignsWithAccount = campaignsData.map((campaign: any) => ({
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
          // Validate objective
          if (!VALID_CAMPAIGN_OBJECTIVES.includes(args.objective)) {
            return {
              success: false,
              error: `Invalid objective. Valid options are: ${VALID_CAMPAIGN_OBJECTIVES.join(', ')}`,
              tool: 'create_campaign'
            };
          }
          // Use the selected ad account instead of getting all accounts
          const adAccount = getAdAccountForUser(userId);
          if (!adAccount) {
            return {
              success: false,
              error: 'No ad account selected. Use select_ad_account first.',
              tool: 'create_campaign'
            };
          }

          // Get the account ID from the session
          const session = userSessionManager.getSession(userId);
    console.log('[DIAGNOSTIC] Session retrieved for user:', userId, 'Has session:', !!session);
          const adAccountId = session?.credentials?.selectedAccountId;
          
          // Create campaign using SDK
          const campaignData = {
            name: args.name,
            objective: args.objective || 'OUTCOME_LEADS',
            status: args.status || 'PAUSED',
            special_ad_categories: [] // Required by Facebook for compliance
          };

          const result = await adAccount.createCampaign(['id', 'name', 'objective', 'status'], campaignData);

          // Get the campaign data from the SDK result
          const campaignResult = await result.get(['id', 'name', 'objective', 'status', 'created_time']);

          if (campaignResult.error) {
            return {
              success: false,
              error: `Facebook API Error: ${campaignResult.error.message}`,
              tool: 'create_campaign'
            };
          }

          return {
            success: true,
            tool: 'create_campaign',
            result: {
              id: campaignResult.id,
              name: campaignResult.name,
              objective: campaignResult.objective,
              status: campaignResult.status,
              created_time: campaignResult.created_time || new Date().toISOString()
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
          // Use SDK to get campaign details
          const { Campaign } = require('facebook-nodejs-business-sdk');
          const campaign = new Campaign(args.campaignId);
          const campaignData = await campaign.get(['id', 'name', 'objective', 'status', 'created_time', 'updated_time']);

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

          // Get campaign details to determine proper optimization goal using SDK
          const { Campaign } = require('facebook-nodejs-business-sdk');
          const campaign = new Campaign(campaignId);
          const campaignData = await campaign.get(['objective']);
          
          if (campaignData.error) {
            return {
              success: false,
              error: `Cannot get campaign objective: ${campaignData.error.message}`,
              tool: 'create_ad_set'
            };
          }

          // Use helper function to get optimization goal and billing event
          const { optimizationGoal, billingEvent } = getOptimizationGoalForObjective(campaignData.objective);

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
                campaignObjective: campaignData.objective,
                optimizationGoal: optimizationGoal,
                billingEvent: billingEvent,
                budgetMYR: budget,
                budgetCents: params.daily_budget
              },
              message: `Ad Set created successfully for ${campaignData.objective} campaign with ${optimizationGoal} optimization`
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
    console.log('[DIAGNOSTIC] Session retrieved for user:', userId, 'Has session:', !!session);
          if (!session) {
            return {
              success: false,
              error: 'User session not found or expired',
              tool: 'duplicate_ad_set'
            };
          }

          // Get original ad set details first to modify targeting using SDK
          const { AdSet } = require('facebook-nodejs-business-sdk');
          const originalAdSetObj = new AdSet(adSetId);
          const originalAdSet = await originalAdSetObj.get(['targeting']);
          
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

          // Convert params to object for SDK call
          const copyParams: any = {
            name: newName || 'Ad Set Copy',
            deep_copy: true,
            status_option: 'PAUSED'
          };
          
          // Add targeting modification if original has targeting
          if (originalAdSet.targeting) {
            const modifiedTargeting = {
              ...originalAdSet.targeting,
              targeting_automation: {
                advantage_audience: 0  // Explicitly disable
              }
            };
            copyParams.targeting = JSON.stringify(modifiedTargeting);
          }

          const result = await FacebookAdsApi.getDefaultApi().call('POST', [adSetId, 'copies'], copyParams);

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
    console.log('[DIAGNOSTIC] Session retrieved for user:', userId, 'Has session:', !!session);
          if (!session) {
            return {
              success: false,
              error: 'User session not found or expired',
              tool: 'create_ad'
            };
          }

          // Use SDK to create ad
          const adData = {
            name: name,
            adset_id: adSetId,
            creative: { creative_id: creativeId },
            status: 'PAUSED'
          };

          const result = await adAccount.createAd(['id', 'name', 'status'], adData);

          // Get the ad data from SDK result
          const adResult = await result.get(['id', 'name', 'status']);

          if (adResult.error) {
            return {
              success: false,
              error: `Facebook API Error: ${adResult.error.message}`,
              tool: 'create_ad',
              details: adResult.error
            };
          }

          return {
            success: true,
            tool: 'create_ad',
            result: {
              adId: adResult.id,
              name: adResult.name,
              status: adResult.status,
              adSetId: adSetId,
              creativeId: creativeId,
              message: 'Ad created successfully using SDK'
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
    console.log('[DIAGNOSTIC] Session retrieved for user:', userId, 'Has session:', !!session);
          if (!session) {
            return {
              success: false,
              error: 'User session not found or expired',
              tool: 'duplicate_ad'
            };
          }

          // Get original ad details using SDK
          const { Ad } = require('facebook-nodejs-business-sdk');
          const originalAd = new Ad(adId);
          const originalData = await originalAd.get(['name', 'adset_id', 'creative']);

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

          // Use SDK to create duplicate ad
          const adData = {
            name: newName || `${originalData.name} - Copy`,
            adset_id: originalData.adset_id,
            creative: { creative_id: originalData.creative.id },
            status: 'PAUSED'
          };

          const result = await adAccount.createAd(['id', 'name', 'status'], adData);
          
          // Get the created ad data
          const adResult = await result.get(['id', 'name', 'status']);

          if (adResult.error) {
            return {
              success: false,
              error: `Facebook API Error: ${adResult.error.message}`,
              tool: 'duplicate_ad',
              details: adResult.error
            };
          }

          return {
            success: true,
            tool: 'duplicate_ad',
            result: {
              originalAdId: adId,
              newAdId: adResult.id,
              newAdName: adResult.name,
              adSetId: originalData.adset_id,
              message: 'Ad duplicated successfully using SDK'
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

      
      // Page Management Tools
      case 'post_to_facebook':
        try {
          const result = await pageTools.createPagePost(
            userId,
            args.pageId,
            args.message,
            args.link,
            args.published
          );
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'reply_to_comment':
        try {
          const result = await pageTools.replyToComment(userId, args.commentId, args.message);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_page_posts':
        try {
          const result = await pageTools.getPagePosts(userId, args.pageId, args.limit);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_post_comments':
        try {
          const result = await pageTools.getPostComments(userId, args.postId, args.limit);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'delete_post':
        try {
          const result = await pageTools.deletePagePost(userId, args.postId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'delete_comment':
        try {
          const result = await pageTools.deleteComment(userId, args.commentId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'filter_negative_comments':
        try {
          const result = await pageTools.filterNegativeComments(userId, args.postId, args.keywords);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_post_metrics':
        try {
          const result = await pageTools.getPageInsights(userId, args.postId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'post_image_to_facebook':
        try {
          const result = await pageTools.postImageToFacebook(userId, args.pageId, args.imageUrl, args.caption);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'update_post':
        try {
          const result = await pageTools.updatePagePost(userId, args.postId, args.message);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'schedule_post':
        try {
          const result = await pageTools.schedulePagePost(
            userId,
            args.pageId,
            args.message,
            args.scheduledTime,
            args.link
          );
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_page_fan_count':
        try {
          const result = await pageTools.getPageFanCount(userId, args.pageId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_post_top_commenters':
        try {
          const result = await pageTools.getPostTopCommenters(userId, args.postId, args.limit);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      // Additional Page Management Tools
      case 'get_page_details':
        try {
          // Get page details using Facebook API
          const { userSessionManager } = await import('./config.js');
          const session = userSessionManager.getSession(userId);
    console.log('[DIAGNOSTIC] Session retrieved for user:', userId, 'Has session:', !!session);
          if (!session) throw new Error('User session not found');
          
          // Use SDK to get page details
          const { Page } = require('facebook-nodejs-business-sdk');
          const page = new Page(args.pageId);
          const data = await page.get(['id', 'name', 'about', 'category', 'fan_count', 'website', 'phone', 'emails', 'location']);
          
          if (data.error) {
            return { success: false, error: data.error.message, tool: toolName };
          }
          
          return { success: true, page: data, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'create_page_post':
        try {
          const result = await pageTools.createPagePost(
            userId,
            args.pageId,
            args.message,
            args.link,
            args.published
          );
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'update_page_post':
        try {
          const result = await pageTools.updatePagePost(userId, args.postId, args.message);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'delete_page_post':
        try {
          const result = await pageTools.deletePagePost(userId, args.postId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'schedule_page_post':
        try {
          const result = await pageTools.schedulePagePost(
            userId,
            args.pageId,
            args.message,
            args.scheduledTime,
            args.link
          );
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      // These tools need custom implementation as they're not in page-tools.ts
      case 'get_page_insights':
        try {
          const { userSessionManager } = await import('./config.js');
          const session = userSessionManager.getSession(userId);
    console.log('[DIAGNOSTIC] Session retrieved for user:', userId, 'Has session:', !!session);
          if (!session) throw new Error('User session not found');
          
          // Get page access token
          const pagesResult = await getUserFacebookPages(userId);
          if (!pagesResult.success || !pagesResult.pages) {
            return { success: false, error: 'Failed to get Facebook pages', tool: toolName };
          }
          
          const page = pagesResult.pages.find((p: any) => p.id === args.pageId);
          if (!page || !page.access_token) {
            return { success: false, error: 'Page not found or no access token', tool: toolName };
          }
          
          const metrics = args.metrics || ['page_fans', 'page_fan_adds', 'page_fan_removes'];
          const period = args.period || 'day';
          
          // Use SDK to get page insights
          FacebookAdsApi.init(page.access_token);
          const { Page } = require('facebook-nodejs-business-sdk');
          const pageObj = new Page(args.pageId);
          const insights = await pageObj.getInsights(metrics, { period: period });
          
          if (insights.error) {
            return { success: false, error: insights.error.message, tool: toolName };
          }
          
          return { success: true, insights: insights, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_scheduled_posts':
        try {
          const result = await pageTools.getScheduledPosts(
            userId,
            args.pageId
          );
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'publish_scheduled_post':
        try {
          const { userSessionManager } = await import('./config.js');
          const session = userSessionManager.getSession(userId);
    console.log('[DIAGNOSTIC] Session retrieved for user:', userId, 'Has session:', !!session);
          if (!session) throw new Error('User session not found');
          
          // Extract page ID from post ID
          const pageId = args.postId.split('_')[0];
          
          // Get page access token
          const pagesResult = await getUserFacebookPages(userId);
          if (!pagesResult.success || !pagesResult.pages) {
            return { success: false, error: 'Failed to get Facebook pages', tool: toolName };
          }
          
          const page = pagesResult.pages.find((p: any) => p.id === pageId);
          if (!page || !page.access_token) {
            return { success: false, error: 'Page not found or no access token', tool: toolName };
          }
          
          const pageAccessToken = page.access_token;
          
          // Use SDK to publish scheduled post
          FacebookAdsApi.init(pageAccessToken);
          const result = await FacebookAdsApi.getDefaultApi().call('POST', [args.postId], {
            is_published: true
          });
          
          if (result.error) {
            return { success: false, error: result.error.message, tool: toolName };
          }
          
          return { 
            success: true, 
            message: 'Post published successfully',
            tool: toolName 
          };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'cancel_scheduled_post':
        try {
          const { userSessionManager } = await import('./config.js');
          const session = userSessionManager.getSession(userId);
    console.log('[DIAGNOSTIC] Session retrieved for user:', userId, 'Has session:', !!session);
          if (!session) throw new Error('User session not found');
          
          // Extract page ID from post ID
          const pageId = args.postId.split('_')[0];
          
          // Get page access token
          const pagesResult = await getUserFacebookPages(userId);
          if (!pagesResult.success || !pagesResult.pages) {
            return { success: false, error: 'Failed to get Facebook pages', tool: toolName };
          }
          
          const page = pagesResult.pages.find((p: any) => p.id === pageId);
          if (!page || !page.access_token) {
            return { success: false, error: 'Page not found or no access token', tool: toolName };
          }
          
          // Use SDK to delete the scheduled post
          FacebookAdsApi.init(page.access_token);
          const result = await FacebookAdsApi.getDefaultApi().call('DELETE', [args.postId]);
          
          if (result === true || result.success) {
            return { 
              success: true, 
              message: 'Scheduled post cancelled successfully',
              tool: toolName 
            };
          }
          
          return { 
            success: true, 
            message: 'Scheduled post cancelled',
            tool: toolName 
          };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_page_videos':
        try {
          const { userSessionManager } = await import('./config.js');
          const session = userSessionManager.getSession(userId);
    console.log('[DIAGNOSTIC] Session retrieved for user:', userId, 'Has session:', !!session);
          if (!session) throw new Error('User session not found');
          
          const limit = args.limit || 25;
          
          // Use SDK to get page videos
          const { Page } = require('facebook-nodejs-business-sdk');
          const page = new Page(args.pageId);
          const videos = await page.getVideos(['id', 'title', 'description', 'created_time', 'length'], { limit: limit });
          
          if (videos.error) {
            return { success: false, error: videos.error.message, tool: toolName };
          }
          
          return { success: true, videos: videos, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'upload_page_video':
        try {
          const { userSessionManager } = await import('./config.js');
          const session = userSessionManager.getSession(userId);
    console.log('[DIAGNOSTIC] Session retrieved for user:', userId, 'Has session:', !!session);
          if (!session) throw new Error('User session not found');
          
          // Get page access token
          const pagesResult = await getUserFacebookPages(userId);
          if (!pagesResult.success || !pagesResult.pages) {
            return { success: false, error: 'Failed to get Facebook pages', tool: toolName };
          }
          
          const page = pagesResult.pages.find((p: any) => p.id === args.pageId);
          if (!page || !page.access_token) {
            return { success: false, error: 'Page not found or no access token', tool: toolName };
          }
          
          // Use SDK to upload video
          FacebookAdsApi.init(page.access_token);
          const { Page } = require('facebook-nodejs-business-sdk');
          const pageObj = new Page(args.pageId);
          const result = await pageObj.createVideo(['id'], {
            file_url: args.videoUrl,
            title: args.title || 'Video',
            description: args.description || ''
          });
          
          if (result.error) {
            return { success: false, error: result.error.message, tool: toolName };
          }
          
          return { success: true, videoId: result.id, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_page_events':
        try {
          const { userSessionManager } = await import('./config.js');
          const session = userSessionManager.getSession(userId);
    console.log('[DIAGNOSTIC] Session retrieved for user:', userId, 'Has session:', !!session);
          if (!session) throw new Error('User session not found');
          
          const timeFilter = args.timeFilter || 'upcoming';
          
          // Use SDK to get page events
          const { Page } = require('facebook-nodejs-business-sdk');
          const page = new Page(args.pageId);
          const events = await page.getEvents(['id', 'name', 'description', 'start_time', 'end_time', 'place'], { 
            time_filter: timeFilter 
          });
          
          if (events.error) {
            return { success: false, error: events.error.message, tool: toolName };
          }
          
          return { success: true, events: events, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'create_page_event':
      case 'update_page_event':
      case 'delete_page_event':
        return { 
          success: false, 
          error: 'Facebook Events API for Pages has been deprecated. Please use Facebook Events Manager or create events through facebook.com',
          tool: toolName 
        };

      // Ads Library Tools
      case 'get_meta_platform_id':
        try {
          const result = await adsLibraryTools.getMetaPlatformId(userId, args.brandNames);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_meta_ads':
        try {
          const result = await adsLibraryTools.getMetaAds(
            userId,
            args.platformId,
            args.adType,
            args.adActiveStatus,
            args.limit,
            args.searchTerms,
            args.adReachedCountries,
            args.adDeliveryDateMin,
            args.adDeliveryDateMax
          );
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'search_ads_library':
        try {
          const result = await adsLibraryTools.searchAdsLibrary(
            userId,
            args.searchQuery,
            args.countries,
            args.adType,
            args.limit
          );
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_competitor_ads_analysis':
        try {
          const result = await adsLibraryTools.getCompetitorAdsAnalysis(
            userId,
            args.competitorPageIds,
            args.dateRange
          );
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      // Missing page management tools
      case 'send_dm_to_user':
        try {
          const result = await pageTools.sendDmToUser(userId, args.pageId, args.recipientId, args.message);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'delete_comment_from_post':
        try {
          const result = await pageTools.deleteCommentFromPost(userId, args.commentId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_number_of_comments':
        try {
          const result = await pageTools.getNumberOfComments(userId, args.postId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_number_of_likes':
        try {
          const result = await pageTools.getNumberOfLikes(userId, args.postId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_post_impressions':
        try {
          const result = await pageTools.getPostImpressions(userId, args.postId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_post_impressions_unique':
        try {
          const result = await pageTools.getPostImpressionsUnique(userId, args.postId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_post_impressions_paid':
        try {
          const result = await pageTools.getPostImpressionsPaid(userId, args.postId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_post_impressions_organic':
        try {
          const result = await pageTools.getPostImpressionsOrganic(userId, args.postId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_post_engaged_users':
        try {
          const result = await pageTools.getPostEngagedUsers(userId, args.postId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_post_clicks':
        try {
          const result = await pageTools.getPostClicks(userId, args.postId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_post_reactions_like_total':
        try {
          const result = await pageTools.getPostReactionsLikeTotal(userId, args.postId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_post_share_count':
        try {
          const result = await pageTools.getPostShareCount(userId, args.postId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_comments_fixed':
        try {
          const result = await pageTools.getPostComments(userId, args.postId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'check_ad_id':
        try {
          const adId = args.adId;
          
          if (!adId) {
            return {
              success: false,
              error: 'Ad ID is required',
              tool: 'check_ad_id'
            };
          }

          const result = await adTools.checkAdId(userId, adId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_leads_data':
        try {
          const staffId = args.staffId;
          const startDate = args.startDate;
          const endDate = args.endDate;
          
          if (!staffId || !startDate || !endDate) {
            return {
              success: false,
              error: 'Staff ID, start date, and end date are required',
              tool: 'get_leads_data'
            };
          }

          const result = await leadTrackingTools.getLeadsData(userId, staffId, startDate, endDate);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_leads_with_insights':
        try {
          const staffId = args.staffId;
          const startDate = args.startDate;
          const endDate = args.endDate;
          
          if (!staffId || !startDate || !endDate) {
            return {
              success: false,
              error: 'Staff ID, start date, and end date are required',
              tool: 'get_leads_with_insights'
            };
          }

          const result = await leadTrackingTools.getLeadsWithAdInsights(userId, staffId, startDate, endDate);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }
        break;

      case 'get_lead_report':
        try {
          const adDataArray = args.adDataArray;
          
          if (!adDataArray || !Array.isArray(adDataArray) || adDataArray.length === 0) {
            return {
              success: false,
              error: 'adDataArray is required and must be a non-empty array with structure: [{ user_id: string, date: string, ads: [{ ad_id: string }] }]',
              tool: 'get_lead_report'
            };
          }

          // Validate structure of adDataArray
          for (const userData of adDataArray) {
            if (!userData.user_id || !userData.date || !userData.ads || !Array.isArray(userData.ads)) {
              return {
                success: false,
                error: 'Invalid adDataArray structure. Each item must have user_id, date, and ads array',
                tool: 'get_lead_report'
              };
            }
          }

          const result = await reportingTools.getLeadReport(userId, adDataArray);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }
        break;

      case 'create_cron_job':
        try {
          const apiKey = args.apiKey;
          const title = args.title;
          const url = args.url;
          const schedule = args.schedule;
          const requestMethod = args.requestMethod || 0;
          const postData = args.postData;
          
          if (!apiKey || !title || !url) {
            return {
              success: false,
              error: 'API key, title, and URL are required',
              tool: 'create_cron_job'
            };
          }

          const result = await cronJobTools.createCronJob(userId, apiKey, title, url, schedule, requestMethod, postData);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_cron_job_details':
        try {
          const apiKey = args.apiKey;
          const jobId = args.jobId;
          
          if (!apiKey || !jobId) {
            return {
              success: false,
              error: 'API key and job ID are required',
              tool: 'get_cron_job_details'
            };
          }

          const result = await cronJobTools.getCronJobDetails(userId, apiKey, jobId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'update_cron_job':
        try {
          const apiKey = args.apiKey;
          const jobId = args.jobId;
          const updates = {
            title: args.title,
            url: args.url,
            schedule: args.schedule
          };
          
          if (!apiKey || !jobId) {
            return {
              success: false,
              error: 'API key and job ID are required',
              tool: 'update_cron_job'
            };
          }

          const result = await cronJobTools.updateCronJob(userId, apiKey, jobId, updates);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'delete_cron_job':
        try {
          const apiKey = args.apiKey;
          const jobId = args.jobId;
          
          if (!apiKey || !jobId) {
            return {
              success: false,
              error: 'API key and job ID are required',
              tool: 'delete_cron_job'
            };
          }

          const result = await cronJobTools.deleteCronJob(userId, apiKey, jobId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_cron_job_history':
        try {
          const apiKey = args.apiKey;
          const jobId = args.jobId;
          const limit = args.limit || 25;
          
          if (!apiKey || !jobId) {
            return {
              success: false,
              error: 'API key and job ID are required',
              tool: 'get_cron_job_history'
            };
          }

          const result = await cronJobTools.getCronJobHistory(userId, apiKey, jobId, limit);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_cron_job_history_details':
        try {
          const apiKey = args.apiKey;
          const jobId = args.jobId;
          const identifier = args.identifier;
          
          if (!apiKey || !jobId || !identifier) {
            return {
              success: false,
              error: 'API key, job ID, and identifier are required',
              tool: 'get_cron_job_history_details'
            };
          }

          const result = await cronJobTools.getCronJobHistoryDetails(userId, apiKey, jobId, identifier);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'list_cron_jobs':
        try {
          const apiKey = args.apiKey;
          
          if (!apiKey) {
            return {
              success: false,
              error: 'API key is required',
              tool: 'list_cron_jobs'
            };
          }

          const result = await cronJobTools.listCronJobs(userId, apiKey);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_account_insights':
        try {
          const accountId = args.accountId;
          const dateRange = args.dateRange || 'today';
          
          if (!accountId) {
            return {
              success: false,
              error: 'Account ID is required',
              tool: 'get_account_insights'
            };
          }

          const result = await accountInsightsTools.getAccountInsights(userId, accountId, dateRange);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_total_spend_all_accounts':
        try {
          const dateRange = args.dateRange || 'today';
          const result = await accountInsightsTools.getTotalSpendAllAccounts(userId, dateRange);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }

      case 'get_spend_by_campaign':
        try {
          const dateRange = args.dateRange || 'today';
          const result = await accountInsightsTools.getSpendByCampaign(userId, dateRange);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            tool: toolName
          };
        }
        break;

      // Diagnostic endpoint to check session and token
      case 'debug_session':
        console.log('[DIAGNOSTIC] Debug session requested for user:', userId);
        const debugInfo = {
          userId: userId,
          sessionExists: !!session,
          hasCredentials: !!session?.credentials,
          hasFacebookToken: !!session?.credentials?.facebookAccessToken,
          tokenLength: session?.credentials?.facebookAccessToken?.length || 0,
          tokenPreview: session?.credentials?.facebookAccessToken ? 
            session.credentials.facebookAccessToken.substring(0, 30) + '...' : 'No token',
          sessionKeys: session ? Object.keys(session) : [],
          credentialKeys: session?.credentials ? Object.keys(session.credentials) : []
        };
        
        console.log('[DIAGNOSTIC] Debug info:', JSON.stringify(debugInfo, null, 2));
        
        return {
          success: true,
          tool: 'debug_session',
          debugInfo: debugInfo,
          message: 'Session debug information retrieved'
        };

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