// Precise fix for dynamic session
const fs = require('fs');

const filePath = 'src/http-server.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the exact line
const oldLine = `        const userId = (req.headers['x-user-id'] as string) || '8855dc9c-1ce1-41b6-a4b1-235ceeae722f'; // Use current session as fallback`;

const newCode = `        // Extract userId dynamically from multiple sources
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
              message: 'Session ID required. Provide via URL parameter (/stream/SESSION_ID), X-User-ID header, or sessionId in body/query.'
            }
          });
        }`;

if (content.includes(oldLine)) {
    content = content.replace(oldLine, newCode);
    console.log('✅ Successfully replaced hardcoded session with dynamic extraction');
} else {
    console.log('❌ Exact line not found');
}

fs.writeFileSync(filePath, content);
