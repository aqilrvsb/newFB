# 🔗 N8N Integration Guide for Dynamic Facebook MCP Server

## 🎯 Overview
This guide shows how 200 users can connect their N8N workflows to the dynamic Facebook MCP server using HTTP Streamable transport.

---

## 📋 Prerequisites

### ✅ Required:
- N8N installed (self-hosted or N8N Cloud)
- Facebook credentials (App ID, Secret, Access Token)
- Internet connection

### 🔑 Facebook Credentials Needed:
- **App ID** (e.g., `1234567890123456`)
- **App Secret** (e.g., `abcdef1234567890abcdef1234567890`)
- **Access Token** (e.g., `EAATNmAQBQ50BO...`)

---

## 🚀 Step 1: Get Your User ID (Authentication)

### Option A: One-Line Command
```bash
curl -X POST https://newfb-production.up.railway.app/auth -H 'Content-Type: application/json' -d '{"facebookAppId":"YOUR_APP_ID","facebookAppSecret":"YOUR_APP_SECRET","facebookAccessToken":"YOUR_ACCESS_TOKEN"}'
```

### Option B: Use Web Interface
Visit: `https://newfb-production.up.railway.app/` and authenticate

### Example Response:
```json
{
  "success": true,
  "userId": "abc123-def456-ghi789",
  "availableAccounts": [...],
  "endpoints": {
    "websocket": "/ws/abc123-def456-ghi789",
    "http": "/mcp/abc123-def456-ghi789"
  }
}
```

**📝 Important:** Copy your `userId` (e.g., `abc123-def456-ghi789`)

---

## 🔧 Step 2: Configure N8N MCP Client Node

### Add MCP Client Node to N8N:

1. **Open N8N Workflow**
2. **Add Node** → Search for "MCP Client"
3. **Select Connection Type**: `HTTP Streamable`

### Configuration Settings:

#### **Connect using:** `HTTP Streamable` ✅

#### **HTTP Stream URL:**
```
https://newfb-production.up.railway.app/mcp/YOUR_USER_ID_HERE
```

**Example:**
```
https://newfb-production.up.railway.app/mcp/abc123-def456-ghi789
```

#### **HTTP Connection Timeout:**
```
60000
```

#### **Messages Post Endpoint:**
```
https://newfb-production.up.railway.app/mcp/YOUR_USER_ID_HERE
```

#### **Additional Headers:**
```json
{
  "Content-Type": "application/json",
  "User-Agent": "N8N-MCP-Client"
}
```

---

## 🎯 Step 3: Select Ad Account (First Time Setup)

Before using Facebook tools, users need to select which ad account to use:

### N8N Workflow Example:
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_ad_accounts",
    "arguments": {}
  }
}
```

Then select an account:
```json
{
  "method": "tools/call",
  "params": {
    "name": "select_ad_account",
    "arguments": {
      "accountId": "act_1234567890"
    }
  }
}
```

---

## ✅ Available Tools in N8N (13 Total)

### 🔧 Campaign Management:
1. **create_campaign** - Create new campaigns
2. **get_campaigns** - List campaigns
3. **get_campaign_details** - Get campaign details
4. **update_campaign** - Update campaigns
5. **delete_campaign** - Delete campaigns

### 👥 Audience Management:
6. **create_custom_audience** - Create audiences
7. **get_audiences** - List audiences
8. **create_lookalike_audience** - Create lookalike audiences

### 📢 Ad Management:
9. **create_ad_set** - Create ad sets

### 📊 Analytics:
10. **get_campaign_insights** - Get analytics data

### 🤖 AI Tools:
11. **generate_campaign_prompt** - Generate AI prompts

### 🔧 Account Management:
12. **get_ad_accounts** - List Facebook accounts
13. **select_ad_account** - Select account

---

## 📋 N8N Workflow Examples

### Example 1: Get Facebook Accounts
```json
{
  "nodes": [
    {
      "name": "Get FB Accounts",
      "type": "n8n-nodes-base.mcpClient",
      "parameters": {
        "method": "tools/call",
        "params": {
          "name": "get_ad_accounts",
          "arguments": {}
        }
      }
    }
  ]
}
```

### Example 2: Create Campaign
```json
{
  "name": "Create Campaign",
  "type": "n8n-nodes-base.mcpClient",
  "parameters": {
    "method": "tools/call",
    "params": {
      "name": "create_campaign",
      "arguments": {
        "name": "My N8N Campaign",
        "objective": "OUTCOME_LEADS",
        "status": "PAUSED",
        "dailyBudget": "1000",
        "special_ad_categories": ["HOUSING"]
      }
    }
  }
}
```

### Example 3: Get Campaign Analytics
```json
{
  "name": "Get Analytics",
  "type": "n8n-nodes-base.mcpClient",
  "parameters": {
    "method": "tools/call",
    "params": {
      "name": "get_campaign_insights",
      "arguments": {
        "campaignId": "{{ $node['Previous'].json.campaignId }}",
        "since": "2024-01-01",
        "until": "2024-01-31"
      }
    }
  }
}
```

---

## 🔄 Complete N8N Setup Process

### For Each of 200 Users:

1. **🔐 Authenticate** → Get unique `userId`
2. **⚙️ Configure N8N** → Use `userId` in HTTP URLs
3. **🎯 Select Account** → Choose Facebook ad account
4. **🚀 Build Workflows** → Use 13 available tools

### User-Specific URLs:
- **User 1**: `https://newfb-production.up.railway.app/mcp/user1-uuid-here`
- **User 2**: `https://newfb-production.up.railway.app/mcp/user2-uuid-here`
- **User 200**: `https://newfb-production.up.railway.app/mcp/user200-uuid-here`

---

## 🎯 Advanced N8N Workflows

### Automated Campaign Management:
```
Trigger → Get Campaigns → Analyze Performance → Update/Pause Low Performers
```

### Lead Generation Workflow:
```
Schedule → Create Campaign → Monitor Insights → Export Leads → Send Notifications
```

### Multi-Account Management:
```
Loop Accounts → Select Account → Get Campaigns → Aggregate Data → Generate Report
```

---

## 🆘 Troubleshooting N8N Integration

### Common Issues:

**❌ "Connection timeout"**
- ✅ Increase timeout to 60000ms
- ✅ Check your userId is correct

**❌ "Invalid session"**  
- ✅ Re-authenticate to get new userId
- ✅ Sessions expire after 1 hour

**❌ "No ad account selected"**
- ✅ First run `get_ad_accounts` then `select_ad_account`

**❌ "Rate limit exceeded"**
- ✅ Add delays between requests
- ✅ Limit to 100 requests per 15 minutes

### Debug Steps:
1. Test health endpoint: `https://newfb-production.up.railway.app/health`
2. Verify authentication works
3. Check N8N logs for detailed errors
4. Test simple tool call first (`get_ad_accounts`)

---

## 🎉 Success Indicators

✅ N8N shows successful MCP connection
✅ `get_ad_accounts` returns your Facebook accounts
✅ Campaign creation/management works
✅ Analytics data is retrieved successfully

---

## 📊 Scalability for 200 Users

### ✅ Supported:
- 200 concurrent N8N connections
- Each user has isolated session
- Individual Facebook account access
- Rate limiting per IP (not per user)
- Auto session cleanup

### 🔧 Best Practices:
- Add delays between requests (1-2 seconds)
- Handle session expiration (re-authenticate)
- Use error handling in workflows
- Monitor rate limits

---

**🚀 Your N8N workflows can now fully manage Facebook Ads through the dynamic MCP server!**

Each of the 200 users gets their own isolated connection with access to all 13 Facebook advertising tools.