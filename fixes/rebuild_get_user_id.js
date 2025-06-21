const fs = require('fs');
const path = require('path');

console.log('🔧 Completely rebuilding get-user-id route...\n');

// Read the http-server.ts file
const httpServerPath = path.join(__dirname, '..', 'src', 'http-server.ts');
let content = fs.readFileSync(httpServerPath, 'utf8');

// Find the get-user-id route
const startPattern = /app\.get\('\/get-user-id'/;
const startMatch = content.match(startPattern);
if (!startMatch) {
  console.error('❌ Could not find get-user-id route');
  process.exit(1);
}

const routeStart = content.indexOf(startMatch[0]);

// Find the end of the route (next route or middleware)
const endPattern = /app\.(get|post|put|delete|use)\(/;
const afterRoute = content.substring(routeStart + 100);
const endMatch = afterRoute.match(endPattern);
const routeEnd = endMatch ? routeStart + 100 + afterRoute.indexOf(endMatch[0]) : content.length;

// Build the complete, working route
const newRoute = `app.get('/get-user-id', (req, res) => {
  const html = \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facebook Ads MCP - Get Your User ID</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border-radius: 20px; padding: 40px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); }
        h1 { color: #333; margin-bottom: 10px; text-align: center; font-size: 2.5em; }
        .subtitle { text-align: center; color: #666; margin-bottom: 30px; font-size: 1.1em; }
        .status { padding: 15px; border-radius: 10px; margin: 20px 0; text-align: center; font-weight: 500; display: none; }
        .status.error { background: #fee; color: #d00; display: block; }
        .status.success { background: #efe; color: #070; display: block; }
        .status.loading { background: #fff3cd; color: #856404; display: block; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 8px; color: #555; font-weight: 600; }
        .form-group input { width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: all 0.3s; }
        .form-group input:focus { border-color: #667eea; outline: none; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
        .btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 14px 30px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s; display: block; width: 100%; margin-top: 20px; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2); }
        .result { display: none; margin-top: 30px; padding: 30px; background: #f8f9fa; border-radius: 10px; border: 2px solid #e0e0e0; }
        .result.show { display: block; animation: fadeIn 0.5s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .user-id { font-family: 'Courier New', monospace; font-size: 1.2em; padding: 15px; background: white; border-radius: 8px; margin: 10px 0; word-break: break-all; border: 2px solid #e0e0e0; }
        .copy-btn { background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; margin-top: 10px; transition: all 0.3s; }
        .copy-btn:hover { background: #218838; }
        .copy-success { color: #28a745; margin-left: 10px; opacity: 0; transition: opacity 0.3s; }
        .copy-success.show { opacity: 1; }
        .step { margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 10px; }
        .step h3 { color: #333; margin-bottom: 15px; }
        code { background: #e9ecef; padding: 2px 6px; border-radius: 4px; font-family: 'Courier New', monospace; }
        .instructions { margin-top: 20px; }
        .instructions ol { margin-left: 20px; }
        .instructions li { margin-bottom: 10px; line-height: 1.6; }
        .config-section { margin-top: 20px; }
        .config-section h3 { margin-bottom: 10px; }
        #configJson { background: white; padding: 15px; border-radius: 8px; overflow-x: auto; font-family: 'Courier New', monospace; font-size: 12px; max-height: 400px; overflow-y: auto; }
        .progress-bar { display: flex; justify-content: space-between; margin-bottom: 30px; position: relative; }
        .progress-bar::before { content: ''; position: absolute; top: 20px; left: 0; right: 0; height: 2px; background: #e0e0e0; z-index: -1; }
        .progress-step { background: white; border: 2px solid #e0e0e0; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #999; }
        .progress-step.active { background: #667eea; color: white; border-color: #667eea; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Facebook Ads MCP Server</h1>
        <p class="subtitle">Get your personal User ID to start using Facebook Ads tools in Claude Desktop</p>
        
        <div class="progress-bar">
            <div class="progress-step active">1</div>
            <div class="progress-step">2</div>
            <div class="progress-step">3</div>
        </div>

        <div class="step">
            <h3>🔑 Enter Your Facebook Credentials</h3>
            <div class="form-group">
                <label for="appId">Facebook App ID</label>
                <input type="text" id="appId" placeholder="1234567890123456" />
            </div>
            
            <div class="form-group">
                <label for="appSecret">Facebook App Secret</label>
                <input type="text" id="appSecret" placeholder="abcdef1234567890abcdef1234567890" />
            </div>
            
            <div class="form-group">
                <label for="accessToken">Facebook Access Token</label>
                <input type="text" id="accessToken" placeholder="EAA..." />
            </div>
            
            <button class="btn" onclick="authenticate()">
                🚀 Get My User ID
            </button>
        </div>
        
        <div id="status" class="status"></div>
        
        <div id="result" class="result">
            <h3>✅ Your Personal User ID:</h3>
            <div id="userId" class="user-id"></div>
            <button class="copy-btn" onclick="copyUserId()">📋 Copy User ID</button>
            
            <div class="config-section">
                <h3>📝 Claude Desktop Configuration</h3>
                <p>Copy this complete configuration for Claude Desktop:</p>
                <pre id="configJson"></pre>
                <button class="copy-btn" onclick="copyConfig()">📋 Copy Configuration</button>
            </div>
            
            <div class="instructions">
                <h3>📱 Setup Instructions:</h3>
                <ol>
                    <li><strong>Copy the Claude Desktop configuration</strong> above</li>
                    <li><strong>Open your Claude Desktop config file:</strong>
                        <br>• Windows: <code>%APPDATA%\\Claude\\claude_desktop_config.json</code>
                        <br>• macOS: <code>~/Library/Application Support/Claude/claude_desktop_config.json</code>
                        <br>• Linux: <code>~/.config/Claude/claude_desktop_config.json</code>
                    </li>
                    <li><strong>Replace the entire file contents</strong> with the configuration above</li>
                    <li><strong>Save the file</strong></li>
                    <li><strong>Restart Claude Desktop</strong></li>
                    <li><strong>Test Facebook Ads tools</strong> - you now have 77 tools available!</li>
                </ol>
            </div>
        </div>
    </div>

    <script>
        let currentUserId = null;
        
        async function authenticate() {
            const appId = document.getElementById('appId').value.trim();
            const appSecret = document.getElementById('appSecret').value.trim();
            const accessToken = document.getElementById('accessToken').value.trim();
            
            if (!appId || !appSecret || !accessToken) {
                showStatus('Please fill in all fields', 'error');
                return;
            }
            
            showStatus('🔄 Authenticating with Railway server...', 'loading');
            
            try {
                const response = await fetch('/auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        facebookAppId: appId,
                        facebookAppSecret: appSecret,
                        facebookAccessToken: accessToken
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    currentUserId = data.userId;
                    document.getElementById('userId').textContent = currentUserId;
                    generateConfig(currentUserId);
                    document.getElementById('result').classList.add('show');
                    showStatus('✅ Authentication successful! Your User ID and config are ready.', 'success');
                } else {
                    showStatus('❌ Authentication failed: ' + (data.error || 'Unknown error'), 'error');
                }
            } catch (error) {
                showStatus('❌ Connection error: ' + error.message + '. Make sure Railway is running.', 'error');
            }
        }
        
        function generateConfig(userId) {
            const config = {
                "mcpServers": {
                    "facebook-ads": {
                        "command": "npx",
                        "args": ["-y", "@modelcontextprotocol/server-facebook-ads", userId]
                    }
                }
            };
            
            document.getElementById('configJson').textContent = JSON.stringify(config, null, 2);
        }
        
        function copyUserId() {
            if (currentUserId) {
                navigator.clipboard.writeText(currentUserId).then(() => {
                    showCopySuccess(event.target, '✅ User ID Copied!');
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                    alert('Failed to copy to clipboard. Please select and copy manually.');
                });
            }
        }
        
        function copyConfig() {
            const configText = document.getElementById('configJson').textContent;
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(configText).then(() => {
                    showCopySuccess(event.target, '✅ Config Copied!');
                }).catch(err => {
                    fallbackCopy(configText);
                });
            } else {
                fallbackCopy(configText);
            }
        }
        
        function fallbackCopy(text) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Configuration copied to clipboard!');
        }
        
        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = 'status ' + type;
            
            if (type === 'success') {
                updateProgressBar(3);
            }
        }
        
        function showCopySuccess(button, message) {
            const originalText = button.textContent;
            button.textContent = message;
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        }
        
        function updateProgressBar(step) {
            const steps = document.querySelectorAll('.progress-step');
            steps.forEach((s, i) => {
                if (i < step) {
                    s.classList.add('active');
                }
            });
        }
    </script>
</body>
</html>\`;
  res.send(html);
});

`;

// Replace the entire route
const beforeRoute = content.substring(0, routeStart);
const afterRouteContent = content.substring(routeEnd);
content = beforeRoute + newRoute + afterRouteContent;

// Write the fixed file
fs.writeFileSync(httpServerPath, content);
console.log('✅ Completely rebuilt get-user-id route');

// Build the project
console.log('\n📦 Building the project...');
const { execSync } = require('child_process');

try {
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('\n✅ Build completed successfully!');
  console.log('\n🎉 get-user-id page is now completely fixed!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
}
