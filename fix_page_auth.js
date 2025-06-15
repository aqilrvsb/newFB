// Authentication fix for page tools - Use page access tokens
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing page tools authentication to use page access tokens...');

const filePath = path.join(__dirname, 'src', 'tools', 'page-tools.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix getPostComments function
content = content.replace(
  /\/\/ Get post comments\nexport const getPostComments = async \(\n  userId: string,\n  postId: string,\n  limit: number = 25\n\) => \{\n  try \{\n    const \{ userSessionManager \} = await import\('\.\.\/config\.js'\);\n    const session = userSessionManager\.getSession\(userId\);\n    if \(!session\) \{\n      throw new Error\('User session not found'\);\n    \}\n\n    const response = await fetch\(\n      `https:\/\/graph\.facebook\.com\/v23\.0\/\$\{postId\}\/comments\?fields=id,message,from,created_time,like_count,comment_count&limit=\$\{limit\}&access_token=\$\{session\.credentials\.facebookAccessToken\}`\n    \);/,
  `// Get post comments
export const getPostComments = async (
  userId: string,
  postId: string,
  limit: number = 25
) => {
  try {
    // Extract page ID from post ID (format: pageId_postId)
    const pageId = postId.split('_')[0];
    const pageAccessToken = await getPageAccessToken(userId, pageId);
    if (!pageAccessToken) {
      return { success: false, message: 'Failed to get page access token' };
    }

    const response = await fetch(
      \`https://graph.facebook.com/v23.0/\${postId}/comments?fields=id,message,from,created_time,like_count,comment_count&limit=\${limit}&access_token=\${pageAccessToken}\`
    );`
);

// Fix getNumberOfComments function
content = content.replace(
  /export const getNumberOfComments = async \(userId: string, postId: string\) => \{\n  try \{\n    const commentsResult = await getPostComments\(userId, postId, 1\);\n    if \(!commentsResult\.success\) \{\n      return commentsResult;\n    \}\n\n    \/\/ Get total count from the API response\n    const \{ userSessionManager \} = await import\('\.\.\/config\.js'\);\n    const session = userSessionManager\.getSession\(userId\);\n    if \(!session\) \{\n      throw new Error\('User session not found'\);\n    \}\n\n    const response = await fetch\(\n      `https:\/\/graph\.facebook\.com\/v23\.0\/\$\{postId\}\?fields=comments\.summary\(true\)&access_token=\$\{session\.credentials\.facebookAccessToken\}`\n    \);/,
  `export const getNumberOfComments = async (userId: string, postId: string) => {
  try {
    // Extract page ID from post ID (format: pageId_postId)
    const pageId = postId.split('_')[0];
    const pageAccessToken = await getPageAccessToken(userId, pageId);
    if (!pageAccessToken) {
      return { success: false, message: 'Failed to get page access token' };
    }

    const response = await fetch(
      \`https://graph.facebook.com/v23.0/\${postId}?fields=comments.summary(true)&access_token=\${pageAccessToken}\`
    );`
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed page tools authentication');
console.log('📋 Updated getPostComments and getNumberOfComments to use page access tokens');
console.log('🚀 Tools should now work without OAuth errors');
