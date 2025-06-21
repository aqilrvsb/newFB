// Script to add missing tools to the /get-user-id tools list
import { readFileSync, writeFileSync } from 'fs';

console.log('🔧 Adding missing tools to /get-user-id endpoint...');

const httpServerPath = 'src/http-server.ts';
let content = readFileSync(httpServerPath, 'utf8');

// Find the tools array in the compressed JSON and add missing tools
const missingTools = [
  {
    name: 'send_dm_to_user',
    description: 'Send a direct message to a user',
    inputSchema: {
      type: 'object',
      properties: {
        recipientId: { type: 'string', description: 'User ID to send message to' },
        message: { type: 'string', description: 'Message content' }
      },
      required: ['recipientId', 'message']
    }
  },
  {
    name: 'reply_to_comment',
    description: 'Reply to a specific comment on a post',
    inputSchema: {
      type: 'object', 
      properties: {
        commentId: { type: 'string', description: 'Comment ID to reply to' },
        message: { type: 'string', description: 'Reply message' }
      },
      required: ['commentId', 'message']
    }
  },
  {
    name: 'get_post_comments',
    description: 'Fetch comments on a given post',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Post ID' },
        limit: { type: 'number', default: 25 }
      },
      required: ['postId']
    }
  },
  {
    name: 'delete_comment',
    description: 'Delete a specific comment by ID',
    inputSchema: {
      type: 'object',
      properties: {
        commentId: { type: 'string', description: 'Comment ID to delete' }
      },
      required: ['commentId']
    }
  },
  {
    name: 'delete_comment_from_post',
    description: 'Alias for deleting a comment from a specific post',
    inputSchema: {
      type: 'object',
      properties: {
        commentId: { type: 'string', description: 'Comment ID to delete' }
      },
      required: ['commentId']
    }
  },
  {
    name: 'filter_negative_comments',
    description: 'Filter out comments with negative sentiment keywords',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Post ID' },
        keywords: { type: 'array', items: { type: 'string' }, description: 'Custom keywords to filter' }
      },
      required: ['postId']
    }
  },
  {
    name: 'get_number_of_comments',
    description: 'Count the number of comments on a post',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Post ID' }
      },
      required: ['postId']
    }
  },
  {
    name: 'get_number_of_likes',
    description: 'Count the number of likes on a post',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Post ID' }
      },
      required: ['postId']
    }
  },
  {
    name: 'get_post_impressions',
    description: 'Get total impressions on a post',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Post ID' }
      },
      required: ['postId']
    }
  },
  {
    name: 'get_post_impressions_unique',
    description: 'Get number of unique users who saw the post',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Post ID' }
      },
      required: ['postId']
    }
  },
  {
    name: 'get_post_impressions_paid',
    description: 'Get number of paid impressions on the post',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Post ID' }
      },
      required: ['postId']
    }
  },
  {
    name: 'get_post_impressions_organic',
    description: 'Get number of organic impressions on the post',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Post ID' }
      },
      required: ['postId']
    }
  },
  {
    name: 'get_post_engaged_users',
    description: 'Get number of users who engaged with the post',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Post ID' }
      },
      required: ['postId']
    }
  },
  {
    name: 'get_post_clicks',
    description: 'Get number of clicks on the post',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Post ID' }
      },
      required: ['postId']
    }
  },
  {
    name: 'get_post_reactions_like_total',
    description: 'Get total number of Like reactions',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Post ID' }
      },
      required: ['postId']
    }
  },
  {
    name: 'get_post_top_commenters',
    description: 'Get the top commenters on a post',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Post ID' },
        limit: { type: 'number', default: 10 }
      },
      required: ['postId']
    }
  },
  {
    name: 'post_image_to_facebook',
    description: 'Post an image with a caption to the Facebook page',
    inputSchema: {
      type: 'object',
      properties: {
        pageId: { type: 'string', description: 'Page ID' },
        imageUrl: { type: 'string', description: 'Image URL' },
        caption: { type: 'string', description: 'Image caption' }
      },
      required: ['pageId', 'imageUrl']
    }
  },
  {
    name: 'get_post_share_count',
    description: 'Get the number of shares on a post',
    inputSchema: {
      type: 'object',
      properties: {
        postId: { type: 'string', description: 'Post ID' }
      },
      required: ['postId']
    }
  }
];

console.log(`✅ Script prepared to add ${missingTools.length} missing tools`);
console.log('📋 Missing tools:', missingTools.map(t => t.name).join(', '));
console.log('⚠️  Note: The tools list in /get-user-id is compressed in a single line.');
console.log('🔧 Manual addition to the compressed tools array in http-server.ts is required.');
console.log('🚀 All missing functions have been added to page-tools.ts and http-server.ts switch statement');
