// Proper Fix: Update Malaysia timezone scheduling and fix get_scheduled_posts
const fs = require('fs');
const path = require('path');

console.log('🔧 PROPER FIX: Updating scheduling functions...');

// Fix 1: Update the schedulePost function in page-tools.ts
const pageToolsPath = path.join(__dirname, 'src', 'tools', 'page-tools.ts');
let pageToolsContent = fs.readFileSync(pageToolsPath, 'utf8');

// Enhanced schedulePost function with Malaysia timezone support
const enhancedSchedulePost = `export const schedulePost = async (
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
      if (/^\\d{10}$/.test(scheduledTime)) {
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
        message: \`Scheduled time must be at least 10 minutes in the future. Minimum time: \${new Date(minFutureTime * 1000).toISOString()}\`
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

    console.log(\`🇲🇾 Scheduling post for Malaysia timezone - Timestamp: \${timestamp}, Date: \${new Date(timestamp * 1000).toISOString()}\`);

    const response = await fetch(
      \`https://graph.facebook.com/v23.0/\${pageId}/feed\`,
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
        message: \`Error scheduling post: \${data.error.message}\`,
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
      message: \`Error scheduling post: \${error.message}\`
    };
  }
};`;

// Replace the existing schedulePost function
const schedulePostRegex = /export const schedulePost = async \([^}]*\} catch \(error: any\) \{[^}]*\}\s*\};/s;

if (schedulePostRegex.test(pageToolsContent)) {
  pageToolsContent = pageToolsContent.replace(schedulePostRegex, enhancedSchedulePost);
  console.log('✅ Updated existing schedulePost function');
} else {
  console.log('❌ Could not find existing schedulePost function to replace');
}

// Write the updated page-tools.ts
fs.writeFileSync(pageToolsPath, pageToolsContent, 'utf8');

// Fix 2: Update the get_scheduled_posts handling in http-server.ts
const httpServerPath = path.join(__dirname, 'src', 'http-server.ts');
let httpServerContent = fs.readFileSync(httpServerPath, 'utf8');

// Enhanced get_scheduled_posts with better error handling
const enhancedGetScheduledPosts = \`case 'get_scheduled_posts':
        try {
          const { userSessionManager } = await import('./config.js');
          const session = userSessionManager.getSession(userId);
          if (!session) throw new Error('User session not found');
          
          console.log(\`🔍 Getting scheduled posts for page: \${args.pageId}\`);

          // Try the primary endpoint for scheduled posts
          const response = await fetch(
            \`https://graph.facebook.com/v23.0/\${args.pageId}/promotable_posts?is_published=false&access_token=\${session.credentials.facebookAccessToken}\`
          );
          const data: any = await response.json();
          
          if (data.error) {
            console.log('❌ Primary endpoint failed, trying alternative...');
            
            // Try alternative endpoint
            const altResponse = await fetch(
              \`https://graph.facebook.com/v23.0/\${args.pageId}/feed?fields=id,message,created_time,scheduled_publish_time&published=false&access_token=\${session.credentials.facebookAccessToken}\`
            );
            const altData: any = await altResponse.json();
            
            if (altData.error) {
              return {
                success: false,
                error: altData.error.message,
                details: {
                  primaryError: data.error,
                  alternativeError: altData.error,
                  suggestion: 'This endpoint may require additional permissions: pages_read_engagement, pages_read_user_content'
                },
                tool: toolName
              };
            }

            const scheduledPosts = (altData.data || []).filter((post: any) => 
              post.scheduled_publish_time && 
              new Date(post.scheduled_publish_time) > new Date()
            );

            return {
              success: true,
              scheduledPosts,
              totalScheduled: scheduledPosts.length,
              message: \`Found \${scheduledPosts.length} scheduled posts (via alternative endpoint)\`,
              endpoint: 'feed_alternative',
              tool: toolName
            };
          }

          // Filter for actually scheduled posts from primary endpoint
          const scheduledPosts = (data.data || []).filter((post: any) => 
            post.scheduled_publish_time && 
            new Date(post.scheduled_publish_time) > new Date()
          );

          return {
            success: true,
            scheduledPosts,
            totalScheduled: scheduledPosts.length,
            message: \`Found \${scheduledPosts.length} scheduled posts\`,
            endpoint: 'promotable_posts',
            tool: toolName
          };

        } catch (error) {
          console.log('❌ get_scheduled_posts error:', error);
          return {
            success: false,
            error: \`Error retrieving scheduled posts: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            suggestion: 'Check if the page access token has the required permissions',
            tool: toolName
          };
        }\`;

// Replace the existing get_scheduled_posts case
const getScheduledRegex = /case 'get_scheduled_posts':[^}]*\} catch \(error\) \{[^}]*\}\s*break;/s;

if (getScheduledRegex.test(httpServerContent)) {
  httpServerContent = httpServerContent.replace(getScheduledRegex, enhancedGetScheduledPosts + '\\n        break;');
  console.log('✅ Updated existing get_scheduled_posts case');
} else {
  console.log('❌ Could not find existing get_scheduled_posts case to replace');
}

// Write the updated http-server.ts
fs.writeFileSync(httpServerPath, httpServerContent, 'utf8');

console.log('✅ PROPER FIX COMPLETED!');
console.log('📝 Changes made:');
console.log('  • Enhanced schedulePost with Malaysia timezone support');
console.log('  • Fixed get_scheduled_posts with better error handling');
console.log('  • Added proper TypeScript types');
console.log('  • Included fallback endpoints');
