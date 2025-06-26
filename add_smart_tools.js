// Add smart token versions of the 5 key tools
const fs = require('fs');
const path = require('path');

console.log('🔧 Adding smart token versions of the 5 key tools...');

const filePath = path.join(__dirname, 'src', 'tools', 'page-tools.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Add smart versions of the 5 tools
const smartTools = `
// SMART TOKEN VERSIONS - Auto fallback between user and page tokens

// 1. Smart get_post_comments
export const getPostCommentsSmart = async (
  userId: string,
  postId: string,
  limit: number = 25
) => {
  try {
    const result = await smartApiCall(
      userId, 
      postId, 
      \`\${postId}/comments?fields=id,message,from,created_time,like_count,comment_count&limit=\${limit}\`
    );
    
    if (!result.success) {
      return { success: false, message: result.message };
    }
    
    return {
      success: true,
      comments: result.data?.data || [],
      paging: result.data?.paging,
      message: \`Retrieved \${result.data?.data?.length || 0} comments\`,
      tool: 'get_post_comments_smart'
    };
  } catch (error) {
    return {
      success: false,
      message: \`Error getting post comments: \${error instanceof Error ? error.message : 'Unknown error'}\`,
      tool: 'get_post_comments_smart'
    };
  }
};

// 2. Smart get_number_of_comments  
export const getNumberOfCommentsSmart = async (userId: string, postId: string) => {
  try {
    const result = await smartApiCall(
      userId,
      postId,
      \`\${postId}?fields=comments.summary(true)\`
    );
    
    if (!result.success) {
      return { success: false, message: result.message };
    }
    
    return {
      success: true,
      postId,
      commentCount: result.data?.comments?.summary?.total_count || 0,
      message: \`Post has \${result.data?.comments?.summary?.total_count || 0} comments\`,
      tool: 'get_number_of_comments_smart'
    };
  } catch (error) {
    return {
      success: false,
      message: \`Error getting comment count: \${error instanceof Error ? error.message : 'Unknown error'}\`,
      tool: 'get_number_of_comments_smart'
    };
  }
};

// 3. Smart get_number_of_likes
export const getNumberOfLikesSmart = async (userId: string, postId: string) => {
  try {
    const result = await smartApiCall(
      userId,
      postId,
      \`\${postId}?fields=reactions.summary(true)\`
    );
    
    if (!result.success) {
      return { success: false, message: result.message };
    }
    
    return {
      success: true,
      postId,
      likeCount: result.data?.reactions?.summary?.total_count || 0,
      message: \`Post has \${result.data?.reactions?.summary?.total_count || 0} likes\`,
      tool: 'get_number_of_likes_smart'
    };
  } catch (error) {
    return {
      success: false,
      message: \`Error getting like count: \${error instanceof Error ? error.message : 'Unknown error'}\`,
      tool: 'get_number_of_likes_smart'
    };
  }
};

// 4. Smart reply_to_comment  
export const replyToCommentSmart = async (
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
};

// 5. Smart delete_comment
export const deleteCommentSmart = async (userId: string, commentId: string) => {
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
};
`;

// Add the smart tools before the alias function
content = content.replace(
  '// Alias for delete_comment',
  smartTools + '\n// Alias for delete_comment'
);

fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Added 5 smart token tools');
console.log('📋 Tools automatically try user token first, then page token');
console.log('🔧 Added: getPostCommentsSmart, getNumberOfCommentsSmart, getNumberOfLikesSmart, replyToCommentSmart, deleteCommentSmart');
