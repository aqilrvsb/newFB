### **For Cloud Services (AWS, GCP, Azure)**
- Use service account credentials or access keys
- Implement resource discovery across regions/projects
- Add cost management and billing integration
- Handle service-specific quotas and limits

### **For Communication Services (Slack, Discord, Teams)**
- OAuth 2.0 flow for user authorization
- Webhook integration for real-time events
- Message formatting and rich content support
- Channel/server management capabilities

### **For E-commerce Platforms (Shopify, WooCommerce)**
- Store/shop selection per user
- Product catalog management
- Order processing and fulfillment
- Inventory tracking and alerts

---

## 🚀 **Advanced Patterns from Facebook Ads MCP**

### **1. Multi-Account Resource Management**
```typescript
// Pattern: Support multiple accounts/resources per user
async function getResources(args: any, userId: string) {
  // Get ALL user's accounts/resources
  const accountsResponse = await fetch(`https://api.service.com/accounts`, {
    headers: { 'Authorization': `Bearer ${session.credentials.token}` }
  });
  const accounts: any = await accountsResponse.json();
  
  // If specific account requested, filter
  const targetAccountId = args.accountId;
  let accountsToProcess = accounts.data;
  
  if (targetAccountId) {
    accountsToProcess = accounts.data.filter((acc: any) => acc.id === targetAccountId);
  }
  
  // Process each account
  const allResources: any[] = [];
  for (const account of accountsToProcess) {
    const resources = await fetch(`https://api.service.com/${account.id}/resources`);
    const resourceData: any = await resources.json();
    
    // Add account context to each resource
    if (resourceData.data) {
      const resourcesWithAccount = resourceData.data.map((resource: any) => ({
        ...resource,
        account: { id: account.id, name: account.name }
      }));
      allResources.push(...resourcesWithAccount);
    }
  }
  
  return {
    success: true,
    result: {
      resources: allResources,
      totalAccounts: accounts.data.length,
      totalResources: allResources.length
    }
  };
}
```

### **2. Robust Error Handling**
```typescript
// Pattern: Comprehensive error handling with user-friendly messages
async function processToolCall(toolName: string, args: any, userId: string) {
  try {
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('Invalid session');
    }

    switch (toolName) {
      case 'get_data':
        try {
          const response = await fetch(`https://api.service.com/data`, {
            headers: { 'Authorization': `Bearer ${session.credentials.token}` }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data: any = await response.json();
          
          if (data.error) {
            return {
              success: false,
              error: `Service Error: ${data.error.message}`,
              tool: toolName,
              errorCode: data.error.code
            };
          }
          
          return {
            success: true,
            tool: toolName,
            result: data,
            message: 'Data retrieved successfully'
          };
          
        } catch (fetchError) {
          if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
            return {
              success: false,
              error: 'Network error: Unable to connect to service API',
              tool: toolName
            };
          }
          
          return {
            success: false,
            error: `API Error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
            tool: toolName
          };
        }
        
      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
          availableTools: ['get_data', 'create_item', 'update_item']
        };
    }
    
  } catch (sessionError) {
    return {
      success: false,
      error: 'Session error: Please re-authenticate',
      tool: toolName,
      requiresReauth: true
    };
  }
}
```

### **3. Rate Limiting & Performance**
```typescript
// Pattern: Rate limiting and request optimization
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 100, // requests
  duration: 900, // per 15 minutes
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip || 'unknown');
    next();
  } catch (rejRes: any) {
    res.status(429).json({
      error: 'Too Many Requests',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000)
    });
  }
});

// Batch API requests when possible
async function batchGetResources(resourceIds: string[], session: any) {
  const batchSize = 10; // API-specific limit
  const results = [];
  
  for (let i = 0; i < resourceIds.length; i += batchSize) {
    const batch = resourceIds.slice(i, i + batchSize);
    const batchResponse = await fetch(`https://api.service.com/batch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.credentials.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids: batch })
    });
    
    const batchData: any = await batchResponse.json();
    results.push(...(batchData.results || []));
  }
  
  return results;
}
```

### **4. Dynamic Tool Discovery**
```typescript
// Pattern: Tools that adapt based on user's service capabilities
async function getAvailableTools(userId: string) {
  const session = userSessionManager.getSession(userId);
  if (!session) return [];

  // Discover user's service capabilities
  const capabilitiesResponse = await fetch(`https://api.service.com/capabilities`, {
    headers: { 'Authorization': `Bearer ${session.credentials.token}` }
  });
  const capabilities: any = await capabilitiesResponse.json();
  
  const tools = [
    // Base tools available to everyone
    {
      name: 'get_account_info',
      description: 'Get account information',
      inputSchema: { type: 'object', properties: {} }
    }
  ];
  
  // Add conditional tools based on capabilities
  if (capabilities.features?.includes('analytics')) {
    tools.push({
      name: 'get_analytics',
      description: 'Get analytics data',
      inputSchema: {
        type: 'object',
        properties: {
          dateRange: { type: 'string', enum: ['today', 'week', 'month'] }
        }
      }
    });
  }
  
  if (capabilities.features?.includes('automation')) {
    tools.push({
      name: 'create_automation',
      description: 'Create automated workflow',
      inputSchema: {
        type: 'object',
        properties: {
          trigger: { type: 'string' },
          actions: { type: 'array' }
        }
      }
    });
  }
  
  return tools;
}
```

---

## 📋 **Pre-Launch Checklist**

### **✅ Core Functionality**
- [ ] Authentication endpoint validates real service credentials
- [ ] MCP endpoint routes to real tool functions (not demo functions)
- [ ] All tools return actual service data
- [ ] Error handling covers network, API, and auth failures
- [ ] Session management with proper timeouts

### **✅ Multi-User Support**
- [ ] User sessions are isolated
- [ ] Multiple users can connect simultaneously
- [ ] Session cleanup prevents memory leaks
- [ ] Rate limiting protects against abuse
- [ ] Each user's credentials are secure

### **✅ Production Readiness**
- [ ] TypeScript compiles without errors
- [ ] Environment variables configured
- [ ] Health endpoint returns status
- [ ] CORS configured properly
- [ ] HTTPS enforced in production

### **✅ User Experience**
- [ ] Web frontend collects credentials easily
- [ ] Configuration generation works
- [ ] Copy-to-clipboard has fallbacks
- [ ] Clear error messages for users
- [ ] Multi-account support (if applicable)

### **✅ Deployment**
- [ ] Railway auto-deploys from GitHub
- [ ] Build process succeeds
- [ ] Environment variables set
- [ ] Health check passes
- [ ] Real API integration verified

---

## 🔧 **Testing & Debugging**

### **Local Development Testing**
```bash
# 1. Start development server
npm run dev

# 2. Test health endpoint
curl http://localhost:3000/health

# 3. Test authentication
curl -X POST http://localhost:3000/auth \
  -H "Content-Type: application/json" \
  -d '{"serviceKey":"test_key","serviceSecret":"test_secret"}'

# 4. Test MCP endpoint
curl -X POST http://localhost:3000/mcp/{userId} \
  -H "Content-Type: application/json" \
  -d '{"method":"get_resources","params":{}}'
```

### **Railway Production Testing**
```bash
# 1. Test deployed health
curl https://your-app.up.railway.app/health

# 2. Test authentication with real credentials
curl -X POST https://your-app.up.railway.app/auth \
  -H "Content-Type: application/json" \
  -d '{"serviceKey":"real_key","serviceSecret":"real_secret"}'

# 3. Test MCP with returned userId
curl -X POST https://your-app.up.railway.app/mcp/{real_userId} \
  -H "Content-Type: application/json" \
  -d '{"method":"get_resources","params":{}}'
```

### **Common Debugging Steps**
1. **Check Railway logs** for TypeScript compilation errors
2. **Verify endpoint routing** - ensure MCP calls reach real functions
3. **Test API credentials** independently before integrating
4. **Monitor session management** - watch for memory leaks
5. **Validate JSON responses** - ensure proper MCP format

---

## 📚 **Resources & References**

### **Technical Documentation**
- [Model Context Protocol Specification](https://modelcontextprotocol.io/docs)
- [Railway.app Deployment Guide](https://docs.railway.app)
- [TypeScript Configuration](https://www.typescriptlang.org/tsconfig)
- [Express.js Documentation](https://expressjs.com/en/4x/api.html)

### **Facebook Ads MCP Reference**
- **Repository**: `https://github.com/aqilrvsb/newFB`
- **Live Demo**: `https://newfb-production.up.railway.app/get-user-id`
- **Architecture**: Multi-user, HTTP transport, session management
- **Deployment**: Railway.app with GitHub auto-deploy

### **Best Practices from Facebook Ads MCP**
1. **Start Simple**: Demo data → Real API → Multi-user → Production
2. **Verify Early**: Test endpoint routing before adding complexity
3. **User-First**: Web-based credential collection beats complex docs
4. **Scale Gradually**: Single account → Multi-account → Rate limiting
5. **Document Everything**: README with development journey helps future projects

---

## 🎯 **Success Patterns Summary**

The Facebook Ads MCP project proved these patterns work for production MCP servers:

### **✅ Architecture Decisions That Worked**
- **HTTP Transport** over WebSocket (simpler, more reliable)
- **Session-based user management** (scalable to 200+ users)
- **Web-based credential collection** (eliminates user documentation)
- **Railway deployment** (automatic builds, easy scaling)
- **Built-in Node.js modules** (no dependency conflicts)

### **✅ Development Approach That Worked**
- **Phase-based development** (foundation → API → multi-user → deployment)
- **Demo-to-real progression** (get MCP working, then integrate APIs)
- **Iterative problem solving** (fix one issue at a time)
- **Real user testing** (immediate feedback on usability)

### **✅ Technical Decisions That Worked**
- **Strategic TypeScript typing** (`any` for external APIs)
- **Comprehensive error handling** (network, API, auth failures)
- **Multi-resource support** (all accounts/resources per user)
- **Automatic session cleanup** (prevents memory leaks)

---

## 🚀 **Ready to Build Your MCP Server?**

Use this guide as your foundation and adapt the patterns to your specific service. The Facebook Ads MCP project demonstrated that following these patterns can take you from idea to production-ready MCP server in a single development session.

**Key Success Factor**: Start with the proven architecture and adapt it to your service, rather than building from scratch.

Good luck building your MCP server! 🎉

---

## 📝 **License**

This guide is based on the MIT-licensed Facebook Ads MCP project. Feel free to use these patterns for your own MCP development.