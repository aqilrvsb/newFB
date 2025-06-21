// Emergency Fix: Remove incorrectly placed code and fix TypeScript errors
const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY FIX: Removing incorrectly placed code...');

const pageToolsPath = path.join(__dirname, 'src', 'tools', 'page-tools.ts');
let content = fs.readFileSync(pageToolsPath, 'utf8');

// Remove the incorrectly added code that's causing TypeScript errors
// This code was added in the wrong place and broke the function structure

// First, let's remove the malformed sections
const problematicSections = [
  // Remove the wrongly placed schedule_page_post section
  /\s*\/\/ Schedule a post for future publishing with Malaysia timezone support[\s\S]*?}\s*\}/,
  // Remove the wrongly placed get_scheduled_posts section  
  /\s*\/\/ Get all scheduled posts for a page[\s\S]*?}\s*\}/
];

let originalLength = content.length;

problematicSections.forEach((regex, index) => {
  const beforeLength = content.length;
  content = content.replace(regex, '');
  const afterLength = content.length;
  if (beforeLength !== afterLength) {
    console.log(`✅ Removed problematic section ${index + 1} (${beforeLength - afterLength} characters)`);
  }
});

// Also clean up any trailing issues
content = content.replace(/\s*}\s*catch \(error\) \{\s*\/\/ Schedule a post[\s\S]*$/, `
  } catch (error) {
    return {
      success: false,
      message: \`Error getting top commenters: \${error instanceof Error ? error.message : 'Unknown error'}\`
    };
  }
};`);

// Ensure the file ends properly
if (!content.trim().endsWith('};')) {
  content = content.trim();
  if (!content.endsWith('}')) {
    content += '\n  }\n';
  }
  if (!content.endsWith('};')) {
    content += ';';
  }
}

console.log(`📝 Content reduced from ${originalLength} to ${content.length} characters`);

// Write the cleaned content back
fs.writeFileSync(pageToolsPath, content, 'utf8');

console.log('✅ Emergency fix applied - TypeScript errors should be resolved');
console.log('🔧 Next step: Add the scheduling functions properly to the correct tool call handler');
