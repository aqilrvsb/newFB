// Final comprehensive fixes for remaining issues

// 1. Fix getPostComments to handle token properly
const fixGetPostComments = `
export const getPostComments = async (
  userId: string,
  postId: string,
  limit: number = 25
) => {
  try {
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    // Try with user token first
    let response = await fetch(
      \`https://graph.facebook.com/v23.0/\${postId}/comments?fields=id,message,from,created_time,like_count,comment_count&limit=\${limit}&access_token=\${session.credentials.facebookAccessToken}\`
    );

    let result: any = await response.json();
    
    // If failed with user token, try page token
    if (result.error && result.error.message.includes('OAuth')) {
      const pageId = postId.split('_')[0];
      const pageAccessToken = await getPageAccessToken(userId, pageId);
      if (pageAccessToken) {
        response = await fetch(
          \`https://graph.facebook.com/v23.0/\${postId}/comments?fields=id,message,from,created_time,like_count,comment_count&limit=\${limit}&access_token=\${pageAccessToken}\`
        );
        result = await response.json();
      }
    }
    
    if (result.error) {
      return { success: false, message: result.error.message };
    }

    return {
      success: true,
      comments: result.data || [],
      paging: result.paging,
      message: \`Retrieved \${result.data?.length || 0} comments\`
    };
  } catch (error) {
    return {
      success: false,
      message: \`Error getting post comments: \${error instanceof Error ? error.message : 'Unknown error'}\`
    };
  }
};
`;

// 2. Fix getNumberOfComments similarly
const fixGetNumberOfComments = `
export const getNumberOfComments = async (userId: string, postId: string) => {
  try {
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    // Try user token first
    let response = await fetch(
      \`https://graph.facebook.com/v23.0/\${postId}?fields=comments.summary(true)&access_token=\${session.credentials.facebookAccessToken}\`
    );
    let result: any = await response.json();
    
    // If failed, try page token
    if (result.error && result.error.message.includes('OAuth')) {
      const pageId = postId.split('_')[0];
      const pageAccessToken = await getPageAccessToken(userId, pageId);
      if (pageAccessToken) {
        response = await fetch(
          \`https://graph.facebook.com/v23.0/\${postId}?fields=comments.summary(true)&access_token=\${pageAccessToken}\`
        );
        result = await response.json();
      }
    }
    
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

// All fixes ready for deployment
console.log('All remaining fixes prepared');
