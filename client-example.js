// Example client for testing the Dynamic Facebook MCP Server
// This shows how users can authenticate and use the MCP server

const SERVER_URL = 'https://your-railway-domain.com'; // Replace with your Railway URL

// Example Facebook credentials (users will provide their own)
const FACEBOOK_CREDENTIALS = {
  facebookAppId: 'your_app_id',
  facebookAppSecret: 'your_app_secret',
  facebookAccessToken: 'your_access_token',
  facebookAccountId: 'your_account_id'
};

class FacebookMCPClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.userId = null;
    this.ws = null;
  }

  // Step 1: Authenticate with Facebook credentials
  async authenticate(credentials) {
    try {
      const response = await fetch(`${this.serverUrl}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const result = await response.json();
      
      if (result.success) {
        this.userId = result.userId;
        console.log('✅ Authentication successful!');
        console.log('User ID:', this.userId);
        console.log('WebSocket endpoint:', result.endpoints.websocket);
        console.log('HTTP endpoint:', result.endpoints.http);
        return result;
      } else {
        throw new Error(result.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      throw error;
    }
  }

  // Step 2: Connect via WebSocket (recommended for Claude Desktop)
  connectWebSocket() {
    if (!this.userId) {
      throw new Error('Must authenticate first');
    }

    const wsUrl = `${this.serverUrl.replace('https:', 'wss:').replace('http:', 'ws:')}/ws/${this.userId}`;
    console.log('🔌 Connecting to WebSocket:', wsUrl);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('📥 Received message:', message);
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket disconnected');
    };
  }

  // Step 3: Send MCP requests via HTTP (for N8N integration)
  async sendHttpRequest(method, params) {
    if (!this.userId) {
      throw new Error('Must authenticate first');
    }

    try {
      const response = await fetch(`${this.serverUrl}/mcp/${this.userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method,
          params
        })
      });

      const result = await response.json();
      console.log('📤 HTTP MCP Response:', result);
      return result;
    } catch (error) {
      console.error('❌ HTTP MCP error:', error);
      throw error;
    }
  }

  // Send MCP request via WebSocket
  sendWebSocketRequest(method, params) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const message = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    };

    this.ws.send(JSON.stringify(message));
    console.log('📤 Sent WebSocket message:', message);
  }
}
// Example usage:
async function main() {
  const client = new FacebookMCPClient(SERVER_URL);

  try {
    // 1. Authenticate
    await client.authenticate(FACEBOOK_CREDENTIALS);

    // 2a. Option 1: Use HTTP (for N8N)
    console.log('\n--- Testing HTTP MCP ---');
    await client.sendHttpRequest('get_campaigns', { limit: '5' });

    // 2b. Option 2: Use WebSocket (for Claude Desktop)  
    console.log('\n--- Testing WebSocket MCP ---');
    client.connectWebSocket();

    // Wait for connection then send request
    setTimeout(() => {
      client.sendWebSocketRequest('get_campaigns', { limit: '5' });
    }, 1000);

    // 3. Create a campaign example
    setTimeout(async () => {
      const campaignParams = {
        name: 'Test Campaign',
        objective: 'OUTCOME_LEADS',
        status: 'PAUSED', // Use PAUSED for testing
        dailyBudget: '1000',
        special_ad_categories: ['HOUSING']
      };

      await client.sendHttpRequest('create_campaign', campaignParams);
    }, 2000);

  } catch (error) {
    console.error('Main error:', error);
  }
}

// For Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FacebookMCPClient;
}

// For browser usage
if (typeof window !== 'undefined') {
  window.FacebookMCPClient = FacebookMCPClient;
}

// Run example (uncomment to test)
// main();