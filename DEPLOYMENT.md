# Railway.app Deployment Guide

## Prerequisites
1. Railway.app account
2. GitHub account
3. This repository pushed to your GitHub

## Deployment Steps

### 1. Create New Project on Railway
1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose this repository

### 2. Configure Environment Variables
Set these variables in Railway dashboard:

```
PORT=3000
NODE_ENV=production
MAX_CONNECTIONS=200
SESSION_TIMEOUT=3600000
RATE_LIMIT_MAX=100
CORS_ORIGINS=*
HELMET_ENABLED=true
COMPRESSION_ENABLED=true
```

### 3. Configure Build Settings
Railway should auto-detect Node.js. Verify these settings:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Node Version**: 18.x or higher

### 4. Deploy
1. Click "Deploy Now"
2. Wait for build to complete
3. Note your Railway domain (e.g., `myapp-production.up.railway.app`)

## Post-Deployment

### Test Health Endpoint
```bash
curl https://your-domain.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "activeConnections": 0,
  "maxConnections": 200,
  "environment": "production"
}
```

### Test Authentication
```bash
curl -X POST https://your-domain.railway.app/auth \
  -H "Content-Type: application/json" \
  -d '{
    "facebookAppId": "your_app_id",
    "facebookAppSecret": "your_app_secret",
    "facebookAccessToken": "your_access_token", 
    "facebookAccountId": "your_account_id"
  }'
```

## User Instructions

### For Claude Desktop Users
1. Get their Facebook credentials ready
2. Send POST request to `/auth` endpoint
3. Use returned `userId` in WebSocket URL: `wss://your-domain.railway.app/ws/{userId}`
4. Configure Claude Desktop with this WebSocket URL

### For N8N Users  
1. Get their Facebook credentials ready
2. Send POST request to `/auth` endpoint
3. Use returned `userId` in HTTP URL: `https://your-domain.railway.app/mcp/{userId}`
4. Configure N8N MCP node with this HTTP URL

## Monitoring

### View Logs
```bash
railway logs
```

### Monitor Metrics
- Check Railway dashboard for CPU/Memory usage
- Monitor `/health` endpoint for connection counts
- Watch logs for error patterns

## Scaling

Railway will auto-scale based on demand. For consistent high load:
1. Consider upgrading Railway plan
2. Monitor connection limits (200 max)
3. Adjust `MAX_CONNECTIONS` if needed

## Security Notes

- Never log user Facebook credentials
- Sessions auto-expire after 1 hour
- Rate limiting protects against abuse
- CORS configured for security
- All endpoints use HTTPS on Railway

## Troubleshooting

### Build Failures
- Check Node.js version compatibility
- Verify all dependencies in package.json
- Check Railway build logs

### Runtime Issues
- Check environment variables
- Monitor Railway logs
- Test health endpoint
- Verify Facebook API credentials format

### Connection Issues
- Verify WebSocket support is enabled
- Check CORS configuration
- Test with curl first
- Verify user authentication flow