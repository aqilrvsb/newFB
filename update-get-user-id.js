const fs = require('fs');
const path = require('path');

// Read the http-server.ts file
const filePath = path.join(__dirname, 'src', 'http-server.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Find the tools list in the get-user-id HTML section
// The pattern to find where generate_campaign_prompt ends
const pattern = /\{ name: 'generate_campaign_prompt'[^}]+\} \]/;

// New tools to add after generate_campaign_prompt
const newToolsString = `, 
              { name: 'post_to_facebook', description: 'Create a new Facebook post with a message', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, message: { type: 'string' }, link: { type: 'string' }, published: { type: 'boolean', default: true } }, required: ['pageId', 'message'] } },
              { name: 'reply_to_comment', description: 'Reply to a specific comment on a post', inputSchema: { type: 'object', properties: { commentId: { type: 'string' }, message: { type: 'string' } }, required: ['commentId', 'message'] } },
              { name: 'get_page_posts', description: 'Retrieve recent posts from the Page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, limit: { type: 'number', default: 25 } }, required: ['pageId'] } },
              { name: 'get_post_comments', description: 'Fetch comments on a given post', inputSchema: { type: 'object', properties: { postId: { type: 'string' }, limit: { type: 'number', default: 25 } }, required: ['postId'] } },
              { name: 'delete_post', description: 'Delete a specific post by ID', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } },
              { name: 'delete_comment', description: 'Delete a specific comment by ID', inputSchema: { type: 'object', properties: { commentId: { type: 'string' } }, required: ['commentId'] } },
              { name: 'filter_negative_comments', description: 'Filter out comments with negative sentiment keywords', inputSchema: { type: 'object', properties: { postId: { type: 'string' }, keywords: { type: 'array', items: { type: 'string' } } }, required: ['postId'] } },
              { name: 'get_post_metrics', description: 'Get comprehensive metrics for a post', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } },
              { name: 'post_image_to_facebook', description: 'Post an image with a caption to the Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, imageUrl: { type: 'string' }, caption: { type: 'string' } }, required: ['pageId', 'imageUrl'] } },
              { name: 'update_post', description: 'Updates an existing post message', inputSchema: { type: 'object', properties: { postId: { type: 'string' }, message: { type: 'string' } }, required: ['postId', 'message'] } },
              { name: 'schedule_post', description: 'Schedule a post for future publication', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, message: { type: 'string' }, scheduledTime: { type: 'number' }, link: { type: 'string' } }, required: ['pageId', 'message', 'scheduledTime'] } },
              { name: 'get_page_fan_count', description: 'Retrieve the total number of Page fans', inputSchema: { type: 'object', properties: { pageId: { type: 'string' } }, required: ['pageId'] } },
              { name: 'get_post_top_commenters', description: 'Get the top commenters on a post', inputSchema: { type: 'object', properties: { postId: { type: 'string' }, limit: { type: 'number', default: 10 } }, required: ['postId'] } },
              { name: 'get_meta_platform_id', description: 'Returns platform ID given one or many brand names', inputSchema: { type: 'object', properties: { brandNames: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] } }, required: ['brandNames'] } },
              { name: 'get_meta_ads', description: 'Retrieves ads for a specific page', inputSchema: { type: 'object', properties: { platformId: { type: 'string' }, adType: { type: 'string' }, adActiveStatus: { type: 'string' }, limit: { type: 'number', default: 25 } }, required: ['platformId'] } },
              { name: 'search_ads_library', description: 'Search ads across multiple advertisers', inputSchema: { type: 'object', properties: { searchQuery: { type: 'string' }, countries: { type: 'array', items: { type: 'string' } }, limit: { type: 'number', default: 25 } }, required: ['searchQuery'] } },
              { name: 'get_competitor_ads_analysis', description: 'Analyze competitor ads and spending', inputSchema: { type: 'object', properties: { competitorPageIds: { type: 'array', items: { type: 'string' } }, dateRange: { type: 'number', default: 30 } }, required: ['competitorPageIds'] } } ]`;

// Replace the closing bracket after generate_campaign_prompt with our new tools
content = content.replace(pattern, (match) => {
  // Remove the closing bracket and add new tools
  return match.replace(' ]', newToolsString);
});

// Also update the message about number of tools available
content = content.replace('you now have 11 tools available!', 'you now have 45 tools available!');
content = content.replace('you now have 24 tools available!', 'you now have 45 tools available!');
content = content.replace('you now have 26 tools available!', 'you now have 45 tools available!');

// Write the updated content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Updated get-user-id endpoint to show all 45 tools!');
console.log('✅ Fixed tool count message');
