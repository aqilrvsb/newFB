// Quick fix for stream endpoint session ID
const fs = require('fs');

const filePath = 'src/http-server.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the old session ID with the new one
content = content.replace(
    "'2df9ff22-bc93-4e2b-bb37-c489543a9659'",
    "'8855dc9c-1ce1-41b6-a4b1-235ceeae722f'"
);

fs.writeFileSync(filePath, content);
console.log('✅ Fixed stream endpoint session ID');
