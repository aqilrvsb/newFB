// Add new working function to page-tools.ts
const fs = require('fs');
const path = require('path');

console.log('🔧 Adding working get_comments_fixed function...');

const filePath = path.join(__dirname, 'src', 'tools', 'page-tools.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Add new working function at the end before the closing
const newFunction = `
// FIXED VERSION - Get number of comments using page access token
export const getCommentsFixed = async (userId: string, postId: string) => {
  try {
    // Extract page ID from post ID (format: pageId_postId)
    const pageId = postId.split('_')[0];
    const pageAccessToken = await getPageAccessToken(userId, pageId);
    if (!pageAccessToken) {
      return { success: false, message: 'Failed to get page access token' };
    }

    const response = await fetch(
      \`https://graph.facebook.com/v23.0/\${postId}?fields=comments.summary(true)&access_token=\${pageAccessToken}\`
    );
    const result = await response.json();
    
    if (result.error) {
      return { success: false, message: result.error.message };
    }
    
    return {
      success: true,
      postId,
      commentCount: result.comments?.summary?.total_count || 0,
      message: \`Post has \${result.comments?.summary?.total_count || 0} comments\`
    };
  } catch (error) {
    return {
      success: false,
      message: \`Error getting comment count: \${error instanceof Error ? error.message : 'Unknown error'}\`
    };
  }
};
`;

// Add before the alias function at the end
content = content.replace(
  '// Alias for delete_comment',
  newFunction + '\n// Alias for delete_comment'
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Added getCommentsFixed function');
console.log('🔧 This function uses proper page access token authentication');
