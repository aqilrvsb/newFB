// Simple Fix: Update the schedulePost function first
const fs = require('fs');
const path = require('path');

console.log('🔧 SIMPLE FIX: Updating schedulePost function...');

const pageToolsPath = path.join(__dirname, 'src', 'tools', 'page-tools.ts');
let content = fs.readFileSync(pageToolsPath, 'utf8');

// Find the existing schedulePost function and replace it
const startPattern = 'export const schedulePost = async (';
const endPattern = '};';

const startIndex = content.indexOf(startPattern);
if (startIndex === -1) {
  console.log('❌ Could not find schedulePost function');
  process.exit(1);
}

// Find the matching closing brace
let braceCount = 0;
let endIndex = startIndex;
let inFunction = false;

for (let i = startIndex; i < content.length; i++) {
  const char = content[i];
  
  if (char === '{') {
    braceCount++;
    inFunction = true;
  } else if (char === '}') {
    braceCount--;
    if (inFunction && braceCount === 0) {
      // Look for the semicolon after the closing brace
      let j = i + 1;
      while (j < content.length && content[j].match(/\s/)) {
        j++;
      }
      if (content[j] === ';') {
        endIndex = j + 1;
        break;
      }
    }
  }
}

if (endIndex === startIndex) {
  console.log('❌ Could not find end of schedulePost function');
  process.exit(1);
}

console.log(`📍 Found schedulePost function from position ${startIndex} to ${endIndex}`);

// Create the new function
const newSchedulePost = `export const schedulePost = async (
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

// Replace the function
const newContent = content.slice(0, startIndex) + newSchedulePost + content.slice(endIndex);

// Write the updated content
fs.writeFileSync(pageToolsPath, newContent, 'utf8');

console.log('✅ Successfully updated schedulePost function!');
console.log('🇲🇾 Malaysia timezone scheduling support added');
