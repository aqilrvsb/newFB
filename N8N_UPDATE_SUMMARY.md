# n8n Integration Updates Summary

## 🎯 What's New

### 1. **Updated `/get-user-id` Page**
The authentication page now shows **BOTH** options for users:

- **Claude Desktop Configuration** - Complete JSON config for Claude Desktop
- **n8n Integration Endpoint** - Direct stream URL for n8n automation

### 2. **New n8n Section Added**
When users authenticate at `https://newfb-production.up.railway.app/get-user-id`, they now see:

```
🤖 n8n Integration (Alternative)
Want to use with n8n for automation? Use this endpoint:

https://newfb-production.up.railway.app/stream/[YOUR-USER-ID]

[📋 Copy n8n Endpoint]

Use HTTP Request node in n8n with POST method and JSON body containing the tool parameters.
```

### 3. **Updated Documentation**
The `N8N_INTEGRATION_GUIDE.md` has been updated to use the `/stream/` endpoint instead of `/mcp/`:

- Stream URL: `https://newfb-production.up.railway.app/stream/YOUR_USER_ID`
- Messages Post Endpoint: `https://newfb-production.up.railway.app/stream/YOUR_USER_ID`

## 📱 User Experience

When users visit `/get-user-id`:

1. They enter their Facebook credentials
2. Get authenticated
3. See THREE things:
   - Their User ID
   - Claude Desktop configuration (ready to copy)
   - n8n stream endpoint (ready to copy)

## 🔗 n8n Endpoint Format

```
https://newfb-production.up.railway.app/stream/{userId}
```

Example:
```
https://newfb-production.up.railway.app/stream/abc123-def456-ghi789
```

## 🛠️ How to Use in n8n

1. Add "HTTP Request" node
2. Set Method: POST
3. Set URL: Your stream endpoint
4. Add JSON body with tool name and parameters:

```json
{
  "tool": "get_leads_with_insights",
  "parameters": {
    "staffId": "RV-007",
    "startDate": "16-06-2025",
    "endDate": "17-06-2025"
  }
}
```

## ✅ All 67 Tools Available

Users can now access all 67 Facebook Ads tools through n8n:
- Campaign management
- Ad creation and insights
- Lead tracking and ROI analysis
- Page management
- And much more!

## 🚀 Benefits

- **Automation**: Schedule and automate Facebook Ads tasks
- **Integration**: Connect with other n8n nodes (email, Slack, databases)
- **Workflows**: Build complex marketing workflows
- **No-code**: Visual workflow builder
- **Scalable**: Handle multiple accounts and campaigns
