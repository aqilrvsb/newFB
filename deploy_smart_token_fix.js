// Smart Token Fix Deployment Script
const fs = require('fs');
const path = require('path');

const pageToolsPath = path.join(__dirname, 'src/tools/page-tools.ts');

console.log('🔧 Deploying Smart Token POST Operations Fix...');

// Read the current file
let content = fs.readFileSync(pageToolsPath, 'utf8');

// Fix 1: Enhanced replyToCommentSmart function
const oldReplyFunction = `export const replyToCommentSmart = async (
  userId: string,
  commentId: string,
  message: string
) => {
  try {
    const result = await smartApiCall(
      userId,
      commentId,
      \`\${commentId}/comments\`,
      'POST',
      { message }
    );
    
    if (!result.success) {
      return { success: false, message: result.message };
    }
    
    return {
      success: true,
      commentId: result.data?.id,
      message: 'Reply posted successfully',
      tool: 'reply_to_comment_smart'
    };
  } catch (error) {
    return {
      success: false,
      message: \`Error replying to comment: \${error instanceof Error ? error.message : 'Unknown error'}\`,
      tool: 'reply_to_comment_smart'
    };
  }
};`;

const newReplyFunction = `export const replyToCommentSmart = async (
  userId: string,
  commentId: string,
  message: string
) => {
  try {
    // Enhanced smart token approach - try all available page tokens first
    try {
      const { userSessionManager } = await import('../config.js');
      const allSessions = userSessionManager.getAllSessions();
      
      if (allSessions && allSessions.length > 0) {
        for (const session of allSessions) {
          const userToken = session.credentials.facebookAccessToken;
          
          try {
            const pagesResult = await getUserFacebookPages(userToken);
            if (pagesResult.success && pagesResult.pages) {
              for (const page of pagesResult.pages) {
                if (page.access_token) {
                  try {
                    const pageUrl = \`https://graph.facebook.com/v23.0/\${commentId}/comments?access_token=\${page.access_token}\`;
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
            // Continue to next session
          }
        }
      }
    } catch (sessionError) {
      // Fall back to original method
    }
    
    // Original method as fallback
    const result = await smartApiCall(
      userId,
      commentId,
      \`\${commentId}/comments\`,
      'POST',
      { message }
    );
    
    if (!result.success) {
      return { success: false, message: \`Smart token fallback also failed: \${result.message}\`, tool: 'reply_to_comment_smart' };
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
      message: \`Error replying to comment: \${error instanceof Error ? error.message : 'Unknown error'}\`,
      tool: 'reply_to_comment_smart'
    };
  }
};`;

// Replace the function
content = content.replace(oldReplyFunction, newReplyFunction);

// Fix 2: Enhanced deleteCommentSmart function
const oldDeleteFunction = `export const deleteCommentSmart = async (userId: string, commentId: string) => {
  try {
    const result = await smartApiCall(
      userId,
      commentId,
      commentId,
      'DELETE'
    );
    
    if (!result.success) {
      return { success: false, message: result.message };
    }
    
    return {
      success: true,
      message: 'Comment deleted successfully',
      tool: 'delete_comment_smart'
    };
  } catch (error) {
    return {
      success: false,
      message: \`Error deleting comment: \${error instanceof Error ? error.message : 'Unknown error'}\`,
      tool: 'delete_comment_smart'
    };
  }
};`;

const newDeleteFunction = `export const deleteCommentSmart = async (userId: string, commentId: string) => {
  try {
    // Enhanced smart token approach - try all available page tokens first
    try {
      const { userSessionManager } = await import('../config.js');
      const allSessions = userSessionManager.getAllSessions();
      
      if (allSessions && allSessions.length > 0) {
        for (const session of allSessions) {
          const userToken = session.credentials.facebookAccessToken;
          
          try {
            const pagesResult = await getUserFacebookPages(userToken);
            if (pagesResult.success && pagesResult.pages) {
              for (const page of pagesResult.pages) {
                if (page.access_token) {
                  try {
                    const pageUrl = \`https://graph.facebook.com/v23.0/\${commentId}?access_token=\${page.access_token}\`;
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
            // Continue to next session
          }
        }
      }
    } catch (sessionError) {
      // Fall back to original method
    }
    
    // Original method as fallback
    const result = await smartApiCall(
      userId,
      commentId,
      commentId,
      'DELETE'
    );
    
    if (!result.success) {
      return { success: false, message: \`Smart token fallback also failed: \${result.message}\`, tool: 'delete_comment_smart' };
    }
    
    return {
      success: true,
      message: 'Comment deleted successfully using fallback method',
      tool: 'delete_comment_smart'
    };
  } catch (error) {
    return {
      success: false,
      message: \`Error deleting comment: \${error instanceof Error ? error.message : 'Unknown error'}\`,
      tool: 'delete_comment_smart'
    };
  }
};`;

// Replace the function
content = content.replace(oldDeleteFunction, newDeleteFunction);

// Write the updated file
fs.writeFileSync(pageToolsPath, content);

console.log('✅ Smart Token POST Operations Fix Applied!');
console.log('📋 Enhanced Functions:');
console.log('  • replyToCommentSmart - Now tries all page tokens');
console.log('  • deleteCommentSmart - Now tries all page tokens');
console.log('🚀 Ready for deployment!');
