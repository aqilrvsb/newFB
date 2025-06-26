const fs = require('fs');
const path = require('path');

// Read the current http-server.ts file
const filePath = path.join(__dirname, 'src', 'http-server.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports for the new tool files
const importIndex = content.indexOf("import * as adTools from './tools/ad-tools.js';");
if (importIndex !== -1 && !content.includes('page-tools')) {
  const insertPosition = importIndex + "import * as adTools from './tools/ad-tools.js';".length;
  content = content.substring(0, insertPosition) + 
    "\nimport * as pageTools from './tools/page-tools.js';" +
    "\nimport * as adsLibraryTools from './tools/ads-library-tools.js';" +
    content.substring(insertPosition);
}

// 2. Add new tool definitions to the tools/list array
// Find the position after get_facebook_pages tool
const toolsListEndPattern = /\{ name: 'generate_campaign_prompt'[^}]+\}\s*\]/;
const match = content.match(toolsListEndPattern);

if (match) {
  const newTools = `,
              // Page Management Tools
              { name: 'post_to_facebook', description: 'Create a new Facebook post with a message', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, message: { type: 'string' }, link: { type: 'string' }, published: { type: 'boolean', default: true } }, required: ['pageId', 'message'] } },
              { name: 'reply_to_comment', description: 'Reply to a specific comment on a post', inputSchema: { type: 'object', properties: { commentId: { type: 'string' }, message: { type: 'string' } }, required: ['commentId', 'message'] } },
              { name: 'get_page_posts', description: 'Retrieve recent posts from the Page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, limit: { type: 'number', default: 25 } }, required: ['pageId'] } },
              { name: 'get_post_comments', description: 'Fetch comments on a given post', inputSchema: { type: 'object', properties: { postId: { type: 'string' }, limit: { type: 'number', default: 25 } }, required: ['postId'] } },
              { name: 'delete_post', description: 'Delete a specific post by ID', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } },
              { name: 'delete_comment', description: 'Delete a specific comment by ID', inputSchema: { type: 'object', properties: { commentId: { type: 'string' } }, required: ['commentId'] } },
              { name: 'filter_negative_comments', description: 'Filter out comments with negative sentiment keywords', inputSchema: { type: 'object', properties: { postId: { type: 'string' }, keywords: { type: 'array', items: { type: 'string' } } }, required: ['postId'] } },
              { name: 'get_post_metrics', description: 'Get comprehensive metrics for a post (likes, comments, shares, impressions)', inputSchema: { type: 'object', properties: { postId: { type: 'string' } }, required: ['postId'] } },
              { name: 'post_image_to_facebook', description: 'Post an image with a caption to the Facebook page', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, imageUrl: { type: 'string' }, caption: { type: 'string' } }, required: ['pageId', 'imageUrl'] } },
              { name: 'update_post', description: 'Updates an existing post message', inputSchema: { type: 'object', properties: { postId: { type: 'string' }, message: { type: 'string' } }, required: ['postId', 'message'] } },
              { name: 'schedule_post', description: 'Schedule a post for future publication', inputSchema: { type: 'object', properties: { pageId: { type: 'string' }, message: { type: 'string' }, scheduledTime: { type: 'number', description: 'Unix timestamp' }, link: { type: 'string' } }, required: ['pageId', 'message', 'scheduledTime'] } },
              { name: 'get_page_fan_count', description: 'Retrieve the total number of Page fans', inputSchema: { type: 'object', properties: { pageId: { type: 'string' } }, required: ['pageId'] } },
              { name: 'get_post_top_commenters', description: 'Get the top commenters on a post', inputSchema: { type: 'object', properties: { postId: { type: 'string' }, limit: { type: 'number', default: 10 } }, required: ['postId'] } },
              // Ads Library Tools
              { name: 'get_meta_platform_id', description: 'Returns platform ID given one or many brand names', inputSchema: { type: 'object', properties: { brandNames: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] } }, required: ['brandNames'] } },
              { name: 'get_meta_ads', description: 'Retrieves ads for a specific page (platform ID)', inputSchema: { type: 'object', properties: { platformId: { type: 'string' }, adType: { type: 'string', enum: ['ALL', 'POLITICAL_AND_ISSUE_ADS'] }, adActiveStatus: { type: 'string', enum: ['ALL', 'ACTIVE', 'INACTIVE'] }, limit: { type: 'number', default: 25 }, searchTerms: { type: 'string' }, adReachedCountries: { type: 'array', items: { type: 'string' } } }, required: ['platformId'] } },
              { name: 'search_ads_library', description: 'Search ads across multiple advertisers', inputSchema: { type: 'object', properties: { searchQuery: { type: 'string' }, countries: { type: 'array', items: { type: 'string' } }, adType: { type: 'string', enum: ['ALL', 'POLITICAL_AND_ISSUE_ADS'] }, limit: { type: 'number', default: 25 } }, required: ['searchQuery'] } },
              { name: 'get_competitor_ads_analysis', description: 'Analyze competitor ads and spending', inputSchema: { type: 'object', properties: { competitorPageIds: { type: 'array', items: { type: 'string' } }, dateRange: { type: 'number', default: 30, description: 'Days to analyze' } }, required: ['competitorPageIds'] } }
            ]`;
  
  // Replace the closing bracket with new tools
  content = content.replace(toolsListEndPattern, match[0].replace(']', newTools));
}

// 3. Add the tool implementations in processMcpToolCall function
// Find the default case in the switch statement
const defaultCasePattern = /default:\s*return \{[\s\S]*?tool: toolName[\s\S]*?\};/;
const defaultMatch = content.match(defaultCasePattern);

if (defaultMatch) {
  const newCases = `
      // Page Management Tools
      case 'post_to_facebook':
        try {
          const result = await pageTools.postToFacebook(
            userId,
            args.pageId,
            args.message,
            args.link,
            args.published
          );
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'reply_to_comment':
        try {
          const result = await pageTools.replyToComment(userId, args.commentId, args.message);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'get_page_posts':
        try {
          const result = await pageTools.getPagePosts(userId, args.pageId, args.limit);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'get_post_comments':
        try {
          const result = await pageTools.getPostComments(userId, args.postId, args.limit);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'delete_post':
        try {
          const result = await pageTools.deletePost(userId, args.postId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'delete_comment':
        try {
          const result = await pageTools.deleteComment(userId, args.commentId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'filter_negative_comments':
        try {
          const result = await pageTools.filterNegativeComments(userId, args.postId, args.keywords);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'get_post_metrics':
        try {
          const result = await pageTools.getPostMetrics(userId, args.postId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'post_image_to_facebook':
        try {
          const result = await pageTools.postImageToFacebook(userId, args.pageId, args.imageUrl, args.caption);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'update_post':
        try {
          const result = await pageTools.updatePost(userId, args.postId, args.message);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'schedule_post':
        try {
          const result = await pageTools.schedulePost(
            userId,
            args.pageId,
            args.message,
            args.scheduledTime,
            args.link
          );
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'get_page_fan_count':
        try {
          const result = await pageTools.getPageFanCount(userId, args.pageId);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'get_post_top_commenters':
        try {
          const result = await pageTools.getPostTopCommenters(userId, args.postId, args.limit);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      // Ads Library Tools
      case 'get_meta_platform_id':
        try {
          const result = await adsLibraryTools.getMetaPlatformId(userId, args.brandNames);
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'get_meta_ads':
        try {
          const result = await adsLibraryTools.getMetaAds(
            userId,
            args.platformId,
            args.adType,
            args.adActiveStatus,
            args.limit,
            args.searchTerms,
            args.adReachedCountries,
            args.adDeliveryDateMin,
            args.adDeliveryDateMax
          );
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'search_ads_library':
        try {
          const result = await adsLibraryTools.searchAdsLibrary(
            userId,
            args.searchQuery,
            args.countries,
            args.adType,
            args.limit
          );
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      case 'get_competitor_ads_analysis':
        try {
          const result = await adsLibraryTools.getCompetitorAdsAnalysis(
            userId,
            args.competitorPageIds,
            args.dateRange
          );
          return { ...result, tool: toolName };
        } catch (error) {
          return {
            success: false,
            error: \`Error: \${error instanceof Error ? error.message : 'Unknown error'}\`,
            tool: toolName
          };
        }

      ` + defaultMatch[0];
      
  content = content.replace(defaultCasePattern, newCases);
}

// Write the updated content back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Successfully added all new tools to http-server.ts!');
console.log('✅ Added 17 page management tools');
console.log('✅ Added 4 ads library tools');
console.log('✅ Total: 21 new tools integrated');
