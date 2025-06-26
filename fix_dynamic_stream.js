// Dynamic session fix for stream endpoint
const fs = require('fs');

const filePath = 'src/http-server.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Make stream endpoint accept userId parameter
content = content.replace(
    "app.get('/stream', (req, res) => {",
    "app.get('/stream/:userId?', (req, res) => {"
);

content = content.replace(
    "app.post('/stream', async (req, res) => {",
    "app.post('/stream/:userId?', async (req, res) => {"
);

// Fix 2: Make userId extraction truly dynamic
const oldUserIdExtraction = `        // Extract userId from the request (you'll need to pass this)
        const userId = (req.headers['x-user-id'] as string) || '8855dc9c-1ce1-41b6-a4b1-235ceeae722f'; // Use current session as fallback`;

const newUserIdExtraction = `        // Extract userId dynamically from multiple sources
        const userId = req.params.userId || 
                      (req.headers['x-user-id'] as string) || 
                      req.body.sessionId || 
                      req.query.sessionId as string;
        
        if (!userId) {
          return res.status(400).json({
            jsonrpc: '2.0',
            id: id,
            error: {
              code: -32602,
              message: 'Session ID required. Provide via URL parameter, header, or query string.'
            }
          });
        }`;

content = content.replace(oldUserIdExtraction, newUserIdExtraction);

// Fix 3: Update initial connection message to show userId
content = content.replace(
    'res.write(\'data: {"type":"connection","status":"connected","message":"Facebook MCP Server stream ready"}\\n\\n\');',
    'const userId = req.params.userId; res.write(`data: {"type":"connection","status":"connected","message":"Facebook MCP Server stream ready","userId":"${userId || \'none\'}"}\\n\\n`);'
);

fs.writeFileSync(filePath, content);
console.log('✅ Applied dynamic session fixes to stream endpoint');
