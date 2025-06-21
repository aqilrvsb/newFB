# 🚀 Quick N8N Setup for Dynamic Facebook MCP

## Step 1: Get Your User ID
```bash
curl -X POST https://newfb-production.up.railway.app/auth \
  -H 'Content-Type: application/json' \
  -d '{"facebookAppId":"YOUR_APP_ID","facebookAppSecret":"YOUR_APP_SECRET","facebookAccessToken":"YOUR_ACCESS_TOKEN"}'
```

## Step 2: N8N MCP Client Configuration

### Connection Type: `HTTP Streamable` ✅

### Settings:
- **HTTP Stream URL**: `https://newfb-production.up.railway.app/mcp/YOUR_USER_ID`
- **Connection Timeout**: `60000`
- **Messages Post Endpoint**: `https://newfb-production.up.railway.app/mcp/YOUR_USER_ID`
- **Headers**: `{"Content-Type": "application/json"}`

## Step 3: First Tool Call
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_ad_accounts",
    "arguments": {}
  }
}
```

## Step 4: Select Account
```json
{
  "method": "tools/call",
  "params": {
    "name": "select_ad_account",
    "arguments": {
      "accountId": "act_YOUR_ACCOUNT_ID"
    }
  }
}
```

## ✅ Now you can use all 13 Facebook tools in N8N!

### Example: Create Campaign
```json
{
  "method": "tools/call",
  "params": {
    "name": "create_campaign",
    "arguments": {
      "name": "My N8N Campaign",
      "objective": "OUTCOME_LEADS",
      "status": "PAUSED",
      "special_ad_categories": ["HOUSING"]
    }
  }
}
```

### Available Tools:
- create_campaign, get_campaigns, get_campaign_details, update_campaign, delete_campaign
- create_custom_audience, get_audiences, create_lookalike_audience
- create_ad_set, get_campaign_insights, generate_campaign_prompt
- get_ad_accounts, select_ad_account

## 🔧 For 200 Users:
Each user gets their own unique `userId` and isolated session.
Replace `YOUR_USER_ID` with each user's personal ID from authentication.