import { getAdAccountForUser } from '../config.js';

// Helper function to get page access token
async function getPageAccessToken(userId: string, pageId: string): Promise<string | null> {
  try {
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    if (!session) return null;

    // Get page access token from stored pages or fetch it
    const pagesResult = await getUserFacebookPages(session.credentials.facebookAccessToken);
    if (pagesResult.success && pagesResult.pages) {
      const page = pagesResult.pages.find((p: any) => p.id === pageId);
      return page?.access_token || null;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Helper to get user's Facebook pages
async function getUserFacebookPages(accessToken: string): Promise<any> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v23.0/me/accounts?fields=id,name,access_token,category&access_token=${accessToken}`
    );
    const data: any = await response.json();
    
    if (data.error) {
      return { success: false, error: data.error.message };
    }
    
    return { success: true, pages: data.data || [] };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Post to Facebook Page
export const postToFacebook = async (
  userId: string,
  pageId: string,
  message: string,
  link?: string,
  published?: boolean
) => {
  try {
    const pageAccessToken = await getPageAccessToken(userId, pageId);
    if (!pageAccessToken) {
      return { success: false, message: 'Failed to get page access token' };
    }

    const params: any = { message, access_token: pageAccessToken };
    if (link) params.link = link;
    if (published !== undefined) params.published = published;

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${pageId}/feed`,
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
      postId: result.id,
      message: 'Post created successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error posting to Facebook: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Reply to a comment
export const replyToComment = async (
  userId: string,
  commentId: string,
  message: string
) => {
  try {
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${commentId}/comments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          access_token: session.credentials.facebookAccessToken
        })
      }
    );

    const result: any = await response.json();
    
    if (result.error) {
      return { success: false, message: result.error.message };
    }

    return {
      success: true,
      commentId: result.id,
      message: 'Reply posted successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error replying to comment: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Get page posts
export const getPagePosts = async (
  userId: string,
  pageId: string,
  limit: number = 25
) => {
  try {
    const pageAccessToken = await getPageAccessToken(userId, pageId);
    if (!pageAccessToken) {
      return { success: false, message: 'Failed to get page access token' };
    }

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${pageId}/posts?fields=id,message,created_time,from,shares,reactions.summary(true),comments.summary(true)&limit=${limit}&access_token=${pageAccessToken}`
    );

    const result: any = await response.json();
    
    if (result.error) {
      return { success: false, message: result.error.message };
    }

    return {
      success: true,
      posts: result.data || [],
      paging: result.paging,
      message: `Retrieved ${result.data?.length || 0} posts`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error getting page posts: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Get post comments
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

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${postId}/comments?fields=id,message,from,created_time,like_count,comment_count&limit=${limit}&access_token=${session.credentials.facebookAccessToken}`
    );

    const result: any = await response.json();
    
    if (result.error) {
      return { success: false, message: result.error.message };
    }

    return {
      success: true,
      comments: result.data || [],
      paging: result.paging,
      message: `Retrieved ${result.data?.length || 0} comments`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error getting post comments: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Delete post
export const deletePost = async (userId: string, postId: string) => {
  try {
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${postId}?access_token=${session.credentials.facebookAccessToken}`,
      { method: 'DELETE' }
    );

    const result: any = await response.json();
    
    if (result.error) {
      return { success: false, message: result.error.message };
    }

    return {
      success: result.success || true,
      message: 'Post deleted successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error deleting post: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Delete comment
export const deleteComment = async (userId: string, commentId: string) => {
  try {
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${commentId}?access_token=${session.credentials.facebookAccessToken}`,
      { method: 'DELETE' }
    );

    const result: any = await response.json();
    
    if (result.error) {
      return { success: false, message: result.error.message };
    }

    return {
      success: result.success || true,
      message: 'Comment deleted successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error deleting comment: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Filter negative comments
export const filterNegativeComments = async (
  userId: string,
  postId: string,
  keywords: string[] = ['spam', 'scam', 'fake', 'hate', 'terrible', 'worst']
) => {
  try {
    const commentsResult = await getPostComments(userId, postId, 100);
    
    if (!commentsResult.success) {
      return commentsResult;
    }

    const negativeComments = commentsResult.comments.filter((comment: any) => {
      const lowerMessage = comment.message?.toLowerCase() || '';
      return keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
    });

    return {
      success: true,
      negativeComments,
      totalComments: commentsResult.comments.length,
      negativeCount: negativeComments.length,
      keywords: keywords,
      message: `Found ${negativeComments.length} negative comments out of ${commentsResult.comments.length} total`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error filtering comments: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Get post metrics
export const getPostMetrics = async (userId: string, postId: string) => {
  try {
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${postId}?fields=reactions.summary(true),comments.summary(true),shares,insights.metric(post_impressions,post_impressions_unique,post_impressions_paid,post_impressions_organic,post_engaged_users,post_clicks)&access_token=${session.credentials.facebookAccessToken}`
    );

    const result: any = await response.json();
    
    if (result.error) {
      return { success: false, message: result.error.message };
    }

    // Extract insights data
    const insights: any = {};
    if (result.insights?.data) {
      result.insights.data.forEach((metric: any) => {
        insights[metric.name] = metric.values?.[0]?.value || 0;
      });
    }

    return {
      success: true,
      postId,
      metrics: {
        likes: result.reactions?.summary?.total_count || 0,
        comments: result.comments?.summary?.total_count || 0,
        shares: result.shares?.count || 0,
        impressions: insights.post_impressions || 0,
        impressionsUnique: insights.post_impressions_unique || 0,
        impressionsPaid: insights.post_impressions_paid || 0,
        impressionsOrganic: insights.post_impressions_organic || 0,
        engagedUsers: insights.post_engaged_users || 0,
        clicks: insights.post_clicks || 0
      },
      message: 'Post metrics retrieved successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error getting post metrics: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Post image to Facebook
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

    const params: any = {
      url: imageUrl,
      access_token: pageAccessToken
    };
    if (caption) params.caption = caption;

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${pageId}/photos`,
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
      postId: result.post_id,
      photoId: result.id,
      message: 'Image posted successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error posting image: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Schedule post
export const schedulePost = async (
  userId: string,
  pageId: string,
  message: string,
  scheduledTime: number | string, // Unix timestamp or ISO string
  link?: string
) => {
  try {
    const pageAccessToken = await getPageAccessToken(userId, pageId);
    if (!pageAccessToken) {
      return { success: false, message: 'Failed to get page access token' };
    }

    // Handle Malaysia timezone (UTC+8) scheduling
    let timestamp: number;
    
    if (typeof scheduledTime === 'string') {
      // Check if it's already a Unix timestamp string
      if (/^\d{10}$/.test(scheduledTime)) {
        timestamp = parseInt(scheduledTime);
      } else {
        // Parse ISO string and convert to Unix timestamp
        const date = new Date(scheduledTime);
        timestamp = Math.floor(date.getTime() / 1000);
      }
    } else if (typeof scheduledTime === 'number') {
      timestamp = scheduledTime;
    } else {
      return {
        success: false,
        message: 'Invalid scheduledTime format. Use Unix timestamp (number) or ISO string'
      };
    }

    // Validate timestamp is in the future (at least 10 minutes from now)
    const now = Math.floor(Date.now() / 1000);
    const minFutureTime = now + (10 * 60); // 10 minutes from now
    const maxFutureTime = now + (6 * 30 * 24 * 60 * 60); // 6 months from now

    if (timestamp < minFutureTime) {
      return {
        success: false,
        message: `Scheduled time must be at least 10 minutes in the future. Minimum time: ${new Date(minFutureTime * 1000).toISOString()}`
      };
    }

    if (timestamp > maxFutureTime) {
      return {
        success: false,
        message: 'Scheduled time cannot be more than 6 months in the future'
      };
    }

    const params: any = {
      message,
      published: false,
      scheduled_publish_time: timestamp,
      access_token: pageAccessToken
    };
    if (link) params.link = link;

    console.log(`🇲🇾 Scheduling post for Malaysia timezone - Timestamp: ${timestamp}, Date: ${new Date(timestamp * 1000).toISOString()}`);

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${pageId}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      }
    );

    const data: any = await response.json();
    if (data.error) {
      return { 
        success: false, 
        message: `Error scheduling post: ${data.error.message}`,
        error: data.error
      };
    }

    return {
      success: true,
      postId: data.id,
      scheduledTime: new Date(timestamp * 1000).toISOString(),
      scheduledTimestamp: timestamp,
      message: 'Post scheduled successfully',
      malaysiaTime: new Date(timestamp * 1000).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })
    };

  } catch (error: any) {
    return {
      success: false,
      message: `Error scheduling post: ${error.message}`
    };
  }
};

// Update post
export const updatePost = async (
  userId: string,
  postId: string,
  message: string
) => {
  try {
    const { userSessionManager } = await import('../config.js');
    const session = userSessionManager.getSession(userId);
    if (!session) {
      throw new Error('User session not found');
    }

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${postId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          access_token: session.credentials.facebookAccessToken
        })
      }
    );

    const result: any = await response.json();
    
    if (result.error) {
      return { success: false, message: result.error.message };
    }

    return {
      success: result.success || true,
      message: 'Post updated successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error updating post: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Get page fan count
export const getPageFanCount = async (userId: string, pageId: string) => {
  try {
    const pageAccessToken = await getPageAccessToken(userId, pageId);
    if (!pageAccessToken) {
      return { success: false, message: 'Failed to get page access token' };
    }

    const response = await fetch(
      `https://graph.facebook.com/v23.0/${pageId}?fields=fan_count,name&access_token=${pageAccessToken}`
    );

    const result: any = await response.json();
    
    if (result.error) {
      return { success: false, message: result.error.message };
    }

    return {
      success: true,
      pageId,
      pageName: result.name,
      fanCount: result.fan_count || 0,
      message: `Page has ${result.fan_count || 0} fans`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error getting fan count: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Get top commenters
export const getPostTopCommenters = async (
  userId: string,
  postId: string,
  limit: number = 10
) => {
  try {
    const commentsResult = await getPostComments(userId, postId, 100);
    
    if (!commentsResult.success) {
      return commentsResult;
    }

    // Count comments by user
    const commenterCounts: { [key: string]: { name: string; count: number; userId: string } } = {};
    
    commentsResult.comments.forEach((comment: any) => {
      const userId = comment.from?.id;
      const userName = comment.from?.name || 'Unknown User';
      
      if (userId) {
        if (!commenterCounts[userId]) {
          commenterCounts[userId] = { name: userName, count: 0, userId };
        }
        commenterCounts[userId].count++;
      }
    });

    // Sort by count and get top commenters
    const topCommenters = Object.values(commenterCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return {
      success: true,
      topCommenters,
      totalComments: commentsResult.comments.length,
      uniqueCommenters: Object.keys(commenterCounts).length,
      message: `Found ${topCommenters.length} top commenters`
    };
  } catch (error) { else if (typeof scheduledTime === 'number') {
        timestamp = scheduledTime;
      } else {
        return {
          success: false,
          message: 'Invalid scheduledTime format. Use Unix timestamp (number) or ISO string'
        };
      }

      // Validate timestamp is in the future (at least 10 minutes from now)
      const now = Math.floor(Date.now() / 1000);
      const minFutureTime = now + (10 * 60); // 10 minutes from now
      const maxFutureTime = now + (6 * 30 * 24 * 60 * 60); // 6 months from now

      if (timestamp < minFutureTime) {
        return {
          success: false,
          message: `Scheduled time must be at least 10 minutes in the future. Minimum time: ${new Date(minFutureTime * 1000).toISOString()}`
        };
      }

      if (timestamp > maxFutureTime) {
        return {
          success: false,
          message: 'Scheduled time cannot be more than 6 months in the future'
        };
      }

      // Prepare the post data
      const postData: any = {
        message,
        published: false,
        scheduled_publish_time: timestamp
      };

      if (link) {
        postData.link = link;
      }

      console.log(`🇲🇾 Scheduling post for Malaysia timezone - Timestamp: ${timestamp}, Date: ${new Date(timestamp * 1000).toISOString()}`);

      // Make the API call to schedule the post
      const response = await fetch(`https://graph.facebook.com/v23.0/${pageId}/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...postData,
          access_token: pageAccessToken
        })
      });

      const result = await response.json();

      if (result.error) {
        return {
          success: false,
          message: `Error scheduling post: ${result.error.message}`,
          error: result.error
        };
      }

      return {
        success: true,
        postId: result.id,
        scheduledTime: new Date(timestamp * 1000).toISOString(),
        scheduledTimestamp: timestamp,
        message: 'Post scheduled successfully',
        malaysiaTime: new Date(timestamp * 1000).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Error scheduling post: ${error.message}`
      };
    }
  };
        }

        return {
          success: true,
          scheduledPosts: altResult.data || [],
          message: `Found ${(altResult.data || []).length} scheduled posts (via alternative endpoint)`,
          endpoint: 'feed_alternative'
        };
      }

      // Filter for actually scheduled posts
      const scheduledPosts = (result.data || []).filter(post => 
        post.scheduled_publish_time && 
        new Date(post.scheduled_publish_time) > new Date()
      );

      return {
        success: true,
        scheduledPosts: scheduledPosts,
        totalScheduled: scheduledPosts.length,
        message: `Found ${scheduledPosts.length} scheduled posts`,
        endpoint: 'promotable_posts'
      };

    } catch (error: any) {
      console.log('❌ get_scheduled_posts error:', error.message);
      return {
        success: false,
        error: `Error retrieving scheduled posts: ${error.message}`,
        suggestion: 'Check if the page access token has the required permissions: pages_read_engagement, pages_read_user_content'
      };
    }
  }

  return {
      success: false,
      message: `Error getting top commenters: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};
