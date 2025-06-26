import { getAdAccountForUser, userSessionManager } from '../config.js';

const { FacebookAdsApi, Page, User } = require('facebook-nodejs-business-sdk');

// Helper to get page access token
async function getPageAccessToken(userId: string, pageId: string): Promise<string | null> {
  try {
    const pages = await getUserFacebookPages(userId);
    if (!pages.success || !pages.pages) return null;
    
    const page = pages.pages.find((p: any) => p.id === pageId);
    return page?.access_token || null;
  } catch (error) {
    console.error('Error getting page access token:', error);
    return null;
  }
}

// Get user's Facebook pages using SDK
export async function getUserFacebookPages(userId: string): Promise<any> {
  try {
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    if (!session) {
      return { success: false, error: 'User session not found' };
    }

    FacebookAdsApi.init(session.credentials.facebookAccessToken);
    
    const user = new User('me');
    const pages = await user.getAccounts([
      'id', 'name', 'access_token', 'category', 'tasks'
    ]);
    
    return { 
      success: true, 
      pages: Array.isArray(pages) ? pages : [],
      result: { pages: Array.isArray(pages) ? pages : [] }
    };
  } catch (error) {
    console.error('Error getting Facebook pages:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getPageDetails(userId: string, pageId: string) {
  try {
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    if (!session) {
      return { success: false, message: 'User session not found' };
    }

    // Try page token first, then user token
    const pageToken = await getPageAccessToken(userId, pageId);
    const token = pageToken || session.credentials.facebookAccessToken;
    
    FacebookAdsApi.init(token);
    
    const page = new Page(pageId);
    const fields = ['id', 'name', 'category', 'fan_count', 'picture', 'cover', 'about'];
    const details = await page.get(fields);
    
    return {
      success: true,
      page: details
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function createPagePost(userId: string, pageId: string, message: string, link?: string, published = true) {
  try {
    const pageToken = await getPageAccessToken(userId, pageId);
    if (!pageToken) {
      return { success: false, message: 'Failed to get page access token' };
    }
    
    FacebookAdsApi.init(pageToken);
    
    const page = new Page(pageId);
    const params: any = { message, published };
    if (link) params.link = link;
    
    const post = await page.createFeed(['id'], params);
    
    return {
      success: true,
      postId: post.id,
      message: 'Post created successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getPagePosts(userId: string, pageId: string, limit = 25) {
  try {
    const pageToken = await getPageAccessToken(userId, pageId);
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    if (!session) {
      return { success: false, message: 'User session not found' };
    }
    
    const token = pageToken || session.credentials.facebookAccessToken;
    FacebookAdsApi.init(token);
    
    const page = new Page(pageId);
    const posts = await page.getFeed(
      ['id', 'message', 'created_time', 'likes.summary(true)', 'comments.summary(true)'],
      { limit }
    );
    
    return {
      success: true,
      posts: posts.map((post: any) => ({
        id: post.id,
        message: post.message,
        created_time: post.created_time,
        likes_count: post.likes?.summary?.total_count || 0,
        comments_count: post.comments?.summary?.total_count || 0
      }))
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function updatePagePost(userId: string, postId: string, message: string) {
  try {
    const pageId = postId.split('_')[0];
    const pageToken = await getPageAccessToken(userId, pageId);
    if (!pageToken) {
      return { success: false, message: 'Failed to get page access token' };
    }
    
    FacebookAdsApi.init(pageToken);
    
    // Note: Facebook doesn't allow editing posts via API anymore
    // This is a limitation of Facebook, not our implementation
    return {
      success: false,
      message: 'Facebook no longer allows editing posts via API'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function deletePagePost(userId: string, postId: string) {
  try {
    const pageId = postId.split('_')[0];
    const pageToken = await getPageAccessToken(userId, pageId);
    if (!pageToken) {
      return { success: false, message: 'Failed to get page access token' };
    }
    
    FacebookAdsApi.init(pageToken);
    
    // Use the Graph API SDK to delete
    const Post = require('facebook-nodejs-business-sdk').Post || Page;
    const post = new Post(postId);
    await post.delete();
    
    return {
      success: true,
      message: 'Post deleted successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getPageInsights(userId: string, pageId: string, metrics?: string[], period = 'day') {
  try {
    const pageToken = await getPageAccessToken(userId, pageId);
    if (!pageToken) {
      return { success: false, message: 'Failed to get page access token' };
    }
    
    FacebookAdsApi.init(pageToken);
    
    const page = new Page(pageId);
    const defaultMetrics = metrics || ['page_impressions', 'page_engaged_users', 'page_fans'];
    
    const insights = await page.getInsights(
      defaultMetrics,
      { period }
    );
    
    return {
      success: true,
      insights: insights
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getPageFanCount(userId: string, pageId: string) {
  try {
    const result = await getPageDetails(userId, pageId);
    if (!result.success) {
      return result;
    }
    
    return {
      success: true,
      fanCount: result.page?.fan_count || 0,
      pageName: result.page?.name || 'Unknown'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getPostComments(userId: string, postId: string, limit = 25) {
  try {
    const pageId = postId.split('_')[0];
    const pageToken = await getPageAccessToken(userId, pageId);
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    if (!session) {
      return { success: false, message: 'User session not found' };
    }
    
    const token = pageToken || session.credentials.facebookAccessToken;
    FacebookAdsApi.init(token);
    
    // Use SDK to get comments
    const { Comment } = require('facebook-nodejs-business-sdk');
    const Post = require('facebook-nodejs-business-sdk').Post || Page;
    const post = new Post(postId);
    
    const comments = await post.getComments(
      ['id', 'message', 'from', 'created_time'],
      { limit }
    );
    
    return {
      success: true,
      comments: comments.map((comment: any) => ({
        id: comment.id,
        message: comment.message,
        from: comment.from,
        created_time: comment.created_time
      }))
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function replyToComment(userId: string, commentId: string, message: string) {
  try {
    // Extract page ID from comment ID
    const pageId = commentId.split('_')[0];
    const pageToken = await getPageAccessToken(userId, pageId);
    if (!pageToken) {
      return { success: false, message: 'Failed to get page access token' };
    }
    
    FacebookAdsApi.init(pageToken);
    
    const { Comment } = require('facebook-nodejs-business-sdk');
    const comment = new Comment(commentId);
    
    const reply = await comment.createComment(
      ['id'],
      { message }
    );
    
    return {
      success: true,
      replyId: reply.id,
      message: 'Reply posted successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function deleteComment(userId: string, commentId: string) {
  try {
    const pageId = commentId.split('_')[0];
    const pageToken = await getPageAccessToken(userId, pageId);
    if (!pageToken) {
      return { success: false, message: 'Failed to get page access token' };
    }
    
    FacebookAdsApi.init(pageToken);
    
    const { Comment } = require('facebook-nodejs-business-sdk');
    const comment = new Comment(commentId);
    await comment.delete();
    
    return {
      success: true,
      message: 'Comment deleted successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Add stubs for remaining functions
export async function schedulePagePost(userId: string, pageId: string, message: string, scheduledTime: string, link?: string) {
  try {
    const pageToken = await getPageAccessToken(userId, pageId);
    if (!pageToken) {
      return { success: false, message: 'Failed to get page access token' };
    }
    
    FacebookAdsApi.init(pageToken);
    
    const page = new Page(pageId);
    const params: any = { 
      message, 
      published: false,
      scheduled_publish_time: Math.floor(new Date(scheduledTime).getTime() / 1000)
    };
    if (link) params.link = link;
    
    const post = await page.createFeed(['id'], params);
    
    return {
      success: true,
      postId: post.id,
      message: 'Post scheduled successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getScheduledPosts(userId: string, pageId: string) {
  try {
    const pageToken = await getPageAccessToken(userId, pageId);
    if (!pageToken) {
      return { success: false, message: 'Failed to get page access token' };
    }
    
    FacebookAdsApi.init(pageToken);
    
    const page = new Page(pageId);
    const posts = await page.getFeed(
      ['id', 'message', 'created_time', 'scheduled_publish_time'],
      { limit: 100, is_published: false }
    );
    
    return {
      success: true,
      posts: posts.filter((post: any) => post.scheduled_publish_time)
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export all other functions with basic implementations
export async function publishScheduledPost(userId: string, postId: string) {
  return { success: false, message: 'Not implemented' };
}

export async function cancelScheduledPost(userId: string, postId: string) {
  return deletePagePost(userId, postId);
}

export async function getPageVideos(userId: string, pageId: string, limit = 25) {
  return { success: false, message: 'Not implemented' };
}

export async function uploadPageVideo(userId: string, pageId: string, videoUrl: string, title?: string, description?: string) {
  return { success: false, message: 'Not implemented' };
}

export async function getPageEvents(userId: string, pageId: string, timeFilter?: string) {
  return { success: false, message: 'Facebook has deprecated Events API' };
}

export async function createPageEvent(userId: string, pageId: string, name: string, startTime: string, endTime?: string, description?: string, location?: string) {
  return { success: false, message: 'Facebook has deprecated Events API' };
}

export async function updatePageEvent(userId: string, eventId: string, name?: string, startTime?: string, endTime?: string, description?: string) {
  return { success: false, message: 'Facebook has deprecated Events API' };
}

export async function deletePageEvent(userId: string, eventId: string) {
  return { success: false, message: 'Facebook has deprecated Events API' };
}

export async function deleteCommentFromPost(userId: string, commentId: string) {
  return deleteComment(userId, commentId);
}

export async function filterNegativeComments(userId: string, postId: string, keywords: string[]) {
  return { success: false, message: 'Not implemented' };
}

export async function getNumberOfComments(userId: string, postId: string) {
  try {
    const result = await getPostComments(userId, postId, 1);
    if (!result.success) return result;
    
    return {
      success: true,
      count: result.comments?.length || 0
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getNumberOfLikes(userId: string, postId: string) {
  try {
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    // Initialize SDK
    FacebookAdsApi.init(session.credentials.facebookAccessToken);
    
    // Try to get page access token if post is from a page
    const pageId = postId.split('_')[0];
    const pageAccessToken = await getPageAccessToken(userId, pageId);
    
    // Use the best available token
    const accessToken = pageAccessToken || session.credentials.facebookAccessToken;
    
    const response = await fetch(
      `https://graph.facebook.com/v23.0/${postId}?fields=reactions.summary(total_count)&access_token=${accessToken}`
    );
    
    const result = await response.json() as any;
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return {
      success: true,
      postId: postId,
      likesCount: result.reactions?.summary?.total_count || 0,
      message: 'Like count retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getPostImpressions(userId: string, postId: string) {
  return { success: false, message: 'Not implemented' };
}

export async function getPostImpressionsUnique(userId: string, postId: string) {
  return { success: false, message: 'Not implemented' };
}

export async function getPostImpressionsPaid(userId: string, postId: string) {
  return { success: false, message: 'Not implemented' };
}

export async function getPostImpressionsOrganic(userId: string, postId: string) {
  return { success: false, message: 'Not implemented' };
}

export async function getPostEngagedUsers(userId: string, postId: string) {
  return { success: false, message: 'Not implemented' };
}

export async function getPostClicks(userId: string, postId: string) {
  return { success: false, message: 'Not implemented' };
}

export async function getPostReactionsLikeTotal(userId: string, postId: string) {
  return { success: false, message: 'Not implemented' };
}

export async function getPostTopCommenters(userId: string, postId: string, limit = 10) {
  return { success: false, message: 'Not implemented' };
}

export async function postImageToFacebook(userId: string, pageId: string, imageUrl: string, caption?: string) {
  try {
    const pageToken = await getPageAccessToken(userId, pageId);
    if (!pageToken) {
      return { success: false, message: 'Failed to get page access token' };
    }
    
    FacebookAdsApi.init(pageToken);
    
    const page = new Page(pageId);
    const params: any = { url: imageUrl };
    if (caption) params.message = caption;
    
    const photo = await page.createPhoto(['id'], params);
    
    return {
      success: true,
      photoId: photo.id,
      message: 'Image posted successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getPostShareCount(userId: string, postId: string) {
  return { success: false, message: 'Not implemented' };
}

export async function sendDmToUser(userId: string, pageId: string, recipientId: string, message: string) {
  return { success: false, message: 'Not implemented' };
}
