// Add smart tools to the compressed tools list for Claude Desktop
const fs = require('fs');
const path = require('path');

console.log('🔧 Adding smart tools to Claude Desktop config...');

const filePath = path.join(__dirname, 'src', 'http-server.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Add smart tools to the compressed tools array
const smartToolsConfig = `, { name: 'get_post_comments_smart', description: 'Get post comments with smart user/page token fallback', inputSchema: { type: 'object', properties: { postId: { type: 'string' }, limit: { type: 'number', default: 25 } }, required: ['postId'] } }, { name: 'get_number_of_comments_smart', description: 'Count comments with smart token fallback', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } }, { name: 'get_number_of_likes_smart', description: 'Count likes with smart token fallback', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } }, { name: 'reply_to_comment_smart', description: 'Reply to comment with smart token fallback', inputSchema: { type: 'object', properties: { commentId: { type: 'string' }, message: { type: 'string' } }, required: ['commentId', 'message'] } }, { name: 'delete_comment_smart', description: 'Delete comment with smart token fallback', inputSchema: { type: 'object', properties: { commentId: { type: 'string' } }, required: ['commentId'] } }`;

// Find the end of the current tools array and add smart tools
content = content.replace(
  /\{ name: 'send_dm_to_user', description: 'Send a direct message to a user', inputSchema: \{ type: 'object', properties: \{ recipientId: \{ type: 'string' \}, message: \{ type: 'string' \} \}, required: \['recipientId', 'message'\] \} \} \]/,
  `{ name: 'send_dm_to_user', description: 'Send a direct message to a user', inputSchema: { type: 'object', properties: { recipientId: { type: 'string' }, message: { type: 'string' } }, required: ['recipientId', 'message'] } }${smartToolsConfig} ]`
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Added 5 smart tools to Claude Desktop config');
console.log('📊 Total tools should now be: 68 + 5 = 73 tools');
console.log('🚀 Smart tools will be available after config regeneration');
