const fs = require('fs');
const path = require('path');

// Read the http-server.ts file
const filePath = path.join(__dirname, 'src', 'http-server.ts');
let content = fs.readFileSync(filePath, 'utf8');

// The 17 Page Management tools to add
const pageTools = [
  `{ name: 'get_page_details', description: 'Get detailed information about a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' } }, required: ['pageId'] } }`,
  `{ name: 'create_page_post', description: 'Create a new post on a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, message: { type: 'string' }, link: { type: 'string' }, published: { type: 'boolean', default: true } }, required: ['pageId', 'message'] } }`,
  `{ name: 'update_page_post', description: 'Update an existing Facebook page post', inputSchema: { type: 'object', properties: { postId: { type: 'string' }, message: { type: 'string' } }, required: ['postId', 'message'] } }`,
  `{ name: 'delete_page_post', description: 'Delete a post from a Facebook page', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } }`,
  `{ name: 'get_page_posts', description: 'Get posts from a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, limit: { type: 'number', default: 25 } }, required: ['pageId'] } }`,
  `{ name: 'get_page_insights', description: 'Get insights and analytics for a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, metrics: { type: 'array', items: { type: 'string' } }, period: { type: 'string', enum: ['day', 'week', 'days_28', 'month', 'lifetime'] } }, required: ['pageId'] } }`,
  `{ name: 'schedule_page_post', description: 'Schedule a post for future publishing', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, message: { type: 'string' }, scheduledTime: { type: 'string' }, link: { type: 'string' } }, required: ['pageId', 'message', 'scheduledTime'] } }`,
  `{ name: 'get_scheduled_posts', description: 'Get all scheduled posts for a page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' } }, required: ['pageId'] } }`,
  `{ name: 'publish_scheduled_post', description: 'Publish a scheduled post immediately', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } }`,
  `{ name: 'cancel_scheduled_post', description: 'Cancel a scheduled post', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } }`,
  `{ name: 'get_page_videos', description: 'Get videos from a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, limit: { type: 'number', default: 25 } }, required: ['pageId'] } }`,
  `{ name: 'upload_page_video', description: 'Upload a video to a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, videoUrl: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' } }, required: ['pageId', 'videoUrl'] } }`,
  `{ name: 'get_page_events', description: 'Get events from a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, timeFilter: { type: 'string', enum: ['upcoming', 'past'] } }, required: ['pageId'] } }`,
  `{ name: 'create_page_event', description: 'Create an event on a Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, name: { type: 'string' }, startTime: { type: 'string' }, endTime: { type: 'string' }, description: { type: 'string' }, location: { type: 'string' } }, required: ['pageId', 'name', 'startTime'] } }`,
  `{ name: 'update_page_event', description: 'Update an existing page event', inputSchema: { type: 'object', properties: { eventId: { type: 'string' }, name: { type: 'string' }, startTime: { type: 'string' }, endTime: { type: 'string' }, description: { type: 'string' } }, required: ['eventId'] } }`,
  `{ name: 'delete_page_event', description: 'Delete an event from a Facebook page', inputSchema: { type: 'object', properties: { eventId: { type: 'string' } }, required: ['eventId'] } }`,
  `{ name: 'get_page_fan_count', description: 'Get the total fan/follower count for a page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' } }, required: ['pageId'] } }`
];

// Find the exact pattern and replace it
const searchPattern = /(\{ name: 'get_competitor_ads_analysis', description: 'Get competitor analysis', inputSchema: \{ type: 'object', properties: \{ competitorPageIds: \{ type: 'array', items: \{ type: 'string' \} \}, dateRange: \{ type: 'number', default: 30 \} \}, required: \['competitorPageIds'\] \} \}) (\] \} \}\)\); \} else if)/;

// Add the page tools after get_competitor_ads_analysis
const replacement = `$1, ${pageTools.join(', ')} $2`;

if (searchPattern.test(content)) {
  content = content.replace(searchPattern, replacement);
  
  // Write the updated content back
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Successfully added 17 Page Management tools to /get-user-id configuration!');
  console.log('🔧 Updated tools:');
  pageTools.forEach((tool, index) => {
    const toolName = tool.match(/name: '([^']+)'/)[1];
    console.log(`  ${index + 1}. ${toolName}`);
  });
  console.log('\n🚀 Ready to commit and push to Railway!');
} else {
  console.log('❌ Pattern not found. The file structure may have changed.');
  console.log('🔍 Searching for similar patterns...');
  
  // Try to find the pattern more broadly
  const broadPattern = /get_competitor_ads_analysis.*competitorPageIds.*\]/g;
  const matches = content.match(broadPattern);
  if (matches) {
    console.log('📍 Found similar patterns:');
    matches.forEach((match, index) => {
      console.log(`  ${index + 1}: ${match.substring(0, 100)}...`);
    });
  }
}
