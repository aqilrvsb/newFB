# 🚀 Dynamic Facebook Ads MCP Server

A production-ready, multi-user MCP (Model Context Protocol) server for Facebook Ads that supports **200 concurrent users** with **100% cloud deployment** on Railway. Each user gets their own isolated session and can use all Facebook Ads tools directly in Claude Desktop.

## 🎯 **Project Overview**

This is a **scalable, cloud-first solution** that eliminates the need for local files while providing full Facebook Ads management capabilities through Claude Desktop.

### **Key Features**
- ✅ **200 Concurrent Users** - Each with isolated sessions
- ✅ **100% Cloud Deployment** - No local JavaScript files needed
- ✅ **HTTP-Based MCP** - Uses built-in Node.js modules only
- ✅ **Auto User ID Generation** - Web frontend for easy onboarding
- ✅ **11 Facebook Ads Tools** - Complete campaign management
- ✅ **Railway.app Ready** - Optimized for cloud deployment
- ✅ **Session Management** - 1-hour timeout with auto-cleanup
- ✅ **Rate Limiting** - Built-in abuse protection

---

## 🏗️ **Architecture**

### **Authentication Flow**
1. User visits: `https://newfb-production.up.railway.app/get-user-id`
2. Enters Facebook credentials (App ID, App Secret, Access Token)
3. Server validates and creates isolated session
4. User receives unique `userId` and ready-to-use Claude Desktop config
5. User updates their Claude Desktop config and connects

### **Session Management**
- Each user session isolated with their own Facebook SDK instance
- Sessions auto-expire after 1 hour of inactivity
- Automatic cleanup every 10 minutes
- Maximum 200 concurrent sessions

### **Communication**
- **Frontend**: HTTP-based MCP client using Node.js built-in modules
- **Backend**: Express server with WebSocket + HTTP endpoints
- **Transport**: HTTPS requests to `/mcp/{userId}` endpoint

---

## 📡 **API Endpoints**

### **Production URLs**
- **Main Server**: `https://newfb-production.up.railway.app`
- **User ID Generator**: `https://newfb-production.up.railway.app/get-user-id`
- **Health Check**: `https://newfb-production.up.railway.app/health`

### **Authentication**
```bash
POST /auth
Content-Type: application/json

{
  "facebookAppId": "your_app_id",
  "facebookAppSecret": "your_app_secret", 
  "facebookAccessToken": "your_access_token"
}

Response:
{
  "success": true,
  "userId": "uuid-here",
  "endpoints": {
    "websocket": "/ws/uuid-here",
    "http": "/mcp/uuid-here"
  },
  "ready": true
}
```

### **Health Check**
```bash
GET /health

Response:
{
  "status": "healthy",
  "activeConnections": 45,
  "maxConnections": 200,
  "environment": "production"
}
```

### **MCP Communication**
```bash
POST /mcp/{userId}
Content-Type: application/json

{
  "method": "create_campaign", 
  "params": {
    "name": "My Campaign",
    "objective": "OUTCOME_LEADS",
    "status": "ACTIVE"
  }
}
```

---

## 🛠️ **Available Facebook Ads Tools**

### **Campaign Management**
1. **`create_campaign`** - Creates a new ad campaign
2. **`get_campaigns`** - Lists existing campaigns
3. **`get_campaign_details`** - Gets details for a specific campaign
4. **`update_campaign`** - Updates an existing campaign
5. **`delete_campaign`** - Deletes a campaign

### **Audience Management**
6. **`create_custom_audience`** - Creates custom, website, or engagement audience
7. **`get_audiences`** - Lists available custom audiences
8. **`create_lookalike_audience`** - Creates a lookalike audience

### **Ad Set Management**
9. **`create_ad_set`** - Creates a new ad set

### **Analytics**
10. **`get_campaign_insights`** - Retrieves performance insights for a campaign

### **AI Assistant**
11. **`generate_campaign_prompt`** - Generates campaign creation prompts using templates

---

## 🚀 **For Users: Getting Started**

### **Step 1: Get Your User ID**
Visit: `https://newfb-production.up.railway.app/get-user-id`

1. Enter your Facebook credentials:
   - Facebook App ID
   - Facebook App Secret  
   - Facebook Access Token
2. Click "Get My User ID"
3. Copy the generated Claude Desktop configuration

### **Step 2: Update Claude Desktop**
1. Open your Claude Desktop config file:
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`
2. Replace entire file contents with the generated configuration
3. Save the file
4. Restart Claude Desktop

### **Step 3: Use Facebook Ads Tools**
You now have 11 Facebook Ads tools available in Claude Desktop:
- Create and manage campaigns
- Build custom audiences
- Analyze campaign performance
- Generate AI-powered campaign prompts

---

## 🔧 **For Developers: Technical Details**

### **Environment Variables**
```bash
PORT=3000
NODE_ENV=production
MAX_CONNECTIONS=200
SESSION_TIMEOUT=3600000
RATE_LIMIT_MAX=100
CORS_ORIGINS=*
HELMET_ENABLED=true
COMPRESSION_ENABLED=true
```

### **Project Structure**
```
├── src/
│   ├── index.ts              # Main entry point
│   ├── http-server.ts        # Express server + WebSocket + Static frontend
│   ├── mcp-server.ts         # MCP protocol implementation
│   ├── config.ts             # Configuration & session management
│   ├── tools/                # Facebook Ads tool implementations
│   └── prompts/              # AI prompt templates
├── public/
│   └── auth.html            # User ID generator frontend
├── package.json             # Dependencies & scripts
└── README.md               # This file
```

### **Key Technologies**
- **Backend**: Node.js, Express, TypeScript, WebSocket
- **Facebook**: Facebook Business SDK
- **MCP**: Model Context Protocol for Claude integration
- **Deployment**: Railway.app with auto-deploy from GitHub
- **Frontend**: Vanilla JavaScript (no dependencies)

### **Session Architecture**
```typescript
interface UserCredentials {
  facebookAppId: string;
  facebookAppSecret: string;
  facebookAccessToken: string;
  userId: string;
}

class UserSessionManager {
  // 200 isolated user sessions
  // Auto-cleanup expired sessions
  // Facebook SDK per user
}
```

---

## 📊 **Monitoring & Scaling**

### **Health Monitoring**
- Real-time connection count via `/health`
- Session timeout tracking
- Rate limiting metrics
- Error logging

### **Scaling**
- **Railway Auto-scaling**: Handles traffic spikes
- **Connection Limits**: 200 concurrent users max
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Session Cleanup**: Automatic memory management

### **Security**
- ✅ HTTPS everywhere
- ✅ Rate limiting protection
- ✅ Session timeouts
- ✅ CORS configuration
- ✅ Input validation
- ✅ No credential logging

---

## 🔄 **Deployment on Railway**

### **Automatic Deployment**
1. **GitHub Integration**: Auto-deploys from `main` branch
2. **Build Process**: `npm run build` (TypeScript compilation)
3. **Start Command**: `npm start`
4. **Environment**: Production-ready with all optimizations

### **Manual Deployment**
1. Fork repository: `https://github.com/aqilrvsb/newFB.git`
2. Connect to Railway.app
3. Set environment variables (see above)
4. Deploy!

---

## 🎯 **Success Metrics**

### **Current Status**
- ✅ **200 Users Supported** - Concurrent session limit
- ✅ **11 Tools Available** - Complete Facebook Ads suite
- ✅ **Zero Local Files** - 100% cloud-based solution
- ✅ **Auto User Onboarding** - Web-based User ID generation
- ✅ **Production Ready** - Deployed on Railway with monitoring

### **User Experience**
- **5-minute setup** from credentials to working tools
- **No technical knowledge** required for users
- **Copy-paste configuration** generation
- **Cross-platform support** (Windows, macOS, Linux)

---

## 🚨 **Troubleshooting**

### **Common Issues**
1. **"Invalid session" error**: User needs new User ID from `/get-user-id`
2. **Tools not appearing**: Restart Claude Desktop after config update
3. **Copy function fails**: Use manual selection fallback
4. **Connection timeout**: Check Railway server status at `/health`

### **For Support**
- **Server Status**: `https://newfb-production.up.railway.app/health`
- **New User ID**: `https://newfb-production.up.railway.app/get-user-id`
- **GitHub**: `https://github.com/aqilrvsb/newFB`

---

## 📝 **License**

MIT License - see LICENSE file for details

---

## 🎉 **Summary**

This project successfully delivers a **scalable, production-ready Facebook Ads MCP server** that:

- Supports **200 concurrent users** with isolated sessions
- Requires **zero local files** for end users
- Provides **11 comprehensive Facebook Ads tools**
- Offers **5-minute setup** through web-based onboarding
- Runs **100% in the cloud** on Railway.app
- Uses **built-in Node.js modules only** for maximum compatibility

**Result**: Any of the 200 users can visit the web frontend, authenticate with their Facebook credentials, get a personalized Claude Desktop configuration, and immediately start using powerful Facebook Ads tools directly in Claude Desktop - all without any local technical setup.

🚀 **Live at**: `https://newfb-production.up.railway.app/get-user-id`