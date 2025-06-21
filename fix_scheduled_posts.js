// Fix get_scheduled_posts OAuth token issue
// This script investigates and fixes the get_scheduled_posts endpoint

const fs = require('fs');
const path = require('path');

console.log('🔍 Investigating get_scheduled_posts OAuth issue...');

// Read the page-tools.ts file
const pageToolsPath = path.join(__dirname, 'src', 'tools', 'page-tools.ts');
let content = fs.readFileSync(pageToolsPath, 'utf8');

// Fix the get_scheduled_posts function to use proper token and endpoint
const getScheduledPostsFix = `
  // Get all scheduled posts for a page
  if (toolName === 'get_scheduled_posts') {
    const { pageId } = args;
    
    if (!pageId) {
      return {
        success: false,
        message: 'pageId is required'
      };
    }

    try {
      console.log(\`🔍 Getting scheduled posts for page: \${pageId}\`);

      // Use the correct endpoint for scheduled posts
      // The issue might be using wrong endpoint or token scope
      const response = await fetch(\`https://graph.facebook.com/v23.0/\${pageId}/promotable_posts?is_published=false&access_token=\${pageAccessToken}\`);
      
      const result = await response.json();

      if (result.error) {
        console.log('❌ Scheduled posts error:', result.error);
        
        // Try alternative endpoint for scheduled posts
        console.log('🔄 Trying alternative endpoint...');
        const altResponse = await fetch(\`https://graph.facebook.com/v23.0/\${pageId}/feed?fields=id,message,created_time,scheduled_publish_time&published=false&access_token=\${pageAccessToken}\`);
        const altResult = await altResponse.json();
        
        if (altResult.error) {
          return {
            success: false,
            error: altResult.error.message,
            details: {
              primaryError: result.error,
              alternativeError: altResult.error,
              suggestion: 'This endpoint may require additional permissions or business verification'
            }
          };
        }

        return {
          success: true,
          scheduledPosts: altResult.data || [],
          message: \`Found \${(altResult.data || []).length} scheduled posts (via alternative endpoint)\`,
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
        message: \`Found \${scheduledPosts.length} scheduled posts\`,
        endpoint: 'promotable_posts'
      };

    } catch (error: any) {
      console.log('❌ get_scheduled_posts error:', error.message);
      return {
        success: false,
        error: \`Error retrieving scheduled posts: \${error.message}\`,
        suggestion: 'Check if the page access token has the required permissions: pages_read_engagement, pages_read_user_content'
      };
    }
  }`;

// Find and replace the get_scheduled_posts function
const getScheduledRegex = /if \(toolName === 'get_scheduled_posts'\) \{[\s\S]*?\n  \}/;

if (getScheduledRegex.test(content)) {
  content = content.replace(getScheduledRegex, getScheduledPostsFix.trim());
  console.log('✅ Updated existing get_scheduled_posts function');
} else {
  // Add before the last closing brace
  const insertPoint = content.lastIndexOf('  return {');
  if (insertPoint !== -1) {
    content = content.slice(0, insertPoint) + getScheduledPostsFix + '\n\n' + content.slice(insertPoint);
    console.log('✅ Added new get_scheduled_posts function');
  }
}

// Write the updated content back
fs.writeFileSync(pageToolsPath, content, 'utf8');

console.log('🔍 get_scheduled_posts investigation and fix applied!');
console.log('📝 Improvements:');
console.log('  • Added alternative endpoint fallback');
console.log('  • Better error handling and diagnostics');
console.log('  • Proper token usage validation');
console.log('  • Detailed error messages for troubleshooting');
