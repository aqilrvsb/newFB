import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { serverConfig, userSessionManager, UserCredentials } from './config.js';
import { createMcpServer } from './mcp-server.js';

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

    // Get available ad accounts
    const accountsResult = await userSessionManager.getAvailableAccounts(userId);
    
    res.json({
      success: true,
      userId,
      message: 'Authentication successful',
      endpoints: {
        websocket: `/ws/${userId}`,
        http: `/mcp/${userId}`
      },
      availableAccounts: accountsResult.accounts || [],
      nextStep: 'Select an ad account using POST /select-account/{userId}'
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

    const response = await processMcpRequest(method, params);
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
    </style>
</head>
<body>
    <h1>🚀 Dynamic Facebook MCP Server</h1>
    <div class="status">
        <h3>✅ Server is running successfully!</h3>
        <p>Your dynamic Facebook MCP server is operational and ready to accept connections.</p>
    </div>
    
    <h3>📡 Available Endpoints:</h3>
    <div class="endpoint">
        <strong>Health Check:</strong> GET /health<br>
        <strong>Authentication:</strong> POST /auth<br>
        <strong>WebSocket MCP:</strong> ws://domain/ws/{userId}<br>
        <strong>HTTP MCP:</strong> POST /mcp/{userId}
    </div>
    
    <h3>👥 For Users (200 users supported):</h3>
    <ol>
        <li>Send POST request to <code>/auth</code> with Facebook credentials</li>
        <li>Get your unique <code>userId</code> in response</li>
        <li>Configure Claude Desktop or N8N with your personal endpoint</li>
    </ol>
    
    <h3>🔗 Test Endpoints:</h3>
    <p><a href="/health" target="_blank">Check Server Health</a></p>
    
    <p><strong>Next:</strong> Users should authenticate with their Facebook credentials to get their personal connection endpoints.</p>
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