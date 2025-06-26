// Manual fix for smart token functions
export const replyToCommentSmart = async (
  userId: string,
  commentId: string,
  message: string
) => {
  try {
    // Enhanced smart token approach - try page tokens for current user
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    
    if (session) {
      const userToken = session.credentials.facebookAccessToken;
      
      try {
        const pagesResult = await getUserFacebookPages(userToken);
        if (pagesResult.success && pagesResult.pages) {
          for (const page of pagesResult.pages) {
            if (page.access_token) {
              try {
                const pageUrl = `https://graph.facebook.com/v23.0/${commentId}/comments?access_token=${page.access_token}`;
                const pageOptions = {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ message })
                };
                
                const pageResponse = await fetch(pageUrl, pageOptions);
                const pageData = await pageResponse.json() as FacebookApiResponse;
                
                if (!pageData.error) {
                  return { 
                    success: true, 
                    data: pageData,
                    commentId,
                    replyId: pageData.id,
                    message: 'Reply posted successfully using smart page token',
                    tool: 'reply_to_comment_smart'
                  };
                }
              } catch (pageError) {
                // Continue to next page token
              }
            }
          }
        }
      } catch (pagesError) {
        // Continue to fallback
      }
    }
    
    // Original method as fallback
    const result = await smartApiCall(
      userId,
      commentId,
      `${commentId}/comments`,
      'POST',
      { message }
    );
    
    if (!result.success) {
      return { success: false, message: `Smart token and fallback failed: ${result.message}`, tool: 'reply_to_comment_smart' };
    }
    
    return {
      success: true,
      commentId: result.data?.id,
      message: 'Reply posted successfully using fallback method',
      tool: 'reply_to_comment_smart'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error replying to comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tool: 'reply_to_comment_smart'
    };
  }
};

export const deleteCommentSmart = async (userId: string, commentId: string) => {
  try {
    // Enhanced smart token approach - try page tokens for current user
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    
    if (session) {
      const userToken = session.credentials.facebookAccessToken;
      
      try {
        const pagesResult = await getUserFacebookPages(userToken);
        if (pagesResult.success && pagesResult.pages) {
          for (const page of pagesResult.pages) {
            if (page.access_token) {
              try {
                const pageUrl = `https://graph.facebook.com/v23.0/${commentId}?access_token=${page.access_token}`;
                const pageOptions = { method: 'DELETE' };
                
                const pageResponse = await fetch(pageUrl, pageOptions);
                const pageData = await pageResponse.json() as FacebookApiResponse;
                
                if (!pageData.error) {
                  return { 
                    success: true, 
                    data: pageData,
                    commentId,
                    message: 'Comment deleted successfully using smart page token',
                    tool: 'delete_comment_smart'
                  };
                }
              } catch (pageError) {
                // Continue to next page token
              }
            }
          }
        }
      } catch (pagesError) {
        // Continue to fallback
      }
    }
    
    // Original method as fallback
    const result = await smartApiCall(
      userId,
      commentId,
      commentId,
      'DELETE'
    );
    
    if (!result.success) {
      return { success: false, message: `Smart token and fallback failed: ${result.message}`, tool: 'delete_comment_smart' };
    }
    
    return {
      success: true,
      message: 'Comment deleted successfully using fallback method',
      tool: 'delete_comment_smart'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error deleting comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tool: 'delete_comment_smart'
    };
  }
};
