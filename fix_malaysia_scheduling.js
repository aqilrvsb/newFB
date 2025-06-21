// Fix Malaysia Timezone Scheduling for Facebook MCP
// This script fixes the schedule_page_post function to properly handle Malaysia timezone (UTC+8)

const fs = require('fs');
const path = require('path');

console.log('🇲🇾 Fixing Malaysia Timezone Scheduling...');

// Read the page-tools.ts file
const pageToolsPath = path.join(__dirname, 'src', 'tools', 'page-tools.ts');
let content = fs.readFileSync(pageToolsPath, 'utf8');

// Find and replace the schedule_page_post function to handle Malaysia timezone properly
const schedulePostFix = `
  // Schedule a post for future publishing with Malaysia timezone support
  if (toolName === 'schedule_page_post') {
    const { pageId, message, scheduledTime, link } = args;
    
    if (!pageId || !message || !scheduledTime) {
      return {
        success: false,
        message: 'Missing required parameters: pageId, message, and scheduledTime are required'
      };
    }

    try {
      // Handle Malaysia timezone (UTC+8) scheduling
      let timestamp;
      
      // If scheduledTime is a string (ISO format), convert to timestamp
      if (typeof scheduledTime === 'string') {
        // Check if it's already a Unix timestamp
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

      // Prepare the post data
      const postData: any = {
        message,
        published: false,
        scheduled_publish_time: timestamp
      };

      if (link) {
        postData.link = link;
      }

      console.log(\`🇲🇾 Scheduling post for Malaysia timezone - Timestamp: \${timestamp}, Date: \${new Date(timestamp * 1000).toISOString()}\`);

      // Make the API call to schedule the post
      const response = await fetch(\`https://graph.facebook.com/v23.0/\${pageId}/feed\`, {
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
          message: \`Error scheduling post: \${result.error.message}\`,
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
        message: \`Error scheduling post: \${error.message}\`
      };
    }
  }`;

// Check if the function already exists and replace it, or add it
const schedulePostRegex = /if \(toolName === 'schedule_page_post'\) \{[\s\S]*?\n  \}/;

if (schedulePostRegex.test(content)) {
  content = content.replace(schedulePostRegex, schedulePostFix.trim());
  console.log('✅ Updated existing schedule_page_post function');
} else {
  // Add before the last closing brace of the function
  const insertPoint = content.lastIndexOf('  return {');
  if (insertPoint !== -1) {
    content = content.slice(0, insertPoint) + schedulePostFix + '\n\n' + content.slice(insertPoint);
    console.log('✅ Added new schedule_page_post function');
  } else {
    console.log('❌ Could not find insertion point for schedule_page_post function');
  }
}

// Write the updated content back
fs.writeFileSync(pageToolsPath, content, 'utf8');

console.log('🇲🇾 Malaysia timezone scheduling fix applied!');
console.log('📝 Features added:');
console.log('  • Proper Malaysia UTC+8 timezone handling');
console.log('  • Unix timestamp and ISO string support');
console.log('  • 10-minute minimum future validation');
console.log('  • 6-month maximum future validation');
console.log('  • Malaysia local time display in response');
