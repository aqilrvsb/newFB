// Update stream endpoints to accept userId parameter
const fs = require('fs');

const filePath = 'src/http-server.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Update GET stream endpoint
content = content.replace(
    "app.get('/stream', (req, res) => {",
    "app.get('/stream/:userId?', (req, res) => {"
);

// Update POST stream endpoint  
content = content.replace(
    "app.post('/stream', async (req, res) => {",
    "app.post('/stream/:userId?', async (req, res) => {"
);

// Update the connection message to show userId
content = content.replace(
    'res.write(\'data: {"type":"connection","status":"connected","message":"Facebook MCP Server stream ready"}\\n\\n\');',
    'const userIdFromPath = req.params.userId; res.write(`data: {"type":"connection","status":"connected","message":"Facebook MCP Server stream ready","userId":"${userIdFromPath || \'auto-detect\'}"}\\n\\n`);'
);

fs.writeFileSync(filePath, content);
console.log('✅ Updated stream endpoints to accept userId parameter');
