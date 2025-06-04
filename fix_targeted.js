// Targeted fix for dynamic session extraction
const fs = require('fs');

const filePath = 'src/http-server.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the hardcoded session extraction with dynamic version
const oldPattern = `        // Extract userId from the request (you'll need to pass this)
        const userId = (req.headers['x-user-id'] as string) || '8855dc9c-1ce1-41b6-a4b1-235ceeae722f'; // Use current session as fallback`;

const newPattern = `        // Extract userId dynamically from multiple sources
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

if (content.includes(oldPattern)) {
    content = content.replace(oldPattern, newPattern);
    console.log('✅ Replaced hardcoded session with dynamic extraction');
} else {
    console.log('❌ Could not find exact pattern to replace');
    console.log('Looking for lines containing the session ID...');
    
    // Find lines with the hardcoded session
    const lines = content.split('\n');
    lines.forEach((line, index) => {
        if (line.includes('8855dc9c-1ce1-41b6-a4b1-235ceeae722f')) {
            console.log(`Line ${index + 1}: ${line.trim()}`);
        }
    });
}

fs.writeFileSync(filePath, content);
