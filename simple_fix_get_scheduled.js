// Fix get_scheduled_posts in http-server.ts
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing get_scheduled_posts in http-server.ts...');

const httpServerPath = path.join(__dirname, 'src', 'http-server.ts');
let content = fs.readFileSync(httpServerPath, 'utf8');

// Find the get_scheduled_posts case
const caseStart = "case 'get_scheduled_posts':";
const startIndex = content.indexOf(caseStart);

if (startIndex === -1) {
  console.log('❌ Could not find get_scheduled_posts case');
  process.exit(1);
}

// Find the break statement that ends this case
let endIndex = startIndex;
let depth = 0;
let inCase = false;

for (let i = startIndex; i < content.length; i++) {
  const char = content[i];
  const remaining = content.slice(i);
  
  if (remaining.startsWith('try {')) {
    inCase = true;
  }
  
  if (char === '{') {
    depth++;
  } else if (char === '}') {
    depth--;
  }
  
  // Look for the break statement at the same level
  if (inCase && depth === 0 && remaining.startsWith('break;')) {
    endIndex = i + 6; // length of 'break;'
    break;
  }
}

if (endIndex === startIndex) {
  console.log('❌ Could not find end of get_scheduled_posts case');
  process.exit(1);
}

console.log(`📍 Found get_scheduled_posts case from position ${startIndex} to ${endIndex}`);

// Create the enhanced case
const enhancedCase = `case 'get_scheduled_posts':
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
        }
        break;`;

// Replace the case
const newContent = content.slice(0, startIndex) + enhancedCase + content.slice(endIndex);

// Write the updated content
fs.writeFileSync(httpServerPath, newContent, 'utf8');

console.log('✅ Successfully updated get_scheduled_posts case!');
console.log('🔍 Enhanced error handling and fallback endpoints added');
