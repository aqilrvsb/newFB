# Dynamic Facebook Ads MCP Server

A dynamic, multi-user MCP (Model Context Protocol) server for Facebook Ads with HTTP transport support. This server allows up to 200 concurrent users to connect with their own Facebook credentials, supporting both Claude Desktop and N8N integration.

## 🚀 Features

- **Dynamic Multi-User Support**: Up to 200 concurrent user sessions
- **HTTP & WebSocket Transport**: Support for both REST and real-time communication  
- **Facebook Ads API Integration**: Full campaign, audience, and analytics management
- **Rate Limiting**: Built-in protection against abuse
- **Session Management**: Automatic session cleanup and timeout handling
- **Railway.app Ready**: Optimized for cloud deployment
- **N8N Compatible**: HTTP-based MCP client support

## 🏗️ Architecture

### User Authentication Flow
1. User sends Facebook credentials to `/auth` endpoint
2. Server validates credentials and creates session
3. User receives `userId` and connection endpoints
4. User connects via WebSocket or HTTP using their `userId`

### Session Management
- Each user session is isolated with their own Facebook SDK instance
- Sessions auto-expire after 1 hour of inactivity
- Automatic cleanup of expired sessions every 10 minutes

## 📡 API Endpoints

### Authentication
```
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

### Health Check
```
GET /health

Response:
{
  "status": "healthy",
  "activeConnections": 45,
  "maxConnections": 200,
  "environment": "production"
}
```

### MCP Communication
```
# WebSocket (Recommended)
ws://your-domain.com/ws/{userId}

# HTTP (For N8N integration)
POST /mcp/{userId}
Content-Type: application/json

{
  "method": "create_campaign", 
  "params": {
    "name": "My Campaign",
    "objective": "OUTCOME_LEADS",
    "status": "ACTIVE",
    "special_ad_categories": ["HOUSING"]
  }
}
```

## 🛠️ Available MCP Tools

### Campaign Management
- `create_campaign` - Create new ad campaigns
- `get_campaigns` - List existing campaigns
- `get_campaign_details` - Get detailed campaign information
- `update_campaign` - Update campaign settings
- `delete_campaign` - Delete campaigns

### Audience Management  
- `create_custom_audience` - Create custom audiences
- `get_audiences` - List custom audiences
- `create_lookalike_audience` - Create lookalike audiences

### Analytics
- `get_campaign_insights` - Get campaign performance data

### Ad Set Management
- `create_ad_set` - Create new ad sets

## 🔧 Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=production
MAX_CONNECTIONS=200
SESSION_TIMEOUT=3600000
RATE_LIMIT_MAX=100
CORS_ORIGINS=*

# Security (optional)
HELMET_ENABLED=true
COMPRESSION_ENABLED=true
```

## 🚀 Deployment on Railway.app

1. Fork this repository
2. Connect to Railway.app
3. Set environment variables
4. Deploy!

The server will automatically:
- Handle user authentication dynamically
- Manage sessions for up to 200 users
- Provide both WebSocket and HTTP endpoints
- Scale based on demand

## 💻 Client Integration

### Claude Desktop (WebSocket)
Users configure Claude Desktop to connect to:
```
ws://your-railway-domain.com/ws/{userId}
```

### N8N (HTTP)
Configure N8N MCP node with:
```
Base URL: https://your-railway-domain.com/mcp/{userId}
```

## 🔒 Security Features

- Rate limiting (100 requests per 15 minutes per IP)
- Session timeout (1 hour inactivity)
- CORS protection
- Helmet security headers
- Input validation with Joi
- Error handling and logging

## 📊 Monitoring

Monitor server health and usage:
- Active connection count
- Session management metrics
- Rate limiting status
- Error rates and logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details