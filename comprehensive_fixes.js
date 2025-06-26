// Comprehensive fixes for Facebook MCP Tools - June 17, 2025

// 1. Fix for publish_scheduled_post and cancel_scheduled_post in http-server.ts
// These need page tokens, not user tokens

const fixScheduledPostTools = `
case 'publish_scheduled_post':
case 'cancel_scheduled_post':
  try {
    const { userSessionManager } = await import('./config.js');
    const session = userSessionManager.getSession(userId);
    if (!session) throw new Error('User session not found');
    
    // Extract page ID from post ID
    const pageId = args.postId.split('_')[0];
    const { getPageAccessToken } = await import('./tools/page-tools.js');
    const pageAccessToken = await getPageAccessToken(userId, pageId);
    
    if (!pageAccessToken) {
      return { success: false, error: 'Failed to get page access token', tool: toolName };
    }
    
    const isPublish = toolName === 'publish_scheduled_post';
    const response = await fetch(
      \`https://graph.facebook.com/v23.0/\${args.postId}\`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_published: isPublish,
          access_token: pageAccessToken
        })
      }
    );
    const data: any = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error.message, tool: toolName };
    }
    
    return { 
      success: true, 
      message: isPublish ? 'Post published successfully' : 'Scheduled post cancelled',
      tool: toolName 
    };
  } catch (error) {
    return {
      success: false,
      error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
      tool: toolName
    };
  }
`;

// 2. Remove duplicate smart token functions from page-tools.ts
// These are causing conflicts with the original functions

const functionsToRemove = [
  'getPostCommentsSmart',
  'getNumberOfCommentsSmart', 
  'getNumberOfLikesSmart',
  'replyToCommentSmart',
  'deleteCommentSmart',
  'smartApiCall',
  'smartCommentApiCall'
];

// 3. Fix page insights metrics for v23.0
// Already fixed in http-server.ts with: ['page_fans', 'page_fan_adds', 'page_fan_removes']

// 4. Fix post image upload validation
const fixPostImage = `
export const postImageToFacebook = async (
  userId: string,
  pageId: string,
  imageUrl: string,
  caption?: string
) => {
  try {
    const pageAccessToken = await getPageAccessToken(userId, pageId);
    if (!pageAccessToken) {
      return { success: false, message: 'Failed to get page access token' };
    }

    // Validate image URL
    if (!imageUrl || !imageUrl.startsWith('http')) {
      return { success: false, message: 'Invalid image URL' };
    }

    const params: any = {
      url: imageUrl,
      access_token: pageAccessToken
    };
    if (caption) params.caption = caption;

    const response = await fetch(
      \`https://graph.facebook.com/v23.0/\${pageId}/photos\`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      }
    );

    const result: any = await response.json();
    
    if (result.error) {
      return { success: false, message: result.error.message };
    }

    return {
      success: true,
      postId: result.post_id || result.id,
      message: 'Image posted successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: \`Error posting image: \${error instanceof Error ? error.message : 'Unknown error'}\`
    };
  }
};
`;

console.log('Fixes identified for deployment');
