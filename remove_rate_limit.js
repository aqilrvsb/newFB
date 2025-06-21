// Remove rate limit from server
const fs = require('fs');

const configPath = 'src/config.ts';
let content = fs.readFileSync(configPath, 'utf8');

// Increase rate limit dramatically
content = content.replace(
    'maxRequests: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 100',
    'maxRequests: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 10000'
);

fs.writeFileSync(configPath, content);
console.log('✅ Updated rate limit to 10,000 requests per 15 minutes');

// Also update the HTTP server to make rate limiting optional
const serverPath = 'src/http-server.ts';
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Comment out the rate limit middleware
serverContent = serverContent.replace(
    'app.use(rateLimitMiddleware);',
    '// app.use(rateLimitMiddleware); // Rate limiting disabled'
);

fs.writeFileSync(serverPath, serverContent);
console.log('✅ Disabled rate limiting middleware');
