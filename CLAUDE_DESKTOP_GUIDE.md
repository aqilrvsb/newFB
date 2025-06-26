# Claude Desktop Configuration Guide for 200 Users

## 🎯 **Overview**
This guide shows how 200 different users can configure their Claude Desktop to connect to your Railway-deployed Dynamic Facebook MCP Server.

## 🔄 **Auto-Deploy Status**
Railway should automatically deploy the latest changes. Wait 2-3 minutes, then try accessing:
- **Root URL**: https://newfb-production.up.railway.app/ 
- **Health Check**: https://newfb-production.up.railway.app/health

## 👤 **Step-by-Step User Configuration**

### Step 1: User Gets Their Unique Connection
Each user must first authenticate to get their personal `userId`:

```bash
curl -X POST https://newfb-production.up.railway.app/auth \
  -H "Content-Type: application/json" \
  -d '{
    "facebookAppId": "USER_FACEBOOK_APP_ID",
    "facebookAppSecret": "USER_FACEBOOK_APP_SECRET", 
    "facebookAccessToken": "USER_FACEBOOK_ACCESS_TOKEN",
    "facebookAccountId": "USER_FACEBOOK_ACCOUNT_ID"
  }'
```

**Response Example:**
```json
{
  "success": true,
  "userId": "abc123-def456-ghi789",
  "endpoints": {
    "websocket": "/ws/abc123-def456-ghi789",
    "http": "/mcp/abc123-def456-ghi789"
  }
}
```

### Step 2: Claude Desktop Configuration
Each user adds this to their Claude Desktop MCP settings file:

**Location of MCP settings file:**
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

**Configuration Template:**
```json
{
  "mcpServers": {
    "dynamic-facebook-ads": {
      "command": "node",
      "args": [],
      "env": {},
      "transport": {
        "type": "websocket",
        "url": "wss://newfb-production.up.railway.app/ws/USER_UNIQUE_ID_HERE"
      }
    }
  }
}
```

### Step 3: User-Specific Examples

**User 1 Configuration:**
```json
{
  "mcpServers": {
    "dynamic-facebook-ads": {
      "transport": {
        "type": "websocket", 
        "url": "wss://newfb-production.up.railway.app/ws/user1-uuid-12345"
      }
    }
  }
}
```

**User 2 Configuration:**
```json
{
  "mcpServers": {
    "dynamic-facebook-ads": {
      "transport": {
        "type": "websocket",
        "url": "wss://newfb-production.up.railway.app/ws/user2-uuid-67890" 
      }
    }
  }
}
```

## 🔧 **For N8N Users**

N8N users configure their HTTP MCP node with:
- **Base URL**: `https://newfb-production.up.railway.app/mcp/{userId}`
- **Method**: POST
- **Headers**: `Content-Type: application/json`

## 📋 **User Distribution Process**

### Option 1: Manual Distribution
1. Share your Railway URL: `https://newfb-production.up.railway.app`
2. Users visit the URL and see instructions
3. Users authenticate with their Facebook credentials
4. Users get their personal WebSocket URL
5. Users configure Claude Desktop with their unique URL

### Option 2: Automated Onboarding
Create a simple onboarding app that:
1. Collects user Facebook credentials
2. Calls your `/auth` endpoint
3. Generates Claude Desktop config file for download
4. Provides copy-paste instructions

## 🔒 **Security Notes**

- Each user gets isolated sessions with their own Facebook API access
- Sessions expire after 1 hour of inactivity
- Rate limiting protects against abuse (100 requests/15min per IP)
- Users can only access their own Facebook data

## 🚀 **Available MCP Tools for Users**

Once connected, users can use these MCP tools:
- `create_campaign` - Create Facebook ad campaigns
- `get_campaigns` - List their campaigns
- `get_campaign_details` - Get campaign information
- `update_campaign` - Modify campaigns
- `delete_campaign` - Remove campaigns
- `create_custom_audience` - Create custom audiences
- `get_audiences` - List custom audiences
- `get_campaign_insights` - Get analytics data

## 🔍 **Troubleshooting**

### Common Issues:
1. **404 Error**: User trying to access root URL instead of proper endpoints
2. **Authentication Failed**: Invalid Facebook credentials
3. **Session Expired**: User needs to re-authenticate after 1 hour
4. **Connection Limit**: Server at 200 user capacity

### Debug Steps:
1. Test health endpoint: `/health`
2. Verify authentication works: `/auth`
3. Check Railway logs for errors
4. Ensure WebSocket URLs are correct

## 📊 **Monitoring Usage**

Check server status anytime:
```bash
curl https://newfb-production.up.railway.app/health
```

Response shows:
- Active connection count
- Server health status
- Environment information

## 🎉 **Success Indicators**

Users know it's working when:
1. Authentication returns success with userId
2. Claude Desktop shows "dynamic-facebook-ads" in MCP servers
3. Users can run MCP commands like "create a Facebook campaign"
4. Commands execute without errors

Your server can now handle 200 concurrent users, each with their own isolated Facebook API access! 🚀