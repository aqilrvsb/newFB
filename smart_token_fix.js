// Fixed smart token functions - POST operations

// 4. Smart reply_to_comment - FIXED VERSION
export const replyToCommentSmart = async (commentId, message) => {
  try {
    // For comment operations, we try all available sessions
    const { userSessionManager } = await import('../config.js');
    const allSessions = userSessionManager.getAllSessions();
    
    if (!allSessions || allSessions.length === 0) {
      return { 
        success: false, 
        message: 'No user sessions found',
        tool: 'reply_to_comment_smart'
      };
    }

    // Try each session's tokens until one works
    for (const session of allSessions) {
      const userToken = session.credentials.facebookAccessToken;
      
      // Try user token first
      try {
        const userUrl = `https://graph.facebook.com/v23.0/${commentId}/comments?access_token=${userToken}`;
        const userOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        };
        
        const userResponse = await fetch(userUrl, userOptions);
        const userData = await userResponse.json();
        
        if (!userData.error) {
          return { 
            success: true, 
            data: userData,
            commentId,
            replyId: userData.id,
            message: 'Reply posted successfully using user token',
            tool: 'reply_to_comment_smart'
          };
        }
      } catch (userError) {
        // Continue to next attempt
      }

      // Try page tokens for this session
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
                const pageData = await pageResponse.json();
                
                if (!pageData.error) {
                  return { 
                    success: true, 
                    data: pageData,
                    commentId,
                    replyId: pageData.id,
                    message: 'Reply posted successfully using page token',
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
        // Continue to next session
      }
    }
    
    return { 
      success: false, 
      message: 'All available tokens failed to post reply',
      tool: 'reply_to_comment_smart'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error posting reply: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tool: 'reply_to_comment_smart'
    };
  }
};

// 5. Smart delete_comment - FIXED VERSION  
export const deleteCommentSmart = async (commentId) => {
  try {
    // For comment operations, we try all available sessions
    const { userSessionManager } = await import('../config.js');
    const allSessions = userSessionManager.getAllSessions();
    
    if (!allSessions || allSessions.length === 0) {
      return { 
        success: false, 
        message: 'No user sessions found',
        tool: 'delete_comment_smart'
      };
    }

    // Try each session's tokens until one works
    for (const session of allSessions) {
      const userToken = session.credentials.facebookAccessToken;
      
      // Try user token first
      try {
        const userUrl = `https://graph.facebook.com/v23.0/${commentId}?access_token=${userToken}`;
        const userOptions = { method: 'DELETE' };
        
        const userResponse = await fetch(userUrl, userOptions);
        const userData = await userResponse.json();
        
        if (!userData.error) {
          return { 
            success: true, 
            data: userData,
            commentId,
            message: 'Comment deleted successfully using user token',
            tool: 'delete_comment_smart'
          };
        }
      } catch (userError) {
        // Continue to next attempt
      }

      // Try page tokens for this session
      try {
        const pagesResult = await getUserFacebookPages(userToken);
        if (pagesResult.success && pagesResult.pages) {
          for (const page of pagesResult.pages) {
            if (page.access_token) {
              try {
                const pageUrl = `https://graph.facebook.com/v23.0/${commentId}?access_token=${page.access_token}`;
                const pageOptions = { method: 'DELETE' };
                
                const pageResponse = await fetch(pageUrl, pageOptions);
                const pageData = await pageResponse.json();
                
                if (!pageData.error) {
                  return { 
                    success: true, 
                    data: pageData,
                    commentId,
                    message: 'Comment deleted successfully using page token',
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
        // Continue to next session
      }
    }
    
    return { 
      success: false, 
      message: 'All available tokens failed to delete comment',
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
